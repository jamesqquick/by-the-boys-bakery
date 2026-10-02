import { getEmDashCollection, getEmDashEntry } from "emdash";
import type { CacheHint } from "emdash";
import type { PricingOption } from "../../.emdash/types";

export type PricingOptionWithItem = PricingOption & { itemId: string | null };

export type EditablePricingOption = {
  id: string;
  data: PricingOptionWithItem;
  edit: Record<string, Record<string, unknown>>;
};

export async function getPricingOptions(status?: "published"): Promise<{
  entries: EditablePricingOption[];
  error?: Error;
  cacheHints: CacheHint[];
}> {
  const optionsResult = await getEmDashCollection("pricing_options", {
    ...(status ? { status } : {}),
    orderBy: { sort: "asc" },
  });
  const cacheHints = [optionsResult.cacheHint];

  if (optionsResult.error) {
    return { entries: [], error: optionsResult.error, cacheHints };
  }

  const resolvedOptions = await Promise.all(
    optionsResult.entries.map((option) =>
      getEmDashEntry("pricing_options", option.id, { references: { item: true } }),
    ),
  );
  const error = resolvedOptions.find((result) => result.error)?.error;
  cacheHints.push(...resolvedOptions.map((result) => result.cacheHint));

  if (error) {
    return { entries: [], error, cacheHints };
  }

  const entries: EditablePricingOption[] = [];
  for (const result of resolvedOptions) {
    if (!result.entry) continue;

    const item = result.entry.references?.item.entries[0];
    entries.push({
      id: result.entry.id,
      data: { ...result.entry.data, itemId: item?.data.id ?? null },
      edit: result.entry.edit as Record<string, Record<string, unknown>>,
    });
  }

  return { entries, cacheHints };
}
