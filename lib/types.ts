export type Confidence = "verified" | "likely" | "unknown";

export type BuyerProfile = {
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  radius: number;
  diets: string[];
  allergies: string[];
  cuisines: string[];
  pickupTarget: string;
  fulfillment: "pickup" | "delivery" | "either";
  consent?: boolean;
  whatsappConsent?: boolean;
  consentNote?: string;
};

export type PersistedUser = {
  id: string;
  phone: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
};

export type SavedBuyerProfile = BuyerProfile & {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationTurn = {
  id: string;
  sender: "buyer" | "foodie" | "system";
  text: string;
  createdAt: string;
};

export type BuyerConversation = {
  id: string;
  userId: string;
  profileId: string;
  channel: "whatsapp" | "web";
  state: "onboarded" | "searching" | "handoff" | "watching";
  turns: ConversationTurn[];
  lastIntent?: string;
  lastDropIds: string[];
  updatedAt: string;
};

export type LocalPlateDatabase = {
  users: PersistedUser[];
  profiles: SavedBuyerProfile[];
  conversations: BuyerConversation[];
  menuDrops: Drop[];
};

export type ReviewState = "new" | "contacted" | "proof-needed" | "approved" | "rejected";

export type Source = {
  id: string;
  name: string;
  type: "WhatsApp group" | "Public listing" | "Seller form" | "Forwarded menu" | "Facebook page";
  area: string;
  scanCadence: string;
  format: string;
  noise: "low" | "medium" | "high";
  status: "connected" | "ready" | "needs setup";
};

export type Drop = {
  id: string;
  seller: string;
  sellerType: string;
  area: string;
  pickupAddress: string;
  distanceMiles: number;
  menu: string;
  price: number;
  pickupWindow: string;
  availability: string;
  sourceId: string;
  labels: string[];
  cuisine: string[];
  confidence: Confidence;
  sourceSnippet: string;
  cadence: "same-day" | "daily" | "weekly" | "advance";
  updatedAt: string;
  status: "active" | "needs review" | "sold out" | "claimed";
};

export type AgentMessage = {
  id: string;
  sender: "buyer" | "foodie" | "system";
  text: string;
};

export type ScanLog = {
  id: string;
  text: string;
};

export type Seller = {
  id: string;
  name: string;
  owner: string;
  phone: string;
  area: string;
  cuisine: string[];
  specialties: string[];
  source: string;
  status: "lead" | "contacted" | "verified" | "active" | "paused";
  nextStep: string;
  proof: string;
};

export type SellerIntake = {
  id: string;
  sellerName: string;
  ownerName: string;
  phone: string;
  neighborhood: string;
  cuisine: string[];
  serviceType: "daily tiffin" | "weekly plan" | "snacks" | "pop-up" | "catering";
  sampleMenu: string;
  dietaryClaims: string[];
  pickupAddress: string;
  fulfillment: "pickup" | "delivery" | "both";
  source: "Mohit referral" | "seller form" | "WhatsApp group" | "public listing" | "buyer request";
  sourceProof: string;
  consentStatus: "missing" | "captured" | "needs refresh";
  reviewState: ReviewState;
  nextAction: string;
  submittedAt: string;
};

export type IntakeLead = {
  id: string;
  sellerName: string;
  submittedBy: string;
  channel: "seller form" | "WhatsApp forward" | "manual call" | "public listing";
  missing: string[];
  priority: "today" | "this week" | "later";
};

export type BuyerRequest = {
  id: string;
  buyerName: string;
  whatsapp: string;
  location: string;
  radius: number;
  query: string;
  dietaryRules: string[];
  allergyRules: string[];
  cuisines: string[];
  fulfillment: "pickup" | "delivery" | "either";
  status: "matched" | "needs operator" | "watching" | "unmatched";
  matchedDropIds: string[];
  createdAt: string;
};

export type PantryItemStatus = {
  dropId: string;
  status: "live" | "low-stock" | "sold-out" | "stale" | "needs-review";
  ordersClaimed: number;
  platesRemaining: number | null;
  lastVerifiedAt: string;
  operatorNote: string;
};

export type OperatorTask = {
  id: string;
  kind: "seller verification" | "diet proof" | "claim confirmation" | "buyer follow-up" | "source cleanup";
  title: string;
  owner: "Mohit" | "Ops";
  priority: "high" | "medium" | "low";
  status: "open" | "waiting" | "done";
  relatedId: string;
  due: string;
  checklist: string[];
};

export type LaunchMetric = {
  id: string;
  label: string;
  value: string;
  target: string;
  trend: string;
};
