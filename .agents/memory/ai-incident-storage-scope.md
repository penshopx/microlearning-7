---
name: AI incident storage scope
description: Explains the operational limit of the initial provider-authentication alert implementation.
---

The initial provider-authentication alert uses process-local operational metadata, not durable business storage. Do not assume alert continuity across server restarts or aggregation across replicas.

**Why:** The initial scope was an in-app repeated-failure warning without introducing a new datastore or changing the existing Supabase schema. That keeps credential material out of storage, but does not provide durable incident tracking.

**How to apply:** Before depending on these alerts in a multi-replica or restart-sensitive environment, move the counters and recovery state into shared storage with atomic updates and admin-only reads. Preserve the metadata-only privacy boundary; never store SDK errors, provider bodies, keys or request headers.
