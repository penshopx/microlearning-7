# Isolated reflection recovery check

`mission-reflection-recovery.py` exercises the real course page and real
service adapters. Only Supabase HTTP responses and clipboard writes are
substituted. It does not require a real user or write to a database.

Run in a Playwright-enabled Python browser-testing runtime against the already
running development preview:

```sh
python scripts/browser/mission-reflection-recovery.py --base-url https://YOUR-PREVIEW-HOST
```

The runtime needs the Python `playwright` package and its Chromium browser.
These are testing-runtime prerequisites, not application dependencies. The
Replit browser tester can execute the script in its provided browser runtime
when the application shell does not have Playwright installed.

The fixture installs its network handlers before navigation, seeds a synthetic
Supabase session without real credentials, blocks service workers, and lets Next
serve its own assets. Every unrecognized Supabase request fails the check rather
than reaching the real service. Empty review responses are included because the
course page also loads the review panels.

Assertions cover comparison, copy, explicit restore/edit without autosave,
text-only saving against the refreshed revision, preservation of newer server
evidence/checklists/decisions, reload, and module isolation. Deferred
account/module save, refetch, queue and clipboard races are covered by
`src/tests/mission-evidence-conflict.test.tsx`.

Screenshots go to `generated-artifacts/reflection-recovery/` by default (ignored
by Git and deployment). Use `--output` to change that directory.
