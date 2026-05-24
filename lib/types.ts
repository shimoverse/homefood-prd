export type Confidence = "verified" | "likely" | "unknown";

export type BuyerProfile = {
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  radius: number;
  diets: string[];
  cuisines: string[];
  pickupTarget: string;
};

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
