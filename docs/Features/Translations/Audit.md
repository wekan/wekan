# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-14**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,619 |
| Restored pre-pull; awaiting validation | 4 |
| Reviewed; retained unchanged | 4,175 |
| Pending review or repair | 283 |
| Total tracked | 20,081 |

[Aromanian color review](Aromanian-Review.md), local commit `4f63929ee`
(2026-09-14), records primary dictionary page inspection and field-study
evidence. Magenta remains pending; nearby color names do not establish a
correct replacement. Counts are unchanged.

Review is ongoing. [Tigre/Wolaytta calendar review](Tigre-Wolaytta-Calendar-Review.md)
records review `5da10eee5` (2026-09-14): a Tigrinya provenance warning for the Tigre base noun and an additional
untranslated Wolaytta calendar key. Both require native terminology evidence;
no finding was accepted and counts are unchanged.

[Basque rule review](Basque-Review.md) records native
completion/negation evidence (local commit `c4db1c19c`) and a runtime predicate
mismatch. The named incomplete clause remains open; the completed predicate is retained
with native software usage. No finding was accepted from spelling alone.
[Inuktitut calendar review](Inuktitut-Calendar-Review.md)
records primary evidence for the calendar noun, the actual settings context,
and why a complete calendar-system/date-display phrase is still unverified.
No calendar findings were accepted from incomplete component-word evidence.
[Nahuatl terminology review](Nahuatl-Review.md)
records why historical tonalpohualli is not yet a verified generic label
for all modern calendars; all 17 findings remain open.
Silesian raw-database wording is retained with native vocabulary evidence
in `a0aacc7a9`; shared Polish spelling alone does not prove an error.
Exact standardized compound and browser review remain open.
 [Tamazight reference review](Tamazight-Review.md) confirms
French prose in the first 25 pending entries. Review `009fa7dde` independently
cross-checks calendar, user and click components in native Moroccan sources.
Full phrases, warnings and invalidated Tuareg records remain open; no pending
finding was accepted from component evidence.
 The records in the [correction ledger](../../../releases/translations/audited-corrections.json)
contain **18,696** exact before/after values, including unflagged repairs.
[Detailed evidence](Audit-Evidence.md) retains categorized findings,
source references, confidence limits and archived progress notes.

Latest uncertain-phrase repair: **2026-09-14**, `0c51a3261` —
[Basque rule review](Basque-Review.md) records execution of the actual saved
rule-description method. It now joins nonempty fragments without the browser
frame-count global, preserving names, dates, times and user details.
Basque subject order and English preservation tests pass; all Jade compiles.
Browser spec 88 is registered but unrun. Four restored findings remain open
for browser/full native validation. DOM ordering repair is `1e4411183`.
Latest unflagged unchanged review: **2026-09-14**, `5bf34bc48` —
Inuktitut `new` retains `ᓄᑖᖅ`, matching the native software guide's New
command and actual admin creation labels. Focused checks pass; browser review
remains open. Latin Inuktitut spelling is valid; original script warnings
require vocabulary/context review rather than automatic replacement.
Current pending/restored counts are 283/4.

Latest translation fix: **2026-09-14**, local commit `34dbfa64c` —
[Quechua review](Quechua-Review.md) records native day and daily recurrence
terms replacing English wrappers. Four locale and ledger checks pass; calendar
toolbar wiring is checked. Browser and full calendar-compound review remain
open. Original pending/restored counts remain 283/4.

Previous generic-label fix: **2026-09-14**, local commit `5c5ee40b6` —
[Quechua review](Quechua-Review.md) records the native dictionary calendar noun.
Four correction, unchanged-review and locale checks pass. Specific calendar
compounds and browser verification remain open; original counts are unchanged.

Previous translation fix: **2026-09-14**, local commit `b433730e3` —
Afghan Uzbek cancellation spelling restores a missing alif. Indexed native
sources support the spelling, but full pages failed to fetch: full-source
orthographic and browser validation remain open, explicitly low confidence.
[Uzbek Arabic review](Uzbek-Arabic-Review.md) records those limits.
Focused checks and all 18,693 correction/token/completeness checks pass.
Counts are 283 pending and 4 restored; broader uncertain repairs remain open.
Latest unchanged review: **2026-09-14**, local commit `946e1a29b` —
Restored Basque generic member and attachment subjects are retained after
native noun evidence and both actual add/remove control labels were reviewed.
Focused subject/composition/negative/wiring checks, all 4,175 unchanged
acceptances and 234-locale completeness pass. Named subjects and browser
review remain open. Counts are 283 pending and 4 restored.
Earlier movement review is in `2bb54a30b`.
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
pending/restored counts are 283/4.



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
| zgh — Standard Moroccan Tamazight | 170 |
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
