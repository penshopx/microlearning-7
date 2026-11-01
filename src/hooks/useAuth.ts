import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { clearOtherReflectionDrafts } from "@/lib/reflectionDraft";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  userName: string;
  userId: string | null;
  isGuest: boolean;
  /** True when the user's profiles row has role = "admin". Populated asynchronously after login. */
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    let revision = 0;
    let profileTimer: ReturnType<typeof setTimeout> | undefined;

    async function fetchProfile(userId: string, expectedRevision: number) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        if (mounted && revision === expectedRevision) setIsAdmin(data?.role === "admin");
      } catch {
        if (mounted && revision === expectedRevision) setIsAdmin(false);
      }
    }

    function applyUser(nextUser: User | null) {
      clearOtherReflectionDrafts(nextUser?.id ?? null);
      const expectedRevision = ++revision;
      clearTimeout(profileTimer);
      setUser(nextUser);
      setIsAdmin(false);
      setIsGuest(false);
      setUserName(nextUser
        ? nextUser.user_metadata?.full_name || nextUser.email?.split("@")[0] || "User"
        : "");
      if (nextUser) {
        // Supabase auth callbacks run under its auth lock. Query after returning
        // from the callback, and ignore responses from a previous account.
        profileTimer = setTimeout(() => void fetchProfile(nextUser.id, expectedRevision), 0);
      }
      setIsLoading(false);
    }

    async function loadUser() {
      const initialRevision = revision;
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted || revision !== initialRevision) return;

        if (session?.user) {
          applyUser(session.user);
        } else {
          applyUser(null);
          const guestData = typeof window !== "undefined"
            ? localStorage.getItem("chaesa_guest_user")
            : null;
          if (guestData) {
            try {
              const parsed = JSON.parse(guestData);
              setUserName(parsed.displayName || "Guest");
              setIsGuest(true);
            } catch {
              setIsGuest(false);
            }
          }
          setIsAdmin(false);
        }
      } catch (err) {
        if (mounted && revision === initialRevision) applyUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        applyUser(session?.user ?? null);
      }
    );
    void loadUser();

    return () => {
      mounted = false;
      clearTimeout(profileTimer);
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    isLoading,
    userName,
    userId: user?.id || null,
    isGuest,
    isAdmin,
  };
}

export function getUserStorageKey(userId: string | null, key: string): string {
  const prefix = userId || "guest";
  return `chaesa_${prefix}_${key}`;
}
