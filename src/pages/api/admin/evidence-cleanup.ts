import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
      { global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });
    // The SECURITY DEFINER RPC checks profiles.role itself. No service-role
    // bypass and no reliance on browser metadata or client-side isAdmin.
    const { data, error } = await client.rpc("get_mission_cleanup_health");
    if (error?.code === "42501") return res.status(403).json({ error: "Forbidden" });
    if (error || !data) return res.status(503).json({ error: "Status pembersihan tidak tersedia" });
    // Explicit allowlist: never forward arbitrary database fields.
    return res.status(200).json({
      pendingCount: data.pendingCount,
      overdueCount: data.overdueCount,
      repeatedFailureCount: data.repeatedFailureCount,
      oldestPendingAt: data.oldestPendingAt,
      checkedAt: data.checkedAt,
    });
  } catch {
    return res.status(503).json({ error: "Status pembersihan tidak tersedia" });
  }
}
