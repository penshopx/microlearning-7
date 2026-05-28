import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getSubscriptionStatus } from "@/middleware/subscriptionMiddleware";

export const authService = {
  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  async getCurrentUser(): Promise<{ user: User | null; error: any }> {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Sign up with email and password
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || ""
        }
      }
    });

    if (data.user && !error) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName || "",
        avatar_url: null
      });
    }

    return { data, error };
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Sign in with Google OAuth
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  // Get user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error };
  },

  // Update user profile
  async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    return { data, error };
  },

  // Create or get guest user
  async createGuestUser(displayName: string): Promise<{ guestUserId: string | null; error: any }> {
    // Generate a unique guest ID
    const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
    
    // Insert guest user into guest_users table
    const { data, error } = await supabase
      .from("guest_users")
      .insert({
        guest_id: guestId,
        display_name: displayName
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating guest user:", error);
      return { guestUserId: null, error };
    }

    // Return the UUID from the database
    return { guestUserId: data.id, error: null };
  },

  // Get guest user by guest_id string
  async getGuestUser(guestId: string) {
    const { data, error } = await supabase
      .from("guest_users")
      .select("*")
      .eq("guest_id", guestId)
      .single();

    return { data, error };
  },

  // Check if user is authenticated or guest
  async getUserInfo(): Promise<{ userId: string | null; displayName: string; isGuest: boolean }> {
    // Try to get authenticated user first
    const { user } = await this.getCurrentUser();
    
    if (user) {
      const { data: profile } = await this.getProfile(user.id);
      return {
        userId: user.id,
        displayName: profile?.full_name || user.email || "User",
        isGuest: false
      };
    }

    // Check if there's a guest user in localStorage
    const guestData = localStorage.getItem("chaesa_guest_user");
    if (guestData) {
      const parsed = JSON.parse(guestData);
      return {
        userId: parsed.userId,
        displayName: parsed.displayName,
        isGuest: true
      };
    }

    return { userId: null, displayName: "", isGuest: false };
  },

  // Set guest user in localStorage
  setGuestUser(userId: string, displayName: string) {
    localStorage.setItem("chaesa_guest_user", JSON.stringify({ userId, displayName }));
  },

  // Clear guest user
  clearGuestUser() {
    localStorage.removeItem("chaesa_guest_user");
  },

  /**
   * Get current user's subscription status
   * Reuses the centralized logic from middleware
   */
  async getSubscriptionStatus(userId: string) {
    return await getSubscriptionStatus(userId);
  }
};