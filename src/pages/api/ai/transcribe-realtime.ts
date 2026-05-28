import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Real-time Transcription Endpoint
 * Receives audio chunks during meeting and returns transcription
 * 
 * In production, this would:
 * 1. Use Deepgram/AssemblyAI for real-time streaming transcription
 * 2. Store transcription in ai_meeting_notes table
 * 3. Perform sentiment analysis on each segment
 * 4. Detect action items, decisions, and questions
 * 5. Send updates via Supabase Realtime
 * 
 * Features:
 * - Speaker diarization (who said what)
 * - Real-time sentiment analysis
 * - Auto-detect action items ("we need to...", "please do...")
 * - Auto-detect decisions ("we decided...", "let's go with...")
 * - Multi-language support (Indonesian + English)
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { meetingId, audioChunk, speakerId, timestamp } = req.body;

    // Validate auth
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // In production, call Deepgram API for real-time transcription
    // const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
    // const transcription = await deepgram.transcription.preRecorded({
    //   buffer: audioChunk,
    //   mimetype: 'audio/webm',
    // });

    // For MVP, simulate transcription
    const simulatedText = "This is a simulated transcription of the audio.";
    
    // Detect note type based on keywords
    const noteType = detectNoteType(simulatedText);
    const sentiment = analyzeSentiment(simulatedText);

    // Store in database
    const { data: note, error: noteError } = await supabase
      .from("ai_meeting_notes")
      .insert({
        meeting_id: meetingId,
        speaker_id: speakerId,
        text: simulatedText,
        note_type: noteType,
        sentiment: sentiment,
        confidence: 0.85,
        timestamp: timestamp || new Date().toISOString(),
        metadata: {
          language: "id",
          duration: 3.5,
        },
      })
      .select()
      .single();

    if (noteError) throw noteError;

    return res.status(200).json({
      success: true,
      transcription: simulatedText,
      noteType,
      sentiment,
      note,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return res.status(500).json({
      error: "Failed to transcribe",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Detect type of note based on content
 */
function detectNoteType(text: string): string {
  const lowerText = text.toLowerCase();

  // Action items detection
  if (
    lowerText.includes("we need to") ||
    lowerText.includes("please do") ||
    lowerText.includes("harus") ||
    lowerText.includes("tolong") ||
    lowerText.includes("action item")
  ) {
    return "action_item";
  }

  // Decision detection
  if (
    lowerText.includes("we decided") ||
    lowerText.includes("let's go with") ||
    lowerText.includes("we'll use") ||
    lowerText.includes("kita putuskan") ||
    lowerText.includes("kita sepakat")
  ) {
    return "decision";
  }

  // Question detection
  if (
    lowerText.includes("?") ||
    lowerText.includes("how") ||
    lowerText.includes("why") ||
    lowerText.includes("what") ||
    lowerText.includes("bagaimana") ||
    lowerText.includes("kenapa") ||
    lowerText.includes("apa")
  ) {
    return "question";
  }

  // Important marker
  if (
    lowerText.includes("important") ||
    lowerText.includes("critical") ||
    lowerText.includes("penting") ||
    lowerText.includes("krusial")
  ) {
    return "important";
  }

  return "speech";
}

/**
 * Simple sentiment analysis
 * Returns -1 (negative) to 1 (positive)
 */
function analyzeSentiment(text: string): number {
  const lowerText = text.toLowerCase();

  // Positive words
  const positiveWords = [
    "good", "great", "excellent", "amazing", "love", "perfect", "wonderful",
    "bagus", "hebat", "sempurna", "luar biasa", "setuju", "suka"
  ];

  // Negative words
  const negativeWords = [
    "bad", "terrible", "awful", "hate", "wrong", "problem", "issue",
    "buruk", "jelek", "salah", "masalah", "gagal", "susah"
  ];

  let score = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.2;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.2;
  });

  // Normalize between -1 and 1
  return Math.max(-1, Math.min(1, score));
}