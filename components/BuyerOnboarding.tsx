"use client";

import { useMemo, useState } from "react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { BuyerProfile, SavedBuyerProfile } from "@/lib/types";

const steps = [
  ["01", "Tell Foodie your rules", "Share your neighborhood, diet rules, allergies, cuisine preferences, and pickup radius."],
  ["02", "Open WhatsApp", "LocalPlate creates a Foodie signup message with your saved profile attached."],
  ["03", "Ask for food", "Text what you want tonight. Foodie searches Pantry and replies with ranked homemade options."]
];

const exampleDrops = [
  ["Verified Jain thali", "Asha's Gujarati Kitchen", "2.4 mi - pickup 6-7:30 PM", "12 plates left"],
  ["Fresh snacks", "Jain Snacks by Ritu", "4.2 mi - pickup 4-6 PM", "9 packs left"],
  ["South Indian dinner", "Sri Dosa Home Foods", "7.1 mi - confirm dairy", "few left"]
];

const trustSignals = ["No app to install", "Source proof on every match", "Allergy-safe handoff", "Works inside WhatsApp"];

const objectionCards = [
  ["Too many food groups?", "Foodie watches the messy sources and sends only the matches that fit you."],
  ["Strict diet?", "Jain, vegan, nut-free, no onion/garlic, and allergy rules stay attached to every search."],
  ["No time to compare?", "You get distance, price, pickup window, availability, and proof in one WhatsApp reply."]
];

type SignupResponse = {
  profile: SavedBuyerProfile;
  whatsappHref: string;
  signupMessage: string;
};

const dietPresets = ["veg", "jain", "vegan", "eggless", "nut-free"];
const cuisinePresets = ["Gujarati", "South Indian", "Punjabi", "Snacks", "Tiffin"];

const signupDefaults: BuyerProfile = {
  name: "",
  phone: "",
  address: "",
  neighborhood: "Tracy",
  radius: 8,
  diets: ["veg"],
  allergies: [],
  cuisines: ["Gujarati", "South Indian"],
  pickupTarget: "Tonight 6-8 PM",
  fulfillment: "either",
  whatsappConsent: true,
  consentNote: "Buyer opted in to receive LocalPlate/Foodie WhatsApp messages and seller handoff updates."
};

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function BuyerOnboarding() {
  const [profile, setProfile] = useState<BuyerProfile>(signupDefaults);
  const [stage, setStage] = useState<"editing" | "ready" | "joined">("editing");
  const [savedSignup, setSavedSignup] = useState<SignupResponse | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const token = useMemo(() => "LP-" + profile.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) + "-4821", [profile.name]);
  const whatsAppText = encodeURIComponent(
    "Hi Foodie, sign me up for LocalPlate. Token " + token + ". My profile: " +
    profile.name + ", " + profile.address + ", " + profile.radius + " miles, " +
    profile.diets.join("/") + ", allergies " + profile.allergies.join("/") +
    ", prefers " + profile.cuisines.join(" and ") + ", fulfillment " + profile.fulfillment +
    ". Tonight I want homemade food near me."
  );
  const whatsappHref = savedSignup?.whatsappHref ?? "https://wa.me/918097244384?text=" + whatsAppText;

  function update(next: Partial<BuyerProfile>) {
    setProfile((current) => ({ ...current, ...next }));
    setStage("editing");
    setSavedSignup(null);
    setStatus("");
  }

  function toggleList(field: "diets" | "cuisines", value: string) {
    const current = profile[field];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    update({ [field]: next } as Pick<BuyerProfile, typeof field>);
  }

  async function createInvite() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Signup failed.");
      setSavedSignup(payload);
      setProfile(payload.profile);
      setStage("ready");
      setStatus("Profile saved. Foodie can now identify this buyer by phone or signup token.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setSaving(false);
    }
  }

  function simulateJoin() {
    setStage("joined");
  }

  return (
    <main className="buyerPage">
      <header className="buyerHero">
        <nav>
          <strong>LocalPlate</strong>
          <div className="navLinks">
            <a href="#how">How it works</a>
          </div>
        </nav>
        <section className="buyerHeroGrid conversionHero">
          <div className="heroCopy">
            <p className="eyebrow">Tonight in Tracy</p>
            <h1>Find homemade Indian food without hunting through WhatsApp groups.</h1>
            <p className="lead">Tell Foodie where you are and what you cannot eat. It remembers your rules, checks nearby home cooks, and sends the best options in WhatsApp with proof.</p>
            <div className="trustBar">
              {trustSignals.map((signal) => <span key={signal}>{signal}</span>)}
            </div>
            <div className="heroCtas">
              <a className="primary heroPrimary" href="#signup">Get tonight's options</a>
              <a className="secondary" href="#sample">See live matches</a>
            </div>
            <p className="microCopy">30-second setup. No spam. You can stop anytime.</p>
          </div>
          <aside className="heroSignup panel" id="signup">
            <p className="eyebrow">Join the beta</p>
            <h2>Get Foodie on WhatsApp</h2>
            <p className="formHint">We only need your WhatsApp, location, and food rules to start.</p>
            <form className="quickSignup" onSubmit={(event) => { event.preventDefault(); createInvite(); }}>
              <label>WhatsApp number<input value={profile.phone} onChange={(event) => update({ phone: event.target.value })} inputMode="tel" placeholder="+1 408 555 0199" /></label>
              <AddressAutocomplete
                label="Where should we search?"
                value={profile.address}
                onChange={(address, suggestion) => update({ address, neighborhood: suggestion?.city || profile.neighborhood })}
                placeholder="Start typing your street address"
              />
              <div className="presetBlock">
                <span>Food rules</span>
                <div className="presetRow">{dietPresets.map((item) => <button type="button" key={item} className={profile.diets.includes(item) ? "selected" : ""} onClick={() => toggleList("diets", item)}>{item}</button>)}</div>
              </div>
              <label>Allergies<input value={profile.allergies.join(", ")} onChange={(event) => update({ allergies: splitList(event.target.value) })} placeholder="peanuts, dairy, none" /></label>
              <button className="primary heroPrimary" type="submit" disabled={saving}>{saving ? "Saving..." : "Text me tonight's food"}</button>
              {stage !== "editing" && <a className="secondary" href={whatsappHref} onClick={simulateJoin}>Open Foodie in WhatsApp</a>}
              {status && <p className="statusLine">{status}</p>}
            </form>
          </aside>
        </section>
      </header>

      <section className="valueStrip liveMatches" id="sample">
        {exampleDrops.map(([label, seller, detail, stock]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{seller}</strong>
            <p>{detail}</p>
            <em>{stock}</em>
          </article>
        ))}
      </section>

      <section className="objectionGrid">
        {objectionCards.map(([title, body]) => (
          <article key={title}>
            <strong>{title}</strong>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="handoffSteps" id="how">
        {steps.map(([number, title, body]) => (
          <article key={number}>
            <span>{number}</span>
            <strong>{title}</strong>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
