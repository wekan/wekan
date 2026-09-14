# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,588 |
| Restored pre-pull; awaiting validation | 36 |
| Reviewed; retained unchanged | 4,152 |
| Pending review or repair | 305 |
| Total tracked | 20,081 |

Review is ongoing. Silesian raw-database terminology remains unverified
after reviewing existing mixed technical vocabulary and search evidence.
Polish-only sources do not establish correct Silesian terminology.
 [Tamazight reference review](Tamazight-Review.md) confirms
French prose in the first 25 pending entries and records a new dictionary
lead requiring primary-source cross-checks. No values accepted from that lead.
 The records in the [correction ledger](../../../releases/translations/audited-corrections.json)
contain **18,199** exact before/after values, including unflagged repairs.
[Detailed evidence](Audit-Evidence.md) retains categorized findings,
source references, confidence limits and archived progress notes.

Latest translation fix: **2026-09-14**, local commit `287e99dd2` —
Galician Schedule now uses the noun Programación rather than infinitive
Programar, matching historical cron table/dropdown labels in a440d44ea.
Latest unchanged review: **2026-09-14**, commit `287e99dd2` — Danish
Tidsplan and Basque/Valencian idle-state labels retained. All **18,199**
corrections and **4,152** reviews pass. No current consumers found for these
historical labels; live browser and broader language review remain open.
Esperanto restored queue is resolved; wider fluency review remains open.
Shared trigger grammar and remaining technical wording are still under review.
Card-show-lists context is verified against its settings row and toggle.



Fixed categories include wrong-language prose, terminology, warnings,
placeholders and JSON/calendar/search formatting. All 361 originally flagged
Klingon findings and the broader 829 German-identical values were repaired;
the cron label retains the actual tool name Cron. Danish restored review
validated 611 values: 606 retained unchanged and five meanings repaired.
Danish Schedule is validated; Days Old remains context-dependent.
Esperanto lime-color wording was repaired in `d454a58ff`.
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
