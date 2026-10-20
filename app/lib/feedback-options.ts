/** Display labels shipped to Supabase as plain text. */
export const SHOP_LOCATIONS = [
  "BMICH",
  "Bulathsinhala",
  "Horana-02",
  "Egaloya",
  "Soyzapura",
  "Kannanthudawa",
  "Weththewa",
  "Havelock",
  "Govinna",
  "Bandarawela",
  "Boralesgamuwa",
  "Eheliyagoda",
] as const;

export type ShopLocation = (typeof SHOP_LOCATIONS)[number];

export const FEATURED_SHOP: ShopLocation = "BMICH";

export const ITEM_CATEGORY_OPTIONS = ["Bakery", "Pastry", "Cake"] as const;
export const SERVICE_TYPE_OPTIONS = ["Dine-in", "Takeaway"] as const;

/** Persisted to `quick_tags` exactly as displayed. */
export const QUICK_TAG_LABELS = [
  "Great Taste 🍰",
  "Fast Service ⚡",
  "Friendly Staff 😊",
  "Clean Environment ✨",
  "Value for Money 💰",
] as const;

export type QuickTag = (typeof QUICK_TAG_LABELS)[number];

export function isShopLocation(value: string): value is ShopLocation {
  return (SHOP_LOCATIONS as readonly string[]).includes(value);
}

export function isQuickTag(value: string): value is QuickTag {
  return (QUICK_TAG_LABELS as readonly string[]).includes(value);
}
