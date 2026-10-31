import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  normalizeMissionProgress,
  normalizeWorkplaceMission,
  type MissionProgress,
  type WorkplaceMission,
} from "@/lib/workplaceMission";

type LearnerProgress = Database["public"]["Tables"]["learner_progress"]["Row"];
export type MissionReview = Database["public"]["Tables"]["mission_reviews"]["Row"];
export type MissionReviewComment = Database["public"]["Tables"]["mission_review_comments"]["Row"];
export type MissionReviewCommentDraft = Pick<
  MissionReviewComment,
  "evidence_id" | "timestamp_seconds" | "comment_text"
>;

export type SupervisorQueueItem = {
  progress: LearnerProgress;
  courseTitle: string;
  moduleTitle: string;
  mission: WorkplaceMission;
  practiceProgress: MissionProgress;
  review: MissionReview | null;
};

export const supervisorReviewService = {
  async getQueue() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) return { data: null, error: authError || new Error("Silakan masuk.") };

    const { data: courses, error: courseError } = await supabase
      .from("courses")
      .select("id,title")
      .eq("user_id", user.id);
    if (courseError) return { data: null, error: courseError };
    if (!courses?.length) return { data: [] as SupervisorQueueItem[], error: null };

    const courseTitles = new Map(courses.map((course) => [course.id, course.title]));
    const { data: progressRows, error: progressError } = await supabase
      .from("learner_progress")
      .select("*")
      .in("course_id", courses.map((course) => course.id))
      .eq("status", "completed")
      .order("completed_at", { ascending: false });
    if (progressError) return { data: null, error: progressError };

    const progress = (progressRows || []).filter((row) =>
      normalizeMissionProgress(row.mission_progress).evidenceUploads.length > 0
    );
    if (!progress.length) return { data: [] as SupervisorQueueItem[], error: null };

    const moduleIds = [...new Set(progress.flatMap((row) => row.module_id ? [row.module_id] : []))];
    if (!moduleIds.length) return { data: [] as SupervisorQueueItem[], error: null };
    const progressIds = progress.map((row) => row.id);
    const [{ data: modules, error: moduleError }, { data: contents, error: contentError },
      { data: reviews, error: reviewError }] = await Promise.all([
      supabase.from("course_modules").select("id,title,course_id").in("id", moduleIds),
      supabase.from("module_content").select("module_id,content_data")
        .eq("content_type", "worksheet").in("module_id", moduleIds),
      supabase.from("mission_reviews").select("*").in("learner_progress_id", progressIds),
    ]);
    const queryError = moduleError || contentError || reviewError;
    if (queryError) return { data: null, error: queryError };

    const moduleById = new Map((modules || []).map((module) => [module.id, module]));
    const missionByModule = new Map<string, WorkplaceMission>();
    for (const content of contents || []) {
      const mission = normalizeWorkplaceMission(content.content_data);
      if (mission) missionByModule.set(content.module_id, mission);
    }
    const reviewByProgress = new Map((reviews || []).map((review) => [
      review.learner_progress_id,
      review,
    ]));

    const queue = progress.flatMap((row) => {
      if (!row.module_id) return [];
      const module = moduleById.get(row.module_id);
      const mission = missionByModule.get(row.module_id);
      if (!module || !mission) return [];
      return [{
        progress: row,
        courseTitle: courseTitles.get(row.course_id) || "Misi kerja",
        moduleTitle: module.title,
        mission,
        practiceProgress: normalizeMissionProgress(row.mission_progress),
        review: reviewByProgress.get(row.id) || null,
      }];
    });

    return { data: queue, error: null };
  },

  async saveReview(input: {
    learnerProgressId: string;
    reviewerId: string;
    reviewStatus: "completed" | "resubmission_requested";
    glowFeedback: string;
    growFeedback: string;
    nextSteps: string;
    comments: MissionReviewCommentDraft[];
  }) {
    const { data, error } = await supabase
      .from("mission_reviews")
      .upsert({
        learner_progress_id: input.learnerProgressId,
        reviewer_id: input.reviewerId,
        review_status: input.reviewStatus,
        glow_feedback: input.glowFeedback.trim(),
        grow_feedback: input.growFeedback.trim(),
        next_steps: input.nextSteps.trim(),
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "learner_progress_id" })
      .select("*")
      .single();

    if (error || !data) return { data, error };

    const { error: deleteError } = await supabase
      .from("mission_review_comments")
      .delete()
      .eq("review_id", data.id);
    if (deleteError) return { data: null, error: deleteError };

    const comments = input.comments
      .map((comment) => ({
        review_id: data.id,
        reviewer_id: input.reviewerId,
        evidence_id: comment.evidence_id,
        timestamp_seconds: Math.max(0, Math.floor(comment.timestamp_seconds)),
        comment_text: comment.comment_text.trim(),
      }))
      .filter((comment) => comment.comment_text.length > 0);
    if (comments.length) {
      const { error: commentsError } = await supabase
        .from("mission_review_comments")
        .insert(comments);
      if (commentsError) return { data: null, error: commentsError };
    }

    return { data, error: null };
  },

  async getReview(learnerProgressId: string) {
    const { data, error } = await supabase
      .from("mission_reviews")
      .select("*")
      .eq("learner_progress_id", learnerProgressId)
      .maybeSingle();
    return { data, error };
  },

  async getComments(reviewId: string) {
    const { data, error } = await supabase
      .from("mission_review_comments")
      .select("*")
      .eq("review_id", reviewId)
      .order("timestamp_seconds", { ascending: true });
    return { data, error };
  },
};
