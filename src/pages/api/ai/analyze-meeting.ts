import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Post-Meeting AI Analysis
 * Analyzes entire meeting and generates comprehensive insights
 * 
 * In production, this would:
 * 1. Use OpenAI GPT-4 to analyze full transcript
 * 2. Generate executive summary
 * 3. Extract all action items and decisions
 * 4. Create meeting score and recommendations
 * 5. Identify key moments and highlights
 * 6. Generate follow-up email draft
 * 
 * Example GPT-4 Prompt:
 * "Analyze this meeting transcript and provide:
 * 1. Executive summary (2-3 paragraphs)
 * 2. Key decisions made
 * 3. Action items with assigned owners
 * 4. Topics discussed
 * 5. Meeting effectiveness score (1-10)
 * 6. Recommendations for improvement"
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { meetingId } = req.body;

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

    // Get meeting data
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Get all AI notes from meeting
    const { data: notes, error: notesError } = await supabase
      .from("ai_meeting_notes")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("timestamp", { ascending: true });

    if (notesError) throw notesError;

    // In production, call OpenAI GPT-4
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const analysis = await openai.chat.completions.create({
    //   model: "gpt-4-turbo",
    //   messages: [
    //     {
    //       role: "system",
    //       content: "You are an expert meeting analyst. Analyze transcripts and provide actionable insights."
    //     },
    //     {
    //       role: "user",
    //       content: `Analyze this meeting transcript: ${JSON.stringify(notes)}`
    //     }
    //   ]
    // });

    // For MVP, generate simulated analysis
    const actionItems = notes?.filter(n => n.note_type === "action_item") || [];
    const decisions = notes?.filter(n => n.note_type === "decision") || [];
    const avgSentiment = notes?.reduce((sum, n) => sum + (n.sentiment || 0), 0) / (notes?.length || 1);

    const aiSummary = `
This meeting covered ${notes?.length || 0} discussion points with an average sentiment score of ${avgSentiment.toFixed(2)}.
${actionItems.length} action items were identified and ${decisions.length} key decisions were made.
Overall meeting effectiveness: ${Math.round((avgSentiment + 1) * 5)}/10.
    `.trim();

    const keyMoments = notes
      ?.filter(n => n.note_type === "important" || n.sentiment > 0.5 || n.sentiment < -0.5)
      .slice(0, 5)
      .map(n => ({
        timestamp: n.timestamp,
        text: n.text,
        type: n.note_type,
        sentiment: n.sentiment,
      })) || [];

    // Update meeting with AI analysis
    const { error: updateError } = await supabase
      .from("meetings")
      .update({
        ai_summary: aiSummary,
        action_items: actionItems.map(a => ({
          id: a.id,
          text: a.text,
          timestamp: a.timestamp,
        })),
        key_moments: keyMoments,
        transcription_status: "completed",
      })
      .eq("id", meetingId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      analysis: {
        summary: aiSummary,
        actionItems,
        decisions,
        keyMoments,
        sentiment: avgSentiment,
        effectivenessScore: Math.round((avgSentiment + 1) * 5),
        recommendations: [
          "Keep discussions focused on key topics",
          "Follow up on all action items within 48 hours",
          "Schedule shorter, more frequent check-ins",
        ],
      },
    });
  } catch (error) {
    console.error("Meeting analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze meeting",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}