# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,610 |
| Restored pre-pull; awaiting validation | 13 |
| Reviewed; retained unchanged | 4,167 |
| Pending review or repair | 291 |
| Total tracked | 20,081 |

Review is ongoing. [Basque rule review](Basque-Review.md) records native
completion/negation evidence (local commit `c4db1c19c`) and a runtime predicate
mismatch. The two completion phrases remain open; no findings were accepted
from spelling evidence alone.
[Inuktitut calendar review](Inuktitut-Calendar-Review.md)
records primary evidence for the calendar noun, the actual settings context,
and why a complete calendar-system/date-display phrase is still unverified.
No calendar findings were accepted from incomplete component-word evidence.
[Nahuatl terminology review](Nahuatl-Review.md)
records why historical tonalpohualli is not yet a verified generic label
for all modern calendars; all 17 findings remain open.
Silesian raw-database terminology remains unverified
after reviewing existing mixed technical vocabulary and search evidence.
Polish-only sources do not establish correct Silesian terminology.
 [Tamazight reference review](Tamazight-Review.md) confirms
French prose in the first 25 pending entries and records a new dictionary
lead requiring primary-source cross-checks. No values accepted from that lead.
 The records in the [correction ledger](../../../releases/translations/audited-corrections.json)
contain **18,603** exact before/after values, including unflagged repairs.
[Detailed evidence](Audit-Evidence.md) retains categorized findings,
source references, confidence limits and archived progress notes.

Latest translation fix: **2026-09-14**, local commit `669f0b31d` —
five Breton accessibility values repaired: three French labels replaced and
two earlier repairs corrected from access to the distinct accessibility noun.
Native computing terminology supports the distinction; full adapted page
compounds and sentence/browser review remain open. All **18,603** corrections,
**4,167** unchanged reviews, focused locale and completeness checks pass.
Unflagged repairs and revisions leave 291 pending and 13 restored findings
unchanged. Earlier modification/access repairs are in `e3d6a1ace`.
Latest unchanged review: **2026-09-14**, local commit `1439c4c61` —
Basque checked/unchecked actions retain distinct native temporal phrases,
with software uncheck terminology and actual generic-item trigger coverage.
Two restored findings are resolved; 13 remain. Specific named-item word order
and live browser execution remain open. Earlier generic movement and Valencian
peach-color reviews are recorded in `aba731e82` and `9f7f94825`.
Earlier unchanged review: **2026-09-14**, Thai r-is —
คือ retained after removing its incorrect insertion before action predicates.
Danish Dage gammel remains validated in `824dd005e` with native age-construction
evidence; no current application use was found for that Danish key.
Three Galician fragments remain validated by the previous contextual repair.
Basque restored phrase review, provisional calendar compounds and broader
language/browser review remain open.
Card-show-lists context is verified against its settings row and toggle.
Additional unflagged unchanged review: **2026-09-14**, `39af6aae5` —
Veps Server and Valencian Errors retained with native software evidence and
protected per locale from filling. Zero unreviewed English placeholders remain;
this does not establish correct language or fluency in all values. These two reviews are outside the original flagged ledger; current
pending/restored counts are 291/13.



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
| iu — Inuktitut | 42 |
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
