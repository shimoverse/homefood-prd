"use client";

import { useMemo, useState } from "react";
import { defaultBuyer, drops, sources } from "@/lib/mock-data";
import type { AgentMessage, BuyerProfile, Drop, ScanLog } from "@/lib/types";

const starterMessages: AgentMessage[] = [
  {
    id: "m-1",
    sender: "foodie",
    text: "Hi Mohit, I am Foodie from LocalPlate. Tell me what you want tonight and I will check fresh neighborhood inventory from your home address."
  }
];

const quickPrompts = [
  "Looking for Jain dinner tonight within 8 miles from home.",
  "What South Indian options are available tonight?",
  "Any vegan-friendly options nearby?",
  "I need catering for 20 people next week.",
  "Send my 4 PM digest."
];

function uid(prefix: string) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function parseIntent(text: string, profile: BuyerProfile) {
  const lower = text.toLowerCase();
  const dietTerms = ["jain", "vegan", "veg", "eggless", "nut-free", "non-veg"];
  const cuisineTerms = ["Gujarati", "South Indian", "Punjabi", "Hyderabadi", "Tiffin", "Catering"];
  const requestedDiets = dietTerms.filter((term) => lower.includes(term));
  const requestedCuisines = cuisineTerms.filter((term) => lower.includes(term.toLowerCase()));
  return {
    diets: requestedDiets.length ? requestedDiets : profile.diets,
    cuisines: requestedCuisines.length ? requestedCuisines : profile.cuisines,
    catering: lower.includes("catering") || lower.includes("20 people") || lower.includes("party"),
    digest: lower.includes("digest") || lower.includes("4 pm"),
    strict: lower.includes("jain") || lower.includes("vegan") || lower.includes("allergy") || lower.includes("nut")
  };
}

function scoreDrop(drop: Drop, intent: ReturnType<typeof parseIntent>, profile: BuyerProfile) {
  const dietScore = intent.diets.reduce((score, diet) => {
    if (drop.labels.includes(diet)) return score + 6;
    if (drop.labels.includes(diet + "-friendly")) return score + 3;
    return score;
  }, 0);
  const cuisineScore = intent.cuisines.reduce((score, cuisine) => {
    if (drop.cuisine.includes(cuisine) || drop.labels.includes(cuisine.toLowerCase())) return score + 3;
    return score;
  }, 0);
  const confidenceScore = drop.confidence === "verified" ? 4 : drop.confidence === "likely" ? 1 : -4;
  const distanceScore = Math.max(0, profile.radius - drop.distanceMiles);
  const freshnessScore = /tonight|today/i.test(drop.pickupWindow) ? 3 : 0;
  const cateringScore = intent.catering && (drop.labels.includes("catering") || drop.cadence === "advance") ? 10 : 0;
  return dietScore + cuisineScore + confidenceScore + distanceScore + freshnessScore + cateringScore;
}

function rankDrops(text: string, profile: BuyerProfile) {
  const intent = parseIntent(text, profile);
  const base = drops.filter((drop) => {
    if (intent.catering) return drop.labels.includes("catering") || drop.cadence === "advance";
    if (drop.distanceMiles > profile.radius && drop.cadence !== "advance") return false;
    return intent.diets.some((diet) => drop.labels.includes(diet) || drop.labels.includes(diet + "-friendly"));
  });
  return {
    intent,
    results: base
      .map((drop) => ({ drop, score: scoreDrop(drop, intent, profile) }))
      .sort((a, b) => b.score - a.score)
      .map((row) => row.drop)
  };
}

function formatResults(results: Drop[], intent: ReturnType<typeof parseIntent>) {
  if (!results.length) {
    return "I did not find a strong match in the current Pantry inventory. I can widen the radius, include likely matches, or watch for new drops and notify you.";
  }
  const lines = results.slice(0, 4).map((drop, index) => {
    return String(index + 1) + ". " + drop.seller + " - " + drop.menu + "\n" +
      "   " + drop.distanceMiles + " mi from home - $" + drop.price + " - " + drop.pickupWindow + "\n" +
      "   Pickup: " + drop.pickupAddress + "\n" +
      "   " + drop.availability + " - " + drop.labels.slice(0, 4).join(", ") + " - " + drop.confidence + " confidence";
  });
  const strictNote = intent.strict
    ? "I kept strict diet confidence high and separated likely matches from verified ones."
    : "I ranked by diet fit, distance, freshness, pickup timing, and cuisine preference.";
  return strictNote + "\n\n" + lines.join("\n\n") + "\n\nReply with a number, message #1, or source proof.";
}

function sellerDraft(drop: Drop, profile: BuyerProfile) {
  return "Hi " + drop.seller + ", I found your menu on LocalPlate. Is " + drop.menu.split(":")[0] +
    " still available for pickup from " + drop.pickupAddress + "? I am coming from " + profile.address + " and need 2-4 servings.";
}

export function LocalPlateApp() {
  const [profile, setProfile] = useState<BuyerProfile>(defaultBuyer);
  const [draftProfile, setDraftProfile] = useState<BuyerProfile>(defaultBuyer);
  const [messages, setMessages] = useState<AgentMessage[]>(starterMessages);
  const [prompt, setPrompt] = useState("");
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([
    { id: "log-1", text: "Pantry loaded 5 configured sources and 7 fresh drops." }
  ]);
  const [lastResults, setLastResults] = useState<Drop[]>(drops.slice(0, 3));
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(drops[0]);
  const [activeTab, setActiveTab] = useState<"inventory" | "sources" | "review">("inventory");

  const freshCount = useMemo(() => drops.filter((drop) => /today|tonight/i.test(drop.pickupWindow)).length, []);
  const reviewQueue = useMemo(() => drops.filter((drop) => drop.confidence !== "verified"), []);

  function addLog(text: string) {
    setScanLogs((current) => [{ id: uid("log"), text }, ...current].slice(0, 10));
  }

  function addMessage(sender: AgentMessage["sender"], text: string) {
    setMessages((current) => [...current, { id: uid("msg"), sender, text }]);
  }

  function askFoodie(text: string) {
    const clean = text.trim();
    if (!clean) return;
    addMessage("buyer", clean);
    setPrompt("");

    if (/message #?1/i.test(clean) && lastResults[0]) {
      const top = lastResults[0];
      setSelectedDrop(top);
      addLog("Foodie prepared WhatsApp seller handoff for " + top.seller + ".");
      addMessage("foodie", "Here is the seller draft:\n\n" + sellerDraft(top, profile) + "\n\nWant me to send, edit, or ask for pickup instructions?");
      return;
    }

    if (/source proof/i.test(clean) && lastResults[0]) {
      const top = lastResults[0];
      const source = sources.find((item) => item.id === top.sourceId);
      addLog("Foodie exposed source proof for " + top.seller + ".");
      addMessage("foodie", "Source proof for " + top.seller + ":\n- Source: " + (source?.name ?? "Unknown source") +
        "\n- Snippet: \"" + top.sourceSnippet + "\"" +
        "\n- Labels: " + top.labels.join(", ") +
        "\n- Confidence: " + top.confidence +
        "\n- Last updated: " + top.updatedAt);
      return;
    }

    const ranked = rankDrops(clean, profile);
    setLastResults(ranked.results);
    setSelectedDrop(ranked.results[0] ?? null);
    addLog("Foodie asked Pantry for " + ranked.intent.diets.join("/") + " within " + profile.radius + " miles of " + profile.address + ".");
    addLog("Pantry returned " + ranked.results.length + " ranked drops with confidence and source proof.");

    if (ranked.intent.digest) {
      const digest = ranked.results.slice(0, 3).map((drop) => "- " + drop.seller + ": " + drop.menu + " (" + drop.distanceMiles + " mi, " + drop.pickupWindow + ")").join("\n");
      addMessage("foodie", "4 PM LocalPlate digest from " + profile.address + ":\n" + (digest || "- No strong matches yet.") + "\n\nReply 1, 2, or 3 to message a seller. Reply more to widen radius.");
      return;
    }
    addMessage("foodie", formatResults(ranked.results, ranked.intent));
  }

  function runPantryScan() {
    addLog("Pantry scanned WhatsApp groups, public listings, seller forms, and forwarded menus.");
    addLog("Classified 42 posts: 7 menu drops, 3 sold-out updates, 5 pickup instructions, 27 chatter/unrelated.");
    addLog("Applied labels: veg, Jain, vegan-friendly, South Indian, Gujarati, catering, weekly tiffin.");
    addMessage("system", "Pantry scan complete. Inventory and review queue refreshed.");
  }

  function saveProfile() {
    setProfile(draftProfile);
    addLog("Buyer profile saved with exact address: " + draftProfile.address + ".");
    addMessage("system", "Profile saved: " + draftProfile.address + ", " + draftProfile.radius + " mi, " + draftProfile.diets.join(", ") + ".");
  }

  const topDrop = selectedDrop ?? lastResults[0] ?? null;

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Vercel MVP Shell</p>
          <h1>LocalPlate runs on two agents: Foodie for buyers, Pantry for inventory.</h1>
          <p className="lead">Foodie chats with the buyer in a WhatsApp-style experience. Pantry scans neighborhood sources, extracts menus, applies labels, and keeps daily/weekly inventory fresh.</p>
        </div>
        <div className="heroActions">
          <a href="/prototype.html">Static prototype</a>
          <a href="/index.html">PRD</a>
        </div>
      </header>

      <section className="workspace">
        <aside className="panel profilePanel">
          <p className="eyebrow">Buyer Profile</p>
          <h2>Foodie memory</h2>
          <label>Name<input value={draftProfile.name} onChange={(event) => setDraftProfile({ ...draftProfile, name: event.target.value })} /></label>
          <label>WhatsApp<input value={draftProfile.phone} onChange={(event) => setDraftProfile({ ...draftProfile, phone: event.target.value })} /></label>
          <label>Exact home address<input value={draftProfile.address} onChange={(event) => setDraftProfile({ ...draftProfile, address: event.target.value })} /></label>
          <label>Neighborhood<select value={draftProfile.neighborhood} onChange={(event) => setDraftProfile({ ...draftProfile, neighborhood: event.target.value })}><option>Tracy</option><option>Mountain House</option><option>Lathrop</option><option>Dublin</option></select></label>
          <label>Radius<select value={draftProfile.radius} onChange={(event) => setDraftProfile({ ...draftProfile, radius: Number(event.target.value) })}><option value={5}>5 miles</option><option value={8}>8 miles</option><option value={15}>15 miles</option><option value={40}>40 miles for specials</option></select></label>
          <label>Dietary rules<input value={draftProfile.diets.join(", ")} onChange={(event) => setDraftProfile({ ...draftProfile, diets: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <label>Cuisine preferences<input value={draftProfile.cuisines.join(", ")} onChange={(event) => setDraftProfile({ ...draftProfile, cuisines: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <button className="primary" onClick={saveProfile}>Save profile</button>
          <div className="miniSite"><strong>Production onboarding</strong><span>Website captures durable profile, exact address, WhatsApp opt-in, diet rules, and notification time.</span></div>
        </aside>

        <section className="phoneShell">
          <div className="island" />
          <div className="whatsapp">
            <div className="waHeader">
              <div className="agentIdentity"><span className="avatar">F</span><div><strong>Foodie Agent</strong><span>LocalPlate concierge - online</span></div></div>
              <span>WhatsApp</span>
            </div>
            <div className="messages">
              {messages.map((message) => <div key={message.id} className={"bubble " + message.sender}>{message.text}</div>)}
            </div>
            <div className="composer">
              <div className="quickRow">
                {quickPrompts.map((item) => <button key={item} onClick={() => askFoodie(item)}>{item}</button>)}
                <button onClick={() => askFoodie("message #1")}>Message #1</button>
                <button onClick={() => askFoodie("source proof")}>Source proof</button>
              </div>
              <div className="inputRow">
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Message Foodie: looking for Jain dinner from home..." />
                <button className="primary" onClick={() => askFoodie(prompt)}>Send</button>
              </div>
            </div>
          </div>
        </section>

        <aside className="rightRail">
          <section className="panel">
            <p className="eyebrow">Pantry Agent</p>
            <h2>Inventory operations</h2>
            <div className="metricGrid"><div><strong>{sources.length}</strong><span>sources</span></div><div><strong>{drops.length}</strong><span>drops</span></div><div><strong>{freshCount}</strong><span>fresh today</span></div></div>
            <button className="secondary" onClick={runPantryScan}>Run Pantry scan</button>
            <div className="logList">{scanLogs.map((log) => <div key={log.id}>{log.text}</div>)}</div>
          </section>

          <section className="panel bestMatch">
            <p className="eyebrow">Best Match</p>
            {topDrop ? (
              <>
                <h2>{topDrop.seller}</h2>
                <p>{topDrop.menu}</p>
                <div className="routeCard"><div className="routeLine"><span>Home</span><i /><span>Pickup</span></div><strong>{topDrop.distanceMiles} mi from home</strong><span>Home: {profile.address}</span><span>Pickup: {topDrop.pickupAddress}</span></div>
                <div className="draftBox">{sellerDraft(topDrop, profile)}</div>
                <div className="tagRow">{topDrop.labels.map((label) => <span key={label}>{label}</span>)}<span>{topDrop.confidence}</span></div>
              </>
            ) : <p>Ask Foodie for food to generate a best-match handoff.</p>}
          </section>
        </aside>
      </section>

      <section className="ops">
        <div className="tabs">
          <button className={activeTab === "inventory" ? "active" : ""} onClick={() => setActiveTab("inventory")}>Inventory</button>
          <button className={activeTab === "sources" ? "active" : ""} onClick={() => setActiveTab("sources")}>Sources</button>
          <button className={activeTab === "review" ? "active" : ""} onClick={() => setActiveTab("review")}>Review queue</button>
        </div>

        {activeTab === "inventory" && <div className="cardGrid">{drops.map((drop) => <article key={drop.id} className="listingCard" onClick={() => setSelectedDrop(drop)}><div><h3>{drop.seller}</h3><span>{drop.area} - {drop.distanceMiles} mi - {drop.updatedAt}</span></div><p>{drop.menu}</p><div className="tagRow">{drop.labels.map((label) => <span key={label}>{label}</span>)}</div></article>)}</div>}

        {activeTab === "sources" && <div className="cardGrid">{sources.map((source) => <article key={source.id} className="listingCard"><div><h3>{source.name}</h3><span>{source.type} - {source.area}</span></div><p>{source.format}</p><div className="tagRow"><span>{source.scanCadence}</span><span>{source.noise} noise</span><span>{source.status}</span></div></article>)}</div>}

        {activeTab === "review" && <div className="cardGrid">{reviewQueue.map((drop) => <article key={drop.id} className="listingCard review"><div><h3>{drop.seller}</h3><span>{drop.confidence} confidence</span></div><p>{drop.sourceSnippet}</p><div className="tagRow"><span>needs dietary review</span><span>source proof attached</span></div></article>)}</div>}
      </section>
    </main>
  );
}
