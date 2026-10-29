import assert from "node:assert/strict";
import test from "node:test";
import { makeInquiryPackages, priceInquiry } from "../src/lib/inquiry-pricing.ts";

test("products without pricing remain selectable as quote-only requests", () => {
  const packages = makeInquiryPackages([
    {
      id: "seasonal-cake",
      slug: "seasonal-cake",
      title: "Seasonal Cake",
      subtitle: "Custom size",
      description: "Decorated for the season.",
    },
  ], []);

  assert.deepEqual(packages, [{
    key: "quote:seasonal-cake",
    itemId: "seasonal-cake",
    title: "Seasonal Cake",
    label: "Custom size",
    description: "Decorated for the season.",
    amount: null,
  }]);

  const priced = priceInquiry(
    JSON.stringify([{ key: "quote:seasonal-cake", quantity: 2, unitAmount: null }]),
    packages,
    "",
  );
  assert.equal(priced.total, 0);
  assert.equal(priced.lines[0]?.lineTotal, null);
  assert.equal(priced.lines[0]?.quantity, 2);
});

test("quote-only requests reject a forged unit amount", () => {
  const packages = makeInquiryPackages([
    { id: "seasonal-cake", slug: "seasonal-cake", title: "Seasonal Cake" },
  ], []);

  assert.throws(
    () => priceInquiry(
      JSON.stringify([{ key: "quote:seasonal-cake", quantity: 1, unitAmount: 0 }]),
      packages,
      "",
    ),
    /Prices have changed/,
  );
});
