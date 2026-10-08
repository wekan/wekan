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

### Signed-in board visibility: six further locales

Filled `instance`, `instance-desc` and `board-instance-info` in Acehnese, Bambara, Ewe, Fulah, Fijian and Tongan: 18 English values. Direct drafts preserve the viewing/editing distinction and confirmation emphasis; the fill utility protected existing translations. No external translation service was used. Login terminology and grammatical agreement have lower confidence in this batch and need fluent-speaker review. Fijian usage of viewing and software-use vocabulary was checked against [published Fijian website terms](https://www.jw.org/fj/ivakavakayagataki/); the [Tongan coastal adaptation document](https://climatechange.gov.to/wp-content/uploads/2024/07/GCF-Tonga-Coastal-Adaptation-Project_Tongan-vs-English.pdf) provides examples of ability and change constructions. These references do not validate the complete drafts.

Extended the existing translation regression to these six locales. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in 24 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Buryat, Chuvash, Sakha and Northern Sámi

Filled three visibility strings in each of these four locales: 12 English placeholders. Direct drafts preserve signed-in viewing, anonymous exclusion, member-only editing and confirmation emphasis. The fill utility protected existing translations; no translation service was used. Grammar and technical wording have lower confidence, especially the Buryat, Chuvash and Sakha constructions, and fluent-speaker review remains open for all four locales.

Terminology references: [Buryat language help](https://buryadxelen.com/backend/web/burlang/default/help?id=9) uses `хэрэглэгшэ`; [Sakha parliamentary prose](https://www.sakhaparliament.ru/beliitike/il-tumenne/1791-2020-07-09-05-48-05) uses `туһанааччы`; the [Chuvash dictionary](https://ru.samahsar.chuvash.org/article/77189.link) illustrates the `усӑ куракан` construction; and the [Sámi Parliament login page](https://sametinget.no/stipenda-ja-darja/logg-inn-i-sametingets-tilskuddsportal/?sprak=12) uses `Logge sisa` and `geavaheaddji`. These are vocabulary references, not validation of the drafted sentences.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in 20 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Tibetan, Dzongkha and Kashmiri

Filled the three board visibility strings in these locales: nine English placeholders. Direct drafts retain viewing by signed-in users, exclusion of anonymous viewers, editing by board members and confirmation emphasis. Existing translations were protected by the fill utility; no translation service was used. These drafts have lower confidence in technical phrasing and grammatical agreement and need fluent-speaker review.

The Dzongkha login wording follows the existing locale and is also used by the [Bhutan Department of Local Governance](https://www.dlgdm.gov.bt/dlg_news_details/67?language=dz). Kashmiri login vocabulary is attested on the [Startup India Kashmiri page](https://www.startupindia.gov.in/kashmiri/content/sih/en/coming-soon.html). Tibetan wording is a direct draft. These references establish terminology only, not the correctness of the full translations.

Extended the existing translation regression to these three locales. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in 17 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Manx, Walloon and Aromanian

Filled three visibility strings in each locale: nine English placeholders. Direct drafts preserve signed-in viewing, anonymous exclusion, board-member editing and confirmation emphasis. The fill utility protected existing translations; no translation service was used. Technical phrasing and grammatical agreement have lower confidence and require fluent-speaker review, particularly Aromanian dialect choices and Manx mutations.

Vocabulary references include the [GNOME Manx translation](https://mail.gnome.org/archives/commits-list/2010-August/msg02179.html) for `ymmydeyr`, the [Walloon language forum](https://berdelaedje.walon.org/) for `uzeus` and `s' elodjî`, and [Vrabie's English–Aromanian dictionary](https://vivliuteca.org/wp-content/uploads/2025/06/an-english-aromanian-macedo-romanian-dictionary-society-farsharotu.pdf), whose EVERY, NEVER and ONLY entries inform the Aromanian quantifiers and restriction. These references do not validate the complete drafted sentences.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in 14 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Guaraní, Quechua and Aymara

Filled the three signed-in board visibility strings in these locales: nine English placeholders. Direct drafts retain the viewing/editing distinction, anonymous exclusion and confirmation emphasis. Existing translations were protected by the fill utility; no translation service was used. Login phrasing and grammatical agreement have lower confidence across the batch, including Quechua dialect choices; fluent-speaker review remains open.

References include the [GuaraniAyvu dictionary](https://www.guaraniayvu.com/) for viewing vocabulary, [ABC's Guaraní teaching material](https://www.abc.com.py/escolar/tercer-ciclo/guarani/2026/06/02/muanduhe-hai-jeporu/) for `moambue`, the [Quechua dictionary](https://www.illaa.org/pirwa/diccionarios/DicAMLQuechuaOrig.pdf) for viewing terminology, and the [Aymara introductory course](https://aymara.org/biblio/diccio_tarapaca.pdf) for `mantaña` and `uñjaña`. These references inform individual terms and do not validate the full drafted sentences.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in 11 locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Tigrinya and Klingon

Filled three visibility strings in each locale: six English placeholders. Direct drafts preserve the signed-in viewing condition, anonymous exclusion, editing restriction and confirmation emphasis. Existing translations were protected by the fill utility; no translation service was used. Technical login phrasing has lower confidence; Klingon relative-clause structure and the metaphor of entering the application also need fluent-speaker review.

Tigrinya login vocabulary follows [Telegram's Tigrinya localization](https://translations.telegram.org/tigrinya-ti/tdesktop/login/). Klingon viewing and restriction constructions were checked against the [Klingon Language Institute's sentence examples](https://www.kli.org/duolingo/identify-people/) and [Klingonska Akademien's adverb reference](https://klingonska.org/ref/adv.html). These references support vocabulary and grammar components, not the complete drafted sentences.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in nine locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Volapük

Filled the three Volapük board visibility strings, preserving confirmation emphasis and the viewing/editing distinction. Existing translations were protected by the fill utility; no translation service was used. The draft uses `nunädön oki` for login and the existing board term. [Midgley's English–Volapük dictionary](https://xn--volapk-7ya.com/EnVoDictionary-20100830.pdf) supplies vocabulary including `lüükön`, `jonön` and `te`. Person references and verb forms were reviewed during drafting, but technical phrasing and grammatical agreement remain lower-confidence and need fluent-speaker review.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in eight locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Veps

Filled three English placeholders in `ve-PP`, the Veps locale. The direct draft keeps the existing board term, uses entering the system for login, and preserves the viewing/editing distinction and confirmation emphasis. The fill utility protected existing translations; no translation service was used. Login phrasing, passive constructions and case endings have low confidence and require fluent-speaker review.

References include the [Veps dictionary inventory](https://kaikki.org/dictionary/Veps/words/lep--lo%C5%A1tta.html) for `ližata`, [Kodima](https://vepslaine.ru/wp-content/uploads/2025/08/Kodima-7-small.pdf) for `voib nähta`, and the [ELDIA Veps report](https://phaidra.univie.ac.at/detail/o%3A315545.pdf) for `nikonz`. These support individual terms and constructions, not the accuracy of the complete draft.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in seven locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Greenlandic

Filled three English placeholders in `kl`. The direct draft preserves viewing by signed-in users, anonymous exclusion, board-member editing and confirmation emphasis. The fill utility protected existing translations; no translation service was used. Login wording follows the `atuisutut`/`iser-` constructions in [MitID's Greenlandic guidance](https://www.mitid.dk/kl-gl/ikiortigit/hjaelpeuniversimi/mitid-mi-isumannaallisaanerit-pillugit-ilitsersuutit/). The board noun `allattarfik` is attested by the [Oqaasileriffik/University of Chicago dictionary](https://daka.gl/2018-kal-eng/). The existing `board` value `Ilisarnaat` needs a separate terminology review; it was not overwritten in this placeholder fill. Technical phrasing and inflection remain lower-confidence and need fluent-speaker review.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in six locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Nahuatl

Filled three English placeholders in `nah`. The direct draft preserves the signed-in viewing condition, anonymous exclusion, board-member editing and confirmation emphasis. It follows the locale's existing `tequitini` and `huapalli` terminology. Existing translations were protected by the fill utility; no translation service was used. Software terminology, the passive construction for added people and dialect consistency have low confidence and need fluent-speaker review.

References include the Oregon Nahuatl dictionary entries for [calaqui](https://nahuatl.wired-humanities.org/node/171978) and [tlalia](https://nahuatl.wired-humanities.org/content/tlalia), plus UNAM's [patla entry](https://gdn.iib.unam.mx/diccionario/patla/19409). These references support component vocabulary and do not validate the complete draft.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in five locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Standard Moroccan Tamazight

Filled three English placeholders in `zgh` using Tifinagh. The direct draft preserves signed-in viewing, anonymous exclusion, board-member editing and confirmation emphasis. Existing translations were protected by the fill utility; no translation service was used. The board noun follows the locale's `Tafelwit` in Tifinagh, and the viewing verb is documented in the [Tamazight dictionary entry for ⵥⵕ](https://zgh.wiktionary.org/wiki/%E2%B5%A5%E2%B5%95). Login phrasing, passive morphology and dialect consistency have low confidence and need fluent-speaker review; script correctness alone does not establish linguistic accuracy.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in four locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Inuktitut

Filled three English placeholders in `iu` using syllabics. The direct draft retains the viewing/editing distinction, anonymous exclusion and confirmation emphasis, with the existing board term. Existing translations were protected by the fill utility; no translation service was used. The editing vocabulary follows the locale's `Aaqqigiarli`, also attested in [the Inuktitut editing dictionary entry](https://es.glosbe.com/es/iu/modificar). Login phrasing, agreement, negation and the expression for adding people have low confidence and need fluent-speaker review; syllabic text alone does not prove linguistic accuracy.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in three locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Wolaytta

Filled three English placeholders in `wal`. The direct draft preserves signed-in viewing, anonymous exclusion, board-member editing and confirmation emphasis, following the existing board term. The fill utility protected existing translations; no translation service was used. [The Wolaytta Language](https://dokumen.pub/the-wolaytta-language.html) supplies roots for entering and seeing, while [Wakasa's grammar study](https://www.janestudies.org/wp-content/uploads/2018/files/NES_no19%282014%29_Wakasa.pdf) informs the negative construction. Login phrasing, negation, membership wording and the existing board noun have low confidence and need fluent-speaker review. These references do not validate the full draft.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English in two locales. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Tigre

Filled three English placeholders in `tig`. The direct draft preserves the signed-in viewing condition, anonymous exclusion, board-member editing and confirmation emphasis. Existing translations were protected by the fill utility; no translation service was used. [Omar M. Kekia's Tigre lessons](https://www.speaktigre.com/_files/ugd/7e068a_d791dde4087041feaf3dedb6b109829c.pdf?index=true) inform the `et` and `egl` constructions, negative prefix and `lieTa` restriction. Software vocabulary, relative clauses and verb agreement have low confidence and need fluent-speaker review. The shared Ethiopic script does not establish correctness or distinguish Tigre from Tigrinya by itself.

Extended the existing translation regression. Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. Each of the three source keys remains English only in Cherokee. The broader backlog remains 51,575 ordinary missing values and 171 pending source keys; language-quality review remains open.

### Signed-in board visibility: Cherokee and all-locale check

Filled the final three English placeholders in Cherokee. The draft uses the [Cherokee Language Consortium's 2024 word list](https://language.cherokee.org/media/vdiic5hr/2024consortium.pdf), including its login term, with the existing board terminology. No translation service was used; the fill utility protected existing translations. Relative clauses, membership wording, agreement and technical phrasing have low confidence and require fluent-speaker review. The word list supports individual vocabulary only, not the full drafted sentences.

All 234 non-English locales now have nonempty values different from English for `instance`, `instance-desc` and `board-instance-info`. Removed these three keys from the pending inventory, reducing it from 171 to 168. The existing board-visibility test now discovers every non-English locale and checks source key order, placeholder inventories, exact markup and rendered confirmation emphasis, plus pending-inventory absence. Its malformed-markup negative check remains in place.

Seven board-visibility tests, five permission checks, all 234 locale structure/token checks and 21 human-preference checks pass. The browser suite was syntax-checked only; the application stack is unavailable. The ordinary backlog remains 51,575 missing values across 70 languages, alongside 168 pending source keys. The broader goal and language-quality review remain open.

### Import warning report: ten further locales

Filled 30 English placeholders for the warning heading, explanation and open-board action in Moroccan Arabic (`ary`), Sorani (`ckb`), Kurmanji (`ku`), Bhojpuri (`bho`), Maithili (`mai`), Odia (`or_IN`), Konkani (`kok`), Turkmen (`tk_TM`), Tatar (`tt`) and Yiddish (`yi`). The fill utility preserved existing translations. No translation service was used. The explanation retains the created-board outcome, incomplete file transfer and two-arrow recovery-menu path.

Also replaced the Tatar menu values `Сорунлар` and `Куртарма` with `Проблемалар` and `Торгызу`: the old forms follow other Turkic wording rather than the declared Tatar locale. The report uses the corrected path, with regression assertions against the old vocabulary. Existing board nouns and other menu labels were followed where possible; some inherited terminology still needs review.

Vocabulary references include [Sorani ئاگاداری](https://ckb.wiktionary.org/wiki/ئاگاداری), [Konkani opening vocabulary](https://konkanivocabulary.in/category/इ,%20ई%20आनी%20उ%20अक्षरांचीं%20क्रियापदां), the [Turkmen-English dictionary](https://www.webonary.org/turkmen/files/sozluk.pdf) for warning terminology, and [Tatar usage of торгызу](https://ebook.tatar/default/files/documents/pdf/history-tat_10_tat_30-10-2020.pdf). These support individual words, not full-sentence accuracy. Konkani, Bhojpuri, Maithili, Turkmen and Kurdish technical phrasing have lower confidence; all drafts remain open to fluent-speaker review.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Added ten browser cases covering rejected malformed input, localized report text and opening the imported board. Browser tests were syntax-checked only. The local Playwright executable is missing and no application server is listening on port 3000, so browser execution and runner discovery were not verified. Each of the three source keys remains English in 56 locales. The ordinary backlog remains 51,575 values across 70 languages and the pending inventory remains 168 source keys.

### Import warning report: ten African locale files

Filled 30 English placeholders for the warning heading, explanation and open-board action in Somali (`so`), Oromo (`om`), Kinyarwanda (`rw`), Kirundi (`rn`), Chichewa (`ny`), Sesotho (`st`), Setswana (`tn`), Northern Sotho (`nso`) and both Zulu locales (`zu`, `zu-ZA`). Existing translations were protected by the fill utility; no translation service was used. The description retains the created-board outcome, incomplete file transfer and recovery-menu path, using existing menu labels.

Vocabulary references include [Oromo LibreOffice help](https://help.libreoffice.org/latest/om/text/swriter/01/04120250.html) for file/input terminology, [Kirundi warning usage](https://www.healthvermont.gov/sites/default/files/documents/pdf/ENV-RW-cyanobacteria-sign-alert-Kirundi.pdf), and a [Sesotho emergency-preparedness guide](https://saiia.org.za/wp-content/uploads/2023/11/SAIIA-UNICEF-Emergency-Preparedness-Guide-SESOTHO-LOW-RES.pdf) for warning terminology. These references support words, not full sentences. Oromo, Kirundi, Chichewa and Northern Sotho technical phrasing and agreement have lower confidence; the full batch remains open to fluent-speaker review. Existing recovery and board terminology also requires broader review.

Extended the existing import translation and browser cases to these ten locales. Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Browser cases were syntax-checked only; execution remains unverified because the local Playwright executable and running application are unavailable. Each of these three source keys remains English in 46 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: eight further locales and five menu repairs

Filled 24 English placeholders in Bislama (`bi`), Tok Pisin (`tpi`), Māori (`mi`), Samoan (`sm`), Hawaiian (`haw`), Papiamentu (`pap`), Xhosa (`xh`) and Northern Ndebele (`nd`). The fill utility protected existing translations; no translation service was used. The description preserves the completed board creation, incomplete transfer and recovery report location.

Corrected five bad menu values directly: Bislama `Tok blong sistem: Problems` and `Tok blong sistem: Recovery` become `Ol problem` and `Putumbak`; Tok Pisin `Toksave: Recovery` becomes `Putim bek`; Hawaiian `palopalemaka` and `lekolelawa` become `Nā pilikia` and `Hoʻihoʻi`. Prefixing English with local-language text was not a translation. The malformed Hawaiian forms were replaced with attested vocabulary. Regression assertions check the replacements, reject the old text and require the report's menu path to match these labels.

References include [Te Aka's warning entry](https://maoridictionary.co.nz/word/9971), [Tok Pisin lukaut](https://tokpisin.info/lukaut/), [Hawaiian pilikia](https://hilo.hawaii.edu/wehe/?q=pilikia), [Hawaiian return/restore vocabulary](https://wehe.hilo.hawaii.edu/?q=return), and [Papiamentu warning usage](https://papiamentu.rijksdienstcn.com/aktual/notisia/2026/ougustus/07/atvertensia-mensahe-falsu-tokante-bishita-na-kas-ta-sirkula). These support words rather than validating the full drafts. Samoan, Hawaiian, Papiamentu and Northern Ndebele technical phrasing and agreement have lower confidence; all drafts remain open to fluent-speaker review.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended the existing browser cases to eight more locales; they were syntax-checked only because the local Playwright executable and running application are unavailable. Each of the three source keys remains English in 38 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: eight locales and recovery-path repairs

Filled 24 English placeholders in Akan (`ak`), Luganda (`lg`), Wolof (`wo`), Swati (`ss`), Tsonga (`ts`), Venda (`ve`), Waray (`wa-RR`) and Venetian (`ve-CC`). The fill utility protected existing translations; no translation service was used. The warning and description preserve successful board creation, incomplete transfer and the recovery-report location.

Corrected eleven menu values directly: Akan's repeated generic sentence becomes distinct problems/recovery labels; Tsonga's repeated `Hi Xitsonga: mhaka` filler becomes `Swiphiqo` and `Ku vuyisela`; Venda's Zulu administration label and unsuitable recovery term become `Phanele ya mulanguli` and `U vhuedzedza`; Waray's French administration and Walloon problems/recovery labels become Waray labels; Venetian's Venda problems/recovery values become `Problemi` and `Recupero`. The new regression checks require matching full menu paths, distinct problems/recovery labels and absence of the known bad wording.

Vocabulary references include the [Luganda dictionary](https://learnluganda.com/concise), [Akan warning/problem usage](https://www.jw.org/tw/nhomakorabea/ns%C9%9Bmma-nhoma/w19930301/So-Wubetie-Onyankop%C9%94n-K%C9%94k%C9%94b%C9%94/), [Venda recovery wording](https://www.gov.za/ve/services/services-residents/travel-outside-sa/tshumelo-dza-vhuimeli), and [Waray restoration usage](https://www.jw.org/war/librarya/magasin/w20000901/Hirani-Na-An-mga-Panahon-han-Pagpahiuli/). These support individual vocabulary, not full drafted sentences. Wolof, Swati, Venda, Waray and Venetian technical phrasing and agreement have lower confidence; all drafts and inherited board terminology remain open to fluent-speaker review.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended the browser cases to eight more locales; they were syntax-checked only because the local Playwright executable and running application are unavailable. Each of the three source keys remains English in 30 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: six further locales

Filled 18 English placeholders in Acehnese (`ace`), Bambara (`bm`), Ewe (`ee`), Fulah (`ff`), Fijian (`fj`) and Tongan (`to`). The fill utility protected existing translations; no translation service was used. The description preserves the created-board outcome, incomplete transfer and recovery-report location. Replaced Tongan `Faka-Tonga: Problems` and `Faka-Tonga: Recovery` with `Ngaahi palopalema` and `Fakafoki`; the local-language prefix did not translate the English menu names. Regression checks reject those old values and verify the report's recovery path.

References include the [Bambara lexicon](https://mooreburkina.com/sites/www.mooreburkina.com/files/pdf-files/Bambara%20Lexicon.pdf) for `lasɔmili`, an [Ewe vocabulary list](https://www.peterlin.pl/ewe/words.html), the [Fulfulde-French dictionary](https://fr.scribd.com/document/349770134/Dicionnaire-Fulfulde-Francais) for `jertinaango`, the [Fijian-English dictionary](https://traditionalfijiansongs.wordpress.com/wp-content/uploads/2019/05/fijian-english-dictionary.pdf) for advice vocabulary, and [Tongan warning/return usage](https://schoolsequella.det.nsw.edu.au/file/3d7dcb81-35e4-4cf9-bcd5-1e84fc193ff1/1/tongan.pdf). These establish individual terms rather than validating the full drafts. Acehnese, Bambara, Ewe and Fulah technical phrasing and agreement have low confidence; all six drafts and inherited board/menu vocabulary remain open to fluent-speaker review.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended the browser cases to six more locales; they were syntax-checked only because the local Playwright executable and running application are unavailable. Each of the three source keys remains English in 24 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Buryat, Chuvash, Sakha and Northern Sámi

Filled twelve English placeholders in `bua`, `cv`, `sah` and `se`. The fill utility protected existing translations; no translation service was used. The drafts retain board creation, incomplete transfer and the two-arrow recovery-menu path using existing menu terminology.

Vocabulary references include [Buryat warning usage](https://www.stepbible.org/?q=version%3DBxrBBL2024%40reference%3DPro.1), the [Chuvash-Russian dictionary](https://elbib.nbchr.ru/lib_files/0/kchy_0_0000117.pdf) for `асӑрхаттару`, [Sakha сэрэтии](https://sakhatyla.ru/translate?q=сэрэтии), and the [Northern Sámi-English vocabulary](https://www.scribd.com/document/400707253/Makarainen-K-Sami-English-vocabulary-pdf) for `váruhus`. The references support vocabulary, not full-sentence accuracy. All four drafts have low-confidence case endings, passive/negative constructions and technical phrasing that need fluent-speaker review. Shared Cyrillic script does not prove Buryat, Chuvash or Sakha correctness.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended the browser cases to these four locales; they were syntax-checked only because the local Playwright executable and running application are unavailable. Each of the three source keys remains English in 20 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Tibetan, Dzongkha and Kashmiri

Filled nine English placeholders in `bo`, `dz` and `ks`. The fill utility protected existing translations; no translation service was used. The drafts retain board creation, incomplete file transfer and the two-arrow recovery-menu path using existing terminology. Tibetan and Dzongkha use different verb constructions despite sharing a script.

The [official English-Dzongkha pocket dictionary](https://www.dzongkha.gov.bt/uploads/files/publications/English-Dzongkha_Pocket_Dictionary_fcbe977ea0f17fa3c90a8cd9a0b6c4f1.pdf) supports the warning term. Tibetan follows the existing import terminology. The attempted Kashmiri administrative terminology PDF was inaccessible, and a dictionary search hit for “Warning!” referred to an OCR notice rather than a translated entry; neither is evidence for the drafted Kashmiri warning wording. Kashmiri relies on existing locale usage and direct composition. All three drafts have low-confidence technical phrasing and grammatical agreement requiring fluent-speaker review; the existing Dzongkha board noun also remains a review item.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended browser cases to these three locales; they were syntax-checked only because the local Playwright executable and running application are unavailable. Each source key remains English in 17 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Manx, Walloon and Aromanian

Filled nine English placeholders in `gv`, `wa` and `rup`. The fill utility protected existing translations; no translation service was used. The description retains board creation, incomplete transfer and the two-arrow recovery path using existing menu labels.

The [Manx raaue entry](https://en.wiktionary.org/wiki/raaue) supplies the warning noun and plural. The [English-Aromanian dictionary](https://vivliuteca.org/wp-content/uploads/2025/06/an-english-aromanian-macedo-romanian-dictionary-society-farsharotu.pdf) supplies warning and opening verb roots; the composed warning noun and inflections are provisional. Walloon search results included automatically translated sites and do not establish native-speaker validation. All three drafts have low-confidence technical phrasing, particularly Walloon import terminology, Aromanian derivation/agreement and Manx passive phrasing, requiring fluent-speaker review. Existing menu terminology remains open to broader review.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended browser cases to these three locales; they were syntax-checked only because the local Playwright executable and running application are unavailable. Each of the three source keys remains English in 14 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Guarani, Quechua and Aymara

Filled nine English placeholders in `gn`, `qu` and `ay`. The fill utility protected existing translations; no translation service was used. The drafts retain board creation, incomplete transfer and the two-arrow recovery-report path. Replaced four prefixed-English menu values: Quechua `Kay willaymi: Problemsta` and `Kay willaymi: Recoveryta` become `Sasachakuykuna` and `Kutichiy`; Aymara `Aymar aruna: Problems` and `Aymar aruna: Recovery` become `Jan waltʼäwinaka` and `Kuttʼayaña`. Regression checks reject the old filler and require matching, distinct menu labels.

Vocabulary references include [Guarani usage from the language-policy secretariat](https://spl.gov.py/files/Guarani%20comunicativo/Propuestas_de_Expresiones_en_Guarani.pdf), the [Quechua-Spanish dictionary](https://fcctp.usmp.edu.pe/librosfcctp/DICCIONARIO-Quechua-espanol-VOL_2.pdf) for report/notice vocabulary, and the [multilingual Arusimiñee dictionary](https://www.illaa.org/pirwa/diccionarios/arusiminee.pdf) for Aymara advice terminology. These support individual words, not full-sentence correctness. All three drafts have low-confidence technical nouns, incomplete-transfer clauses and inflection requiring fluent-speaker review; existing board/menu wording remains open to broader review.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended browser cases to these three locales; they were syntax-checked only because the local Playwright executable and running application are unavailable. Each source key remains English in 11 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Tigrinya and Klingon

Filled six English placeholders in `ti` and `tlh`. The fill utility protected existing translations; no translation service was used. The drafts retain board creation, incomplete transfer and the two-arrow recovery-report path. Klingon uses an explicit system subject in the failed-transfer clause rather than combining the incompatible `-laH` and `-luʼ` suffixes.

References include [Tigrinya warning usage](https://www.lni.wa.gov/safety-health/preventing-injuries-illnesses/hazardalerts/BusDriverHazardAlertTigrinya_Web.pdf) and the [Klingon Language Institute's alert entry](https://lists.kli.org/archives/list/tlhingan-hol%40lists.kli.org/thread/SK2LYBSBELRGXPUOWRHGNJI2R3E3LWO4/). These support vocabulary, not full-sentence correctness. Both drafts have low-confidence technical phrasing and agreement requiring fluent-speaker review. Klingon expresses importing through acquisition and the retained report through its information; these paraphrases and the existing menu terminology need particular review.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended browser cases to both locales; they were syntax-checked only because the local Playwright executable and running application are unavailable. Each source key remains English in nine locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Volapük

Filled three English placeholders in `vo`. The fill utility protected existing translations; no translation service was used. The [English-Volapük dictionary](https://xn--volapk-7ya.com/EnVoDictionary-20100830.pdf) supplies `nuned` (warning), `nüveigön` (import), `ragiv` (computer file), `nunod` (report), `jafön` (create), `kipön` (retain) and `maifükön` (open). These support the vocabulary, not the complete sentences. Passive tense, agreement and technical use of the import verb have low confidence and need fluent-speaker review. Existing menu terminology remains a broader review item.

Ten translation/token regressions, import-loss positive/negative checks, all 234 locale structure checks and 21 human-preference checks pass. Extended the browser case to Volapük; it was syntax-checked only because the local Playwright executable and running application are unavailable. Each source key remains English in eight locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Veps

Filled three English placeholders in `ve-PP` and corrected the Venda recovery-menu seed `U wanululwa` to Veps `Endištand`. The fill utility protected existing non-English translations; the wrong-language correction was applied separately. The description retains board creation, incomplete transfer and a matching recovery-menu path. The heading paraphrases warnings as reported problems.

The [Noid Veps-English dictionary](https://vepsnoid.blogspot.com/p/dictionary.html) supplies opening, bringing and keeping verbs. Wiktionary supplies [tedotuz (report)](https://en.wiktionary.org/wiki/tedotuz) and [endištada (restore)](https://en.wiktionary.org/wiki/endi%C5%A1tada); the latter also matches the existing restore control. These support individual words, not the complete sentences. Full clauses, inflection, the derived recovery noun and the warning paraphrase remain low confidence and need fluent-speaker review. Other wrong-language seeds in this locale remain in the broader review queue.

The translation/token, import-loss positive/negative and 234-locale structure suites pass (12 tests combined), as do 21 human-preference checks. Extended the browser case to Veps and syntax-checked it; browser execution remains unavailable because the local Playwright executable and running application are absent. Each source key remains English in seven locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Greenlandic and Nahuatl

Filled six English placeholders in `kl` and `nah`, preserving existing non-English values through the fill utility. Descriptions retain board creation, incomplete transfer and the recovery-menu path. Greenlandic uses `allattarfik`, consistent with its recent board-visibility descriptions; the older `board` label and import instructions still use `ilisarnaat` and remain in the broader terminology-review queue.

The [Greenlandic-English dictionary](https://daka.gl/2018-kal-eng/) supplies `aarlerisaarut` (warning) and `allattarfik` (blackboard); [Greenland government publications](https://naalakkersuisut.gl/publikationer?sc_lang=kl-GL) attest `nalunaarusiaq` for reports. UNAM's dictionary supplies Nahuatl [tenonotzaliztli](https://gdn.iib.unam.mx/diccionario/tenonotzaliztli/275458) (advice/admonition) and [tlanonotzaliztli](https://gdn.iib.unam.mx/diccionario/tlanonotzaliztli/70386) (account/information). These establish vocabulary, not complete-sentence accuracy. Both drafts have low-confidence software terminology and inflection; the Nahuatl warning paraphrase and incomplete-transfer clause particularly need fluent-speaker review.

Translation/token, import-loss positive/negative and all 234 locale structure suites pass (12 tests combined), as do 21 human-preference checks. Extended both browser cases and syntax-checked them; execution remains unavailable without the local Playwright executable and running application. Each source key remains English in five locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Wolaytta

Filled three English placeholders in `wal` and replaced the prefixed-English menu labels `Wolayttatto: Problems` and `Wolayttatto: Recovery` with `Metota` and `Zaaruwaa`. Existing non-English values were protected by the fill utility; the two wrong-language corrections were applied separately. Regression checks reject the old fillers and require the description to contain the actual recovery-menu path.

[Wakasa's Wolaytta grammatical survey](https://www.janestudies.org/wp-content/uploads/2018/files/NES_no19%282014%29_Wakasa.pdf) attests the `dooy-` opening verb and locative/comitative postpositions. The [advice entry](https://en.wiktionary.org/wiki/advice) gives Wolaytta `zoriya`; the [Wolayttattuwa phrasebook](https://en.wikivoyage.org/wiki/Wolayttattuwa_phrasebook) attests problem vocabulary in `Metoy baawa`. These support individual roots, not full-sentence accuracy. The warning heading uses advice terminology and the report is expressed as what was reported; these paraphrases, software nouns, passive wording and recovery nominalization remain low confidence and need fluent-speaker review. Many other prefixed-English values in this locale remain in the broader review queue.

Translation/token, import-loss positive/negative and 234-locale structure suites pass (12 tests combined), as do 21 human-preference checks. Extended the Wolaytta browser case and syntax-checked it; execution remains unavailable without the local Playwright executable and running application. Each source key remains English in four locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Inuktitut

Filled three English placeholders in `iu`, preserving existing non-English values through the fill utility. The messages retain board creation, incomplete transfer and the recovery-menu path. Vocabulary references include a [Nunavut advisory](https://www.gov.nu.ca/iu/pivalliajut/ujjiqsuqujijjuti-nuvagjuarnaq-19-taqalirningani-uqsuqtuurmi-2026-01-03) for warning terminology, a [Nunavut Legislative Assembly transcript](https://assembly.nu.ca/sites/default/files/2023-02/20221108%20Blues%20Inuktitut.pdf) for report/document nouns, and a [Qikiqtani Industries lesson](https://trainingnunavut.ca/iu/lessons/lesson-1/) for the opening instruction. These support individual vocabulary, not full-sentence accuracy. Inflection, import terminology and the failed-transfer clause remain low confidence and need fluent-speaker review.

Translation/token, import-loss positive/negative and all 234 locale structure suites pass (12 tests combined), as do 21 human-preference checks. Extended the Inuktitut browser case and syntax-checked it; execution remains unavailable without the local Playwright executable and running application. Each source key remains English in three locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Standard Moroccan Tamazight

Filled three English placeholders in `zgh` and replaced the Arabic Admin Panel label `لوحة التحكم` with `ⵜⴰⴼⵍⵡⵉⵜ ⵏ ⵓⵎⵙⵙⵓⴳⵓⵔ`, composed from existing board/panel and administrator terminology. The fill utility protected existing non-English values; the wrong-language correction was applied separately. Regression checks require the report's path to match the actual menu labels, require Tifinagh and reject Arabic-script text in these four values.

The [IRCAM Amazigh-French-Arabic dictionary](https://www.ircam.ma/sites/default/files/2021-02/amz_fr_ar.pdf) attests `ⴰⵙⵎⵉⴳⵍ` for advice/warning. A [Moroccan finance ministry report](https://www.finances.gov.ma/Publication/db/2025/Syntheese-Rap-EEPLF2025.pdf) attests `ⴰⵏⵇⵇⵉⵙ` for report, also present in the locale. These establish individual words, not complete-sentence accuracy. Passive inflection, plural warning terminology, software import terminology and the new menu compound remain low confidence and need fluent-speaker review. Existing recovery terminology and other wrong-language/mixed-dialect values remain in the broader review queue.

Translation/token, import-loss positive/negative and 234-locale structure suites pass (12 tests combined), as do 21 human-preference checks. Extended the Tamazight browser case and syntax-checked it; execution remains unavailable without the local Playwright executable and running application. Each source key remains English in two locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Tigre

Filled three English placeholders in `tig` and replaced the Tigrinya Admin Panel wording `ናይ መምሕዳር ሰሌዳ` with `ምዱድ ለሓክም`, using existing board/panel and administrator nouns. The fill utility protected existing non-English values; the wrong-language correction was applied separately. Regression checks reject the former menu phrase and require a matching recovery path.

[Beurmann's Tigre vocabulary](https://www.speaktigre.com/_files/ugd/7e068a_a5fbea1fb5e544e69d94cab002762da2.pdf?index=true), printed page 35, gives the opening root; [Tigre Studies in the 21st Century](https://www.speaktigre.com/_files/ugd/7e068a_b8160a06029949149ec728daaac5b9b4.pdf?index=true) has native usage of `ተቅሪር` for a report. These support individual vocabulary, not full-sentence accuracy. The heading paraphrases warnings as problems. Passive forms, agreement, the incomplete-transfer clause and the administrator compound remain low confidence and need fluent-speaker review. Existing administrator/recovery terminology and other possible Tigrinya seeds remain in the broader review queue. A separately found generated parallel-corpus phrasebook was not used as native validation.

Translation/token, import-loss positive/negative and 234-locale structure suites pass (12 tests combined), as do 21 human-preference checks. Extended the Tigre browser case and syntax-checked it; execution remains unavailable without the local Playwright executable and running application. Each source key remains English in Cherokee only. The broader backlog remains 51,575 ordinary missing values across 70 languages and 168 pending source keys.

### Import warning report: Cherokee and all-locale coverage

Filled the last three English placeholders in `chr` with the fill utility, preserving existing non-English values. The [Cherokee Language Consortium word list](https://language.cherokee.org/media/vdiic5hr/2024consortium.pdf), page 76, supplies the report expression. The [Cherokee Nation-hosted vocabulary](https://language.cherokee.org/media/ykahxw4v/oudictionaryeuglutan.pdf) supplies the imperative opening root (`hisduʔi`); its legacy-font text extraction is imperfect, so the syllabary rendering requires review. The heading paraphrases warnings as problems. Full sentences, passive insertion terminology, part/file phrasing and use of the report expression as a software noun remain low confidence and need fluent-speaker review.

All 234 non-English locale paths now have nonempty, non-English values for the three import-report keys. Expanded the existing regression from its explicit batch list to every non-English file, checking source order, exact placeholder inventories, distinct heading/action values and two navigation separators. Hebrew and Persian legitimately use left-pointing arrows; the regression accepts either arrow direction without changing their translations. Removed these three keys from the pending inventory, now **165** source keys. This records placeholder coverage, not linguistic validation or completion of the broader goal.

Translation/token, import-loss positive/negative and all-locale structural suites pass (12 tests combined), as do 21 human-preference checks. Added Cherokee to the existing browser cases and syntax-checked the file; browser execution remains unavailable without the local Playwright executable and running application. A fresh missing-value report still counts **51,575** ordinary English values across **70** languages. Wrong-language and low-confidence wording throughout the catalogs remains under review.

### History recovery: Kurmanji, Sorani, Tatar, Turkmen and Yiddish

Filled 25 English placeholders in `ku`, `ckb`, `tt`, `tk_TM` and `yi` using the protected fill utility. The five messages distinguish pending undo from pending redo, explain that retry resends the same request without undoing a second change, and distinguish retry from forgetting the request. The UI and request implementation were checked before drafting. Turkmen retry wording is also attested on the [Türkmenhimiýa site](https://turkmenhimiya.gov.tm/news/novye-gorizonty-sotrudnichestva). Full clauses, particularly the undo/redo terminology in Sorani, Kurmanji and Yiddish, remain provisional and need fluent-speaker review; passing structural tests does not validate language quality.

Extended the translation/token regression and parameterized the existing browser scenario for English and these five locales, checking exact localized pending messages, the safety explanation and both buttons while retaining retry/forget behavior and wrong-board/expired-request negative cases. Translation, recovery-notice, request logic and 234-locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. The five source keys remain English in 61 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Moroccan Arabic, Bhojpuri, Maithili, Odia and Konkani

Filled 25 English placeholders in `ary`, `bho`, `mai`, `or_IN` and `kok` using the protected fill utility. The drafts distinguish undo from redo and retry from forgetting the pending request, and retain the explanation that retry cannot undo a second change. Konkani button wording follows the existing infinitive-style controls. Searches for Odia/Konkani software glossary examples did not yield usable references; the drafts are direct translations, not externally validated terminology. Full clauses and technical terms remain provisional, particularly Bhojpuri/Maithili request phrasing and Konkani tense/negation, and need fluent-speaker review.

Extended the translation/token regression and existing localized browser scenario to all five locales. Translation, recovery-notice, request logic and 234-locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 56 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Somali, Oromo, Kinyarwanda, Kirundi and Chichewa

Filled 25 English placeholders in `so`, `om`, `rw`, `rn` and `ny` with the protected fill utility. The drafts distinguish undo from redo and retry from forgetting, retaining the explanation that repeating the request cannot undo another change. Oromo undo terminology follows [LibreOffice's Oromo undo help](https://help.libreoffice.org/latest/om/text/shared/01/02010000.html), whose translated passages use `Gaabbii`; that partially translated source supports the term, not these full sentences. Full clauses and technical terms remain provisional, especially the Oromo redo construction and Kinyarwanda/Kirundi reversal wording, and need fluent-speaker review.

Extended the translation/token regression and existing localized browser scenario to these five locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 51 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Southern Sotho, Tswana, Northern Sotho, Zulu and Xhosa

Filled 30 English placeholders in `st`, `tn`, `nso`, `zu`, `zu-ZA` and `xh` with the protected fill utility. The drafts distinguish reversing the last change from doing it again and retain the explanation that retry repeats the same request without reversing a second change. Both Zulu variants use the same wording. Targeted searches for Northern Sotho/Zulu software glossary entries returned no usable reference; these are direct drafts, not externally validated translations. Complete clauses, agreement and undo/redo terminology remain provisional and need fluent-speaker review.

Extended the translation/token regression and existing localized browser scenario to all six locale paths. Translation, recovery-notice, request logic and 234-locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 45 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Swati, Ndebele, Tsonga and Venda

Filled 20 English placeholders in `ss`, `nd`, `ts` and `ve` with the protected fill utility. The drafts distinguish undo/redo and retry/forget, and explain that resending the same request cannot undo a second change. Vocabulary references include [Tsonga educational material](https://www.education.gov.za/Portals/0/CD/GET/doc/Xitsonga_Ririmi_Sungula.pdf?ver=2007-07-09-103114-000) using retry/trying vocabulary and a [Venda workbook](https://www.education.gov.za/Portals/0/Documents/Manuals/2026%20Workbooks/Literacy%20vol%201/grade%205/Lit%20venda%20gr5%20vol1%20lowres.pdf?ver=2026-01-19-213458-000) using `Lingedzani`. These establish vocabulary usage, not the composed software sentences. Full clauses, agreement and undo/redo wording remain provisional, particularly Swati/Ndebele technical phrasing, and need fluent-speaker review.

Extended the translation/token regression and existing localized browser scenario to the four locales. Translation, recovery-notice, request logic and 234-locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 41 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Bislama, Tok Pisin, Māori and Samoan

Filled 20 English placeholders in `bi`, `tpi`, `mi` and `sm` with the protected fill utility. The drafts distinguish reversing a change from doing it again, and retain the explanation that repeating the same request cannot reverse a second change. [Te Aka's whakakore entry](https://maoridictionary.co.nz/word/9547) includes undo among its senses; this supports the root, not the full Māori sentences. Undo/redo nominalization, request terminology and full clauses remain provisional in these four drafts and need fluent-speaker review.

Extended the translation/token regression and existing localized browser scenario to the four locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 37 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Papiamentu, Walloon, Acehnese and Hawaiian

Filled 20 English placeholders in `pap`, `wa`, `ace` and `haw` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. Vocabulary references include [the Walloon dictionary's retry entry](https://dtw.walon.org/index.php?query=say%C3%AE&type=artike), [Acehnese tuwo](https://www.kamusdaerah.com/aceh-indonesia/tuwo), [Kouwenberg and Murray's Papiamentu grammar](https://theswissbay.ch/pdf/Books/Linguistics/Mega%20linguistics%20pack/Creoles/Papiamentu%20%28Kouwenberg%20%26%20Murray%29.pdf) for `deshasí` (undo), and [Hitchcock's English-Hawaiian dictionary](https://upload.wikimedia.org/wikipedia/commons/5/56/An_English-Hawaiian_dictionary%3B_%28IA_englishhawaiiand00hitc%29.pdf) for confirmation vocabulary. These support individual terms, not the composed software sentences. Full clauses remain provisional, especially Walloon nominalizations, Acehnese technical phrasing and the Hawaiian distinction between removing a change and undoing it, and need fluent-speaker review.

Extended the translation/token regression and existing localized browser scenario to the four locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 33 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Waray, Fijian, Tongan, Luganda and Wolof

Filled 25 English placeholders in `wa-RR`, `fj`, `to`, `lg` and `wo` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. Vocabulary references include [the Waray corpus dictionary](https://dictionary.corporaproject.org/index.php?glossary=H&sort=word) for requesting/forgetting, [Unitec's Fijian dictionary](https://www.unitec.ac.nz/umisc/jmctest/fijian_english_dictionary/fijian_eng_dict.html) for trying/again, [NZQA's Tongan text](https://www2.nzqa.govt.nz/assets/Tertiary/The-Code/Learners/5415_NZQA_Code-Summaries-Tertiary_TONGAN_v3.pdf) for request/confirmation usage, [Luganda kakasa](https://ennyimba.ug/tools/luganda-dictionary?direction=en&q=prove), and [the Wolof phrase dictionary](https://www.wolofresources.org/language/download/lexicarry_plus.pdf) for trying/forgetting. These support individual terms, not the composed software sentences. Full clauses, technical borrowings and undo/redo nominalizations remain provisional and need fluent-speaker review.

Extended the translation/token regression and existing localized browser scenario to the five locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 28 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys. Existing unrelated seed problems, including prefixed-English Tongan and Luganda labels, remain part of the broader language audit.

### History recovery: Buryat, Chuvash and Sakha

Filled 15 English placeholders in `bua`, `cv` and `sah` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [Buryat published usage](https://burunen.ru/files/159096/) of confirmation/forgetting vocabulary, [Chuvash usage](https://chuvash.su/news/23261.html) of confirmation/again vocabulary, and [Sakha WordPress translations](https://translate.wordpress.com/projects/wpcom/sah/default/?filters%5Boriginal_id%5D=209404&filters%5Bstatus%5D=either&sort%5Bby%5D=translation_date_added&sort%5Bhow%5D=asc) using confirmation terminology. These support individual terms, not the composed software sentences. Full clauses, inflections and undo/redo nominalizations are low-confidence drafts and need fluent-speaker review; Cyrillic text alone does not demonstrate the right language or meaning.

Extended the translation/token regression and existing localized browser scenario to the three locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 25 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Tibetan, Dzongkha and Tigrinya

Filled 15 English placeholders in `bo`, `dz` and `ti` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [Wisconsin's Tibetan software guidance](https://hr.wisc.edu/docs/cls/whatsapp-best-practices-tibetan.pdf) for confirmation phrasing and [Geez Experience's Tigrinya dictionary](https://www.geezexperience.com/?dr=0&searchkey=forget) for forgetting vocabulary. The [Dzongkha Development Commission dictionary](https://www.dzongkha.gov.bt/dz/publications/title/english-dzongkha-pocket-dictionary) was located, but its PDF fetch timed out, so it does not verify the drafted terms. Full clauses, undo/redo wording and Dzongkha technical terminology remain low-confidence drafts for fluent-speaker review. Shared script does not establish that Tibetan and Dzongkha wording is interchangeable.

Extended the translation/token regression and existing localized browser scenario to the three locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 22 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Manx, Venetian and Aromanian

Filled 15 English placeholders in `gv`, `ve-CC` and `rup` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [the Manx dictionary](https://archive.gaelg.im/www.gaelg.iofm.net/DICTIONARY/maneng.pdf) for forgetting vocabulary, [the Venetian desmentegarse entry](https://kaikki.org/dictionary/All%20languages%20combined/meaning/d/de/desmentegarse.html), and [the Society Farsharotu dictionary](https://vivliuteca.org/wp-content/uploads/2025/06/an-english-aromanian-macedo-romanian-dictionary-society-farsharotu.pdf), in its forgetting and reversal entries. These establish roots, not the composed clauses. Full sentences, Manx mutations, Venetian technical nominalizations and Aromanian inflection/orthography remain low-confidence drafts for fluent-speaker review. Existing French, Italian and Zulu seed problems in unrelated Aromanian/Venetian labels remain unfinished audit work.

Extended the translation/token regression and existing localized browser scenario to the three locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 19 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Akan, Ewe and Bambara

Filled 15 English placeholders in `ak`, `ee` and `bm` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [the Akan dictionary](https://www.akandictionary.com/2021/05/01/awerefire/) for forgetting vocabulary, [Basic Ewe](https://philtypo3.uni-koeln.de/sites/inst_afrika/pdf/BASIC_EWE_2nd_ed.pdf) for return vocabulary, and [Bambara sègin](https://kemelang.com/bambara/s%C3%A8gin/) for returning. These support individual roots, not the composed software sentences. Full clauses and technical terminology, especially the Ewe undo expression and Bambara confirmation wording, remain low-confidence drafts for fluent-speaker review. Unrelated generic Akan filler labels remain part of the broader quality audit.

Extended the translation/token regression and existing localized browser scenario to the three locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 16 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Quechua, Aymara and Guarani

Filled 15 English placeholders in `qu`, `ay` and `gn` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [the Quechua dictionary](https://www.illaa.org/pirwa/diccionarios/DicQuechuaBolivia.pdf) for return vocabulary, [Peru's Aymara teaching vocabulary](https://cdn.www.gob.pe/uploads/document/file/4973488/item_55_vocabulario_aymara.pdf?v=1692022988) for request terminology, and [the Guarani dictionary](https://www.mec.gob.ar/descargas/Bibliograf%C3%ADa/Educaci%C3%B3n%20Intercultural%20Biling%C3%BCe/GUARANI/avane-Diccionario-Guarani-Esp-Esp-Guarani.pdf) for forgetting vocabulary. These support individual roots, not the composed software sentences. Full clauses, dialect choices, server/confirmation terminology and undo/redo wording remain low-confidence drafts for fluent-speaker review. Existing prefixed-English Quechua/Aymara labels remain unfinished audit work.

Extended the translation/token regression and existing localized browser scenario to the three locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 13 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Northern Sámi, Fulah and Kashmiri

Filled 15 English placeholders in `se`, `ff` and `ks` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [Finnish education authority Sámi text](https://www.oph.fi/sites/default/files/documents/aukt2_POH-SUO.pdf) using confirmation/proof vocabulary and [New York's Fulah text](https://www.nyc.gov/assets/doh/downloads/pdf/ah/pep-users-guide-ff.pdf) using `Ƴeewto`. These support limited vocabulary usage, not the composed software sentences. The Kashmiri search did not establish a dependable dictionary basis for the full clauses. Full sentences, Kashmiri agreement/orthography and Fulah undo/redo terminology remain low-confidence drafts for fluent-speaker review.

Extended the translation/token regression and existing localized browser scenario to the three locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 10 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Klingon and Volapük

Filled 10 English placeholders in `tlh` and `vo` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [the Klingon Language Institute's vocabulary](https://www.kli.org/about-klingon/new-klingon-words/all/) for `'ol` (verify) and [the English–Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary) for undo, request, confirmation, trying and forgetting. These establish individual roots, not the composed clauses. The Klingon server paraphrase, undo-as-cancellation wording, Volapük redo compound and sentence-level grammar remain provisional for fluent-speaker review. Constructed languages receive translations under the same coverage policy as other locales.

Extended the translation/token regression and existing localized browser scenario to the two locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 8 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Veps and Greenlandic

Filled 10 English placeholders in `ve-PP` and `kl` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [Veps unohtada](https://en.wiktionary.org/wiki/unohtada) and [tagaze](https://en.wiktionary.org/wiki/tagaze), and [Tusass's Greenlandic interface](https://www.tusass.gl/track-and-trace/) using `misileqqiguk`. These establish limited vocabulary, not the composed clauses. Veps nominalizations/inflections and Greenlandic undo/redo phrasing remain low-confidence drafts for fluent-speaker review. Existing unrelated Venda/Zulu seed problems in the Veps file remain unfinished audit work.

Extended the translation/token regression and existing localized browser scenario to the two locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 6 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Nahuatl and Standard Moroccan Tamazight

Filled 10 English placeholders in `nah` and `zgh` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. References include [Nahuatl occeppa](https://nahuatl.wired-humanities.org/node/185251) and [ilcahua](https://gdn.iib.unam.mx/diccionario/ilcahua/179340), and [IRCAM published usage](https://biblio.ircam.ma/pmb/uploads/publications/376.pdf) of `ⴰⵙⵓⵜⵔ`. These support limited vocabulary, not the composed clauses. Nahuatl nominalizations and grammar, and Tamazight server/confirmation/undo terminology and dialect choices, remain low-confidence drafts for fluent-speaker review. Tifinagh script alone does not validate Standard Moroccan Tamazight wording. Unrelated Arabic and mixed-language seed labels remain part of the broader audit.

Extended the translation/token regression and existing localized browser scenario to the two locales. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 4 locales. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Inuktitut

Filled five English placeholders in `iu` with the protected fill utility. The drafts distinguish undo/redo and retry/forget and retain the same-request explanation. [Inuit Uqausinginnik Taiguusiliuqtiit's affix dictionary](https://www.taiguusiliuqtiit.ca/sites/default/files/2020-04/Affix-Dictionary-V21.pdf) supports the trying and forgetting roots. This does not verify the composed clauses or the technical sense of the server and undo/redo terms. Nominalization, inflection, dialect choice and the full recovery explanation remain low-confidence drafts for fluent-speaker review; syllabics alone do not establish language quality.

Extended the translation/token regression and existing localized browser scenario to Inuktitut. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 3 locales: Tigre, Cherokee and Wolaytta. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Wolaytta

Filled five English placeholders in `wal` with the protected fill utility. The drafts distinguish reversing a change from doing it again and retain the same-request explanation. [Lamberti and Sottile's The Wolaytta Language](https://dokumen.pub/the-wolaytta-language.html) gives forgetting vocabulary and grammatical examples. This limited evidence does not validate the drafted recovery sentences. Server borrowing, confirmation paraphrase, undo/redo wording and full clauses remain low-confidence drafts for fluent-speaker review. Existing prefixed-English Wolaytta labels are still unfinished audit work.

Extended the translation/token regression and existing localized browser scenario to Wolaytta. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in 2 locales: Tigre and Cherokee. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

### History recovery: Tigre

Filled five English placeholders in `tig` with the protected fill utility. The drafts distinguish reversing a change from doing it again and retain the same-request explanation. [Beurmann and Merx's Vocabulary of the Tigre Language](https://www.speaktigre.com/_files/ugd/7e068a_a5fbea1fb5e544e69d94cab002762da2.pdf?index=true) gives the forgetting root and grammatical examples. This historical reference supplies limited vocabulary evidence and does not validate modern technical usage or the full recovery sentences. Confirmation, retry/redo nominalizations, inflection and clause structure remain low-confidence drafts for fluent-speaker review. The Ethiopic script does not by itself distinguish Tigre from the Tigrinya seeds still awaiting correction elsewhere in the locale.

Extended the translation/token regression and existing localized browser scenario to Tigre. Translation, recovery-notice, request logic and all 234 locale structural suites pass (13 tests combined), as do 21 human-preference checks. Browser cases are syntax-checked only; local Playwright and a running application remain unavailable. Each of the five source keys remains English in one locale: Cherokee. The broader backlog remains 51,575 ordinary missing values across 70 languages and 165 pending source keys.

## Cherokee history recovery and all-locale coverage — 2026-10-07

Filled the five remaining Cherokee history-recovery placeholders through the protected fill workflow. All five messages now have non-empty, non-English values in all 234 non-English locale paths; removed these five source keys from the pending queue (165 → 160). The ordinary backlog remains 51,575 locale/string values across 70 languages.

The [Cherokee Microsoft localization style guide](https://device.report/m/ec97d073ab6cbd68782ca40920086dfc88494072dd04c880442803a81c119438.pdf), pages 9 and 11, supplies retry and confirmation examples. The longer sentences are low-confidence provisional drafts, not verified fluent Cherokee. The forget control is phrased as dismissing this request. Further speaker review must check the undo/redo distinction and the same-request guarantee; differing strings alone do not establish either meaning.

Extended the regression to discover all non-English locale files, verify non-empty/non-English values and exact placeholder inventories, and reject identical undo/redo or retry/forget labels. Added Cherokee to the existing browser scenario with lost-reply, retry, forget, stale-request and wrong-board checks. The 13 focused tests, 21 human-preference checks and browser syntax check pass. Browser execution remains unavailable without Playwright and a running application; language-quality review remains open.

## Map view: Kurdish, Sorani, Tatar, Turkmen and Yiddish — 2026-10-07

Filled seven English map-view placeholders in each of `ku`, `ckb`, `tt`, `tk_TM` and `yi` (35 values), preserving existing translations through the protected fill workflow. The empty state describes a floor plan, site map or drawing, and the placement hint preserves both dragging and selecting/clicking. These seven keys still have English placeholders in 61 locale paths; keep them in the pending queue. The broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The Kurdish [nexşerê dictionary entry](https://ku.wiktionary.org/wiki/nex%C5%9Fer%C3%AA) supports the map vocabulary. A [Turkmen technical text](https://tituki.nesil.edu.tm/pluginfile.php/11383/mod_resource/content/0/B%C3%A4%C5%9Fimow%20A_%C3%96n%C3%BCm%C3%A7iligi%20gurnamak%20we%20dolandyrmak-2010TPI.pdf) provides usage of karta and meýilnama. These references support terms, not the complete sentences. Technical compounds and especially the Turkmen wording remain provisional and need speaker review. Existing Turkmen `upload` contains mixed English (`Uploadükle`); this new group uses ýükläň, but a broader cleanup remains open.

Extended the locale regression and existing map browser scenario to these five languages, checking all seven messages, both placement methods, and the transition to all cards placed. The existing read-only negative scenario remains. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains unverified without Playwright and a running application.

## Map view: Moroccan Arabic, Bhojpuri, Maithili, Odia and Konkani - 2026-10-07

Filled seven English placeholders in each of `ary`, `bho`, `mai`, `or_IN` and `kok` (35 values) through the protected fill workflow. The translations retain the floor-plan/site-map/drawing examples and both drag and select/click placement methods. These seven keys remain English in 56 locale paths and remain in the pending queue. The broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Odisha government portal](https://odisha.gov.in/or) supports the Odia map terminology. The [IndoWordNet-derived dictionary entry](https://www.transliteral.org/dictionary/%E0%AC%AE%E0%AC%BE%E0%AC%A8%E0%AC%9A%E0%AC%BF%E0%AC%A4%E0%AD%8D%E0%AC%B0/word) includes the Konkani equivalent. These are terminology references, not verification of the drafted sentences. Technical phrases, especially the floor-plan wording in Konkani, remain provisional and need speaker review.

Extended the locale regression and existing browser scenario to these five languages. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. The tests cover exact placeholder inventories, distinct controls and the existing map behavior, not linguistic fluency.

## Map view: Somali, Oromo, Kinyarwanda, Kirundi and Chichewa - 2026-10-07

Filled seven English placeholders in each of `so`, `om`, `rw`, `rn` and `ny` (35 values) using the protected fill workflow. Kinyarwanda and Kirundi distinguish a map of a place from a task card rather than using the same bare noun for both. The placement instruction retains dragging and selecting/clicking. The seven keys remain English in 51 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

Terminology references include [Oromo kaartaa](https://glosbe.com/en/om/map), the [Burundi presidency document with a bilingual map caption](https://www.presidence.gov.bi/wp-content/uploads/2017/04/strategie-nationale-de-securite.pdf), and the [Chichewa Peace Corps course](https://fsi-languages.yojik.eu/languages/PeaceCorps/Chichewa/ED206158.pdf), which uses mapu. These references support individual terms, not full-sentence correctness. Floor-plan terminology, especially Oromo, and the longer technical sentences remain provisional and need speaker review. The Chichewa example describes a plan showing the rooms of a building.

Extended the regression and map browser scenario to these five locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Exact placeholder and text-distinction checks do not prove fluency.

## Map view: Sesotho, Setswana, Northern Sotho, Zulu and Xhosa - 2026-10-07

Filled seven English placeholders in `st`, `tn`, `nso`, `zu`, `zu-ZA` and `xh` (42 values). Both Zulu locale paths were filled independently through the protected fill workflow. The map-image examples and both card-placement methods are retained. These seven source keys remain English in 45 locale paths and stay in the pending queue. The broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

South African education references support [Xhosa map and image terminology](https://www.education.gov.za/LinkClick.aspx?fileticket=7ovTZUutS3A%3D&mid=1565&portalid=0&tabid=572) and [Setswana map and plan terminology](https://www.education.gov.za/LinkClick.aspx?fileticket=I75wDWMXc9c%3D&mid=14088&portalid=0&tabid=5383). These references do not verify the full technical sentences. Floor-plan compounds, especially Northern Sotho, remain provisional and need speaker review.

Extended the locale regression and map browser scenario to all six paths. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Passing tests establish structure and placeholder preservation, not linguistic accuracy.

## Map view: Swati, Ndebele, Tsonga and Venda - 2026-10-07

Filled seven English placeholders in each of `ss`, `nd`, `ts` and `ve` (28 values) using the protected fill workflow. The floor-plan/site-map/drawing examples and both drag and select/click placement methods are retained. The seven keys remain English in 41 locale paths and stay in the pending queue. The broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Swati education curriculum](https://www.education.gov.za/Portals/0/CD/National%20Curriculum%20Statements%20and%20Vocational/CAPS%20Life%20Skills%20Siswati%20_%20Gr%20R-3%20FS.pdf) supports libalave and picture-map terminology. [Statistics South Africa terminology](https://www.statssa.gov.za/wp-content/uploads/2015/11/Multilingual_Statistical_-terminology_2013.pdf) supports map vocabulary for Venda and Tsonga. These sources support words rather than the complete drafted sentences. Floor-plan compounds, click terminology and Venda technical phrasing remain provisional and need speaker review.

Extended the locale regression and browser scenario to these four paths. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Text differences and placeholder inventories do not establish fluent wording.

## Map view: Bislama, Tok Pisin, Maori and Samoan - 2026-10-07

Filled seven English placeholders in each of `bi`, `tpi`, `mi` and `sm` (28 values) through the protected fill workflow. The image examples and both placement methods are retained. Bislama uses the descriptive view label Map blong ples; Tok Pisin uses Mep. The seven keys remain English in 37 locale paths and stay in the pending queue. The broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

Terminology references: [Vanuatu ClimateWatch instructions](https://content.vmgd.gov.vu/wp-content/uploads/2024/12/CW-Van-How-To-Pamphlet-Bislama.pdf) for Bislama map/upload/click usage; [YUS community map](https://www.zoo.org/file/conservation-documents/YUS-Community-Map---webbw.pdf) for Tok Pisin mep; [Te Aka mahere](https://maoridictionary.co.nz/search?histLoanWords=&idiom=&keywords=mahere&loan=&phrase=&proverb=); and [Austronesian Comparative Dictionary](https://acd.clld.org/valuesets/401-1d78dc8ed51214e518b5114fe24490ae) for Samoan map vocabulary. The references support terms, not complete technical sentences. Floor-plan phrasing and Samoan UI wording remain provisional and need speaker review.

Extended the regression and browser scenario to these four paths. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Checks do not establish linguistic fluency.

## Map view: Papiamento, Walloon, Acehnese and Hawaiian - 2026-10-07

Filled seven English placeholders in each of `pap`, `wa`, `ace` and `haw` (28 values) through the protected fill workflow. The map-image examples and both placement methods are retained. Walloon distinguishes the geographical map from task cards. The seven keys remain English in 33 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Aruba education manual](https://www.ea.aw/catalog/wp-content/uploads/2021/04/Rampa-manual-3-completo.pdf) supports Papiamento mapa, while the [Kapiolani campus publication](https://www.kapiolani.hawaii.edu/wp-content/uploads/Ka-Wehena-Kaiao.pdf) supports Hawaiian map vocabulary. The searches did not verify the Walloon and Acehnese technical phrases: those drafts are low confidence. Floor-plan terms and full-sentence fluency remain open to speaker review in this entire batch; terminology examples do not validate the sentences.

Extended regression and browser coverage to these four paths. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Passing checks establish text coverage and placeholder preservation, not linguistic accuracy.

## Map view: Waray, Fijian, Tongan, Luganda and Wolof - 2026-10-07

Filled seven English placeholders in `wa-RR`, `fj`, `to`, `lg` and `wo` (35 values) using the protected fill workflow. The map-image examples and both placement methods are retained. The seven keys remain English in 28 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Wolof lexicon](https://jangawolof.org/2015/01/06/wolof-lexicon/) supplies kart usage. The broader dictionary search also returned related-language entries for Luganda queries; those are not treated as proof of Luganda vocabulary. Full-sentence wording, floor-plan compounds, and the Wolof map/task-card distinction remain provisional and need speaker review. The Fijian administrator term was corrected during review to daunivakatulewa rather than a mixed-language form.

Extended the regression and map browser scenario to all five paths. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Placeholder and coverage checks do not establish fluency.

## Map view: Buryat, Chuvash and Sakha - 2026-10-07

Filled seven English placeholders in each of `bua`, `cv` and `sah` (21 values) through the protected fill workflow. The examples and both placement methods are retained. The seven keys remain English in 25 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Buryat language resource](https://buryadxelen.com/backend/web/burlang/ajax/info?id=2921) uses the geographical-map phrase, and the [Sakha dictionary entry](https://glosbe.com/nl/sah/landkaart) supports the map noun. The Chuvash search returned ambiguous card-related dictionary material rather than verification of the drafted technical sentences. Floor-plan wording and the longer clauses remain provisional, particularly Chuvash, and need speaker review. A Latin lookalike in the Buryat draft was removed before application.

Extended the regression and browser scenario to these three locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Exact placeholder preservation and text coverage do not establish fluency.

## Map view: Tibetan, Dzongkha and Tigrinya - 2026-10-07

Filled seven English placeholders in each of `bo`, `dz` and `ti` (21 values) through the protected fill workflow. The map-image examples and both drag and select/click placement methods are retained. The seven keys remain English in 22 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

Terminology references include [Tibetan Map](https://www.tibetanmap.com/), [Dzongkha Computer Terms](https://panl10n.cle.org.pk/outputs/DCT.pdf), and the [Tigrinya map dictionary entry](https://www.geezexperience.com/?dr=0&searchkey=map). These support map vocabulary, not full-sentence accuracy. The longer technical sentences and floor-plan terminology, especially Dzongkha, remain provisional and need speaker review. Tibetan and Dzongkha were drafted separately with their own grammatical forms.

Extended regression and browser coverage to these three locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Coverage and placeholder checks do not establish fluency.

## Map view: Manx, Venetian and Aromanian - 2026-10-07

Filled seven English placeholders in each of `gv`, `ve-CC` and `rup` (21 values) using the protected fill workflow. The map-image examples and both placement methods are retained. The seven keys remain English in 19 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Manx dictionary entry](https://glosbe.com/en/gv/map) supports caslys vocabulary. Searches for Venetian mostly returned Italian-language pages and do not verify the Venetian draft. The [Society Farsharotu dictionary](https://farsharotu.org/wp-content/uploads/2020/07/An-English-Aromanian-Macedo-Romanian-Dictionary-%C2%A9Society-Farsharotu.pdf) was inspected, but its OCR did not reliably locate the map entry; a spurious map result in the H entries was not treated as evidence. Aromanian technical clauses are low-confidence drafts. Floor-plan wording and sentence fluency remain provisional throughout this batch and need speaker review.

Extended the regression and map browser scenario to these three paths. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These checks establish structure and placeholder preservation, not linguistic quality.

## Map view: Akan, Ewe and Bambara - 2026-10-07

Filled seven English placeholders in each of `ak`, `ee` and `bm` (21 values) through the protected fill workflow. The image examples and both placement methods are retained. The seven keys remain English in 16 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

References include the [Akan picture dictionary entry](https://www.akandictionary.com/2021/12/12/mfonin/), [Ewe educational text](https://www.dol.gov/sites/dolgov/files/ILAB/EWE%201.pdf) using picture vocabulary, and a [Bambara lexicon](https://mooreburkina.com/sites/www.mooreburkina.com/files/pdf-files/Bambara%20Lexicon.pdf) with geographical-map compounds. These support component vocabulary rather than every drafted compound or sentence. Floor-plan descriptions, upload/click terminology and Ewe technical clauses remain provisional and need speaker review.

Extended regression and browser coverage to these three locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Coverage and token inventories do not establish fluency.

## Map view: Quechua, Aymara and Guarani - 2026-10-07

Filled seven English placeholders in each of `qu`, `ay` and `gn` (21 values) through the protected fill workflow. The map-image examples and both drag and select/click placement methods are retained. These seven keys remain English in 13 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Guarani dictionary](https://guarani-raity.com.py/guarani_castellano_y.html) gives the map term. Quechua and Aymara dictionary searches located language resources but did not directly verify the drafted map compounds or technical clauses. The floor-plan examples, upload wording and longer sentences are provisional and need speaker review. Existing Quechua generic prefixed text elsewhere in the locale remains a separate cleanup item; it was not copied into these messages.

Extended regression and browser coverage to these three locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Coverage and placeholder preservation do not establish fluency.

## Map view: Northern Sami, Fulah and Kashmiri - 2026-10-07

Filled seven English placeholders in each of `se`, `ff` and `ks` (21 values) through the protected fill workflow. The map-image examples and both placement methods are retained. The seven keys remain English in 10 locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

[Nordregio's Sami maps](https://nordregio.org/app/uploads/2018/02/Text_saami.pdf) support the map noun. The [Kashmiri WordNet-derived entry](https://www.transliteral.org/dictionary/%D8%AE%D8%A7%DA%A9%DB%81%D9%95/word) supports plan/map vocabulary. Fulah searches did not verify the full map compound. These references do not validate the drafted sentences; Fulah and Kashmiri technical clauses are low-confidence drafts. Floor-plan phrasing and grammar remain provisional and need speaker review.

Extended regression and browser coverage to these three locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Text coverage and placeholder inventories do not establish fluency.

## Map view: Klingon and Volapuk - 2026-10-07

Filled seven English placeholders in each of `tlh` and `vo` (14 values) through the protected fill workflow. The map-image examples and both placement methods are retained. The seven keys remain English in eight locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Klingon Language Institute discussion](https://lists.kli.org/archives/list/tlhingan-hol%40lists.kli.org/thread/IHUHL4HVJ44JT4ERHMTMDPYQFCZWETUO/) supports the map, board and card terms. The [English-Volapuk dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary) supports kaed, magod, tead, dragging terminology and the mouse-selection paraphrase for clicking. During review, the Volapuk draft was corrected to use the dictionary's drag and drawing terms and click paraphrase. These sources do not validate the full sentences; UI terminology and grammar remain provisional and need speaker review.

Extended regression and browser coverage to both locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Coverage and placeholder checks do not establish fluency.

## Map view: Veps and Greenlandic - 2026-10-07

Filled seven English placeholders in each of `ve-PP` and `kl` (14 values) through the protected fill workflow. Both placement methods and the image examples are retained. The seven keys remain English in six locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

[Greenland's NunaGIS](https://nunagis.gl/nittartakkatigut-kiffartuussissutit/) supports the map term. Veps dictionary searches found the corpus resource but did not verify the proposed map and floor-plan compounds. Veps wording is low confidence; Greenlandic technical inflections and floor-plan phrasing also remain provisional and need speaker review. The Greenlandic administrator's upload action was revised to an active form during review.

Extended regression and browser coverage to both locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Structural checks do not establish fluent or accurate language.

## Map view: Nahuatl and Standard Moroccan Tamazight - 2026-10-07

Filled seven English placeholders in each of `nah` and `zgh` (14 values) through the protected fill workflow. The image examples and both placement methods are retained. The seven keys remain English in four locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Nahuatl dictionary](https://ossyriams.pueblosoriginarios.com/lenguas/nahuatl.php) supplies tlalmachiotl for map. [IRCAM's audiovisual lexicon](https://biblio.ircam.ma/pmb/uploads/publications/197.pdf) supports the card noun, while geographical uses found in other Amazigh varieties do not directly validate Standard Moroccan usage. Both sets of technical sentences are low-confidence drafts. Floor-plan terms, grammar and the Tamazight map/task-card distinction require further language review; Tifinagh script alone is not proof of correct language.

Extended regression and browser coverage to both locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Coverage and placeholder checks do not establish fluency.

## Map view: Inuktitut - 2026-10-07

Filled seven English placeholders in `iu` through the protected fill workflow. Both placement methods and the three image examples are retained. The seven map-view keys remain English in three locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Inuit Tapiriit Kanatami publication](https://www.itk.ca/wp-content/uploads/2016/07/health-human-resources.pdf) uses the map term nunannguaq / ᓄᓇᙳᐊᖅ. Existing locale labels supplied the board, card, administrator and selection terminology. These references do not validate the drafted sentences: floor-plan phrasing, technical inflections and upload wording remain low confidence and need language review.

Extended regression and browser coverage to Inuktitut. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Structural checks do not establish fluency.

## Map view: Cherokee - 2026-10-07

Filled seven English placeholders in `chr` through the protected fill workflow. The seven map-view keys remain English in two locale paths and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

The [Cherokee Nation maps page](https://www.cherokee.gov/About-The-Nation/Maps) supplies the map label. The [Cherokee dictionary vocabulary list](https://www.cherokeedictionary.net/first500) provides drawing and pulling vocabulary; existing locale strings supplied card and control terminology. These references do not establish correct full sentences. The floor-plan paraphrase, administrator term, verb forms, placement and clicking instructions are low-confidence drafts requiring language review. Syllabary and placeholder checks are not evidence of fluency.

Extended regression and browser coverage to Cherokee. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application.

## Map view: Tigre - 2026-10-07

Filled seven English placeholders in `tig` through the protected fill workflow. The seven map-view keys remain English in `wal` and stay in the pending queue; the broader backlog remains 51,575 ordinary placeholders across 70 languages plus 160 pending source keys.

Consulted [Beurmann and Merx's Tigre vocabulary and grammatical sketch](https://www.speaktigre.com/_files/ugd/7e068a_a5fbea1fb5e544e69d94cab002762da2.pdf?index=true), especially the place, after and negation forms. This historical source does not verify modern map/upload/click vocabulary. Existing locale terminology is also not independent evidence of correct Tigre. All seven values are low-confidence drafts; modern terms, inflections and potential Tigrinya interference still need language review. Script checks alone cannot distinguish these languages.

Extended regression and browser coverage to Tigre. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These results establish structural preservation, not linguistic accuracy.

## Map view: Wolaytta and complete placeholder coverage - 2026-10-07

Filled seven English placeholders in `wal` through the protected fill workflow. All seven map-view keys now have nonempty, non-English values with matching placeholder inventories in all 234 non-English locales. Removed these keys from the pending inventory, reducing it from 160 to 153. Ordinary untranslated values remain 51,575 across 70 languages. This is placeholder coverage, not completed linguistic validation.

The [Wolayttatto teaching guide](https://camaraethiopia.org.et/SNNPR/moe/content/SNE_TB/Sign%20Language%20G1-12/03-Wolayitato-Books-Sign-Language/03-Wolayitato-ESL-PDF/05-Wolayitato-ESL-G5-TG.pdf) supplies image vocabulary. The geographic-map paraphrase, floor-plan phrase and technical sentences remain low-confidence drafts. During review, an uncertain click verb was replaced with a mouse-button selection paraphrase; that paraphrase also requires language review. Existing locale text containing English or language-name prefixes was not used as evidence of fluent wording.

The map-view regression now discovers every non-English locale and checks removal from the pending inventory, token preservation and distinct upload/remove and placed/unplaced controls. Added Wolaytta to the browser scenario. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. The broader wrong-language and meaning audit remains open.

## Multiple-parent controls: first remaining-locale batch - 2026-10-07

Filled three English placeholders in each of `ku`, `ckb`, `tt`, `tk_TM`, `yi`, `so` and `ny` (21 values) through the protected fill workflow. The strings describe another parent relationship and ending that relationship, not deleting either card. Source review confirms that the remove control calls `card.removeParent`. Existing locale terminology informed the drafts; technical phrasing, particularly Kurdish, Tatar and Chichewa, remains provisional. The existing Tatar subtask label mixes language varieties and was not copied into these new values.

Extended locale regression coverage and parameterized the parent-removal browser scenario for these languages. Browser assertions cover all three labels, retention of the primary parent and survival of both parent cards. Existing cycle-prevention coverage remains in place. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application.

These controls remain English in 59 locale paths, so their keys stay pending. The broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys. Structural coverage does not establish fluency.

## Multiple-parent controls: South Asian locales - 2026-10-07

Filled three English placeholders in each of `bho`, `mai`, `or_IN`, `kok` and `ks` (15 values) through the protected fill workflow. Removal wording ends a subtask relationship rather than deleting a card. Existing terminology informed the drafts; decorative trailing bars in older Odia labels were not copied. Kashmiri wording remains low confidence: the [Kashmiri work entry](https://en.wiktionary.org/wiki/%DA%A9%D9%B2%D9%85) supports the task noun, but does not verify the full technical phrases or inflections.

Extended locale and browser coverage to all five locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. Structural checks do not establish linguistic accuracy.

These controls remain English in 54 locale paths and stay pending. The broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: southern African locales - 2026-10-07

Filled three English placeholders in each of `st`, `tn`, `nso`, `zu`, `zu-ZA`, `xh`, `ss`, `nd`, `ts` and `ve` (30 values) through the protected fill workflow. Relationship-removal wording preserves the card. Existing Tsonga filler and Venda labels written in Zulu were not copied as terminology references; those older entries remain part of the broader language audit.

The [Tsonga facilitator guide](https://admin.jet.org.za/clearinghouse/projects/grade-r-maths-and-language-improvement-project/resources/mathematics/facilitator-guide-participants-workshop/w1-fg-and-pw/fg/gde-maths_workshop-1_facilitator-guide-xitsonga-final.pdf) supports xintirhwana as task/activity vocabulary. The [Venda teaching guide](https://www.cambridge.org/za/files/7516/1674/8619/Study__Master_Zwikili_zwa_Vhutshilo_Faela_ya_Mugudisi_Gireidi_ya_1__9781316522783AR.pdf) supports small-task wording. Neither validates the full UI phrases. Technical parent metaphors and noun agreement, particularly in Swati, Ndebele, Tsonga and Venda, remain provisional and require language review.

Extended locale and browser coverage to all ten locale paths. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in 44 locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Pacific locales - 2026-10-07

Filled three English placeholders in each of `bi`, `tpi`, `mi`, `sm`, `fj`, `to` and `haw` (21 values) through the protected fill workflow. New labels describe the subordinate task and ending its relationship to another card. Existing English filler in Bislama, Tok Pisin and Tongan and questionable Hawaiian task/parent labels were not copied into the new values; those older labels remain in the language-quality backlog.

The [University of Hawaii dictionary](https://wehe.hilo.hawaii.edu/?q=parent) supports makua for parent, and the [Tongan permission form](https://www.cn.ets.org/pdfs/ppat/ppat-student-parent-guardian-permission-form-tongan.pdf) supplies parent/work vocabulary. These do not validate the software metaphors or complete phrases. Technical parent terminology and sentence grammar, especially Hawaiian and Tongan, remain provisional and need language review.

Extended locale and browser coverage to these seven locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in 37 locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: eastern and western African locales - 2026-10-07

Filled three English placeholders in each of `om`, `rw`, `rn`, `lg`, `wo`, `ak`, `ee` and `bm` (24 values) through the protected fill workflow. The removal labels describe ending a relationship, not deleting a card. Existing English filler in Luganda and generic Akan text were not used as evidence of task terminology.

The [Bambara lexicon](https://mooreburkina.com/sites/www.mooreburkina.com/files/pdf-files/Bambara%20Lexique.pdf) supports baara as task/work vocabulary, while [Basic Ewe](https://philtypo3.uni-koeln.de/sites/inst_afrika/pdf/BASIC_EWE_2nd_ed.pdf) provides task and parent vocabulary. These references do not validate the complete software phrases. Parent metaphors, agreement and word order remain provisional, particularly Luganda, Akan, Ewe and Bambara, and require language review.

Extended locale and browser coverage to all eight locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in 29 locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Papiamento, Walloon, Waray and Acehnese - 2026-10-07

Filled three English placeholders in each of `pap`, `wa`, `wa-RR` and `ace` (12 values) through the protected fill workflow. Walloon and Waray were handled separately according to their registered language identities. The removal descriptions end a task relationship without describing card deletion.

The [Austronesian Comparative Dictionary](https://acd.clld.org/cognatesets/25618) supports Acehnese buët as work vocabulary. Walloon dictionary searches identified the dictionary resource but did not verify the complete proposed task/parent compounds. Walloon and Acehnese technical wording is low confidence; all four sets of software metaphors and sentence fragments require further language review. Vocabulary evidence does not establish fluent sentences.

Extended locale and browser coverage to all four locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in 25 locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Buryat, Chuvash and Sakha - 2026-10-07

Filled three English placeholders in each of `bua`, `cv` and `sah` (nine values) through the protected fill workflow. Removal wording ends the subordinate-task relationship without describing card deletion.

The [Buryat educational text](https://www.burunen.ru/media/42626-buryaad-kheleer-testn-d-8-9-klassuud/) supports task vocabulary, the [Chuvash work entry](https://ru.glosbe.com/ru/cv/%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%B0) supplies the work noun, and the [Sakha dictionary](https://sakhatyla.ru/translate?q=%D1%81%D0%BE%D1%80%D1%83%D0%B4%D0%B0%D1%85) supports sorudakh. These references do not validate the complete technical phrases. Parent metaphors, subtask terminology and inflections remain provisional and require language review.

Extended locale and browser coverage to all three locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in 22 locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Tibetan, Dzongkha and Tigrinya - 2026-10-07

Filled three English placeholders in each of `bo`, `dz` and `ti` (nine values) through the protected fill workflow. The labels describe another parent relationship and ending that relationship without deleting a card. Tibetan and Dzongkha were drafted separately despite their shared script.

The [Tibetan task entry](https://rywiki.tsadra.org/index.php/las_%27gan) supports task vocabulary; existing locale labels supplied the subtask and parent-card terminology. The Dzongkha dictionary search identified the official resource but did not verify the complete UI expressions. Tibetan and Dzongkha technical compounds and sentence grammar remain provisional; the full phrases need language review. Script and placeholder checks cannot establish linguistic accuracy.

Extended locale and browser coverage to all three locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in 19 locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Quechua, Aymara and Guarani - 2026-10-07

Filled three English placeholders in each of `qu`, `ay` and `gn` (nine values) through the protected fill workflow. New Quechua and Aymara labels do not reuse the English filler in the older subtask/parent labels. Those older values remain in the broader language-quality backlog.

The [Quechua work entry](https://en.wiktionary.org/wiki/llamkay), [Aymara pedagogical vocabulary](https://formacionenservicio.minedu.gob.pe/sifods/centro-recurso/2022/Material-educativo/Libro/vocabulario-pedagogico-aimara.pdf), and [Guarani dictionary](https://guaraniayvu.org/) supply work/action terminology. These sources do not verify complete UI phrases or parent-card metaphors. Quechua variety consistency, Aymara inflections and technical wording remain provisional and require language review.

Extended locale and browser coverage to all three locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in 16 locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Moroccan Arabic and four European locales - 2026-10-07

Filled three English placeholders in each of `ary`, `gv`, `ve-CC`, `rup` and `se` (15 values) through the protected fill workflow. The removal labels describe ending a subordinate-task relationship. Venetian was selected by its registered locale identity; the Aromanian draft does not copy the older Italian parent label.

[Learn Manx](https://www.learnmanx.com/learning/intermediate/lesson-18-traa-dy-liooar---time-enough--1093/) supports the work vocabulary. Searches did not independently verify the proposed Aromanian task expression or Northern Sami compound; Romanian dictionary hits were not treated as Aromanian evidence. Aromanian and Manx phrases are low-confidence drafts. All software metaphors and inflections remain subject to language review; existing locale text is not proof of correct terminology.

Extended locale and browser coverage to all five locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in 11 locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Inuktitut and Greenlandic - 2026-10-07

Filled three English placeholders in each of `iu` and `kl` (six values) through the protected fill workflow. Parent labels use larger/main-task descriptions, and removal wording ends the subordinate relationship without describing deletion.

The [Inuktitut publication](https://www.itk.ca/wp-content/uploads/2016/10/2000-0086-InuktitutMagazine-IUCANS-IULATN-EN.pdf) and [Greenlandic work terminology glossary](https://at.gl/media/snzb0g4a/arbejdslivsbegreber-sprogsekretariatet-gl.pdf) support task vocabulary. They do not verify these UI phrases. Both sets of technical sentences and inflections remain low-confidence drafts requiring language review, including whether the larger-task paraphrases convey a parent relationship clearly.

Extended locale and browser coverage to both locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in nine locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Klingon and Volapuk - 2026-10-07

Filled three English placeholders in each of `tlh` and `vo` (six values) through the protected fill workflow. The removal labels describe no longer being a subordinate task, rather than card deletion.

The [English-Volapuk dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary) supports task vocabulary and the [kinship glossary](https://www.omniglot.com/language/kinship/volapuk.htm) supplies the parent root. Existing Klingon task/card terms informed its draft; searches did not independently validate the complete software expressions. The inherited Klingon elder-card metaphor and Volapuk parent adjective remain provisional, as do the full clauses. They require language review and are not validated by non-English coverage.

Extended locale and browser coverage to both locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in seven locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Fulah and Veps - 2026-10-07

Filled three English placeholders in each of `ff` and `ve-PP` (six values) through the protected fill workflow. The removal labels describe ending a subordinate relationship rather than deleting a card. Veps follows the registered locale identity, not Venda.

The [Fulfulde dictionary](https://www.mooreburkina.com/sites/www.mooreburkina.com/files/pdf-files/03%20Dictionnaire%20fulfulde%20-%20francais%20%20English.pdf) supports gollal as task/work vocabulary. The [Veps corpus entry](https://dictorpus.krc.karelia.ru/en/dict/lemma/354?search_concept=770) supports work vocabulary but does not validate the inherited subtask compound used here. Both sets of phrases are low-confidence drafts: Fulah noun-class agreement and parent metaphor, and Veps compounds and inflections require language review. Existing labels and non-English checks do not establish correct language.

Extended locale and browser coverage to both locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in five locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Nahuatl and Standard Moroccan Tamazight - 2026-10-07

Filled three English placeholders in each of `nah` and `zgh` (six values) through the protected fill workflow. The removal wording ends a subordinate relationship without describing card deletion.

The [Nahuatl dictionary](https://nahuatl.wired-humanities.org/content/tequitl) supplies task vocabulary, and [IRCAM's teaching publication](https://biblio.ircam.ma/pmb/catalogue/doc_num.php?explnum_id=381) supports the Tamazight work noun. Neither validates the complete UI phrases. Both sets of technical sentences, parent-card metaphors and grammatical forms remain low-confidence drafts requiring language review. Tifinagh script alone does not prove Standard Moroccan usage.

Extended locale and browser coverage to both locales. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in three locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Cherokee - 2026-10-07

Filled three English placeholders in `chr` through the protected fill workflow. The parent-card draft uses a larger-task paraphrase rather than copying the questionable older parent label. Removal is intended to end the subordinate relationship rather than delete a card.

The [Cherokee vocabulary list](https://cherokeedictionary.net/first500) supplies work vocabulary; it does not verify the drafted UI expressions. All three phrases are low confidence, including possession, clause structure and whether the larger-task description clearly conveys a parent relationship. Further language review is required. Syllabary and non-English checks do not establish understandable or accurate Cherokee.

Extended locale and browser coverage to Cherokee. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. These controls remain English in two locale paths and stay pending; the broader backlog remains 51,575 ordinary untranslated values across 70 languages plus 153 pending source keys.

## Multiple-parent controls: Tigre, Wolaytta and complete placeholder coverage - 2026-10-07

Filled three English placeholders in each of `tig` and `wal` (six values) through the protected fill workflow. All three multiple-parent controls now have nonempty, non-English values with preserved tokens in all 234 non-English locales. Removed the three keys from the pending inventory, reducing it from 153 to 150. A fresh missing report still counts 51,575 ordinary untranslated values across 70 languages. This establishes placeholder coverage, not linguistic accuracy.

The [Tigre biographical text](https://www.kwhna.com/wp-content/uploads/2015/08/Tirgum-Hachir-Tarik-Aboy-Grazmatch-Lijam-in-Tigre-with-pics.pdf) provides work vocabulary in context, and the [Wolayttatto curriculum](https://pdf.usaid.gov/pdf_docs/PA00MQWZ.pdf) includes ooso. Neither validates the full drafted UI sentences. Both sets are low confidence: parent-card paraphrases, time/negation wording and grammar require review, including possible Tigrinya interference in Tigre. The Tigre removal draft was revised during review to express a change from now onward. Existing Wolaytta English filler was not copied.

Expanded the locale regression to discover all non-English locales and verify these keys are absent from the pending inventory. Added Tigre and Wolaytta to the existing browser scenario, which checks labels, unlinking and preservation of both parent cards. All 12 focused tests and 21 human-preference checks pass; browser syntax passes. Browser execution remains pending without Playwright and a running application. The broader meaning and wrong-language audit remains open.

## Leo import instruction: first remaining locale batch

Filled `import-board-instruction-leo` in Kurdish, Central Kurdish, Tatar,
Turkmen, Yiddish, Somali and Chichewa (seven English placeholders). The protected
fill preserved existing non-English values. Leo and `.leo` remain literal.
The source parser confirms the list/card/description/checklist mapping and marked
completion state. Somali uses a descriptive hierarchy of parts rather than an
unverified anatomical word for node. The full technical clauses, especially
Somali and Chichewa, remain provisional and need speaker review.

Extended the locale regression and parameterized the existing positive Leo
browser import test for these seven languages plus English, checking the visible
instruction before importing. Existing invalid-input coverage remains in place.
All 12 focused Node tests and 21 human-preference checks pass; browser syntax
passes. Browser execution remains unverified because Playwright is unavailable.
There are still 59 locales with this English instruction. The broader backlog
remains 51,575 ordinary placeholders in 70 languages plus 150 pending source
keys; coverage is not a claim of linguistic quality.

## Leo import instruction: Indic and southern African batch

Filled 14 more English placeholders for `import-board-instruction-leo`: Bhojpuri,
Maithili, Odia, Konkani, Southern Sotho, Tswana, Northern Sotho, Zulu and its
South Africa locale, Xhosa, Swati, Northern Ndebele, Tsonga and Venda. Existing
non-English translations were preserved by the fill helper. The instructions
retain the hierarchy, card description, deeper checklists and marked completion
state. Southern African clauses describe nodes as parts at specified levels.

Vocabulary references include the [Goa administrative terminology glossary](https://dol.goa.gov.in/wp-content/uploads/2025/11/administrative-terminology.pdf)
for Konkani level terminology and [Tshivenda curriculum material](https://nect.org.za/materials/home-languages/term-1/big-books/grade-2-covers/gr-2-term-1-big-book-cover-tshivenda.pdf)
for attaching parts. These references do not validate the complete UI clauses.
The full translations remain provisional, especially Konkani, Swati, Northern
Ndebele and Venda; speaker review remains open.

The locale regression preserves Leo, `.leo` and the source token inventory.
The existing browser import scenario now checks the translated instruction for
all 14 locales before importing; invalid-input coverage remains in place.
All 12 focused Node tests and 21 human-preference checks pass, and browser syntax
passes. Browser execution is still unverified because Playwright is unavailable.
There are 45 locales still using this English instruction. The broader backlog
remains 51,575 ordinary placeholders across 70 languages plus 150 pending source
keys. Non-English coverage does not establish translation accuracy.

## Leo import instruction: Pacific, Papiamento and eastern African batch

Filled 12 English placeholders for `import-board-instruction-leo`: Bislama, Tok
Pisin, Māori, Samoan, Fijian, Tongan, Hawaiian, Papiamento, Oromo, Kinyarwanda,
Kirundi and Luganda. The protected fill retained existing non-English values.
The instructions preserve the hierarchy, body-as-description mapping, deeper
checklists and marked completion state, with Leo and `.leo` unchanged.

Used the existing locale terminology and the [Te Aka entry for hanganga](https://maoridictionary.co.nz/search?keywords=hanganga)
as a reference for Māori structure terminology. This does not validate complete
sentences. Kinyarwanda and Kirundi drafts were revised to describe child parts
at the next level rather than using a temporal expression for “immediately”.
Technical terminology and full clauses remain provisional, particularly Fijian,
Tongan, Hawaiian, Oromo and Kirundi; speaker review remains open.

Extended the locale regression and the existing browser import scenario for all
12 locales. Existing invalid-input tests remain in place. All 12 focused Node
tests and 21 human-preference checks pass. Browser syntax passes, but execution
remains unverified because Playwright is unavailable. There are 33 locales still
using this English instruction. The broader backlog remains 51,575 ordinary
placeholders across 70 languages plus 150 pending source keys. These checks
establish structural coverage, not linguistic accuracy.

## Leo import instruction: eight further locales and a Darija correction

Filled the English `import-board-instruction-leo` value in Moroccan Arabic,
Walloon, Waray, Acehnese, Manx, Northern Sami, Venetian and Aromanian. Existing
non-English instructions were preserved. Corrected the Moroccan Arabic `done`
label from Persian `انجام شده` to Darija `سالا`, with a regression that rejects
the Persian vocabulary. This is a wrong-language correction, not an overwrite of
a correct-language human translation.

The [Manx phrasebook](https://kevinscannell.com/files/frasleabhar.pdf) provides
`greimmaghey` in the context of cutting and pasting; that corrected the initial
paste wording. Consulted the [Walloon dictionary](https://moti.walon.org/dicc_esplicantA_AA.html)
for attachment terminology. These word references do not validate the full
instructions. Hierarchy and import terminology remain provisional, especially
Acehnese, Manx, Northern Sami and Aromanian; full linguistic review remains open.

Extended locale and browser import coverage for all eight locales, retaining
the existing invalid-input tests. All 12 focused Node tests and 21 preservation
checks pass; browser syntax passes. Browser execution remains unverified because
Playwright is unavailable. There are 25 locales still using the English Leo
instruction. The wider backlog remains 51,575 ordinary placeholders in 70
languages plus 150 pending source keys. Coverage is not proof of fluency.

## Leo import instruction: West African and Cyrillic locale batch

Filled seven English placeholders for `import-board-instruction-leo` in Akan,
Bambara, Ewe, Wolof, Buryat, Chuvash and Sakha. Existing translations were retained
by the protected fill. The instructions describe the levels as parts and retain
lists, cards, body descriptions, deeper checklists and marked completion state.
Leo and `.leo` are unchanged.

The [Bamadaba dictionary](https://bamadaba.coastsystems.net/lexicon/n/) supplies
`nɔrɔ` for sticking/pasting. Existing locale terminology supplied the UI nouns.
Word references do not validate the full clauses: all seven instructions remain
provisional, especially the hierarchy phrasing in Bambara, Ewe, Buryat, Chuvash
and Sakha. Vocabulary and grammar review remain open.

Extended locale regression and browser import coverage for all seven locales.
Existing invalid-input coverage remains. All 12 focused Node tests and 21
human-preference checks pass; browser syntax passes, but browser execution remains
unverified because Playwright is unavailable. There are 18 locales still using
the English instruction. The wider backlog remains 51,575 ordinary placeholders
in 70 languages plus 150 pending source keys. These checks establish structural
coverage, not linguistic accuracy.

## Leo import instruction: Tibetan-script, Tigrinya and South American batch

Filled six English placeholders for `import-board-instruction-leo` in Tibetan,
Dzongkha, Tigrinya, Quechua, Aymara and Guarani. The protected fill preserved
existing translations. The drafts retain the levels, child cards, body text as
description, deeper checklists and marked completion state. Leo and `.leo` remain
literal. Reviewed and simplified the Guarani child-node and marked-node clauses
before applying the draft.

Vocabulary references include the [Guarani dictionary published by Corrientes education authorities](https://www.mec.gob.ar/descargas/Bibliograf%C3%ADa/Educaci%C3%B3n%20Intercultural%20Biling%C3%BCe/GUARANI/avane-Diccionario-Guarani-Esp-Esp-Guarani.pdf)
for `tysýi` and the [Aymara pedagogical vocabulary](https://aymaraclub.com/wp-content/uploads/2024/01/LIBRO-VOCABULARIO-PEDAGOGICO-AYMARA-OK-1.pdf)
for level/part vocabulary. These references do not validate full clauses.
All six technical instructions remain provisional, particularly Dzongkha,
Quechua, Aymara and Guarani; speaker review remains open.

Extended locale regression and the browser import scenario for these six
languages. Existing invalid-input coverage remains in place. All 12 focused
Node tests and 21 preservation checks pass. Browser syntax passes; execution
remains unverified because Playwright is unavailable. Twelve locales still use
the English instruction. The wider backlog remains 51,575 ordinary placeholders
across 70 languages plus 150 pending source keys. Coverage is not proof of
linguistic accuracy.

## Leo import instruction: Kashmiri, Fulah, Veps and constructed languages

Filled five English placeholders for `import-board-instruction-leo` in Kashmiri,
Fulah, Veps (`ve-PP`), Volapük and Klingon. The protected fill preserved existing
translations. The drafts retain the hierarchy, cards, descriptions, deeper
checklists and marked completion state; Leo and `.leo` remain literal.

The [Midgley English–Volapük dictionary](https://volapuk.evertype.com/EnVoDictionary-20100830.pdf)
provided `binod` (structure) and `nüveigön` (import goods), replacing unverified
initial draft roots. Their use for software is a terminology adaptation.
The [Fulfulde manual](https://www.livelingua.com/peace-corps/Fulfulde/fulfulde%20peace%20corps.pdf)
helped identify `leɗɗe` as inappropriate for levels; the draft now describes
deeper parts. Klingon wording uses a data record rather than a physical filing
tool. All five complete instructions remain low-confidence drafts needing
vocabulary and grammar review; word references do not validate the sentences.

Extended locale regression and the browser import scenario for all five locales,
retaining existing invalid-input coverage. All 12 focused Node tests and 21
preservation checks pass. Browser syntax passes; execution remains unverified
because Playwright is unavailable. Seven locales still use this English
instruction. The wider backlog remains 51,575 ordinary placeholders across 70
languages plus 150 pending source keys. Coverage is not proof of fluency.

## Leo import instruction: Greenlandic and Inuktitut drafts

Filled the English `import-board-instruction-leo` value in Greenlandic and
Inuktitut through the protected fill, preserving existing translations. The
drafts describe upper parts, subordinate cards, body descriptions, deeper
checklists and marked completion state. Leo and `.leo` remain literal.

Used the existing locale UI nouns and consulted the [Greenlandic dictionary index](https://ordbog.gl/)
and [Greenlandic–English dictionary](https://daka.gl/2018-kal-eng/) as language
references. These references do not validate the complete instructions. Both
drafts remain low-confidence: node hierarchy terminology, inflected card/list
forms and the Inuktitut body-description clause require linguistic review.

Extended locale regression and the existing browser import scenario for both
locales; invalid-input coverage remains in place. All 12 focused Node tests and
21 human-preference checks pass. Browser syntax passes, but execution remains
unverified because Playwright is unavailable. Five locales still use the English
Leo instruction. The wider backlog remains 51,575 ordinary placeholders in 70
languages plus 150 pending source keys. Structural coverage does not establish
linguistic accuracy.

## Leo import instruction: Nahuatl and Standard Moroccan Tamazight

Filled two English placeholders for `import-board-instruction-leo`, preserving
existing translations with the protected fill. The drafts retain the hierarchy,
child cards, body-description mapping, deeper checklists and marked completion
state. Leo and `.leo` are unchanged.

The [Online Nahuatl Dictionary entry for tlacuilolli](https://nahuatl.wired-humanities.org/content/tlacuilolli)
supports writing/document terminology. The [Berber computing glossary](https://www.temehu.com/imazighen/dictionaries/Amawals/Computer_dictionary_Berber_English_French.pdf)
offers comparative terminology, but contains multiple varieties and does not
establish Standard Moroccan Tamazight usage for all terms. Both full sentences
remain low-confidence drafts. In particular, the node/child metaphors and
completion clauses require linguistic review; script alone is insufficient.

Extended locale and browser import coverage for both locales. Added a Tifinagh
script assertion and rejection of Arabic/Latin prose except literal Leo and
`.leo` identifiers. Existing invalid-input coverage remains. All 12 focused Node
tests and 21 human-preference checks pass. Browser syntax passes; execution
remains unverified because Playwright is unavailable. Cherokee, Tigre and
Wolaytta still use the English instruction. The wider backlog remains 51,575
ordinary placeholders in 70 languages plus 150 pending source keys.

## Leo import instruction: Tigre and Wolaytta drafts

Filled two English placeholders for `import-board-instruction-leo` through the
protected fill. Existing non-English translations were preserved. Drafted the
hierarchy, cards, body descriptions, deeper checklists and marked completion
state in Tigre and Wolaytta, retaining literal Leo and `.leo` identifiers.

Used the [Kekia Tigre grammar, lesson 28](https://www.speaktigre.com/_files/ugd/7e068a_d791dde4087041feaf3dedb6b109829c.pdf?index=true)
for above/below expressions. Existing Wolaytta UI terminology supplied the card,
description and checklist nouns. Both complete instructions remain very
low-confidence: technical vocabulary, verb agreement, hierarchy and completion
phrasing require linguistic review. The Tigre draft is separate from Tigrinya;
shared script does not establish that the vocabulary is correct for its locale.

Extended locale and browser import coverage for both languages; existing
invalid-input coverage remains. All 12 focused Node tests and 21 preservation
checks pass. Browser syntax passes, but execution remains unverified because
Playwright is unavailable. Cherokee is the remaining English Leo instruction.
The wider backlog remains 51,575 ordinary placeholders in 70 languages plus 150
pending source keys. Structural coverage does not establish linguistic accuracy.

## Leo import instruction: Cherokee draft and complete placeholder coverage

Filled the final English `import-board-instruction-leo` placeholder in Cherokee
through the protected helper. Existing non-English values were preserved. Used
the existing UI nouns and consulted the [Cherokee-English dictionary](https://www.cherokeedictionary.net/first500)
as a vocabulary reference; this does not validate the complete instruction.
The Cherokee draft remains very low-confidence, particularly the hierarchy,
paste, marked-node and completion clauses, and requires linguistic review.

A fresh scan finds a nonempty, non-English value for this key in all 234
non-English locales. Removed the key from the pending queue (150 to 149) and
made the regression discover all locales, check token inventories and literal
Leo/`.leo`, and reject reintroduction into the pending queue. Extended the browser
import scenario to Cherokee; existing invalid-input coverage remains.

All 12 focused Node tests and 21 human-preference checks pass. Browser syntax
passes; execution remains unverified because Playwright is unavailable. The
ordinary backlog remains 51,575 values across 70 languages. Non-English coverage
is not a claim that this instruction is linguistically verified in every locale;
the low-confidence drafts and broader mixed-language audit remain open.

## Rule variable picker: first remaining locale batch

Filled `r-insert-variable` in 17 locales: Kurdish, Central Kurdish, Tatar,
Turkmen, Yiddish, Somali, Chichewa, Bhojpuri, Maithili, Odia, Konkani, Moroccan
Arabic, Papiamento, Māori, Samoan, Southern Sotho and Tswana. The protected fill
preserved existing non-English translations. The source remembers the last
focused text field, so the drafts describe the field most recently selected.
Konkani, Southern Sotho and Tswana paraphrase a variable as a symbol representing
a changing value. The full technical phrasing remains provisional, particularly
those paraphrases and the Chichewa and Samoan terminology.

Added token and label coverage to the locale regression. Parameterized the
existing browser picker scenario for these languages plus English, checking
the visible label in both trigger and action editors while retaining insertion,
focus switching and exclusion of admin-only fields. All 13 focused Node tests
and 21 human-preference checks pass. Browser syntax passes; execution remains
unverified because Playwright is unavailable. There are 49 locales still using
this English label. The wider backlog remains 51,575 ordinary placeholders in
70 languages plus 149 pending source keys; linguistic review remains open.

## Rule variable picker: African and Pacific batch

Filled `r-insert-variable` in 17 more locales: Northern Sotho, Zulu and its South
Africa locale, Xhosa, Swati, Northern Ndebele, Tsonga, Venda, Bislama, Tok Pisin,
Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. The protected
fill preserved existing translations. The labels refer to the most recently
selected text field; several paraphrase a variable as a symbol representing a
changing value.

The [Kinyarwanda algebra glossary](https://www.rcsdk12.org/cms/lib/NY01001156/Centricity/Domain/4194/hs_integrated_algebra_kinyarwanda-13p.pdf)
supports `impinduragaciro`. Word-level evidence does not verify all clauses.
Technical wording remains provisional, especially the paraphrases in Northern
Sotho, Tsonga, Venda, Fijian, Tongan, Hawaiian and Kirundi.

Extended locale and browser picker coverage to these 17 locales. The browser
scenario retains focus switching, insertion and exclusion of admin-only fields.
All 13 focused Node tests and 21 human-preference checks pass; browser syntax
passes. Browser execution remains unverified because Playwright is unavailable.
There are 32 locales still using this English label. The broader backlog remains
51,575 ordinary placeholders in 70 languages plus 149 pending source keys;
linguistic review remains open.

## Rule variable picker: ten further locales

Filled `r-insert-variable` in Tibetan, Dzongkha, Tigrinya, Buryat, Chuvash, Sakha,
Walloon, Waray, Acehnese and Venetian. The protected fill preserved existing
non-English translations. The labels refer to the text field most recently
selected; Dzongkha, Buryat, Chuvash and Sakha describe a symbol representing a
changing value. Full clauses remain provisional, especially those paraphrases
and Acehnese technical wording. Related-language terminology is not proof that
a term is correct for the locale.

Extended locale and browser picker coverage to all ten locales. Existing
insertion, focus-switching and admin-only-field exclusion checks remain. All 13
focused Node tests and 21 human-preference checks pass. Browser syntax passes;
execution remains unverified because Playwright is unavailable. There are 22
locales still using this English label. The broader backlog remains 51,575
ordinary placeholders in 70 languages plus 149 pending source keys. Linguistic
review remains open.

## Rule variable picker: ten additional language drafts

Filled `r-insert-variable` in Akan, Bambara, Ewe, Wolof, Quechua, Aymara, Guarani,
Manx, Northern Sami and Aromanian. The protected helper preserved existing
translations. The labels refer to the most recently selected text field; most
describe a variable as a symbol representing a changing value. Corrected an
initial Bambara draft that accidentally negated change before applying it.

The [Peruvian education ministry vocabulary](https://repositorio.minedu.gob.pe/bitstream/handle/20.500.12799/7196/Yachachinapaq%20shimikuna%20-%20chawpin%20qichwa%20Vocabulario%20pedag%C3%B3gico%20quechua%20central.pdf)
supplies `tikraq` for variable in Central Quechua; wider variety consistency still
requires review. All ten complete labels remain provisional, especially Bambara,
Ewe, Aymara, Guarani, Manx and Aromanian technical phrasing.

Extended locale and browser picker coverage, retaining insertion, focus-switch
and admin-only-field exclusion checks. All 13 focused Node tests and 21
human-preference checks pass. Browser syntax passes; execution remains unverified
because Playwright is unavailable. Twelve locales still use the English label.
The wider backlog remains 51,575 ordinary placeholders in 70 languages plus 149
pending source keys. These checks do not establish linguistic accuracy.

## Rule variable picker: final placeholder batch and all-locale coverage

Filled twelve remaining English labels in Cherokee, Fulah, Inuktitut,
Greenlandic, Kashmiri, Nahuatl, Tigre, Klingon, Veps, Volapük, Wolaytta and
Standard Moroccan Tamazight. Existing translations were preserved. All twelve
complete labels remain low-confidence drafts, especially the symbol/value and
last-selected-field phrasing; full linguistic review remains open.

The [Midgley Volapük dictionary](https://volapuk.evertype.com/EnVoDictionary-20100830.pdf)
supplies `völad` and `välön`, correcting draft roots for value and choosing.
The [comparative Berber computing glossary](https://www.temehu.com/imazighen/dictionaries/Amawals/Computer_dictionary_Berber_English_French.pdf)
supplies `amutti`; its suitability across varieties remains subject to review.
Word references do not validate the complete UI sentences.

A fresh scan finds a nonempty, non-English label in all 234 non-English locales.
Removed the source key from the pending queue (149 to 148). The regression now
discovers all locales and compares source token inventories. Removed the earlier
ASCII-colon assertion when it rejected existing locale punctuation; punctuation
is not a code placeholder. Extended the browser picker scenario to the twelve
locales, retaining insertion, focus switching and admin-only-field exclusion.

All 13 focused Node tests and 21 human-preference checks pass. Browser syntax
passes; execution remains unverified because Playwright is unavailable. A fresh
missing-value report still counts 51,575 ordinary placeholders in 70 languages.
Structural coverage does not establish linguistic accuracy, and the broader
mixed-language audit remains open.

## Rule email report labels: seven further locales (2026-10-07)

- Filled ten English report strings each in Kurmanji, Sorani, Tatar, Somali, Chichewa, Māori and Samoan (70 values). The report only displays attempts; server acceptance is distinct from confirmed delivery, and viewing it neither retries nor cancels sending.
- Used the existing locale vocabulary and the report template as context. Māori terminology references: [whakamātau](https://maoridictionary.co.nz/word/9613) and [computer terminology, including email server](https://www.taiuru.maori.nz/publicationslib/Dictionary-of-Computer-Related-Terms-Edition-2.pdf). Full technical clauses remain provisional, particularly Chichewa and Samoan; these references do not establish sentence-level fluency.
- The ten strings remain English in 58 locales. Ordinary placeholders decrease from 51,575 to 51,505 across 70 languages. All 148 pending keys already differ from English in every non-English locale, but their wording review remains open; this batch does not remove them from that queue.
- All 17 focused Node tests and 21 human-preference checks pass. Extended the existing browser report flow for these seven locales, including filtering, empty results and private-content exclusion. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.

## Rule email report labels: eight further locales (2026-10-07)

- Filled ten English report strings each in Turkmen, Yiddish, Bhojpuri, Maithili, Odia, Konkani, Papiamentu and Moroccan Arabic (80 values), using the existing email-action translations for vocabulary. Full technical clauses remain provisional, especially Konkani and Papiamentu.
- The report description retains both possible states of an unconfirmed attempt and says that the report neither retries nor cancels delivery. The accepted status refers to the mail server. Odia identifiers are not described as necessarily numeric.
- Extended the existing placeholder/state checks and browser report flow to these eight locales. All 17 focused Node tests and 21 human-preference checks pass; browser syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 50 locales. Ordinary placeholders decrease from 51,505 to 51,425 across 70 languages; 148 pending keys still require wording review.

## Rule email report labels: ten southern African locale files (2026-10-07)

- Filled ten English report strings each in Southern Sotho, Tswana, Northern Sotho, both Zulu locales, Xhosa, Swati, Northern Ndebele, Tsonga and Venda (100 values). Used each locale's existing email-action terminology; full technical clauses remain provisional, especially Swati, Northern Ndebele, Tsonga and Venda.
- Southern Sotho identifiers use a paraphrase for identifying codes. The [UNISA applied information science glossary](https://digilibrary.unisa.ac.za/digital/api/collection/p21049coll260/id/6/download) supports the code terminology; it does not validate the full UI sentence. Avoided describing IDs as necessarily numeric.
- Extended the existing placeholder/state checks and browser report flow to these ten locales. All 17 focused Node tests and 21 human-preference checks pass; browser syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 40 locales. Ordinary placeholders decrease from 51,425 to 51,325 across 70 languages; 148 pending keys still require wording review.

## Rule email report labels: nine Pacific and African locales (2026-10-07)

- Filled ten English report strings each in Bislama, Tok Pisin, Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda (90 values). Used existing email-action vocabulary. Technical clauses remain provisional, particularly Fijian, Tongan, Hawaiian and Kirundi.
- Hawaiian terminology was checked against [Kamehameha Schools' lesson using hoʻāʻo for trying](https://www.ksbe.edu/assets/ksdl/KulaiwiTranscription_Lesson06_Final.pdf). This supports the root, not the full sentences or the provisional email-server paraphrase.
- Extended the existing placeholder/state checks and browser report flow to these nine locales. All 17 focused Node tests and 21 human-preference checks pass; browser syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 31 locales. Ordinary placeholders decrease from 51,325 to 51,235 across 70 languages; 148 pending keys still require wording review.

## Rule email report labels: seven further European and Asian locales (2026-10-07)

- Filled ten English report strings each in Walloon, Waray, Acehnese, Manx, Northern Sami, Venetian and Aromanian (70 values). Used existing email-action vocabulary. Full technical clauses remain provisional, especially Acehnese, Manx and Aromanian.
- Terminology references include [UiT's geahččaleapmi entry](https://sanit.oahpa.no/detail/sme/fin/geah%C4%8D%C4%8Daleapmi.html) and [the Manx dictionary's eab entry](https://upload.wikimedia.org/wikipedia/commons/e/e2/The_Manx_dictionary_%28IA_cu31924027086945%29.pdf). These support the attempt terminology, not sentence-level fluency.
- Extended the existing placeholder/state checks and browser report flow to these seven locales. All 17 focused Node tests and 21 human-preference checks pass; browser syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 24 locales. Ordinary placeholders decrease from 51,235 to 51,165 across 70 languages; 148 pending keys still require wording review.

## Rule email report labels: six further African and Asian locales (2026-10-07)

- Filled ten English report strings each in Akan, Bambara, Ewe, Wolof, Fulah and Kashmiri (60 values). Used existing email-action vocabulary; technical clauses remain provisional, especially Ewe, Fulah and Kashmiri.
- Consulted [Bamadaba's vocabulary](https://bamadaba.coastsystems.net/lexicon/s/) for examination terminology and [Janga Wolof's attempt entry](https://jangawolof.org/dictionary-old/english-wolof/a/). These are word-level references, not verification of full technical sentences.
- Extended the existing placeholder/state checks and browser report flow to these six locales. All 17 focused Node tests and 21 human-preference checks pass; browser syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 18 locales. Ordinary placeholders decrease from 51,165 to 51,105 across 70 languages; 148 pending keys still require wording review.

## Rule email report labels: six further locales (2026-10-07)

- Filled ten English report strings each in Buryat, Chuvash, Sakha, Tibetan, Dzongkha and Tigrinya (60 values). Used existing email-action vocabulary. Full technical clauses remain provisional, especially Buryat, Chuvash and Dzongkha.
- Checked Sakha attempt terminology against [SakhaTyla's холон entry](https://sakhatyla.ru/translate?q=%D1%85%D0%BE%D0%BB%D0%BE%D0%BD). This supports vocabulary, not sentence-level fluency or the other locales' wording.
- Extended the existing placeholder/state checks and browser report flow to these six locales. All 17 focused Node tests and 21 human-preference checks pass; browser syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 12 locales. Ordinary placeholders decrease from 51,105 to 51,045 across 70 languages; 148 pending keys still require wording review.

## Rule email report labels: six further locales including constructed languages (2026-10-07)

- Filled ten English report strings each in Quechua, Aymara, Guarani, Veps, Volapük and Klingon (60 values). All six sets remain low-confidence technical drafts, especially the full Veps, Volapük and Klingon clauses.
- Used existing email-action vocabulary and consulted the [Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary) and [Klingon dictionary](https://engineering.thetafleet.net/Journals/Other/Franchise%20-%20The%20Klingon%20Dictionary.pdf). Root vocabulary does not establish fluency; the report and attempt expressions include paraphrases. Corrected the draft Quechua attempt root before applying it.
- Extended the existing placeholder/state checks and browser report flow to these six locales. All 17 focused Node tests and 21 human-preference checks pass; browser syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in six locales. Ordinary placeholders decrease from 51,045 to 50,985 across 70 languages; 148 pending keys still require wording review.

## Rule email report labels: Nahuatl, Wolaytta and Tamazight (2026-10-07)

- Filled ten English report strings each in Nahuatl, Wolaytta and Standard Moroccan Tamazight (30 values). All three sets remain low-confidence technical drafts requiring semantic review.
- Consulted the [Nahuatl dictionary's attestation of trying](https://nahuatl.wired-humanities.org/content/macehualli) and the [comparative Berber computer lexicon](https://www.temehu.com/imazighen/dictionaries/Amawals/Computer_dictionary_Berber_English_French.pdf). The latter spans varieties and does not validate Moroccan sentence-level usage; Wolaytta uses the existing locale vocabulary with provisional technical paraphrases.
- Extended the existing placeholder/state checks and browser report flow to these locales, and checked Tifinagh use without Arabic or Latin prose in the ten Tamazight strings. All 17 focused Node tests and 21 human-preference checks pass; script checks do not prove language accuracy. Browser syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in Cherokee, Inuktitut and Tigre. Ordinary placeholders decrease from 50,985 to 50,955 across 70 languages; 148 pending keys still require wording review.

## Rule email report labels: final three placeholder locales (2026-10-07)

- Filled ten English report strings each in Cherokee, Inuktitut and Tigre (30 values). All three sets remain low-confidence technical drafts, especially Cherokee's full clauses and the server/invocation paraphrases; semantic review remains open.
- Used existing locale vocabulary and consulted the [Cherokee try-verb reference](https://www.culturev.com/cherokee/vtry.html) and [Inuktut affix dictionary](https://www.taiguusiliuqtiit.ca/en/file-download/download/public/56). These references do not establish sentence-level fluency.
- Expanded the report translation check to all 234 non-English locales, checking nonempty non-English values, token inventory and distinct delivery states. All 17 focused Node tests and 21 human-preference checks pass. Extended browser coverage for the final three locales; syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- All ten report strings now have non-English values in all non-English locales. Ordinary placeholders decrease from 50,955 to 50,925 across 70 languages; 148 pending keys still require wording review. This completes placeholder coverage for this group, not the full translation or semantic audit.

## Saved filter labels: seven locales (2026-10-07)

- Filled ten English strings each in Kurmanji, Sorani, Tatar, Somali, Chichewa, Māori and Samoan (70 values). These cover choosing, saving, applying and deleting private board presets, replacement by name, errors and the card-text filter label. Full technical wording remains provisional, especially Chichewa and Samoan.
- Corrected the existing Tatar filter-menu label, which mixed Crimean Turkish vocabulary and morphology, to Tatar. Added a vocabulary regression check alongside placeholder inventory checks.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to the seven locales, checking localized feedback, the privacy/replacement hint and the input's accessible label. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in 59 locales. Ordinary placeholders decrease from 50,925 to 50,855 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: eight further locales (2026-10-07)

- Filled ten English strings each in Turkmen, Yiddish, Bhojpuri, Maithili, Odia, Konkani, Papiamentu and Moroccan Arabic (80 values), using existing filtering and board vocabulary. Preserved the private-per-user, per-board scope and same-name replacement semantics. Technical clauses remain provisional, especially Konkani and Papiamentu.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to these eight locales. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in 51 locales. Ordinary placeholders decrease from 50,855 to 50,775 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: ten southern African locale files (2026-10-07)

- Filled ten English strings each in Southern Sotho, Tswana, Northern Sotho, both Zulu locales, Xhosa, Swati, Northern Ndebele, Tsonga and Venda (100 values), using each locale's existing filtering vocabulary. Preserved the private-per-user, per-board scope and same-name replacement semantics. Technical clauses remain provisional, especially Swati, Northern Ndebele, Tsonga and Venda.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to these ten locales. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in 41 locales. Ordinary placeholders decrease from 50,775 to 50,675 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: nine Pacific and African locales (2026-10-07)

- Filled ten English strings each in Bislama, Tok Pisin, Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda (90 values), using existing locale vocabulary. Preserved the private-per-user, per-board scope and same-name replacement semantics. Technical clauses remain provisional, especially Fijian, Tongan, Hawaiian and Kirundi.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to these nine locales. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in 32 locales. Ordinary placeholders decrease from 50,675 to 50,585 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: seven further European and Asian locales (2026-10-07)

- Filled ten English strings each in Walloon, Waray, Acehnese, Manx, Northern Sami, Venetian and Aromanian (70 values). Preserved the private-per-user, per-board scope and same-name replacement semantics. Technical clauses remain provisional, especially Waray, Acehnese, Manx and Aromanian.
- Replaced the French Waray filter label and Indonesian Acehnese filter label. The [Acehnese thesaurus](https://dokumen.pub/kamus-basa-aceh-kamus-bahasa-aceh-acehneseindonesianenglish-thesaurus-0858835061.html) supports the saréng root; it does not establish the full clauses. Added vocabulary and token regression checks for both corrected labels; the Waray filtering paraphrase remains low confidence.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to these seven locales. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in 25 locales. Ordinary placeholders decrease from 50,585 to 50,515 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: six further African and Asian locales (2026-10-07)

- Filled ten English strings each in Akan, Bambara, Ewe, Wolof, Fulah and Kashmiri (60 values), using existing locale vocabulary. Preserved the private-per-user, per-board scope and same-name replacement semantics. Technical clauses remain provisional, especially Ewe, Fulah and Kashmiri.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to these six locales. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in 19 locales. Ordinary placeholders decrease from 50,515 to 50,455 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: six further locales (2026-10-07)

- Filled ten English strings each in Buryat, Chuvash, Sakha, Tibetan, Dzongkha and Tigrinya (60 values), using existing locale vocabulary. Preserved the private-per-user, per-board scope and same-name replacement semantics. Full technical clauses remain provisional, especially Buryat, Chuvash and Dzongkha.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to these six locales. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in 13 locales. Ordinary placeholders decrease from 50,455 to 50,395 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: six further locales including constructed languages (2026-10-07)

- Filled ten English strings each in Quechua, Aymara, Guarani, Veps, Volapük and Klingon (60 values), using existing locale vocabulary. Preserved the private-per-user, per-board scope and same-name replacement semantics. All six sets remain low-confidence technical drafts, particularly Veps, Volapük and Klingon; semantic review remains open.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to these six locales. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in seven locales. Ordinary placeholders decrease from 50,395 to 50,335 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: four further locales (2026-10-07)

- Filled ten English strings each in Nahuatl, Wolaytta, Standard Moroccan Tamazight and Greenlandic (40 values). All four sets remain low-confidence technical drafts requiring semantic review. Greenlandic uses a provisional sorting-tool paraphrase for filter rather than the existing form label.
- Extended the existing positive browser save/reload/apply/replace/delete flow and negative invalid-expression flow to these four locales. All 15 focused Node tests and 21 human-preference checks pass. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- These ten strings remain English in Cherokee, Inuktitut and Tigre. Ordinary placeholders decrease from 50,335 to 50,295 across 70 languages; 148 pending keys still require wording review.

## Saved filter labels: final three placeholder locales (2026-10-07)

- Filled ten English strings each in Cherokee, Inuktitut and Tigre (30 values). All three sets remain low-confidence technical drafts requiring semantic review, especially Cherokee's clauses and the filtering paraphrases. Inuktitut describes filters as tools for choosing what is displayed.
- Expanded the saved-filter translation check to all 234 non-English locales, checking nonempty non-English values, token inventory and distinct operation messages. All 15 focused Node tests and 21 human-preference checks pass. Extended positive and negative browser coverage to the final three locales; syntax passes, but execution remains unverified because the local Playwright executable is unavailable.
- All ten saved-filter strings now have non-English values in all non-English locales. Ordinary placeholders decrease from 50,295 to 50,265 across 70 languages; 148 pending keys still require wording review. This completes placeholder coverage for this group, not the full translation or semantic audit.

## String Template context hint: first seven placeholder locales (2026-10-07)

- Filled the context-variable and URL-encoding hint in Kurmanji, Sorani, Tatar, Somali, Chichewa, Māori and Samoan. Preserved all five literal variable examples and both occurrences of `|urlencode`. Technical wording, particularly in Chichewa and Samoan, remains provisional and requires semantic review.
- Corrected the adjacent Tatar format and separator labels, replacing mixed Crimean Turkic wording with Tatar and restoring the malformed `&nbsp;` entity. Added regression coverage for these corrections.
- All 23 focused Node tests and 21 human-preference checks pass. The tests compare token inventories and execute each documented variable example through the formatter; existing negative tests cover unknown paths and invalid formatting. Added localized browser checks for the visible hint and its absence for another field type. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- Ordinary placeholders decrease from 50,265 to 50,258 across 70 languages. The 148 pending source keys still require wording review, and the broader translation and semantic audit remain open.

## String Template context hint: eighteen further locales (2026-10-07)

- Filled the variable and URL-encoding hint in Turkmen, Yiddish, Bhojpuri, Maithili, Odia, Konkani, Papiamento, Moroccan Arabic, Sesotho, Setswana, Northern Sotho, both Zulu locales, Xhosa, Swati, Northern Ndebele, Xitsonga and Venda. Technical wording remains provisional, particularly in Konkani, Swati, Northern Ndebele and Venda; placeholder completion is not proof of fluency.
- Replaced the adjacent Xitsonga format label's generic filler with a description of the value placeholder, with a regression check rejecting the old filler.
- All 23 focused Node tests and 21 human-preference checks pass. Extended token and executable-example checks and localized positive/negative browser coverage to all eighteen locales. Browser syntax passes; browser execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,258 to 50,240 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## String Template context hint: nine Pacific and African locales (2026-10-07)

- Filled the context-variable and URL-encoding hint in Bislama, Tok Pisin, Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda, preserving the literal examples. Technical wording remains provisional, especially the Fijian, Tongan and Hawaiian paraphrases.
- Replaced the draft Hawaiian term `palena` with a description of sending a value in the URL: the [University of Hawaiʻi dictionary entry](https://wehe.hilo.hawaii.edu/?l=&q=palena) supports boundary/limit, not this computing sense of parameter. This lookup does not validate the entire sentence.
- All 23 focused Node tests and 21 human-preference checks pass. Extended executable-example/token checks and positive/negative browser coverage to the nine locales. Browser syntax passes; execution remains unverified because the local Playwright executable is unavailable.
- Ordinary placeholders decrease from 50,240 to 50,231 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## String Template context hint: seven further locales (2026-10-07)

- Filled the variable and URL-encoding hint in Walloon, Waray, Acehnese, Manx, Northern Sami, Venetian and Aromanian, preserving all literal examples. These technical sentences remain provisional, particularly Manx, Northern Sami and Aromanian.
- Corrected the draft Manx opening to `Jean ymmyd jeh`, using the imperative attested in the [ymmyd entry](https://en.wiktionary.org/wiki/ymmyd). The Aromanian use-verb is also attested in a [dialect teaching manual](https://lingv.ro/wp-content/uploads/2025/10/Manual-de-dialect-aroman-pentru-elevii-si-studentii-din-Albania.pdf). These references support individual wording choices, not full-sentence validation.
- All 23 focused Node tests and 21 human-preference checks pass. Extended token/executable-example checks and positive/negative localized browser coverage. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,231 to 50,224 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## String Template context hint: twelve further locales (2026-10-07)

- Filled the variable and URL-encoding hint in Akan, Bambara, Ewe, Wolof, Fulah, Kashmiri, Buryat, Chuvash, Sakha, Tibetan, Dzongkha and Tigrinya. Used the existing variable-label terminology while preserving the five code examples. These technical translations remain low-confidence drafts requiring semantic review.
- All 23 focused Node tests and 21 human-preference checks pass. Extended token and executable-example checks and localized positive/negative browser coverage to the twelve locales. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,224 to 50,212 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## String Template context hint: six further locales (2026-10-07)

- Filled the variable and URL-encoding hint in Quechua, Aymara, Guarani, Veps, Volapük and Klingon. All six technical translations remain low-confidence drafts requiring semantic review, particularly Veps and the constructed languages. Volapük and Klingon use provisional paraphrases about sending a value through the URL rather than an unverified parameter term.
- Consulted the [Midgley English–Volapük dictionary](https://volapuk.evertype.com/EnVoDictionary-20100830.pdf); no parameter entry was found. This lookup does not establish full-sentence correctness.
- All 23 focused Node tests and 21 human-preference checks pass. Extended token/executable-example checks and localized positive/negative browser coverage. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- This hint remains English in seven locales. Ordinary placeholders decrease from 50,212 to 50,206 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## String Template context hint: four further locales (2026-10-07)

- Filled the variable and URL-encoding hint in Nahuatl, Wolaytta, Standard Moroccan Tamazight and Greenlandic. All four remain low-confidence technical drafts requiring semantic review. Preserved each literal code example; added a Tifinagh prose check that excludes the required code literals.
- Replaced the adjacent Wolaytta format label's English text and language-name prefix with a provisional Wolaytta description. Added a regression check rejecting that English filler while preserving `%{value}`. Consulted the [Wolaytta teaching text](https://camaraethiopia.org.et/SNNPR/moe/content/SNE_TB/Sign%20Language%20G1-12/03-Wolayitato-Books-Sign-Language/07-HD-ESL-G7-SB.pdf) for example vocabulary; this does not validate the full technical wording.
- All 23 focused Node tests and 21 human-preference checks pass. Extended localized positive/negative browser coverage; syntax passes, but execution remains unverified because Playwright is unavailable locally.
- This hint remains English in Cherokee, Inuktitut and Tigre. Ordinary placeholders decrease from 50,206 to 50,202 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## String Template context hint: final three placeholder locales (2026-10-07)

- Filled the variable and URL-encoding hint in Cherokee, Inuktitut and Tigre. These remain low-confidence drafts, especially Cherokee's technical clause; semantic review remains open. Inuktitut describes sending a value through the URL. The [Inuktitut mathematics teaching material](https://angirrami.com/wp-content/uploads/2020/04/Grade-2-Complete-Nunavut-Math.pdf) provides examples of the use-verb, but does not validate the full technical translation.
- Expanded the hint check to all 234 non-English locales: nonempty non-English values, exact token inventory, both `|urlencode` occurrences, and executable results for each code example. All 23 focused Node tests and 21 human-preference checks pass. Extended positive/negative localized browser coverage to the final three locales; syntax passes, but execution remains unverified because Playwright is unavailable locally.
- This hint now has non-English values in every non-English locale. Ordinary placeholders decrease from 50,202 to 50,199 across 70 languages. The 148 pending source keys and broader semantic audit remain open; completed placeholder coverage does not establish fluency.

## Duplicate-card relationship labels: fifteen locales (2026-10-07)

- Filled both directed relationship labels in Kurmanji, Sorani, Tatar, Somali, Chichewa, Māori, Samoan, Turkmen, Yiddish, Bhojpuri, Maithili, Odia, Konkani, Papiamento and Moroccan Arabic (30 values). The wording distinguishes a card duplicating another from being duplicated by it. Chichewa, Samoan and Konkani wording remains particularly provisional; distinct strings alone do not prove correct direction or fluency.
- All four focused Node tests and 21 human-preference checks pass, covering locale token inventories, distinct labels, inverse relations, serialization and invalid board/deleted-card targets. Extended the existing localized browser editing and undo/redo flow to fifteen locales; existing REST negative tests retain self-link and foreign-board rejection coverage. Browser syntax passes, but execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,199 to 50,169 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Duplicate-card relationship labels: nineteen further locales (2026-10-07)

- Filled both directed relationship labels in Sesotho, Setswana, Northern Sotho, both Zulu locales, Xhosa, Swati, Northern Ndebele, Xitsonga, Venda, Bislama, Tok Pisin, Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda (38 values). Used paired descriptions of which item is a copy of the other. Pronoun agreement and technical wording remain provisional, particularly Swati, Northern Ndebele, Venda, Fijian and Tongan.
- All four focused Node tests and 21 human-preference checks pass, covering distinct translated labels, tokens, inverse relations and invalid targets. Extended the browser editing and undo/redo flow to these locales; existing REST tests cover self-link and foreign-board rejection. Browser syntax passes, but execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,169 to 50,131 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Duplicate-card relationship labels: thirteen further locales (2026-10-07)

- Filled both directed relationship labels in Walloon, Waray, Acehnese, Manx, Northern Sami, Venetian, Aromanian, Akan, Bambara, Ewe, Wolof, Fulah and Kashmiri (26 values). Technical wording and pronoun agreement remain provisional, particularly Manx, Aromanian, Fulah and Kashmiri. The attempted external check of Fulah copy vocabulary was inconclusive; its final `nattol` wording remains explicitly low-confidence.
- All four focused Node tests and 21 human-preference checks pass, covering distinct labels, token inventories, inverse relations and invalid targets. Extended localized browser editing and undo/redo coverage; existing REST negatives cover self-links and foreign-board links. Browser syntax passes, but execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,131 to 50,105 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Duplicate-card relationship labels: twelve further locales (2026-10-07)

- Filled both directed labels in Buryat, Chuvash, Sakha, Tibetan, Dzongkha, Tigrinya, Quechua, Aymara, Guarani, Veps, Volapük and Klingon (24 values). Technical wording and direction phrasing remain provisional, especially Chuvash, Veps and the constructed languages.
- Corrected the draft Volapük noun to `kopied` using the [English–Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary). The [Klingon Language Institute](https://www.kli.org/about-klingon/new-klingon-words/v/) confirms `velqa'` for replica/copy. These references validate vocabulary, not the complete relationship-label grammar.
- All four focused Node tests and 21 human-preference checks pass. Extended localized browser editing and undo/redo coverage; existing negatives retain self-link and foreign-board rejection checks. Browser syntax passes, but execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,105 to 50,081 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Duplicate-card relationship labels: final seven placeholder locales (2026-10-07)

- Filled both directed labels in Nahuatl, Wolaytta, Standard Moroccan Tamazight, Greenlandic, Inuktitut, Tigre and Cherokee (14 values). All seven sets remain low-confidence drafts requiring semantic review, particularly Cherokee's copy paraphrase. Distinct strings and correct scripts do not establish grammar or relationship direction.
- Expanded the locale check to all 234 non-English locales. All four focused Node tests and 21 human-preference checks pass, checking non-English values, token inventories, distinct labels, inverse relations and invalid targets. Extended localized browser editing and undo/redo coverage to the final seven locales. Browser syntax passes, but execution remains unverified because Playwright is unavailable locally.
- Both labels now have non-English values in every non-English locale. Ordinary placeholders decrease from 50,081 to 50,067 across 70 languages. The 148 pending source keys and broader semantic audit remain open; this completes placeholder coverage for the pair, not the overall task.

## Board drag-permission label: fifteen locales (2026-10-07)

- Filled `draggable` in Kurmanji, Sorani, Tatar, Somali, Chichewa, Māori, Samoan, Turkmen, Yiddish, Bhojpuri, Maithili, Odia, Konkani, Papiamento and Moroccan Arabic. Used ability-to-drag wording for the checkbox column controlling board dragging. Chichewa, Maithili and Konkani wording remains particularly provisional.
- Both focused Node tests and 21 human-preference checks pass, including catalog tokens and existing positive/negative board-drag policy assertions. Extended browser heading checks and independent disable/re-enable persistence coverage to the fifteen locales. Existing browser negatives cover unauthorized changes, disabled dragging and explicit menu moves. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,067 to 50,052 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Board drag-permission label: nineteen further locales (2026-10-07)

- Filled `draggable` in Sesotho, Setswana, Northern Sotho, both Zulu locales, Xhosa, Swati, Northern Ndebele, Xitsonga, Venda, Bislama, Tok Pisin, Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Used can-be-dragged wording for the permission column. Pronoun agreement across cards, lists and swimlanes and technical wording remain provisional, particularly Swati, Northern Ndebele, Venda, Fijian and Tongan.
- Both focused Node tests and 21 human-preference checks pass, including catalog tokens and existing positive/negative drag-policy assertions. Extended localized heading and disable/re-enable persistence browser coverage to these locales. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,052 to 50,033 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Board drag-permission label: thirteen further locales (2026-10-07)

- Filled `draggable` in Walloon, Waray, Acehnese, Manx, Northern Sami, Venetian, Aromanian, Akan, Bambara, Ewe, Wolof, Fulah and Kashmiri. Technical wording remains provisional, particularly Aromanian, Fulah and Kashmiri; the external Fulah word lookup was inconclusive.
- References attest Manx [tayrn](https://en.wiktionary.org/wiki/tayrn) and Northern Sami [geassit](https://en.wiktionary.org/wiki/-a%C5%A1it) as pull/drag vocabulary, without validating the full labels.
- Both focused Node tests and 21 human-preference checks pass, including positive/negative drag-policy assertions. Extended localized heading and disable/re-enable persistence browser coverage. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,033 to 50,020 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Board drag-permission label: twelve further locales (2026-10-07)

- Filled `draggable` in Buryat, Chuvash, Sakha, Tibetan, Dzongkha, Tigrinya, Quechua, Aymara, Guarani, Veps, Volapük and Klingon. Technical wording remains provisional, particularly Chuvash, Veps and the constructed languages.
- Used the Volapük pull root `tirön` from the [Midgley dictionary](https://xn--volapk-7ya.com/EnVoDictionary-20100830.pdf). Refined Klingon to `HoqlaH vay'`, avoiding incompatible suffixes and the abrupt yank verb; the [KLI discussion](https://lists.kli.org/archives/list/tlhingan-hol%40lists.kli.org/thread/T3TNKU5ES7COQ3NDWFQOL6U5SMQ7NCQV/) distinguishes pulling an object along from yanking. The complete UI labels still require semantic review.
- Both focused Node tests and 21 human-preference checks pass, including positive/negative drag-policy assertions. Extended localized heading and disable/re-enable persistence browser coverage. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,020 to 50,008 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Board drag-permission label: six further locales (2026-10-07)

- Filled `draggable` in Nahuatl, Wolaytta, Standard Moroccan Tamazight, Greenlandic, Inuktitut and Tigre. These labels remain low-confidence technical drafts requiring semantic review. The [Nahuatl dictionary](https://nahuatl.wired-humanities.org/content/tilana) supports the pull root `tilana`; this does not validate all wording.
- Both focused Node tests and 21 human-preference checks pass, including positive/negative drag-policy assertions. Extended localized heading and disable/re-enable persistence browser coverage. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- Cherokee still has the English drag-permission label; its vocabulary lookup remains unfinished. Ordinary placeholders decrease from 50,008 to 50,002 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Board drag-permission label: final placeholder locale (2026-10-07)

- Filled the Cherokee `draggable` label using a provisional ability-to-pull phrase. The [Cherokee verb vocabulary guide](https://www.scribd.com/document/104661676/CWY-Verb-Vocab-2012), page 76, supplies the pulling stem through `Jinasanea` and `Hinsanagi`. The derived label is low-confidence: this reference does not establish its grammatical correctness, and semantic review remains open.
- Expanded the label check to all 234 non-English locales. Both focused Node tests and 21 human-preference checks pass, including token inventories and positive/negative drag-policy assertions. Added Cherokee to the localized browser heading and disable/re-enable persistence flow. Browser syntax passes; execution remains unverified because Playwright is unavailable locally.
- The drag-permission label now has non-English text in every non-English locale. Ordinary placeholders decrease from 50,002 to 50,001 across 70 languages. The 148 pending source keys and broader semantic audit remain open; placeholder coverage is not proof of fluency.

## Blockly movement announcements: seven locales (2026-10-07)

- Filled twelve movement and scrolling announcements in Kurmanji, Sorani, Tatar, Somali, Chichewa, Māori and Samoan (84 values). Preserved `%1` and `%2` and distinguished before/after, inside/around and four scrolling directions. Technical phrasing remains provisional, especially Chichewa and Samoan.
- All twelve focused Node tests and 21 human-preference checks pass. Added exact token-inventory and distinct-direction checks; existing negative import tests reject broken placeholders and protect local translations. Extended the localized editor drag/edit/context-menu browser flow to these seven locales. Browser syntax passes, but execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 50,001 to 49,917 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: eight further locales (2026-10-07)

- Filled twelve movement and scrolling announcements in Turkmen, Yiddish, Bhojpuri, Maithili, Odia, Konkani, Papiamento and Moroccan Arabic (96 values). Preserved `%1` and `%2` and distinct movement/scrolling directions. Technical phrasing remains provisional, particularly Maithili, Konkani and Papiamento.
- All twelve focused Node tests and 21 human-preference checks pass. Extended exact token-inventory and distinct-direction checks, alongside existing negative import tests. Extended localized editor drag/edit/context-menu browser coverage; syntax passes, but execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,917 to 49,821 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: ten southern African locale files (2026-10-07)

- Filled twelve movement and scrolling announcements in Sesotho, Setswana, Sepedi, Zulu (`zu` and `zu-ZA`), Xhosa, Swati, Northern Ndebele, Tsonga and Venda (120 values). The protected fill utility preserved existing translations. Arguments and distinct directions are retained. Technical phrasing, particularly Swati, Northern Ndebele and Venda, remains low confidence and needs fluent-speaker review.
- Direction vocabulary was cross-checked against the [Sesuto-English dictionary](https://emandulo.apc.uct.ac.za/collection/FHYA%20Depot/Mabille_Adolphe_Sesuto_English_Dictionary.pdf), [Swati school terminology](https://www.education.gov.za/LinkClick.aspx?fileticket=4wAu1c3Kfts%3D&mid=14442&portalid=0&tabid=5590) and [Venda dictionary](https://www.scribd.com/document/781724274/67089703335-1). These references do not validate complete technical clauses.
- All twelve focused Node tests and 21 human-preference checks pass. Extended token-inventory and distinct-direction checks alongside existing negative import tests. Added the ten locales to the localized editor drag/edit/context-menu browser flow. Syntax passes; browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,821 to 49,701 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: nine Pacific and African locales (2026-10-07)

- Filled twelve movement and scrolling announcements in Bislama, Tok Pisin, Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda (108 values). The protected fill utility preserved existing translations. Arguments and distinct directions are retained. Technical phrasing remains provisional, particularly Tongan, Hawaiian and Luganda. Luganda scrolling uses a paraphrase about moving the visible content after the initial draft's proposed scrolling verb could not be substantiated.
- Direction vocabulary was checked against the [Bislama workbook](https://www.livelingua.com/peace-corps/Bislama/Bislama%20Handbook%20-%20Revision%20July%202011.pdf), [Tongan bilingual dictionary](https://education.nsw.gov.au/content/dam/main-education/teaching-and-learning/curriculum/multicultural-education/eald/eald-bilingual-dictionary-tongan.pdf), [Tok Pisin dictionary](https://www.tok-pisin.com/define.php?id=MTMzNg%3D%3D&tokpisin=paspas-bilong-han) and [Kirundi dictionary](https://www.matana.de/index1.php?deep=&q=left). These references support individual terms, not complete technical clauses.
- All twelve focused Node tests and 21 human-preference checks pass. Extended token-inventory and distinct-direction checks alongside existing negative import tests. Added the nine locales to the localized editor drag/edit/context-menu browser flow. Syntax passes; browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,701 to 49,593 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: five further locales (2026-10-07)

- Filled twelve movement and scrolling announcements in Walloon, Waray, Acehnese, Northern Sámi and Venetian (60 values). The protected fill utility left the already translated Manx and Aromanian announcements unchanged. Added all seven locales to the direction and token-inventory checks. Technical wording remains provisional, particularly Walloon, Acehnese and Northern Sámi; structural checks do not prove fluency.
- Vocabulary references include [Walloon bodjî](https://dtw.walon.org/index.php?query=bodj%C3%AE), [Acehnese direction words](https://abvd.eva.mpg.de/austronesian/language.php?id=648), [Northern Sámi computing vocabulary](https://samifaga.org/samis/samis17-18/files/assets/common/downloads/publication.pdf) and [Venetian scórare](https://de.scribd.com/document/382989660/Basso-W-dizionario-Da-Scarsela-Veneto-Italiano). The Sámi vocabulary explicitly gives rullet for scrolling a computer page. These references support terms, not complete clauses.
- All twelve focused Node tests and 21 human-preference checks pass. Existing negative import tests protect translations and reject broken placeholders. Extended localized editor drag/edit/context-menu browser coverage to the seven locales; syntax passes, but browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,593 to 49,533 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: six further locales (2026-10-07)

- Filled twelve movement and scrolling announcements in Akan, Bambara, Ewe, Wolof, Fulah and Kashmiri (72 values). Used the protected fill utility and preserved arguments and distinct directions. Technical phrasing remains provisional, particularly Bambara, Ewe and Fulah. Fulah's around clause uses a circling verb instead of the initial draft's proximity word; its full grammar still needs review.
- Vocabulary references include the [Bambara manual](https://www.livelingua.com/peace-corps/Bambara/Bambara_Manual.pdf), [Wolof manual](https://publish.illinois.edu/wolof201fall14/files/2014/08/NEW_WOLOF_BOOK.pdf), [Fulah movement root](https://en.wiktionary.org/wiki/dirde) and [Fulfulde circling verb](https://en.glosbe.com/fuh/en/taaraade). These references support vocabulary, not complete technical clauses or uniformity across Fulah varieties.
- All twelve focused Node tests and 21 human-preference checks pass. Extended token-inventory and distinct-direction coverage alongside existing negative import tests. Added all six locales to the localized editor drag/edit/context-menu browser flow; syntax passes, but browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,533 to 49,461 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: six Asian and African locales (2026-10-07)

- Filled twelve movement and scrolling announcements in Buryat, Chuvash, Sakha, Tibetan, Dzongkha and Tigrinya (72 values). Used the protected fill utility and preserved arguments and distinct directions. Technical phrasing remains provisional, particularly Buryat, Chuvash, Sakha and Dzongkha; passing structural tests does not establish fluency.
- Vocabulary references include the [Buryat phrasebook](https://folkways.today/talking-buryat-phrasebook/), [Chuvash dictionary](https://ru.samahsar.chuvash.org/article/28508.link), [Sakha phrasebook](https://en.wikivoyage.org/wiki/Sakha_phrasebook) and [Dzongkha computer terminology](https://download-mirror.savannah.gnu.org/releases/dzongkha-gnome/dzongkha_computer_terms.pdf). The Dzongkha source gives the scroll term; the announcement clauses are independently drafted and remain subject to wording review.
- All twelve focused Node tests and 21 human-preference checks pass. Extended token-inventory and distinct-direction coverage alongside existing negative import tests. Added all six locales to the localized editor drag/edit/context-menu browser flow; syntax passes, but browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,461 to 49,389 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: six American, European and constructed locales (2026-10-07)

- Filled twelve movement and scrolling announcements in Quechua, Aymara, Guaraní, Veps, Volapük and Klingon (72 values). The protected fill utility preserved existing translations. Arguments and distinct directions are retained. Technical phrasing is provisional, particularly Aymara, Veps, Volapük and Klingon. Descriptions of moving the visible content stand in for a dedicated scrolling term where uncertain.
- Vocabulary references include [Quechua pedagogical vocabulary](https://repositorio.minedu.gob.pe/bitstream/handle/20.500.12799/7490/Yachachinapaq%20simikuna%20-%20Urin%20Qichwa%20vocabulario%20pedag%C3%B3gico%20quechua%20sure%C3%B1o.pdf?isAllowed=y&sequence=1), [Veps sirtta inflection](https://en.wiktionary.org/wiki/sirtta), the [Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary) and [Klingon movement discussion](https://www.kli.org/tlhIngan-Hol/1994/March/msg00003.html). Corrected the new Veps draft's movement forms against the inflection table. These references support vocabulary rather than validate complete clauses.
- All twelve focused Node tests and 21 human-preference checks pass. Extended token-inventory and distinct-direction checks alongside existing negative import tests. Added all six locales to the localized editor drag/edit/context-menu browser flow. Syntax passes; browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,389 to 49,317 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: four further locales (2026-10-07)

- Filled twelve movement and scrolling announcements in Nahuatl, Wolaytta, Standard Moroccan Tamazight and Wu Chinese (48 values). Used the protected fill utility and retained arguments and distinct directions. Nahuatl, Wolaytta and Tamazight technical clauses are low confidence; grammatical and dialect review remains necessary. Tamazight prose uses Tifinagh, and scrolling uses a description of moving what is visible.
- Vocabulary references include [Nahuatl olinia](https://nahuatl.wired-humanities.org/content/olinia), [Nahuatl opochcopa](https://gdn.iib.unam.mx/diccionario/opochcopa/58883), [Wakasa's Wolaytta grammar](https://theswissbay.ch/pdf/Books/Linguistics/Mega%20linguistics%20pack/Afro-Asiatic/Omotic/Wolaytta%20Language,%20A%20Descriptive%20Study%20of%20the%20Modern%20(Wakasa)%20(1).pdf) and the [Tamazight dictionary](https://www.livelingua.com/peace-corps/Tamazight/Tamazight-English-Dictionary-2007.pdf). Wakasa gives movement and spatial constructions; references do not validate the complete announcement clauses.
- All twelve focused Node tests and 21 human-preference checks pass. Extended exact token and distinct-direction checks alongside existing negative import tests. Added all four locales to the localized editor drag/edit/context-menu browser flow. Syntax passes; browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,317 to 49,269 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: Greenlandic and Inuktitut (2026-10-07)

- Filled twelve movement and scrolling announcements in each of Greenlandic and Inuktitut (24 values), using the protected fill utility. Arguments and distinct directions are retained. Scrolling describes moving the visible content. Both sets of technical clauses remain low confidence, including case endings around substituted block names and workspace terminology; structural tests do not establish fluency.
- References include [An Introduction to West Greenlandic](https://oqa.dk/assets/aitwg2ED.pdf) and [Kativik Ilisarniliriniq's Inuktitut spatial grammar](https://nunavik-ice.com/en/c/inuktitut-en/locative-pronouns/). The latter distinguishes front, back, around, inside and left/right bases; it does not validate the independently drafted full announcements.
- All twelve focused Node tests and 21 human-preference checks pass. Extended exact token and distinct-direction checks alongside existing negative import tests. Added both locales to the localized editor drag/edit/context-menu browser flow. Syntax passes; browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,269 to 49,245 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly movement announcements: Tigre (2026-10-07)

- Filled twelve Tigre movement and scrolling announcements with the protected fill utility. Retained arguments and distinct directions. These are low-confidence technical clauses, especially the movement verb, cancellation and the paraphrase for scrolling; they require grammatical and dialect review. They were drafted separately from Tigrinya.
- Consulted [Omar M. Kekia's Tigre lessons](https://www.speaktigre.com/_files/ugd/7e068a_d791dde4087041feaf3dedb6b109829c.pdf?index=true), especially lessons 26–28 for spatial expressions, and [Beurmann's Tigre vocabulary](https://www.speaktigre.com/_files/ugd/7e068a_a5fbea1fb5e544e69d94cab002762da2.pdf?index=true), printed pages 46 and 52 for left/right. These support individual spatial terms and constructions, not the full announcement clauses. The old vocabulary's transliteration adds uncertainty when rendered in Ethiopic script.
- All twelve focused Node tests and 21 human-preference checks pass. Extended exact token and distinct-direction checks alongside existing negative import tests. Added Tigre to the localized editor drag/edit/context-menu browser flow. Syntax passes; browser execution and actual screen-reader announcement behavior remain unverified because Playwright is unavailable locally.
- Ordinary placeholders decrease from 49,245 to 49,233 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Cherokee Blockly movement announcements

- Filled the twelve movement and scrolling announcements in `chr` through the protected placeholder-only merge. This completes non-English coverage of this group in all 234 non-English locales; `ANNOUNCE_MOVE_OF` is a separate key and remains outside this group.
- Vocabulary references: [Feeling dictionary movement entry](https://www.cherokeedictionary.net/share/72393), [circling entry](https://www.cherokeedictionary.net/newSearch/xrefdisplay?current=72255&old=adeyoha), [Cherokee Nation grammar](https://cherokeenationdictionary.net/pdf/cherokee_grammar.pdf), and [OU dictionary](https://language.cherokee.org/media/ausnrxe1/oudictionaryutana.pdf). These support vocabulary, not the full UI sentences. Movement inflection, cancellation phrasing, spatial arguments and scrolling paraphrases are **low confidence** and remain open for fluent review.
- Expanded the announcement regression to every non-English locale: nonempty/non-English values, exact underscore/percent token inventories, four distinct scroll directions, before/after and inside/around distinctions. The Blockly/completeness suites pass 12 tests; translation human-preference verification passes 21 checks.
- Registered Cherokee in the existing Blockly editor browser flow and syntax-checked it. Playwright is absent locally, so neither that flow nor spoken screen-reader announcements were executed. Structural checks do not establish translation fluency.
- Ordinary placeholders decrease from 49,233 to 49,221 across 70 languages. The 148 pending source keys and broader semantic audit remain open.

## Blockly comment and accessibility controls: first seven locales

- Filled 104 English placeholders across Kurmanji (`ku`), Central Kurdish (`ckb`), Tatar (`tt`), Somali (`so`), Chichewa (`ny`), Māori (`mi`) and Samoan (`sm`). The fifteen-key group covers add/remove comment and thirteen accessibility labels for conditional branches, inputs, list items, text, buttons, comment collapse/expand, angle degrees and the empty trash. The existing Kurmanji add-comment translation was preserved by the protected merge.
- Corrected Tatar's generic `text` label from Crimean Tatar `Метин` to Tatar `Текст`; the new Blockly labels use the same term. Remaining mixed-language values are outside this batch and still require review.
- Existing locale terminology guided the drafts. Māori input/button vocabulary was checked against [Te Aka tāuru](https://maoridictionary.co.nz/search?keywords=t%C4%81uru), [Te Aka pātene](https://maoridictionary.co.nz/search?keywords=patene) and [Taiuru's computer terminology](https://www.taiuru.maori.nz/publicationslib/Dictionary-of-Computer-Related-Terms-Edition-2.pdf). Full conditional-branch phrases and Samoan input paraphrases remain provisional; Chichewa, Kurdish and Samoan technical wording is low confidence.
- The regression checks every value in this batch for nonempty/non-English prose and exact source placeholder inventories, distinguishes opposing operations, and locks the Tatar correction. Blockly/completeness: 13 tests pass. Human-preference verification: 21 checks pass.
- Added visible translated add-comment context-menu assertions to the existing seven-language editor flows; syntax checked only. Playwright is absent locally, so browser and assistive-technology execution remain unverified. Structural checks do not establish fluent wording.
- Ordinary placeholders decrease from 49,221 to 49,117 across 70 languages. The 148 pending source keys and the broader all-language and semantic work remain open.

## Blockly comment and accessibility controls: eight more locales

- Filled all fifteen labels in Turkmen (`tk_TM`), Yiddish (`yi`), Bhojpuri (`bho`), Maithili (`mai`), Odia (`or_IN`), Konkani (`kok`), Papiamentu (`pap`) and Moroccan Arabic (`ary`): 120 English placeholders. The protected merge preserved existing non-English values. The group includes comment actions, conditional branches, inputs, list items, text, button, collapse/expand, angle degrees and empty trash.
- Existing catalog vocabulary guided the translations. Papiamentu button and reduction spellings were checked against [the 2009 orthography and word list](https://dokumen.pub/ortografia-i-lista-di-palabra-papiamentu-buki-di-oro-9789990422009.html); the uncertain expansion loanword was replaced with a plain “make larger” paraphrase. This reference does not attest the full UI sentences. Conditional-branch phrasing remains provisional, especially in Konkani, Papiamentu and Moroccan Arabic, and is recorded as low confidence.
- Extended the existing fifteen-label regression and visible add-comment browser assertion to these eight locales. Exact source placeholders and distinct add/remove, collapse/expand operations are checked. Blockly/completeness: 13 tests pass; human-preference verification: 21 checks pass.
- Browser coverage is syntax-checked only: Playwright is absent locally. Browser interaction and spoken accessibility labels remain unverified; structural tests do not certify language quality.
- Ordinary placeholders decrease from 49,117 to 48,997 across 70 languages. The 148 pending source keys and broader translation/semantic audit remain open.

## Blockly comment and accessibility controls: southern African locales

- Filled fifteen English placeholders in each of Sesotho (`st`), Setswana (`tn`), Northern Sotho (`nso`), Zulu (`zu`, `zu-ZA`), Xhosa (`xh`), Swati (`ss`), Northern Ndebele (`nd`), Tsonga (`ts`) and Venda (`ve`): 150 values. The protected merge retains existing translations. This covers comment controls and accessibility labels for conditional branches, inputs, list items, text, buttons, collapse/expand, angle degrees and empty trash.
- Used existing catalog terminology and the [Multilingual Mathematics Dictionary](https://lwimilinks.sadilar.org/media/documents/Multilingual_Mathematics.pdf), printed pages 20 and 40, for button and degree vocabulary. Its Ndebele entries are Southern Ndebele and were not used to validate Northern Ndebele wording. Northern Sotho uses the documented angle-unit root `kgato`.
- Conditional-branch and input phrases remain provisional. Swati, Northern Ndebele and Venda technical phrasing is low confidence; dictionary vocabulary does not establish full-sentence correctness. Broader mixed-language catalog problems remain outside this batch.
- Extended the fifteen-label regression and translated add-comment browser assertion to all ten paths. Source placeholders and opposing operations remain distinct. Blockly/completeness: 13 tests pass. Human-preference verification: 21 checks pass.
- Browser coverage was syntax-checked, not executed: Playwright is absent locally. Screen-reader delivery and fluent wording remain unverified.
- Ordinary placeholders decrease from 48,997 to 48,847 across 70 languages. The 148 pending source keys and broader translation/semantic audit remain open.

## Blockly comment and accessibility controls: nine more locales

- Filled fifteen English placeholders each in Bislama (`bi`), Tok Pisin (`tpi`), Fijian (`fj`), Tongan (`to`), Hawaiian (`haw`), Oromo (`om`), Kinyarwanda (`rw`), Kirundi (`rn`) and Luganda (`lg`): 135 values. Existing non-English values remain protected. The group covers comment controls, conditional branches, inputs, list items, text, button, collapse/expand, angle degrees and empty trash.
- Replaced Tongan's generic `text` value `Faka-Tonga: Text` with `Lea kuo tohi` (written words). The old value was English with a language-name prefix, not a translation. Added a regression for the correction.
- Vocabulary references: [NSW Tongan bilingual dictionary](https://education.nsw.gov.au/content/dam/main-education/teaching-and-learning/curriculum/multicultural-education/eald/eald-bilingual-dictionary-tongan.pdf) for button, [Luganda button dictionary entry](https://glosbe.com/en/lg/button), [Hawaiian degree entry](https://wehe.hilo.hawaii.edu/?q=k%C4%93kel%C4%93) and [the Hawaiian dictionary interface](https://wehe.hilo.hawaii.edu/settings.php) for button usage. Corrected the drafted degree spelling to `kēkelē`.
- The complete UI phrases are not attested by those references. Conditional-branch and input paraphrases remain provisional, particularly in Fijian, Tongan, Hawaiian and Luganda, and are low confidence. Structural coverage does not establish language quality.
- Extended the fifteen-label regression and translated add-comment browser assertions to these nine locales. Blockly/completeness: 13 tests pass. Human-preference verification: 21 checks pass. Browser coverage is syntax-checked only; Playwright is absent locally and spoken accessibility was not exercised.
- Ordinary placeholders decrease from 48,847 to 48,712 across 70 languages. The 148 pending source keys and broader translation/semantic audit remain open.

## Blockly comment and accessibility controls: five more locales

- Filled fifteen English placeholders each in Walloon (`wa`), Waray (`wa-RR`), Acehnese (`ace`), Northern Sámi (`se`) and Venetian (`ve-CC`): 75 values. Existing Manx (`gv`) and Aromanian (`rup`) labels were preserved and added to the same regression scope. The group covers comments, conditional branches, inputs, list items, text, buttons, collapse/expand, angle degrees and empty trash.
- Vocabulary references: [Walo+ Walloon lexicon](https://www.beljike.be/mots-courants-wallon-lexique/) for button, [Northern Sámi button entry](https://glosbe.com/fr/se/bouton), and [Sámi signage guidance](https://www.eupicto.com/media/ax2jgjrq/user-manual-polish.pdf) for `čállingieddi`/`čállingietti` (writing area). The latter supports a word and inflection, not the full Blockly input phrase; input may represent a connection rather than a text field, so that paraphrase remains low confidence.
- The initial Finnish-shaped Sámi input draft was replaced before commit. Acehnese technical loans and condition phrasing, Waray condition phrasing and Venetian regional terminology also remain provisional. These entries require semantic review; non-English coverage is not proof of fluent wording.
- Extended exact-placeholder and opposing-operation checks and visible translated add-comment browser assertions to the seven locales. Blockly/completeness: 13 tests pass. Human-preference verification: 21 checks pass. Browser coverage is syntax-checked only because Playwright is absent locally; spoken accessibility was not exercised.
- Ordinary placeholders decrease from 48,712 to 48,637 across 70 languages. The 148 pending source keys and broader translation/semantic audit remain open.

## Blockly comment and accessibility controls: six more locales

- Filled 88 English placeholders in Akan (`ak`), Bambara (`bm`), Ewe (`ee`), Wolof (`wo`), Fula (`ff`) and Kashmiri (`ks`). The fifteen-key group includes comment actions, conditional branches, input/list/text controls, button, collapse/expand, angle degrees and empty trash. The protected merge preserved two existing Ewe translations.
- Corrected Akan's generic `text` label from “information about this activity” to `Nsɛm a wɔakyerɛw` (written words). The new Blockly text labels use the same terminology; regression coverage locks this correction.
- Existing locale vocabulary guided the drafts. [Janga Wolof's lexicon](https://jangawolof.org/2015/01/06/wolof-lexicon/) and [the Wolof button entry](https://fr.glosbe.com/fr/wo/bouton) support the button term. Dictionary searches did not establish the drafted Bambara/Fula button loans or full technical sentences; those remain low confidence, alongside Ewe input/button paraphrases, condition wording and Kashmiri inflection. Fula regional consistency still needs review.
- Extended the fifteen-key regression and translated add-comment browser assertion to these six locales. Exact source placeholders and opposing actions are checked. Blockly/completeness: 13 tests pass; human-preference verification: 21 checks pass.
- Browser coverage is syntax-checked only because Playwright is absent locally. Browser interaction, spoken accessibility and language fluency remain unverified.
- Ordinary placeholders decrease from 48,637 to 48,549 across 70 languages. The 148 pending source keys and broader translation/semantic audit remain open.

## Blockly comment and accessibility controls: Buryat through Tigrinya

- Filled 88 English placeholders across Buryat (`bua`), Chuvash (`cv`), Sakha (`sah`), Tibetan (`bo`), Dzongkha (`dz`) and Tigrinya (`ti`). Two existing Tigrinya values were preserved. The fifteen-key group covers comment actions, conditional branches, inputs, list items, text, button, collapse/expand, angle degrees and empty trash.
- Existing catalog terminology guided the drafts. [Dzongkha computer terminology](https://download-mirror.savannah.gnu.org/releases/dzongkha-gnome/dzongkha_computer_terms.pdf) supports the button and input terms; [the Sakha dictionary](https://www.lexicons.ru/modern/ja/sakha/_pdf/sakha-english.pdf) supports `тимэх` (button). The references establish vocabulary, not full UI sentences.
- Buryat, Chuvash and Sakha technical condition/input wording and Tibetan/Dzongkha conditional clauses remain low confidence. Inflection and the distinction between a secondary condition and an unconditional alternative still need semantic review.
- Extended the fifteen-key regression and visible translated add-comment browser assertion to these six locales. Exact source arguments and distinct opposing operations are checked. Blockly/completeness: 13 tests pass; human-preference verification: 21 checks pass.
- Browser coverage is syntax-checked only because Playwright is absent locally. Browser interaction and spoken accessibility were not exercised; structural tests do not establish fluency.
- Ordinary placeholders decrease from 48,549 to 48,461 across 70 languages. The 148 pending source keys and broader translation/semantic audit remain open.

## Blockly comment and accessibility controls: Quechua, Aymara, Guarani, Volapük and Klingon

- Filled 71 English placeholders in `qu`, `ay`, `gn`, `vo` and `tlh`, preserving four existing Guarani/Klingon translations. The fifteen-key group covers comment actions, conditional branches, inputs, list items, text, buttons, collapse/expand, angle degrees and empty trash.
- Corrected generic text labels: Quechua's prefixed-English filler to `Qillqasqa`, Volapük's Esperanto-shaped `Teksto` to `Vödem`, and Klingon's French `Texte` to `ghItlh`. Added regression coverage for these corrections.
- Vocabulary references: [Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary), [Volapük text usage](https://wikisource.org/wiki/Main_Page/Volap%C3%BCk), [KLI button vocabulary](https://www.kli.org/about-klingon/new-klingon-words/date/) and [KLI angular-degree vocabulary](https://www.kli.org/about-klingon/new-language-information/qepa-wejmahdich-new-words/). Corrected the Volapük trash draft to the dictionary term `defaliär`; used Klingon `leQ` and `lawrI'`.
- Conditional branches are paraphrased and remain low confidence: a secondary condition must not be confused with an unconditional alternative. Aymara input wording and Volapük technical compounds also need semantic review. The references support individual words, not complete UI sentences. Veps was inspected but its draft was not applied; terminology research is still needed for that locale.
- Extended exact-placeholder/opposing-operation regressions and translated add-comment browser assertions. Blockly/completeness: 13 tests pass; human-preference verification: 21 checks pass. Browser coverage is syntax-checked only because Playwright is absent locally; spoken accessibility and fluent wording remain unverified.
- Ordinary placeholders decrease from 48,461 to 48,390 across 70 languages. The 148 pending source keys and broader translation/semantic audit remain open.

## Veps Blockly comment and accessibility controls

- Filled fifteen English placeholders in `ve-PP` through the protected merge: comment actions, conditional branches, inputs, list items, text, button, collapse/expand, angle degrees and empty trash.
- Read [Veps MediaWiki messages](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json) for add/delete, comment, collapse/expand and field vocabulary. The [Veps–Hungarian dictionary](https://adoc.pub/vepsze-magyar-kisszotar-veps-vengrialaine-pen-vajehnik.html) supports `nübl’` (clothing button), `gradus` (degree), `rujobak` (trash container) and `nügüd’` (now). Extending the clothing-button word to a UI control remains provisional.
- Replaced the unapplied draft's unverified button/input forms and Finnish-shaped trash compound. Its `eht` is “evening,” not “condition”; the new secondary-branch label uses a provisional “another if-rule” paraphrase. `tedopöud` is a drafted data-field compound, and block inputs are not necessarily text fields. Full phrases, inflection and these adaptations remain **low confidence** and require semantic review.
- Extended exact-placeholder/opposing-action regression coverage and the existing translated add-comment browser assertion to Veps. Blockly/completeness: 13 tests pass; human-preference verification: 21 checks pass. Browser coverage is syntax-checked only because Playwright is absent locally. Neither browser interaction nor spoken accessibility was executed; structural checks do not establish fluency.
- Ordinary placeholders decrease from 48,390 to 48,375 across 70 languages. The 148 pending source keys and broader translation/semantic audit remain open.

## Wu Chinese and Nahuatl Blockly accessibility labels

- Filled fifteen English placeholders each in Wu Chinese (`wuu-Hans`) and Nahuatl (`nah`): 30 values, using the protected merge. The group covers comment controls, conditional branches, inputs, list items, text, button, collapse/expand, angle degrees and empty trash.
- Wu Chinese uses simplified characters and regional phrasing such as `删脱`, `里向` and `空个`. The variety-wide suitability of these forms remains provisional.
- Nahuatl vocabulary research used [pachoa (press)](https://nahuatl.wired-humanities.org/content/pachoa), [tlazolli (trash)](https://nahuatl.wired-humanities.org/content/tlazolli) and [tlalia (place/set up)](https://nahuatl.wired-humanities.org/content/tlalia). The button is paraphrased as something pressed; add uses a placement verb. Replaced the initial raising/shrinking drafts before commit. Complete clauses, modern technical nouns, the degree loan and condition/input paraphrases remain **low confidence**; the dictionary does not attest the full UI sentences.
- Extended exact-placeholder and opposing-operation checks and visible translated add-comment browser assertions to both locales. Blockly/completeness: 13 tests pass; human-preference verification: 21 checks pass. Browser coverage is syntax-checked only because Playwright is absent locally. Spoken accessibility and fluent wording remain unverified.
- Ordinary placeholders decrease from 48,375 to 48,345 across 70 languages. Six locales still have English placeholders in this accessibility-label group. The 148 pending source keys and broader translation/semantic audit remain open.

### Standard Moroccan Tamazight accessibility labels

- Filled 13 English Blockly accessibility labels in `zgh`; preserved both existing comment commands. The protected fill changes only English placeholders.
- Retained the exact `%1` angle argument with the degree symbol. Added the locale to positive/opposite-action/token coverage and the existing browser context-menu assertion.
- Vocabulary references: [MediaWiki’s Standard Moroccan Tamazight catalog](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json) for comment, list, entry and show wording; [Imassn tasgrut](https://imassn.com/dictionnaire/mot/tasgrut-8559) for basket. New phrases are direct drafts, not imported human translations.
- Low confidence: button uses a wider Amazigh term whose Standard Moroccan usage is unconfirmed; entry may be less precise than a Blockly connection; the else-if phrase combines the existing else and if vocabulary; hide/show paraphrases collapse/expand. Basket needs review for the software trash metaphor. Degree-symbol pronunciation needs screen-reader review. This batch does not validate the language of other catalog values.
- Ordinary placeholders decrease from 48,345 to 48,332 across 70 languages. Five locales still have English accessibility labels in this group. The 148 pending source keys and broader semantic audit remain open.
- Validation: Blockly/completeness and human-preference suites, plus browser-spec syntax checking. Browser execution remains unavailable without the provisioned Playwright/app stack.

### Greenlandic comment and accessibility labels

- Filled fifteen English Blockly comment/accessibility placeholders in `kl` using the protected fill. Source arguments and existing translations remain intact.
- Added Greenlandic to the control/opposite-action/token regression and the existing translated context-menu browser assertion.
- References: [Sullissivik application guide](https://www.sullissivik.gl/Emner/Teknik_og_miljoe/Arealtildeling/-/media/0354379CD749405E94CA6701433FCECA.ashx) uses `ilannguguk`, `peeruk` and `toortagaq`; [MitID input guidance](https://www.mitid.dk/kl-gl/ikiortigit/hjaelpeuniversimi/kode-isissut/mitid-mut-kode-isissut-nutaaq/?language=kl-gl) uses `allaffissaq`; [Greenlandic-English dictionary](https://daka.gl/2018-kal-eng/) includes `eqqaavik`. These are vocabulary references, not attestations of the new full phrases.
- Low confidence: “another condition” paraphrases else-if without explicitly stating the preceding branch failed; input uses a writing-field term although Blockly inputs can be connections; hide/show paraphrases collapse/expand. Case endings and full wording need review. Angle uses `%1°`; screen-reader pronunciation remains unverified.
- Ordinary placeholders decrease from 48,332 to 48,317 across 70 languages. Four locales still have English labels in this group. The 148 pending source keys and wider semantic audit remain open.
- Validation: Blockly/completeness tests and human-preference checks pass; browser spec syntax checked. Browser/spoken accessibility execution remains unverified.

### Inuktitut comment and accessibility labels

- Filled fifteen English Blockly comment/accessibility placeholders in `iu` through the protected fill; preserved existing values and exact arguments. Added the locale to opposite-action/token tests and the translated comment-menu browser assertion.
- References: [Tusaalanga glossary](https://tusaalanga.ca/glossary?showall=1) supplies `sanikkuvik` (garbage can), `imaqanngittuq` (empty) and window open/close commands; [Angirrami learning resources](https://angirrami.com/) attest `ᐃᓚᓕᐅᑎᒍᒃ`; [Inuit Circumpolar Council](https://www.inuitcircumpolar.com/%E1%93%B1%E1%95%88%E1%93%B0%E1%91%A6-%E1%93%84%E1%93%87%E1%95%90%E1%94%AA%E1%90%8A%E1%96%93%E1%91%A6/%E1%90%83%E1%93%95%E1%92%8B%E1%91%A6-%E1%90%83%E1%93%84%E1%92%83%E1%91%8E%E1%91%90%E1%91%A6-%E1%90%85%E1%96%83%E1%93%AA%E1%93%9A%E1%92%8B%E1%90%8A%E1%92%83%E1%93%B4%E1%96%85/?lang=iu) uses the button noun in plural. These establish vocabulary, not the new complete phrases.
- Low confidence: else-if is paraphrased as another rule and does not explicitly express the preceding false branch; input uses a placing/entry-place draft; list-item case endings and delete imperative need review. Open/close paraphrases expand/collapse. Comment and text follow existing short labels. `%1°` preserves the angle argument but spoken output is untested. These strings require semantic review, not just script checks.
- Ordinary placeholders decrease from 48,317 to 48,302 across 70 languages. Three locales remain in this accessibility group; the 148 pending source keys and broader language audit remain open.
- Validation: focused Blockly/completeness tests and human-preference checks; browser spec syntax checked. Browser and spoken accessibility checks were not run.

### Blockly field-type labels: Kurdish, Tatar, Somali, Yiddish, Darija, Bhojpuri and Maithili

- Filled 88 English field-type placeholders across `ku`, `ckb`, `tt`, `so`, `yi`, `ary`, `bho` and `mai` through the protected fill. Existing translations and source token inventories are preserved.
- Translated angle, pixel image, checkbox, color, date, dropdown, grid dropdown, image, input, input name and function name. Added positive/token checks and negative distinctions for pixel/plain images, grid/plain dropdowns, and input/function names.
- Technical wording is provisional, particularly Kurdish dropdown/grid compounds, the Somali function paraphrase, and Bhojpuri/Maithili selector descriptions. These are direct drafts; unsuccessful terminology searches are not evidence of attested usage. A first Sorani draft meaning a collapsed list was corrected to an opening-list description before committing.
- Existing browser flows cover field editing for all eight locales. They do not assert spoken field-type output; that accessibility verification remains outstanding. This batch adds no claim of browser execution or fluency.
- Validation: focused Blockly/completeness tests, human-preference checks and browser-spec syntax checking. This batch removes 88 ordinary English placeholders; unrelated in-progress Tigre changes are outside this commit.

### Blockly field-type labels: Turkmen, Odia, Konkani, Papiamento and Wu Chinese

- Filled 55 English field-type placeholders in `tk_TM`, `or_IN`, `kok`, `pap` and `wuu-Hans`. The protected fill preserves existing translations and source arguments.
- Followed existing date, checkbox and dropdown vocabulary where suitable. Odia field labels omit the stray trailing vertical bars present in older generic labels; those older values were not overwritten by this fill.
- Extended the existing field-type regression to these five locales, including distinctions between image/pixel image, dropdown/grid dropdown, input/input name and input/function names. Existing browser field-editing flows already include all five; spoken type announcements remain unverified.
- Low confidence: Papiamento pixel/grid terminology and the new dropdown paraphrase need review; Turkmen grid terminology and Konkani technical compounds remain provisional. Wu uses shared written Chinese technical vocabulary; this does not establish regional spoken output. External searches did not provide authoritative attestations for the new full phrases.
- Validation: focused Blockly/completeness suite, human-preference checks and browser-spec syntax. This batch removes 55 ordinary English placeholders. Unrelated in-progress locale and deployment changes remain outside the batch.

### Walloon, Venetian and Manx field-type labels

- Filled 34 English placeholders: eleven field types in each Walloon locale and Venetian, plus the Manx date label. Preserved the already translated Aromanian and other Manx fields and added both locales to regression coverage.
- Corrected three visibly foreign generic labels in `wa-RR`: `Petsa`, `Dropdown nga Lista` and French `Case à cocher`. Added exact wording regression checks; direct correction is permitted for wrong-language seeds, unlike protected correct-language translations.
- [Walloon orthography discussion](https://rifondou.walon.org/tecnikes_kesses.html) discusses `ingue`; [Walloon texts](https://rifondou.walon.org/lingaedje_walon.html) attest `imådje`. Other labels use direct drafts and existing locale vocabulary. Dropdown/grid compounds and Venetian spelling remain provisional; the two Walloon catalogs share these standard written forms.
- Extended image/selector/name distinctions and token coverage. Existing browser flows include these locales, but spoken type output and browser execution remain unverified.
- This batch removes 34 ordinary placeholders and corrects three wrong-language values. The broader semantic audit and 148 pending source keys remain open.

### Sesotho, Setswana, Sepedi, Zulu and Xhosa field-type labels

- Filled 66 English placeholders across `st`, `tn`, `nso`, `zu`, `zu-ZA` and `xh`, preserving correct-language translations and all source arguments through the protected fill.
- [Multilingual Mathematics](https://lwimilinks.sadilar.org/media/documents/Multilingual_Mathematics.pdf), PDF pages 23 and 79, supplies angle terms and grid terms for the Sotho languages and Xhosa. [Microsoft's Zulu installation instructions](https://www.microsoft.com/zu-za/download/details.aspx?id=52668) attest `ibhokisi lokuqoka` for checkbox. Full field labels are new direct translations, not quoted human translations.
- Low confidence remains for pixel loanword morphology, Zulu grid wording, input nomenclature and the use of ordinary work/task nouns for programming functions. Existing dropdown wording was retained as the terminology reference, not independently certified as fluent.
- Added all six locale paths to positive/token checks and distinctions between pixel/plain images, grid/plain dropdowns and input/function names. Existing browser flows cover field editing in all six; they do not prove correct spoken type announcements. Browser execution remains outstanding.
- This batch removes 66 ordinary English placeholders. The broader semantic audit and 148 pending source keys remain open.

### Swati, Tsonga, Venda and Northern Ndebele field-type labels

- Filled 44 English field-type placeholders across `ss`, `ts`, `ve` and `nd` through the protected fill, preserving source arguments and existing correct-language translations.
- Corrected three Zulu-seeded generic labels in Venda and two Tsonga labels that used vague filler (`mhaka`, including a language-name prefix) instead of naming the controls. Exact wording regressions accompany these direct semantic corrections.
- [Multilingual Mathematics](https://lwimilinks.sadilar.org/media/documents/Multilingual_Mathematics.pdf) supplies Swati, Tsonga and Venda angle vocabulary and Swati/Venda grid vocabulary. Its Ndebele entries concern Southern Ndebele and are not evidence for `nd` (Zimbabwean Northern Ndebele). [Zimbabwean Ndebele teaching material](https://cps.co.zw/uploads/1/3/5/3/13536366/isindebele_4_tg_mobile.pdf) provides general spelling context, not attestations for the new technical labels.
- Low confidence: Northern Ndebele technical loans and compounds, pixel morphology throughout, Tsonga/Venda dropdown paraphrases and programming-function nouns require review. The labels are direct drafts, not externally translated strings.
- Extended field-type distinctions and token checks. Existing browser field-editing flows cover these locales, but neither browser execution nor spoken type announcements were verified.
- This batch removes 44 ordinary placeholders and repairs five wrong-language/filler values. The broader semantic audit and 148 pending source keys remain open.

### Kinyarwanda, Kirundi, Luganda, Oromo and Chichewa field types

- Filled 55 English field-type placeholders across `rw`, `rn`, `lg`, `om` and `ny` using the protected fill. Source arguments and existing correct-language translations remain intact.
- Replaced Luganda generic labels `Dropdown Lukalala` and `Checkbox (mu Luganda)` with Luganda descriptions; these mixed-language seeds were not protected human translations. Added exact regression checks alongside the shared field-type distinctions and token checks.
- Vocabulary references: [Rwanda mathematics curriculum](https://eastafricaschoolserver.org/content/_public/Local%20Topics/Rwanda/Rwanda%20Education%20Board%20Syllabuses/Syllabus/Lower-Primary/Integanyanyigisho%20y_Imibare_2015.pdf), [Kirundi-English dictionary](https://studylib.net/doc/27088730/kirundi) and [Oromo mathematics textbook](https://camaraethiopia.org.et/OromiaPrimary/CEE_MoE_Plasma/content/Maths/Primary/Afan%20Oromo/MathSBG3.pdf). These support ordinary mathematical vocabulary, not every new technical compound.
- Low confidence: pixel/grid loanword spelling, Luganda angle terminology, input naming and Kirundi/Chichewa use of ordinary work nouns for functions require review. A Luganda draft using a filtering word for grid was replaced with a grid loan before application; Kinyarwanda function uses a technical loan instead of utility/benefit wording.
- Existing browser flows include all five locales; browser execution and spoken accessibility verification remain outstanding. Tests establish structural distinctions, not fluency.
- This batch removes 55 ordinary placeholders and corrects two mixed-language values. The 148 pending source keys and broader semantic audit remain open.

### Bislama, Tok Pisin, Fijian and Samoan field types

- Filled 44 English field-type placeholders across `bi`, `tpi`, `fj` and `sm`, preserving correct-language values and source arguments through the protected fill.
- Replaced four mixed-language selector labels in Bislama and Tok Pisin, including the prefixed English `Tok blong sistem: Checkbox` and `Toksave: Checkbox`. Added exact correction checks and extended field-type distinctions/token coverage.
- Vocabulary references: [Bislama spelling dictionary](https://bislama.org/images/dictionary/BislamaSpellingDictionary-EN-BI-v1.1.pdf), [Tok Pisin dictionary](https://en.wikibooks.org/wiki/Tok_Pisin/Dictionary), [Gatty's Fijian dictionary](https://www.folksong.org.nz/isa_lei/Fijian-English_Dictionary.pdf) and [Samoan dictionary](https://pure.mpg.de/rest/items/item_404545_3/component/file_404544/content). These support ordinary vocabulary, not all technical adaptations.
- Low confidence: angle/corner distinctions, pixel loans, grid descriptions as an arrangement of boxes, and ordinary work nouns for programming functions need review. Input is described as information/things put inside; it may need greater precision for Blockly connections. Full phrases are direct drafts.
- Existing browser flows cover field editing in all four locales, but browser execution and spoken announcements remain unverified. This batch removes 44 ordinary placeholders and corrects four mixed-language values; the broader semantic audit and 148 pending source keys remain open.

### Māori, Tongan and Hawaiian field types

- Filled 33 English field-type placeholders through the protected fill. Preserved existing correct-language translations and exact token inventories.
- Corrected two Tongan selectors containing `Faka-Tonga:` plus English, and replaced opaque Hawaiian `kalopakowana`/`kekakapoka` control names with descriptive local wording. Added exact correction regressions and shared field-type distinctions.
- Vocabulary references: Te Aka [koki](https://maoridictionary.co.nz/search?keywords=koki) and [tongiiti](https://maoridictionary.co.nz/word/39247); [Te Taura Whiri computer terms](https://www.tetaurawhiri.govt.nz/kupu-hou-te-rorohiko) for dropdown, input and function; [Hawaiian angle](https://wehe.hilo.hawaii.edu/?l=&q=angle); [NSW Tongan dictionary](https://education.nsw.gov.au/content/dam/main-education/teaching-and-learning/curriculum/multicultural-education/eald/eald-bilingual-dictionary-tongan.pdf) for angle vocabulary.
- Low confidence: Tongan pixel loan, Hawaiian pixel description as a dotted image, checkbox descriptions, grid paraphrases as arranged boxes, and work nouns for programming functions. New full phrases remain drafts. Hawaiian pixel/grid dictionary requests were unavailable, so they do not establish attested technical usage.
- Existing browser field-editing flows include all three locales; browser execution and spoken type announcements remain outstanding. Structural checks do not certify fluency.
- This batch removes 33 ordinary placeholders and repairs four selector labels; the 148 pending source keys and broader semantic audit remain open.

### Buryat, Chuvash and Sakha field types

- Filled 33 English field-type placeholders in `bua`, `cv` and `sah` through the protected fill, preserving existing translations and exact source arguments.
- Vocabulary references: [Buryat grammar](https://altaica.ru/LIBRARY/mong/BuriatGrammar.pdf) includes `булан` for corner/angle; [Chuvash angle entry](https://ru.wiktionary.org/wiki/%D1%83%D0%B3%D0%BE%D0%BB) gives `кӗтес`; [Sakha dictionary](https://sakhatyla.ru/translate?q=%D0%BC%D1%83%D0%BD%D0%BD%D1%83%D0%BA) distinguishes the mathematical use of `муннук`. The remaining phrases combine existing UI vocabulary with direct drafts and technical loans.
- Low confidence: grid and checkbox descriptions, loanword morphology, dropdown phrasing and the date/day distinction require review. Sakha checkbox uses a square to be marked; an initial narrowness-based draft was rejected before application. Cyrillic script alone does not establish the correct language or meaning.
- Extended pixel/plain image, grid/plain dropdown and input/function-name distinctions, plus token coverage. Existing browser flows cover field editing for these locales; browser execution and spoken type announcements remain unverified.
- This batch removes 33 ordinary placeholders. The 148 pending source keys and broader semantic audit remain open.

### Quechua, Aymara and Guarani field types

- Filled 33 English field-type placeholders through the protected fill, preserving existing correct-language values and source arguments.
- Corrected four mixed-language Quechua/Aymara selector labels, including `Kay willaymi: Checkboxta` and `Aymar aruna: Checkbox`, with descriptive local wording. Added exact correction regressions and shared type distinctions.
- Vocabulary references: [Quechua k'uchu](https://aulex.org/qu-es/?busca=%22uchu%22), [Aymara educational vocabulary](https://cdn.www.gob.pe/uploads/document/file/4973488/item_55_vocabulario_aymara.pdf?v=1692022988), [Guarani dictionary](https://guaraniayvu.org/) and [Guarani takamby](https://www.proyectomontoya.org.py/nthg/takamby). These support basic words, not all new compounds. The attempted full-text Aymara angle lookup failed; its specific mathematical sense remains unconfirmed.
- Low confidence: regional Quechua spelling, Aymara corner/angle terminology and inflection, pixel loans, grid descriptions using boxes, input/entry ambiguity and work nouns for programming functions need review. Date labels currently follow day terminology and need contextual review as calendar dates.
- Existing browser flows cover all three locales; browser execution and spoken accessibility remain unverified. This batch removes 33 ordinary placeholders and corrects four mixed-language values; the 148 pending source keys and wider semantic audit remain open.

### Tibetan, Dzongkha, Tigrinya and Kashmiri field types

- Filled 44 English field-type placeholders through the protected fill; preserved existing correct-language translations and exact source arguments.
- References: [Dzongkha Computer Terms](https://dokumen.pub/dzongkha-computer-terms-9789698961060.html) supplies pixel and grid loans and checkbox vocabulary, although its text extraction drops some Tibetan glyphs; [Tigrinya physics textbook](https://files.ethiopialearning.com/textbooks/Grade%2008/Grade_8_Subject_PHYSICS_Chapter_7_Language_TIGRIGNA_Retrieved_20150101.pdf) uses angle and color vocabulary. Other terms follow existing locale labels and direct drafts, not independently attested full translations.
- Low confidence: Tibetan/Dzongkha programming-function nomenclature, reconstructed Dzongkha loan spelling, Tigrinya grid phrasing and Kashmiri dropdown agreement/technical loans need review. Shared scripts do not prove correct-language vocabulary. None of these drafts certifies semantic completeness.
- Extended image, selector and input/function-name distinction checks plus token coverage. Existing browser field-editing flows include all four locales; browser and spoken accessibility checks remain unrun.
- This batch removes 44 ordinary placeholders. The 148 pending source keys and broader semantic audit remain open.

### Northern Sámi, Veps and Acehnese field types

- Filled 33 English field-type placeholders through the protected fill and corrected two Malay-seeded Acehnese generic selectors (`Senarai juntai barah`, `kotak semak`). Existing correct-language translations and source arguments remain intact.
- References: [Sámi angle discussion](https://www.mdpi.com/2227-7102/16/1/52), [Veps–Hungarian dictionary](https://adoc.pub/vepsze-magyar-kisszotar-veps-vengrialaine-pen-vajehnik.html) (`čoga`, mathematical angle; `muju`, color), and [Acehnese thesaurus](https://dokumen.pub/kamus-basa-aceh-kamus-bahasa-aceh-acehneseindonesianenglish-thesaurus-0858835061.html). Look-alike Veps candidates were not assumed to mean angle.
- Low confidence: Veps dropdown grammar and grid compounds, Sámi grid description and input described as a writing field, Acehnese technical loans, and date terminology require review. The full labels are direct drafts, not attested phrases. Grid descriptions using squares may need greater precision.
- Added positive/token and type-distinction coverage, exact Acehnese correction checks and Veps vocabulary assertions. Existing browser flows cover field editing, but browser execution and spoken announcements remain unverified.
- This batch removes 33 ordinary placeholders and corrects two wrong-language selector labels. The broader semantic audit and 148 pending source keys remain open.

### Akan, Bambara and Wolof field types

- Filled 33 English field-type placeholders through the protected fill, preserving existing correct-language translations and source arguments.
- Replaced Akan `Dropdown Nhyehyɛe` and generic activity-information filler used for checkbox with control descriptions. Added exact correction regressions and extended image/selector/input-name distinctions.
- Vocabulary references: [Bambara lexicon](https://mooreburkina.com/sites/www.mooreburkina.com/files/pdf-files/Bambara%20Lexicon.pdf) gives `seleke` for angle/corner; [Bamadaba](https://bamadaba.coastsystems.net/index-french/) provides the Bambara vocabulary reference; [Wolof colors](https://www.jangal-apprendre-le-wolof.com/2023/12/vocabulaire-les-couleurs.html) attests `melo`; [Akan dictionary](https://www.akandictionary.com/) is a general vocabulary reference, not attestation of the new technical phrases.
- Low confidence: corner/angle precision, pixel loans, grid descriptions using arranged boxes, date/day ambiguity and ordinary work/action nouns for programming functions require review. Input descriptions may need refinement for Blockly connections. Non-English text and distinct strings alone do not prove correct meaning.
- Existing browser flows cover these locales; browser execution and spoken announcements remain unverified. This batch removes 33 ordinary placeholders and corrects two mixed-language/filler values. The 148 pending source keys and broader semantic audit remain open.

### Volapük and Klingon field types

- Filled 22 English field-type placeholders through the protected fill. Corrected Esperanto-seeded Volapük text/date controls and the French-seeded Klingon text control.
- The [Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary) supplies angle, color, date, picture, list, insertion and function vocabulary. The [Klingon Language Institute](https://www.kli.org/about-klingon/new-klingon-words/date/) attests `HaStay'` (pixel) and `mIllogh` (picture); its angle entries support `tajvaj`. The [KLI discussion of mIw](https://lists.kli.org/archives/list/tlhingan-hol%40lists.kli.org/thread/CY77JPI34V3BFHK2KJZT5MNVGIJRB3S3/) gives procedure/process. [Klingonska's color reference](https://klingonska.org/ref/color.html) explains the verbal color vocabulary.
- Low confidence: Volapük pixel image is paraphrased as a dotted image, checkbox as a markable square, and grid dropdown as an openable list in squares. Klingon color is a choice for coloring, date uses day, and grid dropdown describes a selection list with squares. Input describes a data-entry place; the fit to Blockly fields and connections needs review. These complete technical phrases are drafts, not dictionary attestations.
- Extended field-type distinctions, token checks and exact correction regressions. Existing browser flows include both languages; browser execution and spoken announcements remain unverified. The 148 pending source keys and broader semantic audit remain open.

### Ewe and Fulah field types

- Filled 22 English field-type placeholders through the protected fill, retaining existing correct-language values. Extended source-token and field-type distinction checks to both locales.
- Vocabulary references: the [Peace Corps Ewe workbook](https://www.livelingua.com/peace-corps/Ewe/Ewe%20Course%20-2010.pdf) gives picture vocabulary, and [Ameka's study of Ewe spatial language](https://pure.mpg.de/pubman/item/item_855622_4/component/file_855623/ameka_1995_The_linguistic_construction_of_space_in_Ewe_Cogn_Ling.pdf) attests `dzogoe` as corner. The [Fulfulde dictionary](https://mooreburkina.com/sites/www.mooreburkina.com/files/pdf-files/03%20Dictionnaire%20fulfulde%20-%20francais%20%20English.pdf) attests mathematical `lobbudu`; the [Pulaar education terminology](https://senprof.education.sn/PROGRAMME%20LECTURE%20POUR%20TOUS/documentation/Terminologies/Terminologie%20Pulaar%20fusion.pdf) attests color and picture vocabulary.
- Low confidence: Ewe corner/angle precision, pixel loans, grid descriptions using boxes/squares, date/day ambiguity and ordinary work nouns for programming functions require review. Existing checkbox/dropdown wording is reused without claiming independent validation; Fulah regional vocabulary may need harmonization. Input terminology must also be checked against Blockly's specific field behavior.
- Existing browser flows cover both locales but were not executed; spoken announcements remain unverified. The 148 pending source keys and broader semantic audit remain open.

### Nahuatl field types

- Filled 11 English field-type placeholders through the protected fill and extended field-type distinctions and source-token checks. Existing non-English control labels were preserved.
- References: the Online Nahuatl Dictionary entries for [corner](https://nahuatl.wired-humanities.org/content/xomolli), [ordered sequence](https://nahuatl.wired-humanities.org/content/tlatecpantli), [container](https://nahuatl.wired-humanities.org/content/calli), [work](https://nahuatl.wired-humanities.org/content/tequitl) and [color](https://nahuatl.wired-humanities.org/node/177153), plus [UNAM's discussion of ixiptla](https://muac.unam.mx/ixiptla?lang=en) and the [calaquiliztli entry](https://en.wiktionary.org/wiki/calaquiliztli).
- Low confidence: these are provisional technical paraphrases, mixing historical vocabulary with the catalog's modern relative construction. Corner is used for angle, day for date, and work for function. Pixel is a loan; checkbox uses a coined mark-container compound; grid dropdown describes a descending list with small containers. Input and name phrases need grammatical and Blockly-specific review. The cited entries attest components, not the complete UI phrases.
- Existing Nahuatl browser flow remains registered but unexecuted. Spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Greenlandic field types

- Filled 11 English field-type placeholders through the protected fill and extended field-type distinctions and source-token checks. Existing non-English values were preserved.
- Vocabulary references: the [Greenland transport commission's satellite report](https://kanat.gl/-/media/transportkommissionen/rapporter/telekommunikation/kal/redegrelse_for_satellitkommunikation_i_grnland_kal.pdf) uses `qiverneq` in an angle explanation; [Oqaasileriffik's morphology resource](https://mofo.oqa.dk/Morphemes/kl/affix/nv/-iqluiq) identifies `qalipaat` as color/paint. [MitID's Greenlandic interface guide](https://www.mitid.dk/kl-gl/ikiortigit/hjaelpeuniversimi/mitid-quppernerit/) uses `allaffissaq` for a field, and [MitID Erhverv](https://www.mitid-erhverv.dk/gl/mitid-erhverv-imi-annertusisamik-atuuffiit/lokal-idm/) supplies software-function vocabulary. [This art-history discussion](https://www.journal18.org/issue12/poqs-temporal-sovereignty-and-the-inuit-printing-of-colonial-history/) describes `assiliaq` as image.
- Low confidence: pixel inflection and the image-made-of-pixels phrase, a markable item for checkbox, grid as division into boxes, and the grammatical form of input/function names need review. Dropdown reuses the catalog's selection-list phrase; date uses day. The references attest component vocabulary and related uses, not the complete technical labels.
- Existing Greenlandic browser flow is registered but unexecuted. Spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Inuktitut field types

- Filled 11 English field-type placeholders through the protected fill, preserving existing non-English values and extending source-token and field-type distinction checks.
- Vocabulary references: the [Inuit roots vocabulary](https://www.scribd.com/document/360705405/roots-en) defines `tiriqquq` as the corner/angle of a square or rectangular object. [Nunavut's Putuja Putuja lesson plans](https://www.gov.nu.ca/sites/default/files/documents/2025-10/Putuja_Putuja_Program_-_Lesson_Plans_for_Facilitators_ENG.pdf) use color vocabulary, and the [Inuusiq arts and crafts book](https://inuusiq.com/wp-content/uploads/2025/04/ELC-Arts-Crafts-Adult-Book-IK-EN-FINAL-1.pdf) uses `ᐊᔾᔨᙳᐊᖅ` for picture.
- Low confidence: the angle term may imply a right-angle corner rather than any angle. Pixel is a provisional loan in an image-made-of-pixels phrase; grid is paraphrased using small containers; input uses a writing place and function uses ordinary work/task. Case endings and technical meanings need review. Checkbox reuses the existing marking-place label and date uses day. These references attest vocabulary, not complete technical phrases. The school mathematics glossary was located but could not be fetched, so it was not treated as evidence for a replacement angle term.
- Existing browser coverage includes Inuktitut but remains unexecuted; spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Standard Moroccan Tamazight field types

- Filled 11 English field-type placeholders in Tifinagh through the protected fill and extended field-type distinctions and source-token checks. Existing non-English values were preserved.
- [MediaWiki's zgh catalog](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json) supplies Moroccan Tamazight image, list, date and name vocabulary. The [comparative Amazigh morphology study](https://dspace.ummto.dz/bitstreams/817d0a81-a14f-4ca9-9010-d6467bd4dd02/download) records angle/corner vocabulary across varieties; [this glossary](https://es.scribd.com/document/955571079/AMAWAL-TAMAZIGHT-TAFRANSIST) gives color vocabulary. Wider Amazigh usage is not by itself confirmation of a Standard Moroccan technical term.
- Low confidence: angle and color terminology need locale-specific review; pixel is a provisional loan, grid is described using boxes, input uses insertion and function uses ordinary work/function vocabulary. Checkbox and dropdown reuse existing catalog phrases without claiming independent validation. The full technical phrases and their inflections remain provisional.
- Existing browser flows include this locale but remain unexecuted. Spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Tigre field types

- Filled 11 English field-type placeholders through the protected fill. Replaced `ተመር` in the date control with calendar-date vocabulary `ዕለት`; the former corresponds to the date fruit rather than this control's meaning.
- References: [BeitTigre's parallel phrasebook](https://beittigre.github.io/tigre-multilingual-dictionaries/) supplies picture, corner, box, list, entry, name and function/duty vocabulary. Calendar-date usage is checked against its date/time file-view sentence, rather than the ambiguous isolated English word “date.” [Glosbe's Tigre color entry](https://en.glosbe.com/en/tig/Color) supplies `ሕብር`. Phrasebook data has uneven quality and is a vocabulary aid, not authoritative validation of full technical phrases.
- Low confidence: corner is used for angle, dropdown is paraphrased as a downward list, and grid adds boxes. Pixel is a loan; entry and duty/function may need more specific programming terms. Inflections, noun phrases and regional usage remain provisional. Tigrinya search results were not used as Tigre evidence.
- Extended token/type distinctions and added a calendar-date correction regression. Existing browser coverage is registered but unexecuted; spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Wolaytta field types and control filler

- Filled ten English field-type placeholders through the protected fill and replaced three prefixed-English checkbox, dropdown and text controls. The angle label remains untranslated pending usable vocabulary evidence.
- References: the [Wolayttatto teaching material](https://camaraethiopia.org.et/SNNPR/moe/content/SNE_TB/Sign%20Language%20G1-12/03-Wolayitato-Books-Sign-Language/07-HD-ESL-G7-SB.pdf) uses picture and paint vocabulary; [Lamberti and Sottile](https://dokumen.pub/the-wolaytta-language.html) document writing, entering and opening roots. Existing catalog vocabulary supplies list, name, date and work terms. These references do not attest the full technical phrases.
- Low confidence: color uses paint vocabulary, date uses day, input uses entering and function uses ordinary work. Checkbox describes a box for marking; grid dropdown adds boxes to a list opening downward. Pixel is a loan. Orthography, compounds and grammatical endings need review; prefixed-English filler was not treated as a protected translation.
- Added token/type distinction checks and exact correction regressions. Existing browser coverage remains registered but unexecuted. Angle, spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Cherokee field types

- Filled 11 English field-type placeholders through the protected fill and extended source-token and field-type distinction checks. Existing non-English controls were preserved.
- Vocabulary references: this [Cherokee dictionary compilation](https://www.witchcraft-academy.com/Library/Traditions/Native%20American/Cherokee_Dictionary.pdf) lists corner, picture, square and process; [the color lesson](https://www.culturev.com/cherokee/front/colors.html) provides color vocabulary. The compilation is a secondary resource with uneven transcription, not an authoritative software glossary. Existing catalog wording supplies checkbox, dropdown, day, input and name constructions.
- Very low confidence: corner is used for angle, day for date and process for function. Pixel is an unverified syllabic loan; grid adds a four-cornered shape to the dropdown description. Transcription, grammatical agreement, noun phrases, input meaning and the existing dropdown/checkbox terms all require review. Correct script, distinct labels and token preservation do not establish fluent Cherokee.
- Existing browser coverage is registered but unexecuted. Spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Kurdish and Tatar block and bubble labels

- Filled 48 English placeholders in Northern Kurdish, Central Kurdish and Tatar: block-state/type labels, stack descriptions, input/branch counts and comment/warning bubble labels. Protected filling preserves existing correct-language values; numbered arguments are unchanged.
- Stack is described as a sequence/chain of blocks and statement as a command. Distinguish singular/plural input, collapsed/disabled, statement/value and comment/warning. These are direct translations using the existing catalogs and general programming terminology, without a translation service.
- Kurdish container, replaceability and bubble terminology remains lower confidence; accessibility wording and the stack/statement paraphrases need contextual review. Structural distinction checks do not prove semantic equivalence.
- Added token and non-placeholder checks plus distinction regressions. Existing browser flows cover these locales but remain unexecuted; spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Yiddish, Turkmen, Bhojpuri and Maithili block and bubble labels

- Filled 64 English placeholders through the protected fill: block-state/type labels, stack descriptions, input/branch counts and comment/warning bubbles. Numbered arguments and existing correct-language values are preserved.
- Direct translations follow general programming vocabulary and the catalogs. Stack is expressed as a block chain/row and statement as a command/instruction. Bhojpuri and Maithili use their own clause endings; shared technical loans alone do not determine language identity.
- Lower-confidence wording includes the stack/row and bubble metaphors, container loans and plural-input paraphrases. These labels need contextual accessibility review; distinct strings and intact tokens are structural checks, not proof of fluent wording.
- Extended existing token, non-placeholder and distinction regressions to all four locales. Existing browser flows cover these languages but remain unexecuted. Spoken announcements, the 148 pending source keys and the broader semantic audit remain open.

### Somali, Moroccan Arabic, Odia and Konkani block and bubble labels

- Filled 64 English placeholders with the protected fill workflow, preserving all numbered arguments and existing translations. Input and comment terminology follows the respective catalogs.
- Stack is described as a chain of blocks; statement uses command/instruction vocabulary. Moroccan Arabic uses local clauses such as `فيه` and `يقدر يتبدّل`; Konkani uses `आसा`/`आसात` and `बदलूंक येता` rather than Hindi clauses.
- Container, bubble and stack metaphors, particularly Somali and Konkani technical wording, remain lower confidence and need contextual review. The collapsed/disabled and singular/plural checks establish distinctions, not fluency or semantic equivalence.
- Extended the existing token and distinction regressions. Browser and spoken accessibility checks remain unexecuted; the 148 pending source keys and broader mixed-language audit remain open.

### Māori, Samoan, Hawaiian and Tongan block and bubble labels

- Filled 64 English placeholders through the protected workflow, retaining numbered arguments and existing translations. The stack labels use a pile/stack of blocks; statement uses instruction/command vocabulary.
- Bubble vocabulary references: Māori [mirumiru in Te Aka](https://maoridictionary.co.nz/word/10795), Hawaiian [huʻa in the university dictionaries](https://hilo.hawaii.edu/wehe/?q=hua), and Samoan [puta in POLLEX](https://pollex.eva.mpg.de/entry/puta.2/). The dictionary senses do not establish software terminology; Samoan puta has other common meanings and is especially provisional here. Tongan uses a contextual “information box” paraphrase for the bubble.
- Lower-confidence wording includes collapsed as shortened/folded, container and bubble metaphors, and value as worth/value. Tongan and Samoan clause construction and all spoken accessibility labels need contextual review. Distinct strings are not proof of semantic equivalence or fluency.
- Extended existing token and block-label distinction checks. Browser and spoken accessibility checks remain unexecuted; the 148 pending source keys and broader semantic audit remain open.

### Bislama, Tok Pisin, Fijian and Papiamento block and bubble labels

- Filled 64 English placeholders through the protected workflow, preserving arguments and existing translations. Input and comment vocabulary follows the catalogs; statement uses command/instruction wording and stack uses a pile of blocks.
- Bubble is paraphrased as a speech/information/text box. The [Fijian dictionary](https://www.folksong.org.nz/isa_lei/Fijian-English_Dictionary.pdf) gives vuso as froth/foam/spray; that does not establish an appropriate interface bubble label. The [Papiamentu word list](https://www.studiotaalwetenschap.nl/Bestanden/Lexilijst%20Papiaments.pdf) distinguishes a balloon (blas/blaas) from a box (kaha/caha); these labels use a contextual box paraphrase instead of assuming balloon means a software bubble.
- Collapsed as shortened/folded, branches as arms/branches, container and value terminology remain provisional, particularly Fijian isau. Bislama and Tok Pisin retain their distinct clause spellings. Contextual and spoken accessibility review remains necessary; structural distinction tests do not establish fluency.
- Extended token, non-placeholder and distinction checks. Browser checks remain unexecuted; the 148 pending source keys and broader semantic audit remain open.

### Zulu, Xhosa, Swati and Northern Ndebele block and bubble labels

- Filled 80 English placeholders in five catalogs (including both Zulu paths) through the protected workflow, preserving numbered arguments and existing translations. Input and comment wording follows each catalog.
- Stack uses a pile of blocks, statement uses a command, and bubble is paraphrased as a text box. Collapsed is folded, while disabled is unavailable/prevented from operating; separate labels preserve those distinct states.
- Technical metaphors, noun-class agreement around arbitrary numbers, and Swati/Northern Ndebele wording remain lower confidence. Northern Ndebele clauses use `kule-` and `-nengi`; Swati uses its own noun forms. Related-language resemblance alone is not evidence that a value is wrong-language text.
- Extended token, non-placeholder and distinction checks to all five catalogs. These are structural checks, not proof of fluent or semantically equivalent labels. Browser and spoken accessibility checks remain unexecuted; 148 pending source keys and the broader wording audit remain open.

### Sesotho, Setswana and Northern Sotho block and bubble labels

- Checked container vocabulary against the [government multilingual mathematics dictionary](https://www.dsac.gov.za/sites/default/files/2023-11/Multilingual%20Mathematics%20Dictionary.pdf); corrected the new Northern Sotho draft to `setšhelo`. This supports the noun, not the surrounding software metaphors.
- Filled 48 English placeholders through the protected workflow, preserving numbered arguments and existing translations. Input and comment terminology follows each catalog.
- Stack is expressed as a pile of blocks, statement as an instruction, and bubble as a text box. Collapsed uses folded wording, distinct from the disabled/prevented-from-working state.
- Technical metaphors, block loans and noun agreement around arbitrary numbered arguments remain provisional. Sesotho, Setswana and Northern Sotho retain their own clause forms and orthography. Related vocabulary does not by itself establish either correct or wrong-language wording.
- Extended existing token, non-placeholder and distinction checks. These do not establish fluent wording. Browser and spoken accessibility checks remain unexecuted; 148 pending source keys and the broader semantic audit remain open.

### Kinyarwanda, Kirundi, Luganda and Chichewa block and bubble labels

- Filled 64 English placeholders through the protected workflow, preserving numbered arguments and existing translations. Input and comment vocabulary follows each catalog. Stack uses a sequence/row or pile of blocks; statement uses instruction/command wording and bubble is a text box.
- Checked the fold verb against the [Kinyarwanda dictionary](https://www.rcsdk12.org/cms/lib/NY01001156/Centricity/Domain/4194/english-kinyarwanda-dictionary.pdf) and [Kirundi dictionary](https://www.matana.de/kirundi_alpha.pdf). Corrected the new collapsed drafts to use the fold stem rather than an unfold form. These references support vocabulary, not the entire inflected software label.
- Technical metaphors, grammatical agreement, value terminology and block/part loans remain provisional. Kinyarwanda and Kirundi retain their distinct `iby-`/`ivy-` and `bifite`/`bifise` forms; related vocabulary alone cannot establish language correctness.
- Extended token, non-placeholder and distinction checks. Browser and spoken accessibility checks remain unexecuted; 148 pending source keys and broader semantic review remain open.

### Tsonga and Venda block and bubble labels

- Filled 32 English placeholders through the protected workflow, preserving arguments and existing translations. Statement uses instruction wording and bubble uses a text-box paraphrase; collapsed/folded remains distinct from disabled/prevented from working.
- Vocabulary references: the [multilingual mathematics dictionary](https://ulspace.ul.ac.za/bitstream/handle/10386/3519/multilingual%20mathematics%20dictionary%20R%20-%206_march_2013.pdf?isAllowed=y&sequence=1) supports Tsonga `nkoka` for value; the [multilingual dictionary hosted by the University of Limpopo](https://ulspace.ul.ac.za/server/api/core/bitstreams/a1a05d26-ee2d-49d5-9be8-4a33ebd145e8/content) supports Venda `tshifaredzi` for container.
- Stack is a pile/group of blocks, which remains provisional, especially the broad Venda group wording. Block loans, replacement phrasing, numeral agreement and text-box metaphors also need contextual review. The vocabulary references do not validate the composed labels.
- Extended token, non-placeholder and distinction checks. Browser and spoken accessibility checks remain unexecuted; 148 pending source keys and the broader semantic audit remain open.

### Wu Chinese and Venetian block and bubble labels

- Filled 32 English placeholders in `wuu-Hans` and `ve-CC` through the protected workflow, preserving numbered arguments and existing translations. Input and comment vocabulary follows the catalogs.
- Wu uses shared Chinese technical nouns with Wu forms such as `里向个` and `好替换个`; shared written technical terms alone do not establish wrong-language text. Venetian uses `el ga`, `el se pol` and the catalog's `ł` orthography. The [Venetian dictionary](https://www.slideshare.net/libriveneti/venetian-dictionary) was consulted as a general vocabulary reference, not proof of the composed technical labels.
- Stack is a connected string/pile of blocks; the Venetian bubble uses a text-balloon metaphor. Venetian container, disabled and bubble terminology, and regional Wu wording, remain lower confidence and need contextual review.
- Extended token, non-placeholder and distinction checks. These do not prove fluent or semantically equivalent wording. Browser and spoken accessibility checks remain unexecuted; 148 pending source keys and broader semantic review remain open.

### Walloon and Waray block labels; correction of mistaken locale identity

- The registry explicitly names `wa-RR` Wáray-Wáray and `wa` Walon. Earlier audit entries and a field-label regression incorrectly treated both as Walloon. Those conclusions were wrong: the existing Waray comments were valid, while the subsequently inserted Walloon field labels were wrong-language text.
- Filled 32 English block/bubble placeholders in the two languages separately. Corrected 15 wrong-language Waray values: eleven field types, date, checkbox, dropdown and multi-select. Replaced the regression that had enforced Walloon in the Waray catalog with Waray expectations and checks against copying the Walloon field labels.
- Vocabulary references: Walloon [bouyote](https://wa.wiktionary.org/wiki/bouyote) and the [Waray corpus dictionary](https://dictionary.corporaproject.org/index.php?glossary=S&sort=word). Stack/pile, block loans, container and replacement phrasing remain provisional; dictionary vocabulary does not prove the composed labels fluent.
- Preserved numbered arguments and extended existing block-label checks. Browser and spoken accessibility checks remain unexecuted. Further wrong-language review of `wa-RR`, the 148 pending keys and the broader semantic audit remain open.

### Waray board and import controls: further Walloon contamination

- Compared `wa-RR` with Walloon and inspected the source meanings. Corrected 40 verified Walloon values covering board membership restrictions, home/default boards, views, deadlines, import/export, user mapping and text notes. Preserved the `%s` day-count tokens and the non-deletion guarantees in the confirmation messages.
- These are wrong-language corrections, not English-placeholder fills; the missing count does not change. Many additional Walloon values remain in the Waray catalog and require subsequent correction. Prior assertions that these shared Walloon values were correct translations for `wa-RR` must not be relied upon.
- Added regression checks for the corrected key set, source tokens, known Walloon vocabulary, import/export distinctions and the non-deletion guarantees. The tests cannot prove fluent Waray. Template/default, swimlane and chart terminology remains provisional and needs contextual review; browser checks were not run.

### Waray notes, favorites and related controls

- Corrected 30 further Walloon values in `wa-RR`: note actions, favorites, permanent-delete settings, rule text matching, import guidance, selection and interruption labels. Source review restored the missing Markdown-import explanation that plain bulleted lists without checkboxes become open cards.
- Preserved `%s`, Markdown examples and the statement that enabling permanent deletion does not itself delete content. Menu uses a choices paraphrase and normal uses usual/common wording. The initial shared-loan drafts lacked supporting Waray usage evidence; no equality exception was added for them. Technical loans and phrasing remain provisional.
- Extended the Waray regression key set, token checks, import syntax checks and negative-operation distinctions. More wrong-language text remains; no claim of complete or fluent Waray coverage is made. Browser checks and the broader semantic audit remain open.

### Waray organization, template and rule controls

- Corrected 25 verified Walloon values in `wa-RR`, covering external issue links, email-template variable hints, database metadata, organization domains/admins, card field ordering and rule controls.
- Preserved brace-delimited template variables, `#1234`, domain examples, `MULTITENANCY=true`, `DDP_TRANSPORT` and the database mode identifiers. Organization-admin wording retains both prohibitions: granting site-wide Admin privileges and managing a site administrator. Domain branding wording states which branding replaces which.
- Extended the corrected-key set and added brace-token, setting-literal, authorization-negation and up/down distinction checks. Technical paraphrases for database/reactivity, tenant and branding remain provisional; structural checks do not establish fluency. Further Waray contamination, browser checks and broader semantic review remain open.

### Waray authentication, rule and layout labels

- Corrected 25 verified Walloon values in `wa-RR`, covering rule conditions/actions, LDAP/OAuth, passwordless login, board/card lists and layout controls. Preserved the distinction between requesting a code and confirming it was sent, one-time use, account conflict and the server-held secret never being displayed.
- Preserved `%s`, camel-case `{cardLink}`, the other rule variables, `OAUTH_*_ENABLED`, `MAIL_URL` and `PASSWORDLESS_ENABLED`. Restored the header-icons hint's mobile/desktop notification detail omitted by the previous value.
- Extended the corrected-key and brace-token checks, including camel-case names, configuration literals and authentication-state distinctions. Environment-variable, layout and login terminology remains provisional and requires contextual review. No authentication behavior changed. Browser checks and further wrong-language review remain open.

### Waray role summaries, table views and layout controls

- Corrected 25 verified Walloon values in `wa-RR`, covering sidebar resizing, checklist sound, public/private defaults, role summaries, table-view toggles, global search and coordinate labels.
- Preserved the sound's default-off state, the role summary's read-only status, and each table toggle's current state and inverse action. Search operator/predicate names are localized in `globalSearch.js`; the replacement names remain single tokens without spaces or colons.
- Extended corrected-key checks and added toggle, default-state, read-only and search-token regressions. Role/default and swimlane wording remains provisional and needs contextual review. Browser validation, further Waray contamination and broader semantic review remain open.

### Waray reports, data recovery and history labels

- Corrected 20 verified Walloon values in `wa-RR`, covering activity/security/database reports, login-location reporting, API usage, recovery, history and invitation-domain guidance.
- Preserved IPv4/IPv6, REST API, MongoDB and `WITH_API=true`. API reporting retains one row per account/endpoint rather than per request; recovery wording distinguishes no recorded events from the database being healthy, and waiting from recovery completion.
- Extended corrected-key, configuration, aggregation and first/last/edited/moved distinction checks. Technical language for corruption, recovery and database growth remains provisional; tests do not establish fluent wording. Browser checks and further wrong-language review remain open.

### Waray storage, backup scope and board-status labels

- Corrected 25 verified Walloon values in `wa-RR`, covering checklist text editing, identifiers, storage, board timing/status, lazy loading and organization backup scope. Product names and identifiers remain intact.
- Backup guidance retains the exclusion of user accounts and instance settings and limits restoration writes to boards owned by the organization. Lazy-loading wording retains the restriction to large boards; time spent and remaining time remain distinct.
- Extended the corrected-key regression, product-name checks and scope/restriction checks. Technical wording for compaction, connection strings, tenant overrides and subtasks remains provisional. Browser checks, further Waray contamination and broader semantic review remain open.

### Waray migration, repair and import guidance

- Corrected the remaining 31 candidates from the current exact-Walloon-match vocabulary scan of `wa-RR`. This scan is a heuristic, not a complete language audit: different wrong-language values and semantic errors can remain.
- Corrected migration/repair, import/export, search syntax, checklist/layout, synchronization and Monte Carlo forecast labels. Preserved repair/restoration count tokens, code-formatted search examples, filename extensions and product names; retained unsuccessful-repair and partial-restoration meanings.
- Extended token and negative-result regressions, including Markdown search syntax. Technical wording for migration detection, integrity, sticky headers and inheritance remains provisional and needs contextual review. Browser checks and broader semantic review remain open.

### Waray Blockly editing, colors and control flow

- Filled 39 English placeholders through the protected workflow, covering block editing, colors, loops and conditional branches. Left keyboard legends and ChromeOS unchanged. Preserved numbered arguments and numeric color ranges.
- Kept breaking out of a loop distinct from skipping to its next iteration, and retained the final fallback branch when no condition is true. Existing Waray comment and input vocabulary guided wording; loop, palette, backpack and function terminology remains provisional.
- Extended corrected-key/token checks and control-flow/range regressions. These structural and phrase checks do not establish full semantic equivalence or fluency. Browser and spoken accessibility checks remain unexecuted; broader language review remains open.

### Waray Blockly loop conditions, clipboard and field editing

- Filled 35 English placeholders through the protected workflow. Translated while/until semantics, clipboard/backpack operations, deletion confirmations, enable/disable and expand controls, bitmap labels and field editing. Preserved keyboard legends and every numbered argument.
- Until repeats while the condition is false; while repeats while it is true. Bitmap labels retain row/column ordering and the count of enabled pixels. Existing catalog wording guided translations; backpack, external-input and bitmap terminology remains provisional.
- Extended token, condition-polarity, opposite-action and row/column regressions. Browser and spoken accessibility checks remain unexecuted; structural checks do not establish full fluency or semantic equivalence.

### Waray Blockly icon actions and input descriptions

- Filled 34 English placeholders through the protected workflow: keyboard help, comment/warning/editor icon actions and condition/list/loop/math input descriptions. Preserved numbered arguments and existing keyboard legends.
- Closed comment/warning icons announce opening; open icons announce closing. Input wording distinguishes start/end, first/second conditions, splitting text and joining lists, repeated values and repetition counts.
- Extended token, icon-action and input-distinction regressions. Delimiter, inline-input, loop increment and mathematical constraint wording remains provisional and needs contextual accessibility review. Browser/spoken checks remain unexecuted; structural checks do not establish fluent wording.

### Waray Blockly mathematical/text inputs and keyboard navigation

- Filled 33 English placeholders through the protected workflow. Translated mathematical operands, coordinate and text-input labels, value positions and keyboard-navigation hints while preserving numbered arguments and keyboard legends.
- Kept dividend/divisor, minimum/maximum, x/y, find/replace and statement/value distinct. Navigation wording retains holding the first key, accepting with the second and distinguishing copied from cut content.
- Extended token, operand, opposite-operation and navigation-sequence checks. Division paraphrases, coordinate terminology and unconstrained movement wording remain provisional and need contextual accessibility review. Browser and spoken checks remain unexecuted.

### Waray Blockly list creation and retrieval

- Filled 27 English placeholders through the protected workflow, covering list creation, first/last/random/indexed retrieval and removal, and an end-relative sublist bound. Retained keyboard/platform names and the literal `#` position marker.
- Distinguished returning an item without removal, removing and returning it, and removal alone across all four position modes. Empty-list wording retains length 0 and no data records.
- Extended corrected-key/token checks and positive/negative operation wording checks. Programming return, random selection and end-relative indexing terminology remains provisional and needs contextual review. Browser and spoken accessibility checks remain unexecuted.

### Waray Blockly list indexing, insertion and replacement

- Filled 30 English placeholders through the protected workflow: sublists, indexed search, empty/length checks, repetition, reversal, insertion/replacement and ascending order. Preserved numbered arguments and literal position markers.
- Retained the not-found return value, copy semantics of sublist/reversal operations, and distinctions between insertion and changing an existing value. First/last and counting from the end remain separate.
- Extended token, missing-result, copy and operation checks. Index terminology and ascending-order phrasing remain provisional, particularly for nonnumeric sorting. Browser and spoken accessibility checks remain unexecuted; contextual language review remains open.

### Waray Blockly sorting, text/list conversion and comparisons

- Filled 29 English placeholders through the protected workflow, covering sorting, split/join, booleans, comparison announcements/tooltips, negation and the null tooltip. Preserved numbered arguments, keyboard/platform names and the programming literal `null`.
- Retained sorting a copy, case-insensitive versus ordinary alphabetic ordering, strict versus inclusive comparisons and both branches of boolean negation. Split and join retain delimiter semantics.
- Extended token, copy, comparison-boundary, sort-direction and negation checks. Delimiter, ordering and comparison phrasing remains provisional and needs contextual review. Browser and spoken accessibility checks remain unexecuted.

### Waray Blockly conjunction, arithmetic and constants

- Filled 27 English placeholders through the protected workflow, covering conjunction/ternary logic, arithmetic, atan2, constants, inclusive limits and divisibility. Preserved numbered arguments, mathematical notation, coordinate labels and the -180 to 180 range.
- Kept both-input conjunction distinct from at-least-one disjunction, and retained both branches of the conditional expression. Bounds explicitly include the endpoints; evenness is paraphrased as divisibility by 2 without remainder.
- Extended token, boolean-quantifier, inclusive-bound, angle-range and constant-notation checks. Square-root, golden-ratio and exponent terminology is lower confidence and needs contextual mathematical review. Browser and spoken accessibility checks remain unexecuted.

### Waray Blockly numeric properties and statistics

- The mode wording uses `agsob` (frequent), checked against the [Waray Dictionary](https://dictionary.corporaproject.org/index.php?glossary=A&sort=word); the derived superlative remains provisional.

- Filled 25 English placeholders through the protected workflow, covering sign, parity, prime/whole properties, modulo, multiplication and list statistics. Preserved the `%1 ÷ %2` expression and distinguished positive/negative relative to zero.
- Kept mean, median, modes, standard deviation and sum distinct; the modes tooltip returns a list rather than a single value. Statistical loanwords and the standard-deviation paraphrase remain lower confidence and require mathematical-language review.
- Extended token, sign, modulo and statistic-distinction checks. These checks do not establish fluency or validate mathematical terminology. Browser and spoken accessibility checks remain unexecuted.

### Waray Blockly random values and unary mathematics

- Filled 28 English placeholders through the protected workflow: list statistics, random values, rounding, absolute values, exponentials, logarithms, negation and square roots. Preserved numbered arguments, bases, and the inclusive/exclusive random-number endpoints.
- Added checks distinguishing upward/downward rounding, integer/float bounds, base-10 logarithms and sign reversal. Existing inventory checks cover all added keys and their placeholders.
- Statistical, rounding and logarithm terminology remains provisional; mathematical fluency and spoken accessibility need contextual review. Browser checks were not run.

### Waray Blockly trigonometry, variables and procedures

- Filled 51 English placeholders through the protected workflow, covering trigonometry accessibility labels and tooltips, workspace controls, variables, function definitions and calls. Retained mathematical abbreviations and numbered arguments.
- Kept degree/radian distinctions, inverse operations, return/no-return functions, disabled-definition restrictions and rename-all scope explicit. Added regression assertions for those distinctions alongside the existing token inventory checks.
- Trigonometric loanwords, inverse-function wording and programming metaphors remain low confidence. Dictionary searches did not establish standard Waray trigonometric terminology; these proposed terms require fluent mathematical review. Browser and spoken accessibility checks were not run.

### Waray Blockly screen-reader and navigation shortcuts

- Filled 42 English placeholders through the protected workflow, covering screen-reader mode, directional movement and scrolling, stack navigation, focus, announcements and editing shortcuts. Preserved shortcut arguments and explicit on/off state transitions.
- Kept scrolling the visible area distinct from moving a block, and retained start/end, first/last, previous/next and top/bottom distinctions. Added direction, state-transition and opposite-action regression checks alongside placeholder comparisons.
- Screen-reader, focus and stack terminology remains provisional and needs contextual accessibility review. Browser and spoken screen-reader checks were not run; automated checks do not establish linguistic fluency.

### Waray Blockly text operations

- Filled 53 English placeholders through the protected workflow, covering text case, character positions, substrings, search, counts, joining, prompting, replacement, reversal and trimming. Preserved numbered arguments and position markers.
- Kept append-at-end, not-found results, space-inclusive length, replace-all scope and copy semantics explicit. Added regression assertions for these behaviors and left/right/both trimming directions.
- Title-case and substring wording is paraphrased and remains provisional pending contextual language review. Browser and spoken accessibility checks were not run; automated checks establish structure and selected semantic distinctions, not fluency.

### Waray Blockly variables and workspace descriptions

- Filled 44 English placeholders through the protected workflow, covering variable creation/conflicts, workspace counts/search, default names and shared list/function labels. Preserved numbered tokens and the leading spaces needed when comment-count fragments join workspace descriptions.
- Kept search keyboard shortcuts and next/previous directions intact. Added shortcut, fragment-spacing, empty-workspace, get/set and shared-function-label regression checks.
- Search-focus and variable-type language remains provisional pending contextual review. The remaining placeholder inventory still includes rule-editor and Scrum prose as well as keyboard names, platform names and mathematical notation; this batch does not complete Waray. Browser and spoken accessibility checks were not run.

### Waray rule editor and Scrum planning

- Filled 54 English placeholders through the protected workflow: block-rule messages, backlog views, Scrum roles/settings, estimates, sprint actions and planning labels. Reused the existing trigger/action/rule terms.
- Preserved exactly-one trigger/action validation, administrator permission, reload-before-save conflicts, unfinished-work rollover and distinct completion policies. Added regression checks for these constraints and shared view labels.
- Scrum Master, velocity, capacity and increment wording is provisional and requires domain-aware language review. Remaining Scrum report/event messages are still untranslated. Browser checks were not run.

### Waray Scrum reports and observations

- Corrected the wrong-language `export` label (`Ebaguer`) directly to `Pag-eksport`, matching the export instructions; this correction is separate from the 40 placeholder fills. Reused `agianan` for swimlane.

- Filled 40 English placeholders through the protected workflow, covering Scrum events, states, close/cancel confirmations, report scope, snapshots and daily observations. Preserved every count/reference token, UTC and the 366-observation limit.
- Retained unknown-versus-zero estimates, matching-unit/policy comparisons, assigned-card-only reports, omitted missing days and the distinction between observation exports and sprint-result exports. Added checks for these key constraints and different close/cancel outcomes.
- Snapshot, retrospective and observation terminology is provisional and needs domain-aware language review. Browser checks were not run; tests cover tokens and selected semantic distinctions, not fluency.

### Waray synchronization conflicts and previews

- Filled 43 English placeholders through the protected workflow, covering conflict choices, replacement cards, previews and source-field omissions. Preserved source/local distinctions and both 100-entry/path limits.
- Kept no-source-write behavior, retained local content, unchanged subcards, reused replacements and whole-list-sync exclusions explicit. Added checks for these distinctions and shared preview/source labels.
- Synchronization, mapping, normalized-field and parser terminology remains provisional; the descriptive parser wording needs technical-language review. Browser checks were not run.

### Waray synchronization reports and email failures

- Filled 29 English placeholders through the protected workflow, covering sync run history, diagnostics, Jira estimate mapping and email failure categories. Preserved 20-run/30-day retention, full-list write access and exactly-one-field constraints.
- Distinguished missing source values from explicit null, temporary from permanent SMTP rejection, and unconfirmed delivery from a saved receipt failure. Added regression checks for these distinctions and report actions that cannot resume or undo runs.
- Diagnostic and authentication terminology is provisional and needs technical-language review. Browser checks were not run; automated coverage does not establish fluency.

### Waray activity notification recovery

- Filled 27 English placeholders through the protected workflow, covering pending activity notifications, delivery state, retry, pause/resume/cancel controls and rule-email loading failures.
- Preserved the fact that retries never recreate activities, failed deliveries retain pending work, cancellation cannot be resumed and already queued/delivered messages are not recalled. Added negative-behavior, retention, conflict-review and distinct-action checks.
- Delivery reservation, recipient-plan and metadata terminology remains provisional and requires technical-language review. Browser checks were not run. The next remaining-placeholder review must distinguish recognizable keyboard/platform names and mathematical notation from untranslated prose; this batch alone does not prove locale completeness.

### Waray wrong-language audit: controls and authentication

- Corrected 44 French, Walloon or mixed-language values directly after reading their English source and inspecting the stored vocabulary. These values were not protected correct-language Waray translations; the earlier Walloon-catalog equality scan missed them because the other catalog had different wording.
- Covered board controls, labels, attachments, templates, loading indicators, authentication and forecasting. Preserved authentication app names, six-digit requirements, manual-entry spacing, file extensions and all forecast tokens. Added shared-label, multi-window and authentication regression checks.
- The remaining-placeholder count is unchanged by these corrections. More wrong-language candidates remain, including list synchronization and attachment-query terms. Color, roadmap and API terminology is provisional; browser and fluent-speaker review remain open.

### Waray wrong-language audit: list synchronization

- Corrected 21 French or Walloon values directly: list synchronization controls, credential state, source settings and attachment query terms. Preserved the 15-minute interval, API/PROJECT identifiers and `%s` failure argument.
- Read the localized operator/predicate registrations in `config/query-classes.js` and search-help use in `client/components/main/globalSearch.js`. Attachment aliases now use the single word `kalakip`, matching the Waray attachment label and avoiding the former embedded space.
- Added interval, action-label, credential-state and query-token checks. The English-placeholder count is unchanged. More French query aliases remain for the next audit batch; credential terminology remains provisional and browser checks were not run.

### Waray wrong-language audit: search aliases

- Corrected 42 French/Walloon operator and predicate values directly. Retained existing shorthand symbols and abbreviations; used single-token Waray aliases compatible with the parser's letter/apostrophe syntax.
- Added real-parser checks for twelve text operators, positive/negative attachment existence, invalid predicates and the apostrophe-bearing modified-date operator. Existing token inventory checks cover every corrected value.
- Compacted query aliases such as `takdangpetsa` and `listahansusi` are provisional technical labels, not claims of standard orthography. Quarter terminology and wider locale fluency still require review. The English-placeholder count is unchanged; browser checks were not run.

### Waray wrong-language audit: remaining accented prose

- Corrected 41 French, Walloon or mixed-language values found by broadening the accent/vocabulary scan, including charts, previews, rule fragments, recurrence controls, storage and authentication status. Read each English source before replacing the foreign prose.
- Preserved the reactivity environment-variable identifier and distinguished work remaining/completed, reset/recur, public/private and all-label scope. Added operation, shared-preview and authentication-state checks.
- The exact-English count is unchanged. Removing these flagged values is not proof that all foreign text is gone: unaccented foreign words and semantic errors still require review. Flow-efficiency, accessibility and two-factor terminology remains provisional; browser checks were not run.

### Waray wrong-language audit: board views and account labels

- Corrected 52 French/Walloon values discovered by comparing both catalogs and reviewing each candidate, including unaccented words missed by the earlier character scans. Covered board views, font/theme controls, account labels, starred items and work timers.
- Preserved unread-comment meaning, zoom directions, all-starred scope, SMTP identifiers and the Pomodoro argument. Added shared-label, direction and scope assertions.
- Flow, cycle/lead-time and milestone terminology remains provisional. Further comparison candidates remain, including colors, rules, storage and diagnostics. The English-placeholder count is unchanged; browser and fluent-speaker checks remain outstanding.

### Waray wrong-language audit: rules, accounts and storage

- Corrected 84 French/Walloon or mixed-language values directly after reviewing their English source. Covered rule fragments, account and OAuth labels, card views, diagnostics, recurrence and storage settings.
- Preserved LDAP error arguments, platform identifiers, the AWS region example and Cc notation. Kept reset and recurrence distinct; added shared-view/state, passwordless and identifier checks.
- Role, performance, instance and diagnostic terminology remains provisional and needs contextual review. Remaining comparison candidates include colors, date-format labels and further diagnostics. English-placeholder counts are unchanged; browser checks were not run.

### Waray wrong-language audit: diagnostics and process charts

- Corrected 38 French/Walloon or misleading mixed-language values directly, covering diagnostics, events, import state, numeric search and process-chart labels. Restored the source distinction between mean, confidence and moving range instead of describing every statistic as cycle time.
- Preserved CPU, OTP, IP versions, XmR and percent notation. Added shared-label, no-active-work and identifier checks; the number search alias is a single token.
- Statistical moving-range, confidence and server terminology remains provisional and needs technical-language review. English-placeholder counts are unchanged. Color/date labels and recognizable shared terms still need separate review; browser checks were not run.

### Waray wrong-language audit: colors and date-format labels

- Corrected 15 values: eleven French/Walloon color names, three French date-format labels and an incomplete ISO-week calendar label. Retained the actual YYYY/MM/DD format notation and added Waray component names in the correct order.
- Read the date-format options in `client/components/settings/settingBody.jade`: the stored option values are independent of their translated display labels. Added component-order, ISO-week and color-family checks.
- Fine color distinctions and descriptive color wording remain low confidence and need visual/fluent-speaker review. English-placeholder counts are unchanged. Browser checks were not run; valid shared terms and further semantic review remain open.

### Akan Blockly block and bubble labels

- Filled 16 English placeholders through the protected workflow. Reused existing Akan input/comment terminology and translated block state, branch counts, stack descriptions, categories and warning bubbles.
- Preserved every numbered argument and singular/plural input distinction. Registered Akan in the shared block/bubble regression suite, which checks tokens and distinct collapsed/disabled, statement/value and comment/warning labels.
- Warning vocabulary was checked against the [Akan dictionary entry for kɔkɔbɔ](https://www.akandictionary.com/2022/01/16/kokobo-2/). Stack/container metaphors and the borrowed block term remain provisional and need contextual accessibility review. Browser and spoken checks were not run.

### Akan Blockly editing, colors and control flow

- Filled 44 English placeholders through the protected workflow, covering editing, color composition, loops and conditional branches. Preserved numbered arguments, blend bounds and RGB limits.
- Corrected three generic filler values in the main red/green/blue labels directly; all previously said an unrelated phrase about task information. Matched these to the translated Blockly color controls.
- Added per-key token checks, distinct color/operation checks, loop-only restrictions and opposite while/until conditions. Programming metaphors, variable and iteration wording remain provisional. Browser and fluent-speaker checks were not run.

### Akan Blockly editing and field controls

- Filled 39 English placeholders through the protected workflow, covering copy/cut/delete, backpack actions, enabled state, bitmap fields, multiline editing and comment/warning icons. Preserved every numbered argument and all-block scope.
- Added per-key token checks, open/close icon behavior, enabled/disabled distinctions and separate clear/randomize actions. Existing singular/plural block descriptions remain intact.
- Bitmap row/column, inline/external inputs and multiline wording are descriptive and provisional; contextual accessibility review is still needed. Browser and spoken checks were not run.

### Akan Blockly input labels and keyboard guidance

- Filled 58 English placeholders through the protected workflow, covering condition, list, loop, numeric and text inputs plus keyboard navigation. Preserved numbered arguments and x/y coordinate identifiers.
- Kept dividend/divisor, start/end, first/second, maximum/minimum, split/join and copy/cut distinctions. Added per-key token checks and input-role/navigation assertions.
- Mathematical input roles and keyboard terminology use descriptive, provisional wording requiring contextual review. Browser and spoken accessibility checks were not run.

### Akan Blockly list creation and retrieval

- Filled 46 English placeholders through the protected workflow, covering list creation, get/remove variants, sublists, search, length, repetition and reversal. Preserved numbered arguments and position markers.
- Kept return-only, remove-only and remove-and-return behavior distinct for first, last, indexed and random items. Added those checks plus not-found sentinel and copy/reversal assertions.
- List and sublist wording is descriptive and provisional; contextual language and accessibility review remains open. Browser and spoken checks were not run.

### Akan Blockly list mutation, sorting and logic

- Filled 47 English placeholders through the protected workflow, covering insertion/replacement, sorting, split/join, comparisons, negation and conditional expressions. Preserved numbered arguments and the null literal in its tooltip.
- Added per-key token checks, insertion/replacement distinctions, strict/inclusive comparison boundaries, both/at-least-one boolean conditions and conditional-label consistency.
- Sorting direction and programming wording remain provisional, especially for alphabetic ordering and case handling. Browser and spoken accessibility checks were not run.

### Akan Blockly arithmetic and number properties

- Filled 30 English placeholders through the protected workflow, covering arithmetic, atan2, constants, limits, parity, sign, primality and remainder. Preserved mathematical notation, coordinate labels, numbered arguments and angle bounds.
- Added per-key token, inclusive-limit, sign, prime-lower-bound, modulo and constant-notation checks. Divisibility and prime properties use descriptive wording.
- Square-root, golden-ratio, exponent and trigonometric terminology is low confidence and requires mathematical-language review. Browser and spoken accessibility checks were not run.

### Akan Blockly statistics, random values and rounding

- Filled 27 English placeholders through the protected workflow: list statistics, random values, powers and rounding. Preserved numbered arguments and inclusive/exclusive endpoints.
- Added token, distinct-statistic, endpoint and rounding-direction checks. The mean tooltip explains sum divided by count, while modes refer to the most frequent items.
- Standard-deviation, median and rounding terminology remains low confidence and requires mathematical-language review. Browser and spoken accessibility checks were not run.

### Akan Blockly unary mathematics and workspace controls

- Filled 39 English placeholders through the protected workflow, covering absolute values, powers, logarithms, negation, roots, trigonometry, minimap controls and new variables. Preserved bases and degree/radian distinctions.
- Added token, logarithm-base, inverse-function, angle-unit, sign-reversal and open/close checks. Standard function names such as cosine and logarithm remain recognizable within Akan phrases; mathematical abbreviations remain unchanged.
- Inverse-function, square-root and variable-type descriptions remain low confidence and require mathematical-language review. Browser and spoken accessibility checks were not run.

### Akan Blockly procedures and screen-reader mode

- Filled 31 English placeholders through the protected workflow: parent/backpack controls, procedure definitions and calls, rename/redo, zoom reset and screen-reader mode. Preserved numbered arguments and all-variable rename scope.
- Added per-key token checks, return/no-return distinctions, function-only restrictions, disabled definitions and explicit off-to-on/on-to-off transitions.
- Procedure-definition and screen-reader descriptions remain provisional and need contextual accessibility review; the technical parameter term remains recognizable within Akan prose. Browser and spoken checks were not run.

### Akan Blockly navigation shortcuts

- Filled 39 English placeholders through the protected workflow, covering movement, scrolling, focus, stack/page navigation and announcements. Used the existing Akan direction terms consistently.
- Added per-key token checks, four-direction assertions, visible-area scrolling distinctions, opposite-action checks and explicit previous-item wording.
- Focus, stack and announcement wording remains provisional and needs contextual accessibility review. Browser and spoken checks were not run.

### Akan Blockly text operations

Filled 55 English placeholders for text construction, character/sub-string access, searching, replacement, case changes, prompts and trimming. Preserved numbered arguments, absent-match results and spaces in length calculations; help URLs and numeric constants remain unchanged.

Regression checks cover source-token inventories, first/last endpoints, reverse order, trim sides and distinct input types. Case and substring terminology remains provisional. Browser rendering and spoken accessibility were not run; automated checks do not establish fluency.

### Akan Blockly variables and workspace messages

Filled 42 English placeholders covering variable reads/writes and name conflicts, workspace counts, search controls, shared Blockly aliases and remaining general labels. Kept keyboard names in shortcut instructions and reused existing translations for shared procedure, condition and list labels.

Regression checks cover all source placeholders, zero/one/many counts, leading spaces in comment fragments, keyboard shortcuts, opposite actions and shared labels. Variable/type and workspace terminology remains provisional. Browser rendering and spoken accessibility were not run.

### Akan rule editing and Scrum planning

Filled 54 English placeholders for block-rule editing, Scrum roles, backlog ordering, sprint controls, estimates and event planning. Corrected the existing generic activity-information phrase under `rules` to `Mmara`; the original value did not describe rules.

Checks preserve source tokens, one-trigger/one-action restrictions, administrator permission, distinct start/close/cancel controls, minute units and shared board-view labels. Scrum roles, sprint and estimate terminology are descriptive and provisional. Browser checks were not run; string checks do not prove fluent wording.

### Akan sprint reports and completion messages

Filled 40 remaining English Scrum messages covering events, completion and cancellation, partial snapshots, daily observations and import status. Preserve unknown-versus-zero estimates, first recorded UTC observations, omitted days, separate export actions and exact placeholders.

Tests cover tokens, distinct lifecycle states, completion/cancellation behavior, partial reports, UTC and the 366-observation limit. Snapshot, observation and Scrum terminology remains descriptive and low confidence pending contextual review. Browser rendering was not run.

### Akan synchronization conflicts and previews

Filled 43 English placeholders for conflict choices, duplicate mapping removal, archive restrictions, replacement creation, preview actions and source-field omissions. Preserve local content, unchanged subcards, source-only reading, retry reuse, display limits and hidden unmapped values.

Regression checks cover source placeholders, action distinctions, local-content retention, no full-list run, 100-entry/path limits and shared omission labels. Synchronization, mapping and parser terminology is descriptive and provisional. Browser checks were not run.

### Akan synchronization reports and email failures

Filled 29 English messages for retained Sync reports, diagnostics, Jira estimates and email failures. Preserve the latest-20/30-day limits, unfinished versus failed outcomes, hour units, ignored missing values and explicit-null clearing.

Regression coverage checks source tokens, retention limits, distinct outcomes, exact-one-field and missing/null semantics. Diagnostics and authentication terminology remains provisional. Browser checks were not run.

### Akan activity-notification recovery

Filled 27 English messages for pending notification delivery, retries, pause/resume/cancel controls and rule-email recovery. Preserve retained pending work, no recreation of original activities, permanent cancellation and the exclusion of already queued/delivered messages from recall.

Regression checks compare source tokens, distinguish delivery states and controls, and cover retained work and cancellation language. Recovery and reservation terminology remains provisional. Browser checks were not run. Akan now has 29 exact-English entries in the placeholder report, consisting of keyboard names, operating-system names and mathematical notation; this does not establish the correctness of the rest of the catalog.

### Akan generic filler correction: board, voting and display controls

Found 596 entries using the same unrelated activity-information phrase (`Nsɛm a ɛfa dwumadi yi ho`). Corrected the first 60 board, voting, typography and display labels, including restoring numeric poker choices and `?` exactly as in English. These existing non-English values were semantically wrong and were corrected directly rather than passed through the English-only fill tool.

Regression coverage rejects the old filler, checks source token inventories, literal voting values, the zoom range and opposite controls. Specialized theme, dependency and template labels remain provisional. Browser checks were not run; 536 instances of this exact filler remain for subsequent correction.

### Akan generic filler correction: colors, fields and account controls

Corrected another 60 unrelated filler values covering color names, custom fields, login, subscription and time tracking. Restored the intentionally empty comment placeholder, literal abbreviated list labels and Gantt name. The exact generic-filler inventory decreases from 536 to 476.

Basic color terms were checked against [Boston University's Akan colors](https://www.bu.edu/200word/akan-twi/colors/) and [LearnAkan's color vocabulary](https://learnakan.com/colours-in-twi/). Uncommon shades use provisional descriptions or recognizable borrowed shade names; these and version/WIP terminology need contextual review. Tests check source tokens, empty/literal values, count and hour units, color distinctions and opposite controls. Browser checks were not run.

### Akan generic filler correction: administration and diagnostics

Corrected 60 generic filler values for login customization, registration, file limits, webhooks, database/OS diagnostics and card dates. Restore literal file-size units and preserve technical names such as FerretDB, MongoDB, CPU and reactivity mode identifiers. The exact generic-filler inventory decreases from 476 to 416.

Tests cover source tokens, distinct attachment modes, shared labels, technical identifiers, time units and received/end dates. Operating-system, software-package and version terminology remains descriptive and provisional. Browser checks were not run.

### Akan generic filler correction: rule schedules and actions

Corrected 60 generic values for scheduling, rule triggers/actions, due-date conditions, checklist controls and email fragments. Preserve once/daily/weekday/weekly/monthly distinctions, Monday–Friday scope and opposite check/uncheck actions. The exact filler inventory decreases from 416 to 356.

Tests check source placeholders, schedule cadence, time units, paired controls and shared labels. Short rule fragments and prepositions remain provisional because their combined wording needs contextual UI review. Browser checks were not run.

### Akan generic filler correction: calendar and settings labels

Corrected 43 generic values covering date fields, weekdays, role/status labels, read/unread controls and custom head settings. Restored protocol names, URL and the literal context separator. The exact filler inventory decreases from 356 to 313.

Regression coverage checks source tokens, distinct weekdays, weekday-schedule consistency, read/unread states, shared templates, comma-separated examples and HTML/JSON identifiers. Role, domain and manifest terminology remains provisional. Search-operator filler remains for a dedicated pass with parser validation. Browser checks were not run.

### Akan search operators and errors

Corrected 49 search entries: 34 exact generic fillers and 15 mixed-language, malformed or unusable operator/predicate/error values. Restored canonical short aliases and replaced space-containing title/attachment aliases with single-word forms that the parser accepts. The exact filler inventory decreases from 313 to 279.

The actual query parser now has Akan regression checks for quoted values, translated operators, positive/negative existence predicates, invalid limits, modified-date filters and ascending/descending sorts. Locale tests preserve source tokens and shared aliases. Compound technical search words remain low confidence and need language review. Browser checks were not run.

### Akan generic filler correction: dependencies, locations and reports

Corrected 60 generic values for navigation, completion, dependency relations, locations, diagnostics and wait indicators. Restore the Arial font name and API labels. Preserve relation direction, first/last observations and distinct wait animations. The exact filler inventory decreases from 279 to 219.

Tests check source tokens, paired actions, inverse relations, geographic distinctions, identifiers and shared labels. Latitude/longitude, dependency and animation terms are descriptive and provisional. Browser checks were not run.

### Akan generic filler correction: attachments, storage and account controls

Corrected 60 generic values for tickets, file moves and repairs, storage diagnostics, accessibility and account lockouts. Restored storage provider names and preserved IDs, second units and distinct source/destination and pause/resume controls. The exact filler inventory decreases from 219 to 159.

Tests cover source tokens, identifiers, units, paired controls and shared labels. Compaction, migration, session and accessibility terminology remains descriptive and provisional. Browser checks were not run.

### Akan generic filler correction: cloud storage, backups and migrations

Corrected 60 generic values for cloud credentials, backups, migrations and connection tests. Preserve Azure Blob, MongoDB 3, JSON and the `us-east-1` region example. Distinguish start/pause/stop, access/secret keys and whole-data replacement. The exact filler inventory decreases from 159 to 99.

Tests cover source tokens, technical identifiers, lifecycle states, replacement scope and shared labels. Migration, backup and cloud-storage wording remains descriptive and provisional. Browser checks were not run.

### Akan generic filler correction: remaining status and migration labels

Corrected the remaining 99 exact occurrences of `Nsɛm a ɛfa dwumadi yi ho`, covering migrations, schedules, login, diagnostics and flow labels. Restore GridFS, S3 and Cron names; preserve interval numbers, CPU percentage, millisecond units and IP version identifiers. The exact filler inventory is now zero, which does not establish the accuracy of other catalog values.

A full-catalog regression rejects that exact filler phrase. Batch checks cover source placeholders, scheduling intervals, technical values, opposite actions and shared labels. Migration, diagnostic and short grammatical wording remains provisional; mixed-language and semantic review continues. Browser checks were not run.

### Akan mixed-language correction: board warnings and notifications

Rewrote 32 mixed-language values containing English clauses and malformed substitutions. Covered permanent deletion, archiving, private/public access, imports, member removal and notification scope. Corrected the outdated board-restore description to refer to Archive on the All Boards page, matching the current English source.

Tests preserve all source placeholders and HTML tags, deletion consequences, membership scope, last-admin restrictions and notification distinctions. Short menu references and administrative terminology need contextual review. Browser checks were not run. This batch does not change the exact-English placeholder count; the broader mixed-language audit continues.

### Akan mixed-language correction: configuration and rule triggers

Rewrote 24 mixed-language entries covering avatar/auth settings, organization domains, destructive confirmations, rule triggers and a due-date activity message. Restored the damaged `kanban.example.org` example and preserved `a.example.com`, `MULTITENANCY=true` and all activity placeholders/newlines.

Tests cover tokens, literal identifiers, duplicate-list deletion conditions, irreversible warnings and shared auth labels. Rule fragments and authentication/tenant wording remain provisional pending contextual review. Browser checks were not run; other mixed-language values remain under audit.

### Akan mixed-language correction: search and migration guidance

Rewrote 15 mixed-language descriptions for card-window behavior, keyboard saving, permissions, search syntax, administration and database/Sandstorm migration. Restored damaged Sandstorm names and attachment paths; preserved both database URLs, environment variables and Snap command examples.

Tests compare source placeholders and inline-code spans, verify paths/configuration literals, and cover unchanged filesystem data and irreversible deletion. Migration, tenant administration and rule/search wording remains descriptive and provisional. Browser checks were not run; other mixed-language values remain under review.

### Akan mixed-language correction: display, transfer and anonymity settings

Rewrote 12 mixed-language descriptions for plain-text display, import/export controls, avatar exclusions, anonymization and notification/activity settings. Restored corrupted product names and retained HTML/Markdown examples, mention syntax and anonymization examples.

Checks cover source tokens, default-off statements, product names, literal examples and separate avatar/notification scope. Privacy and rich-text terminology remains descriptive and provisional; these string checks do not establish fluency. Browser checks were not run.

### Akan mixed-language correction: migration confirmations and diagnostics

Rewrote 12 mixed-language values for migration confirmations, CPU limits, background execution, minimum username length and S3 key guidance. Preserve archived/non-archived scope, duplicate-list removal conditions, IDs, numeric limits and named console controls. Quoted diagnostic messages remain literal English so users can recognize them.

Regression checks cover source tokens, continuation prompts, scopes, technical identifiers and quoted messages. Migration terminology remains descriptive and provisional. Browser checks were not run; the catalog still needs further language review.

### Akan mixed-language correction: import activities and archive guidance

Rewrote 24 malformed or mixed-language entries covering activity logs, list widths, archive/restore guidance, account anonymization and imported-user mapping. Corrected the anonymization popup title, which incorrectly referred to importing users, and preserved the no-extra-permissions condition when mapping an imported member.

Tests compare all source placeholder inventories, activity targets, archive retention/restoration, size limits and mapping permissions. Mapping and administrative wording remains provisional. Browser checks were not run; broader semantic review continues.

### Akan mixed-language correction: permissions and account errors

Rewrote 24 mixed-language permission, existence/error and export labels. Preserve assigned-only visibility, read-only/comment-only restrictions, worker self-assignment and the fact that enabling permanent deletion does not itself delete data. Keep source count placeholders and JSON/CSV/TSV/Excel identifiers.

Regression checks cover source tokens, negative permissions, separate disabled/missing accounts and re-import guidance. Role and soft-deletion wording remains descriptive and provisional. Browser checks were not run; other mixed-language values remain under audit.

### Akan mixed-language correction: filters and import formats

Rewrote 24 filter/export/import messages, restoring machine-readable examples that had translated JSON field names and product names. Preserve Kanboard/Asana/ZenKit/Jira field names, API paths, spreadsheet headers, Trello extensions and advanced-filter syntax, including escapes.

Tests check source tokens, exact example fragments, backslash counts and distinct ZIP error categories. Technical filter and import wording remains provisional. Browser checks were not run; the broader language audit continues.

### Akan mixed-language correction: invitations and membership notices

Rewrote 24 mixed-language entries covering Trello controls, membership, private-board access, WIP/file limits and invitation email. Preserve invitation tokens and line breaks, organization-admin scope and the distinction between hiding a WeKan member and revoking Sandstorm access.

Tests cover source tokens, email formatting, permission restrictions, archive retention and separate API caps. Membership, storage and WIP terminology remains provisional. Browser checks were not run; broader language review continues.

### Akan mixed-language correction: rule imports, reminders and search scope

Rewrote 30 mixed-language rule triggers, import guidance, due reminders, deletion confirmations and search/template descriptions. Preserve activity placeholders, opposite trigger states, technical product names and permission-limited search scope. Count prefixes retain their trailing spaces.

Tests compare source tokens, distinct due states, paired actions, deletion restrictions, product identifiers and formatting. Rule fragments, checklist and shared-template terminology remains provisional. Browser checks were not run; broader semantic review continues.

### Akan mixed-language correction: search operator help

Rewrote 16 mixed-language search-help values covering operator syntax, membership, dates, existence, sorting, limits and combined conditions. Preserve all operator/predicate placeholders, inline-code examples and angle-bracket metavariables exactly as supplied by English.

Tests compare token, inline-code and metavariable inventories and cover absence checks, descending sort, positive integer limits, AND conditions and archived-card exclusion. Search terminology remains provisional. Existing parser regressions also pass; browser checks were not run.

### Akan mixed-language correction: diagnostics and report descriptions

Rewrote 18 mixed-language diagnostic, API/recovery report, creator and membership messages. Preserve log commands, the `WITH_API=true` setting, account/endpoint report granularity and deletion guards for nonempty organizations/teams. Existing literal `has:-due` and AND examples were reviewed and retained rather than mistaken for untranslated prose.

Tests compare source tokens and command spans and check line breaks, identifiers, report scope and deletion restrictions. Recovery and API wording remains provisional. Browser checks were not run; the broader audit continues.

### Akan mixed-language correction: storage maintenance and support

Rewrote 14 mixed-language values covering attachment location repair, storage defaults, MongoDB compaction, PDF support, custom translations and login protection. Preserve secondaries-before-primary order, the single-node exception and the after-file-moves restriction from the English source.

Tests cover source tokens, operational scope, product/format identifiers, logged-in-only support and irreversible deletion. Replica-set and compaction terms retain recognizable technical names within Akan prose and remain provisional. Browser checks were not run; this translation does not independently validate the operational guidance.

### Akan mixed-language correction: lockouts and card loading

Rewrote 14 account-state, lockout, storage-path, cron and card-loading messages. Preserve activation/deactivation direction, all-user unlock scope, the loading environment variables and the experimental partial-view warning.

Tests compare source tokens, opposite controls, configuration literals and lazy-loading limitations. Resource/loading and account-protection terminology remains provisional. Browser checks were not run; broader language review continues.

### Akan mixed-language correction: backup scope and migration descriptions

Rewrote 16 mixed-language labels and descriptions for transfer controls, anonymization, backup scope and board migrations. Preserve organization ownership limits, excluded accounts/settings, duplicate-list deletion conditions and background continuation.

Tests cover source tokens, ownership and deletion restrictions, technical identifiers, admin-only scope and shared anonymization labels. Backup and migration terminology remains provisional. Browser checks were not run; broader semantic review continues.

### Akan mixed-language correction: account errors, repair results and flow labels

Rewrote 20 mixed-language or malformed account, repair-result, import and flow-history messages. Preserve temporary-lockout behavior, unfixable/remaining counts, file extensions, selective-import scope and card-number query syntax.

Tests compare source tokens and query examples and cover failed/partial outcomes, format names and distinct history labels. Flow-history and repair wording remains provisional. Browser checks were not run; broader language review continues.

### Akan embedded filler correction: activities and flow reports

A substring audit found 40 additional values containing the generic activity-information phrase inside longer strings; these were not exact matches in the earlier 596-entry inventory. Rewrote all 40, covering activity fragments, email templates, rule dates, flow reports and time adjustments. No occurrence of that phrase remains anywhere in the Akan catalog.

Tests compare source placeholders, preserve `{{size}}`, simulation counts/UTC/horizon, percentile sample requirements, independent overlapping causes and date fallbacks. Statistical and forecasting terminology is low confidence and needs contextual review. Browser checks were not run; eliminating this phrase does not prove the catalog is fully correct.

### Akan mixed-language correction: display toggles and selection

Rewrote 22 mixed-language values for board selection/home behavior, width/keyboard toggles, fading tiers, dropdown entry and import/input errors. Preserve the current enabled/disabled state separately from the action performed by clicking.

Tests cover source tokens, opposite toggle actions, one-board selection, tier numbers, Enter, the four-digit year example and both Trello credentials. Fading and display terminology remains provisional. Browser checks were not run; broader language review continues.

## Akan input and scheduled-job corrections (batch 29)

Corrected 22 mixed-English values for search input, default boards, attachment
limits, storage, account lockouts and scheduled-job failures. Preserved Enter,
`<body>`, `example.com`, the prohibition on @/spaces, positive limits and distinct
schedule/delete/pause/resume/start outcomes. Technical Akan wording remains
provisional; browser rendering and fluent-speaker review have not been performed.
Source-token and operation/limit regression checks accompany these corrections.
These were mixed-language values, so the English-placeholder count is unchanged.

## Akan migration and deletion corrections (batch 30)

Corrected 30 mixed-English messages for migrations, storage settings, sign-in,
account enrollment, deletion confirmations and card dates/membership. Preserved
S3, millisecond bounds, email paragraphs/tokens, permanent deletion and distinct
pause/stop/resume operations. Added source-token and behavior-wording checks.
Technical terminology remains low confidence pending fluent-speaker review;
browser checks have not been run. English-placeholder counts are unchanged.

## Akan controls and storage corrections (batch 31)

Corrected 29 mixed-language values for card controls, upload limits, credential
retention and migration controls. Restored exact Azure/Google Cloud menu labels
inside translated navigation guidance. Preserved bytes, the logo height default,
blank-to-retain behavior and distinct membership/assignment actions. Added token,
menu-label and control checks. Technical wording remains low confidence pending
fluent-speaker review. Browser checks remain unrun; placeholder counts unchanged.

## Akan card and import corrections (batch 32)

Corrected 28 mixed-language card, selection, text and import messages. Preserved
JSON object keys in the multiple-card example; restored Trello menu labels and
matched WeKan navigation instructions to the localized menu/export labels.
Added token, parsed-JSON, navigation and permission/scope regression checks.
Technical wording remains low confidence pending fluent-speaker review. Browser
checks remain unrun. These corrections do not change English-placeholder counts.

## Akan rule and search corrections (batch 33)

Corrected 23 mixed-language rule, administration and search messages. Preserved
query operators and example arguments verbatim, opposite check/uncheck actions,
and archived/unarchived scope. Added token, query-syntax and action checks.
Technical terminology remains low confidence pending fluent-speaker review.
Browser checks remain unrun. English-placeholder counts are unchanged.

## Akan file and memory corrections (batch 34)

Corrected 24 mixed-language file, migration and Node memory labels. Restored the
Node and Meteor-Files product names; preserved per-board versus all-attachment
scope, GridFS/S3 destinations and original checklist order. Memory terminology
is low confidence pending fluent-speaker review. Added source-token, product,
scope and distinct-metric checks. Browser checks remain unrun. Two product-only
values now correctly equal English; the placeholder tool excludes them, so its
count remains 45,599 across 70 languages.

## Akan storage guidance corrections (batch 35)

Corrected 20 mixed-language administration/storage messages, including translated
repair identifiers restored to `swimlaneId` and `listId`. Preserved provider names,
optional key-file input versus pasted JSON, all-item scope and freed-space result
wording. Added source-token, identifier and scope regression checks. Technical
wording remains low confidence pending fluent-speaker review. Browser checks
remain unrun; English-placeholder counts are unchanged.

## Akan board controls and email corrections (batch 36)

Corrected 23 mixed-language or misleading values for board controls, account
emails, invitation status and file repair. The invitation label previously told
the user to accept/save instead of reporting that it had not been accepted.
Preserved email paragraphs/tokens, workspace placeholders, CAS/SAML and opposing
star/unstar actions. Added regression checks. Technical wording remains low
confidence pending fluent-speaker review; browser checks remain unrun.
English-placeholder counts are unchanged.

## Akan setting-action corrections (batch 37)

Corrected 21 mixed-language setting and action labels, preserving WIP alternatives,
relative/current dates, custom-field activity placeholders and the rule that an
empty field matches any value. Aligned duplicate-list migration/step labels and
card/list color labels. Added source-token and behavior-wording checks. Technical
wording remains low confidence pending fluent-speaker review. Browser checks
remain unrun; English-placeholder counts are unchanged.

## Akan archive and color corrections (batch 38)

Corrected 25 damaged or mixed-language archive, color and card-control values.
Replaced the corrupted archive term with the term already used in guidance,
aligned color actions, and preserved archive target distinctions and activity
placeholders. Added token, target and terminology checks. Wording remains
provisional pending fluent-speaker review. Browser checks remain unrun;
English-placeholder counts are unchanged.

## Akan import and invitation corrections (batch 39)

Corrected 28 mixed-language or damaged values for imports, invitations, archive
empty states, shortcuts and card controls. Restored the OpenProject product name
and GET /api/v3/work_packages endpoint. Preserved invitation paragraphs/tokens,
linked-card restrictions, numeric shortcuts and strict count threshold wording.
Added token, endpoint and behavior checks. Wording remains low confidence pending
fluent-speaker review; browser checks remain unrun. Placeholder counts unchanged.

## Akan upload and diagnostics corrections (batch 40)

Corrected 24 damaged or mixed-language upload, SMTP, diagnostics and color labels.
Restored Node and preserved protocol/configuration names, optional webhook token
wording, completed upload status and multi-selection label behavior. Added token,
identifier and action checks. Technical terminology remains low confidence pending
fluent-speaker review. Browser checks remain unrun. Node is intentionally a product
name rather than translated prose.

## Akan workflow and sorting corrections (batch 41)

Corrected 24 damaged, mixed-language or misleading workflow/sorting labels.
Repaired the enable/disable rule label, which previously repeated the same action.
Preserved archive direction, Trello Butler best-effort wording, N-day and board
placeholders and the literal closing body tag. Added source-token, direction and
markup checks. Wording remains low confidence pending fluent-speaker review;
browser checks remain unrun. English-placeholder counts are unchanged.

## Akan sorting and report corrections (batch 42)

Corrected 24 damaged or mixed-language sorting, report and field labels. Restored
the literal `username` and `user:<username>` search example, preserved `%{value}`
and HTML space entities, and aligned equivalent sorting labels. Added token,
query-syntax, entity and report-distinction checks. Wording remains low confidence
pending fluent-speaker review; browser checks remain unrun. Placeholder counts
are unchanged.

## Akan support and lockout corrections (batch 43)

Memory terminology reference: [Node V8 documentation](https://github.com/nodejs/node/blob/main/doc/api/v8.md), including `does_zap_garbage`.

Corrected 24 damaged or mixed-language support, storage, lockout and memory labels.
Preserved known-user/wrong-password versus nonexistent-user distinctions and
opposite filesystem states. Retained technical memory identifiers alongside
provisional explanations. Added token, identifier and state checks. Technical
wording remains low confidence pending fluent-speaker review; browser checks
remain unrun. English-placeholder counts are unchanged.

## Akan cloud-storage corrections (batch 44)

Corrected 25 damaged or mixed-language storage messages. Restored Azure/Google
product names, provider navigation labels, the Storage Object Admin role and
client_email key. Preserved read/write permissions, disabled state and lazy-load
scope. Added token, name and scope checks. Provider instructions are translated
from the English source, not independently revalidated against live consoles.
Technical wording remains low confidence; browser/fluent-speaker checks remain
unrun. Product-only labels intentionally match English.

## Akan repair and monitoring corrections (batch 45)

Corrected 24 damaged or mixed-language repair, monitoring and repository labels.
Preserved missing/corrupted alternatives, list/card/swimlane repair scope, possible
conversion delay and AWS S3/SSL/TLS identifiers. Aligned repository terminology
and CPU suffix. Added token, scope and terminology checks. Technical wording
remains low confidence pending fluent-speaker review; browser checks remain
unrun. English-placeholder counts are unchanged.

## Akan drag and account guidance corrections (batch 46)

Corrected 22 mixed-language or misleading drag, account and configuration labels.
Restored Trello Card Attachments Downloader and AWS menu names from the English
source. Preserved optional inputs, sidebar toggle targets, workspace tokens and
connection-string alternatives. Added token, name and behavior checks. Provider
navigation is not independently verified against live consoles. Wording remains
low confidence pending fluent-speaker review; browser checks remain unrun.

## Akan field and rule corrections (batch 47)

Corrected 20 mixed-language or misleading field, rule and timeline messages.
Restored the timeline confirmation's full field list, displayed-value target and
no-deletion statement; preserved board-admin-only visibility. Aligned field
creation labels and clarified rule actions. Added token, scope and state checks.
Wording remains low confidence pending fluent-speaker review; browser checks
remain unrun. English-placeholder counts are unchanged.

## Akan grouping and field-summary corrections (batch 48)

Corrected 18 mixed-language or misleading rule, board and field-summary messages.
Restored number-field summation instead of a people count, opposite grouping
states/actions and the synchronization interval's minutes unit. Preserved JSON/
CSV, count tokens and the existing Sync now label. Added token, aggregate and
state checks. Wording remains low confidence pending fluent-speaker review;
browser checks remain unrun. English-placeholder counts are unchanged.

## Akan timing and completion corrections (batch 49)

Corrected 24 mixed-language timing, checklist and status messages. Preserved
received/start/due/end distinctions, old/new activity values and the import
timeout's retry guidance and possible causes. Aligned duplicate completion text.
Added token, value-direction and state checks. Wording remains low confidence
pending fluent-speaker review; browser checks remain unrun. Placeholder counts
are unchanged.

## Akan status and count corrections (batch 50)

Corrected 23 mixed-language or misleading status, count and permission labels.
Preserved stopped/completed migration distinctions, read-assigned-only scope,
compact timing uncertainty, count notation and batch bounds. WIP groups now
names groups rather than enabling a limit. Added source-token, unit and scope
checks. Wording remains low confidence pending fluent-speaker review; browser
checks remain unrun. English-placeholder counts are unchanged.

## Akan movement and ordering corrections (batch 51)

Corrected 25 mixed-language movement, ordering and guidance labels. Preserved
up/down, left/right and top/bottom directions, own-list versus specified-list
scope, oldest-first sorting and recurring time tokens. Restored Google Cloud
menu labels from the English source. Added token, direction and scope checks.
Wording remains low confidence pending fluent-speaker review; browser and live
provider-console checks remain unrun. Placeholder counts are unchanged.

## Akan account and connection corrections (batch 52)

Corrected 15 mixed-language or misleading account, watch and connection messages.
Fixed OAuth guidance to state that the local setting overrides the environment
value, rather than follows it, while preserving server-only secret storage and
never-shown wording. Added token, precedence and account-state checks. Wording
remains low confidence pending fluent-speaker review; browser checks remain
unrun. English-placeholder counts are unchanged.

## Akan display and attachment corrections (batch 53)

Corrected 23 mixed-language display, background, attachment and role labels.
Aligned the Normal role label with its assigned-only description. Preserved
pixel units, automatic width, assigned-only visibility and the private-page
message's conditional wording and HTML link. Aligned equivalent background/view
labels. Added token, markup and action checks. Wording remains low confidence
pending fluent-speaker review; browser checks remain unrun. Placeholder counts
are unchanged.

## Akan view and customization corrections (batch 54)

Corrected 25 mixed-language view, attachment and customization messages. Aligned
matching view titles and preserved private-only board visibility, visible-only
card loading, combined attachment/avatar scope and assetlinks.json. Added token,
label-consistency and scope checks. Wording remains low confidence pending
fluent-speaker review; browser checks remain unrun. Placeholder counts unchanged.

## Akan results and scheduling corrections (batch 55)

Corrected 26 mixed-language search-result, missing-data and scheduling messages.
Preserved result/count tokens, missing-only restoration, scheduled versus executed
outcomes and distinct pause/resume/start actions. Retained the source's coming-soon
placeholder meaning. Added token, count and state checks. Wording remains low
confidence pending fluent-speaker review; browser checks remain unrun.
English-placeholder counts are unchanged.

## Akan activity and assignment corrections (batch 56)

Corrected 25 mixed-language activity, assignment, avatar and job messages.
Preserved label-add/remove direction, assigned-only scope, activity placeholders
and ongoing migration status. Aligned duplicate activity and avatar labels and
used the corrected Normal role name. Added token, direction and scope checks.
Wording remains low confidence pending fluent-speaker review; browser checks
remain unrun. English-placeholder counts are unchanged.

## Akan checklist and activity corrections (batch 57)

Corrected 21 mixed-language checklist, activity and avatar labels. Preserved
add/remove directions, numeric label shortcuts, completion-triggered sound and
its default-off state, plus avatar size units. Added token, state and action
checks. Wording remains low confidence pending fluent-speaker review; browser
checks remain unrun. English-placeholder counts are unchanged.

## Akan conversion and authorization corrections (batch 58)

Corrected 14 mixed-language conversion, import and authorization messages.
Preserved JSON/CSV/TSV formats, administrator versus member requirements, denial
of permission and the domain-conflict prefix. Aligned duplicate-list labels and
kept orphaned-card and broken-card repair distinct. Added token, format and
requirement checks. Wording remains low confidence pending fluent-speaker review;
browser checks remain unrun. English-placeholder counts are unchanged.

## Akan rule-fragment and history corrections (batch 59)

Corrected 18 malformed or mixed-language rule fragments, permissions and history
states. Preserved move-to/from direction, restrictions on editing others' comments,
inactive/pending states and Google Cloud ID. Aligned equivalent rule and rename
labels. Added token, direction and restriction checks. Wording remains low
confidence pending fluent-speaker review; browser checks remain unrun.
English-placeholder counts are unchanged.

## Akan voting and invitation corrections (batch 60)

Corrected 12 mixed-language voting, invitation and endpoint messages. Aligned
invitation subjects, preserved inviter tokens and leave/delete confirmations,
and translated the source's AWS blank-endpoint versus compatible-provider URL
instructions. Added token, subject and provider-name checks. Wording remains
low confidence pending fluent-speaker review; browser and live provider-console
checks remain unrun. English-placeholder counts are unchanged.

## Akan prompts and font-sample corrections (batch 61)

Corrected 10 mixed-language prompts, membership settings and display values.
Preserved same-organization/team restrictions, password repetition, font-preview
digits and card-fading behavior. The font sample translates the source sentence;
it is not claimed to be an Akan pangram. Vocabulary references: [fox](https://learnakandictionary.com/english-twi/fox/)
and [brown color wording](https://ghanasky.com/akan-twi-dictionary-translator/).
Added token, scope and digit checks. Wording remains low confidence pending
fluent-speaker review; browser checks remain unrun. Placeholder counts unchanged.

## Akan template and swimlane corrections (batch 62)

Corrected 18 mixed-language template, subtask and swimlane labels. Preserved
multiple-card copying, below-position insertion, resize lock/unlock meaning and
distinct card/list/board templates. Aligned template-container titles. Added token,
target and direction checks. Wording remains low confidence pending fluent-speaker
review; browser checks remain unrun. English-placeholder counts are unchanged.

## Akan navigation and swimlane corrections (batch 63)

Corrected 18 mixed-language navigation, detail and swimlane messages. Aligned
move/copy/detail titles, Home and All Boards references and the close-dialog
shortcut. Preserved the home-removal confirmation's explicit no-deletion meaning.
Added token, scope and label-consistency checks. Wording remains low confidence
pending fluent-speaker review; browser checks remain unrun. Placeholder counts
are unchanged.

## Akan migration-label corrections (batch 64)

Corrected 14 mixed-language migration and summary labels. Preserved error/warning,
paused/started/resumed and not-needed distinctions, as well as comprehensive scope.
Added token, state and terminology checks. Technical wording remains low confidence
pending fluent-speaker review; browser checks remain unrun. Placeholder counts
are unchanged.

## Akan action and account-label corrections (batch 65)

Corrected 17 mixed-language account, action and timing labels. Restored Meteor's
name and preserved trigger/action distinctions, this-week due filtering and
spent-versus-remaining time. Aligned account-creation titles. Added token, product
and meaning checks. Technical wording remains low confidence pending fluent-speaker
review; browser checks remain unrun. English-placeholder counts are unchanged.

## Somali Scrum planning and reports — 2026-10-07

Filled 84 English placeholders in `so`, covering sprint planning, lifecycle,
completion policies, report limitations and daily observations. Existing Somali
translations remain unchanged. The regression suite covers all 102 Scrum/view
messages, including the 18 translated earlier, and verifies source tokens,
distinct lifecycle states, unknown versus zero estimates, partial visibility,
the first UTC observation, omitted days, the 366-observation limit and the
separate report export controls. Export references use the existing `Soo saar`
label; swimlane wording follows the existing `Waddo` vocabulary.

Terminology reference: [qiyaas in Wiktionary](https://en.wiktionary.org/wiki/qiyaas).
The Somali civics textbook's [work-planning chapter](https://files.ethiopialearning.com/textbooks/Grade%2008/Grade_8_Subject_CIVICS_Chapter_8_Language_SOMALI_Retrieved_20150101.pdf)
provides usage of `qorshe shaqo`. Sprint is rendered descriptively as a work cycle;
Scrum and Planning Poker remain recognizable method names. Technical compounds,
especially snapshot, increment and retrospective, remain low-confidence drafts
pending fluent-speaker review. Automated checks establish structure and selected
semantic distinctions, not fluency. Browser checks were not run.

## Somali Sync conflicts, previews and reports — 2026-10-07

Filled 63 English placeholders in `so`. Existing translations are preserved.
Conflict wording distinguishes keeping local content from removing its Sync
mapping, retaining subcards, replacement-card reuse and review-only scope.
Preview and diagnostic messages preserve omitted source data, the two separate
100-entry/path limits, 20-run retention over 30 days, full-list permissions and
reports that cannot resume or undo work. Jira hints preserve `null`, the
missing-versus-explicit-null distinction, hours and exactly one matching field.
Archive wording follows the existing `U gudbi kaydka` label.

Four new regression tests cover these distinctions and source placeholders.
Together with the Somali Scrum checks and all-catalog structural check, eight
tests pass; 21 human-preference checks pass. Browser checks were not run.
Technical compounds for mappings, parser output and source baselines remain
low-confidence drafts pending fluent-speaker review. No external translation
service was used. The all-language backlog and wording audit remain open.

## Somali rule editing and notification recovery — 2026-10-07

Filled 46 English placeholders covering the block rule editor, SMTP failure
categories and activity-notification recovery. Existing Somali values remain
unchanged. Tests preserve exactly one trigger/action, administrator permission,
reload-before-save, temporary versus permanent SMTP rejection, unconfirmed
versus failed delivery, retained pending work, no activity recreation and
cancellation that cannot recall already queued mail or delivered notifications.
Pause, resume and cancel remain distinct actions.

Three new regression tests pass alongside the earlier Somali suites and the
234-catalog key-order/placeholder check (11 tests total); 21 human-preference
checks pass. Browser checks were not run. Technical terms for recovery metadata,
delivery reservations and rule blocks remain low-confidence drafts pending
fluent-speaker review. The remaining Somali English-placeholder queue consists
of Blockly messages; the broader language and wording audit remains open.

## Somali Blockly editing, colours and control flow — 2026-10-07

Filled 61 English placeholders in `so`. Existing translations, keyboard keycaps
and platform names remain unchanged. Regression checks preserve Blockly argument
inventories, variable-deletion restrictions, deletion counts, enabled/disabled
controls, separate RGB channels, the 0–100 channel range and 0.0–1.0 blend ratio.
Control-flow checks distinguish exiting a loop from continuing the next iteration,
while-true from until-true, and the final conditional fallback.

The Somali and Blockly suites plus the 234-catalog structural gate pass (51 tests),
as do 21 human-preference checks. Browser checks were not run. Programming terms
for variables, functions, loops and the block backpack remain low-confidence
drafts pending fluent-speaker review. This batch does not complete Blockly or
the all-language audit.

## Somali Blockly lists — 2026-10-07

Translated 75 English list messages: 73 counted placeholders and two short
fragments (`to #` and `as`) omitted by the placeholder counter. Existing Somali
translations remain unchanged. Regression checks cover every list key, allowing
source-empty suffixes, help URLs and index symbols to remain unchanged. They
preserve argument inventories, empty-list results, missing-item results, first
and last indexing, get/remove/get-and-remove distinctions, insertion versus
replacement, copies, sort direction and text/list conversion direction.

All 53 focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Programming vocabulary for indexing, delimiters
and sorting remains low confidence pending fluent-speaker review. The broader
language audit continues; placeholder counts alone omit some untranslated prose.

## Somali Blockly logic and functions — 2026-10-07

Translated 50 English values: 47 counted placeholders and three short labels
(`or` and two function-definition `to` labels) excluded by the counter. The
technical literal `null`, help URLs, numeric hues and empty suffixes remain
unchanged. Existing Somali translations are preserved. Regression checks cover
all logic and function messages, source tokens, strict versus inclusive
comparisons, AND/OR and negation truth conditions, ternary label references,
output versus no output, disabled definitions and duplicate parameters.

All 56 focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Function and parameter vocabulary remains
low-confidence technical wording pending fluent-speaker review. This batch
leaves the remaining Blockly and all-language audit work open.

## Somali Blockly text operations — 2026-10-07

Filled 55 English placeholders while preserving existing Somali translations.
Checks cover every text-operation key, source token inventories, first/last and
from-end indexing, missing-text results, empty text, lengths including spaces,
replacement of all occurrences, copies, case conversion, trim direction and
numeric versus text prompts. Shared list/text length and item labels agree.
Help URLs, numeric hues and source-empty suffixes remain unchanged.

All 58 focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Programming vocabulary and case-conversion wording
remain low-confidence drafts pending fluent-speaker review. Remaining Blockly
families and the all-language wording audit are still open.

## Somali Blockly variables and workspace controls — 2026-10-07

Filled 45 English placeholders without changing existing Somali translations.
Checks preserve variable names, duplicate-type and parameter warnings, getter
versus setter labels, undo/redo distinctions, zero/one/many workspace counts,
comment-fragment spacing, search result arguments and Enter/Shift+Enter/Escape
navigation. Shared default item labels agree with text operations.

All 60 focused translation/structural tests and 21 human-preference checks pass.
Browser and screen-reader checks were not run. Technical wording for variable
types, parameters, block stacks and focus remains low confidence pending
fluent-speaker review. Remaining Blockly messages and the broader audit remain
open.

## Somali Blockly navigation and accessibility — 2026-10-07

Filled 45 English placeholders for keyboard navigation and shortcut descriptions.
Existing Somali translations are preserved. Tests retain shortcut placeholders,
movement versus scrolling, four directions, start/finish/abort distinctions,
next/previous headings and stacks, top/bottom targets and move acceptance.
Duplicate controls share their existing label and screen-reader mode explicitly
supports both enabling and disabling.

All 61 focused translation/structural tests and 21 human-preference checks pass.
Browser and screen-reader checks were not run. Wording for focus, block stacks,
tooltips and spoken announcements remains low confidence pending fluent-speaker
review. Remaining Blockly and all-language audit work stays open.

## Somali Blockly inputs and bitmap fields — 2026-10-07

Translated 61 English values: 60 counted placeholders and the short bitmap `on`
label omitted by the counter. Existing Somali translations remain unchanged.
Tests cover every input and field label, source token inventories, row/column
positions, pixel on/off states, first/second operands, dividend/divisor roles,
x/y coordinates, min/max distinctions and shared start/end and repeat labels.

All 63 focused translation/structural tests and 21 human-preference checks pass.
Browser and screen-reader checks were not run. Mathematical and accessibility
vocabulary, especially coordinates and bitmap descriptions, remains low
confidence pending fluent-speaker review. Remaining Blockly messages and the
broader language audit stay open.

## Somali Blockly remaining controls and announcements — 2026-10-07

Filled 26 English placeholders for expand/open/close controls, icons, inline and
external inputs, minimap navigation, parent announcements and screen-reader
mode. Existing translations are unchanged. Tests preserve tokens, open versus
close states, enabled/disabled announcements and their opposite actions, the
absence of a parent, and shared conditional labels.

All 64 focused translation/structural tests and 21 human-preference checks pass.
Browser and screen-reader checks were not run. Accessibility and parent-block
wording remains low confidence pending fluent-speaker review. The remaining
counted Somali entries are mathematical messages, keyboard names, platform
names and technical literals; their presence does not establish which should
be translated. The broader all-language audit remains open.

## Somali Blockly mathematics — 2026-10-07

Filled 86 English placeholders, preserving existing translations, formula names,
constants and source tokens. Regression checks distinguish inclusive integer
bounds from the exclusive floating upper bound, degree inputs from radians,
quotient from remainder, mean/median/mode, rounding direction and sign negation.
They preserve the atan2 coordinate order and -180–180 range and all constant
approximations.

Terminology reference: [Planwise Somali STEM dataset](https://huggingface.co/datasets/planwise-data/somali-stem-dataset)
for prime number, logarithm, median, standard deviation and trigonometric names.
This is a provisional terminology source, not independent fluency validation.
Mathematical compounds remain low confidence pending fluent-speaker review.
All 66 focused translation/structural tests and 21 human-preference checks pass.
Browser and screen-reader checks were not run. The 28 remaining counted Somali
entries appear to be keycaps, platform names and technical literals; the broader
catalog wording audit and all-language task are not complete.

## Northern Sotho rule editing and notification recovery — 2026-10-07

Filled 46 English placeholders in `nso` without changing existing translations.
Wording follows the catalog's Poto, Melao, Imeile and Ditsebišo terminology.
Vocabulary reference: [Sepedi terminology from Onke Solutions](https://www.onkesolutions.com/sepedi/)
for confirmation and notification verbs. Technical compounds for triggers,
delivery reservations and recovery metadata remain low-confidence drafts pending
fluent-speaker review.

Two focused tests and the structural check across 234 non-English catalogs pass,
as do 21 human-preference checks. Tests preserve rule constraints, temporary
versus permanent rejection, uncertain delivery, retained pending work, no
activity recreation and cancellation without recall of queued/delivered messages.
Browser checks were not run. The remaining language and wording audit stays open.

## Northern Sotho Sync conflicts and previews — 2026-10-07

Filled 43 English placeholders without changing existing translations. Checks
preserve source token inventories, keeping local values versus source values,
removing only duplicate mappings, retaining card content and subcards,
replacement reuse and review-only scope. Preview/source reports share labels
and preserve the 100-entry/path limits and hidden source-object values.

The two new tests, earlier Northern Sotho recovery tests and the structural
check across 234 non-English catalogs pass (five tests total), as do 21
human-preference checks. Browser checks were not run. Technical compounds for
synchronization, mappings, parsers and source baselines remain low confidence
pending fluent-speaker review. Remaining language work stays open.

## Northern Sotho Sync reports and estimates — 2026-10-07

Filled the remaining 20 English Sync placeholders, preserving existing values.
Tests now check tokens and non-English prose throughout the Sync family. New
semantic checks preserve 20-run/30-day retention, partial changes after failure,
reports that cannot resume or undo work, full-list write permissions, server
availability, hours, exactly one matching field and missing versus explicit
null source values. Jira and null remain technical literals.

Seven focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Technical compounds for diagnostics and mapped
estimate fields remain low confidence pending fluent-speaker review. Remaining
feature families and the all-language wording audit stay open.

## Northern Sotho Scrum planning and reports — 2026-10-07

Filled 84 English placeholders without changing existing translations. Tests
cover all 102 Scrum and related view messages, including 18 earlier translations,
and preserve source tokens, shared labels, distinct lifecycle states,
unfinished-card movement, cancellation membership, partial reports, unknown
versus zero estimates, first UTC observations, omitted days and the 366 limit.
Export instructions use the existing Romela label and distinguish the section
control from the toolbar control.

Ten focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Sprint is described as a work cycle; Scrum and
Planning Poker remain method names. Technical compounds for snapshots,
retrospectives, increments and scope remain low confidence pending fluent-speaker
review. The remaining Blockly and all-language wording audit stays open.

## Northern Sotho Blockly text operations — 2026-10-07

Filled 55 English placeholders without changing existing translations. Tests
cover all text-operation tokens, indexing and missing-text results, empty text,
lengths including spaces, replacement of every occurrence, case conversion,
trim direction and numeric versus text prompts. Replacement wording puts the
replacement argument before the original, retaining their numbered identities.
Help URLs, numeric hues and source-empty suffixes remain unchanged.

All 49 focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Programming vocabulary for variables, indexes,
substrings and case conversion remains low confidence pending fluent-speaker
review. The remaining language and wording audit stays open.

## Northern Sotho Blockly logic — 2026-10-07

Translated 26 English values: 25 counted placeholders and the short `or` label
omitted by the counter. Existing translations, null, help URLs and numeric hues
remain unchanged. Checks preserve source tokens, true/false and negation,
AND/OR truth conditions, strict versus inclusive comparisons and references to
the three ternary labels.

All 50 focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Programming terminology remains low confidence
pending fluent-speaker review. The wider language and wording audit stays open.

## Northern Sotho Blockly functions — 2026-10-07

Translated 24 English values: 22 counted placeholders and two function-definition
labels omitted by the counter. Existing translations, help URLs, numeric hues
and source-empty suffixes are preserved. Checks cover every function key,
argument tokens, shared definition labels, output versus no output, disabled
definitions, duplicate parameters and function-only conditional returns.

All 51 focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Technical vocabulary for functions and parameters
remains low confidence pending fluent-speaker review. The broader language and
wording audit stays open.

## Northern Sotho Blockly control flow — 2026-10-07

Translated 33 English values: 26 counted placeholders and seven short if/do
labels omitted by the counter. Existing translations and help URLs remain
unchanged. Tests cover every control-flow key, source tokens, loop exit versus
continuation, while-true versus until-true, the final conditional fallback,
counting arguments and shared conditional/loop labels.

All 52 focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Programming vocabulary for loops, variables and
conditions remains low confidence pending fluent-speaker review. The remaining
language and wording audit stays open.

## Northern Sotho Blockly variables — 2026-10-07

Filled 22 English placeholders without changing existing translations. Checks
preserve every variable-message token, deletion counts, function-definition
restrictions, rename-all scope, conflicting types and parameter names, getter
versus setter controls and distinct colour/number/text types. The default item
name matches the text-operation label.

All 53 focused translation/structural tests and 21 human-preference checks pass.
Browser checks were not run. Variable and parameter terminology remains low
confidence pending fluent-speaker review. Remaining Blockly and all-language
wording work stays open.

## Northern Sotho Blockly lists — 2026-10-07

Translated 75 English values: 73 counted placeholders and two short to/as
fragments omitted by the counter. Existing translations are preserved. Checks
cover list tokens, empty and missing results, retrieval versus removal,
insertion versus replacement, copies, sort direction and text/list conversion.

The 53 focused translation tests and 21 human-preference checks pass. Two
all-catalog structural checks fail because concurrent work added the English
key `shortcut-edit-due-date` before adding it to the other catalogs; this batch
does not alter that work. Browser checks were not run. List/index terminology
remains low confidence pending fluent-speaker review. The broader audit is open.

## Northern Sotho Blockly workspace — 2026-10-07

Filled 23 English placeholders without changing existing translations. Tests
preserve source tokens, zero/one/many block counts, comment-fragment spacing,
search result arguments, Enter/Shift+Enter/Escape navigation and distinct
copy/cut/paste and undo/redo actions.

The 54 focused checks and 21 human-preference checks pass. Two all-catalog
structural checks still fail on the concurrently added `shortcut-edit-due-date`
key missing from other catalogs. Browser and screen-reader checks were not run.
Workspace-stack and focus terminology remains low confidence pending fluent-
speaker review. The broader language and wording audit stays open.

## Northern Sotho Blockly colours and navigation — 2026-10-07

Filled 59 English placeholders, preserving existing translations. Checks retain
source tokens, distinct RGB channels, the 0–100 channel range, 0.0–1.0 blend
ratio, four directions, movement versus scrolling, move confirmation and
start/finish/abort distinctions. Screen-reader mode includes both on and off.

The 55 focused checks and 21 human-preference checks pass. Two all-catalog
structural checks still fail on the concurrent `shortcut-edit-due-date` addition.
Browser and screen-reader checks were not run. Colour and navigation terminology
remains low confidence pending fluent-speaker review. The broader audit is open.

## Northern Sotho Blockly inputs and bitmap fields — 2026-10-07

Translated 61 English values: 60 counted placeholders and the short on label
omitted by the counter. Existing translations remain unchanged. Tests preserve
all input/field tokens, row/column arguments, pixel states, operand roles,
first/second inputs, coordinates and shared endpoint/repeat labels.
Coordinate terminology follows the dihlomathišo usage in
[Twinkl's Sepedi coordinate worksheet](https://www.twinkl.co.za/resource/winter-olympics-coordinates-worksheets-sepedi-za-m-1753884301).

The 56 focused checks and 21 human-preference checks pass. Two all-catalog
structural checks still fail on the concurrent `shortcut-edit-due-date` addition.
Browser and screen-reader checks were not run. Mathematical and accessibility
wording remains low confidence pending fluent-speaker review. The broader audit
stays open.

## Northern Sotho Blockly editing and accessibility — 2026-10-08

Filled 46 English placeholders for block editing, backpack actions, icon
controls, screen-reader announcements and zoom. Existing translations remain
unchanged. Regression coverage preserves every source token, deletion counts,
missing-parent negation, open/close and enable/disable distinctions, and the
opposite actions offered by enabled/disabled screen-reader announcements.

All 59 focused checks and 21 human-preference checks pass. The earlier
all-catalog key mismatch has been resolved. Browser and screen-reader checks
were not run. Backpack, parent-block and accessibility wording remains low
confidence pending fluent-speaker review. The broader language audit stays open.

## Northern Sotho Blockly mathematics — 2026-10-08

Filled 86 English placeholders for arithmetic, number predicates, list
statistics, rounding, constants and trigonometric accessible labels/tooltips.
Formula abbreviations, URLs, symbols and hue values remain literal. Existing
translations are preserved. Tests retain source tokens, numerical constants,
random interval endpoints, degree/radian distinctions, operand order, signs
and distinct statistical and rounding operations.

Vocabulary uses skwerute, lokaritimi, palohlokakatišani and matlapalo from the
[Multilingual Mathematics Dictionary](https://www.roekeloos.co.za/meertalige-wiskundewoordeboek-multilingual-mathematics-dictionary/).
Palogare and the median paraphrase follow the
[Department of Basic Education's Sepedi assessment guide](https://www.education.gov.za/Portals/0/Documents/Manuals/Diagnostic%20Assesment%20Books/Mathematics%20Books/Grade%203/Book%201/MATHEMATICS%20GRADE%2003%20SEPEDI%20BOOK%201.pdf?ver=2020-03-09-190712-000).
These sources support individual terms, not full-sentence fluency. Standard
deviation, golden ratio and trigonometric loan spellings remain low confidence
and require fluent-speaker review. Browser and screen-reader checks were not run.

The focused combined run passed 59 checks, with two catalog-structure failures
because some locales lack the concurrent shortcut-edit-due-date source key.
Human-preference verification passed 20 checks; its actual-merge check failed
on that same catalog key mismatch. The broader language audit remains open.

## Māori Scrum and synchronization — 2026-10-08

Filled 147 English placeholders: 84 Scrum planning/reporting messages and 63
Sync conflict, preview, report and estimate-mapping messages. Existing Māori
translations are preserved. Sprint wording follows the catalog's wā mahi poto,
and synchronization uses its existing tukutahi and papā vocabulary. Pūrongo is
attested in [Te Aka Māori Dictionary](https://maoridictionary.co.nz/word/6307).
Technical compounds for snapshots, scope, mapping and parser behavior remain
provisional and need fluent-speaker review.

Seven focused checks pass, covering all 102 Scrum keys and all Sync keys with
source-token inventories, shared labels, cancellation membership, unknown
estimates, daily sampling, distinct export actions, local-data preservation,
read-only diagnostics, retention periods and missing-versus-null semantics.
All 21 human-preference checks pass. The shared catalog-completeness check
still fails because some locales lack shortcut-edit-due-date. Browser and
screen-reader checks were not run. The broader language audit remains open.

## Māori activity recovery and rule editing — 2026-10-08

Filled 46 English placeholders for rule blocks, mail failure categories and
activity-notification recovery. Existing translations are preserved. The
confirmation wording follows the catalog's whakaū and the corresponding
[Te Aka dictionary entry](https://maoridictionary.co.nz/search?keywords=whakau).
Notification, mail and rule vocabulary also follows existing Māori values.
Worker reservations, recovery metadata and receipt terminology remain
provisional pending fluent-speaker review.

Nine focused Māori checks and all 21 human-preference checks pass. Regression
coverage preserves source tokens, the one-trigger/one-action constraint,
administrator permissions, stale-rule reload, uncertain versus failed delivery,
no activity recreation, retained work and irreversible cancellation without
recalling queued mail. The shared catalog completeness check still fails on
missing shortcut-edit-due-date keys in other locales. Browser and screen-reader
checks were not run. The broader language and wording audit remains open.

## Māori Blockly text operations — 2026-10-08

Filled 55 English placeholders for text creation, searching, replacement,
case changes, character positions, prompts and trimming. Existing translations
are preserved. Pūmatua, pūriki and āputa follow the
[Paekupu literacy glossary](https://paekupu.co.nz/words/wordlist/te-reo-matatini/english-to-maori).
These terms support the vocabulary, not full-sentence fluency. Index,
substring and variable wording remains provisional pending speaker review.

The combined focused run passes 47 checks, including all 11 Māori checks.
Two shared catalog checks still fail because other locales lack the
shortcut-edit-due-date source key. All 21 human-preference checks pass.
Regression coverage preserves tokens, search operands and failure return,
replacement arguments, all-occurrence semantics, case distinctions, trim
directions and number/text prompts. Browser and screen-reader checks were
not run. The broader language and wording audit remains open.

## Māori Blockly logic and functions — 2026-10-08

Translated 50 English values: 47 counted placeholders and three short labels
omitted by the counter (or and the two function-definition titles). Existing
translations remain unchanged. Taumahi and tāuru follow the
[Paekupu computing glossary](https://media.paekupu.co.nz/words/wordlist/hangarau/maori-to-english).
Full-sentence wording and technical parameter/statement terms remain
provisional pending fluent-speaker review.

The combined focused run passes 49 checks, including all 13 Māori checks.
Two shared catalog checks still fail on the missing shortcut-edit-due-date key
in other locales. All 21 human-preference checks pass. Tests preserve source
tokens, true/false negation, inclusive/exclusive comparisons, both-versus-one
conditions, ternary label references, return/no-return distinctions, disabled
function warnings and matching definition labels. Browser and screen-reader
checks were not run. The broader language and wording audit remains open.

## Māori Blockly controls and variables — 2026-10-08

Translated 55 English values: 48 counted placeholders and seven short control
labels omitted by the counter. Existing translations remain unchanged.
Koromeke follows the [Paekupu computing glossary](https://www.paekupu.co.nz/words/wordlist/hangarau/maori-to-english/),
and [taurangi](https://media.paekupu.co.nz/word/taurangi) follows its mathematics
entry. Compound loop and variable warnings remain provisional pending fluent
review. The regression found an initially missed variable-deletion warning;
that warning is now translated too.

The combined focused run passes 51 checks, including all 15 Māori checks.
Two shared catalog checks still fail on missing shortcut-edit-due-date keys
in other locales. All 21 human-preference checks pass. Coverage preserves
source tokens, loop bounds, while/until truth states, break/continue actions,
branch order, shared do labels, variable types, deletion counts and function
parameter warnings. Browser and screen-reader checks were not run. The broader
language and wording audit remains open.

## Māori Blockly list operations — 2026-10-08

Translated 75 English values: 73 counted placeholders plus the short to-number
and as labels omitted by the counter. Existing translations remain unchanged.
List and text terminology follows the catalog; kōmaka is also attested in
[CORE Education's digital-readiness glossary](https://core-ed.org/en_NZ/free-resources/kia-takatu-a-matihiko-digital-readiness/glossary/).
Index, sub-list and delimiter wording remains provisional pending fluent review.

The combined focused run passes 53 checks, including all 17 Māori checks.
Two shared catalog checks still fail on missing shortcut-edit-due-date keys
in other locales. All 21 human-preference checks pass. Coverage preserves
source tokens, empty-list length, search failure return, first/last positions,
get/remove/get-and-remove distinctions, repeated item/count arguments, copy
semantics, sort direction and text/list conversion with separators. Browser
and screen-reader checks were not run. The broader language audit remains open.

## Māori Blockly workspace, colours and navigation — 2026-10-08

Filled 82 English placeholders for workspace counts, search, editing shortcuts,
colour controls and keyboard navigation. Existing translations remain unchanged.
The translations preserve stack/comment counts, Enter/Shift+Enter/Escape search
instructions, RGB channels and numeric ranges, move-versus-scroll distinctions,
move confirmation and start/finish/abort actions. Search labels distinguish
next and previous matches and retain the no-match message.

The combined focused run passes 55 checks, including all 19 Māori checks.
Two shared catalog checks still fail on missing shortcut-edit-due-date keys
in other locales. All 21 human-preference checks pass. Browser and screen-reader
checks were not run. Workspace, stack and accessibility compounds remain
provisional pending fluent-speaker review. The broader language audit is open.

## Māori Blockly inputs and bitmap fields — 2026-10-08

Translated 61 English values: 60 counted placeholders and the short on label
omitted by the counter. Existing translations remain unchanged. Dividend and
divisor follow the [Paekupu mathematics glossary](https://media.paekupu.co.nz/words/wordlist/p%C4%81ngarau/english-to-maori),
and coordinates follow its [ordered-pair entry](https://media.paekupu.co.nz/word/takirua-raupapa).
Full-sentence accessibility and technical compounds remain provisional pending
fluent-speaker review.

The combined focused run passes 56 checks, including all 20 Māori checks.
Two shared catalog checks still fail on missing shortcut-edit-due-date keys
in other locales. All 21 human-preference checks pass. Coverage preserves
source tokens, bitmap row/column arguments, pixel states, operand roles,
first/second inputs, coordinates and shared endpoint/repeat labels. Browser
and screen-reader checks were not run. The broader language audit remains open.

## Māori Blockly editing and accessibility — 2026-10-08

Filled 46 English placeholders for block editing, backpack operations, icon
controls, zoom and screen-reader announcements. Existing translations remain
unchanged. Empty backpack explicitly removes all contents; it differs from
removing a single block. Tests preserve source tokens, deletion counts,
missing-parent negation, open/close and enable/disable distinctions, and the
opposite actions offered by enabled/disabled screen-reader announcements.

The combined focused run passes 57 checks, including all 21 Māori checks.
Two shared catalog checks still fail on missing shortcut-edit-due-date keys
in other locales. All 21 human-preference checks pass. Browser and screen-reader
checks were not run. Backpack, parent-block and accessibility wording remains
provisional pending fluent-speaker review. The broader language audit is open.

## Māori Blockly mathematics — 2026-10-08

Filled 86 English placeholders for arithmetic, statistics, number predicates,
rounding, constants and trigonometry. Existing translations remain unchanged.
Vocabulary follows the [Paekupu mathematics glossary](https://media.paekupu.co.nz/words/wordlist/p%C4%81ngarau/english-to-maori)
and [geometry glossary](https://paekupu.co.nz/topic/ahuahanga/english-to-maori),
including ine mahora, pūtakerua, pūkōaro, aho, whenu and pātapa. Natural logarithm
is described as base-e logarithm; radians retain the unit identifier rad.
Golden-ratio and compound tooltip wording remains provisional pending fluent
review; dictionary terms do not establish full-sentence accuracy.

The combined focused run passes 59 checks, including all 23 Māori checks.
Two shared catalog checks still fail on missing shortcut-edit-due-date keys
in other locales. All 21 human-preference checks pass. Coverage preserves
source tokens, formula literals, random interval endpoints, degree/radian
contrasts, operand order, signs and distinct statistical/rounding operations.
Browser and screen-reader checks were not run. The broader language audit
remains open.

## Tok Pisin activity recovery and rule editing — 2026-10-08

Filled 46 English placeholders for rule blocks, mail failures and activity
notification recovery. Corrected two English-seeded labels, rules and r-trigger,
which previously merely prefixed Rules and Trigger with Toksave:. Other existing
translations remain unchanged. Message and sending vocabulary follows the
[Tok Pisin dictionary's tok entry](https://tokpisin.info/tok/) and
[salim entry](https://tokpisin.info/salim/). Technical worker reservations,
metadata, mail authentication and permanent-failure wording remain low confidence
pending fluent-speaker review. Other English-prefixed seed values still need audit.

Two focused checks and all 21 human-preference checks pass. Coverage preserves
source tokens, the one-trigger/one-action rule, administrator permissions,
stale-rule reload, uncertain versus failed delivery, no activity recreation,
retained work and irreversible cancellation without recalling queued mail.
The shared catalog-completeness check still fails on missing shortcut-edit-due-date
keys in other locales. Browser and screen-reader checks were not run. The broader
language and wording audit remains open.

## Tok Pisin synchronization — 2026-10-08

Filled 63 English placeholders for Sync conflicts, previews, source-field
reports, retained runs, recovery diagnostics and estimate mappings. Existing
translations remain unchanged. Wording follows the catalog's Sink, sos, bokis
and skelim terms. Parser behavior is paraphrased as a data-reading process.
Mapping, normalization, retention and partial-run wording remains low confidence
pending fluent-speaker review.

Six focused checks and all 21 human-preference checks pass. Tests cover all
Sync source-token inventories, shared labels, no source writes, retained local
content, unchanged subcards, replacement reuse, full-list permissions, retention
periods and missing-versus-explicit-null behavior. The shared catalog-completeness
check still fails on missing shortcut-edit-due-date keys in other locales.
Browser and screen-reader checks were not run. The broader language and wording
audit remains open.

## Tok Pisin Scrum planning and reports — 2026-10-08

Filled 84 English placeholders for Scrum roles, settings, sprint actions,
backlog views and reporting. Existing translations remain unchanged. Sprint,
kat, bot, skelim and history wording follows the existing catalog. Backlog,
scope, snapshot and completion-policy descriptions remain low confidence
pending fluent-speaker review.

Nine focused Tok Pisin checks and all 21 human-preference checks pass. Scrum
coverage includes all 102 keys, exact source tokens, shared labels, distinct
states/actions, cancelled sprint membership, unfinished-card destinations,
unknown-versus-zero estimates, matching units/policies, daily sampling limits
and section-versus-toolbar export actions. The shared catalog-completeness
check still fails on missing shortcut-edit-due-date keys in other locales.
Browser and screen-reader checks were not run. The broader language and
wording audit remains open.

## Tok Pisin Blockly text operations — 2026-10-08

Filled 55 English placeholders for text creation, search, replacement, letter
case, character positions, prompts and trimming. Existing translations remain
unchanged. Left/right wording uses han kais and han sut, attested in the
[dictionary's kais entry](https://www.tokpisin.info/category/tok-pisin-to-english/k/)
and [sut entry](https://www.tokpisin.info/sut/). Variable, index and substring
wording remains low confidence pending fluent-speaker review.

The combined focused run passes 47 checks, including all 11 Tok Pisin checks.
Two shared catalog checks still fail on missing shortcut-edit-due-date keys
in other locales. All 21 human-preference checks pass. Coverage preserves
source tokens, search operands and failure return, replacement arguments,
all-occurrence semantics, case distinctions, trim directions and number/text
prompts. Browser and screen-reader checks were not run. The broader language
and wording audit remains open.

## Tok Pisin Blockly logic and functions — 2026-10-08

Translated 50 English values: 47 counted placeholders and three short labels
omitted by the counter. Existing translations remain unchanged. Function
behavior is described as a named work operation. Technical input/parameter
loans and function-definition wording remain low confidence pending fluent
speaker review.

The combined focused run passes 49 checks, including all 13 Tok Pisin checks.
Two shared catalog checks still fail on missing shortcut-edit-due-date keys
in other locales. All 21 human-preference checks pass. Coverage preserves
source tokens, true/false negation, strict/inclusive comparisons, both-versus-one
conditions, ternary label references, return/no-return distinctions, disabled
function warnings and matching definition labels. Browser and screen-reader
checks were not run. The broader language and wording audit remains open.

## Tok Pisin loop controls

Translated 33 Blockly loop and conditional messages, including seven short labels excluded by the placeholder counter. Preserved source placeholders and distinguished while/until truth conditions, break/continue behavior, counted loops and conditional branches. Technical wording is provisional and needs fluent-speaker review; browser and screen-reader checks were not run.

Validation: 50 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Remaining inventory: 43,207 English placeholders across 70 languages, with 149 source keys pending review.

## Tok Pisin list operations

Translated 75 Blockly list messages, including two short labels excluded by the placeholder counter. Preserved source placeholders, index directions, empty-list behavior, copy semantics, sorting and split/join behavior. Tests distinguish fetching, removing and fetching with removal, as well as insertion and replacement. Existing correct-language values remain unchanged. Technical wording, including random selection, remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 52 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Remaining inventory: 43,134 English placeholders across 70 languages, with 149 source keys pending review.

## Tok Pisin variables, colours and workspace navigation

Translated 68 Blockly messages for variable creation and deletion, colour selection and mixing, keyboard navigation, workspace announcements and search. Preserved source placeholders, comment-fragment spacing, colour ranges and keyboard names. Tests cover variable definition safeguards, input assignment, navigation modifiers and next/previous search. Existing correct-language values remain unchanged. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 54 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Remaining inventory: 43,066 English placeholders across 70 languages, with 149 source keys pending review.

## Tok Pisin input and bitmap-field labels

Translated 61 Blockly input and field labels, including the short pixel-on label excluded by the placeholder counter. Preserved source placeholders and distinguished pixel states, rows and columns, start/end positions, minimum/maximum, dividend/divisor, split/join and append/replace. Existing correct-language values remain unchanged. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 55 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Remaining inventory: 43,006 English placeholders across 70 languages, with 149 source keys pending review.

## Tok Pisin editing commands and accessibility shortcuts

Translated 82 Blockly editing, backpack, warning, navigation and screen-reader messages. Preserved source placeholders and distinguished deletion scope, copy/paste direction, enabling/disabling, opening/closing and directional shortcuts. Existing correct-language values remain unchanged. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 57 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Remaining inventory: 42,924 English placeholders across 70 languages, with 149 source keys pending review.

## Tok Pisin maths messages

Translated 86 Blockly maths messages. Preserved source placeholders, mathematical symbols, constant values, operand order, inclusive/exclusive limits and degree/radian distinctions. Tests cover aggregation types, signs, rounding and logarithm bases. Existing correct-language values remain unchanged. Searches for Tok Pisin mathematical terminology did not establish standard terms for advanced operations. Loan spellings and paraphrases for trigonometry, logarithms, roots, prime numbers, golden ratio and standard deviation are low confidence and require fluent-speaker review; these checks do not establish linguistic correctness. Browser and screen-reader checks were not run.

Validation: 59 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Remaining inventory: 42,838 English placeholders across 70 languages, with 149 source keys pending review.

## Tok Pisin common interface wording audit

Corrected 83 mixed-language values containing the `Toksave:` prefix followed by English, covering basic interface labels, file metadata, filtering, selection states, invitations, previews and time units. These were not correct-language human translations. Existing correct-language values remain unchanged. The initial prefix scan found 500 values; 417 remain for review after this batch. This is only one detector: values without the prefix also require language review. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 61 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. The English-placeholder counter remains 42,838 across 70 languages because prefixed English was already excluded by that counter; it does not prove language completeness. There are 149 source keys pending review.

## Tok Pisin rule and scheduling wording audit

Corrected 74 mixed-language values containing the `Toksave:` prefix, covering rules, recurrence, due-date reminders, checklist actions, weekdays, scheduled jobs and backup frequency. Preserved placeholder inventories and numeric intervals; distinguished due dates from end dates and pause/resume/start states. Existing correct-language values remain unchanged. The prefix inventory falls from 417 to 343; unprefixed values also need review. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 63 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin storage and migration wording audit

Corrected 56 mixed-language values containing the `Toksave:` prefix, covering storage, attachment repair, avatars, backup scope and migration controls. Preserved placeholder inventories and units; distinguished source/destination, pausing/stopping, paused/stopped and resume actions. Existing correct-language values remain unchanged. The prefix inventory falls from 343 to 287; unprefixed values also need review. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 65 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin reporting and monitoring wording audit

Corrected 41 mixed-language values containing the `Toksave:` prefix, covering reports, office and API history, recovery events, CPU and memory usage, queues and operation monitoring. Preserved source placeholders and technical identifiers; distinguished first/last events and concurrent-operation limits. Existing correct-language values remain unchanged. The prefix inventory falls from 287 to 246; unprefixed values also need review. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 67 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin system and connection wording audit

Corrected 48 mixed-language values containing the `Toksave:` prefix, covering runtime and OS information, memory metrics, SMTP, webhooks, custom HTML/JSON and cloud connections. Preserved source placeholders, product names, configuration identifiers and region examples; distinguished free/total/used memory, webhook directions and access/secret keys. Existing correct-language values remain unchanged. The prefix inventory falls from 246 to 198; unprefixed values also need review. Technical loan words and metric descriptions remain low confidence pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 69 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin card, account and ticket wording audit

Corrected 57 mixed-language values containing the `Toksave:` prefix, covering card dependencies, locations, ticket states, accounts, authentication labels and lockout timing. Preserved source placeholders, including `%{value}`, and distinguished login/logout, ticket states and coordinate directions. Existing correct-language values remain unchanged. The prefix inventory falls from 198 to 141; unprefixed values also need review. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 71 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin general controls wording audit

Corrected 68 mixed-language values containing the `Toksave:` prefix, covering general controls, support, accessibility, loading indicators, work limits and storage summaries. Preserved source placeholders, units and technical identifiers; distinguished pause/stop, collapse/expand and single-run scope. Existing correct-language values remain unchanged. The prefix inventory falls from 141 to 73; unprefixed values also need review. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 73 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin search keyword wording audit

Corrected 21 mixed-language search keywords containing the `Toksave:` prefix. Source inspection in `config/query-classes.js` confirms translated operators are parser inputs restricted to letters, combining marks and apostrophes. Replacement operators use single words and do not collide with other registered Tok Pisin operators. Query keywords such as `diu`, `taimlus` and `tripelamun` are provisional compact forms, not validated standard terminology; fluent-speaker review remains required. Other pre-existing multiword operator translations still require a separate syntax audit. Existing correct-language values remain unchanged. The prefix inventory falls from 73 to 52; unprefixed values also need review. Browser and screen-reader checks were not run.

Validation: 75 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin colour wording audit

Corrected all 25 colour labels containing the `Toksave:` prefix. Basic terms blak, blu, grin, ret, wait and yelo are supported by the [Tok Pisin dictionary colour entries](https://www.tokpisin.info/tag/colours-kala-tok-pisin/). Less common shades use distinct descriptive phrases; these approximations are low confidence and need fluent-speaker and visual review. Tests preserve source tokens and distinguish the 25 labels, but cannot prove perceptual colour accuracy. Existing correct-language values remain unchanged. The prefix inventory falls from 52 to 27; unprefixed values also need review. Browser and screen-reader checks were not run.

Validation: 76 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin analytics wording audit

Corrected the remaining 27 values containing the `Toksave:` English-seeding prefix, covering flow analytics, forecast explanations and time adjustments. Preserved source tokens, trial counts, UTC days, forecast bounds, missing-history caveats and start/end fallback descriptions. Existing correct-language values remain unchanged. No values retain that prefix; this only completes the prefix-specific cleanup, not the language audit. Unprefixed values, search syntax and low-confidence terminology still require review. Statistical descriptions remain provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 78 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin search help wording audit

Corrected 40 unprefixed mixed-language search instructions and error messages. Preserved source placeholders and syntax metavariables; translated prose and sample list names, repaired the due-date example closing backtick and aligned the negated due-date example with the translated keywords. Tests distinguish AND/OR, negation, descending sort, positive integer limits, case handling and archive defaults. Already coherent nearby messages remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run. Existing multiword query operators still require syntax review.

Validation: 80 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin account and invitation wording audit

Corrected 34 unprefixed mixed-language account, invitation, email-template and validation messages, including the mistranslated optional username hint. Preserved all source tokens and restored email paragraph breaks. Tests distinguish reset/verification instructions, successful/failed invitations, password mismatch, minimum username length and required/optional inputs. Existing coherent nearby translations remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 82 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin file-handling wording audit

Corrected 25 unprefixed mixed-language attachment, transfer-limit and storage-setting messages. Preserved all source tokens, units and product identifiers. Tests distinguish upload/download direction, successful/failed saving, positive limits and database-location repair. Existing coherent deletion warnings remain unchanged. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 84 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin import wording audit

Corrected 29 mixed-language import instructions, archive errors and member-mapping messages. Restored literal schema names such as `title` and `cards` that had been translated inside examples, preserved source tokens and added the missing plain-bulleted-Markdown behavior. Tests cover schema literals, file-count versus file-size failures, unsafe paths, unmapped members and selected import/export parts. The prefix regression allows the genuine Tok Pisin notice in `import-members-map-note`; a translated notice is not an English seed. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 86 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin export wording audit

Corrected 17 mixed-language export options and related external import instructions. Preserved placeholders, Excel naming and distinctions among people/date fields and disk-space failures. Restored the Jira path `GET /rest/api/2/search` and actual Trello menu names; retained the WeKan export label in its instruction. Tests cover these literals and conditional attachment download behavior. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 88 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin deletion and restoration wording audit

Corrected 24 mixed-language deletion confirmations, linked-item restrictions and restoration messages. Preserved source tokens and database field identifiers. Tests cover irreversible-action warnings, archive alternatives, duplicate-list conjunctions, member restrictions and failed-restoration counts. Existing coherent nearby warnings remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 90 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin custom-field wording audit

Corrected 13 mixed-language or mistranslated custom-field messages, including the multi-select label that used planting vocabulary. Preserved source placeholders, positional order and HTML space entities. Tests cover deletion scope, multiple selection, Enter-key instructions and setting/unsetting values. Existing coherent nearby labels remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 92 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin notification wording audit

Corrected 10 mixed-language notification subscription hints, read/unread actions, due reminders and mention messages. Preserved all source tokens. Tests distinguish participant/watcher scope, read/unread/removal actions and approaching/current/overdue reminders. Existing coherent notification settings remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 93 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin checklist and subtask wording audit

Corrected 18 mixed-language or misleading checklist and subtask messages, including the automatic-reset off label and sound default. Preserved source tokens and counters. Tests distinguish completion filters, collapse/expand, original line order, disabled defaults and board/list destinations. Existing coherent nearby translations remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 95 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin role and membership wording audit

Corrected 19 mixed-language role descriptions, membership restrictions and account activation labels. Preserved all source tokens. Tests cover read-only/comment-only restrictions, normal-role settings restrictions, assigned-card visibility, global-admin rights, unsaved role previews and activation directions. Existing coherent nearby translations remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 97 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin date and time wording audit

Corrected 19 mixed-language or ambiguous date/time messages, including distinct due-date and end-date edit labels. Preserved source tokens and date-format literals. Tests cover hour units, received-date changes, old/new timestamp direction, total spent time and week-start selection. Existing coherent reminders remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 99 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin movement and copy wording audit

Corrected 24 mixed-language or incomplete copy, movement and conversion messages. Preserved source tokens and JSON field names while translating sample values. Tests parse the JSON example and verify directions, selected-item scope, absent source data and optional move reasons. Existing coherent nearby translations remain unchanged. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 101 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. These corrections do not reduce the English-placeholder counter, which excludes mixed-language values differing from English.

## Tok Pisin rule-builder wording audit

Corrected 32 mixed-language rule-builder labels, trigger descriptions and rule import/export instructions. Preserved source tokens and external format/product names. Tests distinguish added/removed and archived/restored triggers, import/export directions and limitations on Butler and visual-workflow imports. Existing coherent nearby translations remain unchanged. Technical wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 103 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Mixed-language values require this wording audit independently of the English-placeholder counter.

## Tok Pisin rule-action wording audit

Corrected 25 mixed-language rule actions and conditions, including two short English prepositions excluded from the placeholder inventory. Preserved all source tokens. Tests distinguish top/bottom positions, current versus specified lists, checking/unchecking all items, daily schedules and before/after timing. Existing coherent nearby translations remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 105 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Mixed-language values require this wording audit independently of the English-placeholder counter.

## Tok Pisin error wording audit

Corrected 22 mixed-language errors and empty-state messages. Preserved source tokens, format identifiers and example values. Tests cover missing objects, authorization and self-invitation restrictions, year/domain validation, filename cancellation, linked-card restrictions and re-export recovery instructions. Existing coherent nearby errors remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 107 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Mixed-language values require this wording audit independently of the English-placeholder counter.

## Tok Pisin visibility and sharing wording audit

Corrected 18 mixed-language or misleading visibility and template-sharing messages. The private label no longer implies access for only one person. Preserved source tokens and login-link markup. Tests distinguish public visibility from member-only editing, private board membership, default-description fallback and shared-template scope. Existing coherent nearby translations remain unchanged. Wording remains provisional pending fluent-speaker review; browser and screen-reader checks were not run.

Validation: 109 tests passed; two existing catalog-wide tests still fail because catalogs lack `shortcut-edit-due-date`. Human-preference checks: 21 passed. Mixed-language values require this wording audit independently of the English-placeholder counter.

## Tok Pisin filter and sorting wording audit

Corrected 34 mixed-language or misleading filter and sorting values. The labels
now distinguish assigned work, empty lists, archived lists and selected cards.
Restored the literal alphabetical endpoints A and Z: the earlier wording had
translated A as “wanpela” (one). Source tokens remain unchanged. Technical wording
is provisional pending fluent-speaker review.

The combined translation run passes 111 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin label and compact-card wording audit

Corrected 18 mixed-language values for labels, multiple selection, compact-card
settings, API file-size limits and added teams or organizations. Label shortcuts
now distinguish toggling one card from adding or removing labels on multiple
cards; the deletion warning retains both irreversibility and loss of history.
Source tokens are preserved. Wording is provisional pending fluent-speaker review.

The combined translation run passes 113 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin help and migration wording audit

Corrected 25 mixed-language help messages, including advanced filtering, imports,
backup scope, migration confirmations and recovery warnings. Filter examples and
shell commands remain unchanged; menu references match the translated controls.
Checks retain organization-only restore scope, archived-item distinctions and
irreversibility warnings. Technical wording remains provisional pending speaker
review.

The combined translation run passes 116 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin administration and privacy wording audit

Corrected 16 mixed-language or incorrect administration descriptions. The account
anonymization confirmation previously repeated export help; it now explains
permanent replacement of identity, removal of the avatar, disabled login and
preserved history. Restored literal CARDS_LOADING options and identity examples.
Checks retain storage-operation ordering, deletion warnings and code-display
behavior. Technical wording remains provisional pending fluent-speaker review.

The combined translation run passes 118 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin access, imports and due-date wording audit

Corrected 29 mixed-language values for access limits, imports, card searching,
due dates and administrative controls. Checks preserve organization-admin limits,
non-destructive enabling of deletion, literal hostnames and environment settings,
Excel column identifiers and due-date distinctions. The search help and its
“My cards” control now agree. Technical wording remains provisional pending
fluent-speaker review.

The combined translation run passes 120 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
The English-placeholder report still counts 42,838 values across 70 languages;
it excludes most mixed-language corrections. Browser and screen-reader checks
were not run. The wider audit remains open.

## Tok Pisin controls and reporting wording audit

Corrected 22 mixed-language control, reporting, support and account-status
messages. Checks preserve the image-size template token, API configuration
literal, report aggregation scope, available location information and the
difference between no locked accounts and a locked account. Technical wording
remains provisional pending fluent-speaker review.

The combined translation run passes 122 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin S3 and Sandstorm wording audit

Corrected 38 English or mixed-language storage strings. Restored literal
files/attachments and files/avatars paths in migration help, retained AWS menu
labels and hostname examples, and clarified that hiding a member in WeKan does
not revoke Sandstorm access. Tests cover secret-key requirements, single-display
warnings and enabled/disabled states. Technical wording remains provisional
pending fluent-speaker review.

The combined translation run passes 124 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
The counted English-placeholder inventory remains 42,838 across 70 languages;
that report excludes pending source keys and mixed-language corrections.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin Azure and Google Cloud wording audit

Corrected 26 mixed-language cloud-storage settings and instructions. External
Azure and Google Cloud console labels and the client_email JSON key remain
literal. Checks distinguish optional credentials, keeping saved secrets, file
versus pasted-JSON input, read/write permissions and connection outcomes.
Technical wording remains provisional pending fluent-speaker review.

The combined translation run passes 126 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin layout, loading and maintenance wording audit

Corrected 21 mixed-language labels and instructions for layout, card loading,
filesystem storage, backups and maintenance. Checks preserve enable/disable
opposites, experimental partial-loading limitations, accurate counters, reload
instructions and maintenance continuing after the browser closes. Technical
wording remains provisional pending fluent-speaker review.

The combined translation run passes 128 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin policy and scheduling wording audit

Corrected 18 mixed-language permission, scheduling, keyboard and import/export
messages. Checks preserve editing shortcut conditions, activity placeholders,
server-side import/export restrictions, board cloning and single-attachment
scope, and avatar-only exclusions that keep names and other data. Technical
wording remains provisional pending fluent-speaker review.

The combined translation run passes 130 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin customization wording audit

Corrected 16 mixed-language customization labels. Checks preserve HTML insertion
boundaries, assetlinks.json, logo placement and default height, and distinguish
creating, editing and deleting custom translations. Technical wording remains
provisional pending fluent-speaker review.

The combined translation run passes 132 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin diagnostics and storage status wording audit

Corrected 21 English or mixed-language diagnostic and storage messages. Checks
preserve batch and CPU limits, success/failure distinctions, connection-error
tokens and file/avatar repair scope. Technical descriptions of heap contexts
are low confidence and need fluent-speaker review, as does the wider wording.

The combined translation run passes 134 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin migration and repair workflow wording audit

Corrected 36 mixed-language migration and repair messages. Restored the literal
Snap database setting name, previously translated inside the command. Checks
preserve database URLs, environment variables, excluded file/avatar data,
restart ordering, numeric delay limits and repair scope. Technical wording
remains provisional pending fluent-speaker review.

The combined translation run passes 136 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin backup and scheduled-job wording audit

Corrected 19 mixed-language backup and scheduled-job messages. Checks distinguish
missing-only restoration from replacing all data, retain monthly limits and
selection prerequisites, and distinguish paused and failed jobs. Technical
wording remains provisional pending fluent-speaker review.

The combined translation run passes 138 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin navigation and display wording audit

Corrected 19 mixed-language navigation and display messages. Checks preserve
assigned-only visibility, comment-only versus read-only permissions, toggle
behavior, assignment order and matching view/popup titles. Technical wording
remains provisional pending fluent-speaker review.

The combined translation run passes 140 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin location and selection wording audit

Corrected 13 mixed-language location, role and selection labels. Checks preserve
location success/failure distinctions, reading versus commenting on assigned
cards, Enter key references and consistent color-picker titles. Wording remains
provisional pending fluent-speaker review.

The combined translation run passes 142 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin confirmations and connection help wording audit

Corrected 18 mixed-language confirmations and connection-help messages. Checks
preserve affected objects, single versus all-user unlocking, board placeholders,
optional authentication tokens, SMTP/TLS labels and PDF download fallback.
Wording remains provisional pending fluent-speaker review.

The combined translation run passes 144 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin remaining file and card controls wording audit

Corrected 40 mixed-language file, card, display and maintenance controls. Checks
preserve signed-in visibility markup, workspace and database placeholders,
list-wide operations, CSV/TSV distinctions and database-copy exclusions. Technical
wording remains provisional pending fluent-speaker review.

The combined translation run passes 146 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin form and card-aging wording audit

Corrected 19 mixed-language or misleading form and display labels. The account
anonymization label incorrectly described importing users; it now refers to the
account. Checks preserve three fading levels, idle-day conditions, worker-role
limits and new-card versus all-card scope. Wording remains provisional pending
fluent-speaker review.

The combined translation run passes 148 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin import controls wording audit

Corrected 21 mixed-language import controls and progress messages. Checks
preserve file extensions, the external Trello attachment tool name, API-key URL,
optional input, member mapping deferred until later and minimum board selection.
Wording remains provisional pending fluent-speaker review.

The combined translation run passes 150 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin account lockout wording audit

Corrected 15 mixed-language account and lockout labels. Checks distinguish
existing users with wrong passwords from nonexistent usernames, preserve failure
threshold wording and single/all-user scope, and retain the OTP identifier.
Wording remains provisional pending fluent-speaker review.

The combined translation run passes 152 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin migration controls and monitoring wording audit

Corrected 29 mixed-language migration and monitoring labels. Checks preserve
storage destinations, administrator-only permissions, completed versus remaining
work, forced scanning and export versus refresh failures. Technical wording
remains provisional pending fluent-speaker review.

The combined translation run passes 154 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin scheduling and time-label wording audit

Corrected 16 mixed-language scheduling, time-summary and display labels. Checks
preserve scheduling-failure scope, upcoming functionality, time spent versus
time remaining, and checklist visibility actions. Wording remains provisional
pending fluent-speaker review.

The combined translation run passes 156 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin privacy and support controls wording audit

Corrected 15 mixed-language privacy, support and favorite controls. Checks
preserve import/export directions, adding versus removing favorites, board versus
page targets, tenant-wide settings and automatic loading for large boards.
Wording remains provisional pending fluent-speaker review.

The combined translation run passes 158 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin remaining rule-control wording audit

Corrected 16 English or mixed-language rule labels. Checks distinguish complete
from incomplete, weekly from monthly schedules, selection from checkmarks, and
preserve the import-count placeholder and symbolic N-day duration. Wording
remains provisional pending fluent-speaker review.

The combined translation run passes 160 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin avatar and repository wording audit

Corrected 15 mixed-language or misleading avatar, repository and interface
labels. WIP Limit Groups previously described enabling a limit; it now names
groups. Checks preserve consistent avatar controls, editing versus enabling
limits, and the sign-in prerequisite for uploads. Technical wording remains
provisional pending fluent-speaker review.

The combined translation run passes 162 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin organization and background labels wording audit

Corrected eight mixed-language organization, team and board-background labels.
Checks preserve member-propagation direction, authentication-provider sync scope,
source tokens and matching labels for equivalent actions. Wording remains
provisional pending fluent-speaker review.

The combined translation run passes 163 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin history and notification wording audit

Corrected six mixed-language descriptions and status messages. Checks distinguish
disabling activity recording from suppressing notifications while retaining
recording, preserve avatar-export exclusions and default-off settings, and retain
the minimum-administrator requirement. Wording remains provisional pending
fluent-speaker review.

The combined translation run passes 164 checks. Two existing catalog checks fail
on the missing due-date shortcut key. All 21 human-preference checks pass.
Browser and screen-reader checks were not run. The wider audit remains open.

## Tok Pisin shortcut wording and key inventory audit

Corrected five mixed-language shortcut labels and added the missing due-date
shortcut translation. Tok Pisin now matches English's full key inventory and
order. Checks distinguish adding oneself as a member from taking an assignment,
and preserve the opened-card scope of due-date editing. Wording remains
provisional pending fluent-speaker review.

The combined translation run passes 165 checks. Two existing catalog checks
still fail on the missing due-date shortcut key in other locales. All 21
human-preference checks pass. Browser and screen-reader checks were not run.
The wider translation and wording audit remains open.

## Due-date shortcut inventory repair: 30 languages

Added the missing shortcut-edit-due-date translation to ar, bg, cs, da, de, el,
es, fi, fr, he, hr, hu, id, it, ja, ko, nb, nl, pl, pt, pt-BR, ro, ru, sk, sv,
tr, uk, vi, zh-CN and zh-TW. Each catalog now matches English's key inventory and
order. No existing translation values changed. Tests preserve source tokens and
check opened-card scope in representative scripts; they do not establish fluency.

The focused translation run passes 38 checks. Two existing catalog checks still
fail on the missing shortcut in other locales. All 21 human-preference checks
pass. Browser and screen-reader checks were not run. Remaining languages and the
broader wording audit remain open.

## Due-date shortcut inventory repair: 26 more languages

Added the missing shortcut-edit-due-date translation to af, be, bn, bs, ca, eu,
fa, gl, hi, is, km, lt, lv, mk, ml, mr, ms, pa, sl, sq, sr, sw, ta, th, tl and
ur. Each catalog now matches English's key inventory and order. Existing values
were preserved. Tests cover tokens and opened-card scope in representative
scripts, but do not establish fluency; wording remains subject to speaker review.

The focused translation run passes 39 checks. Two existing catalog checks still
fail on the missing shortcut in other locales. All 21 human-preference checks
pass. Browser and screen-reader checks were not run. Remaining languages and the
broader wording audit remain open.

## Due-date shortcut inventory repair: 14 additional locales

Added shortcut-edit-due-date to az, cy, en-GB, eo, et-EE, ga, gu-IN, hy, ka, kk,
mn, ne, te-IN and uz. British English intentionally retains the English wording.
Each catalog matches English's key inventory and order without changing existing
values. Checks cover tokens and opened-card scope in representative languages;
they do not establish fluency. Wording remains subject to speaker review.

The focused translation run passes 40 checks. Two existing catalog checks still
fail on the missing shortcut in other locales. All 21 human-preference checks
pass. Browser and screen-reader checks were not run. Remaining locales and the
broader wording audit remain open.

## Due-date shortcut inventory repair: 47 regional variants

Added the missing shortcut to regional variants of Arabic, Azerbaijani, Czech,
Welsh, German, Greek, English, Spanish, Persian, French, Hebrew, Hindi, Japanese,
Khmer, Korean, Malay, Dutch, Polish, Portuguese, Romanian, Russian, Ukrainian,
Uzbek, Vietnamese and Chinese. English variants retain English; Chinese variants
use their existing simplified/traditional script. Existing values were preserved.
Each affected catalog matches English's key inventory and order. Tests cover
source tokens and correspondence to the base-language translation.

The focused run passes 41 checks. Two existing catalog checks still fail on the
missing shortcut elsewhere. All 21 human-preference checks pass. Browser and
screen-reader checks were not run. Remaining locales and wording review stay open.

## Due-date shortcut inventory repair: 16 additional variant catalogs

Added shortcut-edit-due-date to af_ZA, ca@valencia, ca_ES, de_DE, en_AU, en_ID,
en_SG, en_TR, en_ZA, es_CO, pt_PT, sl_SI, cmn, zh, zh_SG and gl-ES, using the
corresponding language translation. Existing values were preserved. Each affected
catalog matches English's key inventory and order; English regional catalogs
intentionally retain English wording, including underscore-based locale names.

The focused run passes 42 checks. Two existing catalog checks still fail on the
missing shortcut elsewhere. All 21 human-preference checks pass. Browser and
screen-reader checks were not run. Remaining locales and wording review stay open.

## Due-date shortcut inventory repair: 14 more languages

Added shortcut-edit-due-date to am, ckb, ha, ht, kn, ku, ky, mg, my, ps, sd, si,
tg and yo. Existing values were preserved. Each affected catalog matches
English's key inventory and order. Tests cover source tokens and opened-card
scope in representative languages, but do not establish fluency. Translations
remain provisional pending speaker review.

The focused run passes 43 checks. Two existing catalog checks still fail on the
missing shortcut elsewhere. All 21 human-preference checks pass. Browser and
screen-reader checks were not run. Remaining locales and wording review stay open.

## Due-date shortcut inventory repair: seven additional catalogs

Added shortcut-edit-due-date to ary, fy, fy-NL, la, lb, mt and oc. Existing values
were preserved, and each catalog now matches English key inventory and order.
Opened-card wording draws on existing locale terminology and dictionary checks:
[Luxembourgish oppen](https://en.wiktionary.org/wiki/oppen),
[Maltese miftuħ](https://en.wiktionary.org/wiki/miftu%C4%A7), and
[Occitan dobrir/dobèrt](https://en.wiktionary.org/wiki/dobrir).
Wording is provisional; Occitan and Moroccan Arabic phrasing is low confidence
pending speaker review. Tests check tokens and scope, not fluency.

The focused run passes 44 checks. Two existing catalog checks still fail on the
missing shortcut elsewhere. All 21 human-preference checks pass. Browser and
screen-reader checks were not run. Remaining locales and wording review stay open.

### Missing due-date shortcut: Indic languages and Cantonese

Added the absent shortcut to Assamese, Odia, Bhojpuri, Maithili and Cantonese,
using existing card, open and due-date vocabulary. Existing translations are
preserved, and every catalog follows English source key order. Bhojpuri,
Maithili and Odia wording remains low confidence pending fluent review.
Tests check key order, placeholder inventories and opened-card scope; they do
not establish fluency. Browser and screen-reader checks were not run.

### Missing due-date shortcut: twenty additional languages

Added the missing shortcut in Aragonese, Asturian, Breton, Corsican, Faroese,
Friulian, Scottish Gaelic, Manx, Javanese, Romansh, Sardinian, Sicilian,
Turkmen, Tatar, Yiddish, Zulu, Xhosa, Somali, Igbo and Shona. Existing values
are preserved, with source key order and placeholder inventories checked.
Aragonese, Breton, Faroese, Friulian, Manx, Romansh, Sardinian and Igbo
wording is low confidence pending fluent review. Browser and screen-reader
checks were not run. Tests establish catalog structure, not fluency.

Vocabulary references: [Friulian vierte](https://en.wiktionary.org/wiki/vierte),
[Breton digor](https://fr.wiktionary.org/wiki/ouvert),
[Romansh avert](https://fr.wiktionary.org/wiki/avert) and
[Sardinian dictionary](https://www.limbasardasudsardigna.it/sar/images/Documenti/Didatica_e_Ainas/Vocabolariu_Sardu_Italianu_Spano.pdf).

### Missing due-date shortcut: twenty-three further locales

Added the shortcut in Bashkir, Buryat, Bislama, Fijian, Hawaiian, Konkani,
Cornish, Luganda, Māori, Northern Ndebele, Northern Sotho, Chichewa, Oromo,
Papiamento, Kirundi, Kinyarwanda, Samoan, Swati, Southern Sotho, Tswana,
Tigrinya, Uyghur and the South African Zulu variant. Existing translations
remain unchanged. Catalog key order, token inventories and representative
opened-card wording are covered. Buryat, Fijian, Konkani, Cornish, Kirundi,
Swati and Tigrinya wording is low confidence pending fluent review.
Browser and screen-reader checks were not run; structural tests do not prove
fluency. The wider translation audit remains incomplete.

Vocabulary reference: the [Cornish Language Partnership phrasebook](https://www.magakernow.org.uk/default_page-937.html) confirms `ygor` for open.

### Missing due-date shortcut: thirteen further languages

Added the shortcut in Akan, Bambara, Chuvash, Ewe, Guarani, Sakha,
Northern Sámi, Silesian, Tsonga, Venda, Wolof, Kashubian and Walloon.
Existing translations remain unchanged. Key order and token inventories are
checked together with representative opened-card wording. Chuvash, Ewe,
Sakha, Silesian, Kashubian and Walloon wording remains low confidence.
Browser, screen-reader and fluent-speaker checks were not run.

Vocabulary references: [Northern Sámi rabas](https://fr.wiktionary.org/wiki/rabas)
and [Wolof ubbeeku](https://jangileen.kalam-alami.net/dictionary/browse/O).
These support vocabulary choices, not validation of the complete sentences.

### Missing due-date shortcut: eleven languages and legacy tags

Added the shortcut in Tibetan, Dzongkha, Kashmiri, Quechua, Tongan, Upper
Sorbian, Venetian, Veps, Flemish, Waray and Wu Chinese. Legacy tags were
resolved against the language registry: ve-CC is Venetian, ve-PP is Veps,
vl-SS is Flemish and wa-RR is Waray. Existing translations remain unchanged;
wrong-language content elsewhere in these catalogs still needs correction.
All eleven additions except Flemish are low confidence pending fluent review.
Tests check source key order, tokens and representative opened-card wording,
including rejection of known wrong-language prefixes. Browser and
screen-reader checks were not run; tests do not establish linguistic fluency.

### Missing due-date shortcut: eight further languages

Added the shortcut in Acehnese, Aymara, Fulah, Greenlandic, Nahuatl,
Neapolitan, Volapük and Klingon. Existing values remain unchanged; source
key order and token inventories are checked. These additions are low
confidence pending fluent review. Tests check representative opened-card
wording, not grammatical fluency. Browser and screen-reader checks were not run.

Vocabulary references: [Acehnese thesaurus](https://fileserver-az.core.ac.uk/download/160609809.pdf),
[Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary),
[Klingon dictionary](https://klingonska.org/dict/). These support vocabulary,
not certification of the composed sentences.

### Final missing due-date shortcut entries

Added the shortcut in Cherokee, Inuktitut, Ladin, Aromanian, Tigre,
Arabic-script Uzbek, Wolaytta and Standard Moroccan Tamazight. All eight
are low confidence pending fluent review. Existing strings are preserved;
wrong-language strings elsewhere still need correction. Tests cover source
key order, placeholders, script and representative opened-card wording.
Browser and screen-reader checks were not run. Fluency is not established.

Vocabulary references: [Ladin davierta](https://en.wiktionary.org/wiki/davierta),
[Aromanian dishcljid](https://kaikki.org/dictionary/Aromanian/meaning/d/di/dishcljid.html),
[Wolaytta grammar and word list](https://external.dandelon.com/download/attachments/dandelon/ids/DE006004286393F16AF24C1257A3600455B73.pdf),
[Tamazight opening vocabulary](https://imassn.com/dictionnaire/mot/arzam-11398).

### Kurdish Blockly controls and colours

Translated 26 English placeholders covering collapsed blocks, variable deletion,
colour mixing and loop/conditional instructions. The placeholder-only merge
preserved existing translations. Tests compare source token inventories and key
order, and check loop restrictions and numeric colour ranges. Technical wording
for loops and collapsed blocks remains low confidence pending fluent review.
Browser and screen-reader checks were not run. Product names and mathematical
notation found in other locales were not changed merely to lower the count.

### Kurdish Blockly editing and accessibility instructions

Filled 54 further English placeholders for conditions, repetition, copy/delete,
block editing, bitmap fields, keyboard help and icon announcements. Existing
translations were preserved by the placeholder-only merge. Tests verify source
key order and token inventories, distinguish true/false loop conditions and
open/closed controls, and retain bitmap row/column placeholders. Technical
wording for inline inputs and bitmap controls remains low confidence.
Browser and screen-reader checks were not run; tests do not prove fluency.

### Kurdish Blockly input labels and keyboard navigation

Filled 57 English placeholders for list, number, text and statement input
labels, keyboard navigation and empty-list creation. The placeholder-only merge
preserved existing translations. Regression checks cover source tokens, key
order, distinct operands and list boundaries, and hold-key instructions.
Technical wording for statement positions, iteration and replacement remains
low confidence pending fluent review. Browser and screen-reader checks were
not run; structural checks do not establish fluency.

### Kurdish Blockly list operations

Filled 52 English placeholders for creating lists, retrieving and removing
items, sublists, indexing, repetition, reversal, insertion and sorting.
Existing translations are preserved. Tests check source tokens and key order,
distinguish retrieval from removal and replacement from insertion, and retain
copy semantics and the not-found sentinel. Index and sublist terminology
remains low confidence pending fluent review. Browser and screen-reader checks
were not run; tests do not establish fluency.

### Kurdish Blockly sorting and logic

Filled 29 English placeholders covering list sorting and splitting, comparisons,
Boolean logic and conditional values. Existing translations and the null literal
are preserved. Tests compare source tokens and key order, distinguish inclusive
comparisons and AND/OR behavior, and match tooltip field names to visible labels.
Technical wording for case-insensitive sorting remains low confidence pending
fluent review. Browser and screen-reader checks were not run.

### Kurdish Blockly arithmetic and statistics labels

Filled 40 English placeholders for arithmetic, constants, bounds, number tests,
remainders and list statistics. Existing translations and mathematical notation
are preserved. Tests check key order, placeholders, literal constants, degree
ranges, inclusive bounds and distinct operations. Technical terminology for
roots, prime numbers and standard deviation remains low confidence pending
fluent review. Browser and screen-reader checks were not run.

### Kurdish Blockly statistics, random values and unary math

Filled 39 English placeholders for statistical tooltips, random values, rounding,
absolute values, logarithms, negation and spoken trigonometric labels. Existing
translations and symbolic function names are preserved. Tests compare source
tokens and key order, verify inclusive/exclusive random bounds and distinguish
mode lists, negation and rounding directions. Statistical and trigonometric
terminology remains low confidence pending fluent review. Browser and
screen-reader checks were not run.

### Kurdish Blockly functions and variable controls

Filled 40 English placeholders for trigonometric tooltips, workspace controls,
variable creation and procedure definitions/calls. Existing translations are
preserved. Tests verify source tokens, key order, degree units, disabled-call
restrictions, function-only blocks and return-value distinctions. Parent-block
and procedure-output terminology remains low confidence pending fluent review.
Browser and screen-reader checks were not run.

### Kurdish Blockly keyboard shortcuts and announcements

Filled 44 English placeholders for variable renaming, screen-reader state,
keyboard navigation, movement, scrolling and announcements. The placeholder-only
merge preserved existing translations. Tests compare source tokens and key order,
and distinguish directions, movement lifecycle and accessibility mode toggles.
Keyboard-focus and block-stack terminology remains low confidence pending fluent
review. Browser and screen-reader checks were not run.

### Kurdish Blockly text operations

Filled 41 English placeholders for appending, case conversion, character and
substring selection, counting, searching, joining, length and prompts. Existing
translations are preserved. Tests compare source tokens and key order, retain
append direction and not-found results, and check spaces in length calculations.
Case-conversion and substring terminology remains low confidence pending fluent
review. Browser and screen-reader checks were not run.

### Kurdish Blockly replacement, variables and workspace messages

Filled 36 English placeholders for text replacement/trimming, variable controls,
workspace descriptions and search navigation. Existing translations are preserved.
Tests verify source tokens, key order, replacement direction, all-occurrence scope,
copy semantics, leading separator spaces and literal keyboard combinations.
Workspace-stack and search-focus terminology remains low confidence pending fluent
review. Browser and screen-reader checks were not run.

### Kurdish Blockly aliases and rule-editor messages

Filled 25 English placeholders for search results, zoom, repeated Blockly labels
and the rule editor. Existing translations were preserved. Tests verify source
tokens, key order, alias consistency, one-trigger/one-action restrictions,
administrator permission and reloading before saving a conflicting edit.
Trigger and zoom terminology remains low confidence pending fluent review.
Browser and screen-reader checks were not run.

### Kurdish Scrum settings and planning labels

Filled 36 English placeholders for board views, Scrum roles and settings,
estimates, completion policies, sprint controls and backlog help. Existing
translations are preserved. Tests check tokens and key order, distinguish
cancellation from completion and marked-complete from list-based completion,
and retain unfinished-work and planned/active sprint qualifications.
Scrum-role and increment terminology remains low confidence pending fluent
review. Browser and screen-reader checks were not run.

### Kurdish sprint report and event labels

Filled 35 English placeholders for sprint events, totals, estimates, lifecycle
states, workflow categories and import references. Existing translations are
preserved. Tests check key order, token inventories and distinct event and
lifecycle labels. Retrospective and swimlane terminology remains low confidence
pending fluent review. Browser and screen-reader checks were not run.

### Kurdish sprint report caveats and lifecycle confirmations

Filled 13 English placeholders for snapshots, report limitations, sprint close
and cancel confirmations, daily observations and incomplete imports. Existing
translations are preserved. Tests compare source tokens and key order, check
unknown-versus-zero estimates, UTC and missing days, the 366-observation limit,
partial visibility and lifecycle effects. Snapshot and observation terminology
remains low confidence pending fluent review. Browser and screen-reader checks
were not run.

### Kurdish Sync conflicts and preview labels

Filled 26 English placeholders for conflict resolution, duplicate mapping,
archival restrictions, replacement cards and preview actions. Existing text is
preserved. Tests check source tokens and key order, no source-system writes,
content preservation, unchanged subcards, replacement reuse and limited review
scope. Mapping and baseline terminology remains low confidence pending fluent
review. Browser and screen-reader checks were not run.

### Kurdish Sync omissions and run reports

Filled 23 English placeholders for preview limits, source omissions, conversion,
parser warnings and run history. Existing text is preserved. Tests check source
tokens and key order, 100-entry/path limits, 20-run/30-day retention, hidden
values and partial-change warnings. Parser, path and representation terminology
remains low confidence pending fluent review. Browser and screen-reader checks
were not run.

### Kurdish Sync diagnostics and mail failure labels

Filled 21 English placeholders for run outcomes, diagnostics, estimate mapping
and mail failures. Existing translations are preserved. Tests verify source
tokens and key order, full-list permissions, 30-day history, no resume/undo,
missing-versus-null values and review before retrying unconfirmed delivery.
Diagnostic and receipt terminology remains low confidence pending fluent review.
Browser and screen-reader checks were not run.

### Kurdish activity recovery and time estimates

Filled 26 English placeholders for mapped time estimates, pending activity
notifications, retry states and delivery controls. Existing text is preserved.
Tests check source tokens, key order, exactly-one-field requirements, missing
versus null values, no activity recreation and retention of pending work.
Reservation and recovery-metadata terminology remains low confidence pending
fluent review. Browser and screen-reader checks were not run.

### Kurdish final recovery messages and keyboard labels

Filled three recovery placeholders and eighteen Blockly keyboard labels.
Cancellation retains permanent/no-resume wording and the caveat that queued
email and delivered notifications are not recalled. Keyboard labels add Kurdish
descriptions while preserving physical key names; product names, null and
trigonometric notation remain unchanged. Tests verify key order, source tokens,
key-name recognition and cancellation caveats. Browser and screen-reader checks
were not run; fluency remains subject to review.

### Bhojpuri Blockly controls and colours

Filled 20 English placeholders for block controls, variable deletion and colour
selection/mixing. Existing translations are preserved. Tests compare source
tokens and key order, retain numeric colour ranges and the deletion prohibition,
and check representative Bhojpuri vocabulary. Variable/function terminology is
low confidence pending fluent review. Browser and screen-reader checks were not run.
A current check also found all 149 pending-Transifex keys already have non-English
values in Kurdish; that establishes coverage, not linguistic quality.

### Bhojpuri Blockly loops and conditions

Filled 24 English placeholders for loop flow, iteration, repetition and conditional
branches. Existing translations are preserved. Tests compare source tokens and key
order, retain loop-only restrictions, distinguish true/false conditions and check
the final fallback branch. Loop and iteration terminology remains low confidence
pending fluent review. Browser and screen-reader checks were not run.

### Bhojpuri Blockly editing and accessibility labels

Filled 39 English placeholders for copy/cut/delete, block states, bitmap fields,
keyboard help and icon labels. Existing translations are preserved. Tests compare
source tokens and key order, distinguish enabled/disabled and open/closed states,
and retain deletion counts, bitmap coordinates and help keys. Bitmap-column and
inline-input wording remains low confidence pending fluent review. Browser and
screen-reader checks were not run.

### Bhojpuri Blockly condition, list and number inputs

Filled 31 English placeholders for input labels, list boundaries, loop increments,
math operands and coordinates. Existing text is preserved. Tests compare source
tokens and key order, distinguish start/end positions and division operands,
and retain x/y coordinates. Delimiter and operand wording remains low confidence
pending fluent review. Browser and screen-reader checks were not run.

### Bhojpuri text inputs and keyboard navigation

Filled 30 English placeholders for text/number inputs, keyboard navigation and
empty-list creation. Existing translations are preserved. Tests compare source
tokens and key order, distinguish search from replacement and retain numeric
empty-list length. Statement-position terminology remains low confidence pending
fluent review. Browser and screen-reader checks were not run.

### Bhojpuri Blockly list retrieval and removal

Filled 30 English placeholders for list creation, item selection, retrieval,
removal and sublists. Existing translations are preserved. Tests compare source
tokens and key order, distinguish retrieval/removal/combined operations and
first/last positions. Sublist terminology remains low confidence pending fluent
review. Browser and screen-reader checks were not run.

### Bhojpuri list indexing, insertion and sorting

Filled 32 English placeholders for indexing, length, repetition, reversal,
insertion, replacement and sorting. Existing translations are preserved. Tests
compare source tokens and key order, distinguish insertion from replacement,
sort directions and text/list conversion. Index and case-insensitive sorting
terminology remains low confidence pending fluent review. Browser and
screen-reader checks were not run.

### Bhojpuri Blockly logic and comparisons

Filled 29 English placeholders for splitting/joining, Boolean values, comparisons,
negation and conditional expressions. Existing translations and the null literal
are preserved. Tests compare source tokens and key order, distinguish strict and
inclusive comparisons and AND/OR behavior, and ensure conditional tooltips use
the visible field labels. Delimiter and Boolean terminology remains low confidence
pending fluent review. Browser and screen-reader checks were not run.

### Bhojpuri Blockly arithmetic and number tests

Filled 28 English placeholders for arithmetic, constants, bounds, divisibility,
number types and remainders. Existing translations and formulas are preserved.
Tests compare source tokens and key order, retain numeric constants and coordinate
ranges, and distinguish number types and quotient/remainder operations. Inverse
trigonometry terminology remains low confidence pending fluent review. Browser
and screen-reader checks were not run.

### Bhojpuri statistics, random numbers and rounding

Filled 29 English placeholders for list statistics, random numbers, powers,
rounding and absolute values. Existing translations are preserved. Tests compare
source tokens and key order, distinguish statistical operations and rounding
directions, and retain random bounds. Statistical and rounding terminology remains
low confidence pending fluent review. Browser and screen-reader checks were not run.

### Bhojpuri logarithms and trigonometry

Filled 27 English placeholders for absolute values, powers, logarithms, roots,
negation and trigonometric descriptions. Existing translations and symbolic
function names are preserved. Tests compare source tokens and key order, retain
base 10 and e, and distinguish inverse functions and absolute value/negation.
Technical trigonometry terminology remains low confidence pending fluent review.
Browser and screen-reader checks were not run.

### Bhojpuri workspace and function controls

Filled 37 English placeholders for workspace navigation, variables, backpack actions,
and function definitions and calls. Existing translations and source placeholders
are preserved. Regression coverage checks the batch token inventories, return versus
no-return descriptions, named invocations, disabled definitions and function-only
return restrictions. Technical wording remains low confidence pending speaker review.
Browser and screen-reader checks were not run; the broader language audit continues.

### Bhojpuri navigation shortcuts and screen-reader controls

Filled 39 English placeholders for variable renaming, zoom reset, screen-reader
mode and navigation/editing shortcuts. Existing translations and source tokens are
preserved. Regression checks cover the batch token inventories, distinct movement
and scrolling directions, next/previous targets, and inverse screen-reader toggle
actions. Accessibility terminology remains low confidence pending speaker review.
Browser and screen-reader checks were not run; the broader audit continues.

### Bhojpuri text operations and variable controls

Filled 71 English placeholders for text extraction, joining, searching, replacement,
case conversion, trimming, input prompts, variable controls and remaining shortcut
actions. Existing translations and source token inventories are preserved. Regression
coverage includes first/last positions, whitespace counting, replacement argument
order, trim sides and number/text prompts. Technical wording remains low confidence
pending speaker review. Browser and screen-reader checks were not run; the broader
translation audit continues.

### Bhojpuri workspace search and block rule editor

Filled 59 English placeholders for keyboard names, workspace counts and search,
remaining shared block labels, and rule-editor messages. Keyboard names retain the
physical key inscriptions with Bhojpuri descriptions. Product names and mathematical
symbols remain unchanged. Existing translations and source placeholders are preserved.
Regression checks cover search shortcuts, count-fragment spacing, rule-state labels,
and administrator and single-trigger restrictions. Technical wording remains low
confidence pending speaker review. Browser and screen-reader checks were not run;
Scrum and other feature translations remain unfinished.

### Bhojpuri Scrum planning and sprint controls

Filled 74 English placeholders for Scrum settings, roles, work estimates, sprint
lifecycle controls, events and reports. Existing translations and source tokens are
preserved. Regression coverage checks key order, placeholder inventories, distinct
sprint states, shared navigation labels, minute units and unknown-versus-zero estimate
wording. Scrum terminology remains low confidence pending speaker review. Browser
checks were not run; remaining feature strings and the broader audit are unfinished.

### Bhojpuri daily observations and Sync conflicts

Filled 54 English placeholders for Scrum daily observations, import status, Sync
conflicts, preview and source omissions. Existing translations and source placeholders
are preserved. Regression checks cover token inventories, UTC references, observation
and path limits, shared labels, source-system non-writing and unchanged subcards.
Technical wording remains low confidence pending speaker review. Browser checks were
not run; remaining Sync and recovery translations and the broader audit continue.

### Bhojpuri Sync diagnostics and notification recovery

Filled 49 English placeholders for retained Sync reports, Jira estimate fields,
mail failures and activity notification recovery. Existing translations and source
tokens are preserved. Regression checks cover key order, placeholders, report retention,
explicit null handling, distinct delivery states and non-recreation guidance.
Technical wording remains low confidence pending speaker review. Browser checks were
not run; remaining recovery strings and the broader language audit continue.

### Bhojpuri final recovery controls and inventory check

Filled six remaining ordinary English placeholders for notification cancellation,
stale controls and rule-email recovery. Regression checks preserve source tokens and
the warnings that cancellation cannot resume or recall prior delivery. Existing
translations are preserved. Technical wording remains low confidence pending speaker
review; browser checks were not run.

The default Bhojpuri inventory now contains only 11 product names and mathematical
symbols, intentionally unchanged. None of the 149 pending-Transifex source keys
remain identical to English in this locale. This does not establish linguistic completeness:
the full language-quality audit and other locales remain unfinished.

### Central Kurdish Blockly colours and flow controls

Filled 39 English placeholders in Sorani for colour operations, block controls,
loops and conditional statements. Existing translations and source placeholders are
preserved. Regression coverage checks key order, script, tokens, colour bounds and
loop-control distinctions. Script checks do not establish fluency; technical wording
remains low confidence pending speaker review. Browser and right-to-left layout checks
were not run. Remaining Central Kurdish strings and the broader audit continue.

### Central Kurdish Blockly editing and accessibility

Filled 54 English placeholders for loop conditions, editing actions, deletion
confirmations, bitmap fields, input labels and accessibility announcements. Existing
translations and source tokens are preserved. Regression checks cover source key order,
script and token inventories, true/false conditions, opposite editing states and
variable-deletion references. Technical wording remains low confidence pending speaker
review. Browser, screen-reader and right-to-left layout checks were not run. The
remaining translation inventory and broader language audit are unfinished.

### Central Kurdish input labels and keyboard navigation

Filled 48 English placeholders for list, number, text and value input labels and
keyboard navigation instructions. Existing translations and source tokens are preserved.
Regression checks cover script and token inventories, dividend/divisor distinctions,
minimum/maximum, start/end positions, coordinates and copy/cut announcements. Technical
wording remains low confidence pending speaker review. Browser, screen-reader and
right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish list retrieval and removal

Filled 42 English placeholders for list construction, retrieval, removal, sublists,
search, emptiness and length. Existing translations and source placeholders are
preserved. Regression checks cover key order, script and token inventories, retrieval
versus removal wording, first/last occurrences and empty-list length. Technical wording
remains low confidence pending speaker review. Browser, screen-reader and right-to-left
layout checks were not run. Remaining strings and the broader audit continue.

### Central Kurdish list editing and comparisons

Filled 37 English placeholders for list repetition, insertion, replacement, sorting,
text/list conversion and initial Boolean comparisons. Existing translations and source
tokens are preserved. Regression checks cover key order, script and token inventories,
insertion versus replacement, copy semantics, sort direction and inclusive comparisons.
Technical wording remains low confidence pending speaker review. Browser, screen-reader
and right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish logic and arithmetic

Filled 35 English placeholders for comparisons, Boolean operations, conditional
values, arithmetic, constants and numeric bounds. Existing translations and source
tokens are preserved. Regression checks cover source order, script, placeholders,
referenced conditional labels, constant notation, coordinates and operator distinctions.
Technical wording remains low confidence pending speaker review. Browser, screen-reader
and right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish statistics and number tests

Filled 35 English placeholders for number tests, remainder, list statistics, random
numbers and rounding. Existing translations and source placeholders are preserved.
Regression coverage checks key order, script, token inventories, distinct statistical
operations, number polarity, rounding directions and exclusive random-fraction bounds.
Technical wording remains low confidence pending speaker review. Browser, screen-reader
and right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish logarithms and trigonometry

Filled 34 English placeholders for mathematical functions, accessible trigonometric
labels, workspace movement and typed variables. Existing translations, standard
mathematical symbols and source tokens are preserved. Regression checks cover key
order, script, token inventories, logarithm bases, direct/inverse functions and degree
rather than radian units. Technical wording remains low confidence pending speaker
review. Browser, screen-reader and right-to-left layout checks were not run. The
broader translation audit continues.

### Central Kurdish function and variable controls

Filled 37 English placeholders for functions, variables, backpack actions and
screen-reader controls. Existing translations and source tokens are preserved.
Regression checks cover key order, script, placeholder inventories, functions with
and without return values, named invocations and function-only return restrictions.
Technical wording remains low confidence pending speaker review. Browser, screen-reader
and right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish keyboard shortcuts

Filled 39 English placeholders for editing, focus, movement, scrolling and accessible
navigation shortcuts. Existing translations and source tokens are preserved. Regression
coverage checks key order, script, placeholder inventories, physical left/right directions,
next/previous targets and distinct move/focus actions. Technical wording remains low
confidence pending speaker review. Browser, screen-reader and right-to-left layout
checks were not run. The broader translation audit continues.

### Central Kurdish text operations

Filled 47 English placeholders for text joining, case conversion, character positions,
substrings, search, length, prompts and replacement. Existing translations and source
tokens are preserved. Regression checks cover key order, script, token inventories,
first/last distinctions, whitespace counting and replacement argument order. Technical
wording remains low confidence pending speaker review. Browser, screen-reader and
right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish workspace and variable messages

Filled 69 English placeholders for keyboard labels, text trimming, variables,
workspace search and counts, and shared block labels. Physical key inscriptions,
existing translations and source tokens are preserved. Regression checks cover key
order, script, placeholder inventories, search shortcuts, count-fragment spacing and
trim directions. Technical wording remains low confidence pending speaker review.
Browser, screen-reader and right-to-left layout checks were not run. The broader
translation audit continues.

### Central Kurdish rule editor and Scrum planning

Filled 49 English placeholders for rule-editor guidance, Scrum settings, roles,
estimates, backlog ordering and sprint controls. Existing translations and source
tokens are preserved. Regression checks cover key order, script, placeholders,
shared navigation labels, distinct sprint actions and single-trigger restrictions.
Technical wording remains low confidence pending speaker review. Browser and
right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish sprint reports and daily observations

Filled 44 English placeholders for sprint events, states, reports, import status and
daily observations. Existing translations and source placeholders are preserved.
Regression coverage checks source order, script, token inventories, UTC references,
the 366-observation limit, unknown-versus-zero wording and distinct sprint states.
Technical wording remains low confidence pending speaker review. Browser and
right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish Sync conflicts and preview

Filled 37 English placeholders for Sync conflicts, local-card preservation, preview
and source omissions. Existing translations and source tokens are preserved. Regression
checks cover source order, script, placeholders, source-system non-writing, unchanged
subcards, preview limits and shared labels. Technical wording remains low confidence
pending speaker review. Browser and right-to-left layout checks were not run. The
broader translation audit continues.

### Central Kurdish Sync diagnostics and mail failures

Filled 37 English placeholders for source omissions, retained Sync reports, estimate
mapping, mail failures and initial activity-recovery guidance. Existing translations
and source placeholders are preserved. Regression checks cover key order, script,
tokens, retention and path limits, explicit null handling and delivery distinctions.
Technical wording remains low confidence pending speaker review. Browser and
right-to-left layout checks were not run. The broader translation audit continues.

### Central Kurdish recovery controls

Filled 25 English placeholders for notification retry, pause, cancellation and
recovery states. Existing translations and source tokens are preserved. Regression
checks cover key order, script, placeholders, distinct delivery states and permanent
cancellation warnings. Technical wording remains low confidence pending speaker review.
Browser and right-to-left layout checks were not run. The broader audit continues.

The Central Kurdish default inventory now retains only 11 product names and mathematical
symbols. None of the 149 pending-Transifex source keys remain identical to English.
These counts do not establish fluency or completion of the broader language audit.

### Tatar Blockly controls and opening activity messages

Filled 24 English placeholders for block controls, colours and loop actions. Corrected
nine opening activity, membership and comment strings whose vocabulary and endings
were inconsistent with Tatar, including the previous title-change verb and reply labels.
Source placeholders and correct-language existing translations are preserved. Regression
checks cover key order, tokens, Tatar vocabulary, colour bounds and loop distinctions.
Technical wording remains low confidence pending speaker review. Script checks alone
are not a language audit. Browser checks were not run; further mixed-language entries
and English placeholders remain in this locale.

### Tatar loop and editing controls

Filled 33 English placeholders for loops, conditions, copy/cut and deletion actions.
Existing translations and source placeholders are preserved. Regression checks cover
key order, token inventories, true/false loop conditions, loop-only restrictions,
variable references and count parameters. Technical wording remains low confidence
pending speaker review. Browser checks were not run. Further Tatar mixed-language
corrections and English placeholders remain; the broader audit continues.

### Tatar editing and accessibility labels

Filled 37 English placeholders for block editing, bitmap controls, comments, warnings
and input labels. Existing translations and source tokens are preserved. Regression
checks cover key order, token inventories, opposite actions, bitmap row/column labels
and variable references. Technical wording remains low confidence pending speaker
review. Browser and screen-reader checks were not run. Further Tatar mixed-language
corrections and English placeholders remain; the broader audit continues.

### Tatar list, number and text input labels

Filled 39 English placeholders for list, loop, arithmetic, text and value inputs.
Existing translations and source tokens are preserved. Regression checks cover key
order, token inventories, dividend/divisor distinctions, coordinates, start/end positions
and shared repeat-count labels. Technical wording remains low confidence pending
speaker review. Browser and screen-reader checks were not run. Further Tatar
mixed-language corrections and English placeholders remain; the broader audit continues.

### Tatar keyboard navigation and list construction

Filled 29 English placeholders for keyboard navigation, list construction and item
retrieval. Existing translations and source placeholders are preserved. Regression
checks cover source order, tokens, move-key references, copy/cut announcements,
retrieval versus removal and empty-list length. Technical wording remains low
confidence pending speaker review. Browser and screen-reader checks were not run.
Further Tatar corrections and the broader language audit continue.

### Tatar list removal and editing

Filled 32 English placeholders for list removal, sublists, indexing, repetition,
reversal and insertion. Existing translations and source tokens are preserved.
Regression checks cover key order, placeholders, removal without return, copy semantics,
first/last positions and insertion versus replacement. Technical wording remains low
confidence pending speaker review. Browser checks were not run. Further Tatar
mixed-language corrections and the broader translation audit continue.

### Tatar sorting and logic comparisons

Filled 32 English placeholders for list replacement, sorting, text/list conversion,
Boolean values and comparisons. Existing translations and source tokens are preserved.
Regression checks cover key order, placeholders, sort direction, conversion direction,
inclusive comparison bounds and copy semantics. Technical wording remains low
confidence pending speaker review. Browser checks were not run. Further Tatar
mixed-language corrections and the broader translation audit continue.

### Tatar logic and arithmetic explanations

Filled 25 English placeholders for Boolean operations, conditional values, arithmetic,
constants and numeric bounds. Existing translations and source tokens are preserved.
Regression checks cover source order, placeholders, mathematical constants, coordinates,
conditional label references and logical distinctions. Technical wording remains low
confidence pending speaker review. Browser checks were not run. Further Tatar
mixed-language corrections and the broader translation audit continue.

### Tatar number tests and statistics

Filled 30 English placeholders for divisibility, number tests, remainder and list
statistics. Existing translations and source tokens are preserved. Regression coverage
checks key order, placeholders, distinct statistical operations, number polarity,
remainder notation and shared minimum/maximum labels. Technical wording remains low
confidence pending speaker review. Browser checks were not run. Further Tatar
mixed-language corrections and the broader translation audit continue.

### Tatar random numbers and mathematical functions

Filled 28 English placeholders for sums, random numbers, rounding, logarithms, powers
and initial inverse-trigonometric labels. Existing translations, standard symbols and
source placeholders are preserved. Regression coverage checks key order, tokens,
exclusive random bounds, logarithm bases and rounding/negation distinctions. Technical
wording remains low confidence pending speaker review. Browser checks were not run.
Further Tatar corrections and the broader language audit continue.

### Tatar trigonometry and workspace controls

Filled 24 English placeholders for trigonometric labels and explanations, workspace
movement, typed variables and backpack actions. Existing translations, standard
mathematical symbols and source tokens are preserved. Regression checks cover key
order, placeholders, degree-versus-radian wording, inverse functions and variable types.
Technical wording remains low confidence pending speaker review. Browser and
screen-reader checks were not run. Further Tatar corrections and the broader audit continue.

### Tatar function controls

Filled 27 English placeholders for function definitions and calls, variables, zoom
and screen-reader guidance. Existing translations and source tokens are preserved.
Regression checks cover source order, placeholders, return/no-return distinctions,
named invocations and function-only return restrictions. Technical wording remains
low confidence pending speaker review. Browser and screen-reader checks were not run.
Further Tatar corrections and the broader language audit continue.

### Tatar navigation shortcuts and screen-reader controls

Filled 40 English placeholders for editing, focus, movement, scrolling and navigation
shortcuts, including the screen-reader enabled state. Existing translations and source
tokens are preserved. Regression checks cover source order, placeholders, distinct
directions, next/previous targets and screen-reader states. Technical wording remains
low confidence pending speaker review. Browser and screen-reader checks were not run.
Further Tatar corrections and the broader language audit continue.

### Tatar text positions and search

Filled 32 English placeholders for appending text, case conversion, character retrieval,
joining, substrings and search. Existing translations and source tokens are preserved.
Regression checks cover key order, placeholders, first/last distinctions, letter case,
count argument order and the not-found result. Technical wording remains low confidence
pending speaker review. Browser checks were not run. Further Tatar corrections and
the broader language audit continue.

### Tatar text formatting and variable controls

Filled 34 English placeholders covering text joining, length, printing, input
prompts, replacement, reversal, whitespace trimming, and variable access and
conflict messages. Source placeholder inventories and locale key order are
preserved. Regression coverage checks replacement arguments, distinct trim sides,
number versus text prompts, and quoted variable and procedure references.
Technical wording remains low confidence pending speaker review. Browser and
screen-reader checks were not run. Further Tatar corrections and the broader
language audit remain unfinished.

### Tatar workspace search and block rule controls

Filled 41 English placeholders covering workspace descriptions, search controls,
block aliases and rule-editor help, validation, permission and saved states.
Preserved source tokens, keyboard shortcut names, comment-fragment spacing and
locale key order. Regression coverage checks navigation distinctions, fragment
spacing, function aliases, search arguments and validation wording.
Technical wording remains low confidence pending speaker review. Browser and
screen-reader checks were not run. Older rule strings still contain wrong-language
wording; those corrections and the broader language audit remain unfinished.

### Tatar Scrum planning and sprint reports

Filled 61 English placeholders for planning views, roles, estimate sources and
units, completion policies, sprint lifecycle controls, events and reporting.
Preserved source placeholders and locale key order. Coverage checks distinct
sprint states, completed versus incomplete work, scope additions versus removals,
view aliases, and the warning that unknown estimates are not zero estimates.
Technical Scrum terminology remains low confidence pending speaker review.
Browser checks were not run. Further Tatar translations and wrong-language
corrections, and the broader language audit, remain unfinished.

### Tatar observations, synchronization conflicts and previews

Filled 56 English placeholders for remaining sprint controls, daily observations,
synchronization conflict choices and change previews. Preserved source tokens,
UTC notation, numeric limits and locale key order. Regression coverage checks
unknown-versus-zero estimate wording, source-write negation, unchanged subcards,
and distinct local/source, detach/replacement and create/update/archive choices.
Technical terminology remains low confidence pending speaker review. Browser
checks were not run. Further Tatar translations and wrong-language corrections,
and the broader language audit, remain unfinished.

### Tatar synchronization diagnostics and notification recovery

Filled 56 English placeholders for source-field diagnostics, retained run reports,
Jira estimate fields, mail failures and activity-notification recovery. Preserved
source tokens, numeric retention limits, Jira/SMTP names and explicit null wording.
Regression coverage checks missing-source versus null handling, mail failure and
recovery-state distinctions, and the promise that retries do not recreate activities.
Technical terminology remains low confidence pending speaker review. Browser checks
were not run. Further Tatar translations and wrong-language corrections, and the
broader language audit, remain unfinished.

### Tatar keyboard labels and remaining recovery controls

Filled 28 English placeholders for keyboard labels and activity delivery controls.
Key-cap names remain recognizable alongside Tatar descriptions. Regression coverage
checks pause/resume/cancel distinctions and the warning that permanent cancellation
cannot resume or recall queued mail and delivered notifications. Source tokens and
locale key order remain intact. The default inventory now contains only 11 product
names and mathematical identifiers, preserved unchanged; this is not a fluency or
wrong-language audit. Older Tatar strings still require wrong-language corrections.
Technical wording remains low confidence pending speaker review. Browser checks
were not run. The broader language audit remains unfinished.

### Tatar rule editor wrong-language corrections

Corrected 46 older rule-editor values with Turkish-like vocabulary or incorrect
meaning, including rule names, trigger events, selection, and import/export help.
Correct existing values such as the required-title message, disabled state and
import/export labels were retained. Source placeholders and key order remain intact.
Regression coverage checks Tatar rule vocabulary and rejects characteristic old
wrong-language terms, alongside event polarity and import/export distinctions.
Technical wording remains low confidence pending speaker review. Browser checks
were not run. Further wrong-language corrections and the broader audit remain.

### Tatar scheduled rules and workflow import corrections

Corrected 43 wrong-language workflow, schedule, date-trigger, button and sorting
values. Retained the correct board label and card-date fragment. Preserved source
placeholders, product names and the literal N in the duration label. Regression
coverage checks Tatar recurrence and button vocabulary, distinct date directions,
completion polarity and workflow import names, alongside full token inventories.
Technical wording remains low confidence pending speaker review. Browser checks
were not run. Further wrong-language corrections and the broader audit remain.

### Tatar trigger events and date-change corrections

Corrected 37 older trigger, movement, attachment and checklist values, including
date events that previously omitted setting a date and conflated due/end dates.
Retained correct month, board, list and card labels and the title/description
condition. Inspected the trigger-template references for short fragments; composed
sentences still require browser and speaker review. Regression coverage checks
Tatar attachment vocabulary, four distinct date kinds with set-or-change meaning,
movement direction, archive polarity and equivalent attachment event labels.
Source placeholder inventories and key order remain intact. Technical wording is
low confidence pending speaker review. Browser checks were not run. Further
wrong-language corrections and the broader audit remain unfinished.

### Tatar checklist, movement and email action corrections

Corrected 31 wrong-language rule action values, including remove, check/uncheck,
list positions, archive restoration and email labels. Retained correct existing
labels and variable-help translations, including their brace-delimited tags.
Regression coverage checks Tatar position vocabulary, removal and checking
polarity, member versus label removal, and equivalent email action labels.
Source token inventories and key order remain intact. Technical wording and
composed fragments remain low confidence pending speaker review. Browser checks
were not run. Further wrong-language corrections and the broader audit remain.

### Tatar rule action descriptions and checklist guidance

Corrected 31 wrong-language rule descriptions and instructions for archives,
checklists, swimlanes, dates and card links. Kept correct existing member and label
commands and the start/received date labels. Preserved comma-separated example
syntax, source placeholders and locale key order. Regression coverage checks
check/uncheck and archive polarity, checklist aliases, due/end date distinctions,
and the instructions for comma separation and matching all values with an empty field.
Technical wording and composed fragments remain low confidence pending speaker
review. Browser checks were not run. Further corrections and the broader audit remain.

### Tatar activity messages and title argument order

Corrected 31 activity and comment-control values, including attachment, label,
checklist, comment and custom-field events. Also corrected an earlier Tatar title
message that reversed the meanings of its two sequential %s arguments: the activity
template supplies the new title before the card link. Regression coverage checks
that order, exact placeholder case/counts, vocabulary, label aliases and action
polarity. Correct existing nearby translations were retained. Technical wording
remains low confidence pending speaker review. Browser checks were not run.
Further wrong-language corrections and the broader audit remain unfinished.

### Tatar movement, import and membership activity corrections

Corrected 27 older activity values for archives, imports, movement and membership.
Preserved named placeholders and sequential %s argument roles: object, destination,
and source in the import message, and object, source, destination in movement.
Regression coverage checks those distinctions, source/destination case endings,
and add/remove membership and archive/restore differences. Correct adjacent
activity labels were retained. Technical wording remains low confidence pending
speaker review. Browser checks were not run. Further wrong-language corrections
and the broader audit remain unfinished.

### Tatar checklist activity and workspace corrections

Corrected 35 checklist activity, date activity and workspace values. Confirmed
argument roles against activities.jade: checklist/item precedes card, and date
precedes card. Regression coverage checks those roles, completion polarity,
workspace aliases and distinct subworkspace labels. Correct adjacent labels were
retained. Source placeholders and key order remain intact. Technical wording
remains low confidence pending speaker review. Browser checks were not run.
Further wrong-language corrections and the broader audit remain unfinished.

### Tatar board selection and layout corrections

Corrected 33 board selection, home-board, date activity and layout strings.
Preserved correct adjacent translations and source placeholders. Regression
coverage checks Tatar width/height vocabulary, personal versus shared settings,
switch distinctions, home removal without board deletion and date argument order.
Technical wording remains low confidence pending speaker review. Browser checks
were not run. Further wrong-language corrections and the broader audit remain.

### Tatar common controls, announcements and loading warning

Corrected 23 wrong-language checklist, administrator, announcement, reconnect and
archive values. Retained correct adjacent controls and source placeholders.
Regression coverage checks empty-result negation, add/edit form distinctions,
checklist aliases, plural counts and the warning about data loss when refreshing
during loading. Technical wording remains low confidence pending speaker review.
Browser checks were not run. Further corrections and the broader audit remain.

### Tatar archive, attachments and board visibility corrections

Corrected 32 archive, attachment, background and board-membership values. Kept
correct adjacent translations, including the soft-delete explanation. Preserved
source placeholders, strong markup and key order. Regression coverage checks
permanent deletion versus soft deletion, empty archive negation, board-settings
aliases, private/public distinctions and board/card member/assignee scopes.
Technical wording remains low confidence pending speaker review. Browser checks
were not run. Further wrong-language corrections and the broader audit remain.

### Tatar board views, appearance and navigation corrections

Corrected 26 wrong-language board navigation, appearance, display-mode and view
labels. Preserved correct neighboring translations, source placeholders, zoom
limits and Gantt product names. Regression coverage checks equivalent view/color/
background labels, zoom direction, display-mode and calendar distinctions, and
Tatar statistics vocabulary. Technical wording remains low confidence pending
speaker review. Browser checks were not run. Further corrections and the broader
audit remain unfinished.

### Tatar card archival, deletion and editing guidance

Corrected 29 calendar-navigation and card-control values. Replaced wrong-language
archive/delete explanations and corrected overdue wording that previously implied
postponement. Preserved correct adjacent translations and source token inventories.
Regression coverage checks archive invisibility and later restoration, permanent
deletion, overdue meaning, date distinctions and editing targets. Technical wording
remains low confidence pending speaker review. Browser checks were not run.
Further wrong-language corrections and the broader audit remain unfinished.

### Tatar voting and planning-poker corrections

Corrected 27 wrong-language voting and card-action strings and restored ten poker
number/question-mark labels that had inappropriate prose appended. Numeric options
now match the source exactly; they are symbols, not untranslated prose. Preserved
correct adjacent translations and source placeholders. Regression coverage checks
exact options, support/opposition, logged-in access and permanent-deletion wording.
Technical terminology remains low confidence pending speaker review. Browser checks
were not run. Further corrections and the broader audit remain unfinished.

### Tatar popup, dependency and account-action corrections

Corrected 30 popup labels for dependencies, organizations, accounts, imports,
restoration and dimensions. Correct adjacent member and export labels remain.
Regression coverage checks Tatar organization vocabulary, deletion versus
anonymization, distinct restoration/import targets, equivalent sorting/background
actions and width/height distinctions. Source tokens and key order remain intact.
Technical wording remains low confidence pending speaker review. Browser checks
were not run. Further wrong-language corrections and the broader audit remain.

### Tatar user mapping and appearance corrections

Corrected 32 login, user-mapping, theme and font values. Replaced the Turkish font
preview with Tatar prose while retaining all sample digits. Preserved correct
adjacent labels and placeholders. Regression coverage checks the mapping permission
ceiling, no-results negation, equivalent action labels, five distinct font sizes,
Tatar preview vocabulary and CAS/SAML names. Technical wording remains low confidence
pending speaker review. Browser checks were not run. Further wrong-language
corrections and the broader audit remain unfinished.

### Tatar navigation, starring and card-aging corrections

Corrected 31 wrong-language navigation, preference, starring and aging values.
Preserved correct text-note and auto-archive translations. Source placeholders
and key order remain intact. Regression coverage checks direction and toggle
pairs, three numbered fading tiers, equivalent preference labels and archive
restoration guidance. Technical wording remains low confidence pending speaker
review. Browser checks were not run. Further corrections and the broader audit remain.

### Tatar color and comment-permission corrections

Corrected 36 wrong-language color, comment and read-only values and restored the
source blank comment placeholder, removing an inappropriate language suffix.
Preserved correct adjacent translations and source tokens. Regression coverage
checks Tatar color vocabulary, distinct shades, the exact blank placeholder and
comment/read-only restrictions. Specialized color wording remains low confidence
pending speaker review. Browser checks were not run. Further wrong-language
corrections and the broader audit remain unfinished.

### Tatar copying, restricted roles and custom-field controls

Corrected 30 permission, deletion, clipboard, copying and custom-field values.
Translated the embedded multi-card JSON example while preserving its title and
description property names and valid syntax. Regression coverage parses that
example and checks restricted-role wording, deletion permanence, distinct copy
targets and field-label aliases. Correct adjacent translations and source tokens
were retained. Technical wording remains low confidence pending speaker review.
Browser checks were not run. Further corrections and the broader audit remain.

### Tatar field options and date-format notation

Corrected 22 wrong-language field and editing strings and restored three date-format
labels to their source notation (YYYY, MM, DD). Preserved correct adjacent values,
including permanent-deletion guidance. Regression coverage checks exact format
notation, none/unknown distinctions, Enter guidance, field-type vocabulary and
start/due date differences. Source token inventories and key order remain intact.
Technical wording remains low confidence pending speaker review. Browser checks
were not run. Further corrections and the broader audit remain unfinished.

### Tatar email templates and permission/import errors

Corrected 34 editing, account-email, invitation and error values. Preserved source
placeholders, email paragraph structure and JSON/CSV/TSV/WeKan names. Regression
coverage checks invitation aliases, standalone URL paragraphs, admin/member
requirements, send/failure distinctions and denied-role wording. Correct nearby
email labels remain. Technical wording remains low confidence pending speaker
review. Browser and email-delivery checks were not run. Further wrong-language
corrections and the broader audit remain unfinished.

### Tatar export controls and account-conflict messages

Corrected 29 account-conflict, export and attachment-metadata values. Preserved
correct board-export labels, source tokens and PDF/Excel/iCal names. Regression
coverage checks inability and disk-space conditions, free/needed distinctions,
uploader versus upload time, subtask aliases and distinct account-name conflicts.
Technical wording remains low confidence pending speaker review. Browser and
export-runtime checks were not run. Further corrections and the broader audit remain.

### Tatar sorting and filtering corrections

Corrected 34 sorting and filtering values while preserving correct recent date-range
and list-age guidance. Replaced duplicate sorting abbreviations with distinct Tatar
initials for time, name and manual order. Source tokens and key order remain intact.
Regression coverage checks date periods, missing versus overdue dates, creator versus
assignee, absent-field negation and sorting abbreviations. Technical wording remains
low confidence pending speaker review. Browser checks were not run. Further
wrong-language corrections and the broader audit remain unfinished.

### Tatar advanced-filter and import guidance corrections

Corrected 25 filter, activity and import values. Restored technical examples that
had been transliterated, including JSON keys, API paths, .xlsx and regex syntax.
Completed the existing Markdown instruction with its missing plain-bullet behavior.
Preserved correct neighboring import guidance and source placeholders. Regression
coverage checks literal identifiers and examples, Markdown bullet guidance and
show/hide distinctions. Technical wording remains low confidence pending speaker
review. Browser and import-runtime checks were not run. Further corrections and
the broader audit remain unfinished.

### Tatar Trello import options and archive errors

Corrected 28 Trello import and workspace values. Restored literal .json/.zip
extensions and the downloader name while preserving the API-key URL and source
tokens. Regression coverage checks these literals, optional workspace wording,
and distinct archive-size, file-count, inner-file-size and unsafe-path failures.
Technical wording remains low confidence pending speaker review. Browser and
import-runtime checks were not run. Further corrections and the broader audit remain.

### Tatar import progress and member-mapping corrections

Corrected 23 import-progress, cancellation and member-mapping values. Preserved
correct selection text, source placeholders and Trello API naming. Regression
coverage checks cancel versus cancel-and-delete, resume and running/paused states,
permanent-deletion warning, minimum selection and current-user mapping fallback.
Technical wording remains low confidence pending speaker review. Browser and
import-runtime checks were not run. Further corrections and the broader audit remain.

### Tatar validation, label and board-membership corrections

Corrected 22 validation, version, label and board-membership values. Preserved
correct neighboring label-override text and source placeholders. Regression
coverage checks the four-digit year example, minimum-one-admin requirement,
permanent label deletion, removal from all cards when leaving a board and
label-creation aliases. Technical wording remains low confidence pending speaker
review. Browser checks were not run. Further corrections and the broader audit remain.

### Tatar list actions and settings corrections

Corrected 21 list, settings and login values. Restored the explicit inability to
recover a deleted list and retained the archive alternative that preserves history.
Preserved correct neighboring labels and source tokens. Regression coverage checks
bulk-card scope, distinct settings targets, deletion versus archival guidance,
calendar/Gantt/login aliases and Excel CSV/TSV naming. Technical wording remains
low confidence pending speaker review. Browser checks were not run. Further
wrong-language corrections and the broader audit remain unfinished.

### Tatar selection, notification and normal-role corrections

Corrected 25 selection, empty-archive, notification and role values. Preserved
correct adjacent labels and source tokens. Regression coverage checks copy/move
aliases, top/bottom distinctions, empty archives, normal-role settings restrictions,
assigned-only visibility and muted/unaccepted negation. Technical wording remains
low confidence pending speaker review. Browser checks were not run. Further
wrong-language corrections and the broader audit remain unfinished.

### Tatar visibility, previews and notification scope

Corrected 17 notification, visibility, preview and removal values. Preserved correct
signed-in-user visibility text and source placeholders. Regression coverage checks
login-link markup, membership-only editing, public search visibility, blank-field
default guidance, preview aliases and image-only paste wording. Technical wording
remains low confidence pending speaker review. Browser checks were not run.
Further wrong-language corrections and the broader audit remain unfinished.

### Tatar member removal, rescue and search controls

Corrected 22 removal, unsaved-description, search and shortcut values. Preserved
correct adjacent text, including the Sandstorm access warning, and all source
placeholders. Regression coverage checks removal from all cards and notification,
replace-description wording, equivalent rename/close labels and self-membership
versus self-assignment. Technical wording remains low confidence pending speaker
review. Browser checks were not run. Further corrections and the broader audit remain.

### Tatar sidebar shortcuts and automatic board opening

Corrected 20 shortcut, sidebar, starring and time labels while preserving correct
adjacent starred-item translations. Source tokens and key order remain intact.
Regression coverage checks distinct sidebar targets, open/close and automatic-open
states, assigned-card scope, greater-than count wording and hour units. Technical
wording remains low confidence pending speaker review. Browser checks were not run.
Further wrong-language corrections and the broader audit remain unfinished.

### Tatar tracking, upload and shortcut-range corrections

Corrected 18 time, tracking, upload and logo-setting values while preserving correct
Pomodoro and nearby labels. Source placeholders, 1-9 shortcut ranges and URL naming
remain intact. Regression coverage checks adding/removing labels, upload states,
spent/overtime distinctions, unsaved text and image/link URL differences. Technical
wording remains low confidence pending speaker review. Browser and upload-runtime
checks were not run. Further corrections and the broader audit remain unfinished.

## Tatar settings and transfer-limit corrections

Corrected 33 wrong-language or incomplete values for custom branding, watching,
welcome content, WIP validation and attachment/API transfer limits. Preserved the
logo default of 27, milestone 1, URL scheme examples and WIP identifier. Clarified
that either empty autolink field disables linking, and kept upload/download limits
and successful/failed saves distinct. Existing correct-language neighbors remain.
Technical wording remains low confidence pending speaker review. Focused tests
cover key order, source tokens and these distinctions; browser checks were not run.

## Tatar email and registration settings corrections

Corrected 31 wrong-language values for size limits, registration, invitations,
SMTP configuration, email templates and webhook labels. Preserved SMTP/TLS names,
invitation placeholders and paragraph structure, subject/body distinctions and
optional webhook authentication. Existing correct-language values were retained.
Technical wording remains low confidence pending speaker review. Focused tests
cover key order, source tokens and these distinctions; browser checks were not run.

## Tatar webhooks and system information corrections

Corrected 35 webhook and system-information values, including two product names
with spurious language suffixes. Restored literal changeStreams, oplog, polling,
METEOR_REACTIVITY_ORDER and DDP_TRANSPORT identifiers. Kept webhook directions,
free/total memory and version/commit labels distinct; retained valid neighbors.
Technical wording remains low confidence pending speaker review. Focused tests
cover key order, source tokens and runtime identifiers; browser checks were not run.

## Tatar custom fields and organization settings corrections

Corrected 33 wrong-language values for time units, custom fields, account settings,
visibility and organization/team administration. Restored domain examples and the
literal MULTITENANCY=true setting. Preserved administrator scope restrictions,
new/all card distinctions and the sum-of-fields meaning rather than a field count.
Existing correct-language translations were retained. Technical wording remains
low confidence pending speaker review. Focused checks cover tokens, key order,
domain syntax and administration restrictions; browser checks were not run.

## Tatar deletion and subtask settings corrections

Corrected 33 wrong-language date, color, deletion and subtask settings values.
Preserved irreversible deletion warnings, the requirement that duplicate lists
have the same name and contain no cards, and the board placeholder. Corrected the
board-deletion warning to refer to the board rather than a card. Existing valid
translations remain. Technical wording remains low confidence pending speaker
review. Focused checks cover tokens, key order, deletion scope and matching popup
labels; browser checks were not run.

## Tatar minicard and label activity corrections

Corrected 23 wrong-language minicard, hierarchy and activity values. Preserved
checklist counters and sequential label/card and field/value/card arguments,
verified against activities.jade and the labelActivityMessage helper. Existing
correct-language parent-card labels were retained. Technical wording remains low
confidence pending speaker review. Focused tests check tokens, key order, counter
notation and rendered argument roles; browser checks were not run.

## Tatar branding and authentication-label corrections

Corrected 32 branding, authentication-label, layout and administration values,
including four literal protocol/URL labels. Restored assetlinks.json and HTML tag
names, preserved JSON markers and opening/closing body boundaries, and retained
existing correct-language OAuth/passwordless translations. Technical wording
remains low confidence pending speaker review. Focused tests cover key order,
source tokens and literal configuration syntax; browser checks were not run.

## Tatar due reminders and account-deletion corrections

Corrected 33 wrong-language reminder, positioning, deletion and display values.
Preserved old/new date tokens, all mention fields, the first-reminder distinction,
and irreversible user/team/organization/swimlane deletion warnings. Retained valid
loading and card-edit messages. Technical wording remains low confidence pending
speaker review. Focused tests check key order, placeholder inventories, reminder
states and deletion warnings; browser checks were not run.

## Tatar editor preferences and administration popup corrections

Corrected 17 wrong-language or incomplete display, editor and administration
values. Restored literal Enter, Shift+Enter and Ctrl/Cmd+Enter shortcuts, retained
both save/newline modes and the multiple-card window behavior, and kept create
and edit actions distinct. Existing valid neighboring translations remain.
Technical wording remains low confidence pending speaker review. Focused tests
cover key order, source tokens and editor behavior; browser checks were not run.

## Tatar role settings and weekday corrections

Corrected 41 wrong-language notification controls, role settings, weekdays and
task labels. Preserved global administrators' unrestricted rights, the read-only
permission preview before saving, read/unread distinctions and linked-card deletion
prerequisites. Existing correct-language notification preferences remain. Technical
wording remains low confidence pending speaker review. Focused tests cover key
order, source tokens, permissions and weekday names; browser checks were not run.

## Tatar shared-template and domain corrections

Corrected 19 wrong-language domain, shared-template, identity and calendar labels.
Restored the literal example.com validation example, the prohibition on @ and
spaces, multiple-scope selection and the nonempty Templates board condition.
Existing correct-language table-view and calendar values remain. Technical wording
remains low confidence pending speaker review. Focused checks cover key order,
source tokens, domain syntax and sharing scope; browser checks were not run.

## Tatar search views and result-message corrections

Corrected 34 search-view, due-card and result messages, including the literal slash
separator. Preserved permission-limited scope, member-or-assignee filtering,
incomplete-card criteria and result placeholders. Existing correct-language labels
remain. Technical wording remains low confidence pending speaker review. Focused
tests check key order, source tokens, filter semantics and matching view labels;
browser checks were not run.

## Tatar search operator and predicate corrections

Corrected 38 wrong-language search aliases, predicates and the unknown-operator
error. Restored literal # and @ shorthand. Full aliases use single words accepted
by the production parser, including previously spaced debug/checklist aliases.
Existing correct-language aliases remain. Technical wording remains low confidence
pending speaker review. Focused tests cover tokens, key order, parser-compatible
characters and alias uniqueness; browser checks were not run.

## Tatar search instructions and validation corrections

Corrected 32 wrong-language search validation, pagination and instruction values.
Restored executable list:Blocked and user:<username> examples, preserved operator
placeholders and syntax metavariables, and repaired unmatched formatting in the
due-date and label help. Technical wording remains low confidence pending speaker
review. Focused tests cover key order, tokens, syntax markers and balanced inline
code; browser checks were not run.

## Tatar search logic and export-label corrections

Corrected 19 search-help and label values, including the literal Arial font name.
Preserved OR/AND distinctions, negation and descending-sort syntax, positive page
limits and the archived-card exclusion default. Restored literal query examples
and retained valid neighboring text. Technical wording remains low confidence
pending speaker review. Focused tests cover tokens, key order, query examples and
search logic; browser checks were not run.

## Tatar card sorting and dependency-label corrections

Corrected 18 wrong-language sorting, completion, sticker and dependency labels.
Restored literal A/Z sort indicators and preserved opposing completion, visibility,
addition and removal actions. Existing correct-language dependency permissions and
import/export messages remain. Technical wording remains low confidence pending
speaker review. Focused tests cover key order, source tokens, sort directions and
action distinctions; browser checks were not run.

## Tatar dependency import, backgrounds and location corrections

Corrected 26 wrong-language dependency, background and location values. Preserved
relationship directions, JSON/SVG identifiers, import counters, the image-size
token and distinct latitude/longitude labels. Existing valid neighboring values
remain. Technical wording remains low confidence pending speaker review. Focused
tests cover key order, source tokens, file formats and relationship distinctions;
browser checks were not run.

## Tatar map detection and diagnostics corrections

Corrected 21 wrong-language map, diagnostic, sorting and creator values. Restored
literal snap and Docker log commands and the Enter key name. Preserved location
detection states and newest/oldest ordering. Existing correct-language template
syntax guidance remains. Technical wording remains low confidence pending speaker
review. Focused tests cover key order, source tokens, executable commands and
ordering distinctions; browser checks were not run.

## Tatar report and office activity corrections

Corrected 28 wrong-language report, office and API values, including two literal
API labels. Restored IPv4/IPv6 and REST identifiers, preserved successful-login
counts and API aggregation by account and endpoint rather than individual request.
Existing correct-language labels remain. Technical wording remains low confidence
pending speaker review. Focused tests cover key order, tokens, protocol names and
reporting distinctions; browser checks were not run.

## Tatar API recovery and waiting-animation corrections

Corrected 25 wrong-language API, recovery, copying and waiting-animation values.
Restored literal REST API and WITH_API=true syntax, preserved MongoDB, first/last
call distinctions and automatic continuation after recovery. Technical wording
remains low confidence pending speaker review. Focused tests cover key order,
source tokens, runtime identifiers and distinct animation names; browser checks
were not run.

## Tatar ticket states and deletion constraints corrections

Corrected 18 wrong-language card sizing, ticket, request and history labels.
Preserved the restriction against deleting organizations or teams with members,
distinct pending/closed/resolved/cancelled states and literal Cc: mail notation.
Existing correct-language history actions remain. Technical wording remains low
confidence pending speaker review. Focused tests cover key order, source tokens,
state distinctions and deletion constraints; browser checks were not run.

## Tatar team invitation and heap-metric corrections

Corrected 16 wrong-language card detail, team invitation and memory metric values.
Preserved the disabled-self-registration condition, board-scoped team removal,
invitation success/error distinction and literal Node name. Existing correct-language
saved-filter text remains. Technical wording remains low confidence pending speaker
review. Focused tests cover key order, tokens, invitation conditions and distinct
heap metrics; browser checks were not run.

## Tatar memory and checklist-control corrections

Corrected 24 wrong-language memory, organization, legal-notice and checklist
values. Preserved Node and allocator identifiers, distinct memory measurements,
board-scoped removal and one-line/one-item mapping with original-order behavior.
Technical wording remains low confidence pending speaker review. Focused tests
cover key order, source tokens, technical identifiers and checklist distinctions;
browser checks were not run.

## Tatar checklist copying and attachment-storage corrections

Corrected 22 wrong-language checklist and attachment controls, including two
literal storage product labels. Restored GridFS, S3, CollectionFS and Meteor-Files
names; preserved single-attachment, all-attachment and board-only scopes. Existing
correct-language text-editing labels remain. Technical wording remains low confidence
pending speaker review. Focused tests cover tokens, key order, storage names and
operation scopes; browser checks were not run.

## Tatar storage repair and default-destination corrections

Corrected 19 wrong-language storage values, including the literal S3/MinIO label.
Preserved read-enabled storage eligibility, attachment-and-avatar repair scope,
new-upload destination semantics and distinct repair/save states. Technical wording
remains low confidence pending speaker review. Focused tests cover tokens, key
order, identifiers and state distinctions; browser checks were not run.

## Tatar storage statistics and compaction corrections

Corrected 19 wrong-language storage statistics, identifiers and compaction values,
including two literal product labels. Preserved the requirement to finish bulk
moves first, the blocking-operation warning and replica-node ordering described
by the source text. Technical wording remains low confidence pending speaker
review. Focused checks cover key order, tokens, identifiers and prerequisites;
browser checks were not run.

## Tatar board status and transfer-progress corrections

Corrected 18 wrong-language board status, transfer progress and general labels.
Preserved distinct spent, overtime and remaining-time concepts, the compaction
error prefix and repeated-password prompt. Existing correct-language neighboring
values remain. Technical wording remains low confidence pending speaker review.
Focused tests cover key order, tokens and status distinctions; browser checks
were not run.

## Tatar upload validation and custom-translation corrections

Corrected 21 wrong-language upload, workspace and custom-translation values.
Preserved byte units, the workspace placeholder, PDF/Mongo/ISO 8601 identifiers,
and irreversible deletion wording. Existing valid account labels remain.
Technical wording remains low confidence pending speaker review. Focused tests
cover key order, source tokens, units and validation distinctions; browser checks
were not run.

## Tatar recurrence and checklist-visibility corrections

Corrected 11 wrong-language or misleading import, checklist and recurrence values.
Restored literal .zip and JSON references and distinguished card recurrence from
checklist reset. Kept valid interval labels and existing translations. Technical
wording remains low confidence pending speaker review. Focused tests cover key
order, tokens, file identifiers and recurrence/visibility distinctions; browser
checks were not run.

## Tatar support and login-lockout corrections

Corrected 22 wrong-language support, accessibility and login-lockout values.
Preserved signed-in-only support access, known/unknown username distinctions,
wrong-password context, seconds units and separate lockout/failure windows.
Technical wording remains low confidence pending speaker review. Focused tests
cover key order, source tokens, access restrictions and units; browser checks
were not run.

## Tatar unlock and user-activation corrections

Corrected 20 wrong-language lockout, people-filter and scheduled-job labels.
Preserved single-user versus all-user unlock scope, active/inactive filters and
opposite activation actions. Existing correct-language presence and team labels
remain. Technical wording remains low confidence pending speaker review. Focused
tests cover tokens, key order, unlock scope and activation distinctions; browser
checks were not run.

## Tatar scheduled-job and storage-path corrections

Corrected 24 wrong-language job and storage-path messages. Preserved distinct
archive/backup/cleanup scheduling outcomes, pause/resume/delete actions and the
coming-soon qualification. Technical wording remains low confidence pending
speaker review. Focused tests cover tokens, key order, outcome distinctions and
separate attachment/avatar paths; browser checks were not run.

## Tatar migration errors and filesystem-state corrections

Corrected 23 wrong-language migration and filesystem values. Preserved error versus
warning distinctions, retry versus resume actions, empty-state explanations and
opposing filesystem states. Retained the valid time label. Technical wording remains
low confidence pending speaker review. Focused tests cover tokens, key order and
status/action distinctions; browser checks were not run.

## Tatar cloud storage and migration-guidance corrections

Corrected 22 wrong-language cloud-storage and migration values, including four
literal service labels. Restored provider names, database URLs, environment
variables, Snap commands and Sandstorm directory paths. Preserved migration scope
and target availability requirements. Technical wording remains low confidence
pending speaker review. Focused tests cover tokens, key order and executable
configuration syntax; browser checks were not run.

## Tatar Sandstorm migration-cleanup corrections

Corrected 11 wrong-language migration, disk usage and feature labels. Preserved
successful migration as the prerequisite for deleting old MongoDB files, the
FerretDB/filesystem destination and irreversible deletion warnings. Existing valid
feature descriptions remain. Technical wording remains low confidence pending
speaker review. Focused tests cover key order, tokens, migration states and cleanup
prerequisites; browser checks were not run.

## Tatar loading-mode and text-rendering corrections

Corrected 12 wrong-language performance and rendering values. Updated the stale
loading description to match the English automatic-threshold behavior and restored
both environment-variable names. Preserved lazy-mode limitations, HTML/Markdown
examples and default-off rendering controls. Existing valid feature descriptions
remain. Technical wording remains low confidence pending speaker review. Focused
tests cover tokens, key order and literal configuration syntax; browser checks
were not run.

## Tatar import/export and anonymization corrections

Corrected 14 wrong-language import/export and anonymization values. Replaced the
incorrect export description in the account-anonymization confirmation with its
actual consequences: permanent identity replacement, avatar removal, disabled
login, retained history and no undo. Restored service names and field identifiers.
Technical wording remains low confidence pending speaker review. Focused tests
cover tokens, key order, literal identifiers and account consequences; browser
checks were not run.

## Tatar notification controls and backup-scope corrections

Corrected 18 wrong-language notification and backup values. Preserved the difference
between disabling activity recording, notifications and subscriptions, plus the
organization-backup exclusions and restore ownership boundary. Kept the existing
correct-language backup-path description. Technical wording remains low confidence
pending speaker review. Focused checks cover tokens, key order and scope semantics;
browser checks were not run.

## Tatar backup scheduling and restore-mode corrections

Corrected 15 wrong-language schedule, restore-mode and cloud credential labels.
Preserved HH:MM, the 1-28 monthly range and add-missing versus replace-all modes.
Reviewed and retained the existing correct-language continuous-backup messages,
including encryption, retention and restore safeguards. Technical wording remains
low confidence pending speaker review. Focused tests cover tokens, key order,
formats and mode distinctions; browser checks were not run.

## Tatar cloud credential and console-path corrections

Corrected 22 wrong-language cloud credential descriptions and console paths.
Restored literal external UI labels, client_email, key1, service names and .csv.
Preserved optional credential alternatives and blank-to-retain behavior. These
translations follow the English source instructions; external consoles were not
revalidated. Technical wording remains low confidence pending speaker review.
Focused tests cover tokens, key order, UI labels and navigation steps; browser
checks were not run.

## Tatar cloud status and migration-control corrections

Corrected 23 wrong-language cloud status and migration-control values, including
two literal provider labels. Restored GridFS and S3/MinIO names and preserved
credential state, connection/save outcomes and pause/stop distinctions. Technical
wording remains low confidence pending speaker review. Focused tests cover tokens,
key order, provider names and opposing states; browser checks were not run.

## Tatar migration outcomes and S3-control corrections

Corrected 22 wrong-language migration and S3 values. Restored literal AWS, S3,
MinIO, GridFS and CollectionFS names; preserved start/stop/pause outcomes and
attachment/avatar migration guidance. Technical wording remains low confidence
pending speaker review. Focused tests cover tokens, key order, service identifiers
and outcome distinctions; browser checks were not run.

## Tatar S3 connection and scheduled operation corrections

Corrected 22 wrong-language values for S3 connection settings, secret keys,
scheduled board operations and migration controls. Preserved example hostnames,
AWS region identifiers, S3/MinIO and SSL/TLS. Regression coverage checks literal
connection examples and distinct outcomes and scheduling actions, alongside
English key order and placeholder inventories. Technical wording remains low
confidence pending speaker review. Browser checks were not run. The broader
wrong-language audit continues.

## Tatar board migration corrections

Corrected 45 wrong-language storage, migration and recovery strings. Preserved
swimlaneId/listId, URL and ID identifiers, the empty duplicate deletion conditions,
the non-archived recovery restriction, administrator access and the warning that
restoring all archived items is difficult to undo. Regression checks cover these
restrictions alongside key order and placeholder inventories. Technical wording
remains low confidence pending speaker review. Browser checks were not run.
The broader language audit remains ongoing.

## Tatar migration progress corrections

Corrected 34 wrong-language migration progress, recovery step and cleanup
values. Retained the correct existing translation of steps. Preserved URL and
ID labels, distinct recovery targets, the named lost-card swimlane, and the
one-time conversion notice allowing continued board use. Regression coverage
checks those semantics alongside key order and placeholder inventories. Technical
wording remains low confidence pending speaker review. Browser checks were not
run; the broader wrong-language audit continues.

## Tatar job monitoring corrections

Corrected 39 wrong-language job, resource monitoring and migration setting
values, including restoring the literal GridFS storage name. Retained the correct
existing errors translation. Preserved CPU, GridFS and S3 identifiers, numeric
intervals, percentage units and the 1-100 batch range. Regression coverage checks
these details alongside placeholder inventories and key order. Technical wording
remains low confidence pending speaker review. Browser checks were not run; the
broader wrong-language audit continues.

## Tatar migration threshold corrections

Corrected 35 wrong-language threshold, migration control, monitoring and minicard
values. Restored the literal S3 storage name. Preserved numeric ranges, CPU and
S3 identifiers, millisecond units, pause versus resume, and the background
processing notices. Regression coverage checks these details alongside key order
and placeholder inventories. Technical wording remains low confidence pending
speaker review. Browser checks were not run; the broader audit continues.

## Tatar repository access corrections

Corrected 31 wrong-language resource status, repository and account access
strings. Retained the correct start-time label and restored the literal Cron
name. Preserved OTP/API identifiers, byte units, temporary account lockout
and distinct pause/stop actions. Regression coverage checks these details
alongside key order and placeholder inventories. Technical wording remains
low confidence pending speaker review. Browser checks were not run; the
broader language audit continues.

## Tatar repair status corrections

Corrected 25 wrong-language account, repair status and resource labels. Retained
five correct neighboring values. Preserved repair count placeholders, the missing
board condition preventing automatic repair, CPU labels and the three-character
username minimum. The problem summary references the existing acknowledgement
button translation. Regression coverage checks these details alongside key order
and placeholder inventories. Technical wording remains low confidence pending
speaker review. Browser checks were not run; the broader audit continues.

## Tatar event and scoped import corrections

Corrected 21 wrong-language event, export and import values, retaining nine
correct neighboring strings. Restored IP/IPv4/IPv6 labels, .json/.zip extensions
and the Jira name. Corrected the card-number search alias to a single Tatar word
and preserved its example placeholder. Regression coverage checks identifiers,
formats and selection restrictions alongside key order and placeholder inventories.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; the broader language audit continues.

## Tatar WIP and flow report label corrections

Corrected 37 WIP group and flow report values containing wrong-language text or
incomplete substitutes for the English labels. Preserved XmR, the 85th percentile
and day units. Restored distinctions between target and finish dates, mean and
moving range, and the minimum capacity wording. Neighboring two-factor, list-sync
and map translations were retained. Statistical terminology remains low confidence
pending speaker review. Regression coverage checks key order, tokens and important
label distinctions. Browser checks were not run; flow report explanations and the
broader language audit remain unfinished.

## Tatar flow report explanation corrections

Replaced nine incomplete or wrong-language flow report, move-reason and time
adjustment values with full translations. Preserved sampling counts, forecast
limits, no-guarantee wording, date fallbacks, missing-history restrictions and
negative time corrections. Regression checks cover these constraints as well as
key order and placeholder inventories. Statistical terminology remains low
confidence pending speaker review. Browser checks were not run; the broader
language audit remains unfinished.

## Tatar ZenKit instruction correction

A follow-up wrong-language vocabulary scan found a missed ZenKit import
instruction. Corrected its prose and restored the literal title, stages and items
JSON fields. Added regression coverage for the full JSON example and product
name alongside placeholder and key-order checks. Technical wording remains low
confidence pending speaker review. Browser checks were not run. Vocabulary scans
are not proof of complete language correctness; the broader audit continues.

## Odia Blockly controls and colours

Filled 24 English placeholders in the Odia catalog for Blockly colour controls,
block operations and loop actions. Applied through the placeholder-only merge,
preserving existing translations. Tests compare key order, Odia script and exact
placeholder inventories, and check colour bounds and distinct loop actions.
Technical wording remains low confidence pending speaker review. Browser checks
were not run. Further Odia placeholders and the broader language audit remain.

## Odia Blockly loops and conditionals

Filled 20 English placeholders for loop controls, conditional branches and
iteration help. Preserved indexed placeholders and distinguished true-driven
while loops from false-driven until loops. The placeholder-only merge retained
existing translations. Regression coverage checks script, key order, tokens and
condition polarity. Technical wording remains low confidence pending speaker
review. Browser checks were not run; further Odia translations remain.

## Odia Blockly editing and bitmap labels

Filled 30 English placeholders for editing commands, variable deletion, bitmap
accessibility and field labels. Preserved indexed count, variable, row and column
references. Existing translations were retained by the placeholder-only merge.
Regression coverage checks key order, script, tokens and distinct opposing actions.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Odia translations and the broader audit remain unfinished.

## Odia Blockly help and input labels

Filled 29 English placeholders for keyboard help, icon actions and list input
labels. Preserved indexed tokens, open/close actions, first/second conditions
and start/end positions. Existing translations were retained by the placeholder-only
merge. Regression coverage checks these distinctions alongside script, key order
and token inventories. Technical wording remains low confidence pending speaker
review. Browser checks were not run; further Odia translations remain.

## Odia mathematical and text input labels

Filled 29 English placeholders for numerical, loop and text input labels.
Preserved coordinate names, indexed placeholders and distinctions between
dividend/divisor, minimum/maximum and start/end positions. The placeholder-only
merge retained existing translations. Regression coverage checks these roles,
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations remain.

## Odia list creation and keyboard navigation

Filled 22 English placeholders for keyboard navigation, list creation and item
selection. Preserved indexed shortcut tokens, empty-list length and the index
marker. Existing translations were retained by the placeholder-only merge.
Regression coverage checks token roles and distinct copy/cut and get/remove
actions alongside script and key order. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations remain.

## Odia list retrieval and removal

Filled 20 English placeholders for list item retrieval, removal and sublist
selection. Preserved first/last/random positions, index markers and the difference
between returning, removing and returning with removal. The placeholder-only merge
retained existing translations. Regression coverage checks these meanings alongside
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations remain.

## Odia list search and insertion

Filled 22 English placeholders for list search, length, reversal and insertion.
Preserved indexed tokens, the not-found return value, reversal of a copy, and
the distinction between insertion and setting an existing item. Existing
translations were retained by the placeholder-only merge. Regression coverage
checks these details alongside script, key order and token inventories. Technical
wording remains low confidence pending speaker review. Browser checks were not
run; further Odia translations remain.

## Odia sorting and comparison labels

Filled 25 English placeholders for sorting, splitting and joining lists, Boolean
values and comparisons. Preserved indexed tokens, sorting a copy, case-insensitive
ordering and inclusive versus strict comparisons. Existing translations were
retained by the placeholder-only merge. Regression coverage checks these details
alongside script, key order and token inventories. Technical wording remains low
confidence pending speaker review. Browser checks were not run; further translations
remain.

## Odia Boolean logic and arithmetic

Filled 21 English placeholders for logic, conditional values and arithmetic.
Preserved null, atan2, coordinate placeholders and the signed degree range.
Conditional help uses the translated branch labels. Existing translations were
retained by the placeholder-only merge. Regression coverage checks these details
and Boolean distinctions alongside script, key order and token inventories.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Odia translations remain.

## Odia constants and number properties

Filled 22 English placeholders for mathematical constants, bounds and number
properties. Preserved numeric examples, mathematical symbols, indexed tokens and
inclusive bounds. The placeholder-only merge retained existing translations.
Regression coverage checks constant examples and distinct number properties,
alongside script, key order and placeholder inventories. Technical wording remains
low confidence pending speaker review. Browser checks were not run; further
Odia translations remain.

## Odia list statistics and random fractions

Filled 21 English placeholders for list statistics and random fractions. Preserved
distinctions between mean, median and mode, the list-valued mode result, and
inclusive zero versus exclusive one bounds. The placeholder-only merge retained
existing translations. Regression coverage checks those details alongside script,
key order and token inventories. Statistical wording remains low confidence pending
speaker review. Browser checks were not run; further Odia translations remain.

## Odia rounding and mathematical functions

Filled 23 English placeholders for integer generation, rounding and mathematical
functions. Preserved inclusive bounds, indexed tokens and exponential/logarithmic
bases. Existing translations were retained by the placeholder-only merge.
Regression coverage checks rounding directions and function distinctions alongside
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations remain.

## Odia trigonometry and variable creation

Filled 22 English placeholders for trigonometric descriptions, workspace movement
and variable creation. Retained literal function abbreviations and preserved degree
versus radian wording and distinct variable types. The placeholder-only merge
retained existing translations. Regression coverage checks these details alongside
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations remain.

## Odia procedure definitions and calls

Filled 22 English placeholders for function definitions, calls, warnings and paste
actions. Preserved indexed function names, return/no-return distinctions and
function-only restrictions. Existing translations were retained by the placeholder-only
merge. Regression coverage checks those details alongside script, key order and
token inventories. Technical wording remains low confidence pending speaker review.
Browser checks were not run; further Odia translations remain.

## Odia screen-reader and shortcut commands

Filled 21 English placeholders for variable renaming, screen-reader modes and
workspace shortcuts. Preserved variable/shortcut tokens and distinguished current
on/off state from the action to toggle it. Existing translations were retained by
the placeholder-only merge. Regression coverage checks state/action distinctions,
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations remain.

## Odia directional keyboard shortcuts

Filled 22 English placeholders for directional movement, scrolling, stack and page
navigation. Preserved opposing directions and distinctions between movement and
scrolling. Existing translations were retained by the placeholder-only merge.
Regression coverage checks directional consistency, distinct navigation targets,
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations remain.

## Odia text case and character selection

Filled 20 English placeholders for shortcut help, text appending, case conversion
and character selection. Preserved indexed roles, position markers and copy
semantics. Case conversion wording refers to letter case rather than font size.
The placeholder-only merge retained existing translations. Regression coverage
checks these details alongside script, key order and token inventories. Technical
wording remains low confidence pending speaker review. Browser checks were not
run; further Odia translations remain.

## Odia text joining and substrings

Filled 22 English placeholders for text joining, substring selection and search.
Preserved index markers, first/last search distinctions, not-found return tokens
and the first-text-in-second-text relationship. Existing translations were retained
by the placeholder-only merge. Regression coverage checks these details alongside
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations remain.

## Odia text replacement and whitespace

Filled 21 English placeholders for text prompts, replacement, reversal, trimming
and basic editor labels. Preserved indexed replacement roles, replacement of all
occurrences, spaces in length counts and trimming at text ends. Existing
translations were retained by the placeholder-only merge. Regression coverage
checks these details alongside script, key order and token inventories. Technical
wording remains low confidence pending speaker review. Browser checks were not
run; further Odia translations remain.

## Odia variable warnings and workspace counts

Filled 19 English placeholders for variables and workspace announcements. Preserved
variable/type/procedure references, zero/one/many stack counts, comment suffix
spacing and indexed tokens. Existing translations were retained by the placeholder-only
merge. Regression coverage checks those details alongside script and key order.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Odia translations remain.

## Odia workspace search and shared labels

Filled 21 English placeholders for workspace search, shared block labels and the
rule-editor tab. Preserved keyboard shortcut names, match index/total roles and
consistent duplicate labels. Existing translations were retained by the placeholder-only
merge. Regression coverage checks these details alongside script, key order and
token inventories. Technical wording remains low confidence pending speaker review.
Browser checks were not run; rule-editor help and further translations remain.

## Odia rule editor guidance

Filled nine English placeholders for rule editing, validation and permissions.
Preserved the one-trigger/one-action requirement, administrator permission and
reload-before-save conflict guidance. Existing translations were retained by the
placeholder-only merge. Regression coverage checks restrictions and state labels
alongside script, key order and token inventories. Technical wording remains low
confidence pending speaker review. Browser checks were not run; further Odia
feature translations remain.

## Odia Scrum planning settings

Filled 28 English placeholders for Scrum roles, planning settings, completion
policies and sprint actions. Preserved distinct estimate source/unit labels and
start/close/cancel actions. Existing translations were retained by the placeholder-only
merge. Regression coverage checks shared label consistency and semantic distinctions,
alongside script, key order and token inventories. Technical wording remains low
confidence pending speaker review. Browser checks were not run; further Odia
Scrum translations remain.

## Odia sprint reports and events

Filled 30 English placeholders for sprint goals, events, report categories and
state labels. Preserved report placeholders, minute units and the distinction
between unknown and zero estimates. Existing translations were retained by the
placeholder-only merge. Regression coverage checks report caveats and event/state
distinctions alongside script, key order and token inventories. Technical wording
remains low confidence pending speaker review. Browser checks were not run; further
Odia translations remain.

## Odia sprint lifecycle and observations

Filled 25 English placeholders for sprint states, closing/cancellation and daily
observations. Preserved partial-report restrictions, UTC days, the 366 observation
limit, missing-day omissions and unknown estimates. Existing translations were
retained by the placeholder-only merge. Regression coverage checks these details
alongside script, key order and token inventories. Technical wording remains low
confidence pending speaker review. Browser checks were not run; further translations
remain.

## Odia sync conflict guidance

Filled 16 English placeholders: the remaining Scrum import warning and initial
sync conflict guidance. Preserved local/source distinctions, no-source-write
assurance, review-only scope and unchanged subcards. The placeholder-only merge
retained existing translations. Regression coverage checks these restrictions
alongside script, key order and token inventories. Technical wording remains low
confidence pending speaker review. Browser checks were not run; further sync
translations and the broader language audit remain unfinished.

## Odia sync preview guidance

Filled 18 English placeholders for replacement cards, sync previews and omitted
fields. Preserved unchanged previous cards, replacement reuse, the 100-entry
limit and parser omission caveats. Existing translations were retained by the
placeholder-only merge. Regression coverage checks these details alongside script,
key order and token inventories. Technical wording remains low confidence pending
speaker review. Browser checks were not run; further sync translations remain.

## Odia source omissions and sync reports

Filled 18 English placeholders for source-field omissions and sync run reports.
Preserved hidden object values, the 100-path limit, 20-run/30-day retention and
partial-change warnings. Existing translations were retained by the placeholder-only
merge. Regression coverage checks report limits and the no-resume/no-undo caveat
alongside script, key order and token inventories. Technical wording remains low
confidence pending speaker review. Browser checks were not run; further translations
remain.

## Odia sync diagnostics and estimate mapping

Filled 12 English placeholders for diagnostics, report access and Jira estimate
mapping. Preserved the 30-day period, ID/Jira/null identifiers, hour units,
exactly-one-field requirement and missing-versus-null distinction. Existing
translations were retained by the placeholder-only merge. Regression coverage
checks those details alongside script, key order and token inventories. Technical
wording remains low confidence pending speaker review. Browser checks were not
run; further Odia translations remain.

## Odia email failures and notification recovery

Filled 36 English placeholders for email failures and activity notification
recovery. Preserved SMTP identifiers, temporary versus permanent failures,
retained pending work, retry limitations and irreversible cancellation caveats.
Existing translations were retained by the placeholder-only merge. Regression
coverage checks script, key order, token inventories and those distinctions.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; the broader translation audit remains unfinished.

## Odia short labels and keyboard announcements

Filled 37 remaining English labels, including short Blockly words omitted by the
usual missing-string filter, spoken mathematical constants and keyboard names.
Preserved indexed announcement tokens, menu symbol and list index marker.
Operating-system brands, null and trigonometric function notation remain literal.
The merge filled 18 keyboard names; 19 filter-excluded English values were
filled directly after verifying equality with English. Existing translations were
retained. Regression coverage checks script, token inventories, key order and
repeated control labels.
Keyboard transliterations and technical wording remain low confidence pending
speaker review. Browser and screen-reader checks were not run.

## Maithili Blockly colours and loop controls

Filled 31 English placeholders for block controls, colour selection and loop
instructions. Preserved colour bounds and indexed variable/function/list tokens.
The placeholder-only merge retained existing translations. Regression coverage
checks script, key order, token inventories and loop-control distinctions.
Technical terminology remains low confidence pending speaker review. Browser
checks were not run; further Maithili strings and the broader audit remain.

## Maithili conditions and block editing

Filled 36 English values for conditional branches, repetition and block editing.
Short labels excluded by the fill filter were changed directly only after checking
that they still matched English. Preserved indexed tokens, deletion counts,
true/false loop conditions and final fallback branches. Regression coverage checks
script, key order, token inventories and these semantic distinctions. Technical
wording remains low confidence pending speaker review. Browser checks were not
run; further Maithili translations and the broader audit remain unfinished.

## Maithili input and accessibility labels

Filled 34 English values for bitmap controls, accessible field announcements and
list inputs. Filter-excluded short labels were changed directly only after checking
that they matched English. Preserved indexed row/column roles, repeated-value
versus repetition-count labels and open/close actions. Regression coverage checks
script, key order, token inventories and those distinctions. Technical wording
remains low confidence pending speaker review. Browser and screen-reader checks
were not run; further Maithili translations and the broader audit remain.

## Maithili mathematical and text input labels

Filled 32 English placeholders for list, loop, mathematical and text inputs.
The placeholder-only merge preserved existing translations. Preserved coordinate
axes, indexed value tokens and distinctions between dividend/divisor, minimum/
maximum and start/end positions. Regression coverage checks these details, script,
key order and token inventories. Technical wording remains low confidence pending
speaker review. Browser checks were not run; the broader audit remains unfinished.

## Maithili list creation and keyboard navigation

Filled 29 English placeholders for value inputs, keyboard navigation and list
creation/retrieval. The placeholder-only merge preserved existing translations.
Preserved indexed key roles, empty-list length, index marker and distinct get,
remove and get-and-remove actions. Regression coverage checks those distinctions,
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser and screen-reader checks were not run; further
Maithili translations and the broader audit remain unfinished.

## Maithili list removal, indexing and sublists

Filled 26 English values for list removal, sublists, search and length. Existing
translations were retained; filter-excluded short labels were changed directly
only after verifying equality with English. Preserved index markers, missing-item
return tokens and distinctions between removal and removal with a returned value.
Regression coverage checks those details, script, key order and token inventories.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Maithili translations and the broader audit remain.

## Maithili list editing and sorting

Filled 28 English values for repetition, insertion, replacement, sorting and
splitting/joining lists. Existing translations were retained; filter-excluded
short labels were filled directly after verifying equality with English. Preserved
indexed item/count roles, copy semantics and case-insensitive sorting meaning.
Regression coverage checks those details, script, key order and token inventories.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Maithili translations and the broader audit remain.

## Maithili logic controls and comparisons

Filled 25 English values for Boolean operations, comparisons, negation and
conditional values. Existing translations were retained; filter-excluded short
labels were filled directly only after checking equality with English. Preserved
null, indexed tokens, inclusive comparisons and both-versus-at-least-one meaning.
Regression coverage checks those distinctions, script, key order and tokens.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Maithili translations and the broader audit remain.

## Maithili arithmetic and number properties

Filled 28 English values for arithmetic, constants, bounded numbers and number
properties. Existing translations were retained; filter-excluded spoken constants
were filled directly only after checking equality with English. Preserved numeric
constants, coordinate roles, angle bounds and inclusive limits. Regression coverage
checks these details, script, key order and token inventories. Technical wording
remains low confidence pending speaker review. Browser checks were not run;
further Maithili translations and the broader audit remain unfinished.

## Maithili statistical functions

Filled 24 English placeholders for remainders, statistical functions and spoken
mathematical operators. The placeholder-only merge retained existing translations.
Preserved division tokens and distinctions between mean, median, modes and standard
deviation, including the list returned for modes. Regression coverage checks those
details, script, key order and token inventories. Statistical terminology remains
low confidence pending speaker review. Browser checks were not run; further
Maithili translations and the broader audit remain unfinished.

## Maithili rounding and random numbers

Filled 24 English placeholders for random numbers, rounding, powers, logarithms
and spoken operators. The placeholder-only merge retained existing translations.
Preserved inclusive/exclusive random bounds, indexed limits and e/base-10 notation.
Regression coverage checks those details, distinct rounding directions, script,
key order and token inventories. Mathematical terminology remains low confidence
pending speaker review. Browser checks were not run; further Maithili translations
and the broader audit remain unfinished.

## Maithili trigonometry and variable controls

Filled 26 English placeholders for trigonometry, workspace movement, variable
creation and paste controls. The placeholder-only merge retained existing
translations. Preserved degree-versus-radian caveats, distinct variable types and
parent-block tokens. Regression coverage checks those details, script, key order
and token inventories. Technical terminology remains low confidence pending
speaker review. Browser and screen-reader checks were not run; further Maithili
translations and the broader audit remain unfinished.

## Maithili procedure and rename controls

Filled 25 English values for procedure definitions, calls, parameters and variable
renaming. Existing translations were retained; the filter-excluded short title
was filled directly after verifying equality with English. Preserved function-name
tokens, output/no-output distinctions and disabled-definition warnings. Regression
coverage checks these details, script, key order and token inventories. Technical
wording remains low confidence pending speaker review. Browser checks were not
run; further Maithili translations and the broader audit remain unfinished.

## Maithili screen-reader and shortcut labels

Filled 29 English placeholders for screen-reader mode and keyboard navigation.
The placeholder-only merge retained existing translations. Preserved toggle-key
tokens and distinct enabled/disabled, start/end, previous/next and directional
actions. Regression coverage checks those details, script, key order and tokens.
Technical wording remains low confidence pending speaker review. Browser and
screen-reader checks were not run; further Maithili translations and the broader
audit remain unfinished.

## Maithili shortcuts and text case

Filled 24 English placeholders for navigation shortcuts, text appending, letter
case and character selection. The placeholder-only merge retained existing
translations. Preserved indexed append roles, character index markers, copy
semantics and distinct letter-case operations. Regression coverage checks those
details, script, key order and token inventories. Technical wording remains low
confidence pending speaker review. Browser and screen-reader checks were not run;
further Maithili translations and the broader audit remain unfinished.

## Maithili substrings and text search

Filled 24 English placeholders for text extraction, counting, joining and search.
The placeholder-only merge retained existing translations. Preserved indexed
search/count roles, character index markers and missing-match return tokens.
Regression coverage checks those details, script, key order and token inventories.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Maithili translations and the broader audit remain.

## Maithili text processing and input prompts

Filled 25 English placeholders for text processing, input prompts and basic
variable controls. The placeholder-only merge retained existing translations.
Preserved replacement-token roles, all-occurrence behavior, spaces in length
counts and trimming from one or both ends. Regression coverage checks these
details, script, key order and tokens. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further Maithili translations
and the broader audit remain unfinished.

## Maithili variable warnings and workspace search

Filled 28 English values for variable warnings, workspace counts and search.
Existing translations were retained; short control aliases excluded by the filter
were filled directly after verifying equality with English. Preserved name/type
roles, count and comment tokens, search-key names and match tokens. Regression
coverage checks those details, script, key order and token inventories. Technical
wording remains low confidence pending speaker review. Browser and screen-reader
checks were not run; further Maithili translations and the broader audit remain.

## Maithili Blockly aliases and rule editor

Filled 25 English values for repeated Blockly labels and rule-editor messages.
Existing translations were retained; short aliases excluded by the filter were
filled directly after verifying equality with English. Preserved one-trigger/
one-action validation, permission requirements and reload-before-save guidance.
Regression coverage checks those details, alias consistency, script, key order
and token inventories. Technical wording remains low confidence pending speaker
review. Browser checks were not run; the broader translation audit continues.

## Maithili Scrum settings and sprint labels

Filled 30 English placeholders for Scrum roles, planning settings and sprint
actions. The placeholder-only merge retained existing translations. Preserved
numeric-field meaning, distinct completion policies and separate start/close/
cancel actions. Regression coverage checks those details, repeated labels, script,
key order and token inventories. Scrum terminology remains low confidence pending
speaker review. Browser checks were not run; further Maithili translations and
the broader audit remain unfinished.

## Maithili sprint reports and planning messages

Filled 30 English placeholders for sprint events, reports, backlog planning and
states. The placeholder-only merge retained existing translations. Preserved
minute units, report count/estimate/unknown tokens and the distinction between
unknown and zero estimates. Regression coverage checks those details, separate
states, script, key order and token inventories. Scrum terminology remains low
confidence pending speaker review. Browser checks were not run; further Maithili
translations and the broader audit remain unfinished.

## Maithili sprint observations and partial reports

Filled 21 English placeholders for sprint closure, partial reports and daily
observations. The placeholder-only merge retained existing translations. Preserved
source-reference tokens, UTC, the 366-observation limit and the first-observation
versus end-of-day distinction. Regression coverage checks report limitations,
script, key order and token inventories. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further Maithili translations
and the broader audit remain unfinished.

## Maithili sync conflicts and import caveats

Filled 23 English placeholders for remaining Scrum caveats, sync conflicts and
preview headings. The placeholder-only merge retained existing translations.
Preserved UTC, WeKan, local-data retention, unchanged subcards, review scope and
replacement reuse. Regression coverage checks those details, script, key order
and token inventories. Technical wording remains low confidence pending speaker
review. Browser checks were not run; further Maithili translations and the broader
audit remain unfinished.

## Maithili sync preview and source fields

Filled 20 English placeholders for sync previews and omitted source fields.
The placeholder-only merge retained existing translations. Preserved the 100-entry
limit, parser omission caveats and hidden values for unmapped objects. Regression
coverage checks those details, repeated labels, script, key order and tokens.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Maithili translations and the broader audit remain.

## Maithili sync reports and diagnostics

Filled 21 English placeholders for sync reports, diagnostics and estimate mapping.
The placeholder-only merge retained existing translations. Preserved report limits,
retention, partial-change caveats, write-access requirements and missing-versus-null
behavior. Regression coverage checks those details, script, key order and tokens.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Maithili translations and the broader audit remain.

## Maithili email failures and notification recovery

Filled 38 English placeholders for email failures, notification recovery and the
remaining sync time-estimate guidance. The placeholder-only merge retained existing
translations. Preserved SMTP/Jira/null identifiers, hour units, exactly-one-field
requirements, retained pending work and irreversible cancellation caveats.
Regression coverage checks those details, script, key order and tokens. Technical
wording remains low confidence pending speaker review. Browser checks were not
run; the broader translation audit remains unfinished.

## Maithili storage settings omitted by the fill filter

Filled 29 English-identical storage and general labels found by comparing the
complete locale with English, including product-prefixed descriptions omitted by
the usual missing-string filter. Direct edits first verified equality with English
and retained existing translations. Preserved service names, protocol identifiers
and endpoint examples. Regression coverage checks these details, script, key order
and tokens. Technical wording remains low confidence pending speaker review.
Browser checks were not run; the broader translation audit remains unfinished.

## Maithili keyboard announcements and short labels

Filled 21 English values for keyboard names, indexed movement announcements,
planning poker and the current-user choice. Existing translations were retained;
filter-excluded labels were filled directly only after verifying equality with
English. Preserved indexed announcement roles and the menu symbol. Regression
coverage checks those details, script, key order and tokens. Keyboard
transliterations remain low confidence pending speaker review. Browser and
screen-reader checks were not run; the broader translation audit remains unfinished.

## Maithili short rule and count fragments

Filled seven English-identical fragments omitted by the missing-string filter.
Inspected rule sorting, actor inputs, email recipient placeholders and count
labels before selecting wording. Direct edits verified equality with English and
retained existing translations. Regression coverage checks recipient/count alias
consistency, distinct actor/sort labels, script, key order and tokens. Fragment
word order remains low confidence pending speaker review in the assembled UI.
Browser checks were not run; the broader translation audit remains unfinished.

## Konkani Blockly colours and block controls

Filled 20 English placeholders for Blockly colour selection and block controls.
The placeholder-only merge retained existing translations. Preserved colour bounds
and indexed variable/function roles. Regression coverage checks those details,
script, key order and token inventories. Technical terminology remains low
confidence pending speaker review. Browser checks were not run; further Konkani
translations and the broader audit remain unfinished.

## Konkani loops and conditional controls

Filled 27 English values for loop execution, conditional branches and block copying.
Existing translations were retained; short labels excluded by the filter were
filled directly after verifying equality with English. Preserved indexed loop
roles, true/false conditions and fallback branches. Regression coverage checks
those details, script, key order and tokens. Technical terminology remains low
confidence pending speaker review. Browser checks were not run; further Konkani
translations and the broader audit remain unfinished.

## Konkani block editing and bitmap controls

Filled 25 English values for editing, deletion and bitmap controls. Existing
translations were retained; filter-excluded short labels were filled directly
after verifying equality with English. Preserved deletion counts, variable names,
bitmap dimensions and row/column roles. Regression coverage checks those details,
opposite actions, script, key order and tokens. Technical wording remains low
confidence pending speaker review. Browser checks were not run; further Konkani
translations and the broader audit remain unfinished.

## Konkani input and accessibility labels

Filled 29 English placeholders for accessible fields, editor controls and list
inputs. The placeholder-only merge retained existing translations. Preserved
indexed field roles, opposite open/close actions and distinct value/count and
start/end inputs. Regression coverage checks those details, script, key order
and token inventories. Technical wording remains low confidence pending speaker
review. Browser and screen-reader checks were not run; further Konkani translations
and the broader audit remain unfinished.

## Konkani mathematical and text input labels

Filled 32 English placeholders for list, loop, mathematical and text inputs.
The placeholder-only merge retained existing translations. Preserved coordinate
axes, indexed values and distinct dividend/divisor, minimum/maximum and start/end
roles. Regression coverage checks those details, script, key order and tokens.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Konkani translations and the broader audit remain.

## Konkani keyboard navigation and list creation

Filled 24 English placeholders for navigation, value inputs and list creation.
The placeholder-only merge retained existing translations. Preserved key-token
roles, empty-list length, index markers and distinct retrieval actions. Regression
coverage checks these details, script, key order and token inventories. Technical
wording remains low confidence pending speaker review. Browser and screen-reader
checks were not run; further Konkani translations and the broader audit remain.

## Konkani list retrieval, removal and sublists

Filled 23 English values for list retrieval, removal and sublists. Existing
translations were retained; the filter-excluded short index label was filled
directly after verifying equality with English. Preserved return-versus-removal
semantics, index markers and copy behavior. Regression coverage checks those
details, script, key order and tokens. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further Konkani translations
and the broader audit remain unfinished.

## Konkani list search, editing and sorting

Filled 27 English placeholders for list search, repetition, editing and sorting.
The placeholder-only merge retained existing translations. Preserved missing-item
return tokens, item/count roles, copy behavior and distinct insertion/replacement
actions. Regression coverage checks those details, script, key order and tokens.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Konkani translations and the broader audit remain.

## Konkani list conversion and comparisons

Filled 24 English placeholders for splitting/joining lists, Boolean values and
comparisons. The placeholder-only merge retained existing translations. Preserved
delimiter behavior, inclusive comparisons and negation of true/false values.
Regression coverage checks those details, script, key order and token inventories.
Technical wording remains low confidence pending speaker review. Browser checks
were not run; further Konkani translations and the broader audit remain.

## Konkani logic and arithmetic controls

Filled 22 English values for Boolean conditions, arithmetic and spoken constants.
Existing translations were retained; filter-excluded short labels were filled
directly after checking equality with English. Preserved null, atan2, coordinate
roles, angle bounds and both-versus-at-least-one conditions. Regression coverage
checks those details, script, key order and tokens. Technical wording remains low
confidence pending speaker review. Browser checks were not run; further Konkani
translations and the broader audit remain unfinished.

## Konkani constants and number properties

Filled 21 English values for constants, bounded numbers, number properties and
remainders. Existing translations were retained; the spoken pi label was filled
directly after verifying equality with English. Preserved numeric constants,
inclusive limits and remainder operands. Regression coverage checks these details,
script, key order and tokens. Mathematical terminology remains low confidence
pending speaker review. Browser checks were not run; further Konkani translations
and the broader audit remain unfinished.

## Konkani statistics and random-number bounds

Filled 24 English placeholders for statistical functions, random numbers and
rounding. The placeholder-only merge retained existing translations. Preserved
mean/median/mode distinctions, the list returned for modes, inclusive/exclusive
bounds and separate rounding directions. Regression coverage checks those details,
script, key order and tokens. Statistical terminology remains low confidence
pending speaker review. Browser checks were not run; further Konkani translations
and the broader audit remain unfinished.

## Konkani powers, logarithms and trigonometry

Filled 29 English placeholders for mathematical functions and spoken operators.
The placeholder-only merge retained existing translations. Preserved e/base-10
notation, sign reversal and degree-versus-radian caveats. Regression coverage
checks those details, script, key order and tokens. Mathematical terminology
remains low confidence pending speaker review. Browser checks were not run;
further Konkani translations and the broader audit remain unfinished.

## Konkani workspace navigation and function definitions

Filled 34 English placeholders for navigation, typed variables and functions.
The placeholder-only merge retained existing translations. Regression coverage
checks return-value distinctions, disabled-definition and scope warnings,
distinct variable types, script, key order and tokens. Technical terminology
remains low confidence pending speaker review. Browser checks were not run;
further Konkani translations and the broader audit remain unfinished.

## Konkani accessibility shortcuts and text controls

Filled 67 English placeholders for accessibility announcements, navigation
shortcuts and text operations. The placeholder-only merge retained existing
translations. Regression coverage checks mode-state reversals, move-versus-scroll
actions, navigation endpoints, letter-case forms and text operand roles, plus
script, key order and tokens. Technical wording remains low confidence pending
speaker review. Browser and screen-reader checks were not run; further Konkani
translations and the broader audit remain unfinished.

## Konkani text search and variable assignments

Filled 47 English placeholders for text operations, variable assignments and
name-collision warnings. The placeholder-only merge retained existing
translations. Regression coverage checks not-found results, replacement operand
roles, whitespace boundaries, substring direction and collision contexts, plus
script, key order and tokens. Technical wording remains low confidence pending
speaker review. Browser checks were not run; further Konkani translations
and the broader audit remain unfinished.

## Konkani workspace announcements and rule editor

Filled 40 English placeholders for workspace counts, search controls and rule
editing. The placeholder-only merge retained existing translations. Regression
coverage checks composed block/comment counts, keyboard instructions, search
position roles, invalid-graph guidance, conflicts and administrator permissions,
plus script, key order and tokens. Technical wording remains low confidence
pending speaker review. Browser and screen-reader checks were not run;
further Konkani translations and the broader audit remain unfinished.

## Konkani Scrum planning

Filled 48 English placeholders for Scrum roles, planning, completion policies,
estimates and events. The placeholder-only merge retained existing translations.
Regression coverage checks policy distinctions, sprint actions, event labels,
estimate sources versus units, timebox units and planned/active assignment,
plus script, key order and tokens. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further Konkani
translations and the broader audit remain unfinished.

## Konkani sprint reports and daily observations

Filled 36 English placeholders for sprint reports, lifecycle states, partial
snapshots and daily observations. The placeholder-only merge retained existing
translations. Regression coverage checks unknown-versus-zero estimates,
comparable units and policies, membership retention, partial-report scope,
UTC sampling, missing days, export destinations and the 366-observation limit,
plus script, key order and tokens. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further Konkani
translations and the broader audit remain unfinished.

## Konkani Sync conflicts and previews

Filled 41 English placeholders for Sync conflicts, previews and source omissions.
The placeholder-only merge retained existing translations. Regression coverage
checks local-content retention, unchanged subcards, replacement reuse, no writes
to the source, partial review, preview limits and hidden values, plus script,
key order and tokens. Technical wording remains low confidence pending speaker
review. Browser checks were not run; further Konkani translations and the
broader audit remain unfinished.

## Konkani Sync reports, estimates and mail diagnostics

Filled 31 English placeholders for run reports, estimate mappings and mail
failures. The placeholder-only merge retained existing translations. Regression
coverage checks retention limits, uncertain outcomes, lack of resume/undo,
write-access requirements, missing-versus-null estimates, hour units and
delivery uncertainty, plus script, key order and tokens. Technical wording
remains low confidence pending speaker review. Browser checks were not run;
further Konkani translations and the broader audit remain unfinished.

## Konkani notification recovery

Filled 27 English placeholders for notification delivery recovery and controls.
The placeholder-only merge retained existing translations. Regression coverage
checks that retries never recreate activities, pending work is retained,
recipient restrictions remain effective, and permanent cancellation cannot
resume or recall queued email and delivered notifications, plus script,
key order and tokens. Technical wording remains low confidence pending
speaker review. Browser checks were not run; the excluded-English audit,
further Konkani translations and the broader audit remain unfinished.

## Konkani excluded-English storage and system labels

The full English-identical audit found prose omitted by the fill tool.
Filled 33 storage, system and general labels directly after asserting each
value still matched English; existing translations were retained. Coverage
checks service names, endpoint examples, configuration distinctions, script,
key order and tokens. Technical wording remains low confidence pending
speaker review. Browser checks were not run. Short labels and keyboard
names still need work; the wider language audit remains unfinished.

## Konkani keyboard names and short Blockly labels

Filled 27 English-identical values, including short labels omitted by the fill
tool, after asserting each still matched English. Existing translations were
retained. Keyboard names retain recognizable key markings with a Konkani
key label. Coverage checks markings, ordinal roles, consistent procedure
labels, control clauses, script, key order and tokens. Technical wording
remains low confidence pending speaker review. Browser and screen-reader
checks were not run; other short labels and the broader audit remain unfinished.

## Konkani short rule and board labels

Filled nine English-identical labels after checking sorting, actor, mail
recipient and count fragments in their templates. Existing translations were
retained. Coverage checks recipient/actor distinctions, shared total labels,
script and tokens. Assembled sentence order and technical wording remain
low confidence pending speaker review. Browser checks were not run; the
broader language and fluency audit remains unfinished.

## Turkmen Blockly colours and initial controls

Filled 24 English placeholders for block controls, colours and loop exits.
The placeholder-only merge retained existing translations. Coverage checks
colour bounds, variable/function token roles, deletion restrictions, warnings
and break-versus-continue behavior, plus key order and token inventories.
Technical wording remains low confidence pending speaker review. Browser
checks were not run. Further Turkmen translations and the wider fluency
audit remain unfinished.

## Turkmen loops, conditions and editing

Filled 35 English placeholders for loops, conditional branches and block editing.
The placeholder-only merge retained existing translations. Coverage checks
true/false loop conditions, fallback branches, count bounds, list/item roles,
deletion confirmation operands and distinct editing actions, plus key order
and token inventories. Technical wording remains low confidence pending
speaker review. Browser checks were not run; further Turkmen translations
and the broader audit remain unfinished.

## Turkmen editing and input labels

Filled 44 English placeholders for bitmap editing, accessibility actions and
input labels. The placeholder-only merge retained existing translations.
Coverage checks bitmap dimensions and coordinates, open/close actions,
condition and position distinctions, list/text roles and keyboard hints,
plus key order and tokens. Technical wording remains low confidence pending
speaker review. Browser and screen-reader checks were not run; further
Turkmen translations and the broader audit remain unfinished.

## Turkmen mathematical inputs and keyboard navigation

Filled 38 English placeholders for mathematical and text operands, value
positions and keyboard navigation. The placeholder-only merge retained existing
translations. Coverage checks dividend/divisor distinctions, bounds, coordinates,
search/replacement roles and held-key versus confirmation shortcuts, plus key
order and tokens. Technical wording remains low confidence pending speaker
review. Browser and screen-reader checks were not run; further Turkmen
translations and the broader audit remain unfinished.

## Turkmen list retrieval and removal

Filled 33 English placeholders for list creation, retrieval, removal and sublists.
The placeholder-only merge retained existing translations. Coverage checks
retrieval versus removal, combined operations, empty-list length, copied
sublists and indexing from the end, plus key order and token inventories.
Technical wording remains low confidence pending speaker review. Browser
checks were not run; further Turkmen translations and the broader audit
remain unfinished.

## Turkmen list search, updates and sorting

Filled 31 English placeholders for list search, insertion, replacement and
sorting. The placeholder-only merge retained existing translations. Coverage
checks not-found results, repetition operands, insertion versus assignment,
copied lists, sort directions and letter-case handling, plus key order and
tokens. Technical wording remains low confidence pending speaker review.
Browser checks were not run; further Turkmen translations and the broader
audit remain unfinished.

## Turkmen comparisons and Boolean logic

Filled 33 English placeholders for text/list conversion, comparisons, Boolean
logic and initial arithmetic help. The placeholder-only merge retained existing
translations. Coverage checks equality boundaries, negation, both-versus-any
conditions, ternary labels, null notation and delimiter roles, plus key order
and tokens. Technical wording remains low confidence pending speaker review.
Browser checks were not run; further Turkmen translations and the broader
audit remain unfinished.

## Turkmen arithmetic and number properties

Filled 29 English placeholders for arithmetic, constants, number properties
and initial aggregate labels. The placeholder-only merge retained existing
translations. Coverage checks mathematical notation, angle units, inclusive
bounds, remainder operands and distinct number properties, plus key order
and tokens. Mathematical terminology remains low confidence pending speaker
review. Browser checks were not run; further Turkmen translations and the
broader audit remain unfinished.

## Turkmen statistics and rounding

Filled 29 English placeholders for statistical aggregates, random numbers,
rounding and initial function labels. The placeholder-only merge retained
existing translations. Coverage checks distinct aggregates, the mode's list
result, inclusive/exclusive random bounds, rounding directions and logarithm
bases, plus key order and tokens. Mathematical terminology remains low
confidence pending speaker review. Browser checks were not run; further
Turkmen translations and the broader audit remain unfinished.

## Turkmen mathematical functions and initial workspace controls

Filled 27 English placeholders for powers, logarithms, trigonometry and
workspace controls. The placeholder-only merge retained existing translations.
Coverage checks logarithm bases, sign reversal, degree-versus-radian caveats,
inverse functions and variable-type distinctions, plus key order and tokens.
Mathematical terminology remains low confidence pending speaker review.
Browser checks were not run; further Turkmen translations and the broader
audit remain unfinished.

## Turkmen variables and function controls

Filled 36 English placeholders for variables, function definitions and workspace
actions. The placeholder-only merge retained existing translations. Coverage
checks return-value distinctions, disabled definitions, scope restrictions,
conditional returns, variable types and accessibility shortcuts, plus key
order and tokens. Technical wording remains low confidence pending speaker
review. Browser and screen-reader checks were not run; further Turkmen
translations and the broader audit remain unfinished.

## Turkmen accessibility shortcuts

Filled 41 English placeholders for screen-reader states, navigation and editing
shortcuts. The placeholder-only merge retained existing translations. Coverage
checks mode-state reversals, block movement versus scrolling, movement
cancellation/completion, navigation endpoints and spoken information, plus
key order and tokens. Technical wording remains low confidence pending
speaker review. Browser and screen-reader checks were not run; further
Turkmen translations and the broader audit remain unfinished.

## Turkmen text operations and search

Filled 37 English placeholders for text creation, letter case, character
positions, substrings and search. The placeholder-only merge retained
existing translations. Coverage checks case forms, copied text, operand
roles, indexing from the end and not-found results, plus key order and
tokens. Technical wording remains low confidence pending speaker review.
Browser checks were not run; further Turkmen translations and the broader
audit remain unfinished.

## Turkmen text values and variable assignments

Filled 31 placeholders, including the concurrently added custom-colors-in-use
label. Existing translations were retained. Coverage checks replacement roles,
whitespace boundaries, assignment operands and variable-collision contexts,
plus key order and tokens. Of 53 checks, 51 passed; two repository-wide checks
failed because other locales lack the new English custom-colors-in-use key.
All 21 human-preference checks passed. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations
and the broader audit remain unfinished.

## Turkmen workspace announcements and rule editor

Filled 40 English placeholders for workspace counts, search and rule editing.
The placeholder-only merge retained existing translations. Coverage checks
composed counts, keyboard instructions, invalid connections, conflicts and
administrator permissions, plus key order and tokens. Of 54 checks, 52 passed;
two repository-wide checks still fail because other locales lack the new
custom-colors-in-use key. All 21 human-preference checks passed. Technical
wording remains low confidence pending speaker review. Browser and screen-reader
checks were not run; further translations and the broader audit remain unfinished.

## Turkmen Scrum planning

Filled 36 English placeholders for Scrum roles, planning, completion policies,
estimate settings and sprint actions. The placeholder-only merge retained
existing translations. Coverage checks policy and lifecycle distinctions,
source versus unit labels and planned/active assignment, plus key order and
tokens. Of 56 checks, 54 passed; two repository-wide checks still fail because
other locales lack custom-colors-in-use. All 21 human-preference checks passed.
Technical wording remains low confidence pending speaker review. Browser
checks were not run; further translations and the broader audit remain unfinished.

## Turkmen sprint events and reports

Filled 35 English placeholders for sprint events, reports and lifecycle states.
The placeholder-only merge retained existing translations. Coverage checks
unknown-versus-zero estimates, comparable units and policies, retained
membership, partial-report scope, lifecycle states and minute units, plus
key order and tokens. Of 57 checks, 55 passed; two repository-wide checks
still fail because other locales lack custom-colors-in-use. All 21
human-preference checks passed. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations
and the broader audit remain unfinished.

## Turkmen daily observations and import status

Filled 13 English placeholders for daily observations, partial snapshots and
import status. Existing translations were retained. Coverage checks UTC
sampling, missing days, unknown-versus-zero estimates, export destinations,
the 366-observation limit and unavailable import actions, plus key order and
tokens. Of 58 checks, 56 passed; two repository-wide checks still fail because
other locales lack custom-colors-in-use. All 21 human-preference checks passed.
Technical wording remains low confidence pending speaker review. Browser
checks were not run; further translations and the broader audit remain unfinished.

## Turkmen Sync conflicts

Filled 23 English placeholders for Sync conflicts and initial preview controls.
Existing translations were retained. Coverage checks no writes to the source,
local-content retention, unchanged subcards, replacement reuse and partial
review, plus key order and tokens. Of 60 checks, 58 passed; two repository-wide
checks still fail because other locales lack custom-colors-in-use. All 21
human-preference checks passed. Technical wording remains low confidence
pending speaker review. Browser checks were not run; further translations
and the broader audit remain unfinished.

## Turkmen Sync previews and run reports

Filled 29 English placeholders for source omissions, previews and run reports.
Existing translations were retained. Coverage checks entry/path limits,
retention, hidden values, no resume/undo and distinct outcomes, plus key order
and tokens. Of 61 checks, 59 passed; two repository-wide checks still fail
because other locales lack custom-colors-in-use. All 21 human-preference
checks passed. Technical wording remains low confidence pending speaker
review. Browser checks were not run; further translations and the broader
audit remain unfinished.

## Turkmen Sync diagnostics and mail failures

Filled 20 English placeholders for Sync diagnostics, estimate mappings and
mail failures. Existing translations were retained. Coverage checks write
access, uncertain outcomes, missing-versus-null values, hour units and
delivery uncertainty, plus key order and tokens. Of 62 checks, 60 passed;
two repository-wide checks still fail because other locales lack
custom-colors-in-use. All 21 human-preference checks passed. Technical wording
remains low confidence pending speaker review. Browser checks were not run;
further translations and the broader audit remain unfinished.

## Turkmen notification recovery

Filled 27 English placeholders for notification recovery and delivery controls.
Existing translations were retained. Removed the obsolete custom-colors-in-use
entry and its test reference after concurrent work removed that English key.
Coverage checks no activity recreation, retained pending work, recipient
restrictions and irreversible cancellation, plus key order and tokens.
All 64 translation checks and 21 human-preference checks pass. Technical
wording remains low confidence pending speaker review. Browser checks were
not run; the excluded-English audit and broader translation work remain unfinished.

## Turkmen excluded-English labels and keyboard names

Filled 38 English-identical labels, including short controls excluded by the
fill tool, after asserting each value still matched English. Existing
translations were retained. Keyboard names retain their printed markings.
Coverage checks ordinal roles, on/off states, consistent control clauses,
procedure labels, key order and tokens. All 65 translation checks and 21
human-preference checks pass. Technical wording remains low confidence pending
speaker review. Browser and screen-reader checks were not run; the broader
language and fluency audit remains unfinished.

## Moroccan Arabic Blockly colours and controls

Filled 20 Blockly placeholders and two concurrently added card-field visibility
labels. Existing translations were retained. Coverage checks colour ranges,
deletion restrictions, variable/function roles, script, key order and tokens.
Of 40 checks, 38 passed; two repository-wide checks fail because other locales
lack the new card-field-visibility keys. All 21 human-preference checks passed.
Technical wording remains low confidence pending speaker review. The older
catalog also needs dialect review. Browser and RTL checks were not run;
further translations and the broader audit remain unfinished.

## Moroccan Arabic Blockly loops and conditions

Filled 24 English placeholders without replacing existing translations. Regression
coverage checks source key order, Arabic script, placeholder inventories, break
versus continue, loop-only restrictions, true versus false conditions, the final
else branch and count-variable/bound/step ordering. Of 41 checks, 39 passed;
two repository-wide checks still fail because other locales lack the recently
added card-field-visibility keys. All 21 human-preference checks passed.
Technical Darija wording remains low confidence pending speaker review. Browser,
RTL and screen-reader checks were not run. Remaining placeholders and the older
catalog's dialect and semantic audit remain open.

## Moroccan Arabic workspace and accessible input labels

Filled 54 English placeholders and the short bitmap-on label excluded from the
ordinary listing. Existing translations were retained. Tests cover script,
source order and tokens, open/close and enable/disable actions, bitmap on/off,
row/column arguments, deletion count/variable roles and list start/end positions.
Of 42 checks, 40 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Further placeholders and
the broader dialect and semantic audit remain unfinished.

## Moroccan Arabic numeric inputs and keyboard navigation

Filled 52 placeholders covering numeric/text input roles, keyboard hints and
initial list controls, without replacing existing translations. Tests check
source order, Arabic script, placeholder inventories, dividend/divisor roles,
minimum/maximum, x/y coordinates, loop bounds, append-at-end, held-key and
position-acceptance arguments, empty-list length and indexing from the end.
Of 43 checks, 41 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader dialect and semantic audit remain open.

## Moroccan Arabic list retrieval and removal

Filled 42 English placeholders without replacing existing translations. Tests
check source order, Arabic script, tokens, retrieval without removal, removal
without a return value, combined retrieval/removal, first/last positions, copied
sublists and reversal, not-found results, repetition arguments and insertion
bounds. Of 44 checks, 42 passed; two repository-wide checks still fail because
other locales lack the new card-field-visibility keys. All 21 human-preference
checks passed. Technical Darija wording remains low confidence pending speaker
review. Browser, RTL and screen-reader checks were not run. Further placeholders
and the broader dialect and semantic audit remain unfinished.

## Moroccan Arabic list sorting and logic

Filled 45 ordinary placeholders and the short logical-or label, retaining
existing translations. Tests cover source order, script, tokens, strict versus
inclusive comparisons, inequality, negation, both versus at-least-one inputs,
conditional branch labels, sorting a copy, case-insensitive ordering and
joining versus splitting. Of 45 checks, 43 passed; two repository-wide checks
still fail because other locales lack the new card-field-visibility keys.
All 21 human-preference checks passed. Technical Darija wording remains low
confidence pending speaker review. Browser, RTL and screen-reader checks were
not run. Remaining placeholders and the broader language audit stay open.

## Moroccan Arabic math and statistics

Filled 50 English placeholders without replacing existing translations. Tests
check source order, script, tokens, inclusive/exclusive random bounds, constraint
arguments, angle units and range, base/exponent roles, remainder versus quotient,
mean/median/mode/deviation, number properties and unchanged constant formulas.
Of 46 checks, 44 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic math functions and workspace controls

Filled 43 placeholders without replacing existing translations. Tests check
source order, script, tokens, rounding direction, exponential/logarithm bases,
negation, direct/inverse trigonometric functions, degrees versus radians,
minimap navigation, absent parent blocks and colour/number/text variable types.
Of 47 checks, 45 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic procedures and accessibility controls

Filled 39 placeholders without replacing existing translations. Tests check
source order, script, tokens, functions with/without results, disabled definitions,
duplicate parameters, function-only return blocks, true-condition returns,
screen-reader state/toggle direction, rename-all scope and cancelled movement.
Of 48 checks, 46 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic navigation shortcuts and letter case

Filled 37 placeholders without replacing existing translations. Stack top/bottom
means the beginning/end of the block sequence. Tests check source order, script,
tokens, move/scroll directions, next/previous pages, append text/target arguments,
lower/upper/title case and copying text while changing letter case.
Of 49 checks, 47 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic text positions and replacement

Filled 42 placeholders without replacing existing translations. Tests check
source order, script, tokens, first/last and reverse-index positions, search
text/container roles, not-found results, spaces counted in text length,
replacement arguments and all-occurrence scope, character reversal and prompt
types. Of 50 checks, 48 passed; two repository-wide checks still fail because
other locales lack the new card-field-visibility keys. All 21 human-preference
checks passed. Technical Darija wording remains low confidence pending speaker
review. Browser, RTL and screen-reader checks were not run. Remaining placeholders
and the broader language audit stay open.

## Moroccan Arabic variables and workspace search

Filled 36 placeholders without replacing existing translations. Tests check
source order, script, tokens, trimming sides and copying, variable assignment
roles and name conflicts, composed workspace counts, next/previous search keys,
closing search with focus restored and match number/total/content arguments.
Of 51 checks, 49 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic rule editor and Scrum entry labels

Filled 31 placeholders without replacing existing translations. Tests check
source order, script, tokens, Blockly alias consistency, one-trigger/one-action
validation, disconnected/extra block removal, concurrent-edit reload warnings,
board-admin permission, unsaved-change discard and distinct Scrum roles.
Of 52 checks, 50 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija and Scrum terminology remain low confidence pending
speaker review. Browser, RTL and screen-reader checks were not run. Remaining
placeholders and the broader language audit stay open.

## Moroccan Arabic Scrum settings and sprint controls

Filled 31 placeholders without replacing existing translations. Tests check
source order, Arabic script, tokens, separate completion policies, start/close/
cancel actions, unfinished-work rollover scope, planned/active sprint assignment,
numeric custom-field estimates and consistency with board-view labels.
Of 54 checks, 52 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija and Scrum terminology remain low confidence pending
speaker review. Browser, RTL and screen-reader checks were not run. Remaining
placeholders and the broader language audit stay open.

## Moroccan Arabic sprint reports and events

Filled 36 placeholders without replacing existing translations. Tests check
source order, script, tokens, unknown estimates distinct from zero, comparable
estimate units/policies, unfinished-card destinations, retained membership after
cancellation, partial-report scope, omitted import references, minute units and
distinct sprint states and review/retrospective labels. Of 55 checks, 53 passed;
two repository-wide checks still fail because other locales lack the new
card-field-visibility keys. All 21 human-preference checks passed. Technical
Darija and Scrum terminology remain low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic daily observations and Sync conflicts

Filled 36 placeholders without replacing existing translations. Tests check
source order, script, tokens, first UTC-day observations, missing changes and
unknown estimates, 366-observation bounds, incomplete import restrictions,
no writes to source, partial review scope, mapping removal with content retained,
unchanged subcards, reused replacement cards and 100-entry preview limits.
Of 56 checks, 54 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic Sync previews and run reports

Filled 31 placeholders without replacing existing translations. Tests check
source order, script, tokens, normalized-source scope, hidden unmapped values,
100-path limits, 20-run/30-day retention, possible partial changes, no resume or
undo through reports, full-list write/server requirements and unfinished outcomes.
Of 57 checks, 55 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic estimates and notification recovery

Filled 31 placeholders without replacing existing translations. Tests check
source order, script, tokens, ignored missing values versus explicit-null clearing,
exactly one matching estimate field, hour units, temporary/permanent rejection,
unconfirmed delivery, no recreated activities and withdrawn recipient permission.
Of 59 checks, 57 passed; two repository-wide checks still fail because other
locales lack the new card-field-visibility keys. All 21 human-preference checks
passed. Technical Darija wording remains low confidence pending speaker review.
Browser, RTL and screen-reader checks were not run. Remaining placeholders and
the broader language audit stay open.

## Moroccan Arabic recovery completion and short-label audit

Filled 44 English-identical values: ten recovery messages, eighteen keyboard
names with printed key text retained, and sixteen short labels skipped by the
ordinary fill filter. Direct writes were limited to values still equal to English.
Tests check source order, script, tokens, permanent cancellation, no recall of
queued mail or delivered notifications, retained pending work, temporary pause,
keyboard names and matching Blockly aliases. Of 60 checks, 58 passed; two
repository-wide checks still fail because other locales lack the new card-field-
visibility keys. All 21 human-preference checks passed. The ordinary placeholder
list now retains technical names and notation. This does not complete the older
catalog's dialect or semantic audit. Technical wording remains low confidence;
speaker, browser, RTL and screen-reader review remain pending.

## Card-field visibility labels in eight languages

Added the two missing source keys in Finnish, Swedish, German, French, Spanish,
Portuguese, Italian and Dutch (16 translations). No existing translation was
overwritten. Source key order and placeholder inventories are checked, alongside
unchanged card data/settings, re-enabling fields and each board's field order.
Of 40 checks, 38 passed; two repository-wide checks still fail because other
locales lack these keys. All 21 human-preference checks passed. Browser checks
were not run. Menu wording and regional terminology remain open to speaker
review; the remaining catalogs and broader language audit are unfinished.

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
