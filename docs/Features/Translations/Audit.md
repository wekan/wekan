# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,663 |
| Restored pre-pull; awaiting validation | 4 |
| Reviewed; retained unchanged | 4,175 |
| Pending review or repair | 239 |
| Total tracked | 20,081 |

Summary consolidated **2026-09-14**, local commit `75b0a015b`. Locale counts
now reconcile with the live queue; historical notes remain in detailed evidence.
Updater fix **2026-09-14**, `9c7a845a3`: `audit-progress.mjs --update-summary`
refreshes both tables together, including added/resolved locales, and rejects
inconsistent totals. Dated fix notes and uncertain classifications survive.

Latest translation fix: **2026-09-14**, local commit `94205ae5f` —
Arabic automatic-addition label becomes a complete Tamazight draft with
the users-with-domain-name condition. Four checks pass; relative-clause
grammar and native/browser review remain open. Pending: 239.

The [correction ledger](../../../releases/translations/audited-corrections.json)
records contain **18,796** exact before/after values, including unflagged
repairs. [Detailed evidence](Audit-Evidence.md) preserves categorized findings,
source references, dated commit history and low-confidence limits.
Corrected counts classify changed values; they do not certify full fluency.

Latest terminology review: **2026-09-14**, `bc406fcae` — IRCAM-hosted
Taifi syntax research supports prepositional possession in the domain-label
draft. Plural relative grammar and complete wording remain unverified.
See [Tamazight review](Tamazight-Review.md).

Recent repairs also cover Quechua calendar/day labels, Tamazight intervals,
migration wording and computer-server terminology. Latest unchanged review:
`946e1a29b` retains generic Basque member/attachment subjects. Named Basque
DOM and saved-description repairs are `1e4411183` and `0c51a3261`; four
restored values still await full native/browser validation.

| Pending locale | Findings |
| --- | ---: |
| zgh — Standard Moroccan Tamazight | 131 |
| iu — Inuktitut | 38 |
| nah — Nahuatl | 17 |
| tig — Tigre | 17 |
| wal — Wolaytta | 17 |
| ve-PP — Veps | 10 |
| dz — Dzongkha | 2 |
| ff — Fulah | 2 |
| ks — Kashmiri | 2 |
| ee — Ewe | 1 |
| qu — Quechua | 1 |
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
  88 (registered, unrun). [Veps](Veps-Review.md): remaining Finnish prose;
  literal filter examples must be preserved.
- [Uzbek Arabic](Uzbek-Arabic-Review.md): indexed cancellation evidence needs
  full-source and native orthographic verification (`b433730e3`).

Not all errors came from Transifex: 4,061 findings concern pulled changes;
16,020 concern additional local values. Detailed evidence retains earlier
completed categories and reviews, including Klingon, Danish, Silesian and
unflagged native-term retentions. Calendar epochs/sighting, diagnostics,
authentication, commands and other uncertain phrases remain under review.
Browser coverage added **2026-09-14**, `c8bcfb258`: spec 03 verifies the
Tamazight numeric tooltip and excludes a display-disabled field from its
sum. Syntax and registration pass; localhost:3000 has no running app, so
execution remains pending. Live browser verification is not complete.
Runtime dispatch checked **2026-09-14**, `8715c094e`: real Tamazight limit
queries preserve invalid values and accept positive/zero limits. Parser
coverage does not establish TAPi18n interpolation or browser rendering.
Formatting fixed **2026-09-14**, `c74009b21`: direct scalar TAPi18n
arguments now populate sprintf. Actual runtime-method/formatter checks
pass for Tamazight errors, zero, named options and English fallback.
Browser rendering and native fluency remain unverified.
Translation work continues.
