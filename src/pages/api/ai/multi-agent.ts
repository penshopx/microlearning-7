import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { AGENTS } from "@/lib/agents-data";
import type { AgentId } from "@/lib/agents-data";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/* ── Orchestrator: pilih agent terbaik ─────────────── */
async function routeToAgent(query: string, history: Array<{ role: string; content: string }>): Promise<{ agentId: AgentId; confidence: number; reason: string }> {
  const agentList = Object.values(AGENTS).map(a =>
    `- ${a.id}: ${a.title} (keywords: ${a.keywords.slice(0, 6).join(", ")})`
  ).join("\n");

  const recentHistory = history.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");

  const orchestratorPrompt = `Kamu adalah orchestrator sistem multi-agent AI untuk konsultasi konstruksi Indonesia.

Daftar agent yang tersedia:
${agentList}

Riwayat percakapan terakhir:
${recentHistory || "(tidak ada riwayat)"}

Pertanyaan pengguna: "${query}"

Pilih satu agent yang paling tepat untuk menjawab pertanyaan ini. Pertimbangkan konteks dan riwayat percakapan.

Balas HANYA dengan JSON valid:
{"agentId": "id_agent", "confidence": 0.0-1.0, "reason": "alasan singkat 1 kalimat"}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: orchestratorPrompt }],
    max_completion_tokens: 150,
    response_format: { type: "json_object" },
  });

  const raw = JSON.parse(resp.choices[0]?.message?.content || "{}");
  const agentId = (raw.agentId && raw.agentId in AGENTS) ? raw.agentId as AgentId : "struktur";
  return { agentId, confidence: raw.confidence ?? 0.8, reason: raw.reason ?? "Dipilih oleh sistem" };
}

/* ── Main handler ───────────────────────────────────── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history = [], preferredAgent, sessionId, memoryContext = "" } = req.body;

    if (!message?.trim()) return res.status(400).json({ error: "message is required" });

    // Step 1: route
    let agentId: AgentId;
    let routingReason: string;
    let confidence: number;

    if (preferredAgent && preferredAgent in AGENTS) {
      agentId = preferredAgent as AgentId;
      routingReason = `Dipilih manual oleh pengguna`;
      confidence = 1.0;
    } else {
      const routing = await routeToAgent(message, history);
      agentId = routing.agentId;
      routingReason = routing.reason;
      confidence = routing.confidence;
    }

    const agent = AGENTS[agentId];

    // Step 2: build conversation history for the specialist
    const citationInstruction = `\n\nPENTING: Dalam setiap jawaban, sebutkan kode standar/regulasi secara eksplisit dan lengkap saat mereferensikannya. Contoh format yang benar: "SNI 2847:2019", "PP 50/2012", "PUIL 2011", "ISO 45001:2018", "FIDIC 1999", "Perpres 16/2018", "ASTM D1586", "SNI 8460:2017", "PMBOK 7th", "SNI 1726:2019". Jangan hanya menyebut "SNI" atau "peraturan" tanpa kode lengkap.`;

    const systemContent = memoryContext
      ? `${agent.systemPrompt}${citationInstruction}\n\n${memoryContext}`
      : `${agent.systemPrompt}${citationInstruction}`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemContent },
    ];

    // Include recent history
    const recentHistory = history.slice(-8);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: message });

    // Step 3: get specialist response
    const specialistResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_completion_tokens: 1500,
    });

    const response = specialistResp.choices[0]?.message?.content || "Maaf, saya tidak dapat memproses permintaan ini saat ini.";

    // Step 4: generate follow-up suggestions
    const followupPrompt = `Berdasarkan pertanyaan "${message}" dan jawaban yang diberikan oleh ${agent.name} (${agent.title}), buat 3 pertanyaan follow-up yang relevan dan berguna untuk pengguna. Singkat, masing-masing maksimal 10 kata. Balas hanya JSON: {"followups": ["...", "...", "..."]}`;

    const followupResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: followupPrompt }],
      max_completion_tokens: 200,
      response_format: { type: "json_object" },
    });

    const followupRaw = JSON.parse(followupResp.choices[0]?.message?.content || "{}");
    const followups: string[] = followupRaw.followups || [];

    return res.status(200).json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        title: agent.title,
        icon: agent.icon,
        color: agent.color,
        bg: agent.bg,
        accent: agent.accent,
      },
      response,
      followups,
      routing: { reason: routingReason, confidence, manual: !!preferredAgent },
      sessionId,
    });

  } catch (err) {
    console.error("Multi-agent error:", err);
    return res.status(500).json({
      error: "Gagal memproses permintaan multi-agent",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
