import { AI_API_KEY_ERROR_CODE, notifyAIUnavailable } from "@/lib/ai-client";

/**
 * Read a Server-Sent Events stream from a fetch Response body.
 *
 * Calls:
 *  - onChunk(text)          — for each plain `data:` line (JSON-encoded string)
 *  - onEvent(name, payload) — for named events (e.g. "meta", "done", "error")
 *  - onDone()               — when `data: [DONE]` is received
 */
export interface SSEHandlers {
  onChunk: (chunk: string) => void;
  onEvent?: (event: string, payload: unknown) => void;
  onDone?: () => void;
}

export async function readSSE(
  body: ReadableStream<Uint8Array>,
  handlers: SSEHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let pendingEvent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          pendingEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const raw = line.slice(6);
          if (raw === "[DONE]") {
            handlers.onDone?.();
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            if (pendingEvent) {
              if (
                pendingEvent === "error" &&
                parsed &&
                typeof parsed === "object" &&
                "code" in parsed &&
                parsed.code === AI_API_KEY_ERROR_CODE
              ) {
                notifyAIUnavailable(parsed);
              }
              handlers.onEvent?.(pendingEvent, parsed);
              pendingEvent = "";
            } else if (typeof parsed === "string") {
              handlers.onChunk(parsed);
            }
          } catch {
            // skip malformed lines
          }
        } else if (line === "") {
          pendingEvent = "";
        }
      }
    }
  } finally {
    try { reader.cancel(); } catch { /* ignore */ }
  }
}
