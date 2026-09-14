# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,585 |
| Restored pre-pull; awaiting validation | 59 |
| Reviewed; retained unchanged | 4,132 |
| Pending review or repair | 305 |
| Total tracked | 20,081 |

Review is ongoing. The [correction ledger](../../../releases/translations/audited-corrections.json)
contain **18,188** exact before/after values, including unflagged repairs.
[Detailed evidence](Audit-Evidence.md) retains categorized findings,
source references, confidence limits and archived progress notes.

Latest translation fix: **2026-09-14**, local commit `cc3e80e8b` —
two Manx tabular Hijri labels replace English placeholders while keeping
civil and astronomical starting dates distinct. Dictionary vocabulary supports
tabular/civil/astronomical; the technical starting-date phrase is provisional
and needs native review. Coptic naming remains unresolved. All **18,188**
correction and **4,132** review records pass. Greenlandic compound grammar
from `ed5a0d879` also remains provisional.
Veps terminology, shared trigger grammar and browser validation remain open.
Attachment/member rule participles still need context-specific agreement.
Three Esperanto restored findings remain: lime color and two Complete labels.
Broader language and browser verification remain open; nothing pushed.
Latest unchanged review: **2026-09-14**, commit `be334a5bf` — retained
two Valencian joined checklist search tokens. Regression executes the real
parser with localized checklist-text and positive/negative presence searches;
unknown fields are rejected. Nine restored Valencian values remain.
Technical loanwords and completion-state context still need review. Uzbek
Arabic-script and Breton wording, previous Thai and compound-trigger findings
stay unresolved. Browser verification remains open.
Galician export free wording remains open pending context.
Galician Complete and migration-complete wording remain open pending context.
Card-show-lists context is verified against its settings row and toggle.



Fixed categories include wrong-language prose, terminology, warnings,
placeholders and JSON/calendar/search formatting. All 361 originally flagged
Klingon findings and the broader 829 German-identical values were repaired;
the cron label retains the actual tool name Cron. Danish restored review
validated 611 values: 606 retained unchanged and five meanings repaired.
Four Danish context-dependent labels remain: free, Complete, Schedule and Days Old.
Esperanto lime-color wording
remains open.
Reviewed subtask actions/settings retain correct subordinate-task compounds.

| Pending locale | Findings |
| --- | ---: |
| zgh — Standard Moroccan Tamazight | 173 |
| iu — Inuktitut | 50 |
| nah — Nahuatl | 17 |
| tig — Tigre | 17 |
| wal — Wolaytta | 17 |
| ve-PP — Veps | 10 |
| kl — Greenlandic | 6 |
| dz — Dzongkha | 3 |
| gv — Manx | 1 |
| bm — Bambara | 2 |
| ff — Fulah | 2 |
| ks — Kashmiri | 2 |
| ee — Ewe | 1 |
| qu — Quechua | 1 |
| rup — Aromanian | 1 |
| sc — Sardinian | 1 |
| szl — Silesian | 1 |

Completion also requires reviewing all restored and unflagged values and
previous low-confidence repairs. In particular, 98 Tamazight correction
records have invalidated Moroccan provenance: CNAM MCΓ denotes Tuareg,
not Moroccan. Corrected source notes are not full dialect/grammar validation.
Calendar civil/astronomical epochs and moon-sighting distinctions, memory
and authentication diagnostics, migration labels, archive/logo terminology,
search-case instructions and full command grammar retain the evidence's
recorded limits. Obsolete migration strings remain in translation scope.
Veps filter syntax repairs preserve literal examples; Finnish prose still
needs full Veps translation. [Veps review](Veps-Review.md) records limits.

Placeholder, JSON and key-order checks verify structure, not fluency.
Preserve every English interpolation/format token exactly and retain correct
translations unchanged. No external translation service is used.

Not all wrong values came from Transifex: the audit tracks 4,061 pulled
changes and 16,020 additional local findings; some Bosnian errors predate
the pull. Correct-language human translations remain preferred. Keep the
full review scope open until language and browser validation is supported
by evidence. Issue #6692 post-bind optional-filter TypeError is repaired in local commit
`2c5cdd78a`; live LDAP login remains unverified. Translation work continues.
