import { getEmDashCollection, getEmDashEntry } from "emdash";
import type { CacheHint, MediaValue, PortableTextBlock } from "emdash";
import type { PricingItem } from "../../.emdash/types";

export type CampaignTheme = "standard" | "halloween" | "christmas" | "valentines" | "spring";
export type CampaignPlacement = "homepage" | "banner";

export type Campaign = {
  id: string;
  slug: string | null;
  status: string;
  title: string;
  summary?: string;
  content?: PortableTextBlock[];
  hero_image?: MediaValue;
  metadata_image?: MediaValue;
  hero_cta_label?: string;
  enabled?: boolean;
  show_on_homepage?: boolean;
  show_banner?: boolean;
  start_at?: Date;
  end_at?: Date;
  theme?: CampaignTheme;
  products_title?: string;
  products_note?: string;
  homepage_title?: string;
  homepage_description?: string;
  homepage_cta_label?: string;
  banner_text?: string;
  banner_cta_label?: string;
  inquiry_title?: string;
  inquiry_description?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

export type CatalogProduct = PricingItem & {
  image?: MediaValue;
  show_in_standard_catalog?: boolean;
};

type CampaignDate = Date | string | null | undefined;

export type EditableCampaign = {
  id: string;
  data: Campaign;
  edit: Record<string, Record<string, unknown>>;
};

export type EditableCampaignProduct = {
  id: string;
  data: CatalogProduct;
  edit: Record<string, Record<string, unknown>>;
};

function toTimestamp(value: CampaignDate): number | null {
  if (!value) return null;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isCampaignActive(campaign: Campaign, now = new Date()): boolean {
  if (campaign.status !== "published" || campaign.enabled !== true) return false;

  const nowTimestamp = now.getTime();
  const startsAt = toTimestamp(campaign.start_at);
  const endsAt = toTimestamp(campaign.end_at);

  return (startsAt === null || startsAt <= nowTimestamp) &&
    (endsAt === null || endsAt >= nowTimestamp);
}

export function selectPromotedCampaign(
  campaigns: Campaign[],
  placement: CampaignPlacement,
  now = new Date(),
): Campaign | undefined {
  return campaigns
    .filter((campaign) =>
      isCampaignActive(campaign, now) &&
      (placement === "homepage" ? campaign.show_on_homepage === true : campaign.show_banner === true)
    )
    .toSorted((a, b) => {
      const aEndsAt = toTimestamp(a.end_at) ?? Number.POSITIVE_INFINITY;
      const bEndsAt = toTimestamp(b.end_at) ?? Number.POSITIVE_INFINITY;
      if (aEndsAt !== bEndsAt) return bEndsAt - aEndsAt;

      return (toTimestamp(b.updatedAt) ?? 0) - (toTimestamp(a.updatedAt) ?? 0);
    })[0];
}

export async function getPromotedCampaign(
  placement: CampaignPlacement,
  now = new Date(),
): Promise<{
  campaign?: EditableCampaign;
  cacheHints: CacheHint[];
}> {
  const result = await getEmDashCollection<"campaigns", Campaign>("campaigns", {
    status: "published",
  });
  const cacheHints = [result.cacheHint];
  if (result.error) return { cacheHints };

  const selected = selectPromotedCampaign(
    result.entries.map((entry) => entry.data as Campaign),
    placement,
    now,
  );
  if (!selected) return { cacheHints };

  const entry = result.entries.find((candidate) => candidate.data.id === selected.id);
  if (!entry) return { cacheHints };

  return {
    campaign: {
      id: entry.id,
      data: entry.data as Campaign,
      edit: entry.edit as Record<string, Record<string, unknown>>,
    },
    cacheHints,
  };
}

export async function getActiveCampaign(
  slug: string,
  now = new Date(),
): Promise<{
  campaign?: EditableCampaign;
  exists: boolean;
  error?: Error;
  cacheHints: CacheHint[];
}> {
  const result = await getEmDashEntry<"campaigns", Campaign>("campaigns", slug);
  const cacheHints = [result.cacheHint];
  if (result.error) return { exists: false, error: result.error, cacheHints };
  if (!result.entry) return { exists: false, cacheHints };

  const data = result.entry.data as Campaign;
  if (!result.isPreview && !isCampaignActive(data, now)) return { exists: true, cacheHints };

  return {
    exists: true,
    campaign: {
      id: result.entry.id,
      data,
      edit: result.entry.edit as Record<string, Record<string, unknown>>,
    },
    cacheHints,
  };
}

export async function getCampaignProducts(campaignSlug: string): Promise<{
  products: EditableCampaignProduct[];
  error?: Error;
  cacheHints: CacheHint[];
}> {
  const products: EditableCampaignProduct[] = [];
  const cacheHints: CacheHint[] = [];
  let cursor: string | undefined;

  do {
    const result = await getEmDashEntry<
      "campaigns",
      Campaign,
      { products: { limit?: number; cursor?: string } }
    >("campaigns", campaignSlug, {
      references: { products: { limit: 100, cursor } },
    });
    cacheHints.push(result.cacheHint);
    if (result.error) {
      return { products: [], error: result.error, cacheHints };
    }

    const page = result.entry?.references?.products;
    if (!page) break;

    products.push(...page.entries.map((product) => ({
      id: product.id,
      data: product.data as CatalogProduct,
      edit: product.edit as Record<string, Record<string, unknown>>,
    })));
    cursor = page.nextCursor;
  } while (cursor);

  return { products, cacheHints };
}

export function getCampaignTheme(theme?: CampaignTheme): CampaignTheme {
  return ["halloween", "christmas", "valentines", "spring"].includes(theme ?? "")
    ? (theme as CampaignTheme)
    : "standard";
}
