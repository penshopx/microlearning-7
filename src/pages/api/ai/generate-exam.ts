import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const VALID_QUESTION_TYPES = ["mcq", "truefalse", "essay"] as const;

type Difficulty = typeof VALID_DIFFICULTIES[number];
type QuestionType = typeof VALID_QUESTION_TYPES[number];

interface ExamQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  competencyTags: string[];
  difficulty: Difficulty;
}

interface ExamResult {
  questions: ExamQuestion[];
  recommendedPassingScore: number;
  estimatedTimeMinutes: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, difficulty, questionCount, questionTypes } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'topic'" });
    }

    if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        error: "Missing or invalid 'difficulty'",
        validDifficulties: VALID_DIFFICULTIES,
      });
    }

    const count = typeof questionCount === "number" && questionCount >= 1 && questionCount <= 50
      ? questionCount
      : 10;

    const types: QuestionType[] = Array.isArray(questionTypes) &&
      questionTypes.length > 0 &&
      questionTypes.every((t: string) => VALID_QUESTION_TYPES.includes(t as QuestionType))
      ? questionTypes
      : ["mcq", "truefalse"];

    let result: ExamResult;

    try {
      result = await generateWithAI(topic, difficulty as Difficulty, count, types);
    } catch (error) {
      console.error("OpenAI API error, falling back to template:", error);
      result = generateFallback(topic, difficulty as Difficulty, count, types);
    }

    return res.status(200).json({
      success: true,
      topic,
      difficulty,
      questionCount: count,
      questionTypes: types,
      ...result,
    });
  } catch (error) {
    console.error("Generate Exam Error:", error);
    return res.status(500).json({
      error: "Failed to generate exam",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function generateWithAI(
  topic: string,
  difficulty: Difficulty,
  questionCount: number,
  questionTypes: QuestionType[]
): Promise<ExamResult> {
  const typeDescriptions = questionTypes.map(t => {
    if (t === "mcq") return "Multiple Choice (4 options, one correct)";
    if (t === "truefalse") return "True/False";
    return "Essay (open-ended)";
  }).join(", ");

  const systemPrompt = `You are an expert exam creator specializing in competency-based assessments. You always respond with valid JSON only, no markdown.`;

  const userPrompt = `Generate a competency exam about "${topic}" with the following parameters:
- Difficulty: ${difficulty}
- Number of questions: ${questionCount}
- Question types to include: ${typeDescriptions}

Distribute the questions roughly equally among the requested types. For each question:
- "mcq" type: provide "options" array with exactly 4 choices and "correctAnswer" matching one option exactly
- "truefalse" type: provide "options" as ["True", "False"] and "correctAnswer" as "True" or "False"
- "essay" type: no "options" field, "correctAnswer" should be a model answer or key points expected

Difficulty guidelines:
- beginner: basic recall and understanding, simple terminology
- intermediate: application and analysis, scenario-based
- advanced: evaluation and synthesis, complex real-world scenarios

Return a JSON object with exactly these fields:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq" | "truefalse" | "essay",
      "question": "the question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "the correct answer",
      "explanation": "why this is the correct answer",
      "competencyTags": ["tag1", "tag2"],
      "difficulty": "${difficulty}"
    }
  ],
  "recommendedPassingScore": 70,
  "estimatedTimeMinutes": 30
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 4096,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "";

  try {
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      questions: Array.isArray(parsed.questions)
        ? parsed.questions.map((q: any, i: number) => ({
            id: q.id || i + 1,
            type: q.type || "mcq",
            question: q.question || "",
            ...(q.options ? { options: q.options } : {}),
            correctAnswer: q.correctAnswer || "",
            explanation: q.explanation || "",
            competencyTags: Array.isArray(q.competencyTags) ? q.competencyTags : [],
            difficulty: q.difficulty || difficulty,
          }))
        : [],
      recommendedPassingScore: parsed.recommendedPassingScore || 70,
      estimatedTimeMinutes: parsed.estimatedTimeMinutes || 30,
    };
  } catch {
    return generateFallback(topic, difficulty, questionCount, questionTypes);
  }
}

function generateFallback(
  topic: string,
  difficulty: Difficulty,
  questionCount: number,
  questionTypes: QuestionType[]
): ExamResult {
  const questions: ExamQuestion[] = [];
  let id = 1;

  const perType = Math.ceil(questionCount / questionTypes.length);

  for (const type of questionTypes) {
    const count = Math.min(perType, questionCount - questions.length);
    for (let i = 0; i < count; i++) {
      if (questions.length >= questionCount) break;

      if (type === "mcq") {
        questions.push({
          id: id++,
          type: "mcq",
          question: `Apa konsep dasar dari ${topic} yang paling penting untuk dipahami? (Pertanyaan ${id - 1})`,
          options: [
            `Pemahaman mendalam tentang prinsip ${topic}`,
            `Penerapan praktis ${topic} dalam pekerjaan`,
            `Evaluasi hasil dari ${topic}`,
            `Semua jawaban di atas benar`,
          ],
          correctAnswer: "Semua jawaban di atas benar",
          explanation: `Semua aspek tersebut penting dalam memahami ${topic} secara komprehensif.`,
          competencyTags: [topic, "Pemahaman Konsep"],
          difficulty,
        });
      } else if (type === "truefalse") {
        questions.push({
          id: id++,
          type: "truefalse",
          question: `${topic} memerlukan pemahaman yang mendalam dan praktik berkelanjutan untuk dikuasai. (Pertanyaan ${id - 1})`,
          options: ["True", "False"],
          correctAnswer: "True",
          explanation: `Benar, ${topic} memerlukan kombinasi teori dan praktik untuk penguasaan yang efektif.`,
          competencyTags: [topic, "Pengetahuan Dasar"],
          difficulty,
        });
      } else {
        questions.push({
          id: id++,
          type: "essay",
          question: `Jelaskan bagaimana ${topic} dapat diterapkan dalam konteks profesional. Berikan contoh konkret. (Pertanyaan ${id - 1})`,
          correctAnswer: `Jawaban yang baik harus mencakup: 1) Definisi ${topic}, 2) Contoh penerapan nyata, 3) Manfaat dan tantangan, 4) Strategi implementasi.`,
          explanation: `Pertanyaan ini menguji kemampuan analisis dan penerapan ${topic} dalam situasi nyata.`,
          competencyTags: [topic, "Analisis", "Penerapan"],
          difficulty,
        });
      }
    }
  }

  const passingScoreMap: Record<Difficulty, number> = {
    beginner: 60,
    intermediate: 70,
    advanced: 80,
  };

  const timePerQuestion: Record<QuestionType, number> = {
    mcq: 2,
    truefalse: 1,
    essay: 5,
  };

  const estimatedTime = questions.reduce((total, q) => total + (timePerQuestion[q.type] || 2), 0);

  return {
    questions,
    recommendedPassingScore: passingScoreMap[difficulty],
    estimatedTimeMinutes: estimatedTime,
  };
}
