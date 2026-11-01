---
name: Reflection draft safety
description: Safety constraints for refresh-resistant participant reflection recovery.
---

Durable recovery is for reflection text only, scoped to the authenticated account, course and module. Offer restoration or deletion explicitly; never automatically save a recovered draft or persist evidence/checklist snapshots or a revision for replay.

**Why:** The requested recovery must prevent text loss without overwriting newer evidence or bypassing conflict detection. A missing save response is not proof the save failed, and older successful saves must not delete newer edits.

**How to apply:** Recover text alongside freshly loaded server progress, save through the usual revision check, and clear drafts on confirmed matching saves or account changes. Browser storage is best-effort: report failures rather than promise refresh protection.

Treat save queues and recovery locks as belonging to an account/course/module context, not to the mounted page.

**Why:** Ignoring stale response data is insufficient: an unresolved old request can still block saves in the next context, its eventual cleanup can release a newer request's lock, and clipboard completion can display an unrelated copy notice.

**How to apply:** Detach the old queue on context changes and scope asynchronous cleanup and copy feedback as well as response application. Exercise overlapping old/new recovery operations with controlled promises, including successful and failed responses. Prove the next context can save before resolving the old request, the new operation remains locked until its own response arrives, and old queued writes never start.
