# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-13**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 14,474 |
| Restored pre-pull; awaiting validation | 4,058 |
| Reviewed; retained unchanged | 179 |
| Pending review or repair | 1,370 |
| Total tracked | 20,081 |

**Resumed at the maintainer’s request on 2026-09-13.** Reviewing and repairing the remaining local findings, beginning with Klingon. All **361** originally flagged Klingon findings are repaired. The broader check of **829** German-identical values is reviewed: **829** repaired, including the mistaken German `cron` retention corrected to the actual tool name **Cron**. Restored and unflagged translations still need validation.

Fixed: wrong-language text, terminology, warnings, placeholders and JSON/calendar/search formatting. [Correction records](../../../releases/translations/audited-corrections.json) contain **16,007** exact before/after values, including unflagged repairs.

Latest translation fix: **2026-09-13**, local commit `c6e76522d` — repaired the remaining flagged Acehnese GCS credentials label and service terminology in two related instructions, using attested **peulayanan** and preserving literal vendor menu labels. Positive/negative regressions pass. Composed technical wording has low confidence; wider mixed Acehnese wording still needs review. Neapolitan/Aromanian/Sardinian short queues remain uncertain: restaurant names, untranslated WordPress descriptions and Italian prose do not prove native vocabulary.

**Upload workflow repair (2026-09-13):** local commit `27a566a0d` maps Colombian Spanish `es-CO` to supported Transifex `es_CO`, reports the legacy `es_CO` alias and uploads each distinct target once. Offline regressions pass; no upload was run. All nine differences were reviewed in `6db460891`; seven valid wording alternatives remain intentionally distinct.

**Popup and upload fixes (2026-09-13):** `8549b6c4c` verifies all 245 popup locales and translation-file wiring, adds country-then-language flags and corrects legacy/script exceptions. Helper/wiring checks pass; browser test is added and syntax-checked, execution pending. `cb6830505` fixes French Belgium/Canada, Khmer and Guarani Transifex codes; offline upload tests pass. Manx and Ladin are absent from the public catalogue and remain reported failures. No uploads were run.

**Browser fallback repair (2026-09-13):** `1666a2012` resolves every browser preference in order when no supported profile language is saved, maps standard browser tags to existing legacy locales and handles languagechange without saving a profile choice. All 245 registry locales and positive/negative preference checks pass; UI coverage is syntax-checked, execution pending. `0c0adb48b` fixes Portuguese Portugal upload mapping and verifies canonical alias targets remain loaded.

**Russian upload repair (2026-09-13):** `e6aed7a8c` maps `ru-RU` to `ru_RU` and reports its alias; 241 distinct upload targets remain. Offline upload/loader checks pass. Aromanian `rup` is absent from the public catalogue and remains reported, without substitution by Romanian. No upload was run.

**Browser detection validation (2026-09-13):** `37ae64fa8` adds Cantonese/Wu/Macau aliases and verifies actual startup autoruns, delayed saved profile preferences, languagechange and no profile writes. Locale/startup checks pass. Direct inspection found Latin text in Uzbek Arabic (`uz-AR`) core labels; script/vocabulary repair remains outstanding despite correct browser-tag mapping. Browser execution remains pending.

**Verification (2026-09-13):** **1,002 Node suites, zero failures**; the original 19 failures are resolved. The first complete EVERYTHING run passes all four stages: Meteor (**527**), import (**10**), Node E2E (**10**), three browsers, **103** conformance cases on each of SQLite/PostgreSQL/MySQL/MariaDB and FerretDB unit/vet/integration. Separate URL-prefix preference/logout/invalid-cookie checks pass in all browsers. Two WebKit retries exposed refresh readiness and competing template autofocus; both are repaired, and the refresh check passes ten repetitions without retries. #6691 partial-profile/impersonation regression passes in all three browsers without retries. Fresh EVERYTHING verification is running; an added Fossil script required menu registration, now fixed and checked. Fluent-speaker checks remain outstanding; translation repairs have resumed.

**Unresolved reviews:** Apostrophe support for Klingon search operators is implemented in local commit `0026390bb`; actual Query runtime and card-number regressions pass. All 37 remaining search keywords are replaced and actual-locale parser regressions pass; localized browser verification remains pending. Silesian database terminology and 17 Tigre calendar findings need language-specific validation.

**Origin:** not all errors came from Transifex. The audit covers 4,061 pulled changes and 16,020 additional local findings; Bosnian errors predate the pull (`bdb3b15886a749b725b5290ba0109fcba955f983`). Other origins remain unverified.

[Detailed evidence](Audit-Evidence.md) retains categorized tables. Refresh counts after each repair batch with `node releases/translations/audit-progress.mjs --update-summary`, then record the fix commit and verification. No remote uploads performed.
