import { describe, expect, it, vi } from "vitest";
import {
  handleAgentInquirySubmit,
  toStructuredInquiryResult,
} from "./inquiry-webmcp";

function createEvent(agentInvoked: boolean) {
  const respondWith = vi.fn();

  return {
    event: {
      agentInvoked,
      preventDefault: vi.fn(),
      respondWith,
    } as unknown as SubmitEvent & {
      agentInvoked: boolean;
      respondWith(promise: Promise<unknown>): void;
    },
    respondWith,
  };
}

describe("inquiry WebMCP submission", () => {
  it("leaves human submissions alone", () => {
    const { event, respondWith } = createEvent(false);
    const submit = vi.fn();

    expect(handleAgentInquirySubmit(event, new FormData(), submit)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(respondWith).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });

  it("prevents navigation and returns a structured success result for agents", async () => {
    const { event, respondWith } = createEvent(true);
    const submit = vi.fn().mockResolvedValue({ data: { success: true } });

    expect(handleAgentInquirySubmit(event, new FormData(), submit)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(respondWith).toHaveBeenCalledOnce();

    const [response] = respondWith.mock.calls[0] as [Promise<unknown>];
    await expect(response).resolves.toEqual({ success: true });
    expect(submit).toHaveBeenCalledOnce();
  });

  it("returns validation fields in a structured error result", () => {
    expect(
      toStructuredInquiryResult({
        error: {
          code: "BAD_REQUEST",
          fields: { email: ["A valid email address is required"] },
          message: "Input validation failed.",
        },
      }),
    ).toEqual({
      success: false,
      error: {
        code: "BAD_REQUEST",
        fields: { email: ["A valid email address is required"] },
        message: "Input validation failed.",
      },
    });
  });

  it("returns a structured error when submission fails", async () => {
    const { event, respondWith } = createEvent(true);
    const submit = vi
      .fn()
      .mockRejectedValue(new Error("Email service unavailable"));

    handleAgentInquirySubmit(event, new FormData(), submit);

    const [response] = respondWith.mock.calls[0] as [Promise<unknown>];
    await expect(response).resolves.toEqual({
      success: false,
      error: {
        code: "SUBMISSION_FAILED",
        message: "Email service unavailable",
      },
    });
  });
});
