import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * AI Meeting Chunking Endpoint
 * Splits long meeting recordings into bite-sized 5-7 minute modules
 * 
 * In production, this would:
 * 1. Use OpenAI Whisper for transcription with timestamps
 * 2. Analyze transcript to detect topic changes (GPT-4)
 * 3. Create natural break points every 5-7 minutes
 * 4. Use FFmpeg to split video at those timestamps
 * 5. Generate thumbnail for each chunk
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { courseId, recordingUrl, workplaceTrack = "construction" } = req.body;

    if (!courseId || !recordingUrl) {
      return res.status(400).json({ error: "Course ID and recording URL required" });
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

    // In production: Call OpenAI Whisper API
    // const transcription = await openai.audio.transcriptions.create({
    //   file: recordingFile,
    //   model: "whisper-1",
    //   response_format: "verbose_json",
    //   timestamp_granularities: ["segment"]
    // });

    // In production: Analyze transcript for topic changes
    // const analysis = await openai.chat.completions.create({
    //   model: "gpt-4-turbo-preview",
    //   messages: [{
    //     role: "system",
    //     content: "Analyze this transcript and identify natural topic breaks for 5-7 minute learning modules. Return JSON with timestamps and titles."
    //   }]
    // });

    const missions = await buildWorkplaceMissions(
      courseId,
      recordingUrl,
      typeof workplaceTrack === "string" ? workplaceTrack : "construction"
    );

    return res.status(200).json({
      success: true,
      message: "Meeting berhasil diubah menjadi workplace missions",
      modulesCreated: missions.length,
      modules: missions,
    });
  } catch (error) {
    console.error("Meeting Chunking Error:", error);
    return res.status(500).json({
      error: "Failed to chunk meeting",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Builds a practical mission structure while preserving the existing course/module schema.
 * The mission blueprint is stored in module_content.content_data as a worksheet.
 */
async function buildWorkplaceMissions(
  courseId: string,
  recordingUrl: string,
  workplaceTrack: string
) {
  const profiles: Record<string, {
    label: string;
    skill: string;
    action: string;
    evidence: string;
    scenario: string;
  }> = {
    construction: {
      label: "Konstruksi",
      skill: "mengidentifikasi risiko sebelum pekerjaan dimulai",
      action: "lakukan pemeriksaan singkat pada satu area kerja menggunakan checklist",
      evidence: "foto kondisi lapangan dan checklist yang sudah diisi",
      scenario: "Kamu menemukan kondisi yang berbeda dari rencana kerja sesaat sebelum aktivitas dimulai.",
    },
    "customer-service": {
      label: "Customer Service",
      skill: "merespons pelanggan dengan empati dan langkah lanjut yang jelas",
      action: "buat respons tiga kalimat untuk satu keluhan pelanggan nyata atau simulasi",
      evidence: "respons tertulis atau rekaman simulasi percakapan",
      scenario: "Pelanggan sudah menghubungi tiga kali dan mengatakan masalahnya belum selesai.",
    },
    sales: {
      label: "Sales",
      skill: "menggali kebutuhan sebelum menawarkan solusi",
      action: "praktikkan tiga pertanyaan discovery pada satu prospek atau simulasi",
      evidence: "catatan kebutuhan prospek dan refleksi singkat",
      scenario: "Prospek langsung meminta harga sebelum menjelaskan kebutuhannya.",
    },
    hr: {
      label: "HR & People",
      skill: "memberikan feedback yang spesifik dan dapat ditindaklanjuti",
      action: "ubah satu feedback umum menjadi observasi, dampak, dan langkah berikutnya",
      evidence: "naskah feedback atau catatan sesi coaching",
      scenario: "Seorang anggota tim menerima feedback 'tingkatkan komunikasi' tanpa contoh perilaku.",
    },
    operations: {
      label: "Operasional",
      skill: "menjalankan SOP secara konsisten dan mengenali penyimpangan",
      action: "audit satu proses kerja menggunakan checklist SOP",
      evidence: "checklist proses dan satu catatan penyimpangan",
      scenario: "Tim melewati satu langkah SOP karena merasa pekerjaan sedang mendesak.",
    },
    custom: {
      label: "Pekerjaan",
      skill: "mengubah keputusan meeting menjadi tindakan kerja yang terukur",
      action: "pilih satu keputusan dan tulis tindakan, PIC, serta batas waktunya",
      evidence: "catatan tindakan dan bukti tindak lanjut",
      scenario: "Meeting berakhir dengan beberapa keputusan, tetapi belum ada PIC dan tenggat yang jelas.",
    },
  };

  const profile = profiles[workplaceTrack] || profiles.custom;
  const topics = [
    {
      title: `Kenali standar kerja: ${profile.label}`,
      duration: 300,
      objective: `Memahami indikator utama untuk ${profile.skill}.`,
      learn: ["Temukan tujuan kerja dari meeting", "Kenali risiko atau kesalahan yang perlu dicegah", "Tentukan indikator hasil yang bisa diamati"],
      practice: [`Tuliskan tiga indikator keberhasilan untuk ${profile.skill}.`],
      evidence: ["Catatan tiga indikator kerja"],
    },
    {
      title: `Praktikkan satu tindakan: ${profile.label}`,
      duration: 480,
      objective: `Menerapkan skill pada situasi kerja yang relevan.`,
      learn: ["Gunakan konteks, bukan jawaban hafalan", "Pilih tindakan yang paling aman dan dapat diverifikasi", "Catat alasan keputusan"],
      practice: [profile.action],
      evidence: [profile.evidence],
    },
    {
      title: `Buktikan dan refleksikan: ${profile.label}`,
      duration: 360,
      objective: "Menunjukkan penerapan skill dan menentukan perbaikan berikutnya.",
      learn: ["Bandingkan hasil dengan indikator", "Catat satu hal yang berhasil", "Pilih satu perbaikan untuk pengulangan"],
      practice: ["Tinjau bukti praktik dan tulis refleksi singkat: lanjutkan, hentikan, mulai."],
      evidence: [profile.evidence, "Refleksi satu paragraf"],
    },
  ];

  const modules = [];
  let currentTime = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const startTime = currentTime;
    const endTime = currentTime + topic.duration;
    currentTime = endTime;
    
    // Create module
    const { data: module, error } = await supabase
      .from("course_modules")
      .insert({
        course_id: courseId,
        module_number: i + 1,
        title: topic.title,
        description: topic.objective,
        duration_seconds: topic.duration,
        video_start_time: startTime,
        video_end_time: endTime,
        video_url: recordingUrl,
        key_points: topic.learn,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating module:", error);
      continue;
    }

    if (module) {
      await supabase.from("module_content").insert({
        module_id: module.id,
        content_type: "worksheet",
        title: `Panduan Praktik — ${topic.title}`,
        order_index: 1,
        content_data: {
          kind: "workplace-mission",
          version: 1,
          workplaceTrack,
          objective: topic.objective,
          learn: topic.learn,
          practice: topic.practice,
          evidence: topic.evidence,
          scenario: profile.scenario,
          feedbackPrompt: "Apa yang berhasil, apa yang perlu diperbaiki, dan kapan skill ini perlu diulang?",
          repeatAfterDays: i === topics.length - 1 ? 7 : 3,
        },
      });

      const correctAnswer = "Hentikan sejenak, klarifikasi kondisi, lalu tentukan tindakan dan bukti yang diperlukan.";
      await supabase.from("module_quizzes").insert({
        module_id: module.id,
        question_number: 1,
        question_text: `${profile.scenario} Apa respons pertama yang paling tepat?`,
        question_type: "multiple_choice",
        options: [
          "Lanjutkan pekerjaan agar target tetap tercapai.",
          correctAnswer,
          "Tunggu orang lain menemukan masalah yang sama.",
          "Catat masalah tanpa menentukan tindakan berikutnya.",
        ],
        correct_answer: correctAnswer,
        explanation: "Workplace mission mengutamakan klarifikasi konteks, tindakan yang jelas, dan bukti yang dapat diverifikasi.",
        points: 10,
      });

      modules.push(module);
    }
  }

  return modules;
}