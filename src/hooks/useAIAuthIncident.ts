import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AI_AUTH_INCIDENT_UPDATED_EVENT,
  type AIAuthIncident,
} from "@/lib/ai-auth-incident";

interface AIAuthStatus {
  incident: AIAuthIncident | null;
  status: "available" | "unavailable";
  hasKey?: boolean;
}

/** Poll shared admin-only incident metadata, never the provider health probe. */
export function useAIAuthStatus(userId: string | null, isAdmin: boolean): AIAuthStatus | null {
  const [snapshot, setSnapshot] = useState<{
    userId: string;
    value: AIAuthStatus;
  } | null>(null);

  useEffect(() => {
    setSnapshot(null);
    if (!userId || !isAdmin) return;
    let cancelled = false;
    let pending = false;
    const controller = new AbortController();
    const unavailable = () => {
      if (cancelled) return;
      setSnapshot(previous => ({
        userId,
        value: {
          incident: previous?.userId === userId ? previous.value.incident : null,
          status: "unavailable",
        },
      }));
    };
    const refresh = async () => {
      if (pending || cancelled) return;
      pending = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session?.access_token) {
          if (!cancelled) setSnapshot(null);
          return;
        }
        const response = await fetch("/api/admin/ai-status", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setSnapshot(null);
          return;
        }
        if (!response.ok) {
          unavailable();
          return;
        }
        const data = await response.json();
        if (!data || !Object.hasOwn(data, "authFailureIncident")) {
          unavailable();
          return;
        }
        if (!cancelled) setSnapshot({
          userId,
          value: {
            incident: data.authFailureIncident,
            status: "available",
            hasKey: typeof data.hasKey === "boolean" ? data.hasKey : undefined,
          },
        });
      } catch {
        unavailable();
      } finally {
        pending = false;
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    window.addEventListener(AI_AUTH_INCIDENT_UPDATED_EVENT, refresh);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(AI_AUTH_INCIDENT_UPDATED_EVENT, refresh);
    };
  }, [userId, isAdmin]);

  return isAdmin && snapshot?.userId === userId ? snapshot.value : null;
}

export function useAIAuthIncident(userId: string | null, isAdmin: boolean) {
  return useAIAuthStatus(userId, isAdmin)?.incident ?? null;
}
