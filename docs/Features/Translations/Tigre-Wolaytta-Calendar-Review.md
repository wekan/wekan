# Tigre and Wolaytta calendar review

Reviewed **2026-09-14**. All 17 original calendar findings in each locale
remain pending. This review changes the terminology research direction;
no translation is accepted or replaced from component evidence alone.

## Tigre: verify the base noun independently

Local `calendar` is `ዓውደ ኣዋርሕ`. The [Building Bridges bilingual calendar](https://saskliteracy.ca/wp-content/uploads/2021/05/Greetings-English-Tigrigna.pdf)
uses that exact phrase on its first page, explicitly labels its language
English–Tigrinya (`ትግርኛ`) and credits Sirak Kibreab. This establishes
Tigrinya usage, not Tigre usage. Shared script and a potentially shared noun
are insufficient to classify the local value as either correct or wrong.
Do not construct Tigre calendar-system labels using it until an independent
Tigre source establishes the noun and the relevant grammatical construction.

The [current CLDR Tigre source](https://raw.githubusercontent.com/unicode-org/cldr/main/common/main/tig.xml)
identifies locale `tig`, but its date section contains generic/Gregorian
formatting data rather than native calendar-system display names. Much of
that data is explicitly `draft="unconfirmed"`. English inherited chart
labels and unconfirmed month names do not establish the missing full labels.
A Tigre dictionary or native publication is the next required source.

## Wolaytta: unflagged English calendar noun

Local `calendar` is `Wolayttatto: Calendar`. A language-name prefix does not
translate the English noun. This additional key must be repaired along with
the original calendar findings, after locating usable native terminology.
It is not added as an unchanged acceptance or counted as a corrected finding.

## Context and remaining checks

Both `calendar-system` values are Azerbaijani `Kalendar sistem (data görünüşü)`.
In `client/components/users/userHeader.jade`, the label introduces the member's
calendar selection, distinct from date formatting. Repairs must preserve the
calendar-system/date-display meaning and the distinctions between civil,
astronomical and moon-sighting calendars, plus the exact proper names.
Full phrase review, token preservation, regression coverage and browser
settings verification remain required. No running-browser check was performed.
Counts remain 283 pending, 9 restored, 4,171 retained and 15,618 corrected;
the correction ledger still contains 18,687 entries.

## Wolaytta calendar noun repair — 2026-09-15

Local commit `12dfa02ae` repairs four unflagged English calendar nouns:
calendar, single-board and multiboard calendar views, and iCal export.
[Native Wolaytta Gifaataa article](https://incubator.wikimedia.org/w/index.php?title=Wp/wal/Gifaataa_(baalaa)&oldid=5971248)
explicitly pairs wodiyaa qoodaa with calendar in its native prose.
[Wolaytta kawotettaa](https://incubator.wikimedia.org/wiki/Wp/wal/Wolaytta_kawotettaa)
independently uses Wodiyaa Qoodaa in dating its historical period. The
general noun now replaces Wolayttatto: Calendar, whose prefix did not
translate English. Existing multiboard and iCal qualifiers are preserved.

The earlier unflagged-calendar pending note is superseded for this noun.
**Still open:** complete software-label grammar, the existing all-boards
qualifier and every specific calendar-system compound/epoch/sighting label.
Tigre terminology is not inferred from Wolaytta or Tigrinya. Four focused
suites pass for all four replacements, preserved qualifiers, placeholders,
key order, original provenance and newer human translations. No live
calendar-view browser test ran. Ledger 19,785; original pending 203,
including all 17 Wolaytta calendar-system findings; restored 4 unchanged.
Broader uncertain/unflagged reviews remain open. No remote push.

## Wolaytta Ethiopian calendar drafts — 2026-09-15

Local commit `b7f18f9ce` replaces English Ethiopian and Ethiopian Amete
Alem labels with Wolaytta drafts combining country and calendar terms.
[Native Wolaytta Moottaa](https://incubator.wikimedia.org/w/index.php?title=Wp/wal/Wolaytta_Moottaa&oldid=6829964)
uses Toophphiyaa as the country label and inflected Toophphiyan in prose;
Toophphiya also occurs in its regional heading. The previously documented
Gifaataa calendar noun wodiyaa qoodaa is reused. Amete Alem is retained
as the proper era name, distinguishing the two calendar selections.

**Low confidence:** the exact country-calendar construction is assembled,
not attested as a complete native calendar name. Country inflection, full
compound and proper-name adaptation still require native review. Four
focused suites pass for native components, preserved era, distinct labels,
exact placeholders, provenance and newer human translations. No live
calendar-selector UI run. Ledger 19,787; original corrected 15,702, pending
201 (Wolaytta 15), restored 4 unchanged. Broader uncertain and unflagged
review remains open; no remote push.

## Wolaytta Dangi and Minguo drafts — 2026-09-15

Local commit `af7388566` replaces English Dangi (Korean) and Republic of
China seeds with Dangi/Minguo plus the attested native calendar noun
wodiyaa qoodaa. The proper calendar names come directly from each English
source key; they are not claimed as dictionary-attested Wolaytta spellings.
The noun evidence remains
[the native Gifaataa article](https://incubator.wikimedia.org/w/index.php?title=Wp/wal/Gifaataa_(baalaa)&oldid=5971248),
which explicitly glosses wodiyaa qoodaa as calendar. Searches for country
spellings returned unrelated languages, including Oromo; those results
were excluded and did not justify these translations.

**Low confidence:** complete proper-name/calendar construction and local
proper-name adaptation require native review. Source names preserve both
calendar identities without relying on unverified country adjectives. Four
focused suites pass for distinct canonical names, noun, negative English
seed checks, placeholders, provenance and newer translations. No live UI
run. Ledger 19,789; original corrected 15,704, pending 199 (Wolaytta 13),
restored 4 unchanged. All broader uncertain review remains open. No push.

## Wolaytta generic and Umm al-Qura Hijri drafts — 2026-09-15

Local commit `ca3b8764b` replaces two English Islamic seeds with Hijri
plus native wodiyaa qoodaa, retaining Umm al-Qura on the specific variant.
[Current Unicode CLDR calendar definitions](https://raw.githubusercontent.com/unicode-org/cldr/main/common/bcp47/calendar.xml)
explicitly identify generic Hijri and Hijri Umm al-Qura as separate types.
The names are preserved from the English source; they are not claimed as
attested Wolaytta transliterations. Native calendar-noun evidence remains
[the Wolaytta Gifaataa article](https://incubator.wikimedia.org/w/index.php?title=Wp/wal/Gifaataa_(baalaa)&oldid=5971248).

**Low confidence:** borrowed-name adaptation and complete compound grammar
remain under native review. This does not resolve the tabular civil,
astronomical epoch or Saudi sighting labels, which retain separate required
qualifiers. Four focused suites pass for identity, variant distinction,
negative English-seed checks, placeholders, provenance and newer human
translations; no live calendar-selector UI run. Ledger 19,791; original
corrected 15,706, pending 197 (Wolaytta 11), restored 4 unchanged. All
broader uncertain/restored/unflagged review remains open. No push.

## Wolaytta calendar-system label draft — 2026-09-15

Local commit `c5738aa53` replaces Azerbaijani calendar-system prose with
a Wolaytta draft retaining calendar/method and the date-display qualifier.
Native Gifaataa prose supplies wodiyaa qoodaa and calendar-method maaraa
components; the existing locale date noun gallassaa is reused. The
[primary native publication title](https://www.jw.org/wal/laybreriyaa/jw-xanna%EA%9E%8Ciyo-xuufiya/laappune-2019-mwb/shiiquwaa-prograamiyaa-laa4-10/kiristtaane-siiquwaa-bessiyoogaa/)
and its search-indexed prose supply nominalized bessiyoogaa in a showing
love context. A direct page open timed out: do not claim the full source
was read. Other occurrences mean should/deserves and do not independently
prove a software display noun.

**Low confidence:** showing-to-display adaptation, date versus day noun,
calendar-system construction and complete qualifier grammar remain open.
UserHeader.jade line 348 renders this label above the selector. Four
focused suites pass for distinct system/date-display wording, negative
Azerbaijani checks, source registration, placeholders, provenance and newer
translations; no live selector UI run. Ledger 19,792; original corrected
15,707, pending 196 (Wolaytta 10), restored 4 unchanged. All broader
uncertain/restored/unflagged review remains open. No push.

## Full-source showing-word verification — 2026-09-15

The previously timed-out Wolaytta source was fetched successfully with a
bounded curl request into .tools/tmp/wolaytta-display-review/showing-love.html
(about 359 KiB). Its HTML declares lang=wal; the actual title, h1 and
bodyTxt text were inspected rather than relying on search snippets.
[Native article](https://www.jw.org/wal/laybreriyaa/jw-xanna%EA%9E%8Ciyo-xuufiya/laappune-2019-mwb/shiiquwaa-prograamiyaa-laa4-10/kiristtaane-siiquwaa-bessiyoogaa/)
uses bessiyoogaa in the showing-love title and bessiyo with kindness in
its body. The
[matching English article](https://www.jw.org/en/library/jw-meeting-workbook/march-2019-mwb/meeting-schedule-mar4-10/show-christian-love/)
has the same publication identifier 202019083 and confirms the show sense.
This supersedes the previous full-source-unread limitation for this page.

The native showing component in calendar-system is retained. **Still
open:** adapting showing to a software date display, date/day wording and
the complete calendar-method/qualifier construction. Reading this source
does not certify that full UI phrase. No locale value or acceptance
changes; original pending 196 (Wolaytta 10), restored 4, ledger 19,792.
Broader native, uncertain and unflagged reviews remain open. No push.

## Wolaytta dictionary catalogue verification — 2026-09-15

The advertised
[English–Welaytta dictionary B page](https://ethiopiadictionary.com/online-dictionary/?from=English&language=Welaytta&letter=B)
was opened and downloaded successfully to
.tools/tmp/wolaytta-dictionary-review/letter-b.html (about 260 KiB).
Its dictionary table contains 207 English headword rows and 207 empty
Welaytta target cells; direct HTML inspection confirms this is not merely
a web-parser omission. Buddhist does not occur in the fetched page.
The catalogue heading and English definitions therefore cannot justify
Wolaytta terminology, including the remaining Buddhist-calendar label.
This bounded observation does not prove the language lacks a term or that
every page of this dictionary is empty.

Searches for Buddhist spellings also returned unrelated-language material;
none was used as Wolaytta evidence. The next repair needs native prose or
a populated dictionary entry, rather than copying another language's
spelling. No locale value or acceptance changed. Pending 196 (Wolaytta
10), restored 4 and ledger 19,792 unchanged. All broader uncertain reviews
remain open. No remote push.

## Wolaytta remaining calendar family repaired — 2026-09-15

Source commit `e97f8fb20` replaces the ten remaining English/incomplete labels,
completing the tracked Wolaytta calendar queue. Reuse the independently attested
`wodiyaa qoodaa` calendar noun from the earlier Gifaataa source. Preserve
Jalali/Persia, Buddhist, Chinese, Coptic, Hebrew, Indian national and Japanese
identities. The Hijri variants separately retain calculated civil and
star/astronomical starting points and Saudi moon sighting.

The proper-name adaptations, moon-seeing phrase and complete civil/astronomical
compounds remain LOW CONFIDENCE pending native contextual review. Four focused
files pass: 20,018 exact correction records, exact labels, every runtime
calendar ID, distinct epoch/sighting variants, English-seed rejection,
newer-value preservation and all 234 locale token/key inventories. No live
calendar selector ran. Overall pending is 90 with no Wolaytta row; restored four
unchanged. Broader uncertain and unflagged review continues; no remote push.

## Tigre tracked calendar family repaired — 2026-09-15

Source commit `88caf17515` replaces all 17 Azerbaijani, English and incomplete
calendar labels. The open
[BeitTigreAI English–Tigre phrasebook corpus](https://beittigre.github.io/tigre-multilingual-dictionaries/english/)
directly maps `አምዕል ለልተዐለብ እቱ ወድና አወርሕት` to “calendar”. It also
independently supplies the components used for date (`ተመር`), view (`ራኣው`),
calculation (`ሕሳብ`), astronomy (`ከዋክብ ዐስተር`), Persia (`ፋርስ`), China
(`ሲን`/`ቻይነ`), Korea (`ኮርየ`), India (`ህንድ`), Japan (`ጃፓን`), Saudi
Arabia (`ስዑድያ`) and Jewish/Islamic terminology. The Tigre-specific
[glibc locale](https://sources.debian.org/src/glibc/2.19-18%2Bdeb8u4/localedata/locales/tig_ER/)
independently confirms its distinct weekday and month data.

Every runtime calendar remains distinct, including calculated civil versus
astronomical starting points and Saudi moon sighting. **Low confidence:** the
full UI compounds, Coptic/Buddhist/Hijri proper-name spellings and punctuation
are assembled rather than directly attested complete labels. Four focused
files pass: exact labels, all 20,035 ledger records, every runtime calendar ID,
newer-value preservation and all 234 locale token/key inventories. No live
calendar selector ran. Original pending is 73 with no Tigre row; restored four
unchanged. No external translation service or remote push.

This repair also invalidates the earlier assumption that the rest of the Tigre
file can be accepted from script alone. Of its 2,592 non-English values, 917
are byte-for-byte identical to Tigrinya, including long clauses. Current basic
values such as `month` = `ወርሒ` and the weekdays match Tigrinya, while the
Tigre phrasebook and glibc locale use distinct forms such as `ወርሕ` and
`ኣረርባዓ`. These are broader unflagged wrong-language candidates and remain
open; completing the 17-row detector queue is not a claim of whole-file Tigre
fluency.

## Tigre basic date vocabulary repaired — 2026-09-15

Source commit `9ab9215c6` replaces 12 unflagged values copied byte-for-byte
from Tigrinya: the two Date labels, Day, both Month labels and seven weekdays.
The 58,298-entry BeitTigreAI English–Tigre corpus directly returns `ተመር`,
`ምዕል`, `ወርሕ` and the selected weekday forms; the Tigre glibc locale
independently corroborates weekday distinctions. Date and day remain distinct,
and the same month noun is used for the search predicate.

Four focused files pass for exact forms, negative Tigrinya equality, all
20,098 correction records and all 234 locale inventories. Exact non-English
Tigre–Tigrinya overlap falls from 917 to 905 values; all 143 long identical
clauses still require phrase-level review. Corpus alternatives may reflect
regional variation, so the selected forms remain open to fluent review. No
live calendar UI test or remote write ran.

## Tigre corpus-backed interface terms repaired — 2026-09-15

Source commit `0e9418960` replaces 35 additional unflagged values copied
byte-for-byte from Tigrinya. The BeitTigreAI English–Tigre corpus directly
returns the selected navigation, board-view, action, color, preview, field and
account vocabulary for the matching English source. Terminal punctuation that
belongs to corpus sentences rather than short UI labels is omitted.

Four focused files pass for exact selected forms, negative Tigrinya equality,
all 20,133 correction records and all 234 locale inventories. Exact
non-English Tigre–Tigrinya overlap falls from 905 to 870 values. Of those, 86
contain at least 20 characters and 18 contain at least 35 characters; these
still require phrase-level evidence. Short corpus glosses can be polysemous,
so the selected UI senses remain open to fluent review. No live UI test or
remote write ran.

## Shared Tigre and Tigrinya terms reviewed — 2026-09-15

Review commit `5b2c5942e` explicitly retains 13 byte-identical values for Who,
Clear, black, Email, List, Hour, Open, History, Page and Error. The
BeitTigreAI corpus contains each exact Ethiopic form under the corresponding
English gloss, so script equality alone is not a defect for these entries.
The focused test locks both the Tigre value and the intentional equality.

The measured overlap remains 870 because accepted values are unchanged, but
the unclassified set falls to 857. This acceptance is limited to exact
headword evidence and does not certify related phrases or the locale as a
whole. No live UI test or remote write ran.

## Tigre lexical interface terms repaired — 2026-09-15

Source commit `f27cb82ca6` replaces 91 further values copied byte-for-byte
from Tigrinya. The BeitTigreAI corpus returns each selected Tigre headword or
short phrase for the complete English source; the UI sense was selected where
the corpus offers several glosses, and sentence punctuation was omitted from
short labels where appropriate.

Focused checks preserve every selected value and reject its former Tigrinya
seed. All 20,754 correction records, exact source placeholders, key order and
all 234 locale inventories pass. Exact non-English Tigre–Tigrinya overlap
falls from 870 to 779 values. Thirteen are separately attested shared forms,
leaving 766 unclassified; 86 remaining matches contain at least 20 characters
and 18 contain at least 35. Short dictionary glosses can be polysemous, so
these selected UI senses remain open to fluent review. No live UI test or
remote write ran.

## Tigre address and name senses repaired — 2026-09-15

Source commit `62956f2819` replaces three additional Tigrinya-seeded values.
The BeitTigreAI corpus offers multiple results for Address and Name; the selected
forms match the already established email-address and UI-name senses. Focused
checks now cover 94 lexical values and all 20,757 correction records. Exact
Tigre–Tigrinya overlap falls from 779 to 776, leaving 763 unclassified after
the 13 attested shared forms. No remote write ran.

## Repeated Tigre interface families repaired — 2026-09-15

Source commit `2530126f27` replaces 32 repeated Tigrinya-seeded values for
status, color actions, templates, creation, weekly/monthly intervals, team,
week, weight and size. Each family reuses exact BeitTigreAI corpus headwords,
so the same concept no longer varies between related controls.

Focused checks preserve every selected value and reject every former seed. All
20,789 correction records and all 234 locale inventories pass. Exact overlap
falls from 776 to 744; after 13 attested shared forms, 731 remain unclassified.
Composed UI phrases remain open to fluent style review. No remote write ran.

## Tigre Azure menu paths repaired — 2026-09-15

Source commit `77e08a8f61` replaces the translated Account and Show fragments
in two long Azure menu paths with corpus-attested Tigre while preserving every
vendor token and separator. Focused checks cover the exact paths, all 20,791
corrections and 234 locale inventories. Exact overlap falls to 742; 729 remain
unclassified after 13 attested shared forms, including 84 values of at least
20 characters and 18 of at least 35. No remote write ran.

## Repeated Tigre interface nouns repaired — 2026-09-15

Source commit `f9b716fd61` replaces 19 repeated Tigrinya-seeded nouns for
text, title, source, support, public, boards, labels and avatars. Exact Tigre
corpus roots and regular plurals are reused across related controls. Focused
checks reject every former seed; all 20,810 correction records and 234 locale
inventories pass. Exact overlap falls to 723, leaving 710 unclassified after
13 attested shared forms. Derived plurals remain open to fluent review. No
remote write ran.

## Additional shared Tigre terms reviewed — 2026-09-15

Review commit `b2caad45b7` retains six further exact Tigre/Tigrinya matches.
The BeitTigreAI corpus directly supports the existing red/crimson, phase/grade,
Default/common and translation/interpretation senses in their specific UI
contexts. The focused test now distinguishes 19 proven shared values from the
remaining overlap. Raw overlap stays 723, while the unclassified set falls to
704. The acceptance does not extend to related phrases. No remote write ran.

## Conflicting Tigre interface senses repaired — 2026-09-15

Source commit `67632637c2` replaces Task, Sort, Person and Trigger values
whose attested corpus meanings conflict with their UI contexts. The new forms
use Tigre work, sorting, person and causation roots found in complete corpus
sentences. Focused checks reject each former seed; all 20,814 corrections and
234 locale inventories pass. Exact overlap falls to 719, with 19 shared forms
and 700 unclassified. The derived Trigger noun remains open to fluent review.
No remote write ran.

## Basic Tigre interface terms repaired — 2026-09-15

Source commit `62ff72c607` replaces 17 basic Tigrinya-seeded labels with
distinct forms attested in complete Tigre corpus sentences: sky, organization,
pink, days, path, year, role, table, white, reply, small, notes, hours, count,
tests and today. Focused checks reject every former seed; all 20,831 corrections
and 234 locale inventories pass. Exact overlap falls to 702, with 19 shared
forms and 683 unclassified. No remote write ran.
