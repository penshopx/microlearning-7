import { supabase } from "@/integrations/supabase/client";
import { checkMeetingLimits } from "@/middleware/subscriptionMiddleware";

/**
 * Meeting Integration Service
 * Handles complete meeting lifecycle with subscription checks
 */

export const meetingIntegrationService = {
  /**
   * Create meeting with authentication check
   */
  async createMeetingAuthenticated(userId: string, meetingCode: string, title?: string) {
    try {
      // Create meeting
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .insert({
          meeting_code: meetingCode,
          host_id: userId,
          title: title || `Meeting ${meetingCode}`,
          is_active: true,
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Automatically join as host
      const { error: joinError } = await supabase
        .from("meeting_participants")
        .insert({
          meeting_id: meeting.id,
          user_id: userId,
          display_name: "Host",
          is_host: true,
        });

      if (joinError) throw joinError;

      return { data: meeting, error: null };
    } catch (error) {
      console.error("Error creating meeting:", error);
      return { data: null, error };
    }
  },

  /**
   * Join meeting with limit checks
   */
  async joinMeetingWithChecks(
    meetingId: string,
    userId: string,
    displayName: string
  ) {
    try {
      // Check if meeting exists and is active
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .select("*, meeting_participants(count)")
        .eq("id", meetingId)
        .single();

      if (meetingError || !meeting) {
        return {
          success: false,
          error: "Meeting not found or has ended",
        };
      }

      if (!meeting.is_active) {
        return {
          success: false,
          error: "This meeting has ended",
        };
      }

      // Check if meeting is locked
      if (meeting.is_locked) {
        return {
          success: false,
          error: "This meeting is locked. Please wait for host to admit you.",
        };
      }

      // Join meeting
      const { error: joinError } = await supabase
        .from("meeting_participants")
        .insert({
          meeting_id: meetingId,
          user_id: userId,
          display_name: displayName,
        });

      if (joinError) throw joinError;

      return { success: true, error: null };
    } catch (error) {
      console.error("Error joining meeting:", error);
      return { success: false, error: "Failed to join meeting" };
    }
  },

  /**
   * Monitor meeting time limits
   */
  async monitorMeetingLimits(meetingId: string, userId: string) {
    try {
      const limits = await checkMeetingLimits(meetingId, userId);
      return limits;
    } catch (error) {
      console.error("Error monitoring meeting limits:", error);
      return null;
    }
  },

  /**
   * End meeting and cleanup
   */
  async endMeeting(meetingId: string, userId: string) {
    try {
      // Verify user is host
      const { data: meeting } = await supabase
        .from("meetings")
        .select("host_id")
        .eq("id", meetingId)
        .single();

      if (meeting?.host_id !== userId) {
        return {
          success: false,
          error: "Only the host can end the meeting",
        };
      }

      // Update meeting status
      const { error: updateError } = await supabase
        .from("meetings")
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq("id", meetingId);

      if (updateError) throw updateError;

      // Remove all participants
      await supabase
        .from("meeting_participants")
        .delete()
        .eq("meeting_id", meetingId);

      return { success: true, error: null };
    } catch (error) {
      console.error("Error ending meeting:", error);
      return { success: false, error: "Failed to end meeting" };
    }
  },

  /**
   * Record meeting metadata for AI processing
   */
  async recordMeetingMetadata(
    meetingId: string,
    metadata: {
      duration: number;
      participants: string[];
      hasRecording: boolean;
      ai_processing_status?: string;
    }
  ) {
    try {
      // Cast metadata to any to satisfy JSONB type requirement
      const metadataJson = metadata as any;
      
      const { error } = await supabase
        .from("meetings")
        .update({
          metadata: metadataJson,
        })
        .eq("id", meetingId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error("Error recording meeting metadata:", error);
      return { success: false, error };
    }
  },
};