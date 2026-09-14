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
