# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-15**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,749 |
| Restored pre-pull; awaiting validation | 4 |
| Reviewed; retained unchanged | 4,174 |
| Pending review or repair | 154 |
| Total tracked | 20,081 |

Summary consolidated **2026-09-14**, local commit `75b0a015b`. Locale counts
now reconcile with the live queue; historical notes remain in detailed evidence.
Updater fix **2026-09-14**, `9c7a845a3`: `audit-progress.mjs --update-summary`
refreshes both tables together, including added/resolved locales, and rejects
inconsistent totals. Dated fix notes and uncertain classifications survive.

Latest translation fix: **2026-09-15**, `3da9c1f4e` — replace unflagged
French card-owner export heading with the existing Tamazight compound.
Four focused suites pass. Ledger 19,865; tracked pending 154 (Tamazight 61),
restored 4 unchanged. Software ownership compound and gender-neutral usage
remain low confidence. The active list popup's irreversible English warning
still conflicts with its `lists.softRemove` handler; follow-up remains open.

The [correction ledger](../../../releases/translations/audited-corrections.json)
records contain **19,865** exact before/after values, including unflagged
repairs. [Detailed evidence](Audit-Evidence.md) preserves categorized findings,
source references, dated commit history and low-confidence limits.
Corrected counts classify changed values; they do not certify full fluency.

Latest terminology review: **2026-09-15** —
[Tamazight tabular qualifier](Tamazight-Review.md) excludes furniture-table
senses from arithmetic calendar wording. Keep both tabular variants and
their Julian epoch distinction; general computed-calendar wording is too
broad. Native fixed-rule terminology remains open; counts unchanged.
Earlier reviews remain in detailed evidence.

Recent repairs also cover Quechua calendar/day labels, Tamazight intervals,
migration wording and computer-server terminology. Latest unchanged review:
`946e1a29b` retains generic Basque member/attachment subjects. Named Basque
DOM and saved-description repairs are `1e4411183` and `0c51a3261`; four
restored values still await full native clause validation.

| Pending locale | Findings |
| --- | ---: |
| zgh — Standard Moroccan Tamazight | 61 |
| iu — Inuktitut | 38 |
| nah — Nahuatl | 17 |
| tig — Tigre | 17 |
| wal — Wolaytta | 10 |
| ve-PP — Veps | 9 |
| ee — Ewe | 1 |
| rup — Aromanian | 1 |

Remaining review includes all restored, unflagged and prior low-confidence
values, not just this pending table. Structural checks preserve exact English
placeholders, JSON examples and key order; they do not establish language
quality. Correct-language human translations remain preferred. No external
translation service is used, and no remote push was performed.

- [Tamazight](Tamazight-Review.md): wrong-language prose, 98 records with
  invalidated Tuareg provenance, adapted grammar and software terminology.
  Active migration stage IDs bypass translations; removed migrations must
  stay removed (source review `94c8857fd`).
- [Inuktitut](Inuktitut-Calendar-Review.md), [Nahuatl](Nahuatl-Review.md),
  [Tigre/Wolaytta](Tigre-Wolaytta-Calendar-Review.md),
  [Quechua](Quechua-Review.md) and [Aromanian](Aromanian-Review.md): calendar
  qualifiers, complete compounds, native terminology and magenta attestation.
- [Basque](Basque-Review.md): named subjects, full phrases and browser spec
  88 (Chromium passed; full native clauses open). [Veps](Veps-Review.md):
  remaining Finnish prose;
  literal filter examples must be preserved.
- [Uzbek Arabic](Uzbek-Arabic-Review.md): indexed cancellation evidence needs
  full-source and native orthographic verification (`b433730e3`).

Not all errors came from Transifex: 4,061 findings concern pulled changes;
16,020 concern additional local values. Detailed evidence retains earlier
completed categories and reviews, including Klingon, Danish, Silesian and
unflagged native-term retentions. Calendar epochs/sighting, diagnostics,
authentication, commands and other uncertain phrases remain under review.
Verification summary — **2026-09-14**:

- Runtime formatter `c74009b21` verifies scalar arguments, zero, named
  options and English fallback. `55562f666` verifies exact limit-error
  substitution in all 246 locale files. Parser coverage `8715c094e`, `bc9860dff`
  and `27f6c9d2a` verifies limit errors and date filtering/sorting.
- Browser spec 03 executed in Chromium (`75fbb698c`, 1 passed), with later
  conjunction, board-control and Default-label runs recorded in the native
  review. Spec 88 (`c9005ee0a`, 1 passed) verifies Basque composition.
  These supersede earlier unavailable-app notes; full native grammar and
  other UI paths remain under review.
- Structural checks preserve placeholders, key order, JSON examples and
  newer correct-language translations; they do not certify native fluency.

Translation work continues. Dated details remain in [evidence](Audit-Evidence.md).
