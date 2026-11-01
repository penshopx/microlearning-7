---
name: Cleanup monitoring trust
description: Why cleanup reports are advisory and warnings derive from actual outstanding objects.
---

Treat browser-reported evidence deletion failures as advisory observations,
not authoritative Storage outage telemetry. Keep alerts aggregate-only and
derive recovery from absence of the actual Storage object, never a client's
success report.

**Why:** Cleanup runs in participant sessions, which can disappear or supply
untrusted reports. A missing response does not prove deletion failed, and
retained safety tombstones are not outstanding files.

**How to apply:** Use database time and per-object retry deduplication. Count
expired staging even before a participant revisits; do not reset its age when
it becomes garbage. Any future independent cleanup worker should use trusted
provider outcomes rather than treating browser reports as proof of an outage.
