import { createClient } from "npm:@supabase/supabase-js@2.98.0";
import { handleCleanupRequest, runCleanup } from "./worker.ts";

Deno.serve((request: Request) => {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return handleCleanupRequest(request, key, async () => {
    const client = createClient(Deno.env.get("SUPABASE_URL")!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20_000) }),
      },
    });
    return runCleanup(client, crypto.randomUUID());
  });
});
