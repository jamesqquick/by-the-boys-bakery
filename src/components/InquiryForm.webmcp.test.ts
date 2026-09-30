import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const formSource = readFileSync(
  new URL("./InquiryForm.tsx", import.meta.url),
  "utf8",
);

describe("inquiry form WebMCP metadata", () => {
  it("declares the inquiry tool and autosubmission", () => {
    expect(formSource).toContain('toolname="submit_order_inquiry"');
    expect(formSource).toContain(
      'tooldescription="Submits a new bakery order inquiry."',
    );
    expect(formSource).toContain("toolautosubmit");
  });

  it("keeps stable names, labels, and descriptions for every inquiry field", () => {
    for (const field of [
      "name",
      "email",
      "phone",
      "occasion",
      "date",
      "treats",
      "quantity",
      "budget",
      "notes",
    ]) {
      expect(formSource).toContain(`name="${field}"`);
    }

    for (const field of [
      "name",
      "email",
      "phone",
      "occasion",
      "date",
      "quantity",
      "budget",
      "notes",
    ]) {
      expect(formSource).toContain(`htmlFor="${field}"`);
    }

    expect(formSource).toContain(
      '<label key={treat.id} className="treat-option">',
    );
    expect(formSource).toContain('name="name"');
    expect(formSource).toContain('name="email"');
    expect(formSource).toContain('name="occasion"');
    expect(formSource).toContain('name="date"');
    expect(formSource).toContain('name="quantity"');

    for (const description of [
      "The customer's full name.",
      "The customer's email address for follow-up.",
      "An optional phone number for faster follow-up.",
      "The occasion for the bakery inquiry.",
      "The date the treats are needed by.",
      "Treat types the customer is interested in; multiple treats may be selected.",
      "The approximate number of guests the treats should serve.",
      "The customer's rough budget for the inquiry.",
      "Optional allergies, flavor preferences, themes, special requests, or questions.",
    ]) {
      expect(formSource).toContain(`toolparamdescription="${description}"`);
    }
  });
});
