"use client";

import { useMemo, useState } from "react";
import { defaultBuyer } from "@/lib/mock-data";
import type { BuyerProfile } from "@/lib/types";

const qrCells = Array.from({ length: 121 }, (_, index) => {
  const row = Math.floor(index / 11);
  const col = index % 11;
  const inCorner =
    (row < 3 && col < 3) ||
    (row < 3 && col > 7) ||
    (row > 7 && col < 3);
  return inCorner || (row * 5 + col * 7 + row * col) % 4 === 0;
});

const steps = [
  ["01", "Tell Foodie your rules", "Share your neighborhood, diet rules, allergies, cuisine preferences, and pickup radius."],
  ["02", "Open WhatsApp", "LocalPlate creates a Foodie signup message with your saved profile attached."],
  ["03", "Ask for food", "Text what you want tonight. Foodie searches Pantry and replies with ranked homemade options."]
];

const exampleDrops = [
  ["Verified Jain thali", "Asha's Gujarati Kitchen", "2.4 mi - pickup 6-7:30 PM"],
  ["South Indian dinner", "Sri Dosa Home Foods", "7.1 mi - needs diet confirmation"],
  ["Vegan tiffin bowl", "Green Bowl Tiffin", "8.4 mi - 7 bowls left"]
];

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function BuyerOnboarding() {
  const [profile, setProfile] = useState<BuyerProfile>(defaultBuyer);
  const [stage, setStage] = useState<"editing" | "ready" | "joined">("editing");

  const token = useMemo(() => "LP-" + profile.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) + "-4821", [profile.name]);
  const whatsAppText = encodeURIComponent(
    "Hi Foodie, sign me up for LocalPlate. Token " + token + ". My profile: " +
    profile.name + ", " + profile.address + ", " + profile.radius + " miles, " +
    profile.diets.join("/") + ", allergies " + profile.allergies.join("/") +
    ", prefers " + profile.cuisines.join(" and ") + ", fulfillment " + profile.fulfillment +
    ". Tonight I want homemade food near me."
  );
  const whatsappHref = "https://wa.me/918097244384?text=" + whatsAppText;

  function update(next: Partial<BuyerProfile>) {
    setProfile((current) => ({ ...current, ...next }));
    setStage("editing");
  }

  function createInvite() {
    setStage("ready");
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
            <a href="/prototype">View prototype</a>
          </div>
        </nav>
        <section className="buyerHeroGrid">
          <div>
            <p className="eyebrow">Now launching in Tracy</p>
            <h1>Homemade food, available near you.</h1>
            <p className="lead">LocalPlate remembers your diet rules, checks nearby home cooks, shows source proof, and helps you confirm pickup in WhatsApp.</p>
            <div className="heroCtas">
              <a className="primary" href="#signup">Join as Rohan</a>
              <a className="secondary" href="/prototype">See the WhatsApp demo</a>
            </div>
          </div>
          <aside className="buyerPromise">
            <strong>What Rohan gets</strong>
            <span>Tonight's veg/Jain-safe options</span>
            <span>Distance, pickup window, price, availability</span>
            <span>Source proof before seller handoff</span>
            <span>A saved WhatsApp concierge, not another app</span>
          </aside>
        </section>
      </header>

      <section className="valueStrip">
        {exampleDrops.map(([label, seller, detail]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{seller}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section className="buyerGrid" id="signup">
        <form className="panel onboardingForm" onSubmit={(event) => { event.preventDefault(); createInvite(); }}>
          <div>
            <p className="eyebrow">Sign up</p>
            <h2>Start with your Foodie profile</h2>
          </div>
          <label>Name<input value={profile.name} onChange={(event) => update({ name: event.target.value })} /></label>
          <label>WhatsApp number<input value={profile.phone} onChange={(event) => update({ phone: event.target.value })} /></label>
          <label>Home address<input value={profile.address} onChange={(event) => update({ address: event.target.value })} /></label>
          <div className="formSplit">
            <label>Neighborhood<select value={profile.neighborhood} onChange={(event) => update({ neighborhood: event.target.value })}><option>Tracy</option><option>Mountain House</option><option>Lathrop</option><option>Dublin</option></select></label>
            <label>Radius<select value={profile.radius} onChange={(event) => update({ radius: Number(event.target.value) })}><option value={5}>5 miles</option><option value={8}>8 miles</option><option value={15}>15 miles</option><option value={40}>40 miles for specials</option></select></label>
          </div>
          <label>Dietary rules<input value={profile.diets.join(", ")} onChange={(event) => update({ diets: splitList(event.target.value) })} /></label>
          <label>Allergies / hard exclusions<input value={profile.allergies.join(", ")} onChange={(event) => update({ allergies: splitList(event.target.value) })} /></label>
          <label>Cuisine preferences<input value={profile.cuisines.join(", ")} onChange={(event) => update({ cuisines: splitList(event.target.value) })} /></label>
          <label>Pickup target<input value={profile.pickupTarget} onChange={(event) => update({ pickupTarget: event.target.value })} /></label>
          <label>Fulfillment<select value={profile.fulfillment} onChange={(event) => update({ fulfillment: event.target.value as BuyerProfile["fulfillment"] })}><option value="pickup">Pickup</option><option value="delivery">Delivery</option><option value="either">Either</option></select></label>
          <label className="checkLabel"><input type="checkbox" checked={profile.whatsappConsent} onChange={(event) => update({ whatsappConsent: event.target.checked })} /> I agree to WhatsApp messages, source proof, and seller handoff notes</label>
          <button className="primary" type="submit">Create my Foodie signup</button>
        </form>

        <aside className="panel invitePanel">
          <p className="eyebrow">Step 2</p>
          <h2>{stage === "joined" ? "Foodie is open in WhatsApp" : stage === "ready" ? "Send your signup in WhatsApp" : "Create signup first"}</h2>
          <div className={"largeQr " + stage} aria-label="Mock LocalPlate WhatsApp QR">
            {qrCells.map((filled, index) => <span key={index} className={filled ? "filled" : ""} />)}
          </div>
          <div className="inviteLink">
            <span>localplate.vercel.app/join/{profile.name.toLowerCase() || "buyer"}</span>
            <strong>{token}</strong>
          </div>
          <a className={"primary " + (stage === "editing" ? "disabledLink" : "")} href={stage === "editing" ? "#signup" : whatsappHref} onClick={() => { if (stage !== "editing") simulateJoin(); }}>Open Foodie in WhatsApp</a>
          <button className="secondary" onClick={simulateJoin}>Simulate scan</button>
        </aside>

        <aside className="panel profilePreview">
          <p className="eyebrow">Saved profile</p>
          <h2>What travels with Rohan</h2>
          <div><span>Name</span><strong>{profile.name}</strong></div>
          <div><span>Home</span><strong>{profile.address}</strong></div>
          <div><span>Diet</span><strong>{profile.diets.join(", ")}</strong></div>
          <div><span>Allergies</span><strong>{profile.allergies.join(", ") || "none"}</strong></div>
          <div><span>Food</span><strong>{profile.cuisines.join(", ")}</strong></div>
          <div><span>Pickup</span><strong>{profile.pickupTarget}</strong></div>
          <div><span>Fulfillment</span><strong>{profile.fulfillment}</strong></div>
          <div><span>Consent</span><strong>{profile.whatsappConsent ? "accepted" : "needed"}</strong></div>
          <div><span>Status</span><strong>{stage === "editing" ? "profile draft" : stage === "ready" ? "invite ready" : "WhatsApp agent active"}</strong></div>
        </aside>
      </section>

      <section className="handoffSteps">
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
