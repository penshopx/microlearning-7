/* Blackboard Pattern — Multi-Agent Collaboration
   Inspired by: "The Blackboard Pattern enables agents to post contributions
   to a shared workspace, allowing multiple agents to collaboratively solve
   complex problems." — Event-Driven Design for Agents, Confluent 2025

   Architecture:
   1. Orchestrator analyses query and picks top 2 specialist agents
   2. Both specialists respond in parallel (no waiting)
   3. A synthesis agent combines their insights into actionable conclusions */

import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { AGENTS } from "@/lib/agents-data";
import type { AgentId } from "@/lib/agents-data";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/* ── Pick top 2 agents ──────────────────────────────── */
async function routeToTopTwo(
  query: string,
  history: Array<{ role: string; content: string }>,
): Promise<Array<{ agentId: AgentId; confidence: number; reason: string }>> {

  const agentList = Object.values(AGENTS)
    .map(a => `- ${a.id}: ${a.title} (${a.keywords.slice(0, 5).join(", ")})`)
    .join("\n");

  const recentHistory = history.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");

  const prompt = `Kamu adalah orchestrator multi-agent konstruksi Indonesia.
Pilih DUA agent terbaik untuk menjawab pertanyaan berikut secara kolaboratif.

Agen yang tersedia:
${agentList}

Riwayat:
${recentHistory || "(kosong)"}

Pertanyaan: "${query}"

Balas HANYA JSON:
{"agents": [
  {"agentId": "id1", "confidence": 0.0-1.0, "reason": "alasan 1 kalimat"},
  {"agentId": "id2", "confidence": 0.0-1.0, "reason": "alasan 1 kalimat"}
]}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 200,
    response_format: { type: "json_object" },
  });

  const raw = JSON.parse(resp.choices[0]?.message?.content || "{}");
  const agents: Array<{ agentId: AgentId; confidence: number; reason: string }> = [];

  for (const a of (raw.agents || [])) {
    if (a.agentId && a.agentId in AGENTS) {
      agents.push({ agentId: a.agentId as AgentId, confidence: a.confidence ?? 0.8, reason: a.reason ?? "" });
    }
  }

  // Fallback if orchestrator fails
  if (agents.length < 2) {
    if (!agents.find(a => a.agentId === "struktur")) agents.push({ agentId: "struktur", confidence: 0.7, reason: "Fallback" });
    if (!agents.find(a => a.agentId === "k3"))       agents.push({ agentId: "k3",       confidence: 0.65, reason: "Fallback" });
  }

  return agents.slice(0, 2);
}

/* ── Call one specialist agent ──────────────────────── */
async function callSpecialist(
  agentId: AgentId,
  message: string,
  history: Array<{ role: string; content: string }>,
  memoryContext: string,
): Promise<string> {
  const agent = AGENTS[agentId];
  const citationNote = `\nPENTING: Sebutkan kode standar secara eksplisit dan lengkap (contoh: SNI 2847:2019, PP 50/2012, ISO 45001:2018, FIDIC 1999, PUIL 2011, SNI 8460:2017, PMBOK 7th). Kamu sedang berkolaborasi dengan ahli lain — fokus pada keahlian spesifikmu, jawab terstruktur dan ringkas (maksimal 400 kata).`;

  const systemContent = memoryContext
    ? `${agent.systemPrompt}${citationNote}\n\n${memoryContext}`
    : `${agent.systemPrompt}${citationNote}`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemContent },
  ];
  for (const h of history.slice(-6)) {
    if (h.role === "user" || h.role === "assistant") {
      messages.push({ role: h.role as "user" | "assistant", content: h.content });
    }
  }
  messages.push({ role: "user", content: message });

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_completion_tokens: 800,
  });
  return resp.choices[0]?.message?.content || "—";
}

/* ── Synthesis ──────────────────────────────────────── */
async function synthesize(
  query: string,
  contributions: Array<{ agent: string; title: string; response: string }>,
): Promise<string> {
  const parts = contributions.map(c => `**${c.agent} (${c.title}):**\n${c.response}`).join("\n\n---\n\n");

  const prompt = `Kamu adalah AI Synthesizer untuk sistem multi-agent konstruksi Indonesia.

Dua ahli telah memberikan jawaban untuk pertanyaan: "${query}"

${parts}

Buat SINTESIS ringkas (maksimal 200 kata) yang:
1. Mengidentifikasi poin kunci dari masing-masing ahli
2. Menghubungkan insight antar disiplin ilmu
3. Memberikan 2-3 rekomendasi tindakan konkret

Gunakan format dengan sub-heading yang jelas. Bahasa Indonesia profesional.`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 600,
  });
  return resp.choices[0]?.message?.content || "—";
}

/* ── Handler ────────────────────────────────────────── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history = [], sessionId, memoryContext = "" } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "message is required" });

    // 1. Orchestrator picks top 2 agents
    const selectedAgents = await routeToTopTwo(message, history);

    // 2. Both specialists respond in parallel (Event-Driven: async parallel processing)
    const [resp1, resp2] = await Promise.all([
      callSpecialist(selectedAgents[0].agentId, message, history, memoryContext),
      callSpecialist(selectedAgents[1].agentId, message, history, memoryContext),
    ]);

    const contributions = [
      {
        agent: { ...AGENTS[selectedAgents[0].agentId], routing: selectedAgents[0] },
        response: resp1,
      },
      {
        agent: { ...AGENTS[selectedAgents[1].agentId], routing: selectedAgents[1] },
        response: resp2,
      },
    ];

    // 3. Synthesize (Blackboard: agents contribute, synthesizer distils)
    const synthesis = await synthesize(
      message,
      contributions.map(c => ({
        agent: c.agent.name,
        title: c.agent.title,
        response: c.response,
      })),
    );

    // 4. Generate follow-ups
    const followupResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Pertanyaan: "${message}". Dua ahli menjawab. Buat 3 pertanyaan follow-up singkat (max 10 kata). JSON: {"followups":["...","...","..."]}`,
      }],
      max_completion_tokens: 200,
      response_format: { type: "json_object" },
    });
    const followupRaw = JSON.parse(followupResp.choices[0]?.message?.content || "{}");

    return res.status(200).json({
      success: true,
      mode: "collab",
      contributions,
      synthesis,
      followups: followupRaw.followups || [],
      sessionId,
    });

  } catch (err) {
    console.error("Multi-agent collab error:", err);
    return res.status(500).json({
      error: "Gagal memproses kolaborasi multi-agent",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
