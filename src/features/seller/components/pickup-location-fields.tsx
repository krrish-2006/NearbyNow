"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updatePickupLocationAction } from "@/features/seller/actions/update-pickup-location.action";
import type { ShopPickupLocation } from "@/repositories/pickup-location.repository";

type LocationSearchResult = {
  placeId: string | null;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
};

type PickupLocationFieldsProps = {
  initialLocation: ShopPickupLocation | null;
};

function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function PickupLocationFields({
  initialLocation,
}: PickupLocationFieldsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [savedLocation, setSavedLocation] = useState(initialLocation);
  const [isEditing, setIsEditing] = useState(!initialLocation);
  const [query, setQuery] = useState(initialLocation?.address ?? "");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [selectedResult, setSelectedResult] =
    useState<LocationSearchResult | null>(
      initialLocation
        ? {
            placeId: initialLocation.osm_place_id,
            name: initialLocation.address,
            displayName:
              initialLocation.osm_display_name ?? initialLocation.address,
            latitude: Number(initialLocation.latitude),
            longitude: Number(initialLocation.longitude),
          }
        : null,
    );
  const [pickupWindow, setPickupWindow] = useState(
    initialLocation?.pickup_window ?? "",
  );
  const [pickupInstructions, setPickupInstructions] = useState(
    initialLocation?.pickup_instructions ?? "",
  );
  const [isSearching, setIsSearching] = useState(false);

  async function searchLocations() {
    const nextQuery = query.trim();

    if (nextQuery.length < 3) {
      toast.error("Type at least 3 characters");
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(nextQuery)}`,
      );

      if (!response.ok) {
        toast.error("Location search failed");
        return;
      }

      const data = (await response.json()) as {
        results: LocationSearchResult[];
      };

      setResults(data.results);

      if (data.results.length === 0) {
        toast.error("No matching locations found");
      }
    } catch {
      toast.error("Location search failed");
    } finally {
      setIsSearching(false);
    }
  }

  function selectResult(result: LocationSearchResult) {
    setSelectedResult(result);
    setQuery(result.name);
    setResults([]);
  }

  function cancelEdit() {
    setIsEditing(!savedLocation);
    setQuery(savedLocation?.address ?? "");
    setPickupWindow(savedLocation?.pickup_window ?? "");
    setPickupInstructions(savedLocation?.pickup_instructions ?? "");
    setSelectedResult(
      savedLocation
        ? {
            placeId: savedLocation.osm_place_id,
            name: savedLocation.address,
            displayName: savedLocation.osm_display_name ?? savedLocation.address,
            latitude: Number(savedLocation.latitude),
            longitude: Number(savedLocation.longitude),
          }
        : null,
    );
    setResults([]);
  }

  function saveLocation() {
    if (!selectedResult) {
      toast.error("Select a pickup location first");
      return;
    }

    const formData = new FormData();
    formData.set("address", selectedResult.name);
    formData.set("latitude", String(selectedResult.latitude));
    formData.set("longitude", String(selectedResult.longitude));
    formData.set("osm_place_id", selectedResult.placeId ?? "");
    formData.set("osm_display_name", selectedResult.displayName);
    formData.set("pickup_window", pickupWindow.trim());
    formData.set("pickup_instructions", pickupInstructions.trim());

    startTransition(async () => {
      const result = await updatePickupLocationAction(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setSavedLocation({
        shop_id: savedLocation?.shop_id ?? "",
        address: selectedResult.name,
        latitude: selectedResult.latitude,
        longitude: selectedResult.longitude,
        osm_place_id: selectedResult.placeId,
        osm_display_name: selectedResult.displayName,
        pickup_window: pickupWindow.trim() || null,
        pickup_instructions: pickupInstructions.trim() || null,
        confirmed_at: new Date().toISOString(),
        created_at: savedLocation?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setIsEditing(false);
      toast.success("Pickup location updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 border-t pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Pickup Location</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Buyers see this after you confirm their order.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="h-10 rounded-xl border px-4 text-sm font-semibold transition hover:bg-neutral-100"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedResult(null);
              }}
              placeholder="Search your shop or pickup address"
              className="h-11 flex-1 rounded-2xl border bg-white px-4 text-sm font-medium shadow-sm outline-none transition focus:ring-2 focus:ring-black"
            />

            <button
              type="button"
              disabled={isSearching}
              onClick={searchLocations}
              className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSearching ? "Searching" : "Search"}
            </button>
          </div>

          {results.length > 0 && (
            <div className="overflow-hidden rounded-2xl border bg-white">
              {results.map((result) => (
                <button
                  key={`${result.placeId}-${result.latitude}-${result.longitude}`}
                  type="button"
                  onClick={() => selectResult(result)}
                  className="block w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-neutral-100"
                >
                  <span className="block text-sm font-semibold">
                    {result.name}
                  </span>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {result.displayName}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedResult && (
            <div className="rounded-2xl border bg-neutral-50 p-4 text-sm">
              <p className="font-semibold">{selectedResult.name}</p>
              <p className="mt-1 text-neutral-500">
                {formatCoordinates(
                  selectedResult.latitude,
                  selectedResult.longitude,
                )}
              </p>
              <a
                href={`https://www.openstreetmap.org/?mlat=${selectedResult.latitude}&mlon=${selectedResult.longitude}#map=18/${selectedResult.latitude}/${selectedResult.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex font-semibold underline"
              >
                Preview on OpenStreetMap
              </a>
            </div>
          )}

          <input
            value={pickupWindow}
            onChange={(event) => setPickupWindow(event.target.value)}
            placeholder="Pickup window, e.g. 10 AM - 8 PM"
            className="h-11 w-full rounded-2xl border bg-white px-4 text-sm font-medium shadow-sm outline-none transition focus:ring-2 focus:ring-black"
          />

          <textarea
            value={pickupInstructions}
            onChange={(event) => setPickupInstructions(event.target.value)}
            placeholder="Pickup instructions, e.g. ask at billing counter"
            rows={3}
            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium shadow-sm outline-none transition focus:ring-2 focus:ring-black"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending || !selectedResult}
              onClick={saveLocation}
              className="h-10 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save
            </button>

            {(savedLocation || selectedResult) && (
              <button
                type="button"
                disabled={isPending}
                onClick={cancelEdit}
                className="h-10 rounded-xl border px-4 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-xs text-neutral-500">
            Location search uses OpenStreetMap data.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-neutral-50 p-4 text-sm">
          <p className="font-semibold">{savedLocation?.address}</p>

          {savedLocation?.pickup_window && (
            <p className="mt-2 text-neutral-600">
              Pickup window: {savedLocation.pickup_window}
            </p>
          )}

          {savedLocation?.pickup_instructions && (
            <p className="mt-2 text-neutral-600">
              Instructions: {savedLocation.pickup_instructions}
            </p>
          )}

          {savedLocation && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${savedLocation.latitude}&mlon=${savedLocation.longitude}#map=18/${savedLocation.latitude}/${savedLocation.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex font-semibold underline"
            >
              Open map
            </a>
          )}
        </div>
      )}
    </div>
  );
}
