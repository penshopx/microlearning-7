---
name: Evidence cleanup safety
description: Why mission uploads need durable lifecycle state and fail-closed cleanup after conflicts or network loss.
---

Never delete a new upload merely because the browser did not receive a successful
progress-save response. Ask the server to reconcile attachment first. Once a
path is retired, do not allow it to be attached again, including between listing
cleanup candidates and performing the Storage API delete.

**Why:** A committed transaction can lose its response. Blind client rollback
would destroy valid participant evidence. Separately, a cleanup list becomes
unsafe if another device can reattach one of its paths before deletion.

**How to apply:** Keep retirement irreversible and enforce deletion eligibility
in Storage policy, not only UI code. Preserve queued cleanup after connection
failures. Staged uploads get a grace period so cleanup does not race a live
upload; retries currently run while an authenticated course page is open and
on the participant's next visit.
