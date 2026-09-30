import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InquiryPricingError,
  makeInquiryPackages,
  priceInquiry,
} from "./inquiry-pricing.ts";

const items = [
  { id: "cupcake-id", slug: "cupcakes", title: "Cupcakes", subtitle: "12 regular or 24 mini", sort: 1 },
  { id: "cookie-id", slug: "cookies", title: "Cookies", subtitle: "Per dozen", sort: 2 },
  { id: "cake-id", slug: "cakes", title: "Cakes", sort: 3 },
];
const options = [
  { id: "cupcake-option", item: "cupcake-id", amount: 28, sort: 1 },
  { id: "cookie-option", item: "cookie-id", amount: 28, sort: 1 },
  { id: "cake-6", item: "cake-id", label: "6-inch", amount: 30, sort: 1 },
  { id: "cake-8", item: "cake-id", label: "8-inch", amount: 40, sort: 2 },
];

const packages = makeInquiryPackages(items, options);

test("builds package choices from CMS data, including both cupcake formats", () => {
  assert.deepEqual(packages.map(({ key, label, amount }) => [key, label, amount]), [
    ["cupcake-option:regular", "12 regular", 28],
    ["cupcake-option:mini", "24 mini", 28],
    ["cookie-option", "Per dozen", 28],
    ["cake-6", "6-inch", 30],
    ["cake-8", "8-inch", 40],
  ]);
});

test("prices multiple packages and both cake sizes from current CMS amounts", () => {
  const order = priceInquiry(JSON.stringify([
    { key: "cookie-option", quantity: 2, unitAmount: 28 },
    { key: "cake-6", quantity: 1, unitAmount: 30 },
    { key: "cake-8", quantity: 1, unitAmount: 40 },
    { key: "cupcake-option:mini", quantity: 3, unitAmount: 28 },
  ]), packages, "");

  assert.equal(order.total, 210);
  assert.deepEqual(order.lines.map(({ lineTotal }) => lineTotal), [56, 30, 40, 84]);
});

test("allows a custom-only inquiry with notes and no subtotal", () => {
  assert.deepEqual(priceInquiry("[]", packages, "Custom character cake"), {
    lines: [], total: 0,
  });
});

test("rejects an empty inquiry, duplicate lines, tampered prices, and unavailable choices", () => {
  for (const [lines, notes] of [
    [[], ""],
    [[{ key: "cake-6", quantity: 1, unitAmount: 30 }, { key: "cake-6", quantity: 1, unitAmount: 30 }], ""],
    [[{ key: "cake-6", quantity: 1, unitAmount: 1 }], ""],
    [[{ key: "removed-option", quantity: 1, unitAmount: 30 }], ""],
    [[{ key: "cake-6", quantity: 0, unitAmount: 30 }], ""],
    [[{ key: "cake-6", quantity: 51, unitAmount: 30 }], ""],
  ]) {
    assert.throws(() => priceInquiry(JSON.stringify(lines), packages, notes), InquiryPricingError);
  }
  assert.throws(() => priceInquiry("not JSON", packages, "Hi"), InquiryPricingError);
});
