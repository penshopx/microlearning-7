import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const VALID_PLATFORMS = ["instagram", "tiktok", "youtube", "linkedin", "twitter"] as const;
const VALID_TONES = ["fun", "professional", "viral"] as const;

type Platform = typeof VALID_PLATFORMS[number];
type Tone = typeof VALID_TONES[number];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, platform, tone } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'topic'" });
    }

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        error: "Missing or invalid 'platform'",
        validPlatforms: VALID_PLATFORMS,
      });
    }

    if (!tone || !VALID_TONES.includes(tone)) {
      return res.status(400).json({
        error: "Missing or invalid 'tone'",
        validTones: VALID_TONES,
      });
    }

    let result: CaptionResult;

    try {
      result = await generateWithAI(topic, platform as Platform, tone as Tone);
    } catch (error) {
      console.error("OpenAI API error, falling back to template:", error);
      result = generateFallback(topic, platform as Platform, tone as Tone);
    }

    return res.status(200).json({
      success: true,
      platform,
      tone,
      topic,
      ...result,
    });
  } catch (error) {
    console.error("Generate Caption Error:", error);
    return res.status(500).json({
      error: "Failed to generate caption",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

interface CaptionResult {
  caption: string;
  hashtags: string[];
  emojiSuggestions: string[];
  bestPostingTime: string;
}

async function generateWithAI(
  topic: string,
  platform: Platform,
  tone: Tone
): Promise<CaptionResult> {
  const systemPrompt = `You are a social media expert specializing in creating viral, engaging captions for content creators and digital marketers. You always respond with valid JSON only, no markdown.`;

  const userPrompt = `Generate a social media caption for the platform "${platform}" about the topic "${topic}" with a "${tone}" tone.

Platform guidelines:
- instagram: Use line breaks, emojis, call-to-action, up to 2200 chars. Hashtags are critical.
- tiktok: Short, catchy, trending style. Use relevant trending hashtags. Keep it under 300 chars.
- youtube: Title-style + description caption. Include keywords for SEO.
- linkedin: Professional, thought-leadership style. Longer form with insights. Use 3-5 hashtags.
- twitter: Concise, under 280 chars. Punchy and shareable. Use 2-3 hashtags.

Tone guidelines:
- fun: Playful, use emojis generously, casual language, humor
- professional: Polished, authoritative, insightful, minimal emojis
- viral: Attention-grabbing hook, controversial/bold take, curiosity gap, trending format

Return a JSON object with exactly these fields:
{
  "caption": "the full caption text ready to post",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "emojiSuggestions": ["emoji1", "emoji2", ...],
  "bestPostingTime": "description of the best time to post on this platform"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 1024,
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content || "";

  try {
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      caption: parsed.caption || "",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      emojiSuggestions: Array.isArray(parsed.emojiSuggestions) ? parsed.emojiSuggestions : [],
      bestPostingTime: parsed.bestPostingTime || "",
    };
  } catch {
    return generateFallback("", "" as Platform, "" as Tone, content);
  }
}

function generateFallback(
  topic: string,
  platform: Platform,
  tone: Tone,
  rawCaption?: string
): CaptionResult {
  if (rawCaption) {
    return {
      caption: rawCaption,
      hashtags: [topic.replace(/\s+/g, ""), "ContentCreator", "Digital"],
      emojiSuggestions: ["🚀", "💡", "✨", "🔥"],
      bestPostingTime: "Weekdays 9-11 AM or 7-9 PM in your audience's timezone",
    };
  }

  const captions: Record<Platform, Record<Tone, string>> = {
    instagram: {
      fun: `${topic}? Let me break it down for you! 🎉✨\n\nSwipe through to learn everything you need to know 👉\n\nDrop a 🔥 if you found this helpful!\n\n📌 Save this for later!`,
      professional: `Insights on ${topic} that every professional should know.\n\nHere's what I've learned after deep research:\n\n→ Key takeaway 1\n→ Key takeaway 2\n→ Key takeaway 3\n\nWhat are your thoughts? Share below.`,
      viral: `STOP scrolling! 🛑\n\nThis is the ${topic} hack nobody talks about...\n\nI wish someone told me this sooner 😤\n\nFollow for more game-changing tips! 💪`,
    },
    tiktok: {
      fun: `POV: You finally understand ${topic} 😂✨ #LearnOnTikTok`,
      professional: `Here's what most people get wrong about ${topic} 📚`,
      viral: `This ${topic} trick changed everything 🤯 Watch till the end! #FYP`,
    },
    youtube: {
      fun: `${topic} Explained in the Most Fun Way Possible! 🎬 You won't believe how easy it is!`,
      professional: `${topic}: A Complete Professional Guide | Everything You Need to Know`,
      viral: `I Tried ${topic} For 30 Days... Here's What Happened 😱`,
    },
    linkedin: {
      fun: `${topic} doesn't have to be boring! Here's a fresh perspective that might surprise you. 💡`,
      professional: `After years of experience with ${topic}, here are 3 insights that transformed my approach:\n\n1. Quality over quantity\n2. Consistency is key\n3. Always measure results\n\nWhat would you add to this list?`,
      viral: `Unpopular opinion about ${topic}:\n\nMost people are doing it wrong.\n\nHere's why 👇`,
    },
    twitter: {
      fun: `${topic} hits different when you actually understand it 😂🔥`,
      professional: `Key insight on ${topic}: The best results come from consistent, strategic effort. Here's my framework:`,
      viral: `Hot take: ${topic} is about to change everything. Here's why most people aren't ready 🧵`,
    },
  };

  const hashtagMap: Record<Platform, string[]> = {
    instagram: [topic.replace(/\s+/g, ""), "ContentCreator", "DigitalMarketing", "Trending", "InstaGood", "LearnWithMe", "Tips", "Viral"],
    tiktok: [topic.replace(/\s+/g, ""), "FYP", "LearnOnTikTok", "Viral", "Trending", "Tutorial"],
    youtube: [topic.replace(/\s+/g, ""), "Tutorial", "HowTo", "LearnOnYouTube", "Education"],
    linkedin: [topic.replace(/\s+/g, ""), "ProfessionalDevelopment", "Leadership", "CareerGrowth", "Innovation"],
    twitter: [topic.replace(/\s+/g, ""), "Thread", "Insights"],
  };

  const emojiMap: Record<Tone, string[]> = {
    fun: ["🎉", "😂", "✨", "🔥", "💯", "🙌"],
    professional: ["💡", "📊", "🎯", "📈", "✅"],
    viral: ["🤯", "😱", "🛑", "👀", "💥", "🔥"],
  };

  const postingTimeMap: Record<Platform, string> = {
    instagram: "Tuesday-Thursday, 9-11 AM or 7-9 PM (your audience's local time)",
    tiktok: "Tuesday-Thursday, 10 AM-12 PM or 7-9 PM (peak engagement hours)",
    youtube: "Thursday-Saturday, 2-4 PM (best for initial push by the algorithm)",
    linkedin: "Tuesday-Thursday, 8-10 AM or 12 PM (business hours)",
    twitter: "Monday-Friday, 8-10 AM or 12-1 PM (commute and lunch breaks)",
  };

  return {
    caption: captions[platform]?.[tone] || `Check out my latest content about ${topic}! 🚀`,
    hashtags: hashtagMap[platform] || [topic.replace(/\s+/g, "")],
    emojiSuggestions: emojiMap[tone] || ["🚀", "💡", "✨"],
    bestPostingTime: postingTimeMap[platform] || "Weekdays 9-11 AM or 7-9 PM",
  };
}
