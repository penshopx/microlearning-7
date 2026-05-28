import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type _Course = Database["public"]["Tables"]["courses"]["Row"];
type _CourseModule = Database["public"]["Tables"]["course_modules"]["Row"];
type _ModuleContent = Database["public"]["Tables"]["module_content"]["Row"];
type _ModuleQuiz = Database["public"]["Tables"]["module_quizzes"]["Row"];
type _LearnerProgress = Database["public"]["Tables"]["learner_progress"]["Row"];

/**
 * Micro-Learning Service
 * Handles course creation, module management, and learner progress
 */
export const microLearningService = {
  /**
   * Create course from meeting recording
   */
  async createCourseFromMeeting(meetingId: string, title: string, description?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        meeting_id: meetingId,
        title,
        description,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Chunk meeting into micro-learning modules (5-7 minutes each)
   */
  async chunkMeetingIntoModules(courseId: string, meetingRecordingUrl: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const response = await fetch("/api/ai/chunk-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          courseId,
          recordingUrl: meetingRecordingUrl,
        }),
      });

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Generate content for a specific module
   */
  async generateModuleContent(moduleId: string, contentTypes: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const response = await fetch("/api/ai/generate-module", {
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

    if (courseError) return { data: null, error: courseError };

    const { data: modules, error: modulesError } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("module_number", { ascending: true });

    if (modulesError) return { data: null, error: modulesError };

    return { data: { course, modules }, error: null };
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
    }
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("learner_progress")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        ...progressData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Award achievement if module completed
    if (progressData.status === "completed") {
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

  /**
   * Get learner progress for a course
   */
  async getCourseProgress(courseId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("learner_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    return { data, error };
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

      const response = await fetch("/api/ai/optimize-social", {
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