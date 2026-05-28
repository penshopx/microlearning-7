import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Helper types
type SubscriptionPlan = Database["public"]["Tables"]["subscription_plans"]["Row"];
type UserSubscription = Database["public"]["Tables"]["user_subscriptions"]["Row"];
type UsageLog = Database["public"]["Tables"]["usage_logs"]["Row"];
type _PaymentTransaction = Database["public"]["Tables"]["payment_transactions"]["Row"];

export const subscriptionService = {
  // Get all active subscription plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }

    return data || [];
  },

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user subscription:", error);
      // Don't throw here, just return null (treat as free tier)
      return null;
    }

    return data || null;
  },

  // Create or update subscription
  async subscribe(
    userId: string,
    planId: string,
    billingCycle: "monthly" | "yearly"
  ): Promise<UserSubscription> {
    const periodEnd = new Date();
    if (billingCycle === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: userId,
        plan_id: planId,
        billing_cycle: billingCycle,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }

    return data;
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  },

  // Log usage event
  async logUsage(
    userId: string | null,
    meetingId: string,
    eventType: UsageLog["event_type"],
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase.from("usage_logs").insert({
      user_id: userId,
      meeting_id: meetingId,
      event_type: eventType,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error logging usage:", error);
      // Don't throw - usage logging should not break the app
    }
  },

  // Check meeting limits (duration, participants)
  async checkMeetingLimits(meetingId: string, hostId: string): Promise<{
    shouldEnd: boolean;
    reason?: "duration" | "participants";
    timeRemaining?: number; // in minutes
    maxDuration?: number;
    maxParticipants?: number;
    isPro?: boolean;
  }> {
    // 1. Get host's subscription (to know limits)
    const subscription = await this.getUserSubscription(hostId);
    
    // Default to Free Tier limits
    let maxDuration = 40; // 40 mins for free
    let maxParticipants = 100;
    let isPro = false;

    if (subscription && (subscription as any).subscription_plans) {
      const plan = (subscription as any).subscription_plans;
      maxDuration = plan.max_duration_minutes || 999999; // NULL means unlimited
      maxParticipants = plan.max_participants || 100;
      isPro = true;
    }

    // 2. Get meeting details (for start time)
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("created_at")
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) {
      return { shouldEnd: false }; // Fail safe
    }

    // 3. Calculate duration
    const startTime = new Date(meeting.created_at).getTime();
    const now = new Date().getTime();
    const durationMinutes = (now - startTime) / 1000 / 60;
    const timeRemaining = Math.max(0, maxDuration - durationMinutes);

    if (durationMinutes >= maxDuration) {
      return {
        shouldEnd: true,
        reason: "duration",
        timeRemaining: 0,
        maxDuration,
        maxParticipants,
        isPro
      };
    }

    return {
      shouldEnd: false,
      timeRemaining,
      maxDuration,
      maxParticipants,
      isPro
    };
  }
};