import {
  isQuickTag,
  isShopLocation,
  ITEM_CATEGORY_OPTIONS,
  SERVICE_TYPE_OPTIONS,
} from "@/app/lib/feedback-options";

export type SanitizedFeedback = {
  rating: number;
  message: string;
  name: string | null;
  phone_number: string | null;
  item_category: string | null;
  service_type: string | null;
  shop_location: string;
  quick_tags: string | null;
};

const CATEGORIES = new Set<string>(ITEM_CATEGORY_OPTIONS);
const SERVICES = new Set<string>(SERVICE_TYPE_OPTIONS);

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  return value.trim().slice(0, max);
}

export function parseFeedbackSubmission(
  body: unknown,
): { ok: true; value: SanitizedFeedback } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid feedback." };
  }
  const input = body as Record<string, unknown>;

  const rating = input.rating;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Choose a rating from 1 to 5." };
  }

  if (typeof input.message !== "string" || input.message.trim().length > 500) {
    return { ok: false, error: "Message must be 500 characters or fewer." };
  }
  const message = input.message.trim();

  const shop = typeof input.shopLocation === "string" ? input.shopLocation.trim() : "";
  if (!isShopLocation(shop)) {
    return { ok: false, error: "Choose a shop location." };
  }

  const nameRaw = input.name === undefined || input.name === null ? "" : input.name;
  const phoneRaw = input.phone === undefined || input.phone === null ? "" : input.phone;
  if (typeof nameRaw !== "string" || nameRaw.trim().length > 120) {
    return { ok: false, error: "Name must be 120 characters or fewer." };
  }
  if (typeof phoneRaw !== "string" || phoneRaw.trim().length > 32) {
    return { ok: false, error: "Phone number must be 32 characters or fewer." };
  }

  const category = asTrimmedString(input.itemCategory ?? "", 40);
  const service = asTrimmedString(input.serviceType ?? "", 40);
  if (category === null || (category !== "" && !CATEGORIES.has(category))) {
    return { ok: false, error: "Choose a valid item category." };
  }
  if (service === null || (service !== "" && !SERVICES.has(service))) {
    return { ok: false, error: "Choose a valid service type." };
  }

  const tagsInput = input.quickTags;
  let quickTags: string | null = null;
  if (tagsInput !== undefined && tagsInput !== null) {
    if (!Array.isArray(tagsInput) || tagsInput.length > 8) {
      return { ok: false, error: "Invalid quick tags." };
    }
    const tags: string[] = [];
    for (const tag of tagsInput) {
      if (typeof tag !== "string" || !isQuickTag(tag) || tags.includes(tag)) {
        return { ok: false, error: "Invalid quick tags." };
      }
      tags.push(tag);
    }
    quickTags = tags.length > 0 ? [...tags].sort((a, b) => a.localeCompare(b)).join(", ") : null;
  }

  const name = nameRaw.trim();
  const phone = phoneRaw.trim();

  return {
    ok: true,
    value: {
      rating,
      message,
      name: name.length > 0 ? name : null,
      phone_number: phone.length > 0 ? phone : null,
      item_category: category.length > 0 ? category : null,
      service_type: service.length > 0 ? service : null,
      shop_location: shop,
      quick_tags: quickTags,
    },
  };
}
