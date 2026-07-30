import { actions, isInputError } from "astro:actions";
import { withState } from "@astrojs/react/actions";
import { useActionState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

const TREATS = [
  { id: "cookies", label: "Cookies" },
  { id: "brownies", label: "Brownies" },
  { id: "cupcakes", label: "Cupcakes" },
  { id: "cakes", label: "Cakes" },
] as const;

export default function InquiryForm() {
  const [state, action, pending] = useActionState(
    withState(actions.submitInquiry),
    { data: undefined, error: undefined },
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
      </div>

      {/* ── Section 3: What you want ── */}
      <div className="form-section">
        <p className="form-section-label" data-step="3">What You're Looking For</p>
        <div className="field" style={{ marginBottom: "1.5rem" }}>
          <Label>Which treats interest you? <span className="optional">(check all that apply)</span></Label>
          <div className="treat-grid">
            {TREATS.map((treat) => (
              <label key={treat.id} className="treat-option">
                <Checkbox name="treats" value={treat.id} className="treat-checkbox" />
                <span className="treat-name">{treat.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field-row two-col">
          <div className="field">
            <Label htmlFor="quantity">
              Roughly how many people? <span className="required">*</span>
            </Label>
            <Select name="quantity" required>
              <SelectTrigger id="quantity" aria-describedby={fieldErrors.quantity ? "quantity-error" : undefined}>
                <SelectValue placeholder="Pick one..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-4">Just me / my household (1-4)</SelectItem>
                <SelectItem value="5-10">Small group (5-10)</SelectItem>
                <SelectItem value="11-25">Party (11-25)</SelectItem>
                <SelectItem value="26-50">Larger event (26-50)</SelectItem>
                <SelectItem value="50+">Big event (50+)</SelectItem>
                <SelectItem value="unsure">Not sure yet</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.quantity && (
              <p id="quantity-error" className="field-error">{fieldErrors.quantity.join(", ")}</p>
            )}
          </div>
          <div className="field">
            <Label htmlFor="budget">
              Rough budget?{" "}
              <span className="optional">(helps us plan)</span>
            </Label>
            <Select name="budget">
              <SelectTrigger id="budget">
                <SelectValue placeholder="Pick one..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-30">Under $30</SelectItem>
                <SelectItem value="30-60">$30 to $60</SelectItem>
                <SelectItem value="60-100">$60 to $100</SelectItem>
                <SelectItem value="100-200">$100 to $200</SelectItem>
                <SelectItem value="200+">$200+</SelectItem>
                <SelectItem value="unsure">No idea, you tell me!</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Section 4: Notes ── */}
      <div className="form-section">
        <p className="form-section-label" data-step="4">Anything Else?</p>
        <div className="field">
          <Label htmlFor="notes">
            Message / Notes <span className="optional">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Allergies, flavor preferences, special requests, theme colors, questions, anything you want us to know!"
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
