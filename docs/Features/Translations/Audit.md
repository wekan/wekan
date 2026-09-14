# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,586 |
| Restored pre-pull; awaiting validation | 54 |
| Reviewed; retained unchanged | 4,136 |
| Pending review or repair | 305 |
| Total tracked | 20,081 |

Review is ongoing. [Tamazight reference review](Tamazight-Review.md) confirms
French prose in the first 25 pending entries and records a new dictionary
lead requiring primary-source cross-checks. No values accepted from that lead.
 The [correction ledger](../../../releases/translations/audited-corrections.json)
contain **18,196** exact before/after values, including unflagged repairs.
[Detailed evidence](Audit-Evidence.md) retains categorized findings,
source references, confidence limits and archived progress notes.

Latest translation fix: **2026-09-14**, local commit `1b228a63f` —
six Basque archive actions/trigger descriptions use artxibo instead of storage
wording. Direction, imperatives and when clauses remain intact. These unflagged
repairs do not reduce the original queue. All **18,196** corrections pass;
actual action-template wiring and positive/negative terminology checks pass.
Shared Basque trigger grammar remains unresolved. Manx epoch phrasing and
Greenlandic compound grammar remain provisional and need native review.
Veps terminology, shared trigger grammar and browser validation remain open.
Attachment/member rule participles still need context-specific agreement.
Two Esperanto restored findings remain: Complete labels.
Broader language and browser verification remain open; nothing pushed.
Latest unchanged review: **2026-09-14**, commit `c44dca170` — retained
Acehnese Leubeh (More) against Balai Bahasa dictionary usage. Six restored
Acehnese values remain uncertain. Twenty Basque and nine Valencian restored
values, shared-trigger composition and browser verification remain open.
Galician export free wording remains open pending context.
Galician Complete and migration-complete wording remain open pending context.
Card-show-lists context is verified against its settings row and toggle.



Fixed categories include wrong-language prose, terminology, warnings,
placeholders and JSON/calendar/search formatting. All 361 originally flagged
Klingon findings and the broader 829 German-identical values were repaired;
the cron label retains the actual tool name Cron. Danish restored review
validated 611 values: 606 retained unchanged and five meanings repaired.
Four Danish context-dependent labels remain: free, Complete, Schedule and Days Old.
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
