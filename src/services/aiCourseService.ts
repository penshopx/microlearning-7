import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AIProcessingJob = Database["public"]["Tables"]["ai_processing_jobs"]["Row"];
type GeneratedContent = Database["public"]["Tables"]["generated_content"]["Row"];

/**
 * AI Course Factory Service
 * Handles AI-powered content generation from meetings
 */
export const aiCourseService = {
  /**
   * Create AI processing job
   */
  async createProcessingJob(data: {
    meetingId: string;
    recordingId?: string;
    jobType: AIProcessingJob["job_type"];
    inputData?: Record<string, any>;
  }) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { data: null, error: new Error("Not authenticated") };
    }

    const { data: job, error } = await supabase
      .from("ai_processing_jobs")
      .insert({
        user_id: session.session.user.id,
        meeting_id: data.meetingId,
        recording_id: data.recordingId,
        job_type: data.jobType,
        input_data: data.inputData || {},
        status: "pending",
      })
      .select()
      .single();

    return { data: job, error };
  },

  /**
   * Start real-time transcription for meeting
   */
  async startTranscription(meetingId: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { data: null, error: new Error("Not authenticated") };
    }

    const { data, error } = await supabase
      .from("meetings")
      .update({
        transcription_status: "processing",
      })
      .eq("id", meetingId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Subscribe to real-time transcription updates
   */
  subscribeToTranscription(meetingId: string, callback: (note: any) => void) {
    return supabase
      .channel(`transcription_${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_meeting_notes",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  },

  /**
   * Get meeting transcription
   */
  async getMeetingNotes(meetingId: string) {
    const { data, error } = await supabase
      .from("ai_meeting_notes")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("timestamp", { ascending: true });

    return { data, error };
  },

  /**
   * Analyze meeting and generate insights
   */
  async analyzeMeeting(meetingId: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { data: null, error: new Error("Not authenticated") };
    }

    // Call the analysis API
    const response = await fetch("/api/ai/analyze-meeting", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ meetingId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { data: null, error: new Error(error.error || "Analysis failed") };
    }

    const data = await response.json();
    return { data, error: null };
  },

  /**
   * Get processing job status
   */
  async getJobStatus(jobId: string) {
    const { data, error } = await supabase
      .from("ai_processing_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    return { data, error };
  },

  /**
   * Get all user's processing jobs
   */
  async getUserJobs(filters?: {
    status?: AIProcessingJob["status"];
    jobType?: AIProcessingJob["job_type"];
  }) {
    let query = supabase
      .from("ai_processing_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.jobType) {
      query = query.eq("job_type", filters.jobType);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Subscribe to job updates (Realtime)
   */
  subscribeToJob(jobId: string, callback: (job: AIProcessingJob) => void) {
    return supabase
      .channel(`ai_job_${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ai_processing_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          callback(payload.new as AIProcessingJob);
        }
      )
      .subscribe();
  },

  /**
   * Generate course package (All-in-one)
   */
  async generateCoursePackage(meetingId: string, recordingId: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { data: null, error: new Error("Not authenticated") };
    }

    // Create multiple jobs for different content types
    const jobTypes: AIProcessingJob["job_type"][] = [
      "transcription",
      "slides_generation",
      "ebook_generation",
      "quiz_generation",
      "summary_generation",
    ];

    const jobs = await Promise.all(
      jobTypes.map((jobType) =>
        this.createProcessingJob({
          meetingId,
          recordingId,
          jobType,
        })
      )
    );

    return { data: jobs, error: null };
  },

  /**
   * Get generated content for a meeting
   */
  async getMeetingContent(meetingId: string) {
    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: false });

    return { data, error };
  },

  /**
   * Get single generated content
   */
  async getContent(contentId: string) {
    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("id", contentId)
      .single();

    return { data, error };
  },

  /**
   * Update generated content
   */
  async updateContent(
    contentId: string,
    updates: Partial<GeneratedContent>
  ) {
    const { data, error } = await supabase
      .from("generated_content")
      .update(updates)
      .eq("id", contentId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Publish content
   */
  async publishContent(contentId: string) {
    return this.updateContent(contentId, {
      is_published: true,
      published_at: new Date().toISOString(),
    });
  },

  /**
   * Delete content
   */
  async deleteContent(contentId: string) {
    const { error } = await supabase
      .from("generated_content")
      .delete()
      .eq("id", contentId);

    return { success: !error, error };
  },

  /**
   * Track download
   */
  async trackDownload(contentId: string) {
    const { data, error } = await supabase.rpc("increment_downloads", {
      content_id: contentId,
    });

    return { data, error };
  },

  /**
   * Get user's content library
   */
  async getContentLibrary(filters?: {
    contentType?: GeneratedContent["content_type"];
    isPublished?: boolean;
  }) {
    let query = supabase
      .from("generated_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.contentType) {
      query = query.eq("content_type", filters.contentType);
    }

    if (filters?.isPublished !== undefined) {
      query = query.eq("is_published", filters.isPublished);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Get content templates
   */
  async getTemplates(templateType?: string) {
    let query = supabase
      .from("content_templates")
      .select("*")
      .or("is_public.eq.true,user_id.eq." + (await supabase.auth.getSession()).data.session?.user.id);

    if (templateType) {
      query = query.eq("template_type", templateType);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Create custom template
   */
  async createTemplate(template: {
    templateType: string;
    name: string;
    description?: string;
    config: Record<string, any>;
    isPublic?: boolean;
  }) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      return { data: null, error: new Error("Not authenticated") };
    }

    const { data, error } = await supabase
      .from("content_templates")
      .insert({
        user_id: session.session.user.id,
        template_type: template.templateType,
        name: template.name,
        description: template.description,
        config: template.config,
        is_public: template.isPublic || false,
      })
      .select()
      .single();

    return { data, error };
  },
};