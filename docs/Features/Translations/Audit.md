# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,627 |
| Restored pre-pull; awaiting validation | 4 |
| Reviewed; retained unchanged | 4,175 |
| Pending review or repair | 275 |
| Total tracked | 20,081 |

Summary consolidated **2026-09-14**, local commit `75b0a015b`. Locale counts
now reconcile with the live queue; historical notes remain in detailed evidence.

Latest translation fix: **2026-09-14**, local commit `16232ae09` —
Two French parent-prefix options are replaced, preserving placement and
full-path distinctions. Four checks pass; native/browser validation is open.

The [correction ledger](../../../releases/translations/audited-corrections.json)
records contain **18,714** exact before/after values, including unflagged
repairs. [Detailed evidence](Audit-Evidence.md) preserves categorized findings,
source references, dated commit history and low-confidence limits.
Corrected counts classify changed values; they do not certify full fluency.

Latest terminology review: **2026-09-14**, `9669c2d84` — the dictionary's
predicate is grammatical; debug options are a parser catalogue, not Boolean
conditions. French selector vocabulary also remains unresolved. Evidence and
open native computing terminology are recorded in [Tamazight review](Tamazight-Review.md).

Recent repairs also cover Quechua calendar/day labels, Tamazight intervals,
migration wording and computer-server terminology. Latest unchanged review:
`946e1a29b` retains generic Basque member/attachment subjects. Named Basque
DOM and saved-description repairs are `1e4411183` and `0c51a3261`; four
restored values still await full native/browser validation.

| Pending locale | Findings |
| --- | ---: |
| zgh — Standard Moroccan Tamazight | 162 |
| iu — Inuktitut | 38 |
| nah — Nahuatl | 17 |
| tig — Tigre | 17 |
| wal — Wolaytta | 17 |
| ve-PP — Veps | 10 |
| kl — Greenlandic | 4 |
| dz — Dzongkha | 3 |
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
Live browser verification is not complete. Translation work continues.
