# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,596 |
| Restored pre-pull; awaiting validation | 27 |
| Reviewed; retained unchanged | 4,158 |
| Pending review or repair | 300 |
| Total tracked | 20,081 |

Review is ongoing. [Nahuatl terminology review](Nahuatl-Review.md)
records why historical tonalpohualli is not yet a verified generic label
for all modern calendars; all 17 findings remain open.
Silesian raw-database terminology remains unverified
after reviewing existing mixed technical vocabulary and search evidence.
Polish-only sources do not establish correct Silesian terminology.
 [Tamazight reference review](Tamazight-Review.md) confirms
French prose in the first 25 pending entries and records a new dictionary
lead requiring primary-source cross-checks. No values accepted from that lead.
 The records in the [correction ledger](../../../releases/translations/audited-corrections.json)
contain **18,314** exact before/after values, including unflagged repairs.
[Detailed evidence](Audit-Evidence.md) retains categorized findings,
source references, confidence limits and archived progress notes.

Latest translation fix: **2026-09-14**, local commit `7c44e4f55` —
10 French-seeded Breton avatar, profile and notification controls repaired
using existing vocabulary. Native software supports the profil loan noun;
retain that noun while translating surrounding French verbs. All **18,314**
corrections and 4,158 unchanged reviews pass structural checks. Native
complete-phrase and browser review remain open, alongside other wrong-language
values, Galician attachment agreement and provisional calendar terminology.
Latest unchanged review: **2026-09-14**, commit `64f1d7367` —
assigned-card shortcut retained against actual current-user assignee toggle.
IEC recognizes meves/meues as dialect variants; no wrong-language finding
is established. Preferred Valencian regional style remains under review.
All **4,158** reviews pass. Shared trigger grammar, provisional calendar
compounds and broader language/browser review remain open.
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
| kl — Greenlandic | 5 |
| dz — Dzongkha | 3 |
| ff — Fulah | 2 |
| ks — Kashmiri | 2 |
| ee — Ewe | 1 |
| qu — Quechua | 1 |
| rup — Aromanian | 1 |
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
