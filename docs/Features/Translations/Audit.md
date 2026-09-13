# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 13,227 |
| Restored pre-pull; awaiting validation | 4,058 |
| Reviewed; retained unchanged | 178 |
| Pending review or repair | 2,618 |
| Total tracked | 20,081 |

**Resumed at the maintainer’s request on 2026-09-13.** Reviewing and repairing the remaining local findings, beginning with Klingon. All **361** originally flagged Klingon findings are repaired. A broader check has **829** additional German-identical values to review; technical names and formats are not presumed wrong. Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **13,905** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-13**, local commit `4c763c8c9` — corrected the last **81** originally flagged Klingon findings; **361** repaired since resumption. Repairs cover security states, activities, permissions, destructive warnings, migration constraints, diagnostics and literal search/JSON examples. Low-confidence wording remains marked for fluent-speaker review. The preceding fix commit `8ae15efffb1101970ff2bc04f5f628c1c072c307` restored native Aragonese examples and localized the Galician storage label. Reviewed shared terms are protected during filling; broader repairs have resumed.

**Verification (2026-09-13):** **999 Node suites, zero failures**; the original 19 failures are resolved. The first complete EVERYTHING run passes all four stages: Meteor (**527**), import (**10**), Node E2E (**10**), three browsers, **103** conformance cases on each of SQLite/PostgreSQL/MySQL/MariaDB and FerretDB unit/vet/integration. Separate URL-prefix preference/logout/invalid-cookie checks pass in all browsers. Two WebKit retries exposed refresh readiness and competing template autofocus; both are repaired, and the refresh check passes ten repetitions without retries. Fresh compiled verification is running. Fluent-speaker checks remain outstanding; translation repairs have resumed.

**Unresolved reviews:** Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
