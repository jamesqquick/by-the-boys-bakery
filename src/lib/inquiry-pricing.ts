import type { PricingItem, PricingOption } from "../../.emdash/types";

type Item = Pick<PricingItem, "id" | "slug" | "title" | "subtitle" | "description">;
type Option = Pick<PricingOption, "id" | "item" | "label" | "amount">;

export type InquiryPackage = {
  key: string;
  itemId: string;
  title: string;
  label: string;
  description?: string;
  amount: number;
};

export type PricedInquiryLine = InquiryPackage & {
  quantity: number;
  lineTotal: number;
};

export class InquiryPricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InquiryPricingError";
  }
}

export function makeInquiryPackages(items: Item[], options: Option[]): InquiryPackage[] {
  const optionsByItem = new Map<string, Option[]>();
  for (const option of options) {
    if (!Number.isFinite(option.amount) || option.amount < 0) continue;
    const itemOptions = optionsByItem.get(option.item) ?? [];
    itemOptions.push(option);
    optionsByItem.set(option.item, itemOptions);
  }

  return items.flatMap((item) =>
    (optionsByItem.get(item.id) ?? []).flatMap((option) => {
      const base = {
        itemId: item.id,
        title: item.title,
        description: item.description,
        amount: option.amount,
      };

      if (item.slug === "cupcakes" && !option.label) {
        return [
          { ...base, key: `${option.id}:regular`, label: "12 regular" },
          { ...base, key: `${option.id}:mini`, label: "24 mini" },
        ];
      }

      return [{ ...base, key: option.id, label: option.label || item.subtitle || "Package" }];
    }),
  );
}

export function formatInquiryPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function priceInquiry(
  rawOrder: string,
  packages: InquiryPackage[],
  notes: string,
): { lines: PricedInquiryLine[]; total: number } {
  let requested: unknown;
  try {
    requested = JSON.parse(rawOrder);
  } catch {
    throw new InquiryPricingError("Please check your order and try again.");
  }

  if (!Array.isArray(requested) || requested.length > 20) {
    throw new InquiryPricingError("Please check your order and try again.");
  }

  const available = new Map(packages.map((item) => [item.key, item]));
  const selected = new Set<string>();
  const lines: PricedInquiryLine[] = [];
  let totalCents = 0;

  for (const line of requested) {
    if (!line || typeof line !== "object" || Array.isArray(line)) {
      throw new InquiryPricingError("Please check your order and try again.");
    }
    const { key, quantity, unitAmount } = line;
    if (typeof key !== "string" || selected.has(key) ||
        !Number.isInteger(quantity) || quantity < 1 || quantity > 50 ||
        typeof unitAmount !== "number" || !Number.isFinite(unitAmount)) {
      throw new InquiryPricingError("Please choose a quantity from 1 to 50 for each package.");
    }

    const item = available.get(key);
    if (!item) {
      throw new InquiryPricingError("An item is no longer available. Please refresh and try again.");
    }
    if (Math.round(unitAmount * 100) !== Math.round(item.amount * 100)) {
      throw new InquiryPricingError("Prices have changed. Please refresh to see the current estimate.");
    }

    selected.add(key);
    const lineCents = Math.round(item.amount * 100) * quantity;
    totalCents += lineCents;
    lines.push({ ...item, quantity, lineTotal: lineCents / 100 });
  }

  if (lines.length === 0 && !notes.trim()) {
    throw new InquiryPricingError("Choose a package or tell us about your custom request in the notes.");
  }

  return { lines, total: totalCents / 100 };
}
