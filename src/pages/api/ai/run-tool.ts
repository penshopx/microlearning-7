import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { AI_TOOLS } from "@/lib/tools-data";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { toolId, formData } = req.body;
    if (!toolId || !formData) return res.status(400).json({ error: "toolId and formData required" });

    const tool = AI_TOOLS.find(t => t.id === toolId);
    if (!tool) return res.status(404).json({ error: `Tool '${toolId}' not found` });

    const prompt = tool.buildPrompt(formData);

    const systemPrompt = `Kamu adalah AI assistant konstruksi Indonesia yang sangat berpengalaman dan presisi. 
Hasilkan output yang profesional, terstruktur, langsung bisa digunakan di lapangan.
Gunakan format Markdown yang baik (heading ##, bold **, tabel, bullet lists, numbered lists).
Bahasa Indonesia formal dan teknis. Jangan tambahkan disclaimer panjang — langsung ke output.
Sebutkan kode standar SNI/PP/ISO secara eksplisit ketika mereferensikan regulasi.`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 2000,
    });

    const output = resp.choices[0]?.message?.content || "Gagal menghasilkan output.";

    return res.status(200).json({
      success: true,
      toolId,
      toolName: tool.name,
      output,
      outputLabel: tool.outputLabel,
    });

  } catch (err) {
    console.error("run-tool error:", err);
    return res.status(500).json({
      error: "Gagal menjalankan tool",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
