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
