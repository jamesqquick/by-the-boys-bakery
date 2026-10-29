import assert from "node:assert/strict";
import test from "node:test";
import type { Campaign } from "../src/lib/seasonal-campaigns.ts";
import { isCampaignActive, selectPromotedCampaign } from "../src/lib/seasonal-campaigns.ts";

const now = new Date("2026-10-15T12:00:00.000Z");

function campaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: crypto.randomUUID(),
    slug: "special",
    status: "published",
    title: "Special",
    enabled: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

test("campaign activity requires publication, enablement, and a matching date window", () => {
  assert.equal(isCampaignActive(campaign(), now), true);
  assert.equal(isCampaignActive(campaign({ enabled: false }), now), false);
  assert.equal(isCampaignActive(campaign({ status: "draft" }), now), false);
  assert.equal(
    isCampaignActive(campaign({ start_at: new Date("2026-10-16T00:00:00.000Z") }), now),
    false,
  );
  assert.equal(
    isCampaignActive(campaign({ end_at: new Date("2026-10-14T23:59:59.000Z") }), now),
    false,
  );
});

test("promotion selection chooses the active campaign with the latest end date", () => {
  const halloween = campaign({
    id: "halloween",
    slug: "halloween",
    end_at: new Date("2026-10-31T23:59:59.000Z"),
  });
  const christmas = campaign({
    id: "christmas",
    slug: "christmas",
    end_at: new Date("2026-12-25T23:59:59.000Z"),
  });

  assert.equal(selectPromotedCampaign([halloween, christmas], now)?.id, "christmas");
});

test("a campaign without an end date wins as an indefinite campaign", () => {
  const dated = campaign({
    id: "dated",
    end_at: new Date("2027-01-01T00:00:00.000Z"),
  });
  const indefinite = campaign({ id: "indefinite" });

  assert.equal(selectPromotedCampaign([dated, indefinite], now)?.id, "indefinite");
});

test("promotion selection uses the latest update as a deterministic tie breaker", () => {
  const first = campaign({
    id: "first",
    end_at: new Date("2026-10-31T23:59:59.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
  });
  const second = campaign({
    id: "second",
    end_at: new Date("2026-10-31T23:59:59.000Z"),
    updatedAt: new Date("2026-10-02T00:00:00.000Z"),
  });

  assert.equal(selectPromotedCampaign([first, second], now)?.id, "second");
});
