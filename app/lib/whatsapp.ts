/**
 * Peoples Bakers — WhatsApp (E.164 without + for wa.me)
 * Local display: 076 149 5455
 */
export const WHATSAPP_PHONE_E164 = "94761495455";

export const WHATSAPP_PHONE_DISPLAY = "076 149 5455";

const DEFAULT_MESSAGE = encodeURIComponent(
  "Hello Peoples Bakers! I would like to share feedback about my visit and your baked goods. Thank you for your time. ",
);

export const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_PHONE_E164}?text=${DEFAULT_MESSAGE}`;
