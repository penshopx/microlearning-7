import OpenAI from "openai";
import {
  AI_ADMIN_URL,
  AI_API_KEY_ERROR_CODE,
  AI_API_KEY_ERROR_MESSAGE,
} from "@/lib/ai-error-contract";

export { AI_API_KEY_ERROR_CODE, AI_API_KEY_ERROR_MESSAGE };

/** Classify an error thrown by the OpenAI SDK or a plain fetch. */
export interface OpenAIErrorInfo {
  isApiKeyError: boolean;
  isQuotaError: boolean;
  isRateLimitError: boolean;
  /** True when the provider cannot currently serve the request. */
  isAIUnavailable: boolean;
  /** Ready-to-display Indonesian message for the end user */
  userMessage: string;
  /** Machine-readable code */
  code: typeof AI_API_KEY_ERROR_CODE | "insufficient_quota" | "rate_limit_exceeded" | "other";
}

export interface OpenAIErrorResponse {
  status: 429 | 503;
  body: {
    error: string;
    code: OpenAIErrorInfo["code"];
    adminUrl?: string;
  };
}

export function getOpenAIErrorResponse(err: unknown): OpenAIErrorResponse | null {
  const info = classifyOpenAIError(err);
  if (!info.isAIUnavailable) return null;

  return {
    status: info.isApiKeyError ? 503 : 429,
    body: {
      error: info.userMessage,
      code: info.code,
      ...(info.isApiKeyError ? { adminUrl: AI_ADMIN_URL } : {}),
    },
  };
}

export function classifyOpenAIError(err: unknown): OpenAIErrorInfo {
  // OpenAI SDK wraps HTTP errors as APIError with .status and .code. The
  // structural check also handles errors crossing a duplicated SDK boundary
  // and makes this safe for plain fetch-style errors in tests.
  const status =
    err instanceof OpenAI.APIError
      ? err.status
      : typeof err === "object" && err !== null && "status" in err
        ? (err as { status?: number }).status
        : undefined;
  const errorCode =
    typeof err === "object" && err !== null && "code" in err
      ? (err as { code?: string }).code
      : undefined;
  const errorMessage = err instanceof Error ? err.message : "";

  if (status === 401) {
    return {
      isApiKeyError: true,
      isQuotaError: false,
      isRateLimitError: false,
      isAIUnavailable: true,
      userMessage: AI_API_KEY_ERROR_MESSAGE,
      code: AI_API_KEY_ERROR_CODE,
    };
  }

  if (status === 429) {
    const isQuota =
      errorCode === "insufficient_quota" ||
      errorMessage.toLowerCase().includes("quota");

    if (isQuota) {
      return {
        isApiKeyError: false,
        isQuotaError: true,
        isRateLimitError: false,
        isAIUnavailable: true,
        userMessage:
          "Kuota AI saat ini telah habis. Silakan hubungi administrator untuk mengisi ulang kuota API.",
        code: "insufficient_quota",
      };
    }

    return {
      isApiKeyError: false,
      isQuotaError: false,
      isRateLimitError: true,
      isAIUnavailable: true,
      userMessage:
        "Terlalu banyak permintaan AI dalam waktu singkat. Silakan tunggu beberapa saat lalu coba lagi.",
      code: "rate_limit_exceeded",
    };
  }

  return {
    isApiKeyError: false,
    isQuotaError: false,
    isRateLimitError: false,
    isAIUnavailable: false,
    userMessage: "",
    code: "other",
  };
}
