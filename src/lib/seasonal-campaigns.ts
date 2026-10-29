import { getEmDashCollection, getEmDashEntry } from "emdash";
import type { CacheHint, MediaValue, PortableTextBlock } from "emdash";
import type { PricingItem } from "../../.emdash/types";

export type CampaignTheme = "standard" | "halloween" | "christmas" | "valentines" | "spring";

export type Campaign = {
  id: string;
  slug: string | null;
  status: string;
  title: string;
  eyebrow?: string;
  summary?: string;
  content?: PortableTextBlock[];
  hero_image?: MediaValue;
  metadata_image?: MediaValue;
  enabled?: boolean;
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

export type CampaignProduct = {
  id: string;
  slug: string | null;
  status: string;
  sort?: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
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
  sort: number;
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
  now = new Date(),
): Campaign | undefined {
  return campaigns
    .filter((campaign) => isCampaignActive(campaign, now))
    .toSorted((a, b) => {
      const aEndsAt = toTimestamp(a.end_at) ?? Number.POSITIVE_INFINITY;
      const bEndsAt = toTimestamp(b.end_at) ?? Number.POSITIVE_INFINITY;
      if (aEndsAt !== bEndsAt) return bEndsAt - aEndsAt;

      return (toTimestamp(b.updatedAt) ?? 0) - (toTimestamp(a.updatedAt) ?? 0);
    })[0];
}

export async function getPromotedCampaign(now = new Date()): Promise<{
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

export async function getCampaignProducts(campaignId: string): Promise<{
  products: EditableCampaignProduct[];
  error?: Error;
  cacheHints: CacheHint[];
}> {
  const assignments = await getEmDashCollection<"campaign_products", CampaignProduct>("campaign_products", {
    status: "published",
    orderBy: { sort: "asc" },
  });
  const cacheHints = [assignments.cacheHint];
  if (assignments.error) {
    return { products: [], error: assignments.error, cacheHints };
  }

  const resolved = await Promise.all(
    assignments.entries.map((assignment) =>
      getEmDashEntry<
        "campaign_products",
        CampaignProduct,
        { campaign: true; product: true }
      >("campaign_products", assignment.id, {
          references: { campaign: true, product: true },
        }),
    ),
  );
  cacheHints.push(...resolved.map((result) => result.cacheHint));

  const error = resolved.find((result) => result.error)?.error;
  if (error) return { products: [], error, cacheHints };

  const seen = new Set<string>();
  const products: EditableCampaignProduct[] = [];

  for (const result of resolved) {
    if (!result.entry) continue;
    const campaign = result.entry.references?.campaign.entries[0];
    const product = result.entry.references?.product.entries[0];
    const campaignData = campaign?.data as Campaign | undefined;
    const productData = product?.data as CatalogProduct | undefined;
    if (!campaignData || campaignData.id !== campaignId || !product || productData?.status !== "published") {
      continue;
    }
    if (seen.has(productData.id)) continue;

    seen.add(productData.id);
    products.push({
      id: product.id,
      data: productData,
      edit: product.edit as Record<string, Record<string, unknown>>,
      sort: result.entry.data.sort ?? 0,
    });
  }

  products.sort((a, b) => a.sort - b.sort);
  return { products, cacheHints };
}

export function getCampaignTheme(theme?: CampaignTheme): CampaignTheme {
  return ["halloween", "christmas", "valentines", "spring"].includes(theme ?? "")
    ? (theme as CampaignTheme)
    : "standard";
}
