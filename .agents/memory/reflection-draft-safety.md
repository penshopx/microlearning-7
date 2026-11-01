---
name: Reflection draft safety
description: Safety constraints for refresh-resistant participant reflection recovery.
---

Durable recovery is for reflection text only, scoped to the authenticated account, course and module. Offer restoration or deletion explicitly; never automatically save a recovered draft or persist evidence/checklist snapshots or a revision for replay.

**Why:** The requested recovery must prevent text loss without overwriting newer evidence or bypassing conflict detection. A missing save response is not proof the save failed, and older successful saves must not delete newer edits.

**How to apply:** Recover text alongside freshly loaded server progress, save through the usual revision check, and clear drafts on confirmed matching saves or account changes. Browser storage is best-effort: report failures rather than promise refresh protection.
