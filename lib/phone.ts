export function normalizePhone(input: string) {
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d]/g, "");

  if (!digits) return "";
  if (trimmed.startsWith("+")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  return "+" + digits;
}

export function maskPhone(phone: string) {
  const normalized = normalizePhone(phone);
  if (normalized.length < 6) return normalized || "unknown";
  return normalized.slice(0, 3) + " *** *** " + normalized.slice(-4);
}
