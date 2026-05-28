import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { drops } from "../mock-data";
import type { BuyerConversation, BuyerProfile, LocalPlateDatabase, SavedBuyerProfile } from "../types";
import { normalizePhone } from "../phone";

const dbPath = process.env.VERCEL
  ? path.join("/tmp", "localplate-db.json")
  : path.join(process.cwd(), "data", "localplate-db.json");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "localplate";
const supabaseDbObject = "phase1/localplate-db.json";

const emptyDb: LocalPlateDatabase = {
  users: [],
  profiles: [],
  conversations: [],
  menuDrops: drops
};

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return prefix + "-" + crypto.randomUUID().slice(0, 8);
}

function signupToken(name: string) {
  const slug = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "BUYER";
  return "LP-" + slug + "-" + Math.floor(1000 + Math.random() * 9000);
}

export async function readDb(): Promise<LocalPlateDatabase> {
  if (supabaseUrl && supabaseServiceKey) {
    return readSupabaseDb();
  }

  try {
    const db = JSON.parse(await readFile(dbPath, "utf8")) as Partial<LocalPlateDatabase>;
    return {
      users: db.users ?? [],
      profiles: db.profiles ?? [],
      conversations: db.conversations ?? [],
      menuDrops: db.menuDrops?.length ? db.menuDrops : drops
    };
  } catch {
    await mkdir(path.dirname(dbPath), { recursive: true });
    await writeDb(emptyDb);
    return { ...emptyDb };
  }
}

export async function writeDb(db: LocalPlateDatabase) {
  if (supabaseUrl && supabaseServiceKey) {
    await writeSupabaseDb(db);
    return;
  }

  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2) + "\n");
}

function normalizeDb(db: Partial<LocalPlateDatabase>): LocalPlateDatabase {
  return {
    users: db.users ?? [],
    profiles: db.profiles ?? [],
    conversations: db.conversations ?? [],
    menuDrops: db.menuDrops?.length ? db.menuDrops : drops
  };
}

async function readSupabaseDb() {
  const response = await fetch(
    supabaseUrl + "/storage/v1/object/" + supabaseBucket + "/" + supabaseDbObject,
    {
      headers: {
        Authorization: "Bearer " + supabaseServiceKey,
        apikey: supabaseServiceKey ?? ""
      },
      cache: "no-store"
    }
  );

  if (response.status === 404) {
    await writeSupabaseDb(emptyDb);
    return { ...emptyDb };
  }

  if (response.status === 400) {
    const errorBody = await response.json().catch(() => null) as { statusCode?: string } | null;
    if (errorBody?.statusCode === "404") {
      await writeSupabaseDb(emptyDb);
      return { ...emptyDb };
    }
  }

  if (!response.ok) {
    throw new Error("Could not read LocalPlate Supabase storage DB: " + response.status);
  }

  return normalizeDb(await response.json() as Partial<LocalPlateDatabase>);
}

async function writeSupabaseDb(db: LocalPlateDatabase) {
  const response = await fetch(
    supabaseUrl + "/storage/v1/object/" + supabaseBucket + "/" + supabaseDbObject,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + supabaseServiceKey,
        apikey: supabaseServiceKey ?? "",
        "Content-Type": "application/json",
        "x-upsert": "true"
      },
      body: JSON.stringify(normalizeDb(db), null, 2)
    }
  );

  if (!response.ok) {
    throw new Error("Could not write LocalPlate Supabase storage DB: " + response.status);
  }
}

export async function getMenuDrops() {
  const db = await readDb();
  return db.menuDrops?.length ? db.menuDrops : drops;
}

export async function upsertMenuDrop(drop: LocalPlateDatabase["menuDrops"][number]) {
  const db = await readDb();
  const exists = db.menuDrops.some((item) => item.id === drop.id);
  db.menuDrops = exists ? db.menuDrops.map((item) => item.id === drop.id ? drop : item) : [drop, ...db.menuDrops];
  await writeDb(db);
  return drop;
}

export async function saveBuyerProfile(profile: BuyerProfile) {
  const db = await readDb();
  const phone = normalizePhone(profile.phone);
  const timestamp = now();

  let user = db.users.find((item) => item.phone === phone);
  if (!user) {
    user = { id: id("usr"), phone, name: profile.name.trim(), createdAt: timestamp, lastSeenAt: timestamp };
    db.users.push(user);
  } else {
    user.name = profile.name.trim();
    user.lastSeenAt = timestamp;
  }

  const existing = db.profiles.find((item) => item.userId === user.id);
  const saved: SavedBuyerProfile = {
    ...profile,
    phone,
    name: profile.name.trim(),
    id: existing?.id ?? id("prof"),
    userId: user.id,
    token: existing?.token ?? signupToken(profile.name),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp
  };

  if (existing) {
    db.profiles = db.profiles.map((item) => item.id === existing.id ? saved : item);
  } else {
    db.profiles.push(saved);
  }

  let conversation = db.conversations.find((item) => item.userId === user.id);
  if (!conversation) {
    conversation = {
      id: id("conv"),
      userId: user.id,
      profileId: saved.id,
      channel: "whatsapp",
      state: "onboarded",
      turns: [
        {
          id: id("turn"),
          sender: "system",
          text: "Buyer profile saved and WhatsApp signup token issued.",
          createdAt: timestamp
        }
      ],
      lastDropIds: [],
      updatedAt: timestamp
    };
    db.conversations.push(conversation);
  } else {
    conversation.profileId = saved.id;
    conversation.updatedAt = timestamp;
  }

  await writeDb(db);
  return { user, profile: saved, conversation };
}

export async function findProfileByPhoneOrToken(input: { phone?: string; token?: string }) {
  const db = await readDb();
  const phone = input.phone ? normalizePhone(input.phone) : "";
  const profile = db.profiles.find((item) => {
    if (input.token && item.token.toLowerCase() === input.token.toLowerCase()) return true;
    return phone ? item.phone === phone : false;
  });
  if (!profile) return null;
  const user = db.users.find((item) => item.id === profile.userId) ?? null;
  const conversation = db.conversations.find((item) => item.userId === profile.userId) ?? null;
  return { db, user, profile, conversation };
}

export async function appendConversationTurn(args: {
  phone?: string;
  token?: string;
  buyerText: string;
  foodieText: string;
  state: BuyerConversation["state"];
  dropIds: string[];
}) {
  const found = await findProfileByPhoneOrToken({ phone: args.phone, token: args.token });
  if (!found || !found.conversation) return null;
  const timestamp = now();
  found.conversation.turns.push(
    { id: id("turn"), sender: "buyer", text: args.buyerText, createdAt: timestamp },
    { id: id("turn"), sender: "foodie", text: args.foodieText, createdAt: timestamp }
  );
  found.conversation.state = args.state;
  found.conversation.lastIntent = args.buyerText;
  found.conversation.lastDropIds = args.dropIds;
  found.conversation.updatedAt = timestamp;
  await writeDb(found.db);
  return found;
}
