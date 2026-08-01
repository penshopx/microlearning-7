import OpenAI from "openai";

/** Classify an error thrown by the OpenAI SDK or a plain fetch. */
export interface OpenAIErrorInfo {
  isQuotaError: boolean;
  isRateLimitError: boolean;
  /** True for either quota or rate-limit — i.e. "the AI is temporarily unavailable" */
  isAIUnavailable: boolean;
  /** Ready-to-display Indonesian message for the end user */
  userMessage: string;
  /** Machine-readable code */
  code: "insufficient_quota" | "rate_limit_exceeded" | "other";
}

export function classifyOpenAIError(err: unknown): OpenAIErrorInfo {
  // OpenAI SDK wraps HTTP errors as APIError with .status and .code
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      const isQuota =
        err.code === "insufficient_quota" ||
        (err.message ?? "").toLowerCase().includes("quota");

      if (isQuota) {
        return {
          isQuotaError: true,
          isRateLimitError: false,
          isAIUnavailable: true,
          userMessage:
            "Kuota AI saat ini telah habis. Silakan hubungi administrator untuk mengisi ulang kuota API.",
          code: "insufficient_quota",
        };
      }

      return {
        isQuotaError: false,
        isRateLimitError: true,
        isAIUnavailable: true,
        userMessage:
          "Terlalu banyak permintaan AI dalam waktu singkat. Silakan tunggu beberapa saat lalu coba lagi.",
        code: "rate_limit_exceeded",
      };
    }
  }

  return {
    isQuotaError: false,
    isRateLimitError: false,
    isAIUnavailable: false,
    userMessage: "",
    code: "other",
  };
}
