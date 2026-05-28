import { NextResponse } from "next/server";

type NominatimPlace = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
};

function compact(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ");
}

function toSuggestion(place: NominatimPlace) {
  const address = place.address ?? {};
  const street = compact([address.house_number, address.road]);
  const city = address.city ?? address.town ?? address.village;
  const label = compact([street || place.display_name?.split(",")[0], city ?? address.county, address.state, address.postcode]);

  return {
    id: String(place.place_id ?? label),
    label,
    value: label,
    city: city ?? "",
    lat: place.lat ?? "",
    lon: place.lon ?? ""
  };
}

function isInPilotRegion(place: NominatimPlace) {
  const lat = Number(place.lat);
  const lon = Number(place.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= 37.28 && lat <= 38.12 && lon >= -122.35 && lon <= -120.65;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("viewbox", "-122.35,38.12,-120.65,37.28");
  url.searchParams.set("bounded", "0");

  try {
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "LocalPlate address autocomplete / localplate.vercel.app"
      },
      next: { revalidate: 86400 }
    });

    if (!response.ok) {
      throw new Error("Address search failed");
    }

    const places = (await response.json()) as NominatimPlace[];
    const seen = new Set<string>();
    const suggestions = places.filter(isInPilotRegion).map(toSuggestion).filter((suggestion) => {
      if (!suggestion.label || seen.has(suggestion.label)) return false;
      seen.add(suggestion.label);
      return true;
    });

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
