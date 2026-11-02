import { actions, isInputError } from "astro:actions";
import { withState } from "@astrojs/react/actions";
import { useActionState, useState } from "react";
import {
  ContactFields,
  InquirySubmitFooter,
  InquirySuccess,
  PackageRequestFields,
  type InquiryFieldErrors,
} from "@/components/inquiry/InquiryFormShared";
import type { InquiryPackage } from "@/lib/inquiry-pricing";
import "@/styles/inquiry.css";

type SeasonalInquiryResult = Awaited<ReturnType<typeof actions.submitSeasonalInquiry>>;
type SeasonalInquiryState = SeasonalInquiryResult | { data: undefined; error: undefined };

const submitSeasonalInquiry = withState(actions.submitSeasonalInquiry) as (
  state: SeasonalInquiryState,
  formData: FormData,
) => Promise<SeasonalInquiryState>;

interface SeasonalInquiryFormProps {
  packages: InquiryPackage[];
  campaignSlug: string;
}

export default function SeasonalInquiryForm({ packages, campaignSlug }: SeasonalInquiryFormProps) {
  const [hasSelectedPackage, setHasSelectedPackage] = useState(false);
  const [state, action, pending] = useActionState<SeasonalInquiryState, FormData>(
    submitSeasonalInquiry,
    { data: undefined, error: undefined },
  );

  if (state.data?.success) return <InquirySuccess />;

  const fieldErrors: InquiryFieldErrors = isInputError(state.error) ? state.error.fields : {};
  const generalError =
    state.error && !isInputError(state.error)
      ? (state.error.message ?? "Something went wrong. Please try again.")
      : null;

  return (
    <form className="inquiry-form" action={action}>
      <input type="hidden" name="campaign" value={campaignSlug} />
      <ContactFields fieldErrors={fieldErrors} />
      <PackageRequestFields
        packages={packages}
        packageStep={2}
        notesStep={3}
        allowCustomRequest={false}
        onSelectionChange={setHasSelectedPackage}
      />
      <InquirySubmitFooter
        pending={pending}
        generalError={generalError}
        disabled={!hasSelectedPackage}
      />
    </form>
  );
}
