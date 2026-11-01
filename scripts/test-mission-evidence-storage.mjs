import { createClient } from "@supabase/supabase-js";
import { execFile as execFileCallback, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const supabaseCli = path.join(root, "node_modules", ".bin", "supabase");
const migrationDir = path.join(root, "supabase", "migrations");
const bucket = "mission-evidence";
const excludedServices =
  "studio,mailpit,realtime,imgproxy,postgres-meta,edge-runtime,logflare,vector,supavisor";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function client(url, key) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function parseEnvOutput(output) {
  const values = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const raw = match[2].trim();
    values[match[1]] = raw.replace(/^["']|["']$/g, "");
  }
  return values;
}

function runCli(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(supabaseCli, [...args, "--workdir", cwd], {
      cwd,
      env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (output += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve(output);
      const summary = output
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-20)
        .join("\n")
        .replace(/(service[_ -]?role[_ -]?key\s*[:=]\s*)\S+/gi, "$1[redacted]")
        .replace(/(anon[_ -]?key\s*[:=]\s*)\S+/gi, "$1[redacted]")
        .replace(/\beyJ[a-zA-Z0-9._-]{20,}\b/g, "[redacted]");
      reject(new Error(`Supabase CLI ${args[0]} failed:\n${summary}`));
    });
  });
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function findPortBlock() {
  const start = 20000 + Math.floor(Math.random() * 30000);
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const base = 20000 + ((start - 20000 + attempt * 11) % 30000);
    const ports = Array.from({ length: 8 }, (_, index) => base + index);
    const available = await Promise.all(ports.map(isPortAvailable));
    if (available.every(Boolean)) return base;
  }
  throw new Error("Could not find a free port range for the isolated Supabase test");
}

function replaceSectionValue(config, section, key, value) {
  const sectionStart = config.indexOf(`[${section}]`);
  assert(sectionStart >= 0, `Supabase config is missing [${section}]`);
  const nextSection = config.indexOf("\n[", sectionStart + 1);
  const end = nextSection < 0 ? config.length : nextSection;
  const before = config.slice(0, sectionStart);
  const body = config.slice(sectionStart, end);
  const after = config.slice(end);
  const matcher = new RegExp(`^(\\s*${key}\\s*=\\s*).*$`, "m");
  assert(matcher.test(body), `Supabase config is missing ${section}.${key}`);
  return before + body.replace(matcher, `$1${value}`) + after;
}

async function prepareIsolatedProject(tempRoot) {
  const workdir = path.join(tempRoot, "project");
  const supabaseDir = path.join(workdir, "supabase");
  await mkdir(supabaseDir, { recursive: true });
  await cp(migrationDir, path.join(supabaseDir, "migrations"), { recursive: true });

  const projectId = `mission-evidence-${randomBytes(5).toString("hex")}`;
  const basePort = await findPortBlock();
  let config = await readFile(path.join(root, "supabase", "config.toml"), "utf8");
  config = config.replace(/^project_id\s*=.*$/m, `project_id = "${projectId}"`);
  config = replaceSectionValue(config, "api", "port", basePort);
  config = replaceSectionValue(config, "db", "port", basePort + 1);
  config = replaceSectionValue(config, "db", "shadow_port", basePort + 2);
  config = replaceSectionValue(config, "db.seed", "enabled", "false");
  config = replaceSectionValue(config, "db.seed", "sql_paths", "[]");
  config = replaceSectionValue(config, "realtime", "enabled", "false");
  config = replaceSectionValue(config, "studio", "enabled", "false");
  config = replaceSectionValue(config, "studio", "port", basePort + 3);
  config = replaceSectionValue(config, "local_smtp", "enabled", "false");
  config = replaceSectionValue(config, "local_smtp", "port", basePort + 4);
  config = replaceSectionValue(config, "storage.s3_protocol", "enabled", "false");
  config = replaceSectionValue(config, "storage.vector", "enabled", "false");
  config = replaceSectionValue(config, "edge_runtime", "enabled", "false");
  config = replaceSectionValue(config, "analytics", "enabled", "false");
  config = replaceSectionValue(config, "analytics", "port", basePort + 6);
  await writeFile(path.join(supabaseDir, "config.toml"), config);
  return { workdir, projectId };
}

function requireNoError(result, action) {
  if (result.error) {
    throw new Error(`${action} failed: ${result.error.message}`);
  }
  return result.data;
}

async function main() {
  await access(supabaseCli).catch(() => {
    throw new Error("Supabase CLI is missing; install project dependencies first");
  });

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "mission-evidence-storage-"));
  const { workdir, projectId } = await prepareIsolatedProject(tempRoot);
  let startAttempted = false;
  let admin;
  let service;
  let serviceRoleKey;
  let apiUrl;
  let participantId;
  let otherId;
  let courseId;
  let moduleId;
  const uploadPaths = [];
  const runId = randomUUID();
  const participantEmail = `mission-evidence-${runId}-participant@example.test`;
  const otherEmail = `mission-evidence-${runId}-other@example.test`;
  const cleanupErrors = [];
  let testError;

  try {
    startAttempted = true;
    await runCli(["start", "--ignore-health-check", "--exclude", excludedServices], workdir);
    await runCli(["db", "reset", "--local", "--no-seed"], workdir);

    const env = parseEnvOutput(await runCli(["status", "--output", "env"], workdir));
    apiUrl = env.API_URL;
    const anonKey = env.ANON_KEY;
    serviceRoleKey = env.SERVICE_ROLE_KEY;
    assert(apiUrl && anonKey && serviceRoleKey, "Local Supabase did not return required test settings");
    const parsedUrl = new URL(apiUrl);
    assert(
      parsedUrl.protocol === "http:" &&
        (parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname === "localhost"),
      "Refusing to write outside the isolated local Supabase test server",
    );

    admin = client(apiUrl, serviceRoleKey);
    service = client(apiUrl, serviceRoleKey);
    const password = `T-${randomBytes(24).toString("hex")}a9!`;
    const participantResult = await admin.auth.admin.createUser({
      email: participantEmail,
      password,
      email_confirm: true,
    });
    participantId = requireNoError(participantResult, "Create participant test account").id;

    const otherResult = await admin.auth.admin.createUser({
      email: otherEmail,
      password,
      email_confirm: true,
    });
    otherId = requireNoError(otherResult, "Create second test account").id;

    const participant = client(apiUrl, anonKey);
    const other = client(apiUrl, anonKey);
    const participantSession = await participant.auth.signInWithPassword({
      email: participantEmail,
      password,
    });
    requireNoError(participantSession, "Sign in as the evidence owner");
    const otherSession = await other.auth.signInWithPassword({
      email: otherEmail,
      password,
    });
    requireNoError(otherSession, "Sign in as the second test account");

    courseId = randomUUID();
    moduleId = randomUUID();
    await requireNoError(
      await service.from("courses").insert({
        id: courseId,
        user_id: participantId,
        title: "Temporary mission evidence API test",
        is_published: false,
      }),
      "Create temporary course",
    );
    await requireNoError(
      await service.from("course_modules").insert({
        id: moduleId,
        course_id: courseId,
        module_number: 1,
        title: "Temporary evidence mission",
        video_start_time: 0,
        video_end_time: 10,
        duration_seconds: 10,
      }),
      "Create temporary module",
    );
    await requireNoError(
      await service.from("module_content").insert({
        module_id: moduleId,
        content_type: "worksheet",
        title: "Temporary mission blueprint",
        content_data: {
          kind: "workplace-mission",
          evidence: [{ id: "photo", required: true }],
        },
      }),
      "Create temporary mission blueprint",
    );

    const wrongFolderPath =
      `${otherId}/${courseId}/${moduleId}/photo/${runId}-forbidden.png`;
    uploadPaths.push(wrongFolderPath);
    const forbiddenUpload = await participant.storage.from(bucket).upload(
      wrongFolderPath,
      new Uint8Array([137, 80, 78, 71]),
      { contentType: "image/png", upsert: false },
    );
    assert(forbiddenUpload.error, "Upload into another user's folder was accepted");
    console.log("PASS: Storage API rejects uploads into another user's folder");

    const metadataOnlyPath =
      `${participantId}/${courseId}/${moduleId}/photo/${runId}-missing.png`;
    const metadataOnly = {
      evidenceUploads: [{
        evidenceId: "photo",
        storagePath: metadataOnlyPath,
        fileName: "missing.png",
        mimeType: "image/png",
        sizeBytes: 4,
        uploadedAt: new Date().toISOString(),
      }],
    };
    const forgedCompletion = await participant.rpc("save_mission_progress", {
      p_course_id: courseId,
      p_module_id: moduleId,
      p_status: "completed",
      p_progress_percentage: 100,
      p_mission_progress: metadataOnly,
      p_expected_revision: 0,
    });
    assert(forgedCompletion.error, "Metadata without a physical upload completed the mission");
    const noForgedRow = await service
      .from("learner_progress")
      .select("id")
      .eq("user_id", participantId)
      .eq("course_id", courseId)
      .eq("module_id", moduleId)
      .maybeSingle();
    requireNoError(noForgedRow, "Check that metadata-only completion left no progress row");
    assert(!noForgedRow.data, "Metadata-only completion left a progress row behind");
    console.log("PASS: Metadata without a Storage upload cannot complete the mission");

    const fileBytes = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10,
      0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1,
      8, 6, 0, 0, 0, 31, 21, 196, 137,
      0, 0, 0, 0, 73, 69, 78, 68,
      174, 66, 96, 130,
    ]);
    const storagePath =
      `${participantId}/${courseId}/${moduleId}/photo/${runId}-proof.png`;
    uploadPaths.push(storagePath);
    const upload = await participant.storage.from(bucket).upload(storagePath, fileBytes, {
      contentType: "image/png",
      upsert: false,
    });
    requireNoError(upload, "Upload evidence through the Storage HTTP API");
    assert(upload.data.path === storagePath, "Storage returned a different object path");

    const downloaded = await participant.storage.from(bucket).download(storagePath);
    const downloadedFile = requireNoError(downloaded, "Download uploaded evidence through Storage");
    const downloadedBytes = new Uint8Array(await downloadedFile.arrayBuffer());
    assert(
      Buffer.compare(Buffer.from(downloadedBytes), Buffer.from(fileBytes)) === 0,
      "Downloaded bytes did not match the uploaded file",
    );
    console.log("PASS: Owner uploaded and downloaded the physical evidence file");

    const missionProgress = {
      evidenceConfirmed: true,
      evidenceUploads: [{
        evidenceId: "photo",
        storagePath,
        fileName: "proof.png",
        mimeType: "image/png",
        sizeBytes: fileBytes.byteLength,
        uploadedAt: new Date().toISOString(),
      }],
    };
    const completion = await participant.rpc("save_mission_progress", {
      p_course_id: courseId,
      p_module_id: moduleId,
      p_status: "completed",
      p_progress_percentage: 100,
      p_mission_progress: missionProgress,
      p_expected_revision: 0,
    });
    const completed = requireNoError(completion, "Complete mission through application RPC");
    assert(completed.status === "completed", "Application RPC did not mark the mission completed");
    assert(
      completed.mission_progress?.evidenceUploads?.[0]?.storagePath === storagePath,
      "Application RPC did not persist the uploaded evidence path",
    );
    console.log("PASS: Application mission RPC accepts the uploaded evidence");
  } catch (error) {
    testError = error;
    if (String(error.message).includes("HealthCheckTimeoutError")) {
      try {
        const { stdout } = await execFile("docker", [
          "inspect",
          "--format",
          "{{json .State.Health}}",
          `supabase_db_${projectId}`,
        ]);
        testError = new Error(`${error.message}\nPostgreSQL health details: ${stdout.trim()}`);
      } catch {
        // Keep the original CLI failure when Docker health details are unavailable.
      }
    }
  } finally {
    if (service) {
      const cleanup = async (label, action) => {
        try {
          const result = await action();
          if (result?.error) cleanupErrors.push(`${label}: ${result.error.message}`);
        } catch (error) {
          cleanupErrors.push(`${label}: ${error.message}`);
        }
      };

      if (uploadPaths.length) {
        await cleanup("Remove Storage files", async () => {
          const result = await service.storage.from(bucket).remove(uploadPaths);
          return result;
        });
      }
      if (participantId || otherId) {
        const testUserIds = [participantId, otherId].filter(Boolean);
        await cleanup("Remove evidence lifecycle rows", () =>
          service.from("mission_evidence_objects").delete().in("user_id", testUserIds),
        );
        await cleanup("Remove learner progress rows", () =>
          service.from("learner_progress").delete().in("user_id", testUserIds),
        );
        await cleanup("Remove learner achievements", () =>
          service.from("learner_achievements").delete().in("user_id", testUserIds),
        );
      }
      if (moduleId) {
        await cleanup("Remove temporary mission content", () =>
          service.from("module_content").delete().eq("module_id", moduleId),
        );
        await cleanup("Remove temporary module", () =>
          service.from("course_modules").delete().eq("id", moduleId),
        );
      }
      if (courseId) {
        await cleanup("Remove temporary course", () =>
          service.from("courses").delete().eq("id", courseId),
        );
      }
    }

    if (admin) {
      const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }).catch((error) => {
        cleanupErrors.push(`Find temporary Auth users: ${error.message}`);
        return null;
      });
      const emails = new Set([participantEmail, otherEmail]);
      const userIds = new Set([participantId, otherId].filter(Boolean));
      for (const user of users?.data?.users || []) {
        if (emails.has(user.email) || userIds.has(user.id)) userIds.add(user.id);
      }
      for (const userId of userIds) {
        try {
          const { error } = await admin.auth.admin.deleteUser(userId);
          if (error) cleanupErrors.push(`Delete temporary Auth user: ${error.message}`);
        } catch (error) {
          cleanupErrors.push(`Delete temporary Auth user: ${error.message}`);
        }
      }
    }

    if (startAttempted) {
      try {
        await runCli(["stop", "--project-id", projectId, "--no-backup"], workdir);
      } catch (error) {
        cleanupErrors.push(`Stop isolated Supabase services: ${error.message}`);
      }
    }
    await rm(tempRoot, { recursive: true, force: true }).catch((error) => {
      cleanupErrors.push(`Remove temporary test project: ${error.message}`);
    });
  }

  if (testError) {
    console.error(`FAIL: ${testError.message}`);
  }
  if (cleanupErrors.length) {
    console.error(`Cleanup failed:\n${cleanupErrors.map((item) => `- ${item}`).join("\n")}`);
  }
  if (testError || cleanupErrors.length) process.exitCode = 1;
  else console.log("PASS: isolated Supabase Storage API integration checks");
}

await main();
