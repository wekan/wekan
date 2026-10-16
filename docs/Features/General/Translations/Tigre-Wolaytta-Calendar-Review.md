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

## Tigre operational terms repaired — 2026-09-15

Source commit `a268d6167a` replaces 22 operational labels using distinct
Tigre corpus forms for accept, limits, silver/yellow, invite, finish, upload,
voting, worker, control, cleanup, minutes, reports/requests, computer, security,
attempts, previous, problems, progress and schedule. Review `fa6cbd1666` retains
the exact Seconds form after direct corpus attestation. Focused checks reject
every former seed; all 20,853 corrections and 234 locale inventories pass. Raw
overlap falls to 680, with 20 shared forms and 660 unclassified. Regular plurals
remain open to fluent review. No remote write ran.

## Tigre interface compounds repaired — 2026-09-15

Source commit `6f25928145` replaces 27 time-unit and interface compounds by
reusing corpus-established Tigre card, board, task, name, text, color, size,
close, copy and sort roots. Parenthesized singular/plural unit syntax, technical
identifiers and punctuation stay exact. Focused checks reject every former
seed; all 20,880 corrections and 234 locale inventories pass. Raw overlap falls
to 653, with 20 shared forms and 633 unclassified. Compound word order and
derived plurals remain open to fluent review. No remote write ran.

## Tigre member terminology corrected — 2026-09-15

Source commit `2bb4b88cb5` corrects an earlier lexical choice: the corpus form
`መሕበር` names an association, while an explicit BeitTigreAI plural template
gives `አባል`/`አባላት` for Member/Members. Five earlier repaired values are
corrected in place and two remaining plural controls are repaired. Focused
checks cover all seven values and reject the association sense; all 20,882
correction records and 234 locale inventories pass. Raw overlap falls to 651,
with 20 shared forms and 631 unclassified. No remote write ran.

## Tigre administrative and location controls repaired — 2026-09-15

Source commit `9f5f2d1db` replaces 14 Tigrinya-seeded controls. Direct
BeitTigreAI entries supply `ሓክም` for administrator, `መዳይር` for
administrators, `መነዘመት` for organization, `አካን` for location and
`ዐይነት` for the noun type. Complete corpus phrases supply the imperative
`ኣክድ` in both Confirm password and Verify your identity, and object-verb
Add examples supply `ወስክ`. Organization Admins and Add location are composed
from those attested parts and retain that stated limitation pending fluent
review. Focused exact and negative checks cover all 14 controls; all 20,896
correction records and 234 locale inventories pass. Raw overlap falls to 637,
with 20 attested shared forms and 617 unclassified. No remote write ran.

## Tigre export controls repaired — 2026-09-15

Source commit `6d8f830a7` replaces seven Tigrinya-seeded generic, list and board
Export controls. The BeitTigreAI corpus gives the exact software-context phrase
Export pages as `አግጸት አግዕዞ`; the controls reuse its export action with the
independently reviewed Tigre list and board nouns. Focused exact and negative
checks cover all seven values; all 20,903 correction records and 234 locale
inventories pass. Raw overlap falls to 630, with 20 attested shared forms and
610 unclassified. The composed list/board phrases remain open to fluent word-
order review. No remote write ran.

## Tigre severity controls repaired — 2026-09-15

Source commit `e27abadf6` replaces the physical-weight noun in three Severity
controls. The corpus explicitly uses the old `ክብደት` for losing body weight,
while it supplies `ደረጀት` for degree/level and `ክብድት` for severely. The new
severity-level compound is therefore semantically distinct but its complete
grammar remains LOW CONFIDENCE pending fluent review. Focused checks reject
the former seed; all 20,906 correction records and 234 locale inventories
pass. Raw overlap falls to 627, with 20 attested shared forms and 607
unclassified. No remote write ran.

## Tigre status controls repaired — 2026-09-15

Source commit `b4586ba97` replaces eight Tigrinya-seeded Overall progress, CPU
usage, Card loading and Remaining time controls. The BeitTigreAI corpus directly
supplies overall, progress, usage, Loading results, time and remaining forms;
the established Tigre card noun is reused and CPU remains unchanged. Focused
exact and negative checks cover all values; all 20,914 correction records and
234 locale inventories pass. Raw overlap falls to 619, with 20 attested shared
forms and 599 unclassified. Complete compound order remains open to fluent
review. No remote write ran.

## Tigre visual and Rename controls repaired — 2026-09-15

Source commit `f1b12cc66` replaces eight Tigrinya-seeded Rename, Change
Background Image and Board backgrounds controls. Complete corpus sentences
attest the Tigre name noun and change command; separate exact entries supply
image and background. The established board noun is reused. Focused exact and
negative checks cover every value; all 20,922 correction records and 234 locale
inventories pass. Raw overlap falls to 611, with 20 attested shared forms and
591 unclassified. Background compound order and the derived plural remain open
to fluent review. No remote write ran.

## Tigre Font, Invite and permissions controls repaired — 2026-09-15

Source commit `e4ae5173f` replaces seven Tigrinya-seeded Font, Invite People and
Change permissions controls. The BeitTigreAI corpus supplies Tigre form/shape,
alphabet, people and permission nouns; complete sentences establish Invite and
Change commands. Focused exact and negative checks cover every value; all
20,929 correction records and 234 locale inventories pass. Raw overlap falls
to 604, with 20 attested shared forms and 584 unclassified. The descriptive
Font term and complete compound order remain open to fluent review. No remote
write ran.

## Tigre Speed and Storage controls repaired — 2026-09-15

Source commit `b8ebfc67e` replaces four Tigrinya-specific Speed and Storage
spellings. The BeitTigreAI corpus uses the `ሸፋገት` stem in a complete full-
speed sentence and `መክዘን` in a warehouse sentence. The
[native Tigre Wikidata welcome page](https://www.wikidata.org/wiki/Wikidata:Main_Page/Welcome/tig)
independently uses `መክዘን` in its data-storage description. Focused exact and
negative checks cover all four values; all 20,933 correction records and 234
locale inventories pass. Raw overlap falls to 600, with 20 attested shared
forms and 580 unclassified. No remote write ran.

## Ledger-grounded Tigre compounds repaired — 2026-09-15

Source commit `0651f745b` replaces 17 compact Tigrinya-seeded labels for public
boards, announcements, administrators, organizations, members, roles/status,
search, templates, source/status/delete board, new users, job description and
file path. Every content term was independently corpus-attested and reviewed
in an earlier correction; this batch reuses that ledger evidence instead of
inventing new vocabulary. Focused exact and negative checks cover all values;
all 20,950 correction records and 234 locale inventories pass. Raw overlap
falls to 583, with 20 attested shared forms and 563 unclassified. Complete
compound order remains open to fluent review. No remote write ran.

## Additional Tigre member compounds repaired — 2026-09-15

Source commit `284fcff14` replaces seven Tigrinya-seeded board-member, filter,
selection and rule controls with the explicit corpus `አባል`/`አባላት` pair. It
reuses independently reviewed Tigre Board, List, Add, Select, Filter and
negative-copula forms. Focused exact and negative checks cover every value and
reject the Tigrinya Member spelling; all 20,957 correction records and 234
locale inventories pass. Raw overlap falls to 576, with 20 attested shared
forms and 556 unclassified. Complete phrase order remains open to fluent
review. No remote write ran.

## Tigre date controls repaired — 2026-09-15

Source commit `a03aa027c` replaces nine Tigrinya-seeded or semantically
conflated date controls. The BeitTigreAI corpus gives separate exact Tigre
entries for Due (`ሐዞት`) and Deadline (`አምዐል መዋዕድ`), so Due Date no longer
reuses End. Independent entries also attest date, start, end, voting, received
and change components used by the seven popup titles. Focused exact and
negative checks cover every value; all 20,965 correction records and 234
locale inventories pass. Raw non-English overlap falls to 571, with 20
attested shared forms and 551 unclassified. Complete phrase order remains open
to fluent review. No remote write ran.

## Tigre selection controls repaired — 2026-09-15

Source commit `a6dd320fd` replaces six Tigrinya-seeded board-selection,
show/hide and select-all controls. The BeitTigreAI corpus directly attests
Select all rows, Select a file, Hide and Show forms; established Tigre Board,
Card, List and Page terms complete the UI labels. Focused exact and negative
checks cover every value; all 20,971 correction records and 234 locale
inventories pass. Raw non-English overlap falls to 565, with 20 attested shared
forms and 545 unclassified. Complete phrase order remains open to fluent
review. No remote write ran.

## Reviewed Tigre terms reused — 2026-09-15

Source commit `22615501d` replaces the final four Tigrinya-seeded values whose
complete former wording maps to one unique Tigre replacement already proven in
the correction ledger. The affected labels are List name, Create an Account,
Not Active and Logout. Focused exact and negative checks cover every value; all
20,975 correction records and 234 locale inventories pass. Raw non-English
overlap falls to 561, with 20 attested shared forms and 541 unclassified. No
remote write ran.

## Tigre Import controls repaired — 2026-09-15

Source commit `b8bbd8fa3` replaces eleven Tigrinya-seeded general, board, list,
card and rule Import controls. The BeitTigreAI corpus explicitly gives
`አምጸአ` for “to import”; independently reviewed Tigre Board, Card and List
terms complete the labels while Trello, Excel and CSV/TSV stay literal.
Focused exact and negative checks cover every value; all 20,986 correction
records and 234 locale inventories pass. Raw non-English overlap falls to 550,
with 20 attested shared forms and 530 unclassified. Destination compound order
remains open to fluent review. No remote write ran.

## Tigre Name controls repaired — 2026-09-15

Source commit `002f8bc7b` replaces the Tigrinya Name noun in four compound
labels. The BeitTigreAI corpus gives exact `ስሜት` and uses it in a complete Full
Name sentence; separately reviewed Tigre Location and Version terms complete
the compounds while Webhook remains literal. Focused exact and negative checks
cover every value; all 20,990 correction records and 234 locale inventories
pass. Raw non-English overlap falls to 546, with 20 attested shared forms and
526 unclassified. No remote write ran.

## Compact Tigre terminology repaired — 2026-09-15

Source commit `fc6139745` replaces Tigrinya-seeded components in 31 compact
configuration labels. Every replacement reuses independently attested Tigre
terminology already established in the correction ledger, covering names,
dates, sizes, addresses, status, support, security, cards, boards and system
data. CPU, OS, IP, IPv4, IPv6, TLS and byte remain literal identifiers. Focused
exact and negative checks cover every value; all 21,021 correction records and
234 locale inventories pass. Raw non-English overlap falls to 515, with 20
attested shared forms and 495 unclassified. Unchanged phrase components remain
open to fluent review. No remote write ran.


## Multi-component Tigre labels repaired — 2026-09-15

Source commit `f64f9c98d` replaces Tigrinya-seeded components in 31 labels
for users, names, boards, cards, dates, labels, files, invitations and related
controls. Each replacement reuses independently corpus-attested Tigre terms
already established in the correction ledger. Trello, JSON and ISO 8601 stay
literal. Focused exact and negative checks cover every value; all 21,052
correction records and 234 locale inventories pass. Raw non-English overlap
falls to 484, with 20 attested shared forms and 464 unclassified. Unchanged
surrounding grammar remains open to fluent review. No remote write ran.


## Shared Tigre account and error plurals reviewed — 2026-09-15

Review commit `a69ed2325` retains Accounts (`ሕሳባት`) and Errors
(`ጌጋታት`) as valid Tigre forms shared byte-for-byte with Tigrinya. Exact
corpus sentences independently attest both plural senses. The focused test now
locks the intentional equality. Raw overlap remains 484, with 22 attested
shared forms and 462 unclassified. No remote write ran.


## Tigre Card and File terms repaired — 2026-09-15

Source commit `8560f3d7c` replaces singular Tigrinya Card components in 16
labels and File components in five compact labels with established Tigre
`ወረቀት ካርድ`, `ፈይል` and `ስርዓም`. Literal product and extension names
remain intact. Focused exact and negative checks cover every value; all 21,073
correction records and 234 locale inventories pass. Raw non-English overlap
falls to 463, with 22 attested shared forms and 441 unclassified. Surrounding
grammar remains open to fluent review. No remote write ran.


## Tigre File terms in longer clauses repaired — 2026-09-15

Source commit `71a15613c` replaces the remaining eight Tigrinya File
spellings inside longer clauses with established Tigre `ፈይል`. Format, API,
service and product identifiers stay literal. Exact and negative tests cover
every value; all 21,081 correction records and 234 locale inventories pass.
Raw overlap falls to 455, with 22 attested shared forms and 433 unclassified.
Complete clause grammar remains open to fluent review. No remote write ran.


## Tigre Board terms repaired — 2026-09-15

Source commit `1196bebaa` replaces 31 Tigrinya Board singular, plural and
possessive components with established Tigre `ምዱድ` and `ምዱዳት` forms.
Exact and negative tests cover every value and preserve two excluded cases for
semantic rewriting. All 21,112 correction records and 234 locale inventories
pass. Raw overlap falls to 424, with 22 attested shared forms and 402
unclassified. Surrounding grammar remains open to fluent review. No remote
write ran.


## Repeated Tigre interface components repaired — 2026-09-15

Source commit `8b6c21ff9` replaces 32 Tigrinya-seeded Change, Show, Import,
All, Size, Path and User/Users components with established Tigre forms. Import
and Enter meanings remain distinct. Exact and negative tests cover every
value; all 21,144 correction records and 234 locale inventories pass. Raw
overlap falls to 392, with 22 attested shared forms and 370 unclassified.
Surrounding grammar remains open to fluent review. No remote write ran.


## Tigre Label, Organization and Team nouns repaired — 2026-09-15

Source commit `242c1f27b` replaces 13 Tigrinya-seeded nouns in semantically
matched Label, Organization and singular Team controls. Exact and negative
tests preserve the excluded icon, checkbox, token-prefix and plural senses.
All 21,157 correction records and 234 locale inventories pass. Raw overlap
falls to 379, with 22 attested shared forms and 357 unclassified. Surrounding
grammar remains open to fluent review. No remote write ran.


## Tigre Date and Time terms repaired — 2026-09-15

Source commit `0896117b5` replaces seven absent-from-corpus Tigrinya Time
spellings with attested Tigre `ወቅት`. Three controls retain attested Date and
Hour nouns but use Tigre prepositions. Exact and negative tests cover all ten
values; all 21,167 correction records and 234 locale inventories pass. Raw
overlap falls to 369, with 22 attested shared forms and 347 unclassified.
Surrounding grammar remains open to fluent review. No remote write ran.


## Tigre outcome and account terms repaired — 2026-09-15

Source commit `c91e56a50` replaces nine Tigrinya-seeded Failed,
Succeeded/Successful, Registration and Private forms with sense-matched Tigre
corpus forms. Exact and negative tests cover all values; all 21,176 correction
records and 234 locale inventories pass. Raw overlap falls to 360, with 22
attested shared forms and 338 unclassified. Surrounding grammar remains open
to fluent review. No remote write ran.


## Remaining Tigre Card terms repaired — 2026-09-15

Source commit `c73362aae` replaces all 17 remaining Tigrinya Card singular,
plural and possessive components with established Tigre forms. Exact and
negative tests preserve surrounding long-clause text, tokens, numbers and
punctuation. All 21,193 correction records and 234 locale inventories pass.
Raw overlap falls to 343, with 22 attested shared forms and 321 unclassified.
Complete clause grammar remains open to fluent review. No remote write ran.


## Tigre Account, Storage and Templates terms repaired — 2026-09-15

Source commit `8296c12a5` replaces eight exact Tigrinya Account components,
five Storage components and four Templates components with established Tigre
`ሕሳብ`, `መክዘን` and `ሞደላት` forms. The Azure account-name phrase
also reuses the reviewed Tigre Name compound. Exact and negative tests cover
all values; all 21,210 correction records and 234 locale inventories pass.
Raw overlap falls to 326, with 22 attested shared forms and 304 unclassified.
Thirty-three raw matches contain at least 20 characters and seven contain at
least 35. Complete clause grammar remains open to fluent review. No remote
write ran.


## Embedded Tigre Account, Storage and Description terms repaired — 2026-09-15

Source commit `eb1add1f2` replaces known Tigrinya components in 60
context-matched, otherwise nonidentical Tigre values. Account inflections now
derive from `ሕሳብ`, Storage and Repository use `መክዘን`, and
Description/Profile contexts use `ዋስፎ`. Two Web Manifest values remain
excluded because Manifest is a different sense. Six sequential changes are
consolidated into the existing record for each key, leaving 21,264 verified
final corrections. The focused test checks 121 applicable contexts; all 234
locale inventories pass. Raw overlap falls to 323, with 22 attested shared
forms and 301 unclassified. Thirty-three raw matches contain at least 20
characters and seven contain at least 35. No remote write ran.


## Tigre Edit and Template terms repaired — 2026-09-15

Source commit `e50072bc3` replaces 18 Tigrinya-seeded Edit components with
exact corpus `አስነ` and 13 singular Template components with exact corpus
`ሞደል`. The context filter preserves unrelated “for example” phrases and
the already established Tigre Templates plural. Two sequential changes are
consolidated into the existing record for each key, leaving 21,293 verified
final corrections. Focused tests cover 18 Edit and 21 singular or plural
Template contexts; all 234 locale inventories pass. Raw overlap falls to 319,
with 22 attested shared forms and 297 unclassified. Thirty-two raw matches
contain at least 20 characters and seven contain at least 35. No remote write
ran.


## Second Tigre ledger-reuse pass — 2026-09-15

Source commit `45a568aea` repairs 44 exact Tigrinya copies by reusing
independently corpus-attested Tigre components already established in the
correction ledger. The guarded map restricts each replacement to its matching
English UI sense; ambiguous senses and unverified plural morphology remain
excluded. One sequential change is consolidated into its existing key record,
leaving 21,337 verified final corrections. Focused exact and negative checks
and all 234 locale inventories pass. Raw overlap falls to 275, with 22
attested shared forms and 253 unclassified. Twenty-eight raw matches contain
at least 20 characters and six contain at least 35. No remote write ran.


## Third Tigre context-reuse pass — 2026-09-15

Source commit `088b01587` repairs 12 exact Tigrinya copies in Files,
Address, Visibility, Format, First and Usage contexts with Tigre terms already
established by reviewed corrections. The regular plural Address form remains
low confidence pending fluent review. Focused exact and negative checks
preserve `.zip`, `%{value}` and product literals; all 21,349 final
correction records and 234 locale inventories pass. Raw overlap falls to 263,
with 22 attested shared forms and 241 unclassified. Twenty-five raw matches
contain at least 20 characters and six contain at least 35. No remote write
ran.


## Fourth Tigre short-control pass — 2026-09-15

Source commit `40a20207b` repairs 16 exact Tigrinya short controls using
established Tigre At, Remove, Sign In, All, Delete, Failed and Count terms.
The regular Organization and Team plurals remain low confidence pending
fluent review. Focused exact and negative checks preserve all three `%s`
tokens; all 21,365 correction records and 234 locale inventories pass. Raw
overlap falls to 247, with 22 attested shared forms and 225 unclassified.
Twenty-five raw matches contain at least 20 characters and six contain at
least 35. No remote write ran.


## Full-locale Tigre Board and Card components repaired — 2026-09-15

Source commit `83546ed24` replaces remaining embedded Tigrinya Board and
Card nouns in 407 otherwise nonidentical Tigre values. English source-sense
filters cover 316 Board and 300 Card contexts; negative guards preserve
Clipboard wording and prevent duplicate Tigre Card prefixes. Existing
sequential repairs are consolidated by key, leaving 21,757 verified final
corrections. Placeholder and HTML inventories and all 234 locale inventories
pass. Raw exact-overlap metrics remain 247 total, 22 attested shared and 225
unclassified because prior batches had already repaired exact Board/Card
copies. Twenty-five raw matches contain at least 20 characters and six contain
at least 35. No remote write ran.

### 2026-09-15 — Full-locale Tigre established noun families

Source commit `08e7092c3` repairs 193 values containing Tigrinya File, User,
Name, Label, Organization, Team, Path, Status, Size, Color or Count components.
English source-sense guards cover 385 applicable contexts while preserving
unrelated Icon and Clipboard meanings. Sequential changes are consolidated by
key, leaving 21,888 verified final correction records. Derived File, Name,
Organization and Team plurals remain low confidence pending fluent review.
The focused context guard, locale-wide placeholder and HTML checks, and all
234 locale inventories pass. Raw exact overlap falls to 244 total, with 22
attested shared forms and 222 unclassified; 25 raw matches contain at least 20
characters and 6 contain at least 35. No remote write occurred.

### 2026-09-15 — Missed Tigre Organizations control

Source commit `0ef3ca6dd` replaces the remaining exact Tigrinya Organizations
plural with the provisional regular plural of corpus-attested Tigre
`መነዘመት`. The full-locale Organization guard now rejects this third old
form. All 21,889 corrections and 234 locale inventories pass. Raw exact
overlap falls to 243, with 22 attested shared forms and 221 unclassified; 25
raw matches contain at least 20 characters and 6 contain at least 35. The
plural remains low confidence pending fluent review. No remote write occurred.

### 2026-09-15 — Corpus-supported Tigre exact controls

Source commit `0eac733cd` repairs four values still exactly equal to
Tigrinya. Corpus website sentences use `መውቅዕ`, and a Special page
sentence uses `ፍንቱይ`. Corpus headwords attest Button `ሰድፈት`
and Collection `አከቦት`; their regular plural UI forms are derived and
remain low confidence pending fluent review. Matching English source-sense
and exact-result guards pass. All 21,893 correction records and 234 locale
inventories pass. Raw exact overlap falls to 239, with 22 attested shared
forms and 217 unclassified; 25 raw matches contain at least 20 characters
and 6 contain at least 35. No remote write occurred.

### 2026-09-15 — Tigre Endpoint meaning repair

Source commit `6b78c88cb` repairs three API/S3 contexts where the Tigrinya
seed rendered technical Endpoint as a temporal end. Existing S3 fields
already keep `Endpoint`, so the replacement uses that local technical term.
The API report phrase and S3 help text remain mixed-language and require
full-clause fluent review; this fix only resolves the demonstrable noun-sense
error. One sequential correction is consolidated by key, leaving 21,895
verified final correction records. Source-sense and negative tests pass with
all 234 locale inventories. Raw exact overlap falls to 238, with 22 attested
shared forms and 216 unclassified; 25 raw matches contain at least 20
characters and 6 contain at least 35. No remote write occurred.

### 2026-09-15 — Tigre Star and Break corpus review

Source commit `009d7f832` replaces Tigrinya-seeded Star spelling in 19
Star/Starred/Unstar controls with corpus-attested Tigre `ኮከብ`. The
rating count uses the corpus-attested irregular plural `ከዋክብ`, retaining
`%s`. Pomodoro Break uses `ዕርፍቲ`, attested in a Tigre short-break
sentence. English source-sense guards cover all 20 Star noun contexts and
preserve Starred Pages' separate adjectival wording. The commit refreshes
ledger-confirmed exact-value expectations left stale by earlier Board,
Card, Name, Label, Size, File and Account repairs; all 45 Tigre suites
now pass. Sequential corrections are consolidated by key, leaving 21,905
final verified records. All 234 locale inventories pass. Raw exact overlap
falls to 229, with 22 attested shared and 207 unclassified; 21 matches
contain at least 20 characters and 6 at least 35. No remote write occurred.

### 2026-09-15 — Corpus-attested Tigre plural follow-up

Source commit `5d53aa990` replaces 18 provisional File plural occurrences
with `ፋይላት`, attested in Tigre file-management commands; three
provisional Names plurals with `አስማይ`, attested in independent names
sentences; and seven Organizations plurals with `መነዘማት`, attested in
a social-organizations sentence. Singular File `ፈይል` remains separately
attested. Eight File values return to their original value, so their
no-op correction records are removed, leaving 21,897 final records. The
unflagged source batch corrects prior low-confidence morphology rather than
changing the 20,081 original audit-row classifications. The focused
source-sense guard, all 46 Tigre suites, placeholder and JSON checks, and
234 locale inventories pass. Raw exact overlap rises from 229 to 233 as
four File phrases now match Tigrinya again; the corpus supports the shared
noun, but their complete clauses remain unclassified. Thus 22 complete
forms are attested shared and 211 full values remain unclassified, including
23 raw matches at least 20 characters and 6 at least 35. Team, Button and
Collection plurals remain low confidence. No remote write occurred.

### 2026-09-15 — Tigre S3 settings fill

`970d9e664` replaces 21 English placeholders in the S3 settings family,
using existing local Tigre storage, connection, port, address, file and size
vocabulary. Technical service names, `Endpoint`, `URL`, `SSL`, hostnames and
the bare `S3` protocol label remain literal. Complete compound grammar is
low confidence pending native review. Focused and ledger checks pass; all
234 locale inventories pass. Ledger 21,919. Non-English Tigre values 2,613;
raw exact Tigre/Tigrinya overlap stays 233 (22 attested shared, 211
unclassified). No live UI test or remote write occurred.

### 2026-09-15 — Tigre authentication error clause

`36c2148ec` replaces the exact Tigrinya copy in `twoFactorCode-invalid`.
The BeitTigreAI phrasebook attests the chosen wrong, please and try-again
forms; authentication-code syntax remains a composed low-confidence phrase.
The focused source, seed, ledger and runtime check passes. Ledger 21,920;
exact non-English overlap 232 (22 attested shared, 210 unclassified), with
22 matches at least 20 characters and 5 at least 35. No live UI test or
remote write occurred.

### 2026-09-15 — Tigre PDF preview warning

`78f2c9bf7` replaces the exact Tigrinya copy in
`preview-pdf-not-supported`. Tigre phrasebook entries support device,
preview, unavailable, instead, download and try terms. Complete sentence
grammar and the device suffix remain composed low-confidence wording.
The attachment Jade key, source/fallback meaning, seed, ledger and runtime
test pass. Ledger 21,921; exact non-English overlap 231 (22 attested shared,
209 unclassified), with 21 matches at least 20 characters and 4 at least
35. No live UI test or remote write occurred.

### 2026-09-15 — Tigre Trello key and S3 plural follow-up

`6909fb85e` replaces seven Trello API key nouns with the corpus-attested
`መፍቲሕ`. The required prompt also uses attested please, both and enter
forms; its complete order remains a draft for native review. The prior S3
bucket-help File plural is corrected to corpus-attested `ፋይላት`, and its
ledger row is consolidated. All 50 Tigre suites pass, including the plural
guard that found the earlier S3 defect. Ledger 21,924; exact non-English
overlap 230 (22 attested shared, 208 unclassified), with 20 matches at
least 20 characters and 3 at least 35. No live UI test or remote write.

### 2026-09-15 — Tigre list-width rule and source correction

`68d679c6c` replaces the exact Tigrinya-copied validation clause with a
Tigre draft using corpus-supported width, whole and number terms. Its
`≥ 200` notation matches the shared minimum and whole-number popup parser;
full syntax remains low confidence. The source/UI discrepancy affects 233
other locale messages and is tracked in the short audit. All 50 Tigre suites
pass. Ledger 21,936; exact non-English overlap 229 (22 attested shared,
207 unclassified), with 19 matches at least 20 characters and 2 at least
35. No live UI test or remote write occurred.
