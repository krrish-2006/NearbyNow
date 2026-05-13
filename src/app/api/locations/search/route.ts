import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/features/auth/services/user.service";

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
};

export async function GET(request: Request) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "seller") {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 3) {
    return NextResponse.json({
      results: [],
    });
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", `${query}, India`);
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("addressdetails", "1");
  nominatimUrl.searchParams.set("limit", "5");
  nominatimUrl.searchParams.set("countrycodes", "in");

  const response = await fetch(nominatimUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NearbyNow/1.0 (https://www.nearbynow.store)",
      Referer: "https://www.nearbynow.store",
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Location search failed",
      },
      {
        status: 502,
      },
    );
  }

  const results = (await response.json()) as NominatimResult[];

  return NextResponse.json({
    results: results
      .map((result) => ({
        placeId: result.place_id ? String(result.place_id) : null,
        name: result.name ?? result.display_name ?? "Location",
        displayName: result.display_name ?? "",
        latitude: Number(result.lat),
        longitude: Number(result.lon),
      }))
      .filter(
        (result) =>
          result.displayName &&
          Number.isFinite(result.latitude) &&
          Number.isFinite(result.longitude),
      ),
  });
}
