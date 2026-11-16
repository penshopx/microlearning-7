import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
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

interface AdminAIState {
  userId: string | null;
  isAdmin: boolean;
  status: AIAuthStatus | null;
}

const AdminAIContext = createContext<AdminAIState | undefined>(undefined);

/** Own the single admin-only metadata poll for the active app session. */
export function AIAuthStatusProvider({ children }: { children: ReactNode }) {
  const { userId, isAdmin } = useAuth();
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
        if (!session?.access_token || session.user.id !== userId) {
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

  const status = isAdmin && snapshot?.userId === userId ? snapshot.value : null;
  return createElement(AdminAIContext.Provider, { value: { userId, isAdmin, status } }, children);
}

export function useAdminAIState(): AdminAIState {
  const state = useContext(AdminAIContext);
  if (!state) throw new Error("Admin AI state requires AIAuthStatusProvider");
  return state;
}

export function useAIAuthStatus(): AIAuthStatus | null {
  return useAdminAIState().status;
}

export function useAIAuthIncident() {
  return useAIAuthStatus()?.incident ?? null;
}
