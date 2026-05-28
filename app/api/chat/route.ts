import { NextResponse } from "next/server";
import { composeFoodieReply } from "@/lib/matching";
import { appendConversationTurn, findProfileByPhoneOrToken, getMenuDrops } from "@/lib/server/local-db";

export async function POST(request: Request) {
  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone : undefined;
  const token = typeof body.token === "string" ? body.token : undefined;
  const message = String(body.message ?? "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const found = await findProfileByPhoneOrToken({ phone, token });
  if (!found) {
    return NextResponse.json({
      error: "No LocalPlate profile found for this phone/token.",
      nextStep: "Open the onboarding page and create a Foodie signup first."
    }, { status: 404 });
  }

  const menuDrops = await getMenuDrops();
  const reply = composeFoodieReply(message, found.profile, menuDrops);
  const saved = await appendConversationTurn({
    phone,
    token,
    buyerText: message,
    foodieText: reply.text,
    state: reply.state,
    dropIds: reply.dropIds
  });

  return NextResponse.json({
    profile: found.profile,
    reply: reply.text,
    state: reply.state,
    dropIds: reply.dropIds,
    conversation: saved?.conversation ?? found.conversation
  });
}
