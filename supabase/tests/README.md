# Supervisor review checks

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
