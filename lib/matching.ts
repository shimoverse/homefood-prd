import { drops, sources } from "./mock-data";
import type { BuyerProfile, Drop } from "./types";

type Intent = {
  diets: string[];
  cuisines: string[];
  strict: boolean;
  watch: boolean;
  proof: boolean;
};

function includesAny(values: string[], candidates: string[]) {
  return candidates.some((candidate) => values.includes(candidate) || values.includes(candidate + "-friendly"));
}

export function parseBuyerIntent(text: string, profile: BuyerProfile): Intent {
  const lower = text.toLowerCase();
  const dietTerms = ["jain", "vegan", "veg", "vegetarian", "eggless", "nut-free"];
  const cuisineTerms = ["Gujarati", "South Indian", "Punjabi", "Hyderabadi", "Tiffin"];
  const diets = dietTerms.filter((term) => lower.includes(term)).map((term) => term === "vegetarian" ? "veg" : term);
  const cuisines = cuisineTerms.filter((term) => lower.includes(term.toLowerCase()));

  return {
    diets: diets.length ? Array.from(new Set(diets)) : profile.diets,
    cuisines: cuisines.length ? cuisines : profile.cuisines,
    strict: lower.includes("jain") || lower.includes("allergy") || profile.allergies.length > 0,
    watch: /watch|notify|alert|later|fresh/i.test(text),
    proof: /proof|source|safe|onion|garlic|allergen|confidence/i.test(text)
  };
}

function scoreDrop(drop: Drop, intent: Intent, profile: BuyerProfile) {
  const dietScore = intent.diets.reduce((score, diet) => {
    if (drop.labels.includes(diet)) return score + 7;
    if (drop.labels.includes(diet + "-friendly")) return score + 3;
    return score;
  }, 0);
  const cuisineScore = intent.cuisines.reduce((score, cuisine) => {
    if (drop.cuisine.includes(cuisine) || drop.labels.includes(cuisine.toLowerCase())) return score + 3;
    return score;
  }, 0);
  const confidenceScore = drop.confidence === "verified" ? 5 : drop.confidence === "likely" ? 1 : -6;
  const distanceScore = Math.max(0, profile.radius - drop.distanceMiles);
  const freshnessScore = /tonight|today/i.test(drop.pickupWindow) ? 4 : 0;
  const activeScore = drop.status === "active" ? 3 : drop.status === "needs review" ? -2 : -4;
  return dietScore + cuisineScore + confidenceScore + distanceScore + freshnessScore + activeScore;
}

export function rankMenuDrops(message: string, profile: BuyerProfile, candidateDrops: Drop[] = drops) {
  const intent = parseBuyerIntent(message, profile);
  const ranked = candidateDrops
    .filter((drop) => {
      if (drop.status === "sold out") return false;
      if (drop.distanceMiles > profile.radius && !/more|widen|farther|radius/i.test(message)) return false;
      if (!includesAny(drop.labels, intent.diets) && !drop.labels.includes("veg")) return false;
      return true;
    })
    .map((drop) => ({ drop, score: scoreDrop(drop, intent, profile) }))
    .sort((a, b) => b.score - a.score)
    .map((row) => row.drop);

  return { intent, results: ranked };
}

function sourceName(drop: Drop) {
  return sources.find((source) => source.id === drop.sourceId)?.name ?? "LocalPlate source";
}

function safetyLine(drop: Drop, profile: BuyerProfile) {
  const allergyNote = profile.allergies.length
    ? " Allergy check needed for " + profile.allergies.join(", ") + " unless seller confirms."
    : "";
  if (drop.confidence === "verified") return "Verified from source proof." + allergyNote;
  return "Likely match, but I would confirm dietary details before handoff." + allergyNote;
}

export function composeFoodieReply(message: string, profile: BuyerProfile, candidateDrops: Drop[] = drops) {
  const { intent, results } = rankMenuDrops(message, profile, candidateDrops);

  if (intent.watch) {
    return {
      text: "Done. I will watch for fresh " + profile.diets.join("/") + " food within " + profile.radius + " miles of " + profile.neighborhood + " and ping you when a verified option appears.",
      dropIds: results.slice(0, 3).map((drop) => drop.id),
      state: "watching" as const
    };
  }

  if (!results.length) {
    return {
      text: "I do not see a strong fresh match yet. I can widen the radius, include likely matches, or watch new menu drops for you.",
      dropIds: [],
      state: "searching" as const
    };
  }

  const lines = results.slice(0, 3).map((drop, index) => {
    return [
      String(index + 1) + ". " + drop.seller + " - " + drop.menu,
      "   " + drop.distanceMiles + " mi - $" + drop.price + " - " + drop.pickupWindow,
      "   " + drop.availability + " - " + drop.labels.slice(0, 4).join(", "),
      "   Proof: " + sourceName(drop) + " - " + drop.sourceSnippet,
      "   Safety: " + safetyLine(drop, profile)
    ].join("\n");
  });

  return {
    text: "Here are the best matches near " + profile.neighborhood + ":\n\n" + lines.join("\n\n") + "\n\nReply with #1, ask #1 for 3 plates, source proof, widen radius, or watch fresh drops.",
    dropIds: results.slice(0, 3).map((drop) => drop.id),
    state: "searching" as const
  };
}
