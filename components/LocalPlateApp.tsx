"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultBuyer, drops, sources } from "@/lib/mock-data";
import type { AgentMessage, BuyerProfile, Drop, ScanLog } from "@/lib/types";

const starterMessages: AgentMessage[] = [
  {
    id: "m-1",
    sender: "foodie",
    text: "Hi Rohan, I am Foodie from LocalPlate. I have your Tracy profile, Jain/veg rules, and 8-mile radius saved. What are you looking for tonight?"
  }
];

const quickPrompts = [
  "Jain dinner tonight",
  "South Indian near me",
  "Show source proof",
  "Message option 1",
  "Widen radius"
];

const replySuggestions = [
  "Is #1 no onion/garlic?",
  "Ask #1 for 3 plates",
  "What time is pickup?",
  "Watch for fresh drops"
];

const demoScenarios = [
  {
    title: "Find dinner",
    turns: ["Jain dinner tonight", "Is #1 no onion/garlic?", "Ask #1 for 3 plates", "send"]
  },
  {
    title: "Safety proof",
    turns: ["South Indian near me", "Show source proof", "What time is pickup?", "Watch for fresh drops"]
  },
  {
    title: "No match recovery",
    turns: ["Vegan Jain dinner under $12", "Widen radius", "Message option 2"]
  }
];

const onboardingSteps = [
  "Rohan fills profile on localplate.vercel.app",
  "LocalPlate generates a Foodie invite and QR code",
  "Rohan scans the QR code to open WhatsApp",
  "Foodie starts with his profile and stays in WhatsApp"
];

const profilePayload = [
  ["identity", "Rohan, +1 *** *** 1282"],
  ["location", "Ellis Town Dr, Tracy, CA"],
  ["constraints", "veg, Jain, peanut allergy, no onion/garlic preferred"],
  ["preferences", "Gujarati, South Indian, pickup 6-8 PM"],
  ["permissions", "WhatsApp consent, source proof, seller handoff"]
];

const invocationEvents = [
  ["scheduled", "Pantry scans approved sources before meal windows."],
  ["seller event", "A seller posts, edits, or marks a menu sold out."],
  ["buyer ask", "Foodie calls Pantry when Rohan asks a WhatsApp question."],
  ["handoff", "Foodie drafts seller messages and records outcomes."]
];

const qrCells = Array.from({ length: 121 }, (_, index) => {
  const row = Math.floor(index / 11);
  const col = index % 11;
  const inCorner =
    (row < 3 && col < 3) ||
    (row < 3 && col > 7) ||
    (row > 7 && col < 3);
  return inCorner || (row * 7 + col * 5 + row * col) % 4 === 0;
});

const pantryFlow = [
  {
    title: "Source intake",
    body: "Seller forms, public listings, forwarded menus, and approved WhatsApp sources feed Pantry."
  },
  {
    title: "Extraction",
    body: "Pantry reads images, parses menu text, and normalizes pickup window, price, location, and availability."
  },
  {
    title: "Confidence labels",
    body: "Diet claims, cuisine, allergens, distance, freshness, and source proof are scored before Foodie recommends anything."
  },
  {
    title: "Buyer match",
    body: "Foodie asks Pantry for ranked drops using Rohan's profile, then shows explainable options in WhatsApp."
  }
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
  return strictNote + "\n\n" + lines.join("\n\n") + "\n\nReply with #1, message #1, ask #1 for 3 plates, pickup time, or source proof.";
}

function sellerDraft(drop: Drop, profile: BuyerProfile) {
  return "Hi " + drop.seller + ", I found your menu on LocalPlate. Is " + menuTitle(drop) +
    " still available for pickup from " + drop.pickupAddress + "? I am coming from " + profile.address + " and need 2-4 servings.";
}

function menuTitle(drop: Drop) {
  return drop.menu.split(":")[0].trim();
}

function requestedPlateCount(text: string) {
  const lower = text.toLowerCase();
  const digitMatch = lower.match(/\b([1-9])\s*(?:plate|plates|serving|servings|order|orders)\b/);
  if (digitMatch) return digitMatch[1];
  const wordCounts: Record<string, string> = {
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6"
  };
  const wordMatch = lower.match(/\b(one|two|three|four|five|six)\s*(?:plate|plates|serving|servings|order|orders)\b/);
  return wordMatch ? wordCounts[wordMatch[1]] : null;
}

function sellerQuestion(drop: Drop, text: string) {
  const count = requestedPlateCount(text);
  if (count) {
    return "can you confirm " + count + " " + menuTitle(drop).toLowerCase() + " plates for pickup tonight?";
  }
  return "can you confirm " + menuTitle(drop).toLowerCase() + " is still available for pickup tonight?";
}

function pickupInstructions(drop: Drop) {
  return drop.seller + " pickup is listed at " + drop.pickupAddress + ". Window: " + drop.pickupWindow +
    ". Availability: " + drop.availability + ". I can ask the seller to confirm exact parking/door instructions before you leave.";
}

function conversationLabel(state: "searching" | "handoff" | "watching") {
  if (state === "handoff") return "Seller follow-up in progress";
  if (state === "watching") return "Watching fresh Pantry updates";
  return "Ranking inventory for Rohan";
}

export function LocalPlateApp() {
  const [profile, setProfile] = useState<BuyerProfile>(defaultBuyer);
  const [draftProfile, setDraftProfile] = useState<BuyerProfile>(defaultBuyer);
  const [onboardingStage, setOnboardingStage] = useState<"profile" | "qr" | "joined">("profile");
  const [messages, setMessages] = useState<AgentMessage[]>(starterMessages);
  const [prompt, setPrompt] = useState("");
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([
    { id: "log-1", text: "Pantry loaded 5 configured sources and 7 fresh drops." }
  ]);
  const [lastResults, setLastResults] = useState<Drop[]>(drops.slice(0, 3));
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(drops[0]);
  const [activeConversation, setActiveConversation] = useState<"searching" | "handoff" | "watching">("searching");
  const [activeTab, setActiveTab] = useState<"inventory" | "sources" | "review">("inventory");
  const messagesRef = useRef<HTMLDivElement>(null);

  const freshCount = useMemo(() => drops.filter((drop) => /today|tonight/i.test(drop.pickupWindow)).length, []);
  const reviewQueue = useMemo(() => drops.filter((drop) => drop.confidence !== "verified" || drop.status === "needs review"), []);

  useEffect(() => {
    const node = messagesRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  function addLog(text: string) {
    setScanLogs((current) => [{ id: uid("log"), text }, ...current].slice(0, 10));
  }

  function addMessage(sender: AgentMessage["sender"], text: string) {
    setMessages((current) => [...current, { id: uid("msg"), sender, text }]);
  }

  function askFoodie(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    addMessage("buyer", clean);
    setPrompt("");

    const selectedIndex = (() => {
      const explicit = lower.match(/(?:#|option |message option |message #?|^)([1-4])\b/);
      return explicit ? Number(explicit[1]) - 1 : -1;
    })();

    if (/source proof|proof|safe|onion|garlic|allergen|confidence/i.test(clean) && lastResults[0]) {
      const index = selectedIndex >= 0 ? selectedIndex : 0;
      const top = lastResults[index] ?? lastResults[0];
      const source = sources.find((item) => item.id === top.sourceId);
      addLog("Foodie exposed source proof for " + top.seller + ".");
      addMessage("foodie", "Source proof for " + top.seller + ":\n- Source: " + (source?.name ?? "Unknown source") +
        "\n- Snippet: \"" + top.sourceSnippet + "\"" +
        "\n- Labels: " + top.labels.join(", ") +
        "\n- Confidence: " + top.confidence +
        "\n- Last updated: " + top.updatedAt +
        "\n\nMy read: " + (top.confidence === "verified" ? "safe to show as a verified match." : "good candidate, but I would confirm with the seller before recommending it as strict diet-safe."));
      return;
    }

    if (/pickup|address|where|time|parking|instructions/i.test(clean) && selectedDrop) {
      addLog("Foodie answered pickup logistics for " + selectedDrop.seller + ".");
      addMessage("foodie", pickupInstructions(selectedDrop));
      return;
    }

    if (/send|confirm|yes|go ahead|book|order/i.test(clean) && selectedDrop && activeConversation === "handoff") {
      addLog("Foodie simulated seller message and confirmation loop for " + selectedDrop.seller + ".");
      addMessage("foodie", "Sent to " + selectedDrop.seller + ".\n\nSeller reply simulated: Available. 3 plates can be packed for 6:45 PM pickup. Cash/Zelle accepted.\n\nI saved this thread and will remind you 20 minutes before pickup.");
      return;
    }

    if (/(?:\b[1-9]\s*(?:plate|plates|serving|servings|order|orders)\b|\b(?:one|two|three|four|five|six)\s*(?:plate|plates|serving|servings|order|orders)\b|edit)/i.test(clean) && selectedDrop) {
      addLog("Foodie edited seller handoff for " + selectedDrop.seller + ".");
      addMessage("foodie", "Updated draft:\n\nHi " + selectedDrop.seller + ", " + sellerQuestion(selectedDrop, clean) + " Pickup window says " + selectedDrop.pickupWindow + ". Please confirm exact pickup instructions and payment method.\n\nSay send when ready.");
      return;
    }

    if ((selectedIndex >= 0 || /message|seller|ask/i.test(clean)) && lastResults[selectedIndex >= 0 ? selectedIndex : 0]) {
      const top = lastResults[selectedIndex >= 0 ? selectedIndex : 0];
      setSelectedDrop(top);
      setActiveConversation("handoff");
      addLog("Foodie prepared WhatsApp seller handoff for " + top.seller + ".");
      addMessage("foodie", "Here is the seller draft:\n\n" + sellerDraft(top, profile) + "\n\nWant me to send, edit, ask for pickup instructions, or keep watching for alternatives?");
      return;
    }

    if (/more|widen|farther|radius|anything else|alternatives/i.test(clean)) {
      const ranked = drops
        .filter((drop) => drop.labels.some((label) => profile.diets.includes(label) || label === "veg"))
        .sort((a, b) => a.distanceMiles - b.distanceMiles);
      setLastResults(ranked);
      setSelectedDrop(ranked[0] ?? null);
      setActiveConversation("searching");
      addLog("Foodie widened search beyond " + profile.radius + " miles and re-ranked by diet confidence.");
      addMessage("foodie", "I widened the search and kept diet confidence strict.\n\n" + formatResults(ranked, { diets: profile.diets, cuisines: profile.cuisines, catering: false, digest: false, strict: true }) + "\n\nYou can keep narrowing naturally, like: only tonight, no dairy, under $15, or message #2.");
      return;
    }

    if (/watch|notify|alert|later|fresh/i.test(clean)) {
      setActiveConversation("watching");
      addLog("Foodie created a watch rule tied to Rohan's profile.");
      addMessage("foodie", "I will watch Pantry for fresh Jain/veg drops near " + profile.address + " and ping you when a verified option appears. Current rule: " + profile.radius + " miles, " + profile.diets.join("/") + ", pickup " + profile.pickupTarget + ".");
      return;
    }

    const ranked = rankDrops(clean, profile);
    setLastResults(ranked.results);
    setSelectedDrop(ranked.results[0] ?? null);
    addLog("Foodie asked Pantry for " + ranked.intent.diets.join("/") + " within " + profile.radius + " miles of " + profile.address + ".");
    addLog("Pantry returned " + ranked.results.length + " ranked drops with confidence and source proof.");

    if (ranked.intent.digest) {
      const digest = ranked.results.slice(0, 3).map((drop) => "- " + drop.seller + ": " + drop.menu + " (" + drop.distanceMiles + " mi, " + drop.pickupWindow + ")").join("\n");
      addMessage("foodie", "4 PM LocalPlate digest from " + profile.address + ":\n" + (digest || "- No strong matches yet.") + "\n\nReply 1, 2, or 3 to message a seller. Reply more to widen radius. You can keep the conversation going from this same WhatsApp thread anytime.");
      return;
    }
    setActiveConversation("searching");
    addMessage("foodie", formatResults(ranked.results, ranked.intent) + "\n\nYou can reply naturally: is #1 Jain-safe, ask #1 for 3 plates, pickup time, widen radius, or watch for fresh drops.");
  }

  function runPantryScan() {
    addLog("Pantry scanned WhatsApp groups, public listings, seller forms, and forwarded menus.");
    addLog("Classified 42 posts: 7 menu drops, 3 sold-out updates, 5 pickup instructions, 27 chatter/unrelated.");
    addLog("Applied labels: veg, Jain, vegan-friendly, South Indian, Gujarati, catering, weekly tiffin.");
    addMessage("system", "Pantry scan complete. Inventory and review queue refreshed.");
  }

  function saveProfile() {
    setProfile(draftProfile);
    setOnboardingStage("qr");
    addLog("Buyer profile saved with exact address: " + draftProfile.address + ".");
    addMessage("system", "Profile saved on the website. Foodie invite and WhatsApp QR generated for " + draftProfile.name + ".");
  }

  function scanQrAndJoin() {
    setProfile(draftProfile);
    setOnboardingStage("joined");
    setActiveConversation("searching");
    setMessages([
      { id: uid("msg"), sender: "system", text: draftProfile.name + " scanned the LocalPlate QR and opened WhatsApp." },
      { id: uid("msg"), sender: "foodie", text: "Hi " + draftProfile.name + ", Foodie is ready. I have your profile: " + draftProfile.address + ", " + draftProfile.radius + "-mile radius, " + draftProfile.diets.join("/") + ", prefers " + draftProfile.cuisines.join(" and ") + ". What should I find for you today?" }
    ]);
    addLog("WhatsApp agent joined for " + draftProfile.name + " with profile token LP-ROHAN-4821.");
  }

  function playScenario(scenario: typeof demoScenarios[number]) {
    const primary = drops[0];
    const alternate = drops[2];
    setProfile(draftProfile);
    setOnboardingStage("joined");
    setLastResults([primary, drops[1], alternate]);
    setSelectedDrop(scenario.title === "No match recovery" ? alternate : primary);
    setActiveConversation(scenario.title === "Safety proof" ? "watching" : "handoff");

    const transcript: AgentMessage[] = [
      { id: uid("msg"), sender: "system", text: draftProfile.name + " scanned the LocalPlate QR. Foodie now has the saved website profile." },
      { id: uid("msg"), sender: "foodie", text: "Hi " + draftProfile.name + ", I have your LocalPlate profile: " + draftProfile.address + ", " + draftProfile.radius + "-mile radius, " + draftProfile.diets.join("/") + ", prefers " + draftProfile.cuisines.join(" and ") + "." }
    ];

    if (scenario.title === "Safety proof") {
      transcript.push(
        { id: uid("msg"), sender: "buyer", text: "South Indian near me" },
        { id: uid("msg"), sender: "foodie", text: "Best match: Sri Dosa Home Foods, 7.1 miles away. It has idli, dosa batter, sambar, and coconut chutney for tonight. Confidence is likely, not verified, because the flyer does not explicitly confirm vegan or no dairy." },
        { id: uid("msg"), sender: "buyer", text: "Show source proof" },
        { id: uid("msg"), sender: "foodie", text: "Source proof: forwarded flyer from Mountain House Food Flyers. Pantry OCR found pickup 5:30-8 PM and veg labels. I would ask the seller to confirm dairy/no onion/garlic before calling it strict Jain-safe." },
        { id: uid("msg"), sender: "buyer", text: "Watch for fresh drops" },
        { id: uid("msg"), sender: "foodie", text: "Done. I will keep watching Pantry for verified South Indian or Jain-safe drops near Tracy and ping this WhatsApp thread when a stronger match appears." }
      );
    } else if (scenario.title === "No match recovery") {
      transcript.push(
        { id: uid("msg"), sender: "buyer", text: "Vegan Jain dinner under $12" },
        { id: uid("msg"), sender: "foodie", text: "No perfect match under $12 in Rohan's current radius. I found Jain snacks verified, and Sri Dosa likely veg but needs seller confirmation. I can widen radius or watch for a fresh drop." },
        { id: uid("msg"), sender: "buyer", text: "Widen radius" },
        { id: uid("msg"), sender: "foodie", text: "Widened to nearby Mountain House and kept diet confidence strict. Option 1 is Sri Dosa Home Foods at $11. I will mark it likely until Pantry gets seller confirmation." },
        { id: uid("msg"), sender: "buyer", text: "Message option 2" },
        { id: uid("msg"), sender: "foodie", text: "Draft ready for the seller: Can you confirm the dosa/idli set is veg, no onion/garlic, and available for pickup tonight? Say send when ready." }
      );
    } else {
      transcript.push(
        { id: uid("msg"), sender: "buyer", text: "Jain dinner tonight" },
        { id: uid("msg"), sender: "foodie", text: "Top match: Asha's Gujarati Kitchen. Gujarati thali, 2.4 miles from home, $14, pickup 6-7:30 PM. Verified Jain/no onion/garlic from today's admin post." },
        { id: uid("msg"), sender: "buyer", text: "Is #1 no onion/garlic?" },
        { id: uid("msg"), sender: "foodie", text: "Yes. Pantry source proof says: Jain thali available today. No onion/garlic. Pickup 6-7:30. 12 plates." },
        { id: uid("msg"), sender: "buyer", text: "Ask #1 for 3 plates" },
        { id: uid("msg"), sender: "foodie", text: "Draft ready: Hi Asha's Gujarati Kitchen, can you confirm 3 Gujarati thali plates for pickup tonight? Pickup window says 6-7:30 PM. Please confirm exact pickup instructions and payment method." },
        { id: uid("msg"), sender: "buyer", text: "send" },
        { id: uid("msg"), sender: "foodie", text: "Sent. Seller reply simulated: 3 plates confirmed for 6:45 PM pickup. I saved this thread and will remind you 20 minutes before pickup." }
      );
    }

    setMessages(transcript);
    addLog("Loaded demo flow: " + scenario.title + " using " + scenario.turns.length + " continued WhatsApp turns.");
  }

  const topDrop = selectedDrop ?? lastResults[0] ?? null;

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">LocalPlate prototype</p>
          <h1>Rohan starts on the website. Foodie continues in WhatsApp.</h1>
          <p className="lead">The website is onboarding and consent. Foodie is the buyer-facing WhatsApp concierge. Pantry is the backend inventory agent that turns messy neighborhood food sources into ranked, explainable drops.</p>
        </div>
        <div className="heroActions">
          <a href="/prototype.html">Static prototype</a>
          <a href="/prd.html">PRD</a>
        </div>
      </header>

      <section className="flowStrip" aria-label="User onboarding flow">
        {onboardingSteps.map((step, index) => (
          <article key={step} className="flowStep">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </article>
        ))}
      </section>

      <section className="onboardingDemo">
        <article className="panel signupCard">
          <p className="eyebrow">Website onboarding</p>
          <h2>Capture Rohan's profile before WhatsApp</h2>
          <div className="profileSummary">
            <span>Name</span><strong>{draftProfile.name}</strong>
            <span>Home</span><strong>{draftProfile.address}</strong>
            <span>Diet</span><strong>{draftProfile.diets.join(", ")}</strong>
            <span>Radius</span><strong>{draftProfile.radius} miles</strong>
          </div>
          <button className="primary" onClick={saveProfile}>Generate WhatsApp QR</button>
        </article>

        <article className={"panel qrCard " + onboardingStage}>
          <p className="eyebrow">WhatsApp handoff</p>
          <h2>{onboardingStage === "joined" ? "Foodie is ready in WhatsApp" : "Scan to start Foodie"}</h2>
          <div className="qrLayout">
            <div className="qrCode" aria-label="Mock WhatsApp QR code">
              {qrCells.map((filled, index) => <span key={index} className={filled ? "filled" : ""} />)}
            </div>
            <div className="qrCopy">
              <strong>localplate.app/join/rohan</strong>
              <span>Profile token LP-ROHAN-4821 carries address, diet rules, radius, cuisine preferences, and WhatsApp consent into Foodie.</span>
              <button className="secondary" onClick={scanQrAndJoin}>Simulate Rohan scan</button>
            </div>
          </div>
        </article>

        <article className="panel joinCard">
          <p className="eyebrow">Agent activation</p>
          <h2>Foodie becomes a saved WhatsApp contact</h2>
          <div className="joinSteps">
            <span className={onboardingStage !== "profile" ? "done" : ""}>Profile saved</span>
            <span className={onboardingStage === "qr" || onboardingStage === "joined" ? "done" : ""}>QR generated</span>
            <span className={onboardingStage === "joined" ? "done" : ""}>WhatsApp opened</span>
            <span className={onboardingStage === "joined" ? "done" : ""}>Full agent ready</span>
          </div>
          <p>After the scan, Rohan does not need the website for normal use. Foodie keeps the profile and continues the conversation from the same WhatsApp thread.</p>
        </article>
      </section>

      <section className="workspace">
        <aside className="panel profilePanel">
          <p className="eyebrow">Buyer Profile</p>
          <h2>Rohan's Foodie memory</h2>
          <label>Name<input value={draftProfile.name} onChange={(event) => setDraftProfile({ ...draftProfile, name: event.target.value })} /></label>
          <label>WhatsApp<input value={draftProfile.phone} onChange={(event) => setDraftProfile({ ...draftProfile, phone: event.target.value })} /></label>
          <label>Exact home address<input value={draftProfile.address} onChange={(event) => setDraftProfile({ ...draftProfile, address: event.target.value })} /></label>
          <label>Neighborhood<select value={draftProfile.neighborhood} onChange={(event) => setDraftProfile({ ...draftProfile, neighborhood: event.target.value })}><option>Tracy</option><option>Mountain House</option><option>Lathrop</option><option>Dublin</option></select></label>
          <label>Radius<select value={draftProfile.radius} onChange={(event) => setDraftProfile({ ...draftProfile, radius: Number(event.target.value) })}><option value={5}>5 miles</option><option value={8}>8 miles</option><option value={15}>15 miles</option><option value={40}>40 miles for specials</option></select></label>
          <label>Dietary rules<input value={draftProfile.diets.join(", ")} onChange={(event) => setDraftProfile({ ...draftProfile, diets: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <label>Allergies / hard exclusions<input value={draftProfile.allergies.join(", ")} onChange={(event) => setDraftProfile({ ...draftProfile, allergies: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <label>Cuisine preferences<input value={draftProfile.cuisines.join(", ")} onChange={(event) => setDraftProfile({ ...draftProfile, cuisines: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <label>Fulfillment<select value={draftProfile.fulfillment} onChange={(event) => setDraftProfile({ ...draftProfile, fulfillment: event.target.value as BuyerProfile["fulfillment"] })}><option value="pickup">Pickup</option><option value="delivery">Delivery</option><option value="either">Either</option></select></label>
          <label className="checkLabel"><input type="checkbox" checked={draftProfile.whatsappConsent} onChange={(event) => setDraftProfile({ ...draftProfile, whatsappConsent: event.target.checked })} /> WhatsApp consent and source-proof notices accepted</label>
          <button className="primary" onClick={saveProfile}>Save profile</button>
          <div className="miniSite"><strong>Website onboarding</strong><span>After this is saved, LocalPlate opens WhatsApp with Foodie. The chat remains available from Rohan's WhatsApp history.</span></div>
          <div className="payloadCard">
            <strong>Profile payload sent to Foodie</strong>
            {profilePayload.map(([key, value]) => <div key={key}><span>{key}</span><p>{value}</p></div>)}
          </div>
        </aside>

        <section className="phoneShell">
          <div className="sideButton left" />
          <div className="sideButton right" />
          <div className="island" />
          <div className="whatsapp">
            <div className="statusBar"><span>9:41</span><span>5G 100%</span></div>
            <div className="waHeader">
              <div className="backChevron">&lt;</div>
              <div className="agentIdentity"><span className="avatar">F</span><div><strong>Foodie</strong><span>online - LocalPlate</span></div></div>
              <div className="waActions"><span>Search</span><span>Menu</span></div>
            </div>
            <div className="messages" ref={messagesRef}>
              {messages.map((message) => <div key={message.id} className={"bubble " + message.sender}>{message.text}</div>)}
            </div>
            <div className="composer">
              <div className="quickRow">
                {quickPrompts.map((item) => <button key={item} onClick={() => askFoodie(item)}>{item}</button>)}
              </div>
              <div className="suggestionRow">
                {replySuggestions.map((item) => <button key={item} onClick={() => askFoodie(item)}>{item}</button>)}
              </div>
              <div className="inputRow">
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); askFoodie(prompt); } }} placeholder="Message Foodie" />
                <button className="primary" onClick={() => askFoodie(prompt)}>Send</button>
              </div>
              <div className="homeIndicator" />
            </div>
          </div>
        </section>

        <aside className="rightRail">
          <section className="panel">
            <p className="eyebrow">Pantry Agent</p>
            <h2>Backend inventory flow</h2>
            <div className="pantryFlow">
              {pantryFlow.map((step, index) => (
                <article key={step.title}>
                  <span>{index + 1}</span>
                  <div><strong>{step.title}</strong><p>{step.body}</p></div>
                </article>
              ))}
            </div>
            <div className="metricGrid"><div><strong>{sources.length}</strong><span>sources</span></div><div><strong>{drops.length}</strong><span>drops</span></div><div><strong>{freshCount}</strong><span>fresh today</span></div></div>
            <button className="secondary" onClick={runPantryScan}>Run Pantry scan</button>
            <div className="logList">{scanLogs.map((log) => <div key={log.id}>{log.text}</div>)}</div>
          </section>

          <section className="panel scenarioPanel">
            <p className="eyebrow">Conversation demo</p>
            <h2>Play continued WhatsApp flows</h2>
            <p>These scripts show the actual loop: search, clarify, prove source, message seller, confirm pickup, or keep watching.</p>
            <div className="scenarioButtons">
              {demoScenarios.map((scenario) => (
                <button key={scenario.title} className="secondary" onClick={() => playScenario(scenario)}>{scenario.title}</button>
              ))}
            </div>
            <div className="memoryStack">
              <div><span>Thread memory</span><strong>{messages.length} turns saved</strong></div>
              <div><span>Current state</span><strong>{conversationLabel(activeConversation)}</strong></div>
              <div><span>Top match</span><strong>{topDrop ? topDrop.seller : "None yet"}</strong></div>
            </div>
          </section>

          <section className="panel bestMatch">
            <p className="eyebrow">Best Match</p>
            {topDrop ? (
              <>
                <h2>{topDrop.seller}</h2>
                <p>{topDrop.menu}</p>
                <div className="conversationState"><span>{activeConversation}</span><strong>{conversationLabel(activeConversation)}</strong></div>
                <div className="routeCard"><div className="routeLine"><span>Home</span><i /><span>Pickup</span></div><strong>{topDrop.distanceMiles} mi from home</strong><span>Home: {profile.address}</span><span>Pickup: {topDrop.pickupAddress}</span></div>
                <div className="draftBox">{sellerDraft(topDrop, profile)}</div>
                <div className="tagRow">{topDrop.labels.map((label) => <span key={label}>{label}</span>)}<span>{topDrop.confidence}</span></div>
              </>
            ) : <p>Ask Foodie for food to generate a best-match handoff.</p>}
          </section>
        </aside>
      </section>

      <section className="architecture">
        <div>
          <p className="eyebrow">System shape</p>
          <h2>How Pantry is invoked</h2>
          <p>Pantry is not a user-facing chat. It runs on schedules, seller events, forwarded menus, and Foodie requests. Foodie calls Pantry whenever Rohan asks for food, while Pantry keeps inventory fresh before he asks.</p>
          <div className="invokeList">
            {invocationEvents.map(([key, value]) => <div key={key}><strong>{key}</strong><span>{value}</span></div>)}
          </div>
        </div>
        <div className="architectureGrid">
          <article><strong>Website</strong><span>Profile, location, diet constraints, WhatsApp consent</span></article>
          <article><strong>Foodie WhatsApp agent</strong><span>Buyer conversation, ranking request, seller handoff, source proof</span></article>
          <article><strong>Pantry backend agent</strong><span>Scans sources, extracts menus, labels confidence, refreshes inventory</span></article>
          <article><strong>Inventory store</strong><span>Structured drops, source snippets, freshness, availability, review queue</span></article>
        </div>
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
