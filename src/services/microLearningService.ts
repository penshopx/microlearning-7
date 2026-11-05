import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fetchAI } from "@/lib/ai-client";
import {
  DEFAULT_WORKPLACE_TRACK,
  emptyMissionProgress,
  normalizeMissionProgress,
  normalizeWorkplaceMission,
  type MissionEvidenceUpload,
  type MissionProgress,
  type WorkplaceMission,
} from "@/lib/workplaceMission";

export {
  emptyMissionProgress,
  normalizeMissionProgress,
  normalizeWorkplaceMission,
};
export type { MissionEvidenceUpload, MissionProgress, WorkplaceMission };

type _Course = Database["public"]["Tables"]["courses"]["Row"];
type _CourseModule = Database["public"]["Tables"]["course_modules"]["Row"];
type _ModuleContent = Database["public"]["Tables"]["module_content"]["Row"];
type _ModuleQuiz = Database["public"]["Tables"]["module_quizzes"]["Row"];
type _LearnerProgress = Database["public"]["Tables"]["learner_progress"]["Row"];

export type MissionSource =
  | {
      type: "meeting";
      meetingId: string;
      recordingUrl?: string;
    }
  | {
      type: "document";
      text: string;
      fileName?: string;
    };

/**
 * Micro-Learning Service
 * Handles course creation, module management, and learner progress
 */
export const microLearningService = {
  /**
   * Create a mission container from either a meeting or a document source.
   */
  async createCourseFromSource(
    sourceType: MissionSource["type"],
    title: string,
    description?: string,
    meetingId?: string,
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        meeting_id: sourceType === "meeting" ? meetingId || null : null,
        title,
        description,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Backwards-compatible meeting course creation helper.
   */
  async createCourseFromMeeting(meetingId: string, title: string, description?: string) {
    return this.createCourseFromSource("meeting", title, description, meetingId);
  },

  /**
   * Turn a meeting or document into practice-based missions.
   */
  async chunkSourceIntoModules(
    courseId: string,
    source: MissionSource,
    workplaceTrack: string = DEFAULT_WORKPLACE_TRACK
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const response = await fetchAI("/api/ai/chunk-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          courseId,
          sourceType: source.type,
          meetingId: source.type === "meeting" ? source.meetingId : undefined,
          sourceText: source.type === "document" ? source.text : undefined,
          sourceName: source.type === "document" ? source.fileName : undefined,
          recordingUrl: source.type === "meeting" ? source.recordingUrl : undefined,
          workplaceTrack,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          data: null,
          error: new Error(result?.error || "Gagal membuat misi dari sumber"),
        };
      }
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Backwards-compatible meeting chunking helper.
   */
  async chunkMeetingIntoModules(
    courseId: string,
    meetingRecordingUrl: string,
    workplaceTrack: string = DEFAULT_WORKPLACE_TRACK
  ) {
    return this.chunkSourceIntoModules(
      courseId,
      { type: "meeting", meetingId: "", recordingUrl: meetingRecordingUrl },
      workplaceTrack,
    );
  },

  /**
   * Generate content for a specific module
   */
  async generateModuleContent(moduleId: string, contentTypes: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const response = await fetchAI("/api/ai/generate-module", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          moduleId,
          contentTypes, // ['slides', 'summary', 'quiz', 'flashcards', 'audio']
        }),
      });

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get all courses for current user
   */
  async getUserCourses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return { data, error };
  },

  /**
   * Get published courses (marketplace)
   */
  async getPublishedCourses(filters?: {
    category?: string;
    difficulty?: string;
    searchQuery?: string;
  }) {
    let query = supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.difficulty) {
      query = query.eq("difficulty_level", filters.difficulty);
    }

    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Get course with all modules
   */
  async getCourseWithModules(courseId: string) {
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return {
        data: null,
        error: courseError || new Error("Mission not found"),
      };
    }

    const { data: modules, error: modulesError } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("module_number", { ascending: true });

    if (modulesError) return { data: null, error: modulesError };

    const safeModules = modules || [];
    const moduleIds = safeModules.map((module) => module.id);

    if (moduleIds.length === 0) {
      return { data: { course, modules: [] }, error: null };
    }

    const [{ data: content, error: contentError }, { data: quizzes, error: quizzesError }] =
      await Promise.all([
        supabase
          .from("module_content")
          .select("*")
          .in("module_id", moduleIds)
          .order("order_index", { ascending: true }),
        supabase
          .from("module_quizzes")
          .select("*")
          .in("module_id", moduleIds)
          .order("question_number", { ascending: true }),
      ]);

    if (contentError || quizzesError) {
      return { data: null, error: contentError || quizzesError };
    }

    const hydratedModules = safeModules.map((module) => ({
      ...module,
      content: (content || []).filter((item) => item.module_id === module.id),
      quizzes: (quizzes || []).filter((item) => item.module_id === module.id),
    }));

    return { data: { course, modules: hydratedModules }, error: null };
  },

  /**
   * Get module with all content and quizzes
   */
  async getModuleDetails(moduleId: string) {
    const { data: module, error: moduleError } = await supabase
      .from("course_modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (moduleError) return { data: null, error: moduleError };

    const { data: content, error: contentError } = await supabase
      .from("module_content")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });

    const { data: quizzes, error: quizzesError } = await supabase
      .from("module_quizzes")
      .select("*")
      .eq("module_id", moduleId)
      .order("question_number", { ascending: true });

    return {
      data: { module, content: content || [], quizzes: quizzes || [] },
      error: contentError || quizzesError,
    };
  },

  /**
   * Update learner progress
   */
  async updateProgress(
    courseId: string,
    moduleId: string,
    progressData: {
      status: "not_started" | "in_progress" | "completed";
      progressPercentage?: number;
      timeSpentSeconds?: number;
      lastPositionSeconds?: number;
      quizScore?: number;
      missionProgress?: MissionProgress;
      expectedMissionRevision?: number;
      awardCompletion?: boolean;
    }
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = progressData.missionProgress
      ? await supabase.rpc("save_mission_progress", {
          p_course_id: courseId,
          p_module_id: moduleId,
          p_status: progressData.status,
          p_progress_percentage: progressData.progressPercentage ?? null,
          p_mission_progress: progressData.missionProgress,
          p_expected_revision: progressData.expectedMissionRevision ?? null,
        })
      : await supabase.rpc("upsert_learner_progress_atomic", {
      p_course_id: courseId,
      p_module_id: moduleId,
      p_status: progressData.status,
      p_progress_percentage: progressData.progressPercentage ?? null,
      p_time_spent_seconds: progressData.timeSpentSeconds ?? null,
      p_last_position_seconds: progressData.lastPositionSeconds ?? null,
      p_quiz_score: progressData.quizScore ?? null,
      p_mission_progress: progressData.missionProgress ?? null,
    });

    // Award achievement if module completed
    if (!error && data && progressData.status === "completed" && progressData.awardCompletion !== false) {
      await supabase.rpc("award_achievement", {
        p_user_id: user.id,
        p_achievement_type: "module_completed",
        p_title: "Module Master",
        p_description: "Completed a learning module",
        p_points: 10,
      });
    }

    return { data, error };
  },

  /** Opportunistic retry supplements the scheduled service-only worker.
   * Never delete an upload
   * solely because its save response was lost: the server checks attachment. */
  async reconcileEvidence(abandonPath?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("reconcile_mission_evidence", {
      p_abandon_path: abandonPath ?? null,
    });
    if (error) return false;
    const paths = (data || []).map((item: { storage_path: string }) => item.storage_path);
    if (!paths.length) return true;
    try {
      const { error: removeError } = await supabase.storage.from("mission-evidence").remove(paths);
      if (!removeError) return true;
    } catch {
      // Network failures also leave the durable queue intact.
    }
    try {
      // No raw Storage error, filename, or evidence content is recorded.
      await supabase.rpc("record_mission_cleanup_failure", { p_paths: paths });
    } catch {
      // Reporting cannot turn a failed cleanup into a successful one.
    }
    return false;
  },

  /**
   * Get learner progress for a course
   */
  async getCourseProgress(courseId: string) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return { data: null, error: authError ?? new Error("Not authenticated") };

      const { data, error } = await supabase
        .from("learner_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId);

      return { data: error ? null : data, error };
    } catch {
      // Do not turn an unavailable server snapshot into empty learner progress.
      return { data: null, error: new Error("Unable to load learner progress") };
    }
  },

  /**
   * Get learner progress for a course (alias for consistency)
   */
  async getLearnerProgress(courseId: string) {
    return this.getCourseProgress(courseId);
  },

  /**
   * Award achievement to user
   */
  async awardAchievement(
    achievementType: string,
    title: string,
    description: string,
    points: number
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("learner_achievements")
      .insert({
        user_id: user.id,
        achievement_type: achievementType,
        achievement_title: title,
        achievement_description: description,
        points_earned: points,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get all achievements for current user
   */
  async getUserAchievements() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("learner_achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    return { data, error };
  },

  /**
   * Optimize module for social media
   */
  async optimizeForSocial(
    moduleId: string,
    platform: "youtube_shorts" | "tiktok" | "instagram_reels" | "linkedin"
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const response = await fetchAI("/api/ai/optimize-social", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          moduleId,
          platform,
        }),
      });

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Publish course to marketplace
   */
  async publishCourse(courseId: string, priceIdr: number = 0) {
    const { data, error } = await supabase
      .from("courses")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        price_idr: priceIdr,
      })
      .eq("id", courseId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Unpublish course
   */
  async unpublishCourse(courseId: string) {
    const { data, error } = await supabase
      .from("courses")
      .update({
        is_published: false,
      })
      .eq("id", courseId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Delete course
   */
  async deleteCourse(courseId: string) {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    return { success: !error, error };
  },
};