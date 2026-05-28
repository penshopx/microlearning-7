import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, competencyUnit, sector, level, title, context } = req.body;

    if (!competencyUnit || !type) {
      return res.status(400).json({ error: "competencyUnit and type are required" });
    }

    const levelMap: Record<string, string> = {
      L1: "Awareness (mengetahui dan memahami konsep dasar)",
      L2: "Application (mampu menerapkan dengan bimbingan)",
      L3: "Mastery (menguasai dan mandiri dalam penerapan)",
      L4: "Strategic (mampu mengajarkan dan mengembangkan)",
    };

    const levelDesc = levelMap[level] || levelMap.L2;

    let prompt = "";
    let systemPrompt = `Kamu adalah ahli pengembangan kompetensi berbasis SKKNI (Standar Kompetensi Kerja Nasional Indonesia) yang berpengalaman dalam merancang e-course terstruktur dan evidensi-based. Berikan respons dalam Bahasa Indonesia yang profesional dan terstruktur. Selalu kembalikan respons sebagai JSON valid.`;

    if (type === "indicators") {
      prompt = `Buat indikator kompetensi untuk unit kompetensi SKKNI:
Unit: "${competencyUnit}"
Judul: "${title || competencyUnit}"
Sektor: "${sector}"
Level: ${level} - ${levelDesc}

Hasilkan JSON dengan format:
{
  "objective": "string - tujuan pembelajaran dalam 1-2 kalimat",
  "standards": ["string", "string", "string"],
  "indicators": ["string", "string", "string", "string"]
}

Pastikan:
- Objective dimulai dengan "Setelah menyelesaikan e-course ini, peserta mampu..."
- Standards menggunakan kata kerja operasional (menganalisis, merancang, mengevaluasi, dll.)
- Indicators spesifik, terukur, dan sesuai level kompetensi ${level}`;

    } else if (type === "konteks") {
      prompt = `Buat konteks pembelajaran untuk unit kompetensi SKKNI:
Unit: "${competencyUnit}"
Judul: "${title || competencyUnit}"
Sektor: "${sector}"
Level: ${level} - ${levelDesc}

Hasilkan JSON dengan format:
{
  "caseStudy": "string - studi kasus nyata 3-4 kalimat, konteks Indonesia",
  "realScenario": "string - skenario situasi kerja konkret 2-3 kalimat",
  "relevance": "string - relevansi kompetensi untuk peserta 2-3 kalimat"
}`;

    } else if (type === "microlearning") {
      prompt = `Buat rencana konten microlearning untuk unit kompetensi SKKNI:
Unit: "${competencyUnit}"
Judul: "${title || competencyUnit}"
Sektor: "${sector}"
Level: ${level} - ${levelDesc}

Hasilkan JSON dengan format:
{
  "videoTopics": ["string", "string", "string", "string", "string"],
  "articles": ["string", "string", "string"],
  "aiSummary": "string - ringkasan modul 2-3 kalimat"
}

Topik video harus berjenjang (dari konsep dasar hingga penerapan), masing-masing cukup untuk 5-7 menit.`;

    } else if (type === "praktik") {
      prompt = `Buat rencana tugas praktik untuk unit kompetensi SKKNI:
Unit: "${competencyUnit}"
Judul: "${title || competencyUnit}"
Sektor: "${sector}"
Level: ${level} - ${levelDesc}

Hasilkan JSON dengan format:
{
  "tasks": ["string", "string", "string", "string"],
  "workBased": "string - deskripsi konteks praktik kerja nyata 2-3 kalimat",
  "duration": "string - estimasi durasi (misal: 2 minggu / 10 jam kerja)"
}

Tugas harus berbasis pekerjaan nyata dan sesuai konteks Indonesia.`;

    } else if (type === "refleksi") {
      prompt = `Buat panduan refleksi dan evidensi untuk unit kompetensi SKKNI:
Unit: "${competencyUnit}"
Judul: "${title || competencyUnit}"
Sektor: "${sector}"
Level: ${level} - ${levelDesc}

Hasilkan JSON dengan format:
{
  "selfAssessment": "string - pertanyaan refleksi mendalam untuk peserta (3-4 pertanyaan dalam 1 paragraf)",
  "evidenceTypes": ["string", "string", "string", "string"],
  "portfolioItems": ["string", "string", "string"]
}`;

    } else if (type === "full") {
      prompt = `Buat rancangan lengkap e-course berbasis kompetensi untuk unit SKKNI:
Unit: "${competencyUnit}"
Judul: "${title || competencyUnit}"
Sektor: "${sector}"
Level: ${level} - ${levelDesc}

Hasilkan JSON lengkap dengan format:
{
  "orientasi": {
    "objective": "string",
    "standards": ["string", "string", "string"],
    "indicators": ["string", "string", "string", "string"]
  },
  "konteks": {
    "caseStudy": "string",
    "realScenario": "string",
    "relevance": "string"
  },
  "microlearning": {
    "videoTopics": ["string", "string", "string", "string", "string"],
    "articles": ["string", "string", "string"],
    "aiSummary": "string"
  },
  "praktik": {
    "tasks": ["string", "string", "string", "string"],
    "workBased": "string",
    "duration": "string"
  },
  "refleksi": {
    "selfAssessment": "string",
    "evidenceTypes": ["string", "string", "string", "string"],
    "portfolioItems": ["string", "string", "string"]
  },
  "estimatedDuration": "string",
  "keyCompetencies": ["string", "string", "string"]
}`;

    } else {
      return res.status(400).json({ error: `Unknown generation type: ${type}` });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: type === "full" ? 4096 : 2048,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return res.status(200).json({ success: true, data: parsed, type });
  } catch (error) {
    console.error("Competency AI generation error:", error);
    return res.status(500).json({
      error: "Gagal generate konten AI",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
