# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,601 |
| Restored pre-pull; awaiting validation | 19 |
| Reviewed; retained unchanged | 4,162 |
| Pending review or repair | 299 |
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
contain **18,556** exact before/after values, including unflagged repairs.
[Detailed evidence](Audit-Evidence.md) retains categorized findings,
source references, confidence limits and archived progress notes.

Latest translation fix: **2026-09-14**, local commit `cdff2d19d` —
fourteen French-seeded Breton diagnostic/status values repaired. Pending
now means waiting rather than running; complete and failed remain distinct.
Native error/waiting terms and existing nouns/status wording are reused.
All **18,556** corrections and **4,162** unchanged reviews pass; focused
status regression and locale completeness pass. Adapted whole-phrase grammar
and live browser execution remain open. Previous repairs remain verified.
Latest unchanged review: **2026-09-14**, commit `824dd005e` —
Danish Dage gammel retained with native dictionary age-construction evidence;
the Swedish pulled replacement remains rejected. No current application use
of this key was found, so rendered UI validation is not claimed.
Three Galician fragments remain validated by the previous contextual repair.
Basque restored phrase review, provisional calendar compounds and broader
language/browser review remain open.
Card-show-lists context is verified against its settings row and toggle.
Additional unflagged unchanged review: **2026-09-14**, `39af6aae5` —
Veps Server and Valencian Errors retained with native software evidence and
protected per locale from filling. Zero unreviewed English placeholders remain;
this does not establish correct language or fluency in all values. These two reviews are outside the original flagged ledger; current
pending/restored counts are 299/19.



Fixed categories include wrong-language prose, terminology, warnings,
placeholders and JSON/calendar/search formatting. All 361 originally flagged
Klingon findings and the broader 829 German-identical values were repaired;
the cron label retains the actual tool name Cron. The complete Danish flagged queue
now has 629 retained values and seven corrected meanings.
Danish Schedule and Days Old are validated; live browser review remains open.
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
| kl — Greenlandic | 4 |
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
