import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/features/auth/services/user.service";
import {
  getAiCreditPack,
} from "@/features/ai-credits/lib/credit-packs";
import { createRazorpayOrder, getPublicRazorpayKeyId } from "@/lib/payments/razorpay";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createAiCreditPurchase, setPurchaseProviderOrderId } from "@/repositories/ai-credit.repository";
import { getShopBySellerId } from "@/repositories/shop.repository";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  if (profile.role !== "seller") {
    return NextResponse.json(
      {
        error: "Only sellers can buy AI credits",
      },
      {
        status: 403,
      },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    packId?: unknown;
  } | null;
  const packId = typeof body?.packId === "string" ? body.packId : "";
  const pack = getAiCreditPack(packId);

  if (!pack) {
    return NextResponse.json(
      {
        error: "Invalid AI credit pack",
      },
      {
        status: 400,
      },
    );
  }

  const publicKeyId = getPublicRazorpayKeyId();

  if (!publicKeyId) {
    return NextResponse.json(
      {
        error: "Razorpay is not configured yet",
      },
      {
        status: 503,
      },
    );
  }

  const serviceRoleSupabase = createServiceRoleClient();
  const shop = await getShopBySellerId(serviceRoleSupabase, profile.id);

  if (!shop) {
    return NextResponse.json(
      {
        error: "Seller shop not found",
      },
      {
        status: 403,
      },
    );
  }

  const purchase = await createAiCreditPurchase(serviceRoleSupabase, {
    seller_profile_id: profile.id,
    pack_id: pack.id,
    credits: pack.credits,
    amount_paise: pack.amountPaise,
    status: "created",
  });

  if (!purchase) {
    return NextResponse.json(
      {
        error: "Could not create AI credit purchase",
      },
      {
        status: 500,
      },
    );
  }

  const order = await createRazorpayOrder({
    amountPaise: pack.amountPaise,
    receipt: purchase.id.slice(0, 40),
    notes: {
      purchase_id: purchase.id,
      seller_profile_id: profile.id,
      pack_id: pack.id,
    },
  });

  if (!order) {
    return NextResponse.json(
      {
        error: "Could not create Razorpay order",
      },
      {
        status: 502,
      },
    );
  }

  const savedProviderOrder = await setPurchaseProviderOrderId(
    serviceRoleSupabase,
    purchase.id,
    order.id,
  );

  if (!savedProviderOrder) {
    return NextResponse.json(
      {
        error: "Could not save Razorpay order",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    keyId: publicKeyId,
    orderId: order.id,
    amountPaise: pack.amountPaise,
    currency: "INR",
    credits: pack.credits,
    name: "NearbyNow AI Credits",
    description: pack.label,
    sellerName: profile.full_name ?? shop.name,
    sellerEmail: profile.email,
  });
}
