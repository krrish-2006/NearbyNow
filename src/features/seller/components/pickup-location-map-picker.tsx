"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";

type PickupLocationMapPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onSelect: (point: { latitude: number; longitude: number }) => void;
  onLocate: () => void;
  isLocating?: boolean;
};

const DURGAPUR_CENTER = {
  latitude: 23.5204,
  longitude: 87.3119,
};

export function PickupLocationMapPicker({
  latitude,
  longitude,
  onSelect,
  onLocate,
  isLocating = false,
}: PickupLocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.CircleMarker | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const onSelectRef = useRef(onSelect);
  const initialLatitudeRef = useRef(latitude);
  const initialLongitudeRef = useRef(longitude);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let isMounted = true;

    async function createMap() {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const leaflet = await import("leaflet");

      if (!isMounted || !mapContainerRef.current) {
        return;
      }

      leafletRef.current = leaflet;

      const initialLatitude = initialLatitudeRef.current;
      const initialLongitude = initialLongitudeRef.current;
      const center: Leaflet.LatLngExpression = [
        initialLatitude ?? DURGAPUR_CENTER.latitude,
        initialLongitude ?? DURGAPUR_CENTER.longitude,
      ];

      const map = leaflet.map(mapContainerRef.current, {
        center,
        zoom: initialLatitude && initialLongitude ? 17 : 13,
        scrollWheelZoom: true,
      });

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map);

      map.on("click", (event: Leaflet.LeafletMouseEvent) => {
        onSelectRef.current({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        });
      });

      mapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 0);
    }

    void createMap();

    return () => {
      isMounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;

    if (!map || !leaflet || latitude === null || longitude === null) {
      return;
    }

    const point: Leaflet.LatLngExpression = [latitude, longitude];

    if (!markerRef.current) {
      markerRef.current = leaflet
        .circleMarker(point, {
          radius: 9,
          color: "#000000",
          fillColor: "#0f766e",
          fillOpacity: 1,
          weight: 3,
        })
        .addTo(map);
    } else {
      markerRef.current.setLatLng(point);
    }

    map.setView(point, Math.max(map.getZoom(), 17));
  }, [latitude, longitude]);

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="flex items-center justify-between gap-3 border-b p-3">
        <p className="text-xs font-medium text-neutral-500">
          Click the map or use your device location.
        </p>

        <button
          type="button"
          onClick={onLocate}
          disabled={isLocating}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-black px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          {isLocating ? "Finding" : "Your location"}
        </button>
      </div>

      <div ref={mapContainerRef} className="h-80 w-full" />
    </div>
  );
}
