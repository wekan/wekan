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
