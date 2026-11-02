import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatInquiryPrice, type InquiryPackage } from "@/lib/inquiry-pricing";

export type InquiryFieldErrors = Record<string, string[] | undefined>;

export function InquirySuccess() {
  return (
    <div className="form-success">
      <h2 className="success-title">We got it!</h2>
      <p className="success-body">
        This is a request, not a confirmed order. James will get back to you within 48 hours
        to confirm availability, details, and final pricing.
      </p>
    </div>
  );
}

export function ContactFields({ fieldErrors }: { fieldErrors: InquiryFieldErrors }) {
  return (
    <div className="form-section">
      <p className="form-section-label" data-step="1">Contact Info</p>
      <div className="field-row two-col">
        <div className="field">
          <Label htmlFor="name">
            Your Name <span className="required">*</span>
          </Label>
          <Input id="name" name="name" placeholder="James Smith" required aria-describedby={fieldErrors.name ? "name-error" : undefined} />
          {fieldErrors.name && (
            <p id="name-error" className="field-error">{fieldErrors.name.join(", ")}</p>
          )}
        </div>
        <div className="field">
          <Label htmlFor="email">
            Email Address <span className="required">*</span>
          </Label>
          <Input id="email" name="email" type="email" placeholder="you@email.com" required aria-describedby={fieldErrors.email ? "email-error" : undefined} />
          {fieldErrors.email && (
            <p id="email-error" className="field-error">{fieldErrors.email.join(", ")}</p>
          )}
        </div>
      </div>
      <div className="field" style={{ marginTop: "1.25rem" }}>
        <Label htmlFor="phone">
          Phone Number{" "}
          <span className="optional">(optional, faster response)</span>
        </Label>
        <Input id="phone" name="phone" type="tel" placeholder="(901) 555-0100" />
      </div>
    </div>
  );
}

interface PackageRequestFieldsProps {
  packages: InquiryPackage[];
  packageStep: number;
  notesStep: number;
  allowCustomRequest?: boolean;
  onSelectionChange?: (hasSelection: boolean) => void;
}

export function PackageRequestFields({
  packages,
  packageStep,
  notesStep,
  allowCustomRequest = true,
  onSelectionChange,
}: PackageRequestFieldsProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const stepQuantity = (key: string, delta: number) => {
    setQuantities((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(50, (current[key] ?? 0) + delta)),
    }));
  };
  const selected = packages.filter((item) => (quantities[item.key] ?? 0) > 0);
  useEffect(() => {
    onSelectionChange?.(selected.length > 0);
  }, [onSelectionChange, selected.length]);
  const order = selected.map((item) => ({
    key: item.key,
    quantity: quantities[item.key],
    unitAmount: item.amount,
  }));
  const totalCents = selected.reduce(
    (sum, item) => sum + (item.amount === null ? 0 : Math.round(item.amount * 100) * quantities[item.key]),
    0,
  );
  const hasQuoteOnlyItems = selected.some((item) => item.amount === null);
  const groups = Array.from(new Set(packages.map((item) => item.itemId))).map(
    (itemId) => ({
      itemId,
      title: packages.find((item) => item.itemId === itemId)!.title,
      description: packages.find((item) => item.itemId === itemId)?.description,
      options: packages.filter((item) => item.itemId === itemId),
    }),
  );

  return (
    <>
      <input type="hidden" name="order" value={JSON.stringify(order)} />
      <div className="form-section">
        <p className="form-section-label" data-step={packageStep}>Choose Your Treats</p>
        <p className="field-hint" style={{ marginBottom: "1.25rem" }}>
          {allowCustomRequest
            ? "Enter how many of each package you'd like. Leave everything at zero for a custom request."
            : "Enter how many of each package you'd like."}
        </p>
        {groups.length > 0 ? (
          <div className="package-list">
            {groups.map((group) => (
              <div key={group.itemId} className="package-group">
                <h3>{group.title}</h3>
                {group.description && <p>{group.description}</p>}
                {group.options.map((item) => (
                  <div key={item.key} className="package-option">
                    <Label htmlFor={`package-${item.key}`}>
                      <span>{item.label}</span>
                      <span className="package-price">
                        {item.amount === null ? "Quote after review" : formatInquiryPrice(item.amount)}
                      </span>
                    </Label>
                    <div className="package-stepper">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label={`Decrease ${group.title} ${item.label} quantity`}
                        disabled={(quantities[item.key] ?? 0) === 0}
                        onClick={() => stepQuantity(item.key, -1)}
                      >
                        <Minus aria-hidden="true" />
                      </Button>
                      <Input
                        id={`package-${item.key}`}
                        type="number"
                        min={0}
                        max={50}
                        step={1}
                        inputMode="numeric"
                        value={quantities[item.key] ?? 0}
                        onChange={(event) => {
                          const value = event.currentTarget.valueAsNumber;
                          setQuantities((current) => ({
                            ...current,
                            [item.key]: Number.isFinite(value) ? Math.max(0, Math.min(50, Math.floor(value))) : 0,
                          }));
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label={`Increase ${group.title} ${item.label} quantity`}
                        disabled={(quantities[item.key] ?? 0) === 50}
                        onClick={() => stepQuantity(item.key, 1)}
                      >
                        <Plus aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="field-hint">
            {allowCustomRequest
              ? "Package pricing is being updated. Tell us what you'd like in the notes below."
              : "Seasonal package pricing is being updated. Please check back soon."}
          </p>
        )}
        <div className="estimate" aria-live="polite">
          {selected.length > 0 ? (
            <div className="estimate-total">
              <span>{hasQuoteOnlyItems ? "Estimated priced subtotal" : "Estimated total"}</span>
              <span>
                {totalCents > 0 ? formatInquiryPrice(totalCents / 100) : "Quote after review"}
                {hasQuoteOnlyItems && totalCents > 0 ? " + quoted items" : ""}
              </span>
            </div>
          ) : (
            <strong>No packages selected yet</strong>
          )}
          <p>Custom designs and extras may change the final quote. We'll confirm the price before anything is finalized.</p>
        </div>
      </div>

      <div className="form-section">
        <p className="form-section-label" data-step={notesStep}>Anything Else?</p>
        <div className="field">
          <Label htmlFor="notes">
            Message / Notes <span className="optional">{allowCustomRequest && selected.length === 0 ? "(required for custom requests)" : "(optional)"}</span>
          </Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Allergies, flavor preferences, special requests, theme colors, questions, anything you want us to know!"
            required={allowCustomRequest && selected.length === 0}
          />
        </div>
      </div>
    </>
  );
}

interface InquirySubmitFooterProps {
  pending: boolean;
  generalError: string | null;
  disabled?: boolean;
}

export function InquirySubmitFooter({ pending, generalError, disabled = false }: InquirySubmitFooterProps) {
  return (
    <div className="form-footer">
      <div>
        <p className="form-footer-note">
          <strong>No payment yet.</strong> This is an inquiry. We'll reach out within
          48 hours to confirm availability and final pricing. Submitting this request does not confirm an order.
        </p>
        {generalError && (
          <p className="field-error" style={{ marginTop: "0.75rem" }}>
            {generalError}
          </p>
        )}
      </div>
      <Button type="submit" variant="neo" size="lg" className="submit-btn" disabled={pending || disabled}>
        {pending ? "Sending…" : "Send My Inquiry"}
      </Button>
    </div>
  );
}
