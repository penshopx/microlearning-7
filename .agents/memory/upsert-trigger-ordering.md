---
name: Upsert trigger ordering
description: Why partial completion updates can fail even when the stored evidence is valid.
---

Do not assume an atomic upsert's conflict-update merge happens before its
BEFORE INSERT trigger. Validate partial-update behavior against PostgreSQL,
not only against the final merged JSON expected by the client.

**Why:** Integration testing exposed that a completed-status RPC call with
omitted mission metadata is rejected during the attempted INSERT, even when the
conflicting stored row already contains valid evidence. The stored-state merge
has not happened yet. This is distinct from intentional rejection of forged
completion and should not be fixed by weakening evidence validation.

**How to apply:** When changing completion RPCs or triggers, cover omitted
metadata, explicit empty metadata, and full metadata separately on existing
completed rows. Preserve the rejection of fabricated initial completion.
