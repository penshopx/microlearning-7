// Only connects to the disposable Unix socket explicitly supplied by the runner.
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";

const [host, port, user] = process.argv.slice(2);
assert(host?.startsWith("/") && port && user, "Disposable cluster socket, port and user required");
const clients = Array.from({ length: 3 }, () => new pg.Client({
  host, port: Number(port), user, database: "postgres",
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
}));
const [control, a, b] = clients;
const owner = "00000000-0000-4000-8000-000000000002";
const other = "00000000-0000-4000-8000-000000000001";
const ownPath = `${owner}/cleanup-race-own`;
const foreignPath = `${other}/cleanup-race-foreign`;

async function begin(client, identity = owner) {
  await client.query("BEGIN");
  await client.query("SET LOCAL ROLE authenticated");
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [identity]);
}

function report(client) {
  // Include someone else's object in both participant retries.
  return client.query("SELECT public.record_mission_cleanup_failure($1::text[])", [
    [ownPath, foreignPath],
  ]);
}

async function check(count, deleted = false) {
  await control.query("SELECT public.test_cleanup_race_assert($1, $2)", [count, deleted]);
}

async function waitForBlock(blockedPid, blockerPid) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const { rows } = await control.query(
      "SELECT $1::int = ANY(pg_blocking_pids($2::int)) AS blocked",
      [blockerPid, blockedPid],
    );
    if (rows[0].blocked) return;
    await delay(20);
  }
  throw new Error("Second report never blocked on the first transaction; overlap not proven");
}

try {
  await Promise.all(clients.map(client => client.connect()));
  const aPid = (await a.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
  const bPid = (await b.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
  assert.notEqual(aPid, bPid);

  for (const priorFailures of [0, 2]) {
    await control.query("SELECT public.test_cleanup_race_setup($1)", [priorFailures]);
    await begin(a);
    await begin(b);
    await report(a); // Holds the updated row until COMMIT.
    // Attach a rejection handler immediately, including if the barrier fails.
    const pending = report(b).then(() => ({ ok: true }), error => ({ error }));
    await waitForBlock(bPid, aPid);
    await a.query("COMMIT");
    const result = await pending;
    if (result.error) throw result.error;
    await b.query("COMMIT");
    await check(priorFailures + 1);
    console.log(`PASS: overlapping cleanup reports (${priorFailures} prior failures), lock wait proven`);
  }

  await control.query("SELECT public.test_cleanup_race_setup(0)");
  await begin(a);
  await report(a);
  await begin(b, other);
  // An unauthorized report overlaps the owner's still-open transaction.
  await b.query("SELECT public.record_mission_cleanup_failure($1::text[])", [[ownPath]]);
  await b.query("COMMIT");
  await a.query("COMMIT");
  await check(1);
  console.log("PASS: another account cannot report the locked owner's object");

  for (const order of ["report-first", "delete-first"]) {
    await control.query("SELECT public.test_cleanup_race_setup(2)");
    await begin(a);
    await begin(b);
    const remove = client => client.query(
      "DELETE FROM storage.objects WHERE bucket_id = 'mission-evidence' AND name = $1 RETURNING name",
      [ownPath],
    ).then(result => assert.equal(result.rowCount, 1, "participant actually deletes the object"));
    if (order === "report-first") {
      await report(a);
      await remove(b);
    } else {
      // The report sees the object before the other session commits deletion.
      await remove(a);
      await report(b);
    }
    await b.query("COMMIT");
    await a.query("COMMIT");
    await check(3, true); // Warning-eligible tombstone remains, but health is clear.
    console.log(`PASS: overlapping cleanup ${order} leaves no stale health warning`);
  }
} finally {
  // Close even on assertion/barrier failure; the shell also destroys the cluster.
  await Promise.allSettled(clients.map(client => client.end()));
}
