import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  userName: string;
  userId: string | null;
  isGuest: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const name =
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User";
          setUserName(name);
          setIsGuest(false);
        } else {
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
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          const name =
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User";
          setUserName(name);
          setIsGuest(false);
        } else {
          setUser(null);
          setUserName("");
          setIsGuest(false);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
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
  };
}

export function getUserStorageKey(userId: string | null, key: string): string {
  const prefix = userId || "guest";
  return `chaesa_${prefix}_${key}`;
}
