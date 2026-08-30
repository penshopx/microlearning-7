import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getOpenAIErrorResponse } from "@/lib/openai-error";
import {
  WORKPLACE_MISSION_VERSION,
  normalizeWorkplaceMission,
  type WorkplaceMission,
} from "@/lib/workplaceMission";

const openai = new OpenAI({
  apiKey:
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

type GeneratedMission = {
  title: string;
  durationSeconds: number;
  mission: WorkplaceMission;
};

type SourceType = "meeting" | "document";

const workplaceTrackLabels: Record<string, string> = {
  construction: "Konstruksi",
  "customer-service": "Customer Service",
  sales: "Sales",
  hr: "HR & People",
  operations: "Operasional",
  custom: "Bidang lain",
};

function createAuthenticatedClient(token: string): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

function stringifySource(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseGeneratedMissions(value: unknown, workplaceTrack: string): GeneratedMission[] {
  const payload = asRecord(value);
  const rawMissions = payload?.missions;
  if (!Array.isArray(rawMissions) || rawMissions.length < 1 || rawMissions.length > 5) {
    throw new Error("AI returned an invalid mission count");
  }

  return rawMissions.map((item, index) => {
    const raw = asRecord(item);
    const title = typeof raw?.title === "string" ? raw.title.trim() : "";
    const durationSeconds = typeof raw?.durationSeconds === "number"
      ? Math.max(180, Math.min(1200, Math.round(raw.durationSeconds)))
      : 480;
    const mission = normalizeWorkplaceMission({
      ...raw,
      kind: "workplace-mission",
      version: WORKPLACE_MISSION_VERSION,
      workplaceTrack,
    });

    if (
      !title ||
      !mission ||
      !mission.objective.statement ||
      mission.objective.successCriteria.length === 0 ||
      !mission.scenario.prompt ||
      mission.scenario.options.length < 2 ||
      !mission.scenario.recommendedAction ||
      !mission.scenario.options.includes(mission.scenario.recommendedAction) ||
      mission.practice.length === 0 ||
      mission.practice.some((step) => !step.instruction || step.checklist.length === 0) ||
      mission.evidence.length === 0 ||
      !mission.feedback.prompt ||
      mission.feedback.questions.length === 0 ||
      !mission.repetition.nextAction
    ) {
      throw new Error(`AI returned an incomplete mission at index ${index}`);
    }

    return { title, durationSeconds, mission };
  });
}

async function generateMissionsFromSource(
  sourceText: string,
  sourceType: SourceType,
  workplaceTrack: string,
  courseTitle: string,
  sourceName?: string,
): Promise<GeneratedMission[]> {
  const sourceLabel = sourceType === "meeting" ? "meeting" : "dokumen kerja (misalnya SOP, instruksi kerja, job description, atau kebijakan)";
  const trackLabel = workplaceTrackLabels[workplaceTrack] || workplaceTrack;
  const sourceHeading = sourceType === "document" && sourceName?.trim()
    ? `Dokumen: ${sourceName.trim().slice(0, 200)}`
    : `Sumber ${sourceType === "meeting" ? "meeting" : "dokumen kerja"}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    max_completion_tokens: 6000,
    messages: [
      {
        role: "system",
        content: `Kamu adalah workplace coach. Ubah isi ${sourceLabel} menjadi 2-4 misi kerja singkat yang harus dipraktikkan, bukan course atau modul belajar.

Kembalikan JSON valid dengan bentuk:
{
  "missions": [{
    "title": "judul tindakan, bukan judul pelajaran",
    "durationSeconds": 300,
    "objective": {
      "statement": "hasil kerja yang harus dicapai",
      "successCriteria": ["indikator yang dapat diamati", "indikator kedua"]
    },
    "scenario": {
      "prompt": "situasi keputusan yang realistis dari meeting",
      "decisionQuestion": "pertanyaan keputusan",
      "options": ["opsi A", "opsi B", "opsi C"],
      "recommendedAction": "harus sama persis dengan salah satu options",
      "debrief": "alasan praktis"
    },
    "knowledge": ["maksimal tiga pegangan singkat"],
    "practice": [{
      "id": "practice-1",
      "instruction": "tindakan nyata di tempat kerja",
      "checklist": ["langkah yang bisa dicentang", "langkah kedua"],
      "estimatedMinutes": 10
    }],
    "evidence": [{
      "id": "evidence-1",
      "type": "photo|checklist|written|recording|reflection|other",
      "label": "nama bukti",
      "instruction": "cara menyiapkan bukti",
      "required": true
    }],
    "feedback": {
      "prompt": "ajakan refleksi",
      "questions": ["pertanyaan refleksi", "pertanyaan perbaikan"],
      "coachTip": "saran singkat"
    },
    "repetition": {
      "intervalDays": 3,
      "nextAction": "cara mengulang pada situasi kerja berikutnya",
      "cadenceLabel": "Ulangi dalam 3 hari"
    }
  }]
}

        Semua isi harus spesifik pada keputusan, action item, masalah, prosedur, atau standar kerja yang benar-benar muncul dalam sumber. Gunakan Bahasa Indonesia. Jangan menambahkan fakta yang tidak ada di sumber. Setiap misi harus dapat diselesaikan dalam 5-20 menit. Jika sumber adalah SOP atau dokumen, pertahankan istilah, urutan prosedur, batasan, dan standar yang tertulis di dalamnya.`,
      },
      {
        role: "user",
        content: `Judul misi: ${courseTitle}
Domain kerja: ${trackLabel} (${workplaceTrack})

${sourceHeading}:
${sourceText.slice(0, 30000)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned an empty mission response");
  return parseGeneratedMissions(JSON.parse(raw), workplaceTrack);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      courseId,
      workplaceTrack = "custom",
      sourceType = "meeting",
      sourceText,
      sourceName,
    } = req.body || {};
    if (typeof courseId !== "string" || !courseId) {
      return res.status(400).json({ error: "Course ID required" });
    }
    if (sourceType !== "meeting" && sourceType !== "document") {
      return res.status(400).json({ error: "Jenis sumber tidak valid" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.slice("Bearer ".length);
    const db = createAuthenticatedClient(token);
    if (!db) {
      return res.status(503).json({ error: "Database connection is not configured" });
    }

    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { data: course, error: courseError } = await db
      .from("courses")
      .select("id,user_id,meeting_id,title")
      .eq("id", courseId)
      .single();
    if (courseError || !course) {
      return res.status(404).json({ error: "Mission container not found" });
    }
    if (course.user_id !== user.id) {
      return res.status(403).json({ error: "You cannot generate missions for this course" });
    }
    let source = "";
    if (sourceType === "document") {
      if (typeof sourceText !== "string" || !sourceText.trim()) {
        return res.status(422).json({ error: "Tempelkan isi dokumen atau unggah file teks terlebih dahulu" });
      }
      source = sourceText.trim();
      if (source.length < 40) {
        return res.status(422).json({ error: "Isi dokumen terlalu singkat. Masukkan minimal 40 karakter agar misi tetap kontekstual" });
      }
      if (source.length > 100 * 1024) {
        return res.status(413).json({ error: "Isi dokumen terlalu panjang. Batasi sumber hingga 100 KB" });
      }
    } else {
      if (!course.meeting_id) {
        return res.status(422).json({ error: "Course is not connected to a meeting" });
      }

      const [{ data: meeting, error: meetingError }, { data: notes, error: notesError }] =
        await Promise.all([
          db
            .from("meetings")
            .select("id,title,host_id,ai_summary,action_items,transcription_data,key_moments")
            .eq("id", course.meeting_id)
            .single(),
          db
            .from("ai_meeting_notes")
            .select("text,note_type,speaker_name,timestamp")
            .eq("meeting_id", course.meeting_id)
            .order("timestamp", { ascending: true }),
        ]);

      if (meetingError || !meeting) {
        return res.status(404).json({ error: "Source meeting not found" });
      }
      if (!meeting.host_id || meeting.host_id !== user.id) {
        return res.status(403).json({ error: "You cannot use this meeting as a mission source" });
      }
      if (notesError) throw notesError;

      const sourceParts = [
        meeting.ai_summary,
        stringifySource(meeting.transcription_data),
        stringifySource(meeting.action_items),
        stringifySource(meeting.key_moments),
        ...(notes || []).map((note) =>
          `[${note.timestamp}] ${note.speaker_name || "Peserta"} (${note.note_type || "catatan"}): ${note.text}`
        ),
      ].filter((part): part is string => Boolean(part?.trim()));

      source = sourceParts.join("\n\n");
      if (source.length < 40) {
        return res.status(422).json({
          error: "Meeting belum memiliki transkrip atau catatan yang cukup untuk membuat misi",
        });
      }
    }

    const { data: existingModules, error: existingModulesError } = await db
      .from("course_modules")
      .select("id")
      .eq("course_id", courseId)
      .limit(1);
    if (existingModulesError) throw existingModulesError;
    if (existingModules?.length) {
      return res.status(409).json({ error: "Misi untuk course ini sudah pernah dibuat" });
    }

    const track = typeof workplaceTrack === "string" ? workplaceTrack : "custom";
    const generated = await generateMissionsFromSource(
      source,
      sourceType,
      track,
      course.title,
      typeof sourceName === "string" ? sourceName : undefined,
    );

    const { data: recording } = sourceType === "meeting" && course.meeting_id
      ? await db
          .from("meeting_recordings")
          .select("recording_url")
          .eq("meeting_id", course.meeting_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    const result = await persistMissions(
      db,
      courseId,
      recording?.recording_url || null,
      generated
    );

    return res.status(200).json({
      success: true,
      message: `${sourceType === "meeting" ? "Meeting" : "Dokumen"} berhasil diubah menjadi workplace missions`,
      missionContractVersion: WORKPLACE_MISSION_VERSION,
      modulesCreated: result.modules.length,
      modules: result.modules,
      missions: result.missions,
    });
  } catch (error) {
    console.error("Source to mission error:", error);
    const aiErrorResponse = getOpenAIErrorResponse(error);
    if (aiErrorResponse) {
      return res.status(aiErrorResponse.status).json(aiErrorResponse.body);
    }
    return res.status(500).json({
      error: "Failed to create missions from source",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function persistMissions(
  db: SupabaseClient<Database>,
  courseId: string,
  recordingUrl: string | null,
  generated: GeneratedMission[]
) {
  const modules: Database["public"]["Tables"]["course_modules"]["Row"][] = [];
  const missions: WorkplaceMission[] = [];
  const createdModuleIds: string[] = [];
  let currentTime = 0;
  let totalDuration = 0;

  try {
    for (let index = 0; index < generated.length; index++) {
      const item = generated[index];
      const startTime = currentTime;
      const endTime = startTime + item.durationSeconds;
      currentTime = endTime;

      const { data: module, error: moduleError } = await db
        .from("course_modules")
        .insert({
          course_id: courseId,
          module_number: index + 1,
          title: item.title,
          description: item.mission.objective.statement,
          duration_seconds: item.durationSeconds,
          video_start_time: startTime,
          video_end_time: endTime,
          video_url: recordingUrl,
          key_points: item.mission.knowledge,
        })
        .select()
        .single();
      if (moduleError || !module) throw moduleError || new Error("Module was not created");
      createdModuleIds.push(module.id);

      const { error: contentError } = await db.from("module_content").insert({
        module_id: module.id,
        content_type: "worksheet",
        title: `Misi Praktik — ${item.title}`,
        order_index: 1,
        content_data: item.mission,
      });
      if (contentError) throw contentError;

      const { error: quizError } = await db.from("module_quizzes").insert({
        module_id: module.id,
        question_number: 1,
        question_text: `${item.mission.scenario.prompt} ${item.mission.scenario.decisionQuestion}`,
        question_type: "multiple_choice",
        options: item.mission.scenario.options,
        correct_answer: item.mission.scenario.recommendedAction,
        explanation: item.mission.scenario.debrief,
        points: 10,
      });
      if (quizError) throw quizError;

      modules.push(module);
      missions.push(item.mission);
      totalDuration += item.durationSeconds;
    }

    const { error: updateError } = await db
      .from("courses")
      .update({
        total_modules: modules.length,
        total_duration_seconds: totalDuration,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);
    if (updateError) throw updateError;

    return { modules, missions };
  } catch (error) {
    if (createdModuleIds.length) {
      await db.from("course_modules").delete().in("id", createdModuleIds);
    }
    throw error;
  }
}