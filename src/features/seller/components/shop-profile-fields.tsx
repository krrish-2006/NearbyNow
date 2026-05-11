"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateShopCityAction } from "@/features/seller/actions/update-shop-city.action";
import { updateShopNameAction } from "@/features/seller/actions/update-shop-name.action";
import type { City } from "@/repositories/city.repository";

type ShopProfileFieldsProps = {
  cities: City[];
  initialCityId: string | null;
  initialShopName: string | null;
};

export function ShopProfileFields({
  cities,
  initialCityId,
  initialShopName,
}: ShopProfileFieldsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialCity = cities.find((city) => city.id === initialCityId) ?? null;

  const [savedShopName, setSavedShopName] = useState(initialShopName ?? "");
  const [shopName, setShopName] = useState(initialShopName ?? "");
  const [isEditingShopName, setIsEditingShopName] = useState(
    !initialShopName,
  );

  const [savedCity, setSavedCity] = useState(initialCity);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [citySearch, setCitySearch] = useState(initialCity?.name ?? "");
  const [isEditingCity, setIsEditingCity] = useState(!initialCity);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(!initialCity);

  const filteredCities = useMemo(() => {
    const search = citySearch.trim().toLowerCase();

    if (!search) {
      return cities.slice(0, 20);
    }

    return cities
      .filter((city) => city.name.toLowerCase().includes(search))
      .slice(0, 20);
  }, [cities, citySearch]);

  function cancelShopNameEdit() {
    setShopName(savedShopName);
    setIsEditingShopName(false);
  }

  function saveShopName() {
    const nextShopName = shopName.trim();

    if (nextShopName.length < 2) {
      toast.error("Shop name must be at least 2 characters");
      return;
    }

    const formData = new FormData();
    formData.set("shop_name", nextShopName);

    startTransition(async () => {
      const result = await updateShopNameAction(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setSavedShopName(nextShopName);
      setShopName(nextShopName);
      setIsEditingShopName(false);
      toast.success("Shop name updated");
      router.refresh();
    });
  }

  function cancelCityEdit() {
    setSelectedCity(savedCity);
    setCitySearch(savedCity?.name ?? "");
    setIsEditingCity(!savedCity);
    setIsCityDropdownOpen(!savedCity);
  }

  function saveCity() {
    if (!selectedCity) {
      toast.error("Select a city first");
      return;
    }

    const formData = new FormData();
    formData.set("city_id", selectedCity.id);

    startTransition(async () => {
      const result = await updateShopCityAction(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setSavedCity(selectedCity);
      setCitySearch(selectedCity.name);
      setIsEditingCity(false);
      setIsCityDropdownOpen(false);
      toast.success("City updated");
      router.refresh();
    });
  }

  function selectCity(city: City) {
    setSelectedCity(city);
    setCitySearch(city.name);
    setIsCityDropdownOpen(false);
  }

  return (
    <div className="space-y-6 border-t pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="w-28 shrink-0 text-sm font-semibold">
          Shop Name :
        </label>

        <div className="min-w-0 flex-1">
          {isEditingShopName ? (
            <input
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              type="text"
              minLength={2}
              className="h-11 w-full rounded-2xl border bg-white px-4 text-sm font-medium shadow-sm outline-none transition focus:ring-2 focus:ring-black"
            />
          ) : (
            <p className="truncate text-sm font-semibold text-neutral-800">
              {savedShopName}
            </p>
          )}
        </div>

        <div className="ml-auto flex shrink-0 justify-end gap-2">
          {isEditingShopName ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={saveShopName}
                className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save
              </button>

              {savedShopName && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={cancelShopNameEdit}
                  className="h-10 rounded-xl border px-4 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingShopName(true)}
              className="h-10 rounded-xl border px-4 text-sm font-semibold transition hover:bg-neutral-100"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <label className="w-28 shrink-0 pt-3 text-sm font-semibold">
          City :
        </label>

        <div className="relative min-w-0 flex-1">
          {isEditingCity ? (
            <>
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen(true)}
                className="h-11 w-full rounded-2xl border bg-white px-4 text-left text-sm font-medium shadow-sm outline-none transition focus:ring-2 focus:ring-black"
              >
                {selectedCity?.name || "Select / type your city name"}
              </button>

              {isCityDropdownOpen && (
                <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border bg-white shadow-xl">
                  <input
                    value={citySearch}
                    onChange={(event) => {
                      setCitySearch(event.target.value);
                      setSelectedCity(null);
                    }}
                    placeholder="Select / type your city name"
                    className="h-12 w-full border-b px-4 text-sm font-medium outline-none"
                    autoFocus
                  />

                  <div className="max-h-64 overflow-y-auto py-2">
                    {filteredCities.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-neutral-500">
                        No matching city found.
                      </p>
                    ) : (
                      filteredCities.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => selectCity(city)}
                          className="block w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-neutral-100"
                        >
                          {city.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="pt-3 text-sm font-semibold text-neutral-800">
              {savedCity?.name}
            </p>
          )}
        </div>

        <div className="ml-auto flex shrink-0 justify-end gap-2 pt-0 sm:pt-0">
          {isEditingCity ? (
            <>
              <button
                type="button"
                disabled={isPending || !selectedCity}
                onClick={saveCity}
                className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save
              </button>

              {(savedCity || selectedCity) && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={cancelCityEdit}
                  className="h-10 rounded-xl border px-4 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditingCity(true);
                setIsCityDropdownOpen(true);
                setCitySearch("");
              }}
              className="h-10 rounded-xl border px-4 text-sm font-semibold transition hover:bg-neutral-100"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
