# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-15**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,771 |
| Restored pre-pull; awaiting validation | 4 |
| Reviewed; retained unchanged | 4,174 |
| Pending review or repair | 132 |
| Total tracked | 20,081 |

Summary consolidated **2026-09-14**, local commit `75b0a015b`. Locale counts
now reconcile with the live queue; historical notes remain in detailed evidence.
Updater fix **2026-09-14**, `9c7a845a3`: `audit-progress.mjs --update-summary`
refreshes both tables together, including added/resolved locales, and rejects
inconsistent totals. Dated fix notes and uncertain classifications survive.

Latest translation fix: **2026-09-15**, `8d9facf9a` — replace French
logo-height/hide labels and Arabic board-page return tooltip in Tamazight.
Default height 27 remains literal. Four focused suites pass. Ledger 19,894;
tracked pending 132 (Tamazight 39), restored 4 unchanged. Full spatial,
default terminology and possessive grammar remain under review. Source
conflicts and broader computing/grammar reviews remain open.

The [correction ledger](../../../releases/translations/audited-corrections.json)
records contain **19,894** exact before/after values, including unflagged
repairs. [Detailed evidence](Audit-Evidence.md) preserves categorized findings,
source references, dated commit history and low-confidence limits.
Corrected counts classify changed values; they do not certify full fluency.

Latest terminology review: **2026-09-15** —
[Tamazight accessibility](Tamazight-Review.md) distinguishes digital
accessibility from general entrance/access. Source fallback conflates a
disabled page with missing information, even when a body exists. Preserve
source meaning until that conflict is resolved; specialist terminology
remains open. No locale edit or count change.

Recent repairs also cover Quechua calendar/day labels, Tamazight intervals,
migration wording and computer-server terminology. Latest unchanged review:
`946e1a29b` retains generic Basque member/attachment subjects. Named Basque
DOM and saved-description repairs are `1e4411183` and `0c51a3261`; four
restored values still await full native clause validation.

| Pending locale | Findings |
| --- | ---: |
| zgh — Standard Moroccan Tamazight | 39 |
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
