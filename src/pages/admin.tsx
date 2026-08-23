import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { AIHealthResponse } from "@/pages/api/ai/health";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings2,
  Lock,
} from "lucide-react";

type CheckState = "idle" | "loading" | "done" | "error";

interface HealthCheck {
  state: CheckState;
  result: AIHealthResponse | null;
  errorMessage: string | null;
}

function StatusIcon({ status }: { status: AIHealthResponse["status"] | null }) {
  if (status === "ok") return <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
  if (status === "missing") return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
  if (status === "invalid") return <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />;
  if (status === "unreachable") return <ShieldQuestion className="w-5 h-5 text-orange-400 shrink-0" />;
  return <ShieldQuestion className="w-5 h-5 text-gray-400 shrink-0" />;
}

function StatusBadge({ status }: { status: AIHealthResponse["status"] | null }) {
  if (status === "ok") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700">Healthy</Badge>;
  if (status === "missing") return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700">Key Missing</Badge>;
  if (status === "invalid") return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700">Key Invalid</Badge>;
  if (status === "unreachable") return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700">Provider Unreachable</Badge>;
  return <Badge variant="outline" className="text-gray-400">Unknown</Badge>;
}

export default function AdminPage() {
  const { user, isLoggedIn, isLoading: authLoading, isAdmin } = useAuth();
  const [health, setHealth] = useState<HealthCheck>({ state: "idle", result: null, errorMessage: null });

  const checkAIHealth = useCallback(async () => {
    if (!user) return;

    setHealth({ state: "loading", result: null, errorMessage: null });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setHealth({ state: "error", result: null, errorMessage: "No active session token found." });
        return;
      }

      const res = await fetch("/api/ai/health", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setHealth({ state: "error", result: null, errorMessage: `Health endpoint returned HTTP ${res.status}.` });
        return;
      }

      const data: AIHealthResponse = await res.json();
      setHealth({ state: "done", result: data, errorMessage: null });
    } catch (err) {
      setHealth({
        state: "error",
        result: null,
        errorMessage: err instanceof Error ? err.message : "Unexpected error reaching /api/ai/health.",
      });
    }
  }, [user]);

  // Auto-run check when admin user is confirmed.
  useEffect(() => {
    if (!authLoading && isAdmin) {
      checkAIHealth();
    }
  }, [authLoading, isAdmin, checkAIHealth]);

  // ── Not loaded yet ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <>
        <SEO title="Admin — Chaesa Live" description="Admin panel" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
          <Card className="p-8 max-w-sm w-full text-center space-y-4">
            <Lock className="w-10 h-10 text-gray-400 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Login Required</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">You need to be logged in to access this page.</p>
            <Link href="/auth">
              <Button className="w-full">Log In</Button>
            </Link>
          </Card>
        </div>
      </>
    );
  }

  // ── Logged in but not an admin ──────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <>
        <SEO title="Admin — Chaesa Live" description="Admin panel" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
          <Card className="p-8 max-w-sm w-full text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This page is restricted to admin accounts.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">Back to Dashboard</Button>
            </Link>
          </Card>
        </div>
      </>
    );
  }

  // ── Admin view ──────────────────────────────────────────────────────────────
  const aiStatus = health.result?.status ?? null;
  const hasProblem = aiStatus === "missing" || aiStatus === "invalid" || aiStatus === "unreachable";

  return (
    <>
      <SEO title="Admin — Chaesa Live" description="Admin status and configuration panel" />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        <PageHeader title="Admin" icon={ShieldCheck} backHref="/dashboard" backLabel="Dashboard" />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings2 className="w-6 h-6 text-purple-600" />
              Admin Status
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              System health checks and configuration status for admins only.
            </p>
          </div>

          {/* ── AI key warning banner ─────────────────────────────────────── */}
          {health.state === "done" && hasProblem && (
            <Alert
              variant="destructive"
              className={
                aiStatus === "missing"
                  ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300"
                  : aiStatus === "unreachable"
                  ? "border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300"
                  : "border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300"
              }
            >
              <AlertTriangle
                className={`w-4 h-4 ${
                  aiStatus === "missing"
                    ? "text-red-500"
                    : aiStatus === "unreachable"
                    ? "text-orange-500"
                    : "text-yellow-500"
                }`}
              />
              <AlertTitle className="font-semibold text-base">
                {aiStatus === "missing"
                  ? "AI API Key is Not Configured"
                  : aiStatus === "unreachable"
                  ? "AI Provider is Unreachable"
                  : "AI API Key is Invalid"}
              </AlertTitle>
              <AlertDescription className="mt-1 space-y-3">
                <p className="text-sm leading-relaxed">
                  {health.result?.message}
                  {aiStatus !== "unreachable" && " AI features (course generation, story creation, exam generation, etc.) will fail for all users until this is resolved."}
                </p>
                {aiStatus !== "unreachable" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Get an API key from OpenAI
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-xs opacity-40">·</span>
                    <a
                      href="https://docs.replit.com/replit-workspace/workspace-features/secrets"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      How to set environment secrets on Replit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {aiStatus !== "unreachable" && (
                  <p className="text-xs opacity-70">
                    Set the{" "}
                    <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">
                      AI_INTEGRATIONS_OPENAI_API_KEY
                    </code>{" "}
                    secret in the Replit Secrets panel, then restart your server.
                  </p>
                )}
                {aiStatus === "unreachable" && (
                  <a
                    href="https://status.openai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    Check OpenAI service status
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* ── AI Health card ────────────────────────────────────────────── */}
          <Card className="p-5 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900 dark:text-white">OpenAI API Key</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={checkAIHealth}
                disabled={health.state === "loading"}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${health.state === "loading" ? "animate-spin" : ""}`} />
                {health.state === "loading" ? "Checking…" : "Re-check"}
              </Button>
            </div>

            {health.state === "idle" && (
              <p className="text-sm text-gray-400">Click Re-check to run the health check.</p>
            )}

            {health.state === "loading" && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                Contacting OpenAI…
              </div>
            )}

            {health.state === "error" && (
              <Alert variant="destructive" className="text-sm">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Check failed</AlertTitle>
                <AlertDescription>{health.errorMessage}</AlertDescription>
              </Alert>
            )}

            {health.state === "done" && health.result && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={aiStatus} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Status</span>
                      <StatusBadge status={aiStatus} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {health.result.message}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Last checked:{" "}
                  {new Date(health.result.checkedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            )}
          </Card>

          {/* ── Quick links ───────────────────────────────────────────────── */}
          <Card className="p-5 border border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-purple-600" />
              Quick Links
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  OpenAI API Keys dashboard
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://platform.openai.com/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Settings2 className="w-3.5 h-3.5 shrink-0" />
                  OpenAI usage &amp; billing
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.replit.com/replit-workspace/workspace-features/secrets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  Replit Secrets documentation
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </Card>
        </main>
      </div>
    </>
  );
}
