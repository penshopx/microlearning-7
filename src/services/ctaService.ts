import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MeetingCTA = Database["public"]["Tables"]["meeting_ctas"]["Row"];
type NewCTA = Database["public"]["Tables"]["meeting_ctas"]["Insert"];

export const ctaService = {
  /**
   * Create a new CTA for a meeting
   */
  async createCTA(meetingId: string, ctaData: {
    title: string;
    description?: string;
    button_text: string;
    button_url: string;
    button_color?: string;
    duration_seconds?: number;
    price?: number;
  }): Promise<{ data: MeetingCTA | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: "Not authenticated" } };
    }

    const newCTA: NewCTA = {
      meeting_id: meetingId,
      creator_id: user.id,
      title: ctaData.title,
      description: ctaData.description,
      button_text: ctaData.button_text,
      link_url: ctaData.button_url, // Map to DB column 'link_url'
      button_color: ctaData.button_color || "#3B82F6",
      duration_seconds: ctaData.duration_seconds || 30,
      price: ctaData.price || 0,
      is_active: false,
    };

    const { data, error } = await supabase
      .from("meeting_ctas")
      .insert(newCTA)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Activate a CTA (show to all participants)
   */
  async activateCTA(ctaId: string): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
      .from("meeting_ctas")
      .update({ 
        is_active: true,
        activated_at: new Date().toISOString()
      })
      .eq("id", ctaId);

    return { success: !error, error };
  },

  /**
   * Deactivate a CTA
   */
  async deactivateCTA(ctaId: string): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
      .from("meeting_ctas")
      .update({ is_active: false })
      .eq("id", ctaId);

    return { success: !error, error };
  },

  /**
   * Get all CTAs for a meeting
   */
  async getMeetingCTAs(meetingId: string): Promise<{ data: MeetingCTA[] | null; error: any }> {
    const { data, error } = await supabase
      .from("meeting_ctas")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });

    return { data, error };
  },

  /**
   * Get active CTA for a meeting
   */
  async getActiveCTA(meetingId: string): Promise<{ data: MeetingCTA | null; error: any }> {
    const { data, error } = await supabase
      .from("meeting_ctas")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("is_active", true)
      .single();

    return { data, error };
  },

  /**
   * Subscribe to CTA changes (real-time)
   */
  subscribeToMeetingCTAs(
    meetingId: string,
    onCTAActivated: (cta: MeetingCTA) => void,
    onCTADeactivated: () => void
  ) {
    const channel = supabase
      .channel(`meeting-cta-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meeting_ctas",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          const cta = payload.new as MeetingCTA;
          if (cta.is_active) {
            onCTAActivated(cta);
          } else {
            onCTADeactivated();
          }
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Record CTA click
   */
  async recordClick(ctaId: string): Promise<{ success: boolean; error?: any }> {
    const { data: cta, error: fetchError } = await supabase
      .from("meeting_ctas")
      .select("clicks_count")
      .eq("id", ctaId)
      .single();

    if (fetchError || !cta) {
      return { success: false, error: fetchError };
    }

    const { error: updateError } = await supabase
      .from("meeting_ctas")
      .update({ 
        clicks_count: (cta.clicks_count || 0) + 1 
      })
      .eq("id", ctaId);

    return { success: !updateError, error: updateError };
  },

  /**
   * Delete a CTA
   */
  async deleteCTA(ctaId: string): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
      .from("meeting_ctas")
      .delete()
      .eq("id", ctaId);

    return { success: !error, error };
  },
};