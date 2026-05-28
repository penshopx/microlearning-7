import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Social Media Optimizer
 * Optimizes module content for various social media platforms
 * 
 * Supported platforms:
 * - youtube_shorts: Vertical 9:16, max 60 seconds
 * - tiktok: Vertical, trending sounds, captions
 * - instagram_reels: Square/vertical, hashtags
 * - linkedin: Professional tone, thought leadership
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { moduleId, platform } = req.body;

    const validPlatforms = ["youtube_shorts", "tiktok", "instagram_reels", "linkedin"];
    
    if (!moduleId || !platform || !validPlatforms.includes(platform)) {
      return res.status(400).json({ 
        error: "Module ID and valid platform required",
        validPlatforms 
      });
    }

    // Validate user session
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get module details
    const { data: module } = await supabase
      .from("course_modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    // Platform-specific optimization
    const optimization = await optimizeForPlatform(module, platform);

    return res.status(200).json({
      success: true,
      platform,
      optimization,
    });
  } catch (error) {
    console.error("Social Optimization Error:", error);
    return res.status(500).json({
      error: "Failed to optimize for social media",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function optimizeForPlatform(module: any, platform: string) {
  const optimizations: Record<string, any> = {
    youtube_shorts: {
      aspect_ratio: "9:16",
      max_duration: 60,
      title: `${module.title} in 60 Seconds! 🚀`,
      description: `Quick ${module.title} tutorial. Learn the essentials fast! #Shorts #Tutorial #Learning`,
      captions: "Auto-generated with high contrast",
      thumbnail: "Eye-catching with text overlay",
      music: "Trending upbeat track (copyright-free)",
    },
    tiktok: {
      aspect_ratio: "9:16",
      max_duration: 180,
      title: module.title,
      caption: `POV: You're learning ${module.title} 📚✨ #LearnOnTikTok #Education #Tutorial #FYP`,
      hashtags: ["LearnOnTikTok", "Education", "Tutorial", "FYP", "SkillUp"],
      trending_sound: "Use trending sound (check TikTok Creative Center)",
      effects: "Text pop-ins, transitions, trending filters",
    },
    instagram_reels: {
      aspect_ratio: "9:16",
      max_duration: 90,
      title: module.title,
      caption: `Learn ${module.title} in under 90 seconds! 💡 Save this for later! 👉 Follow for more educational content!`,
      hashtags: ["Education", "Learning", "Tutorial", "Reels", "SkillDevelopment", "LearnWithMe"],
      music: "Trending Instagram audio",
      cover_image: "Attractive thumbnail with text",
    },
    linkedin: {
      aspect_ratio: "16:9",
      max_duration: 300,
      title: `Professional Insight: ${module.title}`,
      description: `In this micro-learning module, I break down ${module.title} into actionable insights you can apply immediately in your work. \n\nKey takeaways:\n✅ Concept overview\n✅ Practical applications\n✅ Industry best practices\n\n💡 What's your experience with ${module.title}? Share in the comments!`,
      tone: "Professional, thought leadership",
      captions: "Professional, easy to read",
      thumbnail: "Professional headshot + topic text",
    },
  };

  return optimizations[platform] || optimizations.linkedin;
}