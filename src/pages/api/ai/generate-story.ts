import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const VALID_INDUSTRIES = ["construction", "business", "technology", "health", "education", "marketing"] as const;
const VALID_AUDIENCES = ["beginner", "intermediate", "advanced"] as const;

type Industry = typeof VALID_INDUSTRIES[number];
type Audience = typeof VALID_AUDIENCES[number];

interface StoryScene {
  sceneNumber: number;
  title: string;
  narration: string;
  visualDescription: string;
  imagePrompt: string;
  learningPoint: string;
  emotion: string;
}

interface StoryQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface StoryResponse {
  title: string;
  synopsis: string;
  characters: { name: string; role: string; description: string }[];
  scenes: StoryScene[];
  quiz: StoryQuiz[];
  learningPoints: string[];
  industry: string;
  targetAudience: string;
}

const INDUSTRY_LABELS: Record<Industry, string> = {
  construction: "Konstruksi & Properti",
  business: "Bisnis & Entrepreneurship",
  technology: "Teknologi & Digital",
  health: "Kesehatan & Medis",
  education: "Pendidikan & Pelatihan",
  marketing: "Marketing & Komunikasi",
};

function getFallbackStory(topic: string, industry: string, sceneCount: number): StoryResponse {
  const scenes: StoryScene[] = [];
  const count = Math.min(Math.max(sceneCount, 3), 10);
  for (let i = 1; i <= count; i++) {
    scenes.push({
      sceneNumber: i,
      title: `Babak ${i}: ${topic}`,
      narration: `Di babak ke-${i} cerita ini, kita melihat bagaimana karakter utama menghadapi tantangan terkait ${topic}. Setiap langkah membawa pelajaran berharga yang bisa diterapkan dalam kehidupan nyata.`,
      visualDescription: `Ilustrasi scene ${i} menampilkan karakter utama dalam situasi yang berkaitan dengan ${topic}`,
      imagePrompt: `Storybook illustration scene ${i} about ${topic} in ${industry} setting, warm cartoon style`,
      learningPoint: `Pelajaran ${i}: Pentingnya memahami aspek dasar dari ${topic}`,
      emotion: i === 1 ? "hopeful" : i === sceneCount ? "triumphant" : "determined",
    });
  }

  return {
    title: `Cerita tentang ${topic}`,
    synopsis: `Sebuah cerita inspiratif tentang ${topic} yang dikemas dalam format visual storytelling.`,
    characters: [
      { name: "Karakter Utama", role: "Protagonis", description: "Seorang individu yang bersemangat belajar" },
      { name: "Mentor", role: "Pembimbing", description: "Seorang ahli yang memberikan arahan" },
    ],
    scenes,
    quiz: [
      {
        question: `Apa pelajaran utama dari cerita tentang ${topic}?`,
        options: ["Kerja keras", "Keberuntungan", "Ketekunan dan pembelajaran", "Tidak ada"],
        correctAnswer: 2,
        explanation: "Ketekunan dan pembelajaran berkelanjutan adalah kunci keberhasilan.",
      },
    ],
    learningPoints: scenes.map((s) => s.learningPoint),
    industry,
    targetAudience: "beginner",
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, industry, targetAudience, sceneCount } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'topic'" });
    }

    const validIndustry: Industry = VALID_INDUSTRIES.includes(industry) ? industry : "business";
    const validAudience: Audience = VALID_AUDIENCES.includes(targetAudience) ? targetAudience : "beginner";
    const validSceneCount = Math.min(Math.max(Number(sceneCount) || 5, 3), 10);

    const industryLabel = INDUSTRY_LABELS[validIndustry];

    const systemPrompt = `Kamu adalah penulis cerita edukatif profesional yang mengubah topik pembelajaran menjadi cerita visual bergambar (storybook) yang menarik dan mendidik. Ceritamu harus:
- Menggunakan karakter-karakter relatable dari Indonesia
- Mengajarkan konsep melalui alur cerita, bukan ceramah
- Setiap scene punya pelajaran tersembunyi yang terungkap secara alami
- Emosi karakter harus terasa nyata
- Visual description harus detail untuk ilustrasi
- Quiz di akhir menguji pemahaman dari cerita

Industri: ${industryLabel}
Target audiens: ${validAudience === "beginner" ? "Pemula" : validAudience === "intermediate" ? "Menengah" : "Lanjutan"}`;

    const userPrompt = `Buatkan cerita storybook edukatif tentang: "${topic}"

Jumlah scene: ${validSceneCount}

Respond dalam JSON format EXACT seperti ini:
{
  "title": "Judul cerita yang menarik",
  "synopsis": "Ringkasan cerita 2-3 kalimat",
  "characters": [
    { "name": "Nama Karakter", "role": "Peran", "description": "Deskripsi singkat" }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Judul scene",
      "narration": "Narasi cerita 3-5 kalimat, deskriptif dan emosional",
      "visualDescription": "Deskripsi visual detail untuk ilustrasi scene ini",
      "imagePrompt": "English prompt for AI image generation, detailed storybook illustration style",
      "learningPoint": "Pelajaran yang dipetik dari scene ini",
      "emotion": "hopeful/determined/anxious/triumphant/reflective/joyful"
    }
  ],
  "quiz": [
    {
      "question": "Pertanyaan tentang cerita",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctAnswer": 0,
      "explanation": "Penjelasan jawaban benar"
    }
  ],
  "learningPoints": ["Pelajaran 1", "Pelajaran 2"]
}

Buat ${Math.max(2, Math.floor(validSceneCount / 2))} quiz questions dan kumpulkan semua learning points.
IMPORTANT: Return ONLY valid JSON, no markdown formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "";

    let cleaned = content;
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const story: StoryResponse = JSON.parse(cleaned);
    story.industry = validIndustry;
    story.targetAudience = validAudience;

    return res.status(200).json(story);
  } catch (error) {
    console.error("Story generation error:", error);

    const { topic, industry, sceneCount } = req.body || {};
    const fallback = getFallbackStory(
      topic || "Pembelajaran",
      industry || "business",
      Number(sceneCount) || 5
    );

    return res.status(200).json(fallback);
  }
}
