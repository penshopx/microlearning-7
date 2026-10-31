import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MissionReview = {
  id: string;
  progress_id: string;
  reviewer_id: string;
  status: "approved" | "retry_requested";
  feedback: string;
  reviewed_at: string;
};
export type SupervisorAssignment = {
  id: string;
  course_id: string;
  participant_id: string;
  supervisor_id: string;
};
export type ReviewSubmission = {
  id: string;
  user_id: string;
  module_id: string;
  status: string;
  mission_progress: unknown;
  module_title: string;
  review: MissionReview | null;
};

// Typed extension for the additive migration, without changing generated types.
type ReviewDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      mission_supervisor_assignments: {
        Row: SupervisorAssignment;
        Insert: Omit<SupervisorAssignment, "id">;
        Update: Partial<Omit<SupervisorAssignment, "id">>;
        Relationships: [];
      };
      mission_evidence_reviews: {
        Row: MissionReview;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      get_mission_review_submissions: { Args: { p_course_id: string }; Returns: ReviewSubmission[] };
      review_mission_evidence: {
        Args: { p_progress_id: string; p_status: MissionReview["status"]; p_feedback: string };
        Returns: MissionReview;
      };
      restart_mission_practice: {
        Args: { p_progress_id: string };
        Returns: Database["public"]["Tables"]["learner_progress"]["Row"];
      };
    };
  };
};
const client = supabase as unknown as SupabaseClient<ReviewDatabase>;

export const missionReviewService = {
  async getAssignments(courseId: string) {
    return client.from("mission_supervisor_assignments").select("*").eq("course_id", courseId);
  },
  async assignSupervisor(courseId: string, participantId: string, supervisorId: string) {
    return client.from("mission_supervisor_assignments").insert({
      course_id: courseId, participant_id: participantId, supervisor_id: supervisorId,
    }).select().single();
  },
  async removeAssignment(id: string) {
    return client.from("mission_supervisor_assignments").delete().eq("id", id);
  },
  async getSubmissions(courseId: string) {
    return client.rpc("get_mission_review_submissions", { p_course_id: courseId });
  },
  async reviewSubmission(progressId: string, status: MissionReview["status"], feedback: string) {
    if (feedback.length > 1000 || (status === "retry_requested" && !feedback.trim())) {
      return { data: null, error: new Error("Isi arahan pengulangan, maksimal 1.000 karakter.") };
    }
    return client.rpc("review_mission_evidence", {
      p_progress_id: progressId, p_status: status, p_feedback: feedback,
    });
  },
  async getMyReview(progressId: string) {
    return client.from("mission_evidence_reviews").select("*").eq("progress_id", progressId).maybeSingle();
  },
  async restartPractice(progressId: string) {
    return client.rpc("restart_mission_practice", { p_progress_id: progressId });
  },
  async openEvidence(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage.from("mission-evidence").createSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) throw error || new Error("Bukti tidak dapat dibuka.");
    return data.signedUrl;
  },
};
