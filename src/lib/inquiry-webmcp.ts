export type InquiryActionResult = {
  data?: unknown;
  error?: {
    code?: string;
    fields?: Record<string, string[]>;
    message?: string;
  };
};

export type AgentSubmitEvent = SubmitEvent & {
  agentInvoked: boolean;
  respondWith(promise: Promise<unknown>): void;
};

export type StructuredInquiryResult =
  | { success: true }
  | {
      success: false;
      error: {
        code: string;
        fields?: Record<string, string[]>;
        message: string;
      };
    };

export function handleAgentInquirySubmit(
  event: AgentSubmitEvent,
  formData: FormData,
  submit: (formData: FormData) => Promise<InquiryActionResult>,
): boolean {
  if (!event.agentInvoked) return false;

  event.preventDefault();
  event.respondWith(
    submit(formData)
      .then((result) => toStructuredInquiryResult(result))
      .catch((error: unknown) => ({
        success: false,
        error: {
          code: "SUBMISSION_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to submit your inquiry. Please try again.",
        },
      })),
  );

  return true;
}

export function toStructuredInquiryResult(
  result: InquiryActionResult,
): StructuredInquiryResult {
  if (!result.error) return { success: true };

  return {
    success: false,
    error: {
      code: result.error.code ?? "SUBMISSION_FAILED",
      ...(result.error.fields ? { fields: result.error.fields } : {}),
      message:
        result.error.message ??
        "Failed to submit your inquiry. Please try again.",
    },
  };
}
