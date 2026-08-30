import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { AI_TOOLS } from "@/lib/tools-data";
import { classifyOpenAIError } from "@/lib/openai-error";
import { initSSE, sseChunk, sseEvent, sseDone, sseError } from "@/lib/sse";

export const config = { api: { responseLimit: false } };

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `Kamu adalah AI assistant konstruksi Indonesia yang sangat berpengalaman dan presisi.
Hasilkan output yang profesional, terstruktur, langsung bisa digunakan di lapangan.
Gunakan format Markdown yang baik (heading ##, bold **, tabel, bullet lists, numbered lists).
Bahasa Indonesia formal dan teknis. Jangan tambahkan disclaimer panjang — langsung ke output.
Sebutkan kode standar SNI/PP/ISO secara eksplisit ketika mereferensikan regulasi.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { toolId, formData } = req.body;
  if (!toolId || !formData) return res.status(400).json({ error: "toolId and formData required" });

  const tool = AI_TOOLS.find(t => t.id === toolId);
  if (!tool) return res.status(404).json({ error: `Tool '${toolId}' not found` });

  const prompt = tool.buildPrompt(formData);

  initSSE(res);
  sseEvent(res, "meta", { toolId, toolName: tool.name, outputLabel: tool.outputLabel });

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 2000,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) sseChunk(res, delta);
    }

    sseDone(res);
  } catch (err) {
    console.error("run-tool error:", err);
    const aiErr = classifyOpenAIError(err);
    sseError(
      res,
      aiErr.isAIUnavailable ? aiErr.userMessage : (err instanceof Error ? err.message : "Gagal menjalankan tool"),
      aiErr.isApiKeyError ? { code: aiErr.code, adminUrl: "/admin" } : undefined,
    );
  }
}
