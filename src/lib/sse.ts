import type { NextApiResponse } from "next";

/** Set response headers for a Server-Sent Events stream. */
export function initSSE(res: NextApiResponse) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // prevent nginx / Vercel proxy buffering
}

/** Send a plain text chunk (the common streaming case). */
export function sseChunk(res: NextApiResponse, text: string) {
  res.write(`data: ${JSON.stringify(text)}\n\n`);
}

/** Send a named event with a JSON payload. */
export function sseEvent(res: NextApiResponse, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Signal stream end. */
export function sseDone(res: NextApiResponse) {
  res.write("data: [DONE]\n\n");
  res.end();
}

/** Send an error event and close the stream. */
export function sseError(res: NextApiResponse, message: string) {
  res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
  res.end();
}
