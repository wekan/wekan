# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-09-15**.

| Status | Flagged keys |
| --- | ---: |
| Corrected | 15,880 |
| Restored pre-pull; awaiting validation | 0 |
| Reviewed; retained unchanged | 4,201 |
| Pending review or repair | 0 |
| Total tracked | 20,081 |

Summary consolidated **2026-09-14**, local commit `75b0a015b`. Locale counts
now reconcile with the live queue; historical notes remain in detailed evidence.
Updater fix **2026-09-14**, `9c7a845a3`: `audit-progress.mjs --update-summary`
refreshes both tables together, including added/resolved locales, and rejects
inconsistent totals. Dated fix notes and uncertain classifications survive.

Latest translation fix: **2026-09-15**, `ae76ba79d` — replace the
Tigrinya-copied noun in Tigre's DDP transport label with a
corpus-glossed Tigre term while preserving the technical identifier.
Focused, runtime, ledger and 234-locale checks pass. Ledger:
**22,182** records; exact Tigre/Tigrinya overlap: **228**, with
**206** full values still unclassified. Complete phrase grammar
remains low confidence pending native review.

Earlier translation fix: **2026-09-15**, `31a238d91` — repair the
last two obsolete list-width errors in Cherokee and Wolaytta,
plus Wolaytta's English width label. The focused, Cherokee runtime,
ledger, 234-locale and full old-threshold scan pass. Correction
ledger: **22,181**; stale list-width values: **0**. Cherokee's
mathematical whole-number use and Wolaytta's precise technical width
and count terms remain low confidence pending native review. This
closes the old-threshold queue, **not** the broader wrong-language
and seeded-value audit.

Earlier translation fix: **2026-09-15**, `21319c523` — replace the
corrupt Xitsonga list-width label and error with native width,
list and whole-number terms plus the inclusive 200-pixel rule.
Focused, runtime, ledger and 234-locale checks pass. The singular
whole-number form and full clause remain low confidence for native
review. Correction ledger: **22,178**; stale list-width values: **2**.

Earlier translation fix: **2026-09-15**, `83c8d0c2b` — repair
Aymara and Quechua list-width labels and obsolete errors. Native
list, width and whole-number terms replace Spanish/English seeds;
the inclusive 200-pixel minimum matches the popup's rule. Focused,
runtime, ledger and 234-locale completeness checks pass. Quechua
dialect fit and both complete clauses remain low confidence for
native review. Correction ledger: **22,176**; stale list-width
values: **3**.

Earlier translation fix: **2026-09-15**, `c18780d5b` — correct
Hawaiian, Klingon and Inuktitut list-width errors using inclusive
200-pixel bounds. The Hawaiian value replaces corrupt pseudo-language
seeds with attested width and whole-number words. Focused, runtime,
ledger and 234-locale completeness checks pass; complete clauses
remain low confidence pending native grammar review. Correction
ledger: **22,172**; stale list-width values: **5**.

Earlier translation fix: **2026-09-15**, `bb2d2dfeb` — correct the
obsolete list-width minimum in Nahuatl, Volapük and Tamazight,
retaining their local list, width and number words. The focused,
Nahuatl progress, runtime, ledger and 234-locale checks pass.
All three full clauses remain low confidence pending native grammar
review. Correction ledger: **22,169**; stale list-width values: **8**.

Earlier translation fix: **2026-09-15**, `beddec7cb` — repair Serbian
list-width controls as one consistent “листа” setting, plus the
obsolete error messages in Venetian, Veps, Twi and Tongan. The four
regional complete clauses remain low confidence pending native
grammar review. Focused UI-string, Serbian runtime, ledger and
234-locale completeness checks pass. Seventeen exact values added
to the ledger: **22,166** records; stale list-width values: **11**.

Earlier translation fix: **2026-09-15**, `3eaeac9e7` — repair ten
Moroccan Arabic, Tatar, Upper Sorbian, Kashubian, Silesian, Pulaar,
Wolof, Greenlandic, Luganda and Bislama list-width values. Tatar,
Upper Sorbian, Luganda and Bislama source sentences used Turkish,
Czech or English requirement prose. All ten complete clauses remain
low confidence pending native grammar review; wider wrong-language
seeding remains open. Focused, runtime, Greenlandic progress, ledger
and 234-locale completeness checks pass. One earlier Silesian ledger
row was consolidated: **22,149** records; stale list-width values:
**16**.

Earlier translation fix: **2026-09-15**, `92ea2a0f0` — repair ten
Acehnese, Bambara, Ewe, Venda, Turkmen, Waray, Nyanja, Sakha,
Chuvash and Urdu list-width messages. Urdu's English transliteration
is replaced by Urdu prose. Seven complete clauses remain low
confidence pending native grammar review. The focused suite, Venda
runtime lookup, older Ewe/Chuvash suites, ledger and 234-locale
completeness checks pass. Correction ledger: **22,140**; stale
list-width values: **26**.

Earlier translation fix: **2026-09-15**, `9c1388a49` — repair ten
Buryat, Fijian, Konkani, Guarani, Maithili, Tok Pisin, Kirundi,
Tagalog, Shona and Igbo list-width messages. Three values contained
English-seeded requirement prose; replacements use native width and
whole-number wording. Eight complete clauses remain low confidence
pending native grammar review. Focused, runtime, ledger and 234-locale
completeness checks pass. Correction ledger: **22,130**; stale
list-width values: **36**.

Earlier translation fix: **2026-09-15**, `3bf6a4c82` — repair nine
Northern Ndebele, Swati, Tswana, Kinyarwanda, Xhosa, Southern Sotho,
Samoan, Yoruba and Māori list-width messages. Native whole-number and
minimum wording replaces the old rule. Kinyarwanda, Xhosa, Yoruba and
Māori complete clauses remain low confidence pending native grammar
review. Three older progress suites now check the actual rule. Focused,
runtime, ledger and 234-locale completeness checks pass. Correction
ledger: **22,120**; stale list-width values: **46**.

Earlier translation fix: **2026-09-15**, `74e6deabe` — repair 12 Bashkir,
Hausa, Kurdish, Malagasy, Northern Sotho, Oromo, Somali, Swahili,
Yiddish and Zulu list-width values using native whole-number and
inclusive 200-pixel terms. Central Kurdish and Yiddish complete clauses
remain low confidence pending native grammar review. Four older
progress suites now verify the actual rule. Focused, runtime, ledger
and 234-locale completeness checks pass. Correction ledger: **22,111**;
stale list-width values: **55**.

Earlier translation fix: **2026-09-15**, `8cc659ac9` — repair 24 Asian
and Asian-script list-width values with native integer, pixel and
inclusive 200 terms. Seven older progress suites now verify the
current rule. Tibetan, Dzongkha, Bhojpuri, Kashmiri, Odia, Sinhala,
Tigrinya and Pashto full clauses remain low confidence pending native
grammar review. Focused, language, ledger and inventory checks pass.
Correction ledger at that commit: **22,099**; stale list-width values: **67**.

Earlier translation fix: **2026-09-15**, `0fe4ecb48` — repair 20 Romance,
Celtic and related list-width messages. Aragonese and Cornish now use
the unambiguous `≥ 200` boundary; other locales use their native
lower-bound terms. Ten complete clauses are low confidence pending
native grammar review. The earlier Aragonese correction row was
consolidated, so the ledger grows by 19 to **22,075** records.
The stale list-width queue falls to **91**. Focused, runtime, ledger,
language and inventory checks pass.

Earlier translation fix: **2026-09-15**, `6d94f4edb` — repair 28 further
list-width values across Nordic, Baltic, Slavic, Caucasus and other
locales, including an English-seeded Maltese sentence. Maltese,
North Sami, Georgian and Latvian full clauses remain low confidence
pending native grammar review; their numeric and integer meanings are
verified. Related Kazakh, Kyrgyz, Tajik and Latvian regression gates
now check the current rule and ledger state. Remaining stale values:
**111**; correction ledger: **22,056**.

Earlier translation fix: **2026-09-15**, `0b0349d34` — repair six Simplified
Mandarin, three Traditional Chinese, one Wu and one Cantonese
list-width messages. The Wu and Cantonese values replace Mandarin-seeded
sentences with dialect words, but their complete clauses remain low
confidence pending native review. The inclusive 200-pixel and integer
rule, exact values, ledger records and runtime Traditional Chinese lookup
pass. Remaining stale list-width values: **139**.

Earlier translation fix: **2026-09-15**, `212a46c07` — repair 33 Azerbaijani,
Catalan, Uzbek Latin, Greek, Welsh, Romanian, Slovenian, Vietnamese,
Afrikaans, Frisian, Galician, Hindi, Malay, Bosnian/Croatian and Khmer
list-width values. The Khmer `km-KH` alias follows tracked `km_KH`.
The same source commit aligns a stale Galician archive-help test with
the English source and current All Boards UI. Focused, related-language,
ledger and inventory checks pass. Remaining list-width queue: **150**.

Earlier translation fix: **2026-09-15**, `d6e6c558d` — repair 22 Arabic,
Hebrew, Russian, Ukrainian, Japanese, Korean, Polish, Czech and Dutch
list-width values. Russian `ru-RU` resolves to the tracked `ru_RU` file,
so it needs no second ledger row. Focused, runtime, ledger and inventory
checks pass. Previous 23-variant Romance/Germanic repair `e6895b3de` and
Persian-digit repair `196bc49df` remain in detailed evidence.

Earlier translation fix: **2026-09-15**, `e6895b3de` — repair 23 German,
Spanish, French, Italian and Portuguese list-width variants with native
whole-number and inclusive-200-pixel wording. Focused and related-language
suites pass. Persian-digit repairs `196bc49df` and source/popup correction
`68d679c6c` remain recorded in detailed evidence.

The tracked Tigre calendar queue being empty does not certify the locale. Of
2,613 non-English Tigre values, 228 are byte-for-byte identical to Tigrinya;
22 complete forms are corpus-attested shared terms and 206 full values remain
unclassified, including 18 of at least 20 characters and 2 of at least 35.
Four newly matching File phrases have a corpus-attested noun, but their full
clauses still need review. This is an
explicit broader wrong-language review item and must be resolved before the
full audit closes.

The [correction ledger](../../../releases/translations/audited-corrections.json)
records contain **22,182** exact before/after values, including unflagged
repairs. [Detailed evidence](Audit-Evidence.md) preserves categorized findings,
source references, dated commit history and low-confidence limits.
Corrected counts classify changed values; they do not certify full fluency.

Latest unchanged-value review: **2026-09-15**, `a69ed2325` — retain the
Tigre Accounts and Errors plurals after exact corpus sentences independently
attest both forms. The prior terminology review is **2026-09-15**, `2ecd74637` — retain the final four
restored Basque named-subject fragments after checking actual rule-builder and
saved-description composition. The selected name precedes the noun phrase and
the following action supplies the temporal clause. All 20,081 original rows
are now classified: 15,880 corrected and 4,201 retained, with zero restored or
pending.

Recent repairs also cover Quechua calendar/day labels, Tamazight intervals,
migration wording and computer-server terminology. Latest unchanged review:
`946e1a29b` retains generic Basque member/attachment subjects. Named Basque
DOM and saved-description repairs are `1e4411183` and `0c51a3261`.

| Pending locale | Findings |
| --- | ---: |

Remaining review includes unflagged and prior low-confidence values beyond
this now-empty pending table. Structural checks preserve exact English
placeholders, JSON examples and key order; they do not establish language
quality. Correct-language human translations remain preferred. No external
translation service is used, and no remote push was performed.

The unflagged source-semantic list-width queue is **closed**: a full
scan of all 234 locale error values finds **zero** old 270 thresholds.
The actual shared minimum is 200. Detailed evidence records every
repair wave and canonical-file alias; this queue was outside the
20,081 original flagged rows. Native review of low-confidence full
clauses and broader wrong-language seeds remains open.

- [Tamazight](Tamazight-Review.md): wrong-language prose, 98 records with
  invalidated Tuareg provenance, adapted grammar and software terminology.
  Active migration stage IDs bypass translations; removed migrations must
  stay removed (source review `94c8857fd`).
- [Inuktitut](Inuktitut-Calendar-Review.md), [Nahuatl](Nahuatl-Review.md),
  [Tigre/Wolaytta](Tigre-Wolaytta-Calendar-Review.md),
  [Quechua](Quechua-Review.md) and [Aromanian](Aromanian-Review.md): calendar
  qualifiers, complete compounds and native terminology.
- [Basque](Basque-Review.md): broader full phrases and browser spec 88
  (Chromium passed). [Veps](Veps-Review.md): Finnish-seeded review complete;
  literal filter examples must be preserved.
- [Uzbek Arabic](Uzbek-Arabic-Review.md): indexed cancellation evidence needs
  full-source and native orthographic verification (`b433730e3`).

Not all errors came from Transifex: 4,061 findings concern pulled changes;
16,020 concern additional local values. Detailed evidence retains earlier
completed categories and reviews, including Klingon, Danish, Silesian and
unflagged native-term retentions. Calendar epochs/sighting, diagnostics,
authentication, commands and other uncertain phrases remain under review.
Verification summary — **2026-09-14**:

- Runtime formatter `c74009b21` verifies scalar arguments, zero, named
  options and English fallback. `55562f666` verifies exact limit-error
  substitution in all 246 locale files. Parser coverage `8715c094e`, `bc9860dff`
  and `27f6c9d2a` verifies limit errors and date filtering/sorting.
- Browser spec 03 executed in Chromium (`75fbb698c`, 1 passed), with later
  conjunction, board-control and Default-label runs recorded in the native
  review. Spec 88 (`c9005ee0a`, 1 passed) verifies Basque composition.
  These supersede earlier unavailable-app notes; full native grammar and
  other UI paths remain under review.
- Structural checks preserve placeholders, key order, JSON examples and
  newer correct-language translations; they do not certify native fluency.

Translation work continues. Dated details remain in [evidence](Audit-Evidence.md).
