import { NextResponse } from "next/server";
import { composeFoodieReply } from "@/lib/matching";
import { appendConversationTurn, findProfileByPhoneOrToken, getMenuDrops } from "@/lib/server/local-db";
import { getWhatsAppConfig, sendWhatsAppText } from "@/lib/server/whatsapp";

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const config = getWhatsAppConfig();

  if (!mode && !token && !challenge) {
    return NextResponse.json({
      ok: true,
      webhook: "ready",
      callbackUrl: "https://localplate.vercel.app/api/whatsapp",
      verifyTokenConfigured: Boolean(config.verifyToken),
      cloudApiSenderConfigured: Boolean(config.token && config.phoneNumberId),
      missing: [
        !config.token ? "WHATSAPP_CLOUD_API_TOKEN" : "",
        !config.phoneNumberId ? "WHATSAPP_PHONE_NUMBER_ID" : ""
      ].filter(Boolean)
    });
  }

  if (mode === "subscribe" && token === config.verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json() as WhatsAppWebhookBody;
  const messages = body.entry?.flatMap((entry) => entry.changes ?? [])
    .flatMap((change) => change.value?.messages ?? []) ?? [];

  const handled = [];

  for (const message of messages) {
    if (message.type !== "text" || !message.from || !message.text?.body) continue;
    const phone = "+" + message.from.replace(/[^\d]/g, "");
    const found = await findProfileByPhoneOrToken({ phone });

    if (!found) {
      const onboarding = "I do not have your LocalPlate profile yet. Please create it here first: https://localplate.vercel.app/phase1";
      const outbound = await sendWhatsAppText(message.from, onboarding);
      handled.push({ phone, status: "missing-profile", outbound });
      continue;
    }

    const menuDrops = await getMenuDrops();
    const reply = composeFoodieReply(message.text.body, found.profile, menuDrops);
    await appendConversationTurn({
      phone,
      buyerText: message.text.body,
      foodieText: reply.text,
      state: reply.state,
      dropIds: reply.dropIds
    });
    const outbound = await sendWhatsAppText(message.from, reply.text);
    handled.push({ phone, status: "replied", outbound, reply: reply.text });
  }

  return NextResponse.json({ ok: true, handled });
}
