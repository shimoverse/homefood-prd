import type { BuyerProfile, BuyerRequest, Drop, LaunchMetric, OperatorTask, PantryItemStatus, Seller, SellerIntake, Source } from "./types";

export const defaultBuyer: BuyerProfile = {
  name: "Rohan",
  phone: "+1 *** *** 1282",
  address: "Ellis Town Dr, Tracy, CA",
  neighborhood: "Tracy",
  radius: 8,
  diets: ["veg", "jain"],
  allergies: ["peanuts"],
  cuisines: ["Gujarati", "South Indian"],
  pickupTarget: "Tonight 6-8 PM",
  fulfillment: "either",
  whatsappConsent: true,
  consentNote: "Buyer opted in to receive LocalPlate/Foodie WhatsApp messages and seller handoff updates."
};

export const sources: Source[] = [
  {
    id: "src-asha-wa",
    name: "Asha's Menu Group",
    type: "WhatsApp group",
    area: "Tracy",
    scanCadence: "9 AM, 12 PM, 3 PM, 5 PM, 7 PM",
    format: "admin menu text + occasional images",
    noise: "low",
    status: "connected"
  },
  {
    id: "src-dosa-flyer",
    name: "Mountain House Food Flyers",
    type: "Forwarded menu",
    area: "Mountain House",
    scanCadence: "on forward + 4 PM digest prep",
    format: "image OCR",
    noise: "medium",
    status: "ready"
  },
  {
    id: "src-patel-public",
    name: "Patel Tiffins Weekly Listing",
    type: "Public listing",
    area: "Lathrop",
    scanCadence: "daily morning",
    format: "weekly menu page",
    noise: "low",
    status: "connected"
  },
  {
    id: "src-green-wa",
    name: "Green Bowl Seller Group",
    type: "WhatsApp group",
    area: "Mountain House",
    scanCadence: "11 AM, 4 PM, 6 PM",
    format: "seller-owned group",
    noise: "low",
    status: "connected"
  },
  {
    id: "src-sulekha",
    name: "Sulekha-style Local Listings",
    type: "Public listing",
    area: "Tracy/Lathrop",
    scanCadence: "daily",
    format: "business profile scrape",
    noise: "medium",
    status: "ready"
  }
];

export const drops: Drop[] = [
  {
    id: "drop-asha-thali",
    seller: "Asha's Gujarati Kitchen",
    sellerType: "home tiffin",
    area: "Tracy",
    pickupAddress: "Corral Hollow Rd & Grant Line Rd, Tracy, CA",
    distanceMiles: 2.4,
    menu: "Gujarati thali: rotli, dal, rice, aloo shaak, kachumber",
    price: 14,
    pickupWindow: "Tonight 6-7:30 PM",
    availability: "12 plates left",
    sourceId: "src-asha-wa",
    labels: ["veg", "jain", "no onion/garlic", "tiffin"],
    cuisine: ["Gujarati"],
    confidence: "verified",
    sourceSnippet: "Admin post: Jain thali available today. No onion/garlic. Pickup 6-7:30. 12 plates.",
    cadence: "daily",
    updatedAt: "3:42 PM",
    status: "active"
  },
  {
    id: "drop-ritu-snacks",
    seller: "Jain Snacks by Ritu",
    sellerType: "snacks specialist",
    area: "Tracy",
    pickupAddress: "Eleventh St & Bessie Ave, Tracy, CA",
    distanceMiles: 4.2,
    menu: "Jain dhokla, khandvi, thepla packs",
    price: 12,
    pickupWindow: "Today 4-6 PM",
    availability: "9 packs left",
    sourceId: "src-dosa-flyer",
    labels: ["veg", "jain", "eggless", "snacks"],
    cuisine: ["Gujarati"],
    confidence: "verified",
    sourceSnippet: "Forwarded flyer says Jain snacks today, pickup 4-6 PM, limited packs.",
    cadence: "same-day",
    updatedAt: "2:58 PM",
    status: "active"
  },
  {
    id: "drop-sri-dosa",
    seller: "Sri Dosa Home Foods",
    sellerType: "South Indian home cook",
    area: "Mountain House",
    pickupAddress: "Central Pkwy & Main St, Mountain House, CA",
    distanceMiles: 7.1,
    menu: "Idli, dosa batter, sambar, coconut chutney",
    price: 11,
    pickupWindow: "Tonight 5:30-8 PM",
    availability: "few left",
    sourceId: "src-dosa-flyer",
    labels: ["veg", "vegan-friendly"],
    cuisine: ["South Indian"],
    confidence: "likely",
    sourceSnippet: "Flyer image has no dairy visible, but vegan not explicitly stated.",
    cadence: "same-day",
    updatedAt: "4:05 PM",
    status: "needs review"
  },
  {
    id: "drop-green-bowl",
    seller: "Green Bowl Tiffin",
    sellerType: "vegan tiffin",
    area: "Mountain House",
    pickupAddress: "Mountain House Pkwy, Mountain House, CA",
    distanceMiles: 8.4,
    menu: "Vegan khichdi bowl, roasted vegetables, cilantro chutney",
    price: 13,
    pickupWindow: "Tonight 6:30-7:30 PM",
    availability: "7 bowls left",
    sourceId: "src-green-wa",
    labels: ["vegan", "veg", "nut-free", "tiffin"],
    cuisine: ["Gujarati", "Indian fusion"],
    confidence: "verified",
    sourceSnippet: "Seller post: vegan khichdi bowl, nut-free, 7 bowls left.",
    cadence: "daily",
    updatedAt: "3:51 PM",
    status: "active"
  },
  {
    id: "drop-punjab-rasoi",
    seller: "Punjab Rasoi",
    sellerType: "home dinner plates",
    area: "Tracy",
    pickupAddress: "MacArthur Dr & Lowell Ave, Tracy, CA",
    distanceMiles: 5.8,
    menu: "Paneer tikka masala, dal makhani, jeera rice, naan",
    price: 16,
    pickupWindow: "Tonight 6-8 PM",
    availability: "18 plates left",
    sourceId: "src-asha-wa",
    labels: ["veg"],
    cuisine: ["Punjabi"],
    confidence: "verified",
    sourceSnippet: "Menu text confirms vegetarian paneer/dal dinner plates.",
    cadence: "same-day",
    updatedAt: "4:20 PM",
    status: "active"
  },
  {
    id: "drop-patel-weekly",
    seller: "Patel Tiffins",
    sellerType: "weekly meal plan",
    area: "Lathrop",
    pickupAddress: "River Islands Pkwy, Lathrop, CA",
    distanceMiles: 11.8,
    menu: "Weekly tiffin plan: 5 dinners, rotating Gujarati/Punjabi menu",
    price: 65,
    pickupWindow: "Starts Monday",
    availability: "accepting weekly orders",
    sourceId: "src-patel-public",
    labels: ["veg", "tiffin", "weekly"],
    cuisine: ["Gujarati", "Punjabi"],
    confidence: "verified",
    sourceSnippet: "Public weekly listing with vegetarian menu and Monday start.",
    cadence: "weekly",
    updatedAt: "9:30 AM",
    status: "claimed"
  },
  {
    id: "drop-biryani",
    seller: "Biryani Uncle",
    sellerType: "specialty pop-up",
    area: "Lathrop",
    pickupAddress: "Louise Ave, Lathrop, CA",
    distanceMiles: 12.3,
    menu: "Chicken dum biryani family tray",
    price: 38,
    pickupWindow: "Friday preorder",
    availability: "preorder",
    sourceId: "src-sulekha",
    labels: ["non-veg", "catering", "preorder"],
    cuisine: ["Hyderabadi"],
    confidence: "verified",
    sourceSnippet: "Public listing: Friday chicken dum biryani family trays.",
    cadence: "advance",
    updatedAt: "10:15 AM",
    status: "active"
  }
];

export const sellers: Seller[] = [
  {
    id: "seller-asha",
    name: "Asha's Gujarati Kitchen",
    owner: "Asha P.",
    phone: "+1 *** *** 3412",
    area: "Tracy",
    cuisine: ["Gujarati", "Jain"],
    specialties: ["daily thali", "no onion/garlic", "party trays"],
    source: "Known WhatsApp admin group",
    status: "active",
    nextStep: "Collect weekly capacity and payment preference.",
    proof: "Admin post + two buyer confirmations"
  },
  {
    id: "seller-sri",
    name: "Sri Dosa Home Foods",
    owner: "Sri R.",
    phone: "+1 *** *** 8021",
    area: "Mountain House",
    cuisine: ["South Indian"],
    specialties: ["idli", "dosa batter", "chutneys"],
    source: "Forwarded menu flyer",
    status: "contacted",
    nextStep: "Confirm dairy, onion/garlic, and pickup address before strict recommendations.",
    proof: "Flyer OCR only"
  },
  {
    id: "seller-green",
    name: "Green Bowl Tiffin",
    owner: "Neha S.",
    phone: "+1 *** *** 5570",
    area: "Mountain House",
    cuisine: ["Gujarati", "Indian fusion"],
    specialties: ["vegan bowls", "nut-free tiffin"],
    source: "Seller-owned WhatsApp group",
    status: "verified",
    nextStep: "Ask seller to claim profile and approve daily scrape consent.",
    proof: "Seller post + ingredient note"
  },
  {
    id: "seller-patel",
    name: "Patel Tiffins",
    owner: "Patel Family",
    phone: "+1 *** *** 7719",
    area: "Lathrop",
    cuisine: ["Gujarati", "Punjabi"],
    specialties: ["weekly meal plan", "family packs"],
    source: "Public listing",
    status: "lead",
    nextStep: "Call for consent, pickup radius, and weekly menu format.",
    proof: "Public listing"
  }
];

export const sellerIntakes: SellerIntake[] = [
  {
    id: "lead-1",
    sellerName: "Ritu Jain Snacks",
    ownerName: "Ritu S.",
    phone: "+1 *** *** 9031",
    neighborhood: "Tracy",
    cuisine: ["Gujarati"],
    serviceType: "snacks",
    sampleMenu: "Dhokla, khandvi, thepla packs",
    dietaryClaims: ["veg", "jain", "eggless"],
    pickupAddress: "Eleventh St & Bessie Ave, Tracy, CA",
    fulfillment: "pickup",
    source: "WhatsApp group",
    sourceProof: "Mohit forwarded menu image; needs direct seller consent screenshot.",
    consentStatus: "missing",
    reviewState: "proof-needed",
    nextAction: "Collect phone consent, exact pickup cross street, and daily capacity.",
    submittedAt: "Today 10:15 AM"
  },
  {
    id: "lead-2",
    sellerName: "Meera's Tiffin",
    ownerName: "Meera K.",
    phone: "+1 *** *** 1180",
    neighborhood: "Mountain House",
    cuisine: ["North Indian", "Gujarati"],
    serviceType: "daily tiffin",
    sampleMenu: "Dal, rice, roti, paneer sabzi, salad",
    dietaryClaims: ["veg"],
    pickupAddress: "Mountain House Pkwy, Mountain House, CA",
    fulfillment: "both",
    source: "seller form",
    sourceProof: "Seller submitted form with menu photo and WhatsApp opt-in checkbox.",
    consentStatus: "captured",
    reviewState: "contacted",
    nextAction: "Ask for allergen rules and confirm delivery fee.",
    submittedAt: "Yesterday 6:30 PM"
  },
  {
    id: "lead-3",
    sellerName: "Bay Area Homemade Rotis",
    ownerName: "Unknown",
    phone: "+1 *** *** 0044",
    neighborhood: "Lathrop",
    cuisine: ["Punjabi"],
    serviceType: "weekly plan",
    sampleMenu: "Roti packs, paratha packs, weekly sabzi add-on",
    dietaryClaims: ["veg"],
    pickupAddress: "Needs confirmation",
    fulfillment: "pickup",
    source: "public listing",
    sourceProof: "Public listing saved; no owner confirmation yet.",
    consentStatus: "missing",
    reviewState: "new",
    nextAction: "Confirm owner, Tracy pickup availability, price list, and scrape consent.",
    submittedAt: "Yesterday 9:05 AM"
  }
];

export const buyerRequests: BuyerRequest[] = [
  {
    id: "req-1",
    buyerName: "Rohan",
    whatsapp: "+1 *** *** 1282",
    location: "Tracy",
    radius: 8,
    query: "Jain dinner tonight for 3 plates",
    dietaryRules: ["veg", "jain", "no onion/garlic"],
    allergyRules: ["peanuts"],
    cuisines: ["Gujarati"],
    fulfillment: "either",
    status: "matched",
    matchedDropIds: ["drop-asha-thali"],
    createdAt: "4:11 PM"
  },
  {
    id: "req-2",
    buyerName: "Priya",
    whatsapp: "+1 *** *** 4419",
    location: "Mountain House",
    radius: 6,
    query: "Vegan South Indian under $12",
    dietaryRules: ["vegan"],
    allergyRules: ["dairy"],
    cuisines: ["South Indian"],
    fulfillment: "pickup",
    status: "needs operator",
    matchedDropIds: ["drop-sri-dosa"],
    createdAt: "4:24 PM"
  },
  {
    id: "req-3",
    buyerName: "Nitin",
    whatsapp: "+1 *** *** 7720",
    location: "Lathrop",
    radius: 15,
    query: "20 person veg catering for Saturday",
    dietaryRules: ["veg"],
    allergyRules: [],
    cuisines: ["Gujarati", "Punjabi"],
    fulfillment: "either",
    status: "watching",
    matchedDropIds: ["drop-patel-weekly"],
    createdAt: "3:02 PM"
  },
  {
    id: "req-4",
    buyerName: "Anika",
    whatsapp: "+1 *** *** 6024",
    location: "Tracy",
    radius: 5,
    query: "Eggless cake today near Tracy",
    dietaryRules: ["eggless"],
    allergyRules: [],
    cuisines: ["bakery", "dessert"],
    fulfillment: "pickup",
    status: "unmatched",
    matchedDropIds: [],
    createdAt: "2:40 PM"
  }
];

export const operatorTasks: OperatorTask[] = [
  { id: "task-1", kind: "diet proof", title: "Verify Sri Dosa strict diet details", owner: "Mohit", priority: "high", status: "open", relatedId: "drop-sri-dosa", due: "Today", checklist: ["Confirm dairy", "Confirm no onion/garlic option", "Save seller proof"] },
  { id: "task-2", kind: "seller verification", title: "Convert Ritu Snacks into claimed seller", owner: "Ops", priority: "high", status: "open", relatedId: "lead-1", due: "Today", checklist: ["Get WhatsApp consent", "Confirm pickup cross street", "Record daily capacity"] },
  { id: "task-3", kind: "source cleanup", title: "Add 10 seed sellers from Tracy/Mountain House", owner: "Mohit", priority: "medium", status: "open", relatedId: "seller-seed", due: "This week", checklist: ["Find sellers", "Capture source proof", "Assign review state"] },
  { id: "task-4", kind: "buyer follow-up", title: "Review unmatched eggless dessert request", owner: "Ops", priority: "medium", status: "waiting", relatedId: "req-4", due: "Today", checklist: ["Search snack sellers", "Tell buyer watch rule is active", "Add dessert gap to launch list"] }
];

export const launchMetrics: LaunchMetric[] = [
  { id: "metric-buyers", label: "Active buyers", value: "12", target: "25 seed buyers", trend: "4 requests today" },
  { id: "metric-sellers", label: "Seller leads", value: String(sellers.length + sellerIntakes.length), target: "10 verified sellers", trend: "4 ready, 3 need info" },
  { id: "metric-drops", label: "Fresh drops", value: String(drops.filter((drop) => drop.status === "active").length), target: "20 fresh weekly", trend: "Today in Pantry" },
  { id: "metric-matches", label: "Matched asks", value: "3/4", target: "70%+ match rate", trend: "1 unmet category: eggless dessert" },
  { id: "metric-consent", label: "Consent coverage", value: "71%", target: "100% before launch", trend: "Seller opt-in gaps remain" }
];

export const pantryStatuses: PantryItemStatus[] = [
  { dropId: "drop-asha-thali", status: "low-stock", ordersClaimed: 5, platesRemaining: 7, lastVerifiedAt: "4:35 PM", operatorNote: "Seller confirmed Jain prep and no onion/garlic." },
  { dropId: "drop-ritu-snacks", status: "live", ordersClaimed: 1, platesRemaining: 9, lastVerifiedAt: "3:15 PM", operatorNote: "Flyer proof is clean; pickup window short." },
  { dropId: "drop-sri-dosa", status: "needs-review", ordersClaimed: 0, platesRemaining: null, lastVerifiedAt: "4:05 PM", operatorNote: "Needs dairy/allergen confirmation before strict matching." },
  { dropId: "drop-green-bowl", status: "live", ordersClaimed: 2, platesRemaining: 7, lastVerifiedAt: "3:51 PM", operatorNote: "Nut-free claim comes directly from seller post." },
  { dropId: "drop-punjab-rasoi", status: "live", ordersClaimed: 0, platesRemaining: 18, lastVerifiedAt: "4:20 PM", operatorNote: "Veg but not Jain-safe." },
  { dropId: "drop-patel-weekly", status: "stale", ordersClaimed: 0, platesRemaining: null, lastVerifiedAt: "9:30 AM", operatorNote: "Weekly plan needs phone verification before launch." },
  { dropId: "drop-biryani", status: "live", ordersClaimed: 0, platesRemaining: null, lastVerifiedAt: "10:15 AM", operatorNote: "Non-veg catering only; exclude from veg-only buyer defaults." }
];
