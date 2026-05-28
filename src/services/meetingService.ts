import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
type _MeetingInsert = Database["public"]["Tables"]["meetings"]["Insert"];
type MeetingParticipant = Database["public"]["Tables"]["meeting_participants"]["Row"];
type WebRTCSignal = Database["public"]["Tables"]["webrtc_signals"]["Insert"];
type ChatMessage = Database["public"]["Tables"]["meeting_chat"]["Row"];

export const meetingService = {
  // Generate a random 9-character meeting code
  generateMeetingCode(): string {
    return Math.random().toString(36).substring(2, 11).toUpperCase();
  },

  // Create a new meeting
  async createMeeting(hostId: string | null, title?: string, specificCode?: string): Promise<{ data: Meeting | null; error: any }> {
    const meetingCode = specificCode || this.generateMeetingCode();
    
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        meeting_code: meetingCode,
        host_id: hostId, // Can be null for guest users
        title: title || "Chaesa Live Meeting",
        is_active: true
      })
      .select()
      .single();

    return { data, error };
  },

  // Get meeting by code
  async getMeetingByCode(code: string): Promise<{ data: Meeting | null; error: any }> {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("meeting_code", code)
      .eq("is_active", true)
      .single();

    return { data, error };
  },

  // Get meeting by ID
  async getMeetingById(id: string): Promise<{ data: Meeting | null; error: any }> {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  },

  // End a meeting
  async endMeeting(meetingId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("meetings")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("id", meetingId);

    return { error };
  },

  // Join a meeting
  async joinMeeting(meetingId: string, userId: string | null, displayName: string): Promise<{ data: MeetingParticipant | null; error: any }> {
    // First, check if participant already exists
    const { data: existing } = await supabase
      .from("meeting_participants")
      .select("*")
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Update existing participant (rejoin scenario)
      const { data, error } = await supabase
        .from("meeting_participants")
        .update({
          display_name: displayName,
          is_camera_on: true,
          is_mic_on: true,
          left_at: null,
          joined_at: new Date().toISOString()
        })
        .eq("meeting_id", meetingId)
        .eq("user_id", userId)
        .select()
        .single();

      return { data, error };
    }

    // Insert new participant
    const { data, error } = await supabase
      .from("meeting_participants")
      .insert({
        meeting_id: meetingId,
        user_id: userId,
        display_name: displayName,
        is_camera_on: true,
        is_mic_on: true,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  // Leave a meeting
  async leaveMeeting(meetingId: string, userId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("meeting_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("meeting_id", meetingId)
      .eq("user_id", userId);

    return { error };
  },

  // Update meeting settings
  async updateMeeting(meetingId: string, updates: { is_locked?: boolean }): Promise<{ error: any }> {
    const { error } = await supabase
      .from("meetings")
      .update(updates)
      .eq("id", meetingId);

    return { error };
  },

  // Get active participants
  async getParticipants(meetingId: string): Promise<{ data: MeetingParticipant[] | null; error: any }> {
    const { data, error } = await supabase
      .from("meeting_participants")
      .select("*")
      .eq("meeting_id", meetingId)
      .is("left_at", null)
      .order("joined_at", { ascending: true });

    return { data, error };
  },

  // Update participant status
  async updateParticipantStatus(
    meetingId: string,
    userId: string | null,
    updates: { is_camera_on?: boolean; is_mic_on?: boolean; is_screen_sharing?: boolean; hand_raised?: boolean }
  ): Promise<{ error: any }> {
    if (!userId) {
      return { error: null }; // Guest users don't update status in DB
    }

    const { error } = await supabase
      .from("meeting_participants")
      .update(updates)
      .eq("meeting_id", meetingId)
      .eq("user_id", userId);

    return { error };
  },

  // Send WebRTC signal
  async sendSignal(signal: WebRTCSignal): Promise<{ error: any }> {
    const { error } = await supabase
      .from("webrtc_signals")
      .insert(signal);

    return { error };
  },

  // Subscribe to WebRTC signals
  subscribeToSignals(meetingId: string, userId: string, callback: (signal: any) => void) {
    return supabase
      .channel(`signals:${meetingId}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webrtc_signals",
          filter: `to_user_id=eq.${userId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  // Subscribe to participants changes
  subscribeToParticipants(meetingId: string, callback: (participant: any) => void) {
    return supabase
      .channel(`participants:${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_participants",
          filter: `meeting_id=eq.${meetingId}`
        },
        (payload) => callback(payload)
      )
      .subscribe();
  },

  // Send chat message
  async sendChatMessage(meetingId: string, userId: string, message: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("meeting_chat")
      .insert({
        meeting_id: meetingId,
        user_id: userId,
        message
      });

    return { error };
  },

  // Get chat messages
  async getChatMessages(meetingId: string): Promise<{ data: ChatMessage[] | null; error: any }> {
    const { data, error } = await supabase
      .from("meeting_chat")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });

    return { data, error };
  },

  // Subscribe to chat messages
  subscribeToChatMessages(meetingId: string, callback: (message: any) => void) {
    return supabase
      .channel(`chat:${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meeting_chat",
          filter: `meeting_id=eq.${meetingId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  /**
   * Get all meetings for the current user
   */
  async getUserMeetings() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return { data: [], error: null };

    const { data, error } = await supabase
      .from("meetings")
      .select(`
        *,
        meeting_recordings (*)
      `)
      .eq("host_id", session.session.user.id)
      .order("created_at", { ascending: false });

    return { data, error };
  }
};