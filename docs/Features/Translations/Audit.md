# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 14,498 |
| Restored pre-pull; awaiting validation | 4,058 |
| Reviewed; retained unchanged | 179 |
| Pending review or repair | 1,346 |
| Total tracked | 20,081 |

**Resumed at the maintainer’s request on 2026-09-13.** Reviewing and repairing the remaining local findings, beginning with Klingon. All **361** originally flagged Klingon findings are repaired. The broader check of **829** German-identical values is reviewed: **829** repaired, including the mistaken German `cron` retention corrected to the actual tool name **Cron**. Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **16,057** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-13**, local commit `d26e32c14` — repaired Veps Buddhist/Hijri/Umm al-Qura labels using native religious genitives and calendar vocabulary, preserving identifiers and variant distinctions. Vocabulary evidence includes indexed article copies; direct article fetches failed. Composed names need fluent review. All **16,057** correction records and vocabulary/token/distinct-calendar checks pass. Veps has 605 original findings remaining. Broader wrong-language/script values, restored translations and browser verification remain outstanding.

**Language workflow (2026-09-13):** all 245 popup locales are wired and country-then-language flags are checked (`8549b6c4c`). Browser preference ordering, legacy/script aliases, delayed saved profiles and no automatic profile writes pass runtime checks (`1666a2012`, `37ae64fa8`); actual browser execution remains pending. Uzbek Arabic (`uz-AR`) still contains Latin core labels and needs repair.

**Upload workflow (2026-09-13):** Colombian/French/Khmer/Guarani/Portuguese/Russian mappings are repaired, with 241 distinct targets and reported local aliases. All nine Colombian differences were reviewed (`6db460891`), retaining seven valid alternatives. Timestamped terminal/error logs and failure exit codes pass offline checks (`196c0addc`). Chinese script mapping now uses supported `zh-Hans` (`c2a9168c4`). Manx, Ladin, Aromanian, Tigre and Wolaytta remain unsupported catalogue failures; no substitution by different languages or remote uploads was performed.

**Maintainer-reported uploads (2026-09-13):** the older script completed with 233 successful uploads and 13 failures. Eight failing code mappings are repaired locally. A partial rerun confirms that Guarani (`gn.i18n.json` → `gug_PY`) was added and uploaded successfully; Manx (`gv`) and Ladin (`lld`) still receive missing-language 404 responses. The rerun's final totals are not yet available. Manx/Ladin/Aromanian/Tigre/Wolaytta remain catalogue gaps. These are maintainer-provided results, not independently verified remote results. The new outcome/support summary (`637dbebd6`) passes offline regressions; no uploads were run here.

**Verification (2026-09-13):** **1,002 Node suites, zero failures**; the original 19 failures are resolved. The first complete EVERYTHING run passes all four stages: Meteor (**527**), import (**10**), Node E2E (**10**), three browsers, **103** conformance cases on each of SQLite/PostgreSQL/MySQL/MariaDB and FerretDB unit/vet/integration. Separate URL-prefix preference/logout/invalid-cookie checks pass in all browsers. Two WebKit retries exposed refresh readiness and competing template autofocus; both are repaired, and the refresh check passes ten repetitions without retries. #6691 partial-profile/impersonation regression passes in all three browsers without retries. The second EVERYTHING run finished with failures in the now-fixed Fossil menu registration check and Chromium board-export popup readiness; database conformance, FerretDB and the other two browsers passed. Board-export verification remains outstanding. Fluent-speaker checks remain outstanding; translation repairs have resumed.

**Unresolved reviews:** Apostrophe support for Klingon search operators is implemented in local commit `0026390bb`; actual Query runtime and card-number regressions pass. All 37 remaining search keywords are replaced and actual-locale parser regressions pass; localized browser verification remains pending. Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
