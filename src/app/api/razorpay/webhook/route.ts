import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getPurchaseByProviderOrderId } from "@/repositories/ai-credit.repository";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
};

function verifyRazorpayWebhookSignature({
  body,
  signature,
  secret,
}: {
  body: string;
  signature: string | null;
  secret: string;
}): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error: "Webhook is not configured",
      },
      {
        status: 503,
      },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (
    !verifyRazorpayWebhookSignature({
      body,
      signature,
      secret: webhookSecret,
    })
  ) {
    return NextResponse.json(
      {
        error: "Invalid signature",
      },
      {
        status: 400,
      },
    );
  }

  const payload = JSON.parse(body) as RazorpayWebhookPayload;
  const eventId = request.headers.get("x-razorpay-event-id");
  const eventType = payload.event ?? "unknown";

  if (!eventId) {
    return NextResponse.json(
      {
        error: "Missing event id",
      },
      {
        status: 400,
      },
    );
  }

  const supabase = createServiceRoleClient();
  const { error: eventError } = await supabase
    .from("payment_webhook_events")
    .insert({
      id: eventId,
      event_type: eventType,
      provider: "razorpay",
    });

  if (eventError) {
    return NextResponse.json({
      received: true,
      duplicate: true,
    });
  }

  if (eventType !== "payment.captured") {
    return NextResponse.json({
      received: true,
      ignored: true,
    });
  }

  const payment = payload.payload?.payment?.entity;
  const providerPaymentId = payment?.id;
  const providerOrderId = payment?.order_id;

  if (!providerPaymentId || !providerOrderId) {
    return NextResponse.json(
      {
        error: "Missing payment details",
      },
      {
        status: 400,
      },
    );
  }

  const purchase = await getPurchaseByProviderOrderId(
    supabase,
    providerOrderId,
  );

  if (!purchase) {
    return NextResponse.json({
      received: true,
      purchaseFound: false,
    });
  }

  const { error } = await supabase.rpc(
    "grant_ai_credits_for_paid_purchase",
    {
      p_purchase_id: purchase.id,
      p_provider_payment_id: providerPaymentId,
    },
  );

  if (error) {
    return NextResponse.json(
      {
        error: "Could not grant AI credits",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    received: true,
  });
}
