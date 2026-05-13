import Image from "next/image";

import { AiCreditPurchasePanel } from "@/features/ai-credits/components/ai-credit-purchase-panel";
import { PickupLocationFields } from "@/features/seller/components/pickup-location-fields";
import { ShopProfileFields } from "@/features/seller/components/shop-profile-fields";
import { requireSeller } from "@/features/seller/utils/require-seller";
import { createClient } from "@/lib/supabase/server";
import { getCities } from "@/repositories/city.repository";
import { getPickupLocationByShopId } from "@/repositories/pickup-location.repository";
import { getShopBySellerId } from "@/repositories/shop.repository";

export default async function SellerProfilePage() {
  const profile = await requireSeller();

  const supabase = await createClient();

  const [cities, shop, creditBalanceResult] = await Promise.all([
    getCities(supabase),
    getShopBySellerId(supabase, profile.id),
    supabase.rpc("get_seller_ai_credit_balance"),
  ]);
  const creditBalance = creditBalanceResult.data ?? 0;
  const pickupLocation = shop
    ? await getPickupLocationByShopId(supabase, shop.id)
    : null;

  return (
    <div>
      <h1 className="text-3xl font-bold">Seller Profile</h1>

      <div className="mt-8 max-w-2xl space-y-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {profile.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name || "Profile"}
              width={80}
              height={80}
              className="rounded-full"
            />
          )}

          <div>
            <h2 className="text-2xl font-semibold">{profile.full_name}</h2>

            <p className="text-neutral-600">{profile.email}</p>
          </div>
        </div>

        <ShopProfileFields
          cities={cities}
          initialCityId={shop?.city_id ?? null}
          initialShopName={shop?.name ?? null}
        />

        <PickupLocationFields initialLocation={pickupLocation} />

        <AiCreditPurchasePanel balance={creditBalance} />
      </div>
    </div>
  );
}
