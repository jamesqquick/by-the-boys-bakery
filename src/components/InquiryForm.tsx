import { actions, isInputError } from "astro:actions";
import { withState } from "@astrojs/react/actions";
import { useActionState, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatInquiryPrice, type InquiryPackage } from "@/lib/inquiry-pricing";

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

type InquiryResult = Awaited<ReturnType<typeof actions.submitInquiry>>;
type InquiryState = InquiryResult | { data: undefined; error: undefined };

const submitInquiry = withState(actions.submitInquiry) as (
  state: InquiryState,
  formData: FormData,
) => Promise<InquiryState>;

export default function InquiryForm({ packages }: { packages: InquiryPackage[] }) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(
    submitInquiry,
    { data: undefined, error: undefined },
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const stepQuantity = (key: string, delta: number) => {
    setQuantities((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(50, (current[key] ?? 0) + delta)),
    }));
  };
  const selected = packages.filter((item) => (quantities[item.key] ?? 0) > 0);
  const order = selected.map((item) => ({
    key: item.key,
    quantity: quantities[item.key],
    unitAmount: item.amount,
  }));
  const totalCents = selected.reduce(
    (sum, item) => sum + Math.round(item.amount * 100) * quantities[item.key],
    0,
  );
  const groups = Array.from(new Set(packages.map((item) => item.itemId))).map(
    (itemId) => ({
      itemId,
      title: packages.find((item) => item.itemId === itemId)!.title,
      description: packages.find((item) => item.itemId === itemId)?.description,
      options: packages.filter((item) => item.itemId === itemId),
    }),
  );

  if (state.data?.success) {
    return (
      <div className="form-success">
        <h2 className="success-title">We got it!</h2>
        <p className="success-body">
          James will get back to you within 48 hours to go over what we can make.
        </p>
      </div>
    );
  }

  const fieldErrors = isInputError(state.error) ? state.error.fields : {};
  const generalError =
    state.error && !isInputError(state.error)
      ? (state.error.message ?? "Something went wrong. Please try again.")
      : null;

  return (
    <form className="inquiry-form" action={action}>
      <input type="hidden" name="order" value={JSON.stringify(order)} />

      {/* ── Section 1: Contact ── */}
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

      {/* ── Section 2: Occasion ── */}
      <div className="form-section">
        <p className="form-section-label" data-step="2">The Occasion</p>
        <div className="field-row two-col">
          <div className="field">
            <Label htmlFor="occasion">
              Occasion <span className="required">*</span>
            </Label>
            <Select name="occasion" defaultValue="just-because" required>
              <SelectTrigger id="occasion" aria-describedby={fieldErrors.occasion ? "occasion-error" : undefined}>
                <SelectValue placeholder="Pick one..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="anniversary">Anniversary</SelectItem>
                <SelectItem value="baby-shower">Baby Shower</SelectItem>
                <SelectItem value="wedding">Wedding / Engagement</SelectItem>
                <SelectItem value="holiday">Holiday Gift</SelectItem>
                <SelectItem value="office">Office / Work Event</SelectItem>
                <SelectItem value="just-because">Just because</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.occasion && (
              <p id="occasion-error" className="field-error">{fieldErrors.occasion.join(", ")}</p>
            )}
          </div>
          <div className="field">
            <Label htmlFor="quantity">How many people? <span className="required">*</span></Label>
            <Select name="quantity" required>
              <SelectTrigger id="quantity" aria-describedby={fieldErrors.quantity ? "quantity-error" : undefined}>
                <SelectValue placeholder="Pick one..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-4">Just me / my household (1-4)</SelectItem>
                <SelectItem value="5-10">Small group (5-10)</SelectItem>
                <SelectItem value="11-24">Party (11-24)</SelectItem>
                <SelectItem value="25+">Large event (25+)</SelectItem>
                <SelectItem value="unsure">Not sure yet</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.quantity && (
              <p id="quantity-error" className="field-error">{fieldErrors.quantity.join(", ")}</p>
            )}
          </div>
        </div>
        <div className="field" style={{ marginTop: "1.5rem" }}>
          <Label htmlFor="date">
            When do you need it by? <span className="required">*</span>
          </Label>
          <Input id="date" name="date" type="date" defaultValue={defaultDate()} required aria-describedby={fieldErrors.date ? "date-error" : undefined} />
          <p className="field-hint">We typically need at least 5 to 7 days notice to plan and bake.</p>
          {fieldErrors.date && (
            <p id="date-error" className="field-error">{fieldErrors.date.join(", ")}</p>
          )}
        </div>
      </div>

      {/* ── Section 3: What you want ── */}
      <div className="form-section">
        <p className="form-section-label" data-step="3">Choose Your Treats</p>
        <p className="field-hint" style={{ marginBottom: "1.25rem" }}>
          Enter how many of each package you'd like. Leave everything at zero for a custom request.
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
                      <span className="package-price">{formatInquiryPrice(item.amount)}</span>
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
          <p className="field-hint">Package pricing is being updated. Tell us what you'd like in the notes below.</p>
        )}
        <div className="estimate" aria-live="polite">
          {selected.length > 0 ? (
            <div className="estimate-total"><span>Estimated total</span><span>{formatInquiryPrice(totalCents / 100)}</span></div>
          ) : (
            <strong>No packages selected yet</strong>
          )}
          <p>Custom designs and extras may change the final quote. We'll confirm the price before anything is finalized.</p>
        </div>
      </div>

      {/* ── Section 4: Notes ── */}
      <div className="form-section">
        <p className="form-section-label" data-step="4">Anything Else?</p>
        <div className="field">
          <Label htmlFor="notes">
            Message / Notes <span className="optional">{selected.length === 0 ? "(required for custom requests)" : "(optional)"}</span>
          </Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Allergies, flavor preferences, special requests, theme colors, questions, anything you want us to know!"
            required={selected.length === 0}
          />
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="form-footer">
        <div>
          <p className="form-footer-note">
            <strong>No payment yet.</strong> This is an inquiry. We'll reach out within
            48 hours to confirm availability before anything is finalized.
          </p>
          {generalError && (
            <p className="field-error" style={{ marginTop: "0.75rem" }}>
              {generalError}
            </p>
          )}
        </div>
        <Button type="submit" variant="neo" size="lg" className="submit-btn" disabled={pending}>
          {pending ? "Sending…" : "Send My Inquiry"}
        </Button>
      </div>
    </form>
  );
}
