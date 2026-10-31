---
name: AI incident storage scope
description: Explains the operational limit of the initial provider-authentication alert implementation.
---

Provider-authentication incidents use one shared Supabase row containing only a failure sequence, recent timestamps, incident ID, count, and start/last-failure timestamps. Server-side `service_role` RPCs serialize writes and version-guard recovery; the admin API checks the user's profile role before returning incident metadata.

**Why:** AI errors can occur in different API routes without a shared authenticated user's token. A trusted server-only database client is needed to persist them consistently, while browser clients must not be able to read or manipulate incident state.

**How to apply:** Keep persistence in server-only code and restrict its RPC grants to `service_role`. Keep the user-facing status endpoint admin-gated, and clear incidents only when the sequence captured before a successful provider probe still matches. Never store SDK errors, provider bodies, keys, or request headers.
