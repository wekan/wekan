# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,550 |
| Restored pre-pull; awaiting validation | 2,733 |
| Reviewed; retained unchanged | 1,490 |
| Pending review or repair | 308 |
| Total tracked | 20,081 |

Review is ongoing. The [correction ledger](../../../releases/translations/audited-corrections.json)
contain **18,145** exact before/after values, including unflagged repairs.
[Detailed evidence](Audit-Evidence.md) retains categorized findings,
source references, confidence limits and archived progress notes.

Latest translation fix/review: **2026-09-14**, local commit `1b2232534` —
restored three Esperanto date-format labels to canonical YYYY/MM/DD notation
and retained 37 correct field, email and export values. All **18,145**
correction records and unchanged-value/progress checks pass. Latest review:
**2026-09-14**, local commit `5ab78031d` — retained 34 correct sorting,
filter and import/export labels; long advanced-filter syntax remains open. Browser
verification was not run; no translations were pushed. Completion, pronoun,
overtime, lime-color and scrollbar terminology remain under review.


Fixed categories include wrong-language prose, terminology, warnings,
placeholders and JSON/calendar/search formatting. All 361 originally flagged
Klingon findings and the broader 829 German-identical values were repaired;
the cron label retains the actual tool name Cron. Danish restored review
validated 611 values: 606 retained unchanged and five meanings repaired.
Four Danish context-dependent labels remain: free, Complete, Schedule and Days Old.
Esperanto completion, member-pronoun, overtime and lime-color wording
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
| kl — Greenlandic | 7 |
| dz — Dzongkha | 3 |
| gv — Manx | 3 |
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
by evidence. Requested issue #6692 awaits actionable LDAP bind diagnostics;
translation work continues independently.
