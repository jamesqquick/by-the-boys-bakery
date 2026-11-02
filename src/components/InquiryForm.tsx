import { actions, isInputError } from "astro:actions";
import { withState } from "@astrojs/react/actions";
import { useActionState } from "react";
import {
  ContactFields,
  InquirySubmitFooter,
  InquirySuccess,
  PackageRequestFields,
  type InquiryFieldErrors,
} from "@/components/inquiry/InquiryFormShared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InquiryPackage } from "@/lib/inquiry-pricing";
import "@/styles/inquiry.css";

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

interface InquiryFormProps {
  packages: InquiryPackage[];
}

export default function InquiryForm({ packages }: InquiryFormProps) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(
    submitInquiry,
    { data: undefined, error: undefined },
  );
  if (state.data?.success) {
    return <InquirySuccess />;
  }

  const fieldErrors: InquiryFieldErrors = isInputError(state.error) ? state.error.fields : {};
  const generalError =
    state.error && !isInputError(state.error)
      ? (state.error.message ?? "Something went wrong. Please try again.")
      : null;

  return (
    <form className="inquiry-form" action={action}>
      <ContactFields fieldErrors={fieldErrors} />

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

      <PackageRequestFields packages={packages} packageStep={3} notesStep={4} />
      <InquirySubmitFooter pending={pending} generalError={generalError} />
    </form>
  );
}
