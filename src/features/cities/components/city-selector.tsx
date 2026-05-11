"use client";

import { useOptimistic, useTransition } from "react";

import { useRouter } from "next/navigation";

import { setSelectedCity } from "@/features/cities/actions/set-selected-city";

interface City {
  id: string;
  name: string;
}

interface CitySelectorProps {
  cities: City[];
  selectedCityId: string | null;
}

export default function CitySelector({
  cities,
  selectedCityId,
}: CitySelectorProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [optimisticValue, setOptimisticValue] = useOptimistic(
    selectedCityId || "",
  );

  function handleChange(cityId: string) {
    startTransition(async () => {
      setOptimisticValue(cityId);

      await setSelectedCity(cityId);

      router.refresh();
    });
  }

  return (
    <select
      value={optimisticValue}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="h-11 rounded-2xl border bg-white px-4 text-sm font-medium shadow-sm outline-none transition focus:ring-2 focus:ring-black"
    >
      <option value="">Select City</option>

      {cities.map((city) => (
        <option key={city.id} value={city.id}>
          {city.name}
        </option>
      ))}
    </select>
  );
}
