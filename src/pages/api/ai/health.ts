import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export type AIHealthStatus = "ok" | "missing" | "invalid" | "unreachable";

export interface AIHealthResponse {
  status: AIHealthStatus;
  message: string;
  checkedAt: string;
}

/**
 * GET /api/ai/health
 *
 * Validates the AI integration credentials (AI_INTEGRATIONS_OPENAI_API_KEY /
 * AI_INTEGRATIONS_OPENAI_BASE_URL) used by every AI endpoint in this app.
 *
 * Authorization: authenticated user whose profile row has role = "admin"
 * (same policy as /api/admin/ai-status).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIHealthResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return res.status(401).json({ error: "Unauthorized" });

  // ── Admin gate (server-side, profiles table) ─────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ── Check credentials ────────────────────────────────────────────────────
  const checkedAt = new Date().toISOString();
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your-api-key-here") {
    return res.status(200).json({
      status: "missing",
      message: "AI_INTEGRATIONS_OPENAI_API_KEY environment variable is not set.",
      checkedAt,
    });
  }

  // Validate against the configured provider (custom base URL or OpenAI default).
  const modelsUrl = baseURL
    ? `${baseURL.replace(/\/$/, "")}/models`
    : "https://api.openai.com/v1/models";

  try {
    const response = await fetch(modelsUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.ok) {
      return res.status(200).json({
        status: "ok",
        message: "AI integration key is valid and the provider is reachable.",
        checkedAt,
      });
    }

    if (response.status === 401) {
      return res.status(200).json({
        status: "invalid",
        message:
          "AI_INTEGRATIONS_OPENAI_API_KEY was rejected (401 Unauthorized). " +
          "Check that the key is correct and active.",
        checkedAt,
      });
    }

    // Other HTTP errors (rate-limit, 5xx) — key likely fine, provider issue.
    return res.status(200).json({
      status: "ok",
      message: `Provider responded with HTTP ${response.status}; key appears configured.`,
      checkedAt,
    });
  } catch {
    // Network failure — cannot determine key validity.
    return res.status(200).json({
      status: "unreachable",
      message:
        "Could not reach the AI provider endpoint. " +
        (baseURL
          ? `Check that AI_INTEGRATIONS_OPENAI_BASE_URL (${baseURL}) is correct.`
          : "Check your network connectivity or OpenAI service status."),
      checkedAt,
    });
  }
}
