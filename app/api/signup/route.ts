import { NextResponse } from "next/server";
import { saveBuyerProfile } from "@/lib/server/local-db";
import type { BuyerProfile } from "@/lib/types";

function cleanList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

export async function POST(request: Request) {
  const body = await request.json();

  const profile: BuyerProfile = {
    name: String(body.name ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    address: String(body.address ?? "").trim(),
    neighborhood: String(body.neighborhood ?? "Tracy").trim(),
    radius: Number(body.radius ?? 8),
    diets: cleanList(body.diets),
    allergies: cleanList(body.allergies),
    cuisines: cleanList(body.cuisines),
    pickupTarget: String(body.pickupTarget ?? "Tonight 6-8 PM").trim(),
    fulfillment: body.fulfillment === "pickup" || body.fulfillment === "delivery" ? body.fulfillment : "either",
    whatsappConsent: Boolean(body.whatsappConsent),
    consentNote: "Buyer opted in to receive LocalPlate/Foodie WhatsApp messages, source proof, and seller handoff notes."
  };

  if (!profile.name) profile.name = "LocalPlate member";

  if (!profile.phone || !profile.address) {
    return NextResponse.json({ error: "WhatsApp number and address are required." }, { status: 400 });
  }

  if (!profile.whatsappConsent) {
    return NextResponse.json({ error: "WhatsApp consent is required before creating the Foodie signup." }, { status: 400 });
  }

  if (!profile.diets.length) profile.diets = ["veg"];
  if (!profile.cuisines.length) profile.cuisines = ["Gujarati", "South Indian"];

  const saved = await saveBuyerProfile(profile);
  const signupMessage = [
    "Hi Foodie, sign me up for LocalPlate.",
    "Token " + saved.profile.token + ".",
    "I am " + saved.profile.name + " in " + saved.profile.neighborhood + ".",
    "Diet: " + saved.profile.diets.join("/") + ".",
    "Allergies: " + (saved.profile.allergies.join("/") || "none") + ".",
    "Find homemade food near me."
  ].join(" ");

  return NextResponse.json({
    profile: saved.profile,
    user: saved.user,
    conversation: saved.conversation,
    whatsappHref: "https://wa.me/918097244384?text=" + encodeURIComponent(signupMessage),
    signupMessage
  });
}
