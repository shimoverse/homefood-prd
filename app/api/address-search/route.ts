import { NextResponse } from "next/server";

type Suggestion = {
  id: string;
  label: string;
  value: string;
  city: string;
  lat: string;
  lon: string;
  source: "census" | "photon";
  detail: string;
};

type CensusMatch = {
  matchedAddress?: string;
  coordinates?: {
    x?: number;
    y?: number;
  };
};

type PhotonFeature = {
  properties?: {
    osm_id?: number;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
};

const PILOT_CITIES = ["Tracy", "Mountain House", "Lathrop", "Manteca", "Dublin"];
const PILOT_BOUNDS = {
  north: 38.12,
  south: 37.28,
  west: -122.35,
  east: -120.65
};
const STREET_SUFFIX = /\b(avenue|ave|boulevard|blvd|circle|cir|court|ct|drive|dr|lane|ln|parkway|pkwy|place|pl|road|rd|street|st|terrace|ter|trail|trl|way)\b/i;

function compact(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ");
}

function inPilotRegion(lat: number, lon: number) {
  return lat >= PILOT_BOUNDS.south && lat <= PILOT_BOUNDS.north && lon >= PILOT_BOUNDS.west && lon <= PILOT_BOUNDS.east;
}

function hasPilotCity(query: string) {
  return PILOT_CITIES.some((city) => new RegExp("\\b" + city.replace(" ", "\\s+") + "\\b", "i").test(query));
}

function censusQueries(query: string) {
  const variants = new Set([query]);
  if (!hasPilotCity(query)) {
    PILOT_CITIES.forEach((city) => variants.add(query + " " + city + " CA"));
  }
  return [...variants];
}

function fromCensus(match: CensusMatch): Suggestion | null {
  const label = match.matchedAddress?.replace(/, UNITED STATES$/i, "").trim();
  const lat = match.coordinates?.y;
  const lon = match.coordinates?.x;

  if (!label || !Number.isFinite(lat) || !Number.isFinite(lon) || !inPilotRegion(lat as number, lon as number)) {
    return null;
  }

  const city = label.split(",")[1]?.trim() ?? "";
  return {
    id: "census-" + label,
    label,
    value: label,
    city,
    lat: String(lat),
    lon: String(lon),
    source: "census",
    detail: "US Census verified address"
  };
}

function fromPhoton(feature: PhotonFeature): Suggestion | null {
  const props = feature.properties ?? {};
  const [lon, lat] = feature.geometry?.coordinates ?? [];

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inPilotRegion(lat as number, lon as number)) {
    return null;
  }

  const roadName = props.street || (props.name && STREET_SUFFIX.test(props.name) ? props.name : "");
  const street = compact([props.housenumber, roadName]);
  const city = props.city ?? "";
  const label = compact([street, city || props.county, props.state, props.postcode]);

  if (!street || !label || props.country !== "United States") return null;

  return {
    id: "photon-" + String(props.osm_id ?? label),
    label,
    value: label,
    city,
    lat: String(lat),
    lon: String(lon),
    source: "photon",
    detail: props.housenumber ? "OpenStreetMap address" : "Street suggestion"
  };
}

async function searchCensus(query: string) {
  if (!/\d/.test(query) || query.length < 5) return [];

  const results = await Promise.all(censusQueries(query).map(async (variant) => {
    const url = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
    url.searchParams.set("address", variant);
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("format", "json");

    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return [];

    const payload = await response.json() as { result?: { addressMatches?: CensusMatch[] } };
    return payload.result?.addressMatches?.map(fromCensus).filter(Boolean) ?? [];
  }));

  return results.flat() as Suggestion[];
}

async function searchPhoton(query: string) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", hasPilotCity(query) ? query : query + " Tracy CA");
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", "37.7397");
  url.searchParams.set("lon", "-121.4252");

  const response = await fetch(url, {
    headers: { "Accept-Language": "en-US,en;q=0.9" },
    next: { revalidate: 86400 }
  });
  if (!response.ok) return [];

  const payload = await response.json() as { features?: PhotonFeature[] };
  const queryHasSuffix = STREET_SUFFIX.test(query);
  const suggestions = payload.features?.map(fromPhoton).filter(Boolean) as Suggestion[] ?? [];
  if (!queryHasSuffix) return suggestions;

  return suggestions.filter((suggestion) => {
    const normalized = suggestion.label.toLowerCase();
    if (/\bpkwy\b/i.test(query)) return normalized.includes("parkway") || normalized.includes("pkwy");
    if (/\bln\b/i.test(query)) return normalized.includes("lane") || normalized.includes(" ln");
    if (/\bdr\b/i.test(query)) return normalized.includes("drive") || normalized.includes(" dr");
    if (/\brd\b/i.test(query)) return normalized.includes("road") || normalized.includes(" rd");
    if (/\bst\b/i.test(query)) return normalized.includes("street") || normalized.includes(" st");
    if (/\bave\b/i.test(query)) return normalized.includes("avenue") || normalized.includes(" ave");
    return true;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().replace(/\s+/g, " ") ?? "";

  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const [census, photon] = await Promise.all([searchCensus(query), searchPhoton(query)]);
    const seen = new Set<string>();
    const suggestions = [...census, ...photon].filter((suggestion) => {
      const key = suggestion.value.toLowerCase();
      if (!suggestion.label || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 7);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
