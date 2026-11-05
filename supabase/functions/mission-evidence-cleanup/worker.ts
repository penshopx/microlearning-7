// Shared with unit tests; no runtime/environment access or private-path logging.
export interface CleanupClient {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: any; error: unknown }>;
  storage: {
    from(bucket: string): {
      remove(paths: string[]): PromiseLike<{ error: unknown }>;
    };
  };
}

export async function runCleanup(client: CleanupClient, leaseId: string) {
  const claim = await client.rpc("claim_mission_cleanup_batch", { p_lease_id: leaseId });
  if (claim.error || !Array.isArray(claim.data)) throw new Error("Cleanup unavailable");
  const paths = claim.data.map((row: { storage_path: string }) => row.storage_path);
  if (paths.length > 100 || paths.some((path) => typeof path !== "string" || !path)) {
    throw new Error("Cleanup unavailable");
  }
  // Empty may mean a concurrent invocation holds the lease. Do not release it.
  if (!paths.length) return { attempted: 0, deleted: 0, remaining: 0 };
  try {
    await client.storage.from("mission-evidence").remove(paths);
  } catch {
    // A lost response can still mean successful deletion. Reconcile in SQL.
  }
  const finish = await client.rpc("finish_mission_cleanup_batch", {
    p_lease_id: leaseId, p_paths: paths,
  });
  const result = finish.data;
  if (finish.error || !result || !["attempted", "deleted", "remaining"].every(
    (key) => Number.isInteger(result[key]) && result[key] >= 0 && result[key] <= paths.length,
  ) || result.attempted !== paths.length || result.deleted + result.remaining !== result.attempted) {
    throw new Error("Cleanup unavailable");
  }
  // Explicit allowlist. Never serialize SDK errors, queue rows, or paths.
  return { attempted: result.attempted, deleted: result.deleted, remaining: result.remaining };
}

export async function handleCleanupRequest(
  request: Request,
  serviceKey: string | undefined,
  run: () => Promise<{ attempted: number; deleted: number; remaining: number }>,
) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...headers, Allow: "POST" } });
  }
  if (!serviceKey) return new Response('{"error":"Cleanup unavailable"}', { status: 503, headers });
  if (request.headers.get("Authorization") !== `Bearer ${serviceKey}`) {
    return new Response('{"error":"Unauthorized"}', { status: 401, headers });
  }
  try {
    const result = await run();
    return new Response(JSON.stringify(result), { status: result.remaining ? 503 : 200, headers });
  } catch {
    return new Response('{"error":"Cleanup unavailable"}', { status: 503, headers });
  }
}
