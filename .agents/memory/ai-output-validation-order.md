---
name: AI output validation order
description: Why canonical AI contracts must validate raw model output before applying compatibility defaults.
---

Validate every required field in raw AI output before passing it through a tolerant normalizer.

**Why:** Compatibility normalizers intentionally synthesize defaults for older persisted data. If generation validation runs afterward, those defaults can make incomplete model output look valid and silently hide prompt or source-specific contract drift.

**How to apply:** Keep strict generation-boundary validation separate from version-tolerant read normalization. Reject incomplete raw output first; use normalization only after the required shape, identifiers, limits, and cross-field relationships have passed.