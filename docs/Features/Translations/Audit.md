# Translation audit progress

Audit date: **2026-09-12**. Last updated: **2026-10-07**.

## Login-setting fill resumed — 2026-10-07

The three login-setting keys now have text in all 234 non-English locale
paths. English variants retain English. They leave `pending-transifex.json`
after locale-wide source-key/order and exact-placeholder validation; the
remaining 204 pending source keys and the larger ordinary backlog stay open.
Existing values were preserved byte-for-value in this batch. This fills
missing messages, not the complete catalogs or the semantic audit below.

The new minority-language compounds are provisional. In particular, Cherokee,
Inuktitut, Tigre, Wolaytta, Aymara, Nahuatl, Tamazight, Veps, Ladin, Aromanian,
Volapük and Klingon need speaker review of HTTP headers, stored values and
restart clauses. Script and no-English assertions cannot establish fluency.

Terminology evidence used for these drafts:

- [Mozilla's Upper Sorbian troubleshooting](https://support.mozilla.org/hsb/kb/firefox-wisa-abo-hizo-njereaguje)
  uses `znowa startować` for restarting.
- [Wolof dictionary](https://wolofresources.org/language/download/wollof.pdf)
  gives the start/begin verb `taambali`; the draft uses modern orthography.
- [Bambara dictionary](https://www.mooreburkina.com/sites/www.mooreburkina.com/files/pdf-files/Bambara%20Lexique.pdf)
  supplies the start root `daminɛ`; full software phrasing is assembled.
- [Nahuatl dictionary](https://nahuatl.wired-humanities.org/content/pehua)
  supports the begin root. The HTTP compound is provisional.
- [Volapük vocabulary](https://en.wikisource.org/wiki/Hand-book_of_Volap%C3%BCk/VOCABULARY)
  supplies the value noun. Modern software compounds require separate review.
- [Wolaytta verb list](https://kaikki.org/dictionary/Wolaytta/pos-verb/index.html)
  gives `doomma` for beginning an activity. The restart clause is a draft,
  not an attested complete sentence.
- [Tigre field notes](https://www.speaktigre.com/_files/ugd/7e068a_028156790a9f4428a3bca4ad04c7f99e.pdf)
  distinguish the start, repeat and work roots and after-constructions
  (printed pages 23, 27–30 and 70). The draft uses Tigre constructions rather
  than copying the Tigrinya message. Ethiopic spelling and full grammar remain
  low confidence; the lexical evidence does not validate the assembled clause.

The 237 translation suites pass. The existing Finnish, Arabic and Japanese
browser scenarios are syntax-checked only; no browser execution is claimed.

Unflagged text observed while choosing vocabulary still needs repair:
`database-migration-description` in Corsican is mixed with Italian; Aymara
and Wolaytta retain English clauses; Quechua contains English with added
suffixes and altered command literals. Several generic `login` labels still
have language-name prefixes or unrelated wording (Akan, Aymara, Latin,
Quechua, Tok Pisin, Wolaytta). These are not accepted as correct merely
because they differ from English. They remain part of the broader audit.

## Archiving and date filters — 2026-10-07

Filled 23 English placeholders each in Tibetan (`bo`), Buryat (`bua`),
Chuvash (`cv`), Kashmiri (`ks`), Tigrinya (`ti`), Manx (`gv`), Venetian
(`ve-CC`), Veps (`ve-PP`) and Venda (`ve`). Existing translated values are
preserved. The 207 replacements reduce the standard backlog by 180 because
three auto-archive keys per locale are counted separately in the pending-
Transifex queue. The remaining report is 51,995 values.

Terminology follows each catalog's card, list, archive and date labels.
The [Buryat textbook](https://nom.buryat-lang.ru/nom.pdf) attests the last/past
qualifier; [Chuvash native-language usage](https://chuvash.org/news/23215.html)
helps distinguish day/month and time-span constructions. These references
support components, not the full software messages. All nine drafts remain
provisional pending speaker review, particularly the inclusive range and
list-age explanations. Tibetan recency text explicitly refers to elapsed
rather than future time.

[Learn Manx](https://www.learnmanx.com/learning/intermediate/lesson-15shoh-ny-va-mee-jannoo---i-was-doing-this-1081/)
provides week/past-time usage. The [Veps day entry](https://en.wiktionary.org/wiki/p%C3%A4iv)
and [Karelian Research Centre dictionary](https://dictorpus.krc.karelia.ru/en/dict/lemma/420?page=2794&search_gramsets%5B1%5D=16)
support day/month vocabulary. The [South African education workbook](https://www.education.gov.za/Portals/0/Documents/Manuals/2026%20Workbooks/Maths%20vol%201/grade%202/Num%20venda%20gr2%20vol1%20lowres.pdf?ver=2026-01-20-000232-000)
provides Venda day, week and month terms; older Zulu words in the Venda
catalog are not vocabulary evidence for these new messages. The new Venda
text uses local time words, with a technical loan for templates. Existing
Zulu-seeded general labels still need repair in the broader audit.

The expanded archiving/date-filter suite preserves the query examples,
numeric bounds and negative semantics: templates are never archived and
editing a card does not reset its list age. Full key-order/token and
human-preference checks pass. The existing browser mutation scenario now
covers the nine locales' labels and hints as well as setting/clearing the
threshold; it is syntax-checked, not browser-executed in this environment.

## Further archiving and date filters — 2026-10-07

Filled 23 English placeholders each in Guaraní (`gn`), Ewe (`ee`), Wolof
(`wo`), Fulah (`ff`) and Klingon (`tlh`). A comparison against the previous
commit confirms that all 115 replacements were English placeholders;
existing translations are preserved. The standard backlog falls by 100 to
51,895 values, with 15 auto-archive values counted separately as pending
Transifex. The shared feature suite now covers 53 locale paths.

The [Corrientes education dictionary](https://www.mec.gob.ar/descargas/Bibliograf%C3%ADa/Educaci%C3%B3n%20Intercultural%20Biling%C3%BCe/GUARANI/avane-Diccionario-Guarani-Esp-Esp-Guarani.pdf)
supports Guaraní week vocabulary. The [Basic Ewe word list](https://www.peterlin.pl/ewe/words.html)
provides week terms, while the [Wolof dictionary](https://jangawolof.org/dictionary/)
provides day, week and hour terms. Fulah terminology follows the existing
[Fulah review](Fulah-Review.md) and its Senegal education terminology source;
Pulaar/Pular dialect consistency still needs speaker review.
[Klingonska time vocabulary](https://klingonska.org/ref/time.html) supports
week/month constructions alongside existing catalog terminology.

These sources support individual components, not the full sentences. All
five additions are provisional and low confidence pending speaker review,
especially inclusive date ranges, negation and list-age explanations.
Klingon technical compounds and the explanation of quoted field names also
need review. Older mixed-language values elsewhere remain unresolved.

Feature checks preserve numbers, exact placeholder inventories and query
examples, and distinguish past/future periods and the two negative rules.
The feature, all-locale structure and human-preference checks pass. The
browser mutation scenario includes these five locales and passes syntax
checking; no browser run was available in this environment.

## Aymara and Quechua archiving/date filters — 2026-10-07

Filled 23 English placeholders each in Aymara (`ay`) and Quechua (`qu`).
A comparison against the previous commit confirms that the 46 feature
changes replace only English placeholders. Also corrected four basic labels:
Aymara week/month contained English prefixed with the language name, while
Quechua day/month labels contained the unrelated “Kay willaymi” prefix.
The labels now read `Simana` / `Phaxsi` and `P'unchawkuna` / `Killa`.
The standard backlog falls by 40 to 51,855 values; six auto-archive values
are tracked separately in the pending-Transifex queue.

The [Peruvian education Aymara vocabulary](https://cdn.www.gob.pe/uploads/document/file/4973488/item_55_vocabulario_aymara.pdf?v=1692022988)
supports `simana`, `phaxsi` and `urasa`; the
[University of Texas Quechua lesson](https://quechuatinkuy.coerll.utexas.edu/es/yachana-6/)
provides day/month and past-day usage. These are component references,
not validation of the full messages. The longer explanations remain low
confidence, particularly Aymara list terminology, inclusive bounds and
list-age negation. Technical loans are retained where appropriate. Broader
wrong-language and prefixed-filler findings in these catalogs remain open.

The shared feature suite now covers 55 locales, including exact tokens,
numbers and query examples, separate date endpoints, and the rules that
templates are never archived and edits do not restart list age. Locale-wide
structure, human-preference, both language progress suites and their shared
list-width suite pass. The existing browser mutation scenario includes both
languages and passes syntax checking; it was not browser-executed.

## Akan and Luganda archiving/date filters — 2026-10-07

Filled 23 English placeholders each in Akan (`ak`) and Luganda (`lg`).
Comparison against the previous commit confirms that all 46 feature edits
replace English placeholders. Corrected two unrelated Akan labels as well:
`days` now reads `Nna`, and `list` reads `Din a wɔahyehyɛ` rather than an
example/template term. The standard backlog falls by 40 to 51,815 values;
six auto-archive values belong to the separately tracked pending keys.

[Harvard's Akan days and months lesson](https://elias.fas.harvard.edu/languages/twi/Beginning/7/NAMES-DAYS-AND-MONTHS)
supports day/month/week vocabulary and distinguishes examples (`Nhwɛsoɔ`);
its [time-telling lesson](https://elias.fas.harvard.edu/languages/twi/beginning/9/time-telling)
supports hour vocabulary. The [Luganda phrasebook](https://learn-luganda.com/wp-content/uploads/2019/07/luganda_phrasebook_2017.pdf)
supports day/hour terms, alongside the existing catalog's week/month words.
These references support components, not the complete translations. Both
sets remain provisional and low confidence pending speaker review, especially
inclusive bounds, the quoted-field explanation and list-age wording.

Feature checks now cover 57 locales, preserving exact placeholders, numbers
and query examples and checking the two negative rules. All-locale structure,
human-preference and language progress checks pass. The existing browser
mutation scenario includes both languages; syntax checking passes, but no
browser execution was available. Older unrelated or mixed-language values
elsewhere in the catalogs still require the broader audit.

## Acehnese and Bambara archiving/date filters — 2026-10-07

Filled 23 English placeholders each in Acehnese (`ace`) and Bambara (`bm`).
The comparison against the previous commit confirms 46 English-placeholder
replacements. Also corrected the Acehnese `days` label from Indonesian
`hari` to `uroe`. The standard backlog falls by 40 to 51,775 values; six
auto-archive values belong to the separately tracked pending keys.

The [Kamus Basa Acèh dictionary](https://core.ac.uk/download/pdf/160609809.pdf)
supports day/month vocabulary. [Peace Corps Bambara lessons](https://files.peacecorps.gov/uploads/wws/lesson-plans/files/ML_Bambara_Language_Lessons.pdf)
support day/week/month terms, alongside the existing catalog's vocabulary.
These references support components rather than full sentences. Both sets
remain provisional and low confidence, especially relative elapsed time,
inclusive bounds and quoted field names. Older Malay/Indonesian-seeded
Acehnese labels elsewhere still need review; they are not validated by
these new feature translations.

The shared feature suite now checks 59 locales for exact tokens, numbers,
query examples and the two negative rules. All-locale structure,
human-preference and the relevant language suites pass. Both languages
are included in the existing browser mutation scenario; it is syntax-checked,
not browser-executed in this environment.

## Sakha archiving/date filters — 2026-10-07

Filled 23 English placeholders in Sakha (`sah`). Comparison against the
previous commit confirms that existing translated values are unchanged.
The standard backlog falls by 20 to 51,755 values; the three auto-archive
values belong to separately tracked pending keys.

[Unicode CLDR Sakha date fields](https://unicode.org/cldr/charts/44/summary/sah.html)
support past-time and week vocabulary. The
[Sakha-English dictionary](https://www.lexicons.ru/modern/ja/sakha/_pdf/sakha-english.pdf)
and existing catalog support the time-unit terms. These are component
references, not validation of complete software messages. Longer phrases
remain low confidence pending speaker review, particularly inclusive bounds,
list-age explanations and the instruction to quote a custom field name.

The feature suite now covers 60 locales and checks exact placeholder
inventories, numeric bounds and query examples. Sakha regressions distinguish
past-week from next-month wording and retain the rules that templates are
never archived and edits do not restart list age. Feature, all-locale
structure and human-preference checks pass. The browser mutation scenario
includes Sakha; syntax checking passes, but it was not browser-executed.

## Volapük archiving/date filters — 2026-10-07

Filled 23 English placeholders in Volapük (`vo`), verified against the
previous commit. Also corrected date/week/month labels to `Dät`, `Vig` and
`Mul`; the old labels used `Dato` and adverb forms. The standard backlog
falls by 20 to 51,735 values; three auto-archive values are tracked separately
among pending keys.

The [English–Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary)
supports `dät`, `vagik`, `nükömön`, `rot` and `logädik`; the
[time vocabulary reference](https://omniglot.com/language/time/volapuk.htm)
supports hour/day/week/month terms. Dictionary review corrected initial
draft terms before commit. The complete software phrases remain low
confidence pending review, especially inclusive ranges, the list-age
explanation and compounds for quoting custom field names. These references
support vocabulary components rather than sentence-level fluency.

The shared feature suite now checks 61 locales. Exact tokens, numeric
bounds, query examples and negative rules are covered; date/week/month
repairs have regression assertions. Feature, all-locale structure,
human-preference and related language suites pass. Volapük is included in
the browser mutation scenario, which passes syntax checking but was not
browser-executed in this environment.

## Nahuatl archiving/date filters — 2026-10-07

Filled 23 English placeholders in Nahuatl (`nah`). Comparison against the
previous commit confirms existing translated values are preserved. The
standard backlog falls by 20 to 51,715 values; three auto-archive values
belong to separately tracked pending keys.

The [Nahuatl Dictionary day entry](https://nahuatl.wired-humanities.org/content/tonalli)
and [time entry](https://nahuatl.wired-humanities.org/content/cahuitl) support
component vocabulary. Existing card, list, template and archive terminology
is retained for this batch. Longer messages remain low confidence, especially
inclusive ranges, elapsed list age and the quoted custom-field explanation.
Hour and quotation-mark terms use Spanish loans. The generic locale does
not select a regional standard; morphology, dialect consistency and these
technical compounds require speaker review. Component references do not
establish fluent complete sentences.

The shared feature suite now covers 62 locales, preserving placeholder
inventories, numbers and query examples. Nahuatl checks distinguish the
previous week from the next month and retain the rules that templates are
never archived and edits do not reset list age. Feature, all-locale structure,
human-preference and the related list-width suite pass. The browser mutation
scenario includes Nahuatl and passes syntax checking only; it was not
browser-executed in this environment.

## Greenlandic archiving/date filters — 2026-10-07

Filled 23 English placeholders in Greenlandic (`kl`). Comparison against
the previous commit confirms existing translated values are unchanged.
The standard backlog falls by 20 to 51,695 values; three auto-archive values
belong to separately tracked pending keys.

The [education authority's examination guidance](https://iserasuaat.gl/-/media/iserasuaat/majoriaq/undervisning/boglig-opkvalificering/fa/procedure-sommerprver-2025-grnlandsk.pdf)
provides day/week/hour usage. The [month dictionary entry](https://en.wiktionary.org/wiki/qaammat)
and existing catalog provide month terminology. References support vocabulary
components, not full software messages. Wording remains low confidence
pending speaker review, especially inclusive bounds, elapsed list age,
inflection of technical terms and the quoted-field explanation.

The shared feature suite covers 63 locales, including exact placeholders,
numeric bounds and query examples. Greenlandic assertions distinguish past
week from next month and preserve the rules that templates are never
archived and edits do not restart list age. Feature, all-locale structure,
human-preference and Greenlandic progress/calendar checks pass. The existing
browser mutation scenario includes Greenlandic and is syntax-checked only;
no browser execution was available in this environment.

## Dzongkha archiving/date filters — 2026-10-07

Filled 23 English placeholders in Dzongkha (`dz`). Comparison against the
previous commit confirms that existing translated values are unchanged.
The standard backlog falls by 20 to 51,675 values; three auto-archive values
belong to separately tracked pending keys.

The [Bhutan technology agency's time phrasebook](https://dnlp.tech.gov.bt/phrasebook/time)
provides month/hour vocabulary. [The Grammar of Dzongkha](https://escholarship.org/content/qt1h4211k0/qt1h4211k0_noSplash_b3843a79888f78f39713ded5f61ad772.pdf?t=s10u2j)
attests the hour term; existing catalog terminology supplies card/list/template
labels. The messages use Dzongkha constructions rather than copying the
Tibetan catalog. References support components, not full software sentences.
Longer explanations remain low confidence pending speaker review, especially
inclusive bounds, list age and quoting custom field names.

The shared feature suite now covers 64 locales, checking exact placeholders,
numbers and query examples. Dzongkha assertions distinguish past-week from
next-month wording, preserve the negative rules and reject copying the
Tibetan auto-archive hint. Feature, all-locale structure, human-preference
and the Dzongkha progress suite pass. The browser mutation scenario includes
Dzongkha and passes syntax checking only; it was not browser-executed.

## Tigre archiving/date filters — 2026-10-07

Filled 23 English placeholders in Tigre (`tig`). Comparison against the
previous commit confirms existing translated values are unchanged. The
standard backlog falls by 20 to 51,655 values; three auto-archive values
belong to separately tracked pending keys.

The [Tigre language overview](https://en.wikipedia.org/wiki/Tigre_language)
provides hour/plural morphology; the
[Tigre day entry](https://en.wiktionary.org/wiki/%E1%8B%AE%E1%88%9D)
and existing catalog provide day/month terminology. The scholarly Tigre
abstract in [Studien zum Horn von Afrika](https://www.speaktigre.com/_files/ugd/7e068a_b8160a06029949149ec728daaac5b9b4.pdf?index=true)
provides native-script date usage. These references support components,
not complete software sentences. Longer wording remains low confidence,
especially agreement, inclusive date bounds, list-age negation and the
quoted-field explanation. Tigre/Tigrinya distinction needs vocabulary and
grammar review, not merely a script or unequal-string check.

The feature suite now covers 65 locales and preserves exact placeholders,
numbers and query examples. New checks retain the two negative rules,
distinguish past/future periods and reject copying the Tigrinya hint.
Feature, all-locale structure, human-preference and the existing Tigre
progress/date suites pass. The browser mutation scenario includes Tigre
and is syntax-checked only; no browser execution was available.

## Standard Moroccan Tamazight archiving/date filters — 2026-10-07

Filled 23 English placeholders in Standard Moroccan Tamazight (`zgh`).
Comparison against the previous commit confirms existing translations are
preserved. New prose is in Tifinagh; literal field identifiers and query
examples remain in their source form. The standard backlog falls by 20 to
51,635 values; three auto-archive values belong to pending keys.

The [University of Barcelona conversation glossary](https://www.ub.edu/guia-conversa/amazic/ARXIUS/amazight/capitol139_15.pdf)
supports hour/day/month words. The [Peace Corps Tamazight textbook](https://www.livelingua.com/peace-corps/Tamazight/Tamazight%20Textbook%202007.pdf)
provides elapsed-time usage. Existing catalog terms supply card, list and
template vocabulary. Authored Amazigh prose was locally transliterated into
Tifinagh, protecting query syntax; no translation service was used.
References support components, not full sentences. Wording remains low
confidence pending review, especially regional forms, inclusive bounds,
list age and quoting custom field names.

The shared feature suite covers 66 locales, preserving exact placeholders,
numbers and query examples. New checks retain the negative rules and require
Tifinagh prose after excluding literal code. Feature, all-locale structure,
human-preference and the related list-width suite pass. The browser mutation
scenario includes Tamazight and is syntax-checked only; no browser execution
was available. Script checks do not establish fluency or dialect suitability.

## Wolaytta archiving/date filters — 2026-10-07

Filled 23 English placeholders in Wolaytta (`wal`). Comparison against the
previous commit confirms those feature changes replace only placeholders.
Also replaced three English-prefixed labels: day/week/month now use
`Gallassata`, `Saaminttaa` and `Aginaa`. The standard backlog falls by 20 to
51,615 values; three auto-archive values belong to pending keys. Prefixed
English labels were not included in the standard placeholder count.

The [Wolayttattuwa phrasebook](https://en.wikivoyage.org/wiki/Wolayttattuwa_phrasebook)
provides day/hour/week/month and past/future terms; the
[Wolayttatto school scope and sequence](https://pdf.usaid.gov/pdf_docs/PA00MQWZ.pdf)
uses week/day vocabulary. Existing catalog terms provide card/list/archive
labels. These references support components, not complete software sentences.
Longer wording remains low confidence pending speaker review, especially
negation, inclusive bounds, list age and quoted custom-field names.

The feature suite now covers 67 locales and checks exact tokens, numbers
and query examples. Wolaytta assertions retain the negative rules, distinguish
past-week from next-month wording and protect the repaired basic labels.
Feature, all-locale structure, human-preference and the related Wolaytta
progress/list-width checks pass. The browser mutation scenario includes
Wolaytta and is syntax-checked only; it was not browser-executed.

## Inuktitut archiving/date filters — 2026-10-07

Filled 23 English placeholders in Inuktitut (`iu`). Comparison against the
previous commit confirms that existing translated values are unchanged.
The standard backlog falls by 20 to 51,595 values; three auto-archive values
belong to separately tracked pending keys.

The [Inuktut Tusaalanga glossary](https://tusaalanga.ca/glossary?l=I)
provides hour vocabulary; the [Nunavut mathematics resource](https://nunavuteducators.com/lang_downloads/Complete-NunavutMath-Gr1.pdf)
provides syllabic week/elapsed-time usage. Existing catalog terminology
supplies card/list/template labels. These references support components,
not complete software sentences. Longer messages remain low confidence
pending speaker review, especially technical noun choices, inclusive ranges,
list-age negation and quotation-mark instructions.

The shared feature suite covers 68 locales and preserves exact tokens,
numbers and query examples. New checks require syllabic prose after
excluding literal code and distinguish past/future periods and the two
negative rules. Feature, all-locale structure, human-preference and the
related Inuktitut progress/list-width checks pass. The browser mutation
scenario includes Inuktitut and is syntax-checked only; no browser execution
was available. Script checks do not establish language quality.

## Cherokee and all-locale archiving/date-filter coverage — 2026-10-07

Filled 23 English placeholders in Cherokee (`chr`), preserving existing
translated values as verified against the previous commit. The standard
backlog falls by 20 to 51,575 values. A full scan now finds no English
placeholders in this 23-message feature group across all 234 non-English
locale paths. The three auto-archive keys leave the pending queue, which
now contains 201 source keys. This proves coverage, not fluent wording.

The [Raven Rock dictionary](https://culturev.com/cherokee/Raven-Rock-Cherokee-Dictionary.pdf)
supports week vocabulary and the correction of the draft empty-field term;
[Cherokee Nation classroom resources](https://www.cherokee.gov/departments/language-department/posters/classroom/)
provide calendar references. Existing card/list/template vocabulary is
retained. Complete phrases remain low confidence pending speaker review,
especially verbal morphology, inclusive ranges, list-age negation and the
instruction to quote a custom field name. Dictionary components do not
validate sentence-level meaning.

The shared feature test now discovers every non-English locale instead of
using the 69-locale batch list. It checks exact token inventories and query
examples, nonempty translated values, distinct date endpoints and periods,
and equivalent numeric bounds. Persian, Devanagari and Bengali decimal
digits normalize only for the bound comparison; query syntax stays exact.
It also verifies that completed auto-archive keys leave the pending queue.
Cherokee assertions require syllabic prose and retain the negative rules.
Feature, all-locale structure, human-preference and related Cherokee checks
pass. The browser mutation scenario includes Cherokee and is syntax-checked
only; no browser execution was available. The wider language-quality and
remaining-feature audit is still open.

## Activity-notification preferences — 2026-10-07

Filled 13 English placeholders each in Turkmen (`tk_TM`), Tatar (`tt`) and
Somali (`so`): 39 values covering notification categories and the explanation
of muting. Comparison against the previous commit confirms all changes
replace English placeholders and preserve existing translations. All 13
source keys remain pending in other locales, so the standard backlog stays
at 51,575 values and the pending queue still contains 201 source keys.

The wording distinguishes board members from assigned people, unchecking a
category from enabling it, and ordinary activity from due-date reminders and
@mentions that always arrive. Turkmen uses a descriptive horizontal-lane term;
the older mixed-language generic swimlane label is not copied into this text.
Existing catalogs provide the other card/list/attachment terminology.

The new shared feature test checks exact placeholder inventories, source
order, nonempty translations, the mention marker and the muting exception.
Feature, all-locale structure and human-preference checks pass. The existing
browser mute/unmute scenario now runs per language and checks all 13 visible
strings before testing notification delivery. It passes syntax checking but
was not browser-executed in this environment. Structural checks do not prove
fluency; technical terminology can still benefit from speaker review.

## Further activity-notification preferences — 2026-10-07

Filled 13 English placeholders each in Kurmanji (`ku`), Sorani (`ckb`),
Papiamento (`pap`), Tok Pisin (`tpi`) and Bislama (`bi`): 65 values.
Comparison against the previous commit confirms these replace only English
placeholders. All keys belong to the separately tracked pending group,
so the standard backlog remains 51,575 values with 201 pending source keys.

Existing catalogs supply card/list/member/attachment terminology. Each
language distinguishes members from assignees and says that unchecking a
category stops its bell/email notifications while due-date reminders and
@mentions continue. Technical terms, especially custom-field values and
swimlanes, can benefit from speaker review.

The shared notification translation suite covers eight locales. Exact token
inventories, source order, distinct people categories, the mention marker
and the muting exception pass, as do all-locale structure and human-preference
checks. The existing mute/unmute browser scenario includes all five new
languages and checks the heading, explanation and eleven category labels.
It passes syntax checking but was not browser-executed in this environment.

## Polynesian and southern African notification preferences — 2026-10-07

Filled 13 English placeholders each in Māori (`mi`), Samoan (`sm`), Hawaiian
(`haw`), Zulu (`zu`, `zu-ZA`), Xhosa (`xh`), Sesotho (`st`) and Setswana (`tn`):
104 values in eight catalogs. Comparison against the previous commit confirms
all replacements were English placeholders. The keys remain pending in other
languages, so the standard backlog stays at 51,575 values with 201 pending
source keys.

Catalog terminology supplies card/list/member/attachment terms. The messages
separate members from assigned workers and preserve both parts of the control:
unchecking a category stops its bell/email notices, while deadline reminders
and @mentions still arrive. Xhosa uses a lane term rather than copying the
older generic label meaning swimming. Technical expressions for custom-field
values, archiving and lanes remain open to speaker review, particularly in
the Polynesian drafts.

The shared notification suite now covers 16 locales. Exact tokens, source
order, distinct people categories, mention markers and the muting exception
pass, together with all-locale structure and human-preference checks. The
existing browser mute/unmute scenario checks all 13 strings for each added
locale. It is syntax-checked only; no browser execution was available.

## Kinyarwanda, Kirundi and Chichewa notification preferences — 2026-10-07

Filled 13 English placeholders each in Kinyarwanda (`rw`), Kirundi (`rn`)
and Chichewa (`ny`): 39 values. Comparison against the previous commit
confirms all edits replace English placeholders. The keys remain pending
elsewhere; the standard backlog stays at 51,575 values with 201 pending
source keys.

Existing catalog terms supply card/list/member/attachment vocabulary.
The messages distinguish members from assigned workers, and explain that
unchecking a category stops its bell/email notices while deadline reminders
and @mentions continue. Custom-field and lane terminology remains open to
speaker review; related languages retain their own wording.

The shared notification suite now covers 19 locales. Exact tokens, source
order, distinct people categories, mention markers and muting exceptions
pass, together with all-locale structure and human-preference checks. The
browser mute/unmute scenario includes all three locales and checks all 13
strings. It passes syntax checking only; no browser execution was available.

## Bhojpuri, Maithili and Odia notification preferences — 2026-10-07

Filled 13 English placeholders each in Bhojpuri (`bho`), Maithili (`mai`)
and Odia (`or_IN`): 39 values. Comparison against the previous commit
confirms existing translated values are preserved. These keys remain pending
elsewhere, so the standard backlog stays at 51,575 values with 201 pending
source keys.

The wording distinguishes members from assigned workers and preserves the
exception that deadline reminders and @mentions continue after a category
is unchecked. Related languages retain their own grammar. Odia uses a row
term for swimlanes rather than the older generic swimming label, and does
not copy stray punctuation from old card/list labels. Those older entries
remain part of the broader audit. Technical field/lane terminology can
benefit from speaker review.

The shared notification suite now covers 22 locales. Exact tokens, source
order, people-category distinctions, mention markers and muting exceptions
pass, together with all-locale structure and human-preference checks. The
browser mute/unmute scenario checks the 13 strings in each new locale. It
passes syntax checking only; no browser execution was available.

## Konkani and Moroccan Arabic notification preferences — 2026-10-07

Filled 13 English placeholders each in Konkani (`kok`) and Moroccan Arabic
(`ary`): 26 values. Comparison against the previous commit confirms existing
translations are unchanged. The keys remain pending in other languages,
so the standard backlog stays at 51,575 values with 201 pending source keys.

The messages distinguish members from assigned workers and explain that
unchecking an activity category stops its bell/email notices while deadline
reminders and @mentions continue. Existing catalog vocabulary supplies
card/list/attachment terms; Moroccan Arabic prose uses Darija constructions.
Technical field/lane terminology and Konkani inflection remain open to
speaker review.

The shared notification suite now covers 24 locales. Exact tokens, source
order, people-category distinctions, mention markers and muting exceptions
pass, together with all-locale structure and human-preference checks. The
browser mute/unmute scenario checks all 13 strings for both new locales.
It passes syntax checking only; no browser execution was available.

## Yiddish, Northern Ndebele and Swati notification preferences — 2026-10-07

Filled 13 English placeholders each in Yiddish (`yi`), Northern Ndebele
(`nd`) and Swati (`ss`): 39 values. Comparison against the previous commit
confirms existing translations are unchanged. The keys remain pending in
other languages; the standard backlog stays at 51,575 values with 201
pending source keys.

The wording distinguishes members from assigned workers and preserves the
reminder/@mention exception after an activity category is unchecked. Card,
list and attachment terms follow existing catalogs. Swati uses a lane term
rather than copying the older unrelated generic label. Archive and custom-
field wording, particularly in Northern Ndebele and Swati, remains provisional
pending speaker review. Existing mixed-language labels outside this batch
remain part of the wider audit.

Shared notification coverage now includes 27 locales. Exact tokens, source
order, distinct people categories, mention markers and muting exceptions
pass, together with all-locale structure and human-preference checks. The
browser mute/unmute scenario checks all 13 strings for the new locales and
passes syntax checking only; it was not browser-executed.

## Northern Sotho and Tsonga notification preferences — 2026-10-07

Filled 13 English placeholders each in Northern Sotho (`nso`) and Tsonga
(`ts`): 26 values. Comparison against the previous commit confirms existing
translations are unchanged. The keys remain pending in other languages,
so the standard backlog stays at 51,575 values with 201 pending source keys.

The messages distinguish members from assigned workers and preserve the
reminder/@mention exception after an activity category is unchecked. Existing
catalog vocabulary supplies card/list/attachment terms. Custom-field values,
archive actions and lane terminology remain provisional pending speaker
review; structural checks do not establish fluent technical wording.

Shared notification coverage now includes 29 locales. Exact tokens, source
order, people-category distinctions, mention markers and muting exceptions
pass, together with all-locale structure and human-preference checks. The
browser mute/unmute scenario checks all 13 strings in both new locales.
It passes syntax checking only; no browser execution was available.

## Oromo, Fijian and Tongan notification preferences — 2026-10-07

Filled 13 English placeholders each in Oromo (`om`), Fijian (`fj`) and
Tongan (`to`): 39 values. Comparison against the previous commit confirms
existing translations are unchanged. The keys remain pending in other
languages; the standard backlog stays at 51,575 values with 201 pending
source keys.

The messages distinguish members from assigned workers and preserve the
reminder/@mention exception after unchecking an activity category. Existing
catalog vocabulary supplies card/list/attachment terms. Longer instructions,
custom-field values and lane terminology remain provisional pending speaker
review, particularly the Fijian and Tongan technical expressions.

Shared notification coverage now includes 32 locales. Exact tokens, source
order, people-category distinctions, mention markers and muting exceptions
pass, together with all-locale structure and human-preference checks. The
browser mute/unmute scenario checks all 13 strings for the new locales.
It passes syntax checking only; no browser execution was available.

## Manx, Walloon and Waray-Waray notification preferences — 2026-10-07

Filled 13 English placeholders each in Manx (`gv`), Walloon (`wa`) and
Waray-Waray (`wa-RR`): 39 values. The language registry explicitly names
`wa-RR` Wáray-Wáray; it is not a regional Walloon translation. Existing
translated values are preserved. These keys remain pending elsewhere;
the standard backlog remains 51,575 values and 201 pending source keys.

Manx notice, reminder and mention vocabulary was checked against the
[Manx dictionary](https://archive.gaelg.im/www.gaelg.iofm.net/DICTIONARY/dict2/dictionary2e.html).
Walloon wording follows the existing catalog and the
[Walloon dictionary's usage](https://dtw.walon.org/index.php).
The [Waray phrasebook](https://en.wikivoyage.org/wiki/Waray_phrasebook)
provides additional language context. These are direct translations, not
output from a translation service. Complete technical clauses, lane and
custom-field terminology remain low confidence pending speaker review.

Shared notification coverage now includes 35 locales, checking source order,
exact placeholders, distinct people categories and the reminder/mention
exception to muting. The all-locale structural and human-preference checks
also pass. The browser mute/unmute scenario includes these three languages;
it is syntax-checked only, with no browser execution available.

## Akan, Luganda and Bambara notification preferences — 2026-10-07

Filled 13 English placeholders each in Akan (`ak`), Luganda (`lg`) and
Bambara (`bm`): 39 values. Existing translations are preserved. These keys
remain pending elsewhere, so the standard backlog stays at 51,575 values
with 201 pending source keys.

The descriptions retain the reminder/@mention exception and distinguish
members from people assigned work. Vocabulary references include the
[Akan dictionary](https://www.akandictionary.com/2021/06/17/nkae-2/),
the [Luganda learning resource](https://lugandalusogalugwerecommission.com/onewebmedia/OKUYIGA_2BOLUGANDA_2B_2B_2B_2BERI_2BABOOGEZI_2BBOLUNGEREZA_2BNOLUSWAYIRI.pdf)
for bell terminology and the
[Bambara lexicon](https://bamadaba.coastsystems.net/lexicon/h/)
for reminder vocabulary. Translations are written directly, without a
translation service. Technical clauses, lane and custom-field wording
remain low confidence pending speaker review.

Shared notification checks now cover 38 locales. Exact placeholders, source
key order, distinct people categories and the muting exception pass, as do
all-locale structure and human-preference checks. Browser mute/unmute
scenarios now include these three locales and pass syntax checking only;
no browser execution was available.

## Wolof and Ewe notification preferences — 2026-10-07

Filled 13 English placeholders each in Wolof (`wo`) and Ewe (`ee`): 26
values. Existing translations are preserved. These keys remain pending
elsewhere, so the standard backlog stays at 51,575 values with 201 pending
source keys.

The descriptions retain the due-date reminder/@mention exception and
separate members from people assigned work. Wolof vocabulary was checked
against [Janga Wolof's dictionary](https://jangawolof.org/dictionary-wolof-to-english/)
and the [Peace Corps manual](https://fsi-languages.yojik.eu/languages/PeaceCorps/Wolof/ED226616.pdf).
The bell term `jóolóoli` follows the
[Wolof word list](https://wolofresources.org/language/download/lexicarry_plus.pdf).
Ewe notification wording uses the nyanya vocabulary also seen in
[the Ewe parent letters](https://www.txel.org/media/wmqlbyvt/47-ewe-complete.pdf).
These are direct translations without a translation service. Full technical
clauses, custom fields and lane terminology remain low confidence pending
speaker review; dictionary matches do not establish sentence-level fluency.

Shared notification checks now cover 40 locales. Exact placeholders, source
order, distinct people categories and the muting exception pass, together
with all-locale structure and human-preference checks. Browser mute/unmute
scenarios include both locales and pass syntax checking only; no browser
execution was available.

## Aromanian notification preferences — 2026-10-07

Filled 13 English placeholders in Aromanian (`rup`), preserving existing
translations. These keys remain pending elsewhere; the standard backlog
stays at 51,575 values with 201 pending source keys.

Vocabulary references include Vrabie's
[English–Aromanian dictionary](https://vivliuteca.org/wp-content/uploads/2025/06/an-english-aromanian-macedo-romanian-dictionary-society-farsharotu.pdf)
for notice and removal vocabulary and the
[entry for totãna](https://en.wiktionary.org/wiki/tot%C3%A3na)
for the unconditional reminder/mention clause. The bell term follows the
[Aromanian derivative of campana](https://wiki.rus.family/content/wiktionary_en_all_nopic_2025-07/campana).
These are direct translations without a translation service. Complete
technical clauses, inflection and lane/custom-field terms remain low
confidence pending speaker review. Existing wrong-language values outside
this group remain part of the broader review.

Shared notification checks now cover 41 locales. Exact placeholders, source
order, distinct people categories and the muting exception pass, together
with all-locale structure and human-preference checks. The Aromanian browser
mute/unmute scenario passes syntax checking only; no browser execution was
available.

## Buryat, Sakha and Chuvash notification preferences — 2026-10-07

Filled 13 English placeholders each in Buryat (`bua`), Sakha (`sah`) and
Chuvash (`cv`): 39 values. Existing translations are preserved. These keys
remain pending elsewhere; the standard backlog stays at 51,575 values with
201 pending source keys.

The messages retain the due-date reminder/@mention exception and distinct
member and assignee categories. References include the
[Sakha–English dictionary](https://www.lexicons.ru/modern/ja/sakha/_pdf/sakha-english.pdf)
for notice vocabulary, the
[Chuvash dictionary discussion](https://chuvash.org/news/30586.html)
for reminder usage, and the
[Buryat phrasebook](https://folkways.today/talking-buryat-phrasebook/)
for language context. Existing locale vocabulary supplies UI category names.
These are direct translations without a translation service. Technical
clauses, inflection, custom fields and lane terminology remain low confidence
pending speaker review; Cyrillic checks alone do not distinguish languages.

Shared notification checks now cover 44 locales. Exact placeholders, source
order, distinct people categories, Cyrillic prose and the muting exception
pass, together with all-locale structure and human-preference checks.
Browser mute/unmute scenarios include these three locales and pass syntax
checking only; no browser execution was available.

## Venda and Venetian notification preferences — 2026-10-07

Filled 13 English placeholders each in Venda (`ve`) and Venetian (`ve-CC`):
26 values. The registry identifies `ve-PP` as Veps; these locale tags must
not be treated as regional Venda variants. Also corrected six wrong-language
Venda labels: list, lane, members, assignees, attachments and checklists.
The Zulu/Afrikaans seeds were replaced directly; existing correct-language
values were preserved. The standard backlog remains 51,575 values and 201
pending source keys because the notification keys are pending and the six
repairs were not English placeholders.

Vocabulary references include the
[English–Tshivenda dictionary](https://www.scribd.com/document/781724274/67089703335-1)
for reminder vocabulary and the
[Venetian dictionary](https://www.vatrarberesh.it/biblioteca/ebooks/linguaveneta.pdf)
for removal/addition terminology, with
[senpre](https://en.wiktionary.org/wiki/senpre) expressing the unconditional
reminder/mention exception. Translations were written directly without a
translation service. Full technical clauses and custom-field/lane terms
remain low confidence pending speaker review. Broader mixed-language Venda
content remains in the review queue.

Shared notification checks now cover 46 locales. Exact placeholders, source
order, distinct people categories and the muting exception pass, together
with all-locale structure and human-preference checks. Regression checks
reject the six former wrong-language labels. Browser mute/unmute scenarios
include both locales and pass syntax checking only; no browser execution
was available.

## Northern Sámi notification preferences — 2026-10-07

Filled 13 English placeholders in Northern Sámi (`se`), preserving existing
translations. These keys remain pending elsewhere; the standard backlog
stays at 51,575 values with 201 pending source keys.

The wording preserves the due-date reminder/@mention exception and distinct
member and assignee categories. Vocabulary references include
[álo](https://en.wiktionary.org/wiki/%C3%A1lo) for always,
[dieđáhus](https://fr.wiktionary.org/wiki/notification) for notification and
[Ájtte's bell record](https://www.kringla.nu/kringla/objekt?referens=ajtte%2Fobjekt%2F13655)
for biellu. Existing catalog terms supply category names. These are direct
translations without a translation service; complete technical clauses,
inflection and lane/custom-field expressions remain low confidence pending
speaker review.

Shared notification checks now cover 47 locales. Exact placeholders, source
order, distinct people categories and the muting exception pass, together
with all-locale structure and human-preference checks. The Northern Sámi
browser mute/unmute scenario passes syntax checking only; no browser
execution was available.

## Acehnese notification preferences — 2026-10-07

Filled 13 English placeholders in Acehnese (`ace`), preserving all existing
translated values. The keys remain pending elsewhere; the standard backlog
remains 51,575 values and 201 pending source keys.

Vocabulary was checked against the
[Acehnese–Indonesian–English thesaurus](https://dokumen.pub/kamus-basa-aceh-kamus-bahasa-aceh-acehneseindonesianenglish-thesaurus-0858835061.html),
including geunta for bell. These are direct translations without a translation
service. Technical compounds and the complete instruction remain low confidence
pending speaker review. Broader Malay/Indonesian-seeded values remain to review.

Shared notification checks now cover 48 locales. Exact tokens, source order,
people-category distinctions and the reminder/mention exception pass, together
with all-locale structure and human-preference checks. The browser mute/unmute
scenario includes Acehnese and is syntax-checked only; it was not executed.

## Tibetan notification preferences — 2026-10-07

Filled 13 English placeholders in Tibetan (`bo`), preserving existing
translations. These keys remain pending elsewhere; the standard backlog
remains 51,575 values and 201 pending source keys.

Existing catalog terms supply card/list/category vocabulary. Reminder
terminology was checked against the
[English–Tibetan dictionary](https://linguatools.info/?l=%E0%BD%91&lang=tib&page=11&per_page=10&prefix=1&st=1),
and notice vocabulary is also used by the
[Central Institute of Higher Tibetan Studies](https://cihts.ac.in/ti/admission-notification/).
These are direct translations without a translation service. Full technical
clauses, custom-field and lane terminology remain provisional pending speaker
review. Tibetan script alone does not establish translation quality.

Shared notification coverage now includes 49 locales. Exact tokens, source
order, distinct people categories and the reminder/mention exception pass,
together with all-locale structure and human-preference checks. The Tibetan
browser mute/unmute scenario is syntax-checked only; it was not executed.

## Dzongkha notification preferences — 2026-10-07

Filled 13 English placeholders in Dzongkha (`dz`), preserving existing
translations. These keys remain pending elsewhere; the standard backlog
remains 51,575 values and 201 pending source keys.

Existing catalog vocabulary supplies category names. Reminder terminology
follows the [English–Dzongkha dictionary](https://www.dzongkha.gov.bt/uploads/files/publications/Eng-Dzo_Dictionary_2023_3ead53caad0798894c3908a9aedceb84.pdf).
Dzongkha wording for always is also used in
[LibreOffice's Dzongkha documentation](https://help.libreoffice.org/latest/dz/text/shared/optionen/01010200.html).
These are direct translations without a translation service; complete
technical clauses and lane/custom-field terms remain low confidence pending
speaker review. Shared script with Tibetan is not proof of language quality.

Shared notification coverage now includes 50 locales. Exact tokens, source
order, distinct people categories and the reminder/mention exception pass,
together with all-locale structure and human-preference checks. The Dzongkha
browser mute/unmute scenario is syntax-checked only; it was not executed.

## Tigrinya notification preferences — 2026-10-07

Filled 13 English placeholders in Tigrinya (`ti`), preserving existing
translations. These keys remain pending elsewhere; the standard backlog
remains 51,575 values and 201 pending source keys.

Existing catalog terms supply card/list/category vocabulary. Notification
terminology was checked against the
[Tigrinya dictionary](https://www.tigrinyadictionary.com/index.php?dr=0&searchkey=notification).
Reminder vocabulary also appears in the
[Tigrinya reminder example](https://www.komen.org/wp-content/uploads/Breast-Self-Awareness-Messages-in-Tigrinya-FINAL-8-14.pdf).
These are direct translations without a translation service. Full technical
clauses and lane/custom-field terminology remain provisional pending speaker
review; script checks do not establish fluency.

Shared notification checks now cover 51 locales. Exact tokens, source order,
people-category distinctions and the reminder/mention exception pass,
together with all-locale structure and human-preference checks. The Tigrinya
browser mute/unmute scenario is syntax-checked only; it was not executed.

## Kashmiri notification preferences — 2026-10-07

Filled 13 English placeholders in Kashmiri (`ks`), preserving existing
translations. These keys remain pending elsewhere; the standard backlog
remains 51,575 values and 201 pending source keys.

Reminder vocabulary was checked against the
[Kashmiri administrative terminology](https://kashmirculturaltrust.in/op/Kashmiri%20Admn%20Terminology.pdf).
Existing card/list terms are retained, with Kashmiri clauses around them.
These are direct translations without a translation service. Full technical
clauses, inflections, diacritics and custom-field/lane terms remain low
confidence pending speaker review. Arabic-script checks do not distinguish
Kashmiri from Urdu; broader language review remains open.

Shared notification checks now cover 52 locales. Exact tokens, source order,
people-category distinctions and the reminder/mention exception pass,
together with all-locale structure and human-preference checks. The Kashmiri
browser mute/unmute scenario is syntax-checked only; it was not executed.

## Quechua and Aymara notification preferences — 2026-10-07

Filled 13 English placeholders each in Quechua (`qu`) and Aymara (`ay`):
26 values. Existing translations are preserved. These keys remain pending
elsewhere; the standard backlog remains 51,575 values and 201 pending
source keys.

Vocabulary references include
[Quechua Tinkuy](https://quechuatinkuy.coerll.utexas.edu/en/vocabulario/)
for informing/remembering and the
[Aymara educational vocabulary](https://cdn.www.gob.pe/uploads/document/file/4973488/item_55_vocabulario_aymara.pdf?v=1692022988)
for yatiyawi. Existing catalog terms supply card/list/category names.
These are direct translations without a translation service. Complete
technical clauses, dialect consistency and custom-field/lane terminology
remain low confidence pending speaker review.

Shared notification checks now cover 54 locales. Exact tokens, source order,
people-category distinctions and the reminder/mention exception pass,
together with all-locale structure and human-preference checks. Browser
mute/unmute scenarios include both locales and are syntax-checked only;
they were not executed.

## Guaraní notification preferences — 2026-10-07

Filled 13 English placeholders in Guaraní (`gn`), preserving existing
translations. These keys remain pending elsewhere; the standard backlog
remains 51,575 values and 201 pending source keys.

Reminder and notification vocabulary was checked against
[Guasch's dictionary](https://www.portalguarani.com/1688_antonio_guasch__/13583_diccionario_guarani__castellano_letra_m__por_antonio_guasch.html).
Existing card/list terms are retained. These are direct translations without
a translation service. Complete technical clauses, custom-field terminology
and existing list/lane terminology remain low confidence pending speaker
review; structural checks do not establish fluency.

Shared notification checks now cover 55 locales. Exact tokens, source order,
people-category distinctions and the reminder/mention exception pass,
together with all-locale structure and human-preference checks. The Guaraní
browser mute/unmute scenario is syntax-checked only; it was not executed.

## Fulfulde notification preferences — 2026-10-07

Filled 13 English placeholders in Fulfulde (`ff`), preserving existing
translations. These keys remain pending elsewhere; the standard backlog
remains 51,575 values and 201 pending source keys.

The catalog supplies notification, removal, restoration and category terms.
Reminder usage was checked against the
[Pulaar terminology excerpt](https://pt.scribd.com/document/960600363/Terminologia-Pulaar-fusao).
The [Fulfulde dictionary index](https://www.webonary.org/fulfuldeburkina/files/English-Fulfulde-Index.pdf)
was discoverable but returned HTTP 403 on retrieval; it was not treated as
verification of full phrases. These are direct translations without a
translation service. Technical wording, noun-class agreement, the borrowed
bell term and dialect consistency remain low confidence pending speaker review.

Shared notification checks now cover 56 locales. Exact tokens, source order,
people-category distinctions and the reminder/mention exception pass,
together with all-locale structure and human-preference checks. The Fulfulde
browser mute/unmute scenario is syntax-checked only; it was not executed.

## Volapük notification preferences — 2026-10-07

Filled 13 English placeholders in Volapük (`vo`) and replaced the Esperanto
member label Membroj with Limans. Other existing translations are preserved.
The keys remain pending elsewhere; the standard backlog remains 51,575
values and 201 pending source keys.

[Midgley's dictionary](https://paperzz.com/doc/7911017/pdf-format---volap%C3%BCk.com)
supplies liman (human member), klok (bell), memön (remember) and ai (always).
The reminder wording uses a causative derivation from remember. Existing
category terminology supplies the other labels. These are direct translations
without a translation service. Full clauses and technical compounds remain
low confidence pending speaker review; dictionary roots do not certify
modern software terminology. Broader wrong-language review remains open.

Shared notification checks now cover 57 locales. Exact tokens, source order,
people-category distinctions, the corrected member label and the reminder/
mention exception pass, together with all-locale structure and human-preference
checks. The Volapük browser mute/unmute scenario is syntax-checked only;
it was not executed.

## Klingon notification preferences — 2026-10-07

Filled the 13 `notification-activity-*` English placeholders in `tlh` and replaced
French `Intervenants` in `assignees` with `Qu' HevwI'pu'` (task recipients).
Existing card, member, checklist and attachment terminology is retained.
The description retains unselecting an activity, bell/email delivery and the
exception for due-date reminders and @mentions.

Vocabulary references: [Klingonska Akademien dictionary](https://klingonska.org/dict/),
[KLI bell vocabulary](https://lists.kli.org/archives/list/tlhingan-hol%40lists.kli.org/thread/JVRAGLKX6PVYEXQIPYOBSU6HX5NISRQR/)
and [KLI reminder usage](https://www.kli.org/tlhIngan-Hol/2006/May/msg00152.html).
These support vocabulary, not approval of the full UI translation. Task-recipient,
custom-field value and notification compounds and the complete description remain
low-confidence wording needing fluent-speaker review. Other wrong-language seed
values elsewhere in the locale still require auditing.

Shared notification regression and browser scenarios now cover 58 locales;
structural, token and human-preference checks pass. Browser coverage is only
syntax-checked because the application/browser stack is unavailable. These are
pending source keys, so the ordinary backlog remains 51,575 values in 70 languages
plus 201 separately tracked pending source keys. This does not complete the goal.

## Greenlandic notification preferences — 2026-10-07

Filled the 13 `notification-activity-*` placeholders in `kl`, using the locale's
existing card, list, lane, member, assignee, label and attachment terminology.
The description preserves the uncheck action, bell/email channels and continued
delivery of due-date reminders and @mentions. No existing translation was replaced.

References: [Greenlandic dictionary portal](https://ordbog.gl/) and
[Chicago/Oqaasileriffik dictionary](https://daka.gl/2018-kal-eng/) were consulted,
but their dynamic entry display did not expose the requested definitions in this
session. Bell vocabulary is supported by the bilingual
[Inatsisartut bell description](https://www.inatsisartut.gl/media/wevg0ao2/d-inatsisartut-website-inatsisartutgl-media-35028-rundvisning-i-inatsisartut-kl_da_en-a5-web-4.pdf).
Deadline terminology is attested in
[Inatsisartut consultation instructions](https://ina.gl/gl/allagaatit/nutaarsiassat/inatsisissatut-siunnersuut-inatsisartut-siulittaasoqarfiat-sinnerlugu-tusarniaatigineqarpoq/).
These sources support vocabulary rather than the complete translation. The full
description and technical compounds, especially custom-field values and swimlanes,
remain low-confidence and need fluent-speaker review.

Shared notification tests and registered browser scenarios now cover 59 locales.
Notification, all-locale structure/token and human-preference checks pass; browser
coverage is syntax-checked only because its application stack is unavailable.
These pending keys do not change the ordinary backlog of 51,575 values in 70
languages or the 201 separately tracked pending source keys. Work remains.

## Nahuatl notification preferences — 2026-10-07

Filled the 13 `notification-activity-*` English placeholders in `nah`, preserving
existing translations. The new values use the current locale's card, list, lane,
member, assignee, comment and attachment terminology. The description preserves
unchecking the activity, bell/email delivery and continued delivery of due-date
reminders and @mentions.

Vocabulary references include the University of Oregon dictionary's
[coyolli entry](https://nahuatl.wired-humanities.org/node/177283) for bell and
[ilnamiqui entry](https://nahuatl.wired-humanities.org/node/172227) for remembering;
[UNAM's Nahuatl narratives](https://revistas-filologicas.unam.mx/tlalocan/index.php/tl/article/download/182/182/183)
attest `nochipa` as always. The complete sentences and UI compounds are direct,
low-confidence translations, not quotations or dictionary-approved phrases.
In particular, the inherited custom-field, checklist and assignee terminology
needs fluent-speaker review; the locale mixes technical coinages and does not
identify a regional variety. This batch does not establish their linguistic quality.

Shared notification regression tests and registered browser scenarios now cover
60 locales. Notification, all-locale structure/token and human-preference checks
pass; the browser scenario is syntax-checked only because the application stack
is unavailable. These pending keys do not change the ordinary backlog of 51,575
values in 70 languages or the 201 pending source keys. The wider goal remains open.

## Veps notification preferences — 2026-10-07

Filled the 13 `notification-activity-*` English placeholders in `ve-PP` (Veps),
preserving existing translations and using the locale's established UI nouns.
The description retains unchecking a category, bell/email delivery and continued
arrival of due-date reminders and @mentions.

References: [ližata](https://en.wiktionary.org/wiki/li%C5%BEata) (add; passive
`ližatud`), [heitta](https://en.wiktionary.org/wiki/heitta) (remove; imperative
`heitä`, passive `heittud`), [tedotuz](https://en.wiktionary.org/wiki/tedotuz)
(notification/message), and [Veps correlatives](https://en.wiktionary.org/wiki/Appendix:Veps_correlatives)
(`kaiken`, always). The
[Veps–Hungarian dictionary](https://vepsze.hu/sites/default/files/vepsze-magyar_szotar.pdf),
printed page 122, gives `muštatada` for reminding; the description uses a derived
participle with notification. These references support words and forms, not the
full translation. The full description, custom-field and swimlane terminology
and inherited technical coinages remain low-confidence and require speaker review.

Shared notification regression and registered browser scenarios now cover 61
locales. Notification, all-locale structure/token and human-preference checks
pass. Browser coverage is syntax-checked only because its application stack is
unavailable. These pending keys do not change the ordinary backlog of 51,575
values in 70 languages or the 201 separately tracked pending source keys.

## Standard Moroccan Tamazight notification preferences — 2026-10-07

Filled the 13 `notification-activity-*` placeholders in `zgh` in Tifinagh.
Existing translations are preserved. The description retains the remove-mark
instruction, bell/email channels and the exception for reminders and @mentions.
Member and assignee categories stay separate.

Vocabulary reference: the
[Peace Corps Tamazight–English dictionary](https://www.livelingua.com/peace-corps/Tamazight/Tamazight-English-Dictionary-2007.pdf)
gives `abda` for always, `srsar` for bell, `sktiy` for remind and `kks` for remove.
These roots inform the direct wording; the source is a regional learner dictionary,
not validation of Standard Moroccan Tamazight UI terminology or full sentences.
Technical compounds, passive agreement and inherited checklist/attachment terms
remain low-confidence and need fluent-speaker review. The broader locale also
mixes Latin and Tifinagh spellings; this batch does not audit that whole inventory.

Shared notification regression and registered browser scenarios now cover 62
locales. Added Tifinagh/no-English checks for these 13 strings alongside exact
source-token checks. Notification, all-locale structure/token and human-preference
checks pass; browser coverage is syntax-checked only because its application
stack is unavailable. The ordinary backlog remains 51,575 values in 70 languages,
plus 201 pending source keys, because this feature is in the pending group.

## Inuktitut notification preferences — 2026-10-07

Filled 13 `notification-activity-*` English placeholders in `iu` using syllabics
and existing card, list, lane, member, assignee and attachment terminology.
Existing translations were not overwritten. The description retains unchecking,
bell/email delivery and the reminder/mention exception.

Terminology references: Government of Nunavut usage of
[reminder](https://www.gov.nu.ca/iu/pivalliajut/nunavuumi-imarmik-imiqtauvaktumik-ujjiqsuqujinirmut-iqkaitittijjuti-2026-05-25)
and [deadline](https://www.gov.nu.ca/iu/pivalliajut/tuksirautiliuqujijut-niqilirijunnattiarnirmit-kiinaujanik-2026-09-18).
These attest the relevant words, not the full UI translation. Bell terminology
was not independently verified from an authoritative language source in this
session. The full description, bell, custom-field values and inherited board
metaphors remain low-confidence and need fluent-speaker review. Script checks
cannot establish fluency or dialect consistency.

Shared notification regression and registered browser scenarios now cover 63
locales, including syllabic/no-English checks for these new values. Notification,
all-locale structure/token and human-preference checks pass; browser coverage is
syntax-checked only because its application stack is unavailable. These pending
keys leave the ordinary backlog at 51,575 values in 70 languages plus 201 pending
source keys. The wider task remains open.

## Wolaytta notification preferences — 2026-10-07

Filled 13 `notification-activity-*` English placeholders in `wal`, preserving
existing translations and using the locale's card, list, lane, member, assignee,
attachment and checklist terms. The description retains removal of the category
mark and continued delivery of reminders and @mentions.

Wording references include the Wolaytta corpus passages for
[remembering and informing](https://textgridrep.org/browse/49hp6.0),
[always](https://textgridrep.de/browse/49hp3.0) and
[reminding](https://www.bible.com/bible/3205/JOS.4.WOB).
These attest roots and usage, not approval of the technical translation. The bell
term was not independently verified in an authoritative dictionary in this session.
The full description, bell, custom-field values and inherited technical compounds
remain low-confidence and require fluent-speaker review. Existing noun choices
are not proven correct simply because this batch reuses them.

Shared notification tests and registered browser scenarios now cover 64 locales.
Notification, all-locale structure/token and human-preference checks pass; browser
coverage is syntax-checked only because its application stack is unavailable.
These pending keys do not change the ordinary backlog of 51,575 values in 70
languages or the 201 pending source keys. The broader task remains open.

## Tigre notification preferences — 2026-10-07

Filled the 13 `notification-activity-*` English placeholders in `tig` in Ethiopic
script. Existing translations are preserved. The draft separates members from
people assigned work and retains muting the activity while receiving reminders
and @mentions.

References: Omar M. Kekia's
[Dehai Tigre grammar](https://www.speaktigre.com/_files/ugd/7e068a_d791dde4087041feaf3dedb6b109829c.pdf?index=true)
provides `aw` for or and `dima` for always; Palmer's
[Relative Clauses in Tigre](https://www.tandfonline.com/doi/pdf/10.1080/00437956.1961.11659745)
identifies the relative marker `la`. Beurmann's
[vocabulary and grammar sketch](https://www.speaktigre.com/_files/ugd/7e068a_a5fbea1fb5e544e69d94cab002762da2.pdf?index=true)
was also inspected, but did not resolve modern UI compounds. These references
support limited vocabulary/grammar, not the complete translation. The full
batch, especially bell/reminder compounds, custom fields and passive inflection,
is low-confidence and needs fluent Tigre review. Existing checklist and custom
field labels show possible Tigrinya influence; a broader vocabulary audit remains
necessary. Ethiopic script alone cannot distinguish these languages.

Shared notification regression and registered browser scenarios now cover 65
locales. Notification, all-locale structure/token and human-preference checks
pass; browser coverage is syntax-checked only because its application stack is
unavailable. The ordinary backlog remains 51,575 values in 70 languages plus 201
pending source keys because this batch belongs to the pending group.

## Cherokee notification preferences — 2026-10-07

Filled 13 `notification-activity-*` English placeholders in `chr` using Cherokee
syllabics and the locale's existing UI terms. Existing translations are preserved.
The intended description covers removing the activity mark, bell/email delivery,
and the due-date reminder and @mention exception.

Vocabulary references: [bell entry](https://www.cherokeedictionary.net/share/73796)
and the indexed [Cherokee word list](https://language.cherokee.org/media/ykahxw4v/oudictionaryeuglutan.pdf)
for reminder/removal vocabulary. The latter's full PDF redirected to an inaccessible
URL; its search excerpts alone do not verify the whole phrase. This entire batch
is low-confidence, especially verb inflection, grammatical agreement, custom-field
values and the complete description. It needs fluent-speaker review; syllabic
spelling and dictionary roots do not establish grammatical sentences.

All 234 non-English locale files now contain non-English values for this group
of 13 keys. The feature test now checks all of them for nonempty values, English
placeholders and exact source tokens; detailed checks/browser registration cover
66 locales. This is structural completion of this group, not language-quality
approval. Notification, all-locale and human-preference checks pass; browser
coverage is syntax-checked only because the application stack is unavailable.
The ordinary backlog remains 51,575 values in 70 languages plus 201 pending source
keys; the pending manifest has not yet been reconciled for this group.

## Notification pending-key reconciliation — 2026-10-07

Removed all 13 `notification-activity-*` entries from the pending manifest after
checking all 234 non-English locale paths for nonempty values, absence of exact
English placeholders and source-token preservation. The feature regression test
now also prevents these keys from returning to the pending queue. Pending source
keys decrease from 201 to 188; the ordinary missing-value count remains 51,575.
Language-quality review remains explicitly open, including the provisional
minority-language batches above. This is queue reconciliation, not fluent review.

The next feature group is the six `due-reminder-*` strings. A fresh source scan
found all six still English in 66 locales (396 values). Its description must retain
comma separation, zero meaning the due day, positive offsets before it, negative
offsets after it, blank meaning server default, and the -14 to 14 / ten-day limit.

## Turkmen, Tatar and Somali due reminders — 2026-10-07

Filled six `due-reminder-*` English placeholders in each of `tk_TM`, `tt` and
`so` (18 values), preserving existing correct-language values. The text retains
comma-separated days, 0 as the due day, positive days before / negative days after,
blank as the server default, at most ten whole days and the -14 to 14 range.
Webhook forwarding remains a separate option. Existing notification terminology
was used as the local reference; no external translation service was used.

Added source-key/token and numeric/semantic checks, and extended the existing
board-reminder browser test to check labels plus saved/error feedback in all three
languages. Translation and human-preference checks pass; browser coverage is
syntax-checked only because the application stack is unavailable. The remaining
63 locales still need this six-key group. These pending keys leave the ordinary
backlog at 51,575 values in 70 languages plus 188 pending source keys.

## Kurdish, Sorani and Papiamento due reminders — 2026-10-07

Filled six `due-reminder-*` placeholders each in `ku`, `ckb` and `pap` (18 values),
using existing notification terminology and preserving prior translations.
Comma separation, zero as the due day, positive-before / negative-after offsets,
blank/server default, the ten-whole-day maximum and -14 to 14 range are retained.
The webhook option stays distinct from disabling reminders.

Extended the shared translation checks and existing board-reminder UI scenario
to all six newly covered locales. Numeric, token, source-order, semantic wording
and human-preference checks pass; browser coverage is syntax-checked only because
the application stack is unavailable. The remaining 60 locales need this six-key
group. These pending keys leave the ordinary backlog at 51,575 values in 70
languages plus 188 pending source keys. No external translation service was used.

## Tok Pisin and Bislama due reminders — 2026-10-07

Filled six reminder placeholders each in `tpi` and `bi` (12 values), reusing the
existing notification vocabulary. Positive and negative numbers are explained as
above and below zero, with before/after directions explicit. Commas, blank/server
fallback, whole-number days, ten-entry maximum and -14 to 14 limits are preserved.
All eight locales in the current reminder test pass structural/token and wording
checks; human-preference checks pass too. Existing browser scenarios now cover
these locales but are syntax-checked only. Fifty-eight locales still need this
group. Ordinary backlog and pending-key counts remain 51,575 and 188 respectively.

## Māori, Samoan and Hawaiian due reminders — 2026-10-07

Filled six `due-reminder-*` placeholders each in `mi`, `sm` and `haw` (18 values),
using existing notification terminology and preserving prior translations.
The description retains comma separation, zero as the due day, positive-before /
negative-after offsets and blank/server fallback. The maximum of ten whole-number
days and the -14 to 14 range remain explicit. Webhook is retained as a technical
term; the compounds for outgoing webhooks merit speaker review.

Shared translation checks and the existing board-reminder browser scenario now
cover 11 locales. Numeric, token, source-order, semantic wording and human-preference
checks pass; browser coverage is syntax-checked only because its application
stack is unavailable. Fifty-five locales still need this group. The ordinary
backlog remains 51,575 values plus 188 pending source keys. No external translation
service was used.

## Zulu, Xhosa, Sesotho and Setswana due reminders — 2026-10-07

Filled six `due-reminder-*` placeholders in `zu`, `zu-ZA`, `xh`, `st` and `tn`
(30 values), preserving existing translations. Both Zulu paths receive the same
new strings. The translations retain commas, zero as due day, above-zero/before
and below-zero/after offsets, blank/server fallback, whole days, ten-entry limit
and the signed -14 to 14 range. Webhook remains a technical term.

Shared translation checks and the existing board-reminder browser scenario now
cover 16 locales. Source-order/token, numeric-limit and wording checks pass, as
do human-preference checks. Browser scenarios are syntax-checked only because
the application stack is unavailable. Fifty locale paths still need this group.
The ordinary backlog remains 51,575 values plus 188 pending source keys.

## Kinyarwanda, Kirundi and Chichewa due reminders — 2026-10-07

Filled six `due-reminder-*` placeholders each in `rw`, `rn` and `ny` (18 values),
using existing notification and board terminology. Existing translations remain
untouched. The description retains comma separation, zero as the due day,
positive-before / negative-after offsets and blank/server fallback. Ten whole
days maximum and -14 to 14 remain explicit; webhook forwarding is separate.

Shared translation checks and the board-reminder browser scenario now cover 19
locales. Source-order/token, numeric and wording checks pass, as do human-preference
checks. Browser coverage is syntax-checked only because the application stack is
unavailable. Forty-seven locale paths still need this group. The ordinary backlog
remains 51,575 values plus 188 pending source keys. No external translation service
was used.

## Bhojpuri, Maithili, Odia and Konkani due reminders — 2026-10-07

Filled six `due-reminder-*` placeholders each in `bho`, `mai`, `or_IN` and `kok`
(24 values), using existing notification terminology. The description retains
comma separation, zero as the due day, positive-before / negative-after offsets
and blank/server fallback. Ten whole days maximum and -14 to 14 remain explicit.
Existing translations are preserved and no external translation service was used.

Shared translation checks and the board-reminder browser scenario now cover 23
locales. Source-order/token, script, numeric and wording checks pass, as do
human-preference checks. Script checks do not distinguish languages that share
Devanagari; the language-specific prose was also reviewed directly. Browser
coverage is syntax-checked only because the application stack is unavailable.
Forty-three locale paths still need this group. The ordinary backlog remains
51,575 values plus 188 pending source keys.

### Due reminders — Moroccan Arabic and Yiddish (2026-10-07)

Filled the six due-reminder strings in `ary` and `yi` (12 values), retaining
existing board terminology. The instructions preserve comma-separated offsets,
zero as the due day, positive days before and negative days after, the empty
server-default setting, at most ten integers between -14 and 14, board disabling
and outgoing webhook delivery. Existing correct-language values were preserved.

Regression checks cover the instructions, bounds, scripts and exact source-token
inventories; the existing browser scenario now includes both locales (25 translated
locales total). Translation, all-locale structural and human-preference checks
pass. Browser scenarios were syntax-checked only; the app stack was unavailable.
Script checks do not certify fluency or right-to-left rendering. No external
translation service was used. Technical compounds remain open to native review.

41 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, with 188 additional pending source keys; the wider language-quality
review remains open.

### Due reminders — Northern Ndebele, Swati, Northern Sotho and Tsonga (2026-10-07)

Filled six reminder strings in each of `nd`, `ss`, `nso` and `ts` (24 values).
The wording follows existing board and reminder terminology and preserves
comma-separated offsets, zero as the due day, positive days before and negative
days after, the empty server-default setting, at most ten integers from -14 to 14,
board disabling and outgoing webhook delivery. The fill leaves existing
correct-language translations untouched and uses no external translation service.
Technical compounds and the complete Northern Ndebele and Swati instructions are
low-confidence drafts for native review; structural checks do not establish fluency.

Translation regressions now cover 29 locales, including bounds, offset direction,
empty defaults and source-token inventories. Existing browser scenarios include
all four locales. Translation, all-locale structural and human-preference checks
pass; browser scenarios were syntax-checked only because the app stack was
unavailable. 37 locale paths still need this six-string group. The ordinary
backlog remains 51,575 values, plus 188 pending source keys. Wider language-quality
review remains open.

### Due reminders — Oromo, Fijian and Tongan (2026-10-07)

Filled six reminder strings in each of `om`, `fj` and `to` (18 values).
The instructions retain comma-separated offsets, zero as the due day, positive
days before and negative days after, the empty server-default setting, at most
ten integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Technical compounds and full Fijian and Tongan instructions remain low-confidence
drafts for native review. Structural checks do not establish fluency.

Vocabulary references: [Fijian-English dictionary](https://www.folksong.org.nz/isa_lei/Fijian-English_Dictionary.pdf)
attests `vava` for board (and regional `papa`); the existing `board: Vola` label
remains a terminology-review item. The new reminder prose uses `vava`.
[Te Papa's Fijian activity book](https://www.tepapa.govt.nz/assets/76067/1693189257-fijian_language_activity_book_a4_0.pdf)
supports `tini` for ten. [New Zealand curriculum guidance in Tongan](https://nzcurriculum.tki.org.nz/content/download/7181/100923/file/Tongan.pdf)
uses `fika kakato` in mathematical prose. These references support vocabulary,
not the complete software translations.

Translation checks now cover 32 locales, including offset direction, defaults,
bounds and source-token inventories. Existing browser scenarios include all three
locales. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
34 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Manx, Walloon and Waray (2026-10-07)

Filled six reminder strings in each of `gv`, `wa` and `wa-RR` (18 values).
The instructions preserve comma-separated offsets, zero as the due day, positive
days before and negative days after, the empty server-default setting, at most
ten integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled. No external translation service was used.
Technical compounds and complete Manx and Walloon instructions remain
low-confidence drafts for native review. Manx explicitly shows the comma symbol.
[The Manx integer dictionary entry](https://glosbe.com/en/gv/integer) supports
`slane-earroo`; it does not verify the complete instructions or their inflections.

Translation checks now cover 35 locales, including offset direction, defaults,
bounds and source-token inventories. Existing browser scenarios include all three
locales. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
31 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Akan and Luganda (2026-10-07)

Filled six reminder strings in each of `ak` and `lg` (12 values), using the
existing board and reminder terminology. The instructions retain comma-separated
offsets, zero as the due day, positive days before and negative days after, the
empty server-default setting, at most ten integers from -14 to 14, board disabling
and outgoing webhook delivery. Only English placeholders were filled; no external
translation service was used. Technical compounds remain low-confidence drafts
for native review; structural checks do not establish fluency.

Translation checks now cover 37 locales, including offset direction, defaults,
bounds and source-token inventories. Existing browser scenarios include both
locales. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
29 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Bambara, Wolof and Ewe (2026-10-07)

Filled six reminder strings in each of `bm`, `wo` and `ee` (18 values).
The instructions preserve comma-separated offsets, zero as the due day, positive
days before and negative days after, the empty server-default setting, at most
ten integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Full instructions and technical compounds in this batch are low-confidence drafts
for native review. Structural checks do not establish fluency.

Vocabulary evidence: the [Bambara dictionary](https://bamalingua.com/bambara-dictionary/)
provides the numeral ten; UCLA word lists attest Wolof
[`fukk`](https://archive.phonetics.ucla.edu/Language/WOL/wol_word-list_1993_01.html)
and Ewe [`ewo`](https://archive.phonetics.ucla.edu/Language/EWE/ewe_word-list_1989_01.html).
These sources support individual numerals, not the complete translations.

Translation checks now cover 40 locales, including offset direction, defaults,
bounds and source-token inventories. Existing browser scenarios include all three
locales. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
26 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Aromanian and Venetian (2026-10-07)

Filled six reminder strings in each of `rup` and `ve-CC` (12 values).
The instructions retain comma-separated offsets, zero as the due day, positive
days before and negative days after, the empty server-default setting, at most
ten integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
The Aromanian complete instructions and technical compounds are low-confidence
drafts for native review; Venetian technical wording also remains open to review.

Vocabulary evidence: [`dzatsi`](https://en.wiktionary.org/wiki/dzatsi) means ten;
[Aromanian morphosyntax research](https://www.mdpi.com/2226-471X/9/2/46)
attests `dininti` for before. These sources support individual words, not the
complete software translations or their fluency.

Translation checks now cover 42 locales, including offset direction, defaults,
bounds and source-token inventories. Existing browser scenarios include both
locales. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
24 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Buryat and Sakha (2026-10-07)

Filled six reminder strings in each of `bua` and `sah` (12 values).
The instructions preserve comma-separated offsets, zero as the due day, positive
days before and negative days after, the empty server-default setting, at most
ten integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Full instructions and technical compounds remain low-confidence drafts for native
review. Cyrillic checks do not distinguish these languages from Russian and do
not establish fluency; the prose was composed with their existing vocabulary.

Vocabulary evidence: the [Buryat dictionary](https://edbl.ru/b/b%D2%AFheli/)
attests `бүхэли тоо` for a whole number. A [Sakha teaching program](https://dkencheeri.ou14.ru/wp-content/uploads/sites/24/2022/05/toshol.pdf)
uses `бүтүн` and `чыыһыла` in number instruction. These references support
individual terms, not complete software instructions.

Translation checks now cover 44 locales, including offset direction, defaults,
bounds and source-token inventories. Existing browser scenarios include both
locales. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
22 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Chuvash (2026-10-07)

Filled six reminder strings in `cv`. Instructions retain comma-separated offsets,
zero as the due day, positive days before and negative days after, the empty
server-default setting, at most ten integers from -14 to 14, board disabling and
outgoing webhook delivery. Only English placeholders were filled; no external
translation service was used. Full instructions and technical compounds remain
low-confidence drafts for native review. Script checks do not establish fluency.

The [Chuvash-Russian dictionary](https://ru.samahsar.chuvash.org/article/33944.link)
attests `тулли хисеп` for an integer. This supports the mathematical term, not the
complete software instructions.

Translation checks now cover 45 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Chuvash. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
21 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Venda (2026-10-07)

Filled six reminder strings in `ve` (Venda, distinct from Venetian `ve-CC` and
Veps `ve-PP`). Instructions retain comma-separated offsets, zero as the due day,
positive days before and negative days after, the empty server-default setting,
at most ten integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Technical compounds remain low-confidence drafts for native review. Existing
wrong-language seeds elsewhere in the locale remain part of the wider audit.

The [Tshivenda mathematics terminology document](https://www.education.gov.za/Portals/0/Documents/MTbBE/mttbe%20terminology/Tshivenda%20Grade%204%20and%205%20MathematicsTerminology.pdf?ver=2025-11-06-164434-523)
provides contextual number vocabulary. It does not verify these complete software
instructions or their fluency.

Translation checks now cover 46 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Venda. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
20 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Northern Sámi (2026-10-07)

Filled six reminder strings in `se`. Instructions retain comma-separated offsets,
zero as the due day, positive days before and negative days after, the empty
server-default setting, at most ten integers from -14 to 14, board disabling and
outgoing webhook delivery. Only English placeholders were filled; no external
translation service was used. Technical compounds and complete instructions remain
low-confidence drafts for native review; structural checks do not establish fluency.

Vocabulary evidence: [Matematihkkasánit](https://s3.ovttas.no/ovttas-production/s3fs-public/matematihkkasanit.pdf)
attests `olleslohku` for integer and `positiiva logut` for positive numbers.
[Jouni A. Vest's dictionary](https://giellatekno.uit.no/dicts/dicts/Jouni_A_Vest_nettisanakirja.html)
attests `eanemustá` for at most. These references support terms, not the complete
software instructions or their inflections.

Translation checks now cover 47 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Northern Sámi. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
19 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Acehnese (2026-10-07)

Filled six reminder strings in `ace`. Instructions retain comma-separated offsets,
zero as the due day, positive days before and negative days after, the empty
server-default setting, at most ten integers from -14 to 14, board disabling and
outgoing webhook delivery. Only English placeholders were filled; no external
translation service was used. Complete instructions and technical compounds remain
low-confidence drafts for native review. Existing Indonesian/Malay seeds elsewhere
in this locale remain part of the wider audit.

The [Acehnese Swadesh list](https://bahasaaceh.com/wp-content/uploads/2012/07/acehnese_swadesh_word_list.pdf)
attests `siplôh` for ten. This supports the numeral, not the complete software
instructions. Structural checks do not establish fluency.

Translation checks now cover 48 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Acehnese. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
18 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Tibetan (2026-10-07)

Filled six reminder strings in `bo`, using the existing reminder and board terms.
Instructions retain comma-separated offsets (showing the literal comma), zero as
the due day, positive days before and negative days after, the empty server-default
setting, at most ten integers from -14 to 14, board disabling and outgoing webhook
delivery. Only English placeholders were filled; no external translation service
was used. Technical compounds remain open to native review. Script checks do not
establish fluency or distinguish Tibetan from other Tibetan-script languages.

Translation checks now cover 49 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Tibetan. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
17 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Dzongkha (2026-10-07)

Filled six reminder strings in `dz`, using the existing reminder and board terms.
Instructions retain comma-separated offsets (showing the literal comma), zero as
the due day, positive days before and negative days after, the empty server-default
setting, at most ten integers from -14 to 14, board disabling and outgoing webhook
delivery. Only English placeholders were filled; no external translation service
was used. Complete instructions and technical compounds are low-confidence drafts
for native review. Script checks do not distinguish Dzongkha from Tibetan or
establish fluency.

The [official English-Dzongkha dictionary](https://www.dzongkha.gov.bt/uploads/files/publications/Eng-Dzo_Dictionary_2023_3ead53caad0798894c3908a9aedceb84.pdf)
attests `ཧྲིག་གྲངས` for integer. This supports the mathematical term, not the
complete software instructions.

Translation checks now cover 50 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Dzongkha. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
16 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Tigrinya (2026-10-07)

Filled six reminder strings in `ti`, using existing reminder and board terminology.
Instructions retain comma-separated offsets, zero as the due day, positive days
before and negative days after, the empty server-default setting, at most ten
integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Technical compounds remain open to native review. Ethiopic-script checks do not
establish fluency or distinguish Tigrinya from other languages using that script.

Translation checks now cover 51 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Tigrinya. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
15 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Kashmiri (2026-10-07)

Filled six reminder strings in `ks`, using existing reminder and board terminology.
Instructions retain comma-separated offsets, zero as the due day, positive days
before and negative days after, the empty server-default setting, at most ten
integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Complete instructions and technical compounds remain low-confidence drafts for
native review. Script checks do not establish fluency or right-to-left rendering.

Vocabulary evidence: [`دٔہ`](https://en.wiktionary.org/wiki/%D8%AF%D9%94%DB%81)
means ten; [Unicode's Kashmiri locale data](https://www.unicode.org/cldr/charts/42/summary/ks.html)
uses `برونٹھ` for before in era labels. These references support individual terms,
not the complete instructions or their inflections.

Translation checks now cover 52 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Kashmiri. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
14 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Quechua (2026-10-07)

Filled six reminder strings in `qu`, following the existing Southern Quechua-style
reminder and board terminology. Instructions retain comma-separated offsets,
zero as the due day, positive days before and negative days after, the empty
server-default setting, at most ten integers from -14 to 14, board disabling and
outgoing webhook delivery. Only English placeholders were filled; no external
translation service was used. Complete instructions and technical compounds remain
low-confidence drafts for native review, including consistency across dialects.

[Quechua Tinkuy's counting lesson](https://quechuatinkuy.coerll.utexas.edu/en/yachana-3/)
attests `chunka` for ten. This supports the numeral, not the full instructions.
Structural checks do not establish fluency.

Translation checks now cover 53 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Quechua. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
13 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Aymara (2026-10-07)

Filled six reminder strings in `ay`, following existing reminder and board terms.
Instructions retain comma-separated offsets, zero as the due day, positive days
before and negative days after, the empty server-default setting, at most ten
integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Complete instructions and technical compounds remain low-confidence drafts for
native review. Structural checks do not establish fluency.

The [Aymara vocabulary](https://aymara.org/webarchives/www2007/arusa/piwra/piwra_eng.php?x=Adjectives&y=Aymara--%3EEnglish)
attests `tunka` for ten. This supports the numeral, not the complete instructions.

Translation checks now cover 54 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Aymara. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
12 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Guarani (2026-10-07)

Filled six reminder strings in `gn`, following existing reminder and board terms.
Instructions retain comma-separated offsets, zero as the due day, positive days
before and negative days after, the empty server-default setting, at most ten
integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Complete instructions and technical compounds remain low-confidence drafts for
native review. Structural checks do not establish fluency.

The [Guarani numeral entry](https://en.wiktionary.org/wiki/pa#Paraguayan_Guarani)
attests `pa` for ten. This supports the numeral, not the complete instructions.

Translation checks now cover 55 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Guarani. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
11 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Fulah (2026-10-07)

Filled six reminder strings in `ff`, following existing reminder and board terms.
Instructions retain comma-separated offsets, zero as the due day, positive days
before and negative days after, the empty server-default setting, at most ten
integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Complete instructions and technical compounds remain low-confidence drafts for
native review, including dialect consistency. Structural checks do not establish fluency.

The [Fula numeral entry](https://en.wiktionary.org/wiki/sappo)
attests `sappo` for ten. This supports the numeral, not the complete instructions.

Translation checks now cover 56 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Fulah. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
10 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Volapük (2026-10-07)

Filled six reminder strings in `vo`, following existing reminder and board terms.
Instructions retain comma-separated offsets, zero as the due day, positive days
before and negative days after, the empty server-default setting, at most ten
integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Complete instructions and technical compounds remain low-confidence drafts for
fluent-speaker review. Structural checks do not establish fluency.

The [English-Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary)
attests `liunül` (comma), `lölik` (whole), `vagik` (empty) and default-setting
terminology. These support individual terms, not the complete translations or
software compounds such as the server wording.

Translation checks now cover 57 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Volapük. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
9 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Klingon (2026-10-07)

Filled six reminder strings in `tlh`, following existing reminder and board terms.
Instructions retain comma-separated offsets (showing the literal comma), zero as
the due day, positive days before and negative days after, the empty server-default
setting, at most ten whole-day offsets from -14 to 14, board disabling and outgoing
webhook delivery. Only English placeholders were filled; no external translation
service was used. Full instructions, comparisons and technical compounds remain
low-confidence drafts for fluent-speaker review. Structural checks do not establish fluency.

[Hol 'ampaS number guidance](https://hol.kag.org/page/Numbers.html) was consulted
for numerical usage. The UI keeps the source's ASCII signed bounds and uses
comparisons to zero, with whole days expressed as `jaj naQmey`. This research does
not verify the complete software wording.

Translation checks now cover 58 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Klingon. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
8 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Greenlandic (2026-10-07)

Filled six reminder strings in `kl`, following existing reminder and board terms.
Instructions retain comma-separated offsets, zero as the due day, positive days
before and negative days after, the empty server-default setting, at most ten
integers from -14 to 14, board disabling and outgoing webhook delivery.
Only English placeholders were filled; no external translation service was used.
Complete instructions, inflections and technical compounds remain low-confidence
drafts for native review. The existing board term also needs terminology review.
Structural checks do not establish fluency.

The [Greenlandic numeral entry](https://en.wiktionary.org/wiki/qulit)
attests `qulit` for ten. This supports the numeral, not the complete instructions.

Translation checks now cover 59 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Greenlandic. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
7 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Nahuatl (2026-10-07)

Filled six reminder strings in `nah`, following existing reminder and board terms.
Instructions retain comma-separated offsets (showing the literal comma), zero as
the due day, positive days before and negative days after, the empty server-default
setting, at most ten integers from -14 to 14, board disabling and outgoing webhook
delivery. Only English placeholders were filled; no external translation service
was used. Complete instructions, mathematical comparisons and technical compounds
remain low-confidence drafts for native review, including dialect consistency.
Structural checks do not establish fluency.

[UNAM's lexical record](https://tlachia.iib.unam.mx/mh-tetzmollocan/387_795v)
attests `mahtlactli` for ten. This supports the numeral, not the full instructions.

Translation checks now cover 60 locales, including offset direction, defaults,
bounds and source-token inventories. The existing browser scenario includes
Nahuatl. Translation, all-locale structural and human-preference checks pass;
browser scenarios were syntax-checked only because the app stack was unavailable.
6 locale paths still need this six-string group. The ordinary backlog remains
51,575 values, plus 188 pending source keys. Wider language-quality review remains open.

### Due reminders — Veps (2026-10-07)

Filled all six English reminder placeholders in `ve-PP`, retaining signed offsets,
zero as the due day, blank/server default, whole-day bounds and the ten-entry limit,
board disabling, webhook delivery and saved-state wording. No existing translated
values were overwritten and no translation service was used.

Full phrases and technical terminology are low confidence and need native review.
Existing Veps terms were compared with the
[Veps-English dictionary](https://vepsnoid.blogspot.com/p/dictionary.html)
(for example, after, send and preserve), and
[VepKar](https://dictorpus.krc.karelia.ru/en/dict/lemma/49056) for whole/full.
Unrelated wrong-language values remain, including `home-board-empty` and
`set-default-board-template`; this batch does not certify the locale's language quality.

Reminder regression checks now cover 61 translated locales. Translation checks,
all-locale structural checks and human-preference checks pass. The existing browser
scenario includes Veps and was syntax-checked only; the app stack was unavailable.
Five locale paths still need this reminder group. The ordinary backlog remains
51,575 values plus 188 pending source keys; the wider language review stays open.

### Due reminders — Standard Moroccan Tamazight (2026-10-07)

Filled six English placeholders in `zgh` using Tifinagh and existing reminder,
date, board and save terminology. Signed offsets, due-day zero, blank/server
default, integer range, ten-entry limit, disabling and webhook delivery remain
explicit. Existing translations were preserved; no translation service was used.

Full phrases and technical terminology are low confidence and need native review.
Vocabulary references include the
[Atlas Cultural Foundation dictionary](https://atlasculturalfoundation.org/wp-content/uploads/2016/01/tamazight-english-dictionary-acf.pdf)
for before and the [Amawal dictionary](https://www.amazigh.online/dictionary)
for day and ten. The locale's wider mixed-script and vocabulary review remains open.

Reminder checks now cover 62 translated locales. Translation checks, all-locale
structural checks and human-preference checks pass. The existing browser scenario
includes Tamazight but was syntax-checked only; the app stack was unavailable.
Four locale paths still need this reminder group. The ordinary backlog remains
51,575 values plus 188 pending source keys. These checks do not certify fluency.

### Due reminders — Inuktitut (2026-10-07)

Filled six English placeholders in `iu`, retaining syllabic writing and existing
reminder, due-date, board and save vocabulary. The descriptions retain zero as the
due day, positive/before and negative/after offsets, blank/server defaults, whole
days, the signed range and ten-entry limit, disabling and outgoing webhooks.
No existing translations were overwritten and no translation service was used.

Full phrases and technical terminology are low confidence and need native review.
References include [Tusaalanga's glossary](https://www.tusaalanga.ca/glossary/inuktitut?l=t)
for ten, [Inhabit educational material](https://nti-inhabit.com/wp-content/uploads/2020/04/BW_EduResundertheice_r4.pdf)
for ahead of time, and [bilingual craft instructions](https://inuusiq.com/wp-content/uploads/2025/04/ELC-Arts-Crafts-Adult-Book-IK-EN-FINAL-1.pdf)
for after. These references support vocabulary, not validation of the full phrases.

Reminder checks now cover 63 translated locales. Translation checks, all-locale
structural checks and human-preference checks pass. The existing browser scenario
includes Inuktitut but was syntax-checked only; the app stack was unavailable.
Three locale paths still need this reminder group. The ordinary backlog remains
51,575 values plus 188 pending source keys; broader language-quality review is open.

### Due reminders — Wolaytta (2026-10-07)

Filled six English placeholders in `wal`. The descriptions retain due-day zero,
positive/before and negative/after offsets, blank/server defaults, whole-day range,
ten-entry limit, board disabling and outgoing webhook delivery. Existing translated
values were preserved; no translation service was used.

Full phrases and technical terminology are low confidence and need native review.
References include [Wolaytta numerals](https://www.omniglot.com/language/numbers/wolaytta.htm)
for ten, [Wakasa's grammar](https://www.janestudies.org/wp-content/uploads/2018/files/NES_no19(2014)_Wakasa.pdf)
for temporal construction, and the bilingual description of
[Samad in the Forest](https://www.buscalibre.cl/libro-samad-in-the-forest-english-wolayita-bilingual-edition-english-wolayita/9781916688667/p/57458539)
for whole day. Unrelated mixed-language values such as `default` and `act-almostdue`
remain part of the wider review; this batch does not certify language quality.

Reminder checks now cover 64 translated locales. Translation checks, all-locale
structural checks and human-preference checks pass. The existing browser scenario
includes Wolaytta but was syntax-checked only; the app stack was unavailable.
Two locale paths still need this reminder group. The ordinary backlog remains
51,575 values plus 188 pending source keys; broader language review remains open.

### Due reminders — Tigre (2026-10-07)

Filled six English placeholders in `tig`, retaining due-day zero, signed offsets,
before/after, blank/server defaults, whole-day bounds, ten-entry limit, board
disabling and outgoing webhooks. Existing translated values were preserved and no
translation service was used.

Full phrases and technical terminology are low confidence and need native review.
References include [The Tigre Language of Gindaʿ](https://www.speaktigre.com/_files/ugd/7e068a_adcb2a9df2c340898e3155ef3905c61e.pdf?index=true)
for ten and [Kekia's lessons](https://www.scribd.com/document/92835181/Tigre-Grammar)
for after and connective forms. The newly filled strings were reviewed for Tigrinya
carryover; the wider locale review remains open. Shared script does not prove that
the vocabulary or grammar belongs to Tigre.

Reminder checks now cover 65 translated locales. Translation checks, all-locale
structural checks and human-preference checks pass. The existing browser scenario
includes Tigre but was syntax-checked only; the app stack was unavailable.
Cherokee still needs this reminder group. The ordinary backlog remains
51,575 values plus 188 pending source keys; broader language-quality review is open.

### Due reminders — Cherokee and all-locale reconciliation (2026-10-07)

Filled six Cherokee placeholders without overwriting existing translations or using
an external translation service. Full phrases, inflections and technical terms are
low confidence and need native review. Vocabulary references include the
[Cherokee dictionary compilation](https://www.witchcraft-academy.com/Library/Traditions/Native%20American/Cherokee_Dictionary.pdf)
for before/after and the existing locale's reminder terminology. Dictionary words
do not validate the grammar or usability of the assembled phrases.

All 234 non-English locale paths now have nonempty values different from English
for all six reminder keys, with exact source placeholder inventories. The group was
removed from the pending queue: 182 source keys remain. Detailed reminder checks
cover 66 locales, including signed offsets, whole-day limits and separate saved/error
text. The existing browser scenario includes Cherokee and was syntax-checked only;
the app stack was unavailable. All-locale structural and human-preference checks pass.

These checks establish placeholder coverage, not fluent or correct-language text.
The ordinary backlog remains 51,575 values in 70 languages, and broader language
review, including the low-confidence reminder phrases, remains open.

### SAML browser-tab error — first remaining batch (2026-10-07)

Filled `saml-login-not-started` in 19 locale paths: tk_TM, tt, so, ku, ckb, pap,
tpi, bi, mi, sm, haw, zu, zu-ZA, xh, st, tn, rw, rn and ny. The message explains
that this login was not started in the current browser tab and asks the user to
sign in again. Existing translations were preserved; no translation service was used.
Browser-tab terminology in the Pacific and southern African language phrases has
lower confidence and needs native review, especially Samoan's page/tab distinction.

Extended the existing SAML popup-error suite with source-order, nonempty,
non-English, protocol-name and placeholder checks. Popup-error and replay-boundary
suites, all-locale structural checks and human-preference checks pass. Existing
SAML browser scenarios were syntax-checked only; the app stack was unavailable.
There are 47 locale paths still needing this message. The key remains pending;
the overall snapshot stays 51,575 ordinary missing values and 182 pending keys.

### SAML browser-tab error — second remaining batch (2026-10-07)

Filled `saml-login-not-started` in bho, mai, or_IN, kok, ary, yi, nd, ss, nso, ts,
om, fj and to (13 locale paths). Existing translations were preserved and no
translation service was used. The message retains the current browser-tab boundary
and asks the user to sign in again. Browser/tab terminology in nd, ss, nso, ts, om,
fj and to is lower confidence and needs native review.

Vocabulary references include the [Fijian-English dictionary](https://www.unitec.ac.nz/umisc/jmctest/fijian_english_dictionary/fijian_eng_dict.html)
for begin and [UCLA's Tongan word list](https://archive.phonetics.ucla.edu/Language/TON/ton_word-list_1984_01.html)
for again. These support individual words, not validation of complete phrases.

The existing popup-error suite now checks this translation in 32 recently filled
locales and passes its positive and negative login-boundary cases. All-locale
structural and human-preference checks pass. Browser scenarios were not run; the
app stack was unavailable. 34 locale paths still need this message. The snapshot
remains 51,575 ordinary missing values plus 182 pending keys; broader language
review remains open.

### SAML browser-tab error — third remaining batch (2026-10-07)

Filled `saml-login-not-started` in gv, wa, wa-RR, ak, lg, bm, wo and ee (eight
locale paths), preserving the tab-specific failed-start explanation and instruction
to sign in again. No existing translations were overwritten and no translation
service was used. Full Manx and Walloon phrases and browser/tab terminology across
this batch are low confidence and need native review. Manx vocabulary was checked
against [Learn Manx](https://www.learnmanx.com/learning/intermediate/lesson-1-toshiaght---introduction--1025/)
for beginning and again; this does not validate the full technical phrase.

The popup-error suite now checks 40 recently filled locales and passes, including
positive and negative login-boundary cases. All-locale structural and human-preference
checks pass. Browser scenarios were not run; the app stack was unavailable.
26 locale paths still need this message. The overall snapshot remains 51,575
ordinary missing values plus 182 pending keys; broader language review stays open.

### SAML browser-tab error — fourth remaining batch (2026-10-07)

Filled `saml-login-not-started` in rup, ve-CC, bua, sah, cv, ve and se (seven
locale paths). Existing translated values were preserved; no translation service
was used. Full Aromanian phrases and browser-tab terminology across this batch
are low confidence and need native review. The message retains the current-tab
boundary and instruction to sign in again.

References include the [English-Aromanian dictionary](https://vivliuteca.org/wp-content/uploads/2025/06/an-english-aromanian-macedo-romanian-dictionary-society-farsharotu.pdf)
for again and [Northern Sámi training material](https://assets.ctfassets.net/nqmec82k7bwk/5Ty8fJLbDcfPjAMGnNCMoO/fa570651d609437db55881acb8153344/Kurs_unge_eldre_nordsamisk.pdf)
for browser. These support vocabulary, not fluent validation. Existing unrelated
login labels in rup, ve-CC and ve still include wrong-language text and remain
part of the wider locale review.

The popup-error suite now checks 47 recently filled locales and passes, including
positive and negative login-boundary cases. All-locale structural and human-preference
checks pass. Browser scenarios were not run; the app stack was unavailable.
19 locale paths still need this message. The snapshot remains 51,575 ordinary
missing values plus 182 pending keys; language-quality review remains open.

### SAML browser-tab error — fifth remaining batch (2026-10-07)

Filled `saml-login-not-started` in ace, bo, dz, ti and ks (five locale paths).
Existing translations were preserved and no translation service was used. The
message retains the current-tab boundary and request to sign in again. Browser-tab
terminology and full Acehnese and Dzongkha phrases are low confidence and need
native review; script checks cannot establish correct vocabulary or grammar.

References include the [Acehnese thesaurus](https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/a9fa3ff5-837d-40db-a316-81bbe13d3bf4/content)
for again and [Dzongkha browser configuration guidance](https://www.dzongkha.gov.bt/dz/article/configuring-web-browsers-for-dzongkha)
for browser terminology. These references support individual terms, not the full
translation. Existing unrelated mixed-language values remain in the wider review.

The popup-error suite now checks 52 recently filled locales and passes, including
positive and negative login-boundary cases. All-locale structural and human-preference
checks pass. Browser scenarios were not run; the app stack was unavailable.
14 locale paths still need this message. The snapshot remains 51,575 ordinary
missing values plus 182 pending keys; broader language review remains open.

### SAML browser-tab error — sixth remaining batch (2026-10-07)

Filled `saml-login-not-started` in qu, ay, gn and ff. The message retains the
current-tab boundary and asks the user to sign in again. Existing translations
were preserved and no translation service was used. Full phrases and browser/tab
terminology are low confidence and need native review. Guarani's repeat instruction
uses the dictionary-attested [jey](https://www.proyectomontoya.org.py/nthg/jey).
This vocabulary evidence does not validate the whole phrase. Existing mixed-language
login labels in qu and ay remain part of the broader review.

The popup-error suite now checks 56 recently filled locales and passes, including
positive and negative login-boundary cases. All-locale structural and human-preference
checks pass. Browser scenarios were not run; the app stack was unavailable.
Ten locale paths still need this message. The snapshot remains 51,575 ordinary
missing values plus 182 pending keys; broader language review remains open.

### SAML browser-tab error — Volapük and Klingon (2026-10-07)

Filled `saml-login-not-started` in vo and tlh without overwriting existing
translations or using an external translation service. Full phrases are low
confidence and need review. Klingon retains borrowed `browser` and `tab` labels
because no established equivalents were verified; these remain a terminology
review item. The text states that this sign-in process was not started in the
current tab and asks the user to enter again.

References: [Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary)
for begin, again and browser, and [Klingon Language Institute](https://lists.kli.org/archives/list/tlhingan-hol%40lists.kli.org/thread/NLDVJYW4NEGQO5QTFLPX4DILAQZF5WS3/)
for initiating a process. Vocabulary evidence does not validate complete phrases.

The popup-error suite now checks 58 recently filled locales and passes, including
positive and negative login-boundary cases. All-locale structural and human-preference
checks pass. Browser scenarios were not run; the app stack was unavailable.
Eight locale paths still need this message. The snapshot remains 51,575 ordinary
missing values plus 182 pending keys; broader language review remains open.

### SAML browser-tab error — Veps and Wolaytta (2026-10-07)

Filled `saml-login-not-started` in ve-PP and wal, retaining the current browser-tab
boundary and instruction to sign in again. Existing translated values were
preserved; no translation service was used. Full phrases and browser/tab terms
are low confidence and need native review. Wolaytta's start verb was checked
against [The Wolaytta Language](https://dokumen.pub/the-wolaytta-language.html);
Veps uses existing sign-in terminology. These checks do not establish fluency.

The popup-error suite now checks 60 recently filled locales and passes, including
positive and negative login-boundary cases. All-locale structural and human-preference
checks pass. Browser scenarios were not run; the app stack was unavailable.
Six locale paths still need this message. The snapshot remains 51,575 ordinary
missing values plus 182 pending keys; broader language review remains open.

### SAML browser-tab error — Greenlandic and Inuktitut (2026-10-07)

Filled `saml-login-not-started` in kl and iu, retaining the current-tab boundary
and instruction to sign in again. Existing translations were preserved and no
translation service was used. Both full phrases, inflections and browser/tab terms
are low confidence and need native review. Borrowed browser/tab labels remain a
terminology review item. Existing locale login vocabulary was used; the Inuktitut
start stem also occurs in [Nunavut proceedings](https://assembly.nu.ca/sites/default/files/Hansard_20060308_Inuktitut.pdf).
This evidence does not validate the complete translation.

The popup-error suite now checks 62 recently filled locales and passes, including
positive and negative login-boundary cases. All-locale structural and human-preference
checks pass. Browser scenarios were not run; the app stack was unavailable.
Four locale paths still need this message. The snapshot remains 51,575 ordinary
missing values plus 182 pending keys; broader language review remains open.

### SAML browser-tab error — Nahuatl and Tamazight (2026-10-07)

Filled `saml-login-not-started` in nah and zgh without overwriting existing
translations or using an external translation service. The messages retain the
current-tab boundary and instruction to sign in again. Both full phrases and
browser/tab terminology are low confidence and need native review. Nahuatl uses a
borrowed browser label and an approximate tab term; Tamazight retains a tab loan.

References include [UNAM's Nahuatl dictionary](https://gdn.iib.unam.mx/diccionario/occeppa/187043)
for again and [IRCAM's conjugation manual](https://www.temehu.com/imazighen/dictionaries/Amawals/manuel-de-conjugaison-Tamazight-Tifinagh-IRCAM.pdf)
for the Tamazight start verb. These references do not validate the full phrases.

The popup-error suite now checks 64 recently filled locales and passes, including
positive and negative login-boundary cases. All-locale structural and human-preference
checks pass. Browser scenarios were not run; the app stack was unavailable.
Tigre and Cherokee still need this message. The snapshot remains 51,575 ordinary
missing values plus 182 pending keys; broader language review remains open.

### SAML browser-tab error — Tigre, Cherokee and reconciliation (2026-10-07)

Filled the remaining English placeholders in tig and chr, preserving existing
translated values and using no translation service. Full phrases are low confidence
and need native review. Cherokee retains borrowed browser/tab labels; replacing
these with established terminology remains open. Tigre's start verb was checked
against [The Tigre Language of Gindaʿ](https://www.speaktigre.com/_files/ugd/7e068a_adcb2a9df2c340898e3155ef3905c61e.pdf?index=true).
Vocabulary and script checks do not validate complete phrases.

All 234 non-English locale paths now have a nonempty value different from English
for `saml-login-not-started`, with exact source placeholders. Removed the key from
the pending queue: 181 keys remain. Detailed translation checks cover 66 recently
filled locales. The popup-error suite passes positive and negative login-boundary
cases and all-locale coverage. All-locale structural and human-preference checks
pass. Browser scenarios were not run; the app stack was unavailable.

The ordinary backlog remains 51,575 values in 70 languages. This is placeholder
coverage, not a claim of fluent or correct-language text; the wider review and
low-confidence SAML phrases remain open.

### Rule-builder instructions — Turkmen, Tatar and Somali (2026-10-07)

Filled seven pending rule-builder strings in tk_TM, tt and so (21 values): people
variables, card-date trigger label, any-trigger/ordered-actions help, add-trigger,
add-action, remove-part and trigger-variable help. Existing translated values were
preserved; no translation service was used. Literal brace expressions, including
`{customField:Field name}` and `{customField:Name}`, remain exactly as in English.

Extended the existing trigger-variable regression suite to compare brace-token
inventories as well as underscore/percent tokens, source order and nonempty values.
It includes a negative check for a renamed custom-field example. Runtime variable
matching cases, all-locale structural checks and human-preference checks pass.
The existing browser scenario was syntax-checked only; the app stack was unavailable.

Trigger and swimlane terminology and the composed date-condition fragments need
native/UI review, especially where existing locale labels use inconsistent terms.
63 locale paths still need this seven-string group. The snapshot remains 51,575
ordinary missing values plus 181 pending keys; broader language review stays open.

### Rule-builder instructions — Kurdish, Sorani and Papiamento (2026-10-07)

Filled the seven pending rule-builder strings in ku, ckb and pap (21 values),
preserving existing translations and every literal variable expression, including
`{customField:Field name}` and `{customField:Name}`. No translation service was used.
The descriptions retain any-trigger behavior, ordered actions, username/email
context and card-derived variables used by other actions and trigger fields.

The existing trigger-variable suite now checks six recently filled locales for
source order, nonempty translations and exact brace/underscore/percent tokens.
Runtime variable matching, all-locale structural and human-preference checks pass.
The browser scenario was not run; the app stack was unavailable. Date-condition
fragments, trigger terminology and the email recipient label need native/UI review.
60 locale paths still need this group. The snapshot remains 51,575 ordinary missing
values plus 181 pending keys; broader language review remains open.

### Rule-builder instructions — Tok Pisin and Bislama (2026-10-07)

Filled seven pending strings in tpi and bi (14 values), preserving existing
translations and literal variable expressions. No translation service was used.
Triggers are described as events that start the rule; actions run one by one in
order. Username/email context and reading variable values from the card remain
explicit. The phrases use existing list, card and swimlane labels. Trigger wording,
recipient-field labels and composed date fragments need native/UI review.

The existing trigger-variable suite now checks eight recently filled locales for
source order, nonempty translations and exact brace/underscore/percent tokens.
Runtime matching, all-locale structural and human-preference checks pass. Browser
scenarios were not run; the app stack was unavailable. 58 locale paths still need
this group. The snapshot remains 51,575 ordinary missing values plus 181 pending
keys; broader language-quality review remains open.

### Rule-builder instructions — Māori, Samoan and Hawaiian (2026-10-07)

Filled seven pending strings in mi, sm and haw (21 values), preserving existing
translations and all literal variable expressions. No translation service was used.
Any-trigger behavior, ordered actions, username/email context and card-derived
variables remain explicit. Reading `scheduledTriggers.jade` confirmed that the date
label precedes a set/soon/overdue selector; the new fragments avoid implying arrival.

Full Samoan and Hawaiian phrases, technical terms and composed date-condition
labels are lower confidence and need native/UI review. Māori interface terminology
also needs contextual review. The existing trigger-variable suite now checks 11
recently filled locales for source order and exact brace/underscore/percent tokens.
Runtime matching, all-locale structural and human-preference checks pass. Browser
scenarios were not run; the app stack was unavailable. 55 locale paths still need
this group. The snapshot remains 51,575 ordinary missing values plus 181 pending
keys; broader language-quality review remains open.

### Rule-builder instructions — Zulu and Xhosa (2026-10-07)

Filled seven pending strings in zu, zu-ZA and xh (21 values), preserving existing
translations and literal variable expressions. No translation service was used.
Trigger descriptions distinguish starting events from actions, retain any-trigger
behavior and ordered execution, and explain username/email and card-variable context.
The two Zulu paths use the same wording. Xhosa's existing `swimlane` value is
`Ukuqubha` (swimming); the new instructions use lane terminology. This unrelated
label remains part of the broader vocabulary review.

The existing trigger-variable suite now checks 14 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. Trigger descriptions, recipient labels
and composed date-condition fragments need native/UI review. 52 locale paths
still need this group. The snapshot remains 51,575 ordinary missing values plus
181 pending keys; broader language-quality review remains open.

### Rule-builder instructions — Sesotho and Setswana (2026-10-07)

Filled seven pending strings in st and tn (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The descriptions retain any-trigger behavior, ordered actions, username/email
context and reading variables from the card. Triggers are described as events that
start the rule. Technical terminology, recipient labels and composed date-condition
fragments need native/UI review; the full technical phrases have lower confidence.

The existing trigger-variable suite now checks 16 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 50 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Kinyarwanda, Kirundi and Chichewa (2026-10-07)

Filled seven pending strings in rw, rn and ny (21 values), preserving existing
translations and literal variable expressions. No translation service was used.
The descriptions retain any-trigger behavior, sequential actions, username/email
context and values read from the card. Kirundi and Kinyarwanda use their respective
forms rather than copying an entire translation between languages. Technical
terminology, recipient labels and composed date-condition fragments need native/UI
review, especially the full Kirundi technical phrases.

The existing trigger-variable suite now checks 19 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 47 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Bhojpuri and Maithili (2026-10-07)

Filled seven pending strings in bho and mai (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Each locale uses its own verb forms. Technical terminology,
recipient labels and composed date-condition fragments need native/UI review.

The existing trigger-variable suite now checks 21 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 45 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Odia and Konkani (2026-10-07)

Filled seven pending strings in or_IN and kok (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Technical terminology and composed date-condition fragments
need native/UI review, especially the lower-confidence Konkani prose. Odia uses a
transliterated swimlane term here; its existing swimlane label means swimming and
remains part of the broader terminology review.

The existing trigger-variable suite now checks 23 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 43 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Moroccan Arabic and Yiddish (2026-10-07)

Filled seven pending strings in ary and yi (14 values), preserving existing
correct-language translations and all literal variable expressions. No translation
service was used. Replaced three Persian seed labels in ary: trigger, action and
swimlane now use Arabic/Darija vocabulary and spelling. Regression checks cover
these replacements and reject the Persian letters found in the old seed labels.
Vocabulary was inspected as well; script checks alone do not establish language.

The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Technical terms, composed date-condition fragments and
right-to-left display with literal Latin variable expressions need native/UI review.
The existing trigger-variable suite now checks 25 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 41 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Northern Ndebele, Swati, Northern Sotho and Tsonga (2026-10-07)

Filled seven pending strings in nd, ss, nso and ts (28 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Northern Ndebele and Swati prose has lower confidence;
technical terms, noun agreement and composed date-condition fragments need native/UI
review. The existing Swati swimlane label and Tsonga trigger label remain terminology
review items; these new explanations use path and trigger-event descriptions.
Swati vocabulary was cross-checked against the
[Swati word list](https://www.polytranslator.com/dictionary/swati/), which lists
indlela for way, and [published Swati prose](https://www.justice.gov.za/EQCact/legislation/2000-04-siswati.pdf).
These sources support individual words, not the accuracy of the complete translations.

The existing trigger-variable suite now checks 29 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 37 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Oromo, Fijian and Tongan (2026-10-07)

Filled seven pending strings in om, fj and to (21 values), preserving existing
correct-language translations and all literal variable expressions. No translation
service was used. Two Tongan labels containing prefixed English (Trigger and Action)
were replaced with Meʻa kamata and Ngāue; regression checks reject the old forms.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Fijian and Tongan technical prose has lower confidence;
recipient fields, variable values and composed date fragments need native/UI review.
Fijian lawa was checked in the
[Fijian dictionary entry](https://kaikki.org/dictionary/Fijian/meaning/l/la/lawa.html).
Published [Tongan prose](https://tahatu.govt.nz/api/documents/serve/263/Career_Malaga_Student_Workbook__Tongan.pdf)
provides examples of ngāue and hokohoko. These references support vocabulary,
not the accuracy of the full sentences.

The existing trigger-variable suite now checks 32 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 34 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Manx and Walloon (2026-10-07)

Filled seven pending strings in gv and wa (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Manx prose has lower confidence; mutations, recipient-field
wording, Walloon technical terms and composed date fragments need native/UI review.
Manx vocabulary references include [ennym](https://en.wiktionary.org/wiki/ennym)
and [order](https://glosbe.com/en/gv/order). Walloon references include the
[djivêye usage](https://lucyin.walon.org/diccionairaedje/djiveye400.html) and
[rîle usage](https://rifondou.walon.org/croejhete1.html).
These references support individual words, not full-sentence accuracy.

The existing trigger-variable suite now checks 34 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 32 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Waray and Akan (2026-10-07)

Filled seven pending strings in wa-RR and ak (14 values), preserving existing
correct-language translations and all literal variable expressions. No translation
service was used. Replaced French/English seed labels for trigger, swimlane and
checklist in Waray; explicit regression checks reject the old labels.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Akan technical prose has lower confidence; recipient fields,
variable values and composed date fragments need native/UI review. The existing
Akan trigger and action labels are the same vague phrase and remain review items.
References: [Waray corpus dictionary](https://dictionary.corporaproject.org/index.php?glossary=S&sort=word)
for ngaran and sequence vocabulary, and the
[Twi basic course](https://fsi-languages.yojik.eu/languages/FSI/Twi/Basic/FSI%20-%20Twi%20Basic%20Course%20-%20Student%20Text.pdf)
for mmara (rule). These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 36 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 30 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Luganda and Wolof (2026-10-07)

Filled seven pending strings in lg and wo (14 values), preserving existing
correct-language translations and all literal variable expressions. No translation
service was used. Replaced Luganda's English trigger label with Ekitandika etteeka;
regression checks reject the old parenthetical English form.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Technical prose has lower confidence; recipient fields,
variable values, noun agreement and composed date fragments need native/UI review.
References: the [English–Luganda glossary](https://www.luganda.com/wp-content/uploads/2021/09/An_English-Luganda_Glossary_of_Basic_Scientific_Terms1-combined-document-2.pdf)
for etteeka and the [Wolof dictionary](https://wolofresources.org/language/download/wollof.pdf)
for lim. These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 38 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 28 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Bambara and Ewe (2026-10-07)

Filled seven pending strings in bm and ee (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Both translations have lower confidence; recipient fields,
variable values, technical terms and composed date fragments need native/UI review.
References include [Bambara sariya](https://en.wiktionary.org/wiki/sariya) and
[Basic Ewe](https://philtypo3.uni-koeln.de/sites/inst_afrika/pdf/BASIC_EWE_2nd_ed.pdf)
for wɔ dɔ. These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 40 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 26 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Aromanian and Venetian (2026-10-07)

Filled seven pending strings in rup and ve-CC (14 values), preserving existing
correct-language translations and all literal variable expressions. No translation
service was used. Replaced disparador and Azione in both locales and Carril in
Venetian; regression checks cover the five corrected labels.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Aromanian technical prose has lower confidence. Recipient
fields, dialectal spelling, technical terms and composed date fragments in both
locales need native/UI review.
References include [Aromanian numã](https://en.wiktionary.org/wiki/num%C3%A3)
and [Venetian zonta and orthography](https://dizionario.dejudicibus.it/veneziano/veneziano.html).
These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 42 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 24 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Buryat and Sakha (2026-10-07)

Filled seven pending strings in bua and sah (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Both translations have lower confidence; recipient fields,
variable terminology, case endings and composed date fragments need native/UI review.
References include [Buryat дүрим](https://kaikki.org/ruwiktionary/%D0%91%D1%83%D1%80%D1%8F%D1%82%D1%81%D0%BA%D0%B8%D0%B9/meaning/%D0%B4/%D0%B4%D2%AF/%D0%B4%D2%AF%D1%80%D0%B8%D0%BC.html)
and [Sakha educational prose](https://ospeh.moy.su/vosprab21/Sanapapka/RP-21-22/yakutskiy/rodnoj_jazyk_6_kl.pdf)
for быраабыла. These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 44 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 22 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Chuvash and Venda (2026-10-07)

Filled seven pending strings in cv and ve (14 values), preserving existing
correct-language translations and all literal variable expressions. No translation
service was used. Replaced Venda's Nguni labels Qalisa, Isenzo and Isihloko with
Venda trigger, action and title labels; regression checks reject the old forms.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Both translations have lower confidence; technical terms,
case endings, noun agreement and composed date fragments need native/UI review.
References include [Chuvash ят](https://ru.wiktionary.org/wiki/%D1%8F%D1%82)
and [published Venda prose](https://justice.gov.za/EQCact/legislation/2000-04-venda.pdf)
for mulayo and mutevhe. These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 46 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 20 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Northern Sámi and Acehnese (2026-10-07)

Filled seven pending strings in se and ace (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Both translations have lower confidence; technical terms,
case endings, recipient fields and composed date fragments need native/UI review.
References include [Northern Sámi prose using njuolggadus](https://www.regjeringen.no/globalassets/upload/aid/temadokumenter/sami/sami_samekonvensjon_samisk_h-2183.pdf)
and [Acehnese buët](https://en.wiktionary.org/wiki/bu%C3%ABt).
These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 48 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 18 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Tibetan and Dzongkha (2026-10-07)

Filled seven pending strings in bo and dz (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Dzongkha uses its own plural and verbal forms rather than
copying Tibetan prose. Both translations have lower confidence; technical terms,
recipient fields and composed date fragments need native/UI review.
References consulted include the
[Dzongkha Development Commission dictionary resources](https://www.dzongkha.gov.bt/dz/dictionary/search)
and [Tibetan rule vocabulary](https://linguatools.info/?prefix=1&query=rule&st=1).
These references do not validate full-sentence accuracy.

The existing trigger-variable suite now checks 50 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 16 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Tigrinya and Kashmiri (2026-10-07)

Filled seven pending strings in ti and ks (14 values), preserving existing
translations and all literal variable expressions. No translation service was used.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Kashmiri prose has lower confidence; technical terms,
recipient fields and composed date fragments in both locales need native/UI review.
Kashmiri also needs browser review of right-to-left text around Latin variables.
References include [Tigrinya ሕጊ](https://en.wiktionary.org/wiki/%E1%88%95%E1%8C%8A)
and [Kashmiri کٲم](https://en.wiktionary.org/wiki/%DA%A9%D9%B2%D9%85).
These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 52 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 14 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Quechua and Aymara (2026-10-07)

Filled seven pending strings in qu and ay (14 values), preserving existing
correct-language translations and all literal variable expressions. No translation
service was used. Replaced two Quechua labels and one Aymara label containing
prefixed English; regression checks reject the old prefixes and English labels.
The text retains any-trigger behavior, ordered actions, username/email context and
card-derived variables. Both translations have lower confidence; recipient fields,
technical terms, dialect choice and composed date fragments need native/UI review.
References include [ARUSIMIÑEE](https://www.illaa.org/pirwa/diccionarios/arusiminee.pdf)
for kamachi/kamachiy and
[Aymara terminology](https://www.illaa.org/pirwa/diccionarios/NuevosTerminosAimaras.html)
for lurawi. These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 54 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 12 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Guaraní (2026-10-07)

Filled seven pending strings in gn, preserving existing translations and all
literal variable expressions. No translation service was used. The text retains
any-trigger behavior, ordered actions, username/email context and card-derived
variables. Technical prose has lower confidence; recipient fields, variable values
and composed date fragments need native/UI review. The new hints use tysýi for
list; the existing Ysaja label remains a terminology-review item.
Vocabulary references include [GuaraniAyvuWeb](https://guaraniayvu.org/) for
mbohysýi and tembiapo and the
[Guaraní dictionary](https://www.mec.gob.ar/descargas/Bibliograf%C3%ADa/Educaci%C3%B3n%20Intercultural%20Biling%C3%BCe/GUARANI/avane-Diccionario-Guarani-Esp-Esp-Guarani.pdf)
for mbojoapy. These references do not validate full-sentence accuracy.

The existing trigger-variable suite now checks 55 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 11 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Fulah (2026-10-07)

Filled seven pending strings in ff, preserving existing translations and all
literal variable expressions. No translation service was used. The text retains
any-trigger behavior, ordered actions, username/email context and card-derived
variables. Technical prose has lower confidence; dialect consistency, noun classes,
recipient fields, variable values and composed date fragments need native/UI review.
Vocabulary references include the
[Fulfulde index](https://www.webonary.org/fulfuldeburkina/files/English-Fulfulde-Index.pdf)
for innde, golle and doggol. These references support individual words, not
full-sentence accuracy or uniform usage across Fulah varieties.

The existing trigger-variable suite now checks 56 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 10 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Veps (2026-10-07)

Filled seven pending strings in ve-PP, preserving existing translations and all
literal variable expressions. No translation service was used. The text retains
any-trigger behavior, ordered actions, username/email context and card-derived
variables. Technical prose has lower confidence; inflections, recipient fields,
variable values and composed date fragments need native/UI review. Existing
Sänd, Käivitai and Ujundšoid terminology was retained and also needs review.
The [Veps-English dictionary](https://vepsnoid.blogspot.com/p/dictionary.html)
provides lugeda (read) and inflection guidance. It does not validate the full
sentences or the existing software terminology.

The existing trigger-variable suite now checks 57 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 9 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Volapük (2026-10-07)

Filled seven pending strings in vo, preserving existing correct-language
translations and all literal variable expressions. No translation service was used.
Corrected rule, action and title labels to Nom, Dun and Tiäd; regression checks
cover these replacements. The text retains any-trigger behavior, ordered actions,
username/email context and card-derived variables. Technical prose has lower
confidence; compounds, inflections and composed date fragments need speaker/UI
review. Related existing labels still need a broader consistency review.
References include the [Volapük vocabulary](https://en.wikisource.org/wiki/Hand-book_of_Volap%C3%BCk/VOCABULARY)
for nom, dun and nem and the
[grammar introduction](https://volapuk.evertype.com/IntroToVolapuk.pdf).
These references do not validate full-sentence accuracy.

The existing trigger-variable suite now checks 58 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 8 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Greenlandic (2026-10-07)

Filled seven pending strings in kl, preserving existing translations and all
literal variable expressions. No translation service was used. The text retains
any-trigger behavior, ordered actions, username/email context and card-derived
variables. Technical prose has lower confidence; inflections, recipient fields,
variable values and composed date fragments need native/UI review.
References include the [Greenlandic-English dictionary](https://daka.gl/2018-kal-eng/)
for malittarisassaq and
[ateq usage](https://learngreenlandic.com/online/lg1/5.1/text/?lang=eng).
These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 59 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 7 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Nahuatl (2026-10-07)

Filled seven pending strings in nah, preserving existing translations and all
literal variable expressions. No translation service was used. The text retains
any-trigger behavior, ordered actions, username/email context and card-derived
variables. Technical prose has lower confidence; dialect consistency, recipient
fields, variable values and composed date fragments need native/UI review.
Existing title/list terminology also remains a review item.
References include [tlanahuatilli](https://nahuatl.wired-humanities.org/content/tlanahuatilli)
and [tlahcuilolli](https://nahuatl.wired-humanities.org/content/tlahcuil%C5%8Dlli).
These references support vocabulary, not full-sentence accuracy.

The existing trigger-variable suite now checks 60 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 6 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Klingon (2026-10-07)

Filled seven pending strings in tlh, preserving existing translations and all
literal variable expressions. No translation service was used. The text retains
any-trigger behavior, ordered actions, username/email context and card-derived
variables. Technical prose has lower confidence; complex noun phrases, recipient
fields and the composed date fragment need speaker/UI review. The software label
card remains a borrowed word rather than a claimed canonical Klingon term.
References include the [Klingon suffix guide](https://klingonska.org/dict/suffix.html)
and [reference tables](https://klingonska.org/dict/tables.html).
These references support grammatical choices, not full-sentence accuracy.

The existing trigger-variable suite now checks 61 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 5 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Standard Moroccan Tamazight (2026-10-07)

Filled seven pending strings in zgh, preserving existing translations and all
literal variable expressions. No translation service was used. New prose uses
Tifinagh and retains any-trigger behavior, ordered actions, username/email context
and card-derived variables. It has lower confidence; regional usage, technical
terms, recipient fields and composed date fragments need native/UI review.
The existing Latin-script list and lane labels remain unchanged; terminology
consistency across the broader locale remains a review item.
References consulted include [Moroccan Tamazight vocabulary](https://dicber-mc.centrederechercheberbere.fr/)
and the [Tifinagh vocabulary guide](https://library-of-tamazight.github.io/data/resources/09-18/05.pdf).
These references do not validate full-sentence accuracy.

The existing trigger-variable suite now checks 62 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 4 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Inuktitut (2026-10-07)

Filled seven pending strings in iu, preserving existing translations and all
literal variable expressions. No translation service was used. New prose uses
syllabics and retains any-trigger behavior, ordered actions, username/email context
and card-derived variables. It has lower confidence; dialect, inflections,
recipient fields and composed date fragments need native/UI review. Card is
represented by a syllabic borrowing that also needs terminology review.
References consulted include the
[Inuktut affix dictionary](https://uqausiit.ca/sites/default/files/2020-04/Affix-Dictionary-V21.pdf)
and [Inuktut glossary](https://tusaalanga.ca/glossary?l=T).
These references do not validate full-sentence accuracy.

The existing trigger-variable suite now checks 63 recently filled locales for
source order and exact brace/underscore/percent tokens. Runtime matching,
all-locale structural and human-preference checks pass. Browser scenarios were
not run; the app stack was unavailable. 3 locale paths still need this group.
The snapshot remains 51,575 ordinary missing values plus 181 pending keys;
broader language-quality review remains open.

### Rule-builder instructions — Wolaytta (2026-10-07)

Filled seven pending strings in `wal`, preserving existing translations and all
literal variable expressions. Corrected five related labels that used language-name
prefixes and English rule/trigger words. No translation service was used.

Technical prose has lower confidence and needs native review, especially trigger,
member and field terminology and the composed date fragment. Vocabulary references:
[Wolaytta dictionary](https://kaikki.org/dictionary/Wolaytta/index.html) and
[Wakasa's descriptive grammar](https://theswissbay.ch/pdf/Books/Linguistics/Mega%20linguistics%20pack/Afro-Asiatic/Omotic/Wolaytta%20Language%2C%20A%20Descriptive%20Study%20of%20the%20Modern%20%28Wakasa%29%20%281%29.pdf).
These references do not validate the complete translated sentences.

The rule-variable suite now covers 64 recently filled locales, exact variables,
source tokens and order, and rejects the corrected prefixed English labels.
Runtime, all-locale structural and human-preference checks pass. Browser scenarios
were not run because the application stack is unavailable. Two locale paths still
need this seven-string group. The ordinary backlog remains 51,575 values, plus
181 pending source keys; broader language-quality review remains open.

### Rule-builder instructions — Tigre (2026-10-07)

Filled seven pending strings in `tig` directly, preserving literal variable
expressions and existing translations. No translation service was used.

The technical prose has low confidence and needs Tigre speaker review. This is
not a claim that the existing catalog is free of Tigrinya seed text. References:
[Raz, Tigre Grammar and Texts](https://studylib.net/doc/29012541/tigre-grammar-and-texts--shlomo-raz---z-library.sk--1lib....),
especially temporal `dol` and the imperative of “remove”, and
[Beurmann/Merx vocabulary](https://www.speaktigre.com/_files/ugd/7e068a_a5fbea1fb5e544e69d94cab002762da2.pdf?index=true).
The references support individual forms, not complete modern software sentences.
Trigger terminology, noun agreement and composed date wording remain review items.

The rule-variable suite now covers 65 recently filled locales, including exact
brace variables, source tokens and key order. Runtime, all-locale structural and
human-preference checks pass. Browser scenarios were not run because the app stack
is unavailable. Cherokee is the remaining locale for this seven-string group.
The ordinary backlog remains 51,575 values plus 181 pending source keys; broader
language-quality work remains open.

### Rule-builder instructions — Cherokee and catalog coverage (2026-10-07)

Filled seven pending strings in `chr`, preserving existing translations and all
literal variable expressions. No translation service was used. Technical prose
has low confidence, especially condition clauses, field terminology and the date
fragment that is composed with date choices in the UI. Native review remains open.
Vocabulary references: the Cherokee Nation's
[2024 Consortium list](https://language.cherokee.gov/media/vdiic5hr/2024consortium.pdf)
for sequence-of-events vocabulary and its
[OU word list](https://language.cherokee.gov/media/ykahxw4v/oudictionaryeuglutan.pdf)
for “another”. These do not validate the complete translated sentences.

All seven keys now have non-English values in all 234 non-English locale paths.
The existing regression suite now discovers every locale rather than enumerating
recent batches, checking key order, nonempty non-English values, underscore and
percent tokens, and exact brace expressions. Removed these seven keys from the
pending placeholder inventory, reducing it from 181 to 174; this is not a claim
that every translation has been linguistically validated.

Rule-variable runtime checks, all-locale structural checks and 21 human-preference
checks pass. Existing browser scenarios were syntax-checked but not run because
the app stack is unavailable. The ordinary backlog remains 51,575 values across
70 languages; wrong-language and low-confidence review remains open.

### Move-position labels — first remaining batch (2026-10-07)

Filled “Before” and “After” in 36 locale paths (72 values): ary, bho, bi, bo,
ckb, haw, kok, ks, ku, mai, mi, nd, nso, ny, om, or_IN, pap, rn, rw, sm,
so, ss, st, ti, tk_TM, tn, to, tpi, ts, tt, ve, wo, xh, yi, zu-ZA and zu.
The structural-selection popup uses these for relative placement of lists, lanes,
cards and checklist content, including horizontal placement. Existing correct
translations were preserved, and no translation service was used.

Wolof uses spatial “Ci kanam” / “Ci gannaaw”, supported by the
[Wolof training manual](https://publish.illinois.edu/wolof201fall14/files/2014/08/NEW_WOLOF_BOOK.pdf),
rather than a temporal-only “before”. Minority-language wording, especially
Kashmiri, Swati and Tibetan, has lower confidence and needs native/UI review.

Extended the structural-selection suite with key-order, placeholder, nonempty,
non-English and distinct-opposite-label checks for all 36 paths. Existing runtime
selection checks, all-locale structural checks and 21 human-preference checks pass.
The existing browser suite covers placement and rejects invalid targets; it was
syntax-checked but not run without the application stack.

30 locale paths still need these two labels; both keys remain pending.
The ordinary backlog is 51,575 values plus 174 pending source keys. Broader
language-quality review remains open.

### Move-position labels — spatial terminology batch (2026-10-07)

Filled both placement labels in 13 more locale paths: gv, vo, wa, bm, lg, ee,
fj, qu, ak, wa-RR, se, ve-CC and ay (26 values). Existing translations were
preserved through the placeholder-only merge; no translation service was used.

Used spatial opposites for the move-selection dialog. References include
[Manx lessons](https://archive.gaelg.im/www.gaelg.iofm.net/LESSONS/mona/Lessons.pdf),
[Volapük grammar](https://en.wikibooks.org/wiki/Volap%C3%BCk),
[Walloon dictionary](https://dtw.walon.org/index.php?query=divant),
[Intermediate Bambara](https://files.eric.ed.gov/fulltext/ED132856.pdf),
[Ewe Basic Course](https://celt.indiana.edu/materials/ewe/b03/ewe-basic-course.pdf),
[Fijian dictionary](https://www.unitec.ac.nz/umisc/jmctest/fijian_english_dictionary/fijian_eng_dict.html),
[Quechua educational guide](https://peib.mineduc.cl/wp-content/uploads/2016/06/Guia-Del-Educador-Tradicional-2do-Basico-Qhishwa-Simi.pdf)
and [Akan spatial examples](https://wikieducator.org/images/3/3c/The_Akan_Phrasal_Verb_as_a.pdf).
Aymara, Northern Sami and Waray placement phrasing has lower confidence and
remains subject to native/UI review. Dictionary vocabulary alone does not prove
that every standalone option is idiomatic in its UI context.

The structural-selection suite now checks these labels in 49 recently filled
locales, including key order, exact source tokens and distinct opposite choices.
Runtime selection, all-locale structural and human-preference checks pass. Existing
browser scenarios were syntax-checked but not run without the application stack.
17 locale paths still need these labels. Both source keys remain pending; the
ordinary backlog remains 51,575 values plus 174 pending source keys.

### Move-position labels — five further locales (2026-10-07)

Filled both relative-placement labels in Buryat, Chuvash, Yakut, Aromanian and
Klingon (ten values). The placeholder-only merge preserved existing translations.
No translation service was used.

References: [Buryat spatial postpositions](https://sciup.org/poslelogi-mesta-v-burjatskom-i-tureckom-jazykah-148182581),
[Chuvash front](https://ru.samahsar.chuvash.org/s/7/впереди) and
[behind](https://ru.samah.chv.su/s/позади),
[Yakut postposition](https://en.wiktionary.org/wiki/кэннигэр),
[Aromanian dictionary](https://vivliuteca.org/wp-content/uploads/2025/06/dictsiunararmanescu_dec2008.pdf),
and [Klingon location phrases](https://www.kli.org/duolingo/discuss-locations/).
Klingon uses spatial `tlhopDaq` and `'emDaq`, rather than time expressions.
Standalone UI phrasing, especially Aromanian and the three Cyrillic-language
options, remains subject to native review; dictionary matches do not verify fluency.

The structural-selection suite now covers the pair in 54 recently filled locales.
Runtime selection, exact tokens, key order, distinct opposite labels, all-locale
structure and 21 human-preference checks pass. The existing browser suite was
syntax-checked but not run without the app stack. Twelve locale paths still need
these labels; both keys remain pending. The ordinary backlog remains 51,575 values
plus 174 pending source keys. Broader language-quality work remains open.

### Move-position labels — Acehnese, Fula, Guarani and Veps (2026-10-07)

Filled eight placement labels in ace, ff, gn and ve-PP. Existing translations
were preserved through the placeholder-only merge; no translation service was used.

Vocabulary references: [Acehnese spatial examples](https://digilib.uin-suka.ac.id/id/eprint/17128/1/Proceeding%20AICIS%20XIV%20Buku_2.pdf),
[Fula directions](https://wisc.pb.unizin.org/lctlresources/chapter/giving-directions/),
[Guarani dictionary](https://guaraniayvu.org/), and the Veps descendants in the
[Finnic front](https://en.wiktionary.org/wiki/Reconstruction:Proto-Finnic/eci) and
[back](https://en.wiktionary.org/wiki/Reconstruction:Proto-Finnic/taka) entries.
Guarani uses independent t- forms for standalone options. Veps placement wording
has lower confidence; native/UI review of the options remains open. These references
support vocabulary, not a claim of fully verified localization.

The structural-selection suite now checks the pair in 58 recently filled locales,
including exact source tokens, key order and distinct opposite labels. Runtime,
all-locale structural and 21 human-preference checks pass. Browser scenarios were
syntax-checked but not run without the application stack. Eight locale paths still
need this pair, so both keys remain pending. The ordinary backlog remains 51,575
values plus 174 pending source keys; broader language-quality review remains open.

### Move-position labels — Dzongkha, Greenlandic and Inuktitut (2026-10-07)

Filled six placement labels in dz, kl and iu through the placeholder-only merge,
preserving existing translations. No translation service was used.

Used spatial front/back expressions. References:
[Grammar of Dzongkha](https://escholarship.org/content/qt1h4211k0/qt1h4211k0_noSplash_b3843a79888f78f39713ded5f61ad772.pdf),
[Nunavik locative noun bases](https://nunavik-ice.com/en/c/inuktitut-en/locative-pronouns/),
and [Greenlandic front/back usage in photo captions](https://knr.gl/kl/nutaarsiassat/sermersuup-kommunalbestyrelsiani-inissitsitertut).
Standalone placement labels have lower confidence and still need native/UI review;
these references establish vocabulary usage, not idiomatic software localization.

The structural-selection suite now covers this pair in 61 recently filled locales.
Key order, exact source tokens, distinct opposite choices, runtime selection,
all-locale structure and 21 human-preference checks pass. Browser scenarios were
syntax-checked but not run without the app stack. Five locale paths still need
the pair; both keys remain pending. The ordinary backlog remains 51,575 values
plus 174 pending source keys, with broader language-quality review open.

### Move-position labels — Nahuatl, Tamazight and Tigre (2026-10-07)

Filled six placement labels in nah, zgh and tig using the placeholder-only merge.
Existing translations were preserved; no translation service was used.

References: Nahuatl [ixpan](https://gdn.iib.unam.mx/diccionario/ixpan/19313)
and [icampa](https://nahuatl.wired-humanities.org/content/icampa),
[IRCAM syntax study](https://biblio.ircam.ma/pmb/uploads/publications/221.pdf)
for zdat/deffir, and
[Raz's Tigre grammar](https://studylib.net/doc/29012541/tigre-grammar-and-texts--shlomo-raz---z-library.sk--1lib....)
for qadam and spatial darb. These support spatial vocabulary; standalone software
wording, especially Tigre orthography and Tamazight standardization, remains lower
confidence and subject to native/UI review.

The structural-selection suite now covers this pair in 64 recently filled locales.
Runtime selection, source-token and key-order checks, distinct opposite labels,
all-locale structure and 21 human-preference checks pass. Browser scenarios were
syntax-checked but not run without the application stack. Cherokee and Wolaytta
still need the pair; both keys remain pending. The ordinary backlog remains
51,575 values plus 174 pending source keys, with broader language review open.

### Move-position labels — Cherokee, Wolaytta and all-locale coverage (2026-10-07)

Filled the final four English placeholders in chr and wal, preserving existing
translations. No translation service was used. Spatial references include
[Cherokee lesson examples](https://www.cherokeelessons.com/pdf-downloads/ᏛᏘᏏ-ᏥᏍᏚ-Ꮎ-ᎡᏆ-ᎠᏙᎩᏯᏍᏗ.pdf),
[Cherokee Nation locative assessments](https://language.cherokee.org/media/5wan5m52/report-on-language-ed-self-governance-2024-final.pdf)
and [Wolaytta ordering examples](https://divinerevelations.info/documents/bible/All_HTML2/Wolaytta_Bible/MAT19.htm).
Standalone software phrasing has lower confidence and remains open for native/UI
review; vocabulary evidence does not establish complete localization quality.

Both placement labels now have non-English, distinct values in all 234 non-English
locale paths. The structural-selection suite now discovers every locale, checking
nonempty values, source key order and exact placeholder inventories. Removed the
two filled keys from the pending inventory, reducing it from 174 to 172, with a
regression assertion that they remain out of that inventory.

Runtime selection, all-locale structural and 21 human-preference checks pass.
Browser scenarios were syntax-checked but not run without the application stack.
The ordinary backlog remains 51,575 values across 70 languages, plus 172 pending
source keys. Broader wrong-language and low-confidence review remains open.

### Custom URL scheme hint — first remaining batch (2026-10-07)

Filled the Admin Panel hint in ary, ckb, ku, bho, mai, or_IN, kok, tk_TM, tt
and yi (ten values), preserving existing translations with the placeholder-only
merge. No translation service was used. The hint retains the empty default,
web/mail-only behavior, registered-application handling and the categorical
exclusion of javascript, data and vbscript schemes.

The allowlist suite now verifies these ten translations, source key order,
underscore/percent placeholders and all five exact scheme identifiers. A negative
assertion rejects an omitted scheme identifier. Existing parser, sanitizer and
wiring tests, all-locale structure and 21 human-preference checks pass. The browser
suite was syntax-checked but not run because the app stack is unavailable.

Technical wording, particularly Konkani, Maithili and Turkmen, has lower confidence
and remains open for native/UI review. Fifty-six locale paths still need this hint,
so its source key remains pending. The ordinary backlog remains 51,575 values plus
172 pending source keys; broader language-quality work remains open.

### Custom URL scheme hint — six further languages (2026-10-07)

Filled the hint in Tok Pisin, Bislama, Papiamento, Somali, Oromo and Nyanja
(tpi, bi, pap, so, om, ny). The placeholder-only merge preserved existing
translations. No translation service was used. All five scheme identifiers remain
literal; the hint retains the empty default, clickable web/mail links, registered
application handling and the permanent exclusion of the dangerous scheme examples.

The allowlist suite now covers these hints in 16 recently filled locales. Exact
identifiers, missing-identifier rejection, source tokens and key order pass, as do
the existing parser/sanitizer tests, all-locale structure and 21 human-preference
checks. Browser scenarios were syntax-checked but not run without the app stack.

Technical prose, especially Oromo and Nyanja, has lower confidence and remains
open for native/UI review. Fifty locale paths still need this hint, so the source
key remains pending. The ordinary backlog remains 51,575 values plus 172 pending
source keys; broader language-quality work remains open.

### Custom URL scheme hint — southern African locales (2026-10-07)

Filled eight locale values: Zulu (zu and zu-ZA), Xhosa, North Ndebele, Swati,
Southern Sotho, Tswana and Northern Sotho. Existing translations were preserved
through the placeholder-only merge. No translation service was used. Literal
scheme names, the empty default, registered-application handling and permanent
exclusion of the dangerous scheme examples are retained.

The allowlist suite now checks the hint in 24 recently filled locales. Exact
identifiers, missing-identifier rejection, source tokens, source key order,
parser/sanitizer behavior, all-locale structure and 21 human-preference checks pass.
Browser scenarios were syntax-checked but not run without the application stack.
Technical wording, especially North Ndebele, Swati and Northern Sotho, has lower
confidence and remains open for native/UI review.

Forty-two locale paths still need this hint, so its source key remains pending.
The ordinary backlog remains 51,575 values plus 172 pending source keys; broader
language-quality work remains open.

### Custom URL scheme hint — five further African languages (2026-10-07)

Filled the hint in rw, rn, lg, ts and ve (Kinyarwanda, Kirundi, Luganda, Tsonga
and Venda). Existing translations were preserved through the placeholder-only
merge; no translation service was used. All five scheme identifiers remain exact,
with the empty default, registered-application behavior and permanent exclusion
of dangerous scheme examples retained in the prose.

The allowlist suite covers this hint in 29 recently filled locales. Identifier
inventory and negative omission checks, source tokens and key order pass, together
with parser/sanitizer behavior, all-locale structure and 21 human-preference checks.
Browser scenarios were syntax-checked but not run without the application stack.
Technical wording, particularly Venda and Tsonga, has lower confidence and remains
open for native/UI review.

Thirty-seven locale paths still need this hint, so its source key remains pending.
The ordinary backlog remains 51,575 values plus 172 pending source keys; broader
language-quality work remains open.

### Custom URL scheme hint — Pacific languages (2026-10-07)

Filled the hint in Māori, Samoan, Tongan, Fijian and Hawaiian (mi, sm, to, fj,
haw). The placeholder-only merge preserved existing translations; no translation
service was used. All five scheme identifiers remain literal. The prose retains
the empty default, clickable web/mail links, registered-application behavior and
permanent exclusion of the dangerous scheme examples.

The allowlist suite now checks the hint in 34 recently filled locales. Exact
identifier inventories, missing-identifier rejection, source tokens, key order,
parser/sanitizer behavior, all-locale structure and 21 human-preference checks pass.
Browser scenarios were syntax-checked but not run without the application stack.
Technical phrasing, especially Hawaiian, Tongan and Fijian, has lower confidence
and remains open for native/UI review.

Thirty-two locale paths still need this hint, so its source key remains pending.
The ordinary backlog remains 51,575 values plus 172 pending source keys; broader
language-quality work remains open.

### Custom URL scheme hint — Venetian, Walloon and Aromanian (2026-10-07)

Filled the hint in ve-CC, wa and rup through the placeholder-only merge, preserving
existing translations. No translation service was used. Literal scheme identifiers,
the empty default, registered-application behavior and permanent exclusion of the
dangerous scheme examples are retained. Technical wording has lower confidence
and needs native/UI review, especially Aromanian grammar and Walloon terminology.
The [Walloon dictionary](https://theatrewallon.be/onewebmedia/DICTIONNAIRE%20POPULAIRE.pdf)
supports the opening verb; it does not validate the complete software sentences.

The allowlist suite now covers the hint in 37 recently filled locales. Exact
identifier inventories, negative omission checks, source tokens and key order pass,
as do parser/sanitizer tests, all-locale structure and 21 human-preference checks.
Browser scenarios were syntax-checked but not run without the application stack.
Twenty-nine locale paths still need this hint, so its source key remains pending.
The ordinary backlog remains 51,575 values plus 172 pending source keys; broader
language-quality review remains open.

### Custom URL scheme hint — Waray and Acehnese (2026-10-07)

Filled the hint in wa-RR and ace through the placeholder-only merge, preserving
existing translations. No translation service was used. All five scheme names,
the empty default, registered-application behavior and permanent exclusion of the
dangerous scheme examples are retained.

Vocabulary references: [Waray opening verb](https://dictionary.corporaproject.org/index.php?glossary=A&sort=word)
and [Acehnese thesaurus](https://fileserver-az.core.ac.uk/download/pdf/160609809.pdf)
for peuhah. Technical prose has lower confidence, especially Acehnese loanword
choices, and needs native/UI review; these sources do not validate whole sentences.

The allowlist suite now checks the hint in 39 recently filled locales. Exact
identifier and negative omission checks, source tokens and key order pass, as do
parser/sanitizer behavior, all-locale structure and 21 human-preference checks.
Browser scenarios were syntax-checked but not run without the application stack.
Twenty-seven locale paths still need this hint, so its source key remains pending.
The ordinary backlog remains 51,575 values plus 172 pending source keys; broader
language-quality work remains open.

### URL scheme hint: Manx and Northern Sami

Filled the English-only `automatic-linked-url-schemes-hint` in `gv` and `se` directly, preserving existing translated values through the fill utility. The five literal scheme identifiers and source placeholders remain unchanged. The prose covers the empty default, clickable web/mail links, registered applications and permanently excluded schemes.

These technical translations have lower confidence and need native-speaker UI review. Manx lexical references include [Manx lessons](https://archive.gaelg.im/www.gaelg.iofm.net/LESSONS/mona/Lessons.pdf) for opening and [claare](https://en.wiktionary.org/wiki/claare) for programme; these support vocabulary, not validation of the complete sentences. No translation service was used.

Validation: the URL scheme suite covers 41 recently filled locales, including exact identifiers, source tokens, key order and parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The existing custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in 25 locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; translation quality review remains open.

### URL scheme hint: Tigrinya, Akan, Wolof and Guarani

Filled the English-only `automatic-linked-url-schemes-hint` in `ti`, `ak`, `wo` and `gn` directly. Existing translations were protected by the fill utility. All five literal scheme names remain unchanged; the prose describes the empty default, web/mail links, registered applications and permanently blocked schemes.

Technical wording in these four drafts has lower confidence and needs native-speaker review. Lexical references include [UCLA's Wolof word list](https://archive.phonetics.ucla.edu/Language/WOL/wol_word-list_1981_01.html) for `ubbi` (open), [Tigrinya application instructions](https://applications.migration.gov.gr/wp-content/uploads/2020/07/LOGIN_INSTRUCTIONS_TIGRINYA.pdf) for `መተግበሪ`, and [Guarani digital-language research](https://dialnet.unirioja.es/descarga/articulo/7330473.pdf) for digital vocabulary. These references do not validate the complete translated sentences. Akan follows the locale's existing spelling and uses technical loanwords. No translation service was used.

The URL-scheme suite now checks 45 recently filled locales and exercises parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes UI test was syntax-checked only; the application stack is unavailable. This hint remains English in 21 locales. The broader backlog remains 51,575 ordinary missing values plus 172 pending source keys, with translation quality review still open.

### URL scheme hint: Buryat, Sakha and Chuvash

Filled the English-only `automatic-linked-url-schemes-hint` in `bua`, `sah` and `cv` directly through the placeholder-only fill utility. Existing translated values were retained. The translations preserve all five scheme identifiers and describe the empty default, clickable web/mail links, registered applications and permanently excluded schemes.

These three technical drafts have lower confidence and need native-speaker review. Terminology follows each locale's existing link/email labels. Supporting language references include [Buryat syntax lessons](https://buryadxelen.com/backend/web/burlang/default/tutorial?part_id=202) and [Chuvash technology vocabulary](https://www.chuvash.org/wiki/Кӑсӑк%20технологи%20сӑмахӗсем). Neither reference establishes that the complete translated hints are idiomatic or technically precise. No translation service was used.

Validation covers 48 recently filled hints, exact scheme identifiers, source tokens and key order, together with parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only because the application stack is unavailable. This hint remains English in 18 locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Quechua and Aymara

Filled the English-only `automatic-linked-url-schemes-hint` in `qu` and `ay` directly through the placeholder-only fill utility. All five literal scheme names remain unchanged. The drafts describe the empty default, clickable web/mail links, registered applications and schemes that never become links. No existing translated value was overwritten and no translation service was used.

Both drafts have lower confidence, particularly technical loanwords, link terminology and regional spelling; native-speaker review remains necessary. The Quechua draft uses `kichan` without copying the unrelated `Kay willaymi:` prefix present in the locale's existing open label. References include the [Apurimac Quechua dictionary](https://www.illaa.org/pirwa/diccionarios/DicAMLQApurimacQuechua.pdf) for `kichay` and `chusaq`, and [ILLA's Andean dictionaries](https://www.illaa.org/index.php/diccionarios/) for Aymara lexical resources. These references are not validation of the complete technical sentences.

Validation covers 50 recently filled hints, exact identifiers, tokens and source key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in 16 locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Tibetan and Dzongkha

Filled the English-only `automatic-linked-url-schemes-hint` in `bo` and `dz` directly with the placeholder-only fill utility. Existing translations were retained. Both drafts preserve all five scheme names and describe the empty default, web/mail links, registered applications and permanently excluded schemes.

Technical wording, especially the URI scheme term, has lower confidence and needs native-speaker review. Dzongkha uses its own grammatical forms rather than copying the Tibetan sentence. References include [Dzongkha Computer Terms](https://panl10n.cle.org.pk/outputs/DCT.pdf) for application terminology and the [Tibetan dictionary](https://dictionary.christian-steinert.de/) computer-term collection. These resources do not validate the complete translated sentences. No translation service was used.

Validation covers 52 recently filled hints, exact scheme identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in 14 locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Bambara, Ewe and Fulah

Filled the English-only `automatic-linked-url-schemes-hint` in `bm`, `ee` and `ff` directly through the placeholder-only fill utility. The five literal scheme identifiers are unchanged. The drafts describe the empty default, clickable web/mail links, registered applications and permanently excluded schemes. Existing translated values were retained; no translation service was used.

All three drafts have lower confidence, especially the terminology for URI schemes and registered applications. Native-speaker review remains necessary. Lexical references include [Intermediate Bambara](https://files.eric.ed.gov/fulltext/ED132856.pdf) for empty/without contents, [Bamadaba](https://bamadaba.coastsystems.net/lexicon/d/) and [Nuseline's Ewe dictionary](https://www.ewedictionary.com/). Fulah follows existing locale terminology for links and email. These references and the existing labels do not establish the accuracy of the complete translated sentences.

Validation covers 55 recently filled hints, exact scheme identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in 11 locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Greenlandic and Kashmiri

Filled the English-only `automatic-linked-url-schemes-hint` in `kl` and `ks` directly through the placeholder-only fill utility. Existing translated values were retained. The five literal scheme names are unchanged; both drafts describe the empty default, web/mail links, registered applications and permanently excluded schemes.

Both drafts have lower confidence in technical terminology and grammatical agreement. Native-speaker review remains necessary, as does browser review of the Kashmiri text with Latin scheme identifiers. Greenlandic vocabulary references include [Iserasuaat's examination guidance](https://iserasuaat.gl/-/media/iserasuaat/folkeskole/5_afsluttende_evaluering/5-proevevejledninger/prvevejledning-lokale-valg-2009-kal.pdf), which uses `programmit`; Kashmiri reference resources include [Grierson's dictionary](https://dsal.uchicago.edu/dictionaries/grierson/). These sources do not validate the full technical sentences. No translation service was used.

Validation covers 57 recently filled hints, exact scheme identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in nine locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Veps and Volapük

Filled the English-only `automatic-linked-url-schemes-hint` in `ve-PP` (Veps) and `vo` directly through the placeholder-only fill utility. Existing translated values were retained. The five literal scheme names remain unchanged. The drafts describe the empty default, clickable web/mail links, registered applications and permanently excluded schemes.

Both drafts have lower confidence, especially URI-scheme terminology, grammatical agreement and technical compounds. References include [Veps `avaita`](https://en.wiktionary.org/wiki/avaita), including its inflection, and [Midgley's English–Volapük dictionary](https://xn--volapk-7ya.com/EnVoDictionary-20100830.pdf), including link, program, open and click terminology. The Volapük hint uses `vüyümäd` rather than the Esperanto-looking `Ligilo` in the existing link label; that label remains a broader quality-audit item. Dictionary support is not validation of complete sentences or idiomatic UI wording. No translation service was used.

Validation covers 59 recently filled hints, exact scheme identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in seven locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Klingon

Filled the English-only `automatic-linked-url-schemes-hint` in `tlh` directly through the placeholder-only fill utility. Existing translated values were retained. All five scheme names remain literal and lowercase despite Klingon's case-sensitive orthography. The draft describes the initially empty list, web/mail links, applications registered for listed schemes and permanently excluded schemes.

This draft has lower confidence and needs fluent-speaker review. `URL Segh` is a descriptive rendering of scheme as URL type, and pressing a link renders clicking. References include [the Klingon Word Wiki's Internet entry](https://klingon.wiki/Word/-Internet), which distinguishes `weQmoQnaQ` (World Wide Web), and [Hol 'ampaS: ghun](https://hol.kag.org/a/ghun), for programming vocabulary. These support vocabulary only, not validation of the complete sentence structure or technical phrasing. No translation service was used.

Validation covers 60 recently filled hints, exact scheme identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in six locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Nahuatl

Filled the English-only `automatic-linked-url-schemes-hint` in `nah` directly through the placeholder-only fill utility. Existing translated values were retained. All five scheme names remain literal. The draft describes the empty default, clickable web/mail links, registered applications and permanently excluded schemes.

This draft has lower confidence, particularly regional grammar and computer terminology, and needs fluent-speaker review. It uses the descriptive `URL tlamantli` for URL type and technical loanwords for program, list and email. References include [the University of Oregon Nahuatl dictionary's `tlapoa`](https://nahuatl.wired-humanities.org/content/tlapoa) for opening and [Indiana University's Nahuatl exercises](https://celt.indiana.edu/portal/Nahuatl/E02.pdf) for the root `ilpia` (tie). The link noun follows the existing locale. These lexical references do not validate the complete sentences or establish standardized technical terminology. No translation service was used.

Validation covers 61 recently filled hints, exact scheme identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in five locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Standard Moroccan Tamazight

Filled the English-only `automatic-linked-url-schemes-hint` in `zgh` directly through the placeholder-only fill utility. Existing translations were retained. The draft uses Tifinagh prose while preserving the five literal scheme names and URL abbreviation. It describes the empty default, clickable web/mail links, registered applications and permanently excluded schemes.

This draft has lower confidence in technical terminology and grammatical agreement and needs fluent-speaker review. It describes a scheme as a URL type. References include [the Amazigh computing lexicon](https://cedric.cnam.fr/~bouzefra/books/amawal.pdf) for application terminology and [IRCAM's school lexicon](https://www.ircam.ma/index.php/fr/edition/lexique-scolaire) as a Moroccan terminology resource. The broader computing lexicon includes regional vocabulary; its terms do not by themselves prove Moroccan-standard usage. These references do not validate the complete sentences. No translation service was used.

Validation covers 62 recently filled hints, exact scheme identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in four locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Inuktitut

Filled the English-only `automatic-linked-url-schemes-hint` in `iu` directly through the placeholder-only fill utility. Existing translations were retained. The draft uses syllabics and preserves all five literal scheme identifiers. It describes the empty default, web/mail links, applications registered for listed schemes and permanently excluded schemes.

This draft has lower confidence in technical terminology and grammatical agreement and needs fluent-speaker review. [Tusaalanga's South Qikiqtaaluk glossary](https://tusaalanga.ca/glossary?showall=1) provides `ikiaqqivik` (website), `ikiaqqijjut` (Internet) and `matuiqtuq` (opens). The existing locale supplies link/email terminology. The descriptive wording for URL scheme and registered application is not established as standard by those sources; neither the glossary nor the automated checks validate the complete translation. No translation service was used.

Validation covers 63 recently filled hints, exact identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in three locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Wolaytta

Filled the English-only `automatic-linked-url-schemes-hint` in `wal` directly through the placeholder-only fill utility. Existing translated values were retained. The five literal scheme names remain unchanged. The draft describes the initially empty setting, clickable web/mail links, registered applications and schemes that never become links.

This draft has lower confidence, especially technical loanwords, the descriptive URL-type term and grammatical agreement. It needs fluent-speaker review. [Lamberti and Sottile's grammar](https://dokumen.pub/the-wolaytta-language.html) gives `dooyy-` for open; [Wakasa's sketch grammar](https://www.janestudies.org/wp-content/uploads/2018/files/NES_no19%282014%29_Wakasa.pdf) documents negative imperfective endings including third-person plural `-okkona`. Neither validates the complete draft or its software terminology. The existing `Wolayttatto: Open` label is still English after a language prefix and remains a broader quality-audit item. No translation service was used.

Validation covers 64 recently filled hints, exact identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. This hint remains English in two locales. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Tigre

Filled the English-only `automatic-linked-url-schemes-hint` in `tig` directly through the placeholder-only fill utility. Existing translated values were retained. The draft preserves all five literal scheme identifiers and describes the empty default, web/mail links, applications registered for listed schemes and permanently excluded schemes.

This draft has low confidence in software terminology and agreement and needs fluent Tigre review. [Omar M. Kekia's Dehai Tigre lessons](https://www.speaktigre.com/_files/ugd/7e068a_d791dde4087041feaf3dedb6b109829c.pdf?index=true) document the negative prefix, `we` (and), `aw` (or), `et` (in), and `lieTa` (only). The draft uses Tigre grammatical forms rather than copying the Tigrinya hint. The descriptive URL-type term and registered-application wording remain unvalidated, and Ethiopic script alone does not establish correct language. No translation service was used.

Validation covers 65 recently filled hints, exact identifiers, source tokens and key order, plus parser/sanitizer positive and negative cases. All 234 locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. Only Cherokee still has this hint in English. The broader backlog remains 51,575 ordinary missing values and 172 pending source keys; language quality review remains open.

### URL scheme hint: Cherokee and all-locale coverage

Filled the English-only `automatic-linked-url-schemes-hint` in `chr` directly through the placeholder-only fill utility. Existing translations were retained. The draft uses syllabics and preserves all five literal scheme identifiers. It describes the empty default, clickable web/mail links, registered applications and permanently excluded schemes.

The Cherokee draft has low confidence, especially the URL-type description, registration phrase and verb agreement, and needs fluent-speaker review. The [Cherokee Language Consortium's 2024 word list](https://language.cherokee.org/media/vdiic5hr/2024consortium.pdf) supplies vocabulary for clicking, email, programs and registration. Lexical support does not validate the complete sentences. The previously documented low-confidence drafts in other locales still require language-quality review. No translation service was used.

All 234 non-English locales now contain a nonempty value different from English for this hint. The URL-scheme regression suite discovers them dynamically and checks source key order, placeholder inventories and the five exact scheme identifiers; it also exercises parser/sanitizer positive and negative cases. The hint has been removed from the pending source-key inventory, reducing it from 172 to 171. This records completed placeholder filling, not linguistic certification.

All-locale structure/token checks and 21 human-preference checks pass. The custom-URL-schemes browser test was syntax-checked only; the application stack is unavailable. The ordinary backlog remains 51,575 missing values across 70 languages, alongside 171 pending source keys. The broader goal and language-quality review remain open.

### Signed-in board visibility: ten locales

Filled `instance`, `instance-desc` and `board-instance-info` in `ary`, `ckb`, `ku`, `bho`, `mai`, `or_IN`, `kok`, `tk_TM`, `tt` and `yi`: 30 English placeholders. The draft meanings distinguish viewing by every signed-in user of this WeKan, no viewing by anonymous users, and editing only by people added to the board. The confirmation retains its strong emphasis. Existing correct-language translations were protected by the fill utility; no translation service was used.

These drafts use direct language knowledge and the source UI context. Technical wording in Moroccan Arabic, Kurdish varieties, Bhojpuri, Maithili, Konkani and Yiddish has lower confidence and needs fluent-speaker review; grammatical and UI review remains open for the whole batch.

The board-visibility suite now checks this batch for source key order, placeholder inventories, exact markup and rendered emphasis, with a malformed-markup negative check. Runtime visibility tests, all 234 locale structure/token checks and 21 human-preference checks pass. The existing instance-board-visibility browser suite was syntax-checked only; the application stack is unavailable. These three keys still need filling in 56 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys, with language-quality review open.

### Signed-in board visibility: ten more locales

Filled the three board visibility strings (`instance`, `instance-desc`, `board-instance-info`) in Somali, Oromo, Kinyarwanda, Kirundi, Chichewa, Sesotho, Setswana, Northern Sotho and both Zulu locales: 30 English values. The wording follows the existing board terminology and preserves the distinction between viewing by signed-in users and editing by board members. These are direct drafts without an external translation service. Oromo, Kirundi and Sotho–Tswana technical wording has lower confidence; fluent-speaker review remains open for all ten locales.

Extended the existing translation regression to include these locales. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The existing browser suite was syntax-checked only; the application stack is unavailable. Each of these three source keys remains English in 46 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: eight further locales

Filled `instance`, `instance-desc` and `board-instance-info` in Bislama, Tok Pisin, Māori, Samoan, Hawaiian, Papiamento, Xhosa and Northern Ndebele: 24 English placeholders. Direct drafts use the existing board terminology, preserve confirmation emphasis and distinguish viewing by signed-in users from editing by board members. No external translation service was used and existing translations were protected by the fill utility. Hawaiian, Samoan and Northern Ndebele technical phrasing has lower confidence; fluent-speaker review remains open for all eight locales.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three keys remains English in 38 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Akan through Venetian

Filled the three signed-in board visibility keys in Akan, Luganda, Wolof, Swati, Tsonga, Venda, Waray and Venetian: 24 English placeholders. Direct drafts preserve the signed-in viewing condition, the anonymous-viewing exclusion, the board-member editing restriction and confirmation emphasis. The fill utility protected existing translations; no translation service was used. Technical phrasing has lower confidence across this batch and needs fluent-speaker review, especially agreement and login terminology. Venda `vhashumisi` is attested in the [GCIS Tshivenda manual](https://www.gcis.gov.za/sites/default/files/GCIS%20PAIA%20Manual-%20Tshivenda%20Final.pdf); that terminology reference does not validate these complete sentences.

Extended the existing translation regression to these eight locales. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three keys remains English in 30 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

## Original flagged inventory

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

Latest translation fix: **2026-09-15**, `1cf93f7e52` — replace two
Arabic-seeded Tamazight card and list URL labels with native link,
card and list terms. The focused source, negative, ledger and
234-locale checks pass. Ledger: **22,302**; zgh has **102**
Arabic-script values awaiting semantic classification. Complete
phrases still need fluent review. The original flagged queue remains
at zero pending; this broader review is unfinished.

Earlier translation fix: **2026-09-15**, `18a11d121` — replace six
Arabic/French Tamazight My Boards, My Cards, To boards, Close Board
and board/card removal labels with existing native components. My Cards
exactly reuses the local shortcut phrase; board/card member removal
reuses the native Remove Member verb and from-board/card constructions.
Focused UI-source, negative, token, exact-ledger and 234-locale checks
pass. Ledger: **22,300**; zgh has **104** Arabic-script values still
awaiting classification. Full compound grammar needs fluent review.

Earlier translation fix: **2026-09-15**, `ff5a286b5` — replace the mixed
French/Arabic Tamazight Check Version button and failure message.
The verb `ⵙⵙⵉⴷⴻⴷ` is glossed as “check” in a Tamazight verb list;
the version noun is independently attested in MediaWiki, and the
number/could-not terms reuse local phrases. Focused UI-key, exact-ledger,
token and 234-locale checks pass. The full failure clause is **low
confidence** pending native grammar review. Ledger: **22,294**; zgh has
**109** Arabic-script values awaiting classification.

Earlier translation fix: **2026-09-15**, `413b4ef40` — replace five
Tamazight Admin Panel version labels with the native `ⵜⵓⵏⵖⵉⵍⵜ`
version noun attested in MediaWiki's Standard Moroccan Tamazight locale.
The Meteor, MongoDB, FerretDB and Node proper names remain exact;
MongoDB's compatible qualifier is preserved. Focused production-source,
token, exact-ledger and 234-locale checks pass. Ledger: **22,292**; zgh
has **111** Arabic-script values awaiting classification. Complete noun
compounds and the adjacent Check Version/error messages remain open.

Earlier translation fix: **2026-09-15**, `63da3d3c9` — replace six
Arabic-seeded Tamazight labels with native import-board, invite-people,
unknown-name, type, size and restore terms already present in the locale.
Production UI wiring, English meanings, exact correction records, source
tokens and 234-locale completeness pass. Ledger: **22,287**; zgh has **113**
Arabic-script values still awaiting classification. Native phrase review
remains open.

Earlier translation fix: **2026-09-15**, `e11a2654c` — align five
Arabic Tamazight popup and copy-link labels with native terms
already used by Member Settings, Move Card, Leave Board,
Remove Member and card/text link-copy actions. The focused
source-wiring, positive/negative, exact-ledger and 234-locale
checks pass. Ledger: **22,281**. The zgh file has **119**
Arabic-script values awaiting classification. Complete native
wording remains under review.

Earlier translation fix: **2026-09-15**, `2b22dd0be` — replace
three Arabic Tamazight common UI nouns. Comments and Link reuse
the locale's existing card/comment and search-link terms. Email
Addresses uses the [IRCAM media glossary's](https://biblio.ircam.ma/pmb/uploads/publications/133.pdf)
attested `ansa` → `ansiwn` address plural alongside the local
email noun. The focused positive/negative test, exact-token ledger
and 234-locale checks pass. Ledger: **22,276**. The zgh file has
**124** Arabic-script values still awaiting classification;
full native phrase review remains open.

Earlier translation fix: **2026-09-15**, `79e5a93b4` — replace 13
Arabic Tamazight common popup titles with local native board,
card, label, language, settings, notification and profile terms.
The full phrases remain low confidence pending fluent review.
Focused positive/negative, ledger and 234-locale checks pass.
Ledger: **22,273**. The zgh file has **127** Arabic-script
values awaiting classification. The original flagged table is
unchanged because these titles were outside that queue.

Earlier translation fix: **2026-09-15**, `f0ceb8d72` — separate the
shared `unset-color` status from six UI removal buttons. Every
locale already has generic `remove-btn` and specific
`remove-background-image` action keys, so the buttons use those;
zgh's Arabic “Unset” status becomes native local not-set prose.
The source/negative, Jade, ledger, 234-locale and focused Chromium
UI checks pass (1 browser test). Ledger: **22,260**. The zgh
file has **140** Arabic-script values awaiting classification.

Earlier translation fix: **2026-09-15**, `87c049571` — replace eight
Arabic Tamazight board/visibility/watch and color popup labels.
Rename-board and three choose-color titles exactly reuse local
native labels; visibility/watch/set-color use native components.
Their full command grammar remains low confidence. Focused
positive/negative, ledger and 234-locale checks pass.
Ledger: **22,259**. The zgh file has **141** Arabic-script
values awaiting semantic classification. The shared `unset-color`
key still spans action buttons and status text and needs a
separate context-aware repair.

Earlier translation fix: **2026-09-15**, `79d58098f` — replace nine
Arabic Tamazight board-background color/image controls and popup
titles. Local native change-color, upload-background image,
add/remove and board-backdrop terms are reused; `URL` stays
technical. The previous board title said “screen background”;
the new title says board background. Full image/backdrop compound
grammar remains low confidence. Focused positive/negative,
ledger and 234-locale checks pass. Ledger: **22,251**.
The zgh file has **149** Arabic-script values awaiting
semantic classification.

Earlier translation fix: **2026-09-15**, `ada7e3533` — replace nine
Arabic/French Tamazight activity and show/notify messages. The
production UI uses `activity-sent` for a restored card and
`activity-excluded` for board-member removal, so those messages
now use the locale's native restore/remove verbs. Exact `%s`
tokens remain. Full clause grammar and the activity-notification
compound need fluent review. Focused production-source,
positive/negative, ledger and 234-locale checks pass.
Ledger: **22,242**. The zgh file has **158** Arabic-script
values awaiting semantic classification.

Earlier translation fix: **2026-09-15**, `f10daf2ae` — replace four
Arabic/French Tamazight active, inactive and admin status labels.
The replacements reuse native active-person, inactive-member and
status terms; isolated adjectives and full compound grammar remain
low confidence. Focused positive/negative, ledger and 234-locale
checks pass. Ledger: **22,233**. The zgh file has **166**
Arabic-script values awaiting semantic classification.

Earlier translation fix: **2026-09-15**, `65c667419` — replace three
French/Arabic Tamazight filter and sort control labels with local
native hide, list-without-cards, filter and sort terms. Complete
sentence grammar and masculine status agreement remain low
confidence. Focused positive/negative, ledger and 234-locale
checks pass. Ledger: **22,229**. The zgh file has **168**
Arabic-script values awaiting semantic classification.

Earlier translation fix: **2026-09-15**, `bea96680e` — replace two
mixed French/Arabic and Arabic Tamazight creator labels in the
filter and minicard settings with native local creator, filter and
minicard terms. Complete phrase grammar remains low confidence.
Focused positive/negative, ledger and 234-locale checks pass.
Ledger: **22,226**. The zgh file has **169** Arabic-script values
awaiting semantic classification.

Earlier translation fix: **2026-09-15**, `32c2d9575` — repair 15
Tamazight search operators and predicates. Ten reviewed one-word
search codes remain portable; native short status and description
terms replace French/Arabic seeds. Exact zgh fill exceptions protect
the codes while ordinary English prose still appears as missing.
Status nuances need fluent review. Focused, fill-negative, ledger and
234-locale checks pass. Ledger: **22,224**. The zgh file has **171**
Arabic-script values awaiting semantic classification. Two existing
native multiword operator names remain unparseable by the current
search grammar; they need a compatible parser/UI solution.

Earlier translation fix: **2026-09-15**, `c365e2cf6` — repair 13
Tamazight search-operator values seeded in Arabic or French. Native
full names reuse local terms; short syntax aliases use portable
`b`, `s`, `l` and `m` without collisions. The swimlane/path term
still needs fluent UI review. Focused parser-source, related-search,
ledger and 234-locale checks pass. Ledger: **22,209**. The zgh file
has **173** Arabic-script values awaiting semantic classification.

Earlier translation fix: **2026-09-15**, `d1c4a7290` — replace six
Arabic/French Tamazight board, page, list and swimlane labels with
locally established native terms. Exact `%s` placeholders survive.
Complete sentence grammar and the path/swimlane metaphor remain low
confidence pending native review. Focused, ledger and 234-locale
checks pass. Ledger: **22,196** at that commit. The zgh file then
contained **178** Arabic-script values needing classification, including
possible intentional abbreviations and symbols.

Earlier translation fix: **2026-09-15**, `e114ffde8` — replace French
Tamazight sky and Arabic gold/silver labels with native terms. IRCAM
directly glosses sky and gold; a Moroccan Berber dictionary attests
silver. Gold/silver metal nouns as CSS-color labels and silver's
standard spelling remain low confidence. Focused, ledger and 234-locale
checks pass. Ledger: **22,190**.

Earlier translation fix: **2026-09-15**, `06678678d` — replace French
Tamazight pink with IRCAM's exact color word and Arabic dark-green with
native green/dark components. The combined shade phrase remains low
confidence pending fluent review. Focused, ledger and 234-locale
checks pass. Ledger: **22,187**.

Earlier translation fix: **2026-09-15**, `ce5092966` — replace French
Tamazight `email-address` with a native address-and-email phrase
attested in MediaWiki's zgh software translation. Focused, ledger and
234-locale checks pass. The separate Arabic `email-addresses` value
remains in the wrong-language review queue. Ledger: **22,185**.

Earlier translation fix: **2026-09-15**, `6f14c9a8c` — replace the
Tigrinya blue word in Tigre's copied slate-blue label with the
corpus-glossed Tigre term. The technical slate loan and full compound
remain low confidence pending fluent review. Independently attested
red and black Tigre color labels are retained despite their matching
Tigrinya values. Focused, ledger and 234-locale checks pass.
Ledger: **22,184**; exact Tigre/Tigrinya overlap: **226**,
including **22** previously attested shared forms and **204** unclassified values.

Earlier translation fix: **2026-09-15**, `de0cc0ce4` — replace Tigre's
dark-green label copied from Tigrinya with a compound based on corpus
terms for dark and green. Focused and ledger checks pass. The complete
color compound remains low confidence pending fluent Tigre review.
Ledger: **22,183** records at that commit; exact Tigre/Tigrinya overlap:
**227**, with **205** full values then unclassified.

Earlier translation fix: **2026-09-15**, `ae76ba79d` — replace the
Tigrinya-copied noun in Tigre's DDP transport label with a
corpus-glossed Tigre term while preserving the technical identifier.
Focused, runtime, ledger and 234-locale checks pass. Ledger:
**22,182** records at that commit; exact Tigre/Tigrinya overlap: **228**, with
**206** full values then unclassified. Complete phrase grammar
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
2,613 non-English Tigre values, 226 are byte-for-byte identical to Tigrinya;
22 complete forms are corpus-attested shared terms and 204 full values remain
unclassified, including 18 of at least 20 characters and 2 of at least 35.
Four newly matching File phrases have a corpus-attested noun, but their full
clauses still need review. This is an
explicit broader wrong-language review item and must be resolved before the
full audit closes.

The [correction ledger](../../../releases/translations/audited-corrections.json)
records contain **22,831** exact before/after values, including unflagged
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
the pending table. Structural checks preserve exact English
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
  Email Addresses now uses IRCAM-attested `ansiwn` but its complete
  software compound remains open to native review.
  Arabic-script values have fallen from 181 to 102 across these batches;
  this count
  includes possible intentional symbols and is a review queue, not a
  count of proven wrong-language strings.
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
