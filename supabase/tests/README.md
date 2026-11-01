# Database integration checks

## Mission evidence completion

Run `npm run test:integration:evidence` with PostgreSQL binaries (`initdb`,
`pg_ctl`, `psql`) on PATH as a non-root user. No credentials, remote database,
Docker, or Supabase CLI are required. Missing binaries or failed assertions exit
nonzero; the suite does not silently skip.

The runner reuses the minimal surrounding Supabase schema in
`mission_reviews_fixture.sql`, applies the actual progress, evidence, and scoped
assignment/review migrations, then runs `mission_evidence.sql` as `authenticated`
with JWT subject settings. It checks fabricated uploads, another user's existing
object, wrong course/module/evidence namespaces, a prefix collision, wrong bucket,
wrong evidence ID, missing/malformed uploads, valid completion, completed-row
tampering, legacy completion, and owner Storage SELECT/INSERT/DELETE rules.
Rejection checks exercise both direct writes and the same atomic RPC the app uses,
for new progress and saved drafts, and require the exact evidence-trigger error.

All fixtures run inside a rolled-back transaction, with explicit empty-table
checks afterward. An exit trap also stops and deletes the disposable cluster on
success or failure. The bucket created by the migration exists only in that
cluster. No shared remote data is modified.

The same runner also applies the current supervisor review migration and runs
`mission_review_rls.sql` as a learner and two distinct course owners. This
checks course-scoped reads from `learner_progress`, `mission_reviews`, and
`mission_review_comments`, plus Storage object SELECT authorization for signed
URL creation. The disposable cluster does not run Supabase's HTTP Storage
service, so it verifies the database authorization required before URL signing
rather than generating an HTTP signed URL.

This is database integration coverage: Storage objects are actual
`storage.objects` rows subject to RLS, not mocked query results, but no physical
files or HTTP Storage API are involved. It does not validate the Storage server,
MIME/size enforcement, signed URLs, or remote-schema drift. It is separate from
`npm test` so unit tests remain usable without PostgreSQL.
It is also registered as the `mission-evidence-integration` validation workflow.

## Mission evidence Storage API

Run `npm run test:integration:evidence:storage` with Docker available. The runner
creates a temporary Supabase CLI project under the operating system's temp
directory, copies in the repository migrations, and starts isolated local
Postgres, Auth, PostgREST, and Storage services on available ports. It never
reads the app's Supabase URL or credentials, links to a hosted project, or uses
the configured database. It resets only its disposable database and stops the
temporary project with its volumes removed, even after a failed assertion.

The test creates two temporary Auth users, adds a private mission fixture,
rejects a participant's upload into the other user's folder, verifies fabricated
metadata cannot complete the practice, then uploads and downloads a small PNG
through the actual HTTP Storage API and completes through the same
`save_mission_progress` RPC used by `microLearningService.updateProgress`.
Storage objects and bytes, fixture rows, and both test users are removed in a
`finally` cleanup. This test runs separately from the SQL-only checks.

## Supervisor reviews

Run `bash scripts/test-mission-reviews.sh` with PostgreSQL binaries on PATH.
It starts a disposable local cluster, applies the evidence/progress/review
migrations, exercises actual RLS and RPCs as different users, and removes the
cluster on exit. It never connects to the configured Supabase database.

The application requires migration
`20261031000000_add_supervisor_mission_reviews.sql` after the two evidence/progress
migrations. Apply it through the project's normal Supabase migration process
to the intended environment before enabling the new UI. The fork does not
automatically migrate the shared remote project.

Course owners assign participant and supervisor account IDs on the course page.
Each signed-in user can find their account ID in that panel. The owner then
shares the course-page URL with the assigned supervisor. Content ownership alone
does not authorize opening participant proof. Assignment also grants course
content access when the course is private.

Only completed practices with uploaded evidence enter the review queue. Reviews
live outside participant-editable mission JSON. A requested retry can be reopened
by its participant; coaching stays visible during revision and the next completion
returns the submission to pending. Approved submissions cannot be reopened.
Supervisors receive 60-second signed URLs; revocation immediately blocks new URL
creation, but an already issued URL remains valid until its expiry.
