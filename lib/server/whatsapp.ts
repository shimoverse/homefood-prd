type WhatsAppTextMessage = {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: { preview_url: boolean; body: string };
};

export function getWhatsAppConfig() {
  return {
    token: process.env.WHATSAPP_CLOUD_API_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "localplate-dev"
  };
}

export async function sendWhatsAppText(to: string, body: string) {
  const config = getWhatsAppConfig();
  if (!config.token || !config.phoneNumberId) {
    return { sent: false, skipped: "WhatsApp Cloud API env vars are not configured." };
  }

  const payload: WhatsAppTextMessage = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      preview_url: false,
      body
    }
  };

  const response = await fetch("https://graph.facebook.com/v20.0/" + config.phoneNumberId + "/messages", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));
  return { sent: response.ok, status: response.status, result };
}
