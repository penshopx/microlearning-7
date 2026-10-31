import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AI_AUTH_INCIDENT_UPDATED_EVENT,
  type AIAuthIncident,
} from "@/lib/ai-auth-incident";

/** Poll shared admin-only incident metadata, never the provider health probe. */
export function useAIAuthIncident(userId: string | null, isAdmin: boolean) {
  const [snapshot, setSnapshot] = useState<{
    userId: string;
    incident: AIAuthIncident | null;
  } | null>(null);

  useEffect(() => {
    setSnapshot(null);
    if (!userId || !isAdmin) return;
    let cancelled = false;
    let pending = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (pending || cancelled) return;
      pending = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session?.access_token) {
          setSnapshot(null);
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
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setSnapshot({ userId, incident: data.authFailureIncident ?? null });
      } catch {
        // Keep a known incident visible during a temporary polling failure.
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

  return isAdmin && snapshot?.userId === userId ? snapshot.incident : null;
}
