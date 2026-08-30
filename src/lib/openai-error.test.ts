import { describe, expect, it } from "vitest";
import {
  classifyOpenAIError,
  getOpenAIErrorResponse,
} from "@/lib/openai-error";

const QUOTA_MESSAGE =
  "Kuota AI saat ini telah habis. Silakan hubungi administrator untuk mengisi ulang kuota API.";
const RATE_LIMIT_MESSAGE =
  "Terlalu banyak permintaan AI dalam waktu singkat. Silakan tunggu beberapa saat lalu coba lagi.";
const SERVICE_UNAVAILABLE_MESSAGE =
  "Layanan AI sedang mengalami gangguan sementara. Silakan coba lagi dalam beberapa saat.";

describe("classifyOpenAIError", () => {
  it("classifies an insufficient quota response as an unavailable AI service", () => {
    const result = classifyOpenAIError({
      status: 429,
      code: "insufficient_quota",
    });

    expect(result).toEqual({
      isApiKeyError: false,
      isQuotaError: true,
      isRateLimitError: false,
      isAIUnavailable: true,
      userMessage: QUOTA_MESSAGE,
      code: "insufficient_quota",
    });
  });

  it("classifies a 429 response without a quota code as a rate limit", () => {
    const result = classifyOpenAIError({
      status: 429,
    });

    expect(result).toEqual({
      isApiKeyError: false,
      isQuotaError: false,
      isRateLimitError: true,
      isAIUnavailable: true,
      userMessage: RATE_LIMIT_MESSAGE,
      code: "rate_limit_exceeded",
    });
  });

  it.each([500, 502, 503])(
    "classifies a %i provider outage as an unavailable AI service",
    (status) => {
      const result = classifyOpenAIError({ status });

      expect(result).toEqual({
        isApiKeyError: false,
        isQuotaError: false,
        isRateLimitError: false,
        isAIUnavailable: true,
        userMessage: SERVICE_UNAVAILABLE_MESSAGE,
        code: "service_unavailable",
      });
    },
  );

  it("does not expose a non-AI error as an unavailable AI service", () => {
    const result = classifyOpenAIError({
      status: 400,
      code: "invalid_request_error",
    });

    expect(result).toEqual({
      isApiKeyError: false,
      isQuotaError: false,
      isRateLimitError: false,
      isAIUnavailable: false,
      userMessage: "",
      code: "other",
    });
  });

  it("returns a 503 response with the outage message for API consumers", () => {
    expect(getOpenAIErrorResponse({ status: 503 })).toEqual({
      status: 503,
      body: {
        error: SERVICE_UNAVAILABLE_MESSAGE,
        code: "service_unavailable",
      },
    });
  });

  it("returns a 429 response with the quota message for API consumers", () => {
    expect(
      getOpenAIErrorResponse({
        status: 429,
        code: "insufficient_quota",
      }),
    ).toEqual({
      status: 429,
      body: {
        error: QUOTA_MESSAGE,
        code: "insufficient_quota",
      },
    });
  });

  it("returns a 429 response with the rate-limit message for API consumers", () => {
    expect(getOpenAIErrorResponse({ status: 429 })).toEqual({
      status: 429,
      body: {
        error: RATE_LIMIT_MESSAGE,
        code: "rate_limit_exceeded",
      },
    });
  });
});