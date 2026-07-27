# Migrations

WeKan's own schema migrations: the ones that move existing boards, lists, cards
and users to the shape a newer WeKan expects. This is not about migrating between
databases — for that see [../MongoDB](../MongoDB) and [../FerretDB](../FerretDB).

**Everything in this directory is a historical record.** It documents the old
cron-driven migration system and the per-swimlane-lists migration, both of which
have since been REMOVED; each file says so at its top. They are kept because they
explain why the current system looks the way it does.

| File | What is in it |
| --- | --- |
| [MIGRATION_SYSTEM_IMPROVEMENTS.md](MIGRATION_SYSTEM_IMPROVEMENTS.md) | What the old system did badly and what was changed |
| [CODE_CHANGES_SUMMARY.md](CODE_CHANGES_SUMMARY.md) | The code those improvements touched |
| [MIGRATION_SYSTEM_REVIEW_COMPLETE.md](MIGRATION_SYSTEM_REVIEW_COMPLETE.md) | The review that went with them |
| [SESSION_SUMMARY.md](SESSION_SUMMARY.md) | The summary of that review session |
| [verify-migrations.sh](verify-migrations.sh) | The script that verified the old system |

The migration system WeKan runs today is described in
[../../Features/Admin-Panel/Problems/Migrations.md](../../Features/Admin-Panel/Problems/Migrations.md).
