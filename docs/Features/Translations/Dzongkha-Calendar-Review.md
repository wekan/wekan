# Dzongkha calendar translation review


Dzongkha sighting calendar — 2026-09-14, local commit `98cf2cda5`.
calendar-system-islamic-rgsa replaces English country-only seed with Hijri
calendar, Saudi Arabia and moon-seeing components. Grammar of Dzongkha
PDF page 191 example 35 attests the moon noun; PDF page 325 section 7.1
attests seeing infinitive and verbal-noun use. Existing calendar noun and
proper names are retained. Low confidence: full technical compound and
native grammar, not the attested individual components; browser not run.
Four suites pass, with placeholder/order/human-preference invariants.
Original pending 256 → 255; Dzongkha 3 → 2; ledger 18,762. Civil and
astronomical epoch variants still need complete native repair. Official
2023 dictionary retrieval timed out and classified-lexicon PDF returned
429; neither failed retrieval was treated as lexical absence or authority.
Primary grammar: https://escholarship.org/content/qt1h4211k0/qt1h4211k0_noSplash_b3843a79888f78f39713ded5f61ad772.pdf?t=s10u2j


Dzongkha ISO label — 2026-09-14, local commit `7dd8c10c9`.
Unflagged calendar-system-iso8601 now includes Gregorian calendar and
native week wording rather than the identifier alone. Grammar of Dzongkha
PDF page 373 (printed 363) explicitly attests the week noun used by the
existing locale. Gregorian/calendar wording is reused; identifier exact.
Four suites pass, including all token/order/human-preference checks.
Low confidence: full technical compound and existing Gregorian name
transliteration; browser not run. Native grammar discusses Bhutanese
weekday reckoning separately: this label repair does not alter date math
or claim that traditional weekday rules equal ISO 8601. Original pending
stays 255, Dzongkha 2; correction ledger grows to 18,763.


## Tabular epoch distinction — source review 2026-09-15

Current CLDR common/bcp47/calendar.xml directly specifies both
islamic-civil and islamic-tbla as tabular, with the same intercalary years
2,5,7,10,13,16,18,21,24,26,29. The distinction is civil versus astronomical
epoch, not tabular versus non-tabular or a different leap-year cycle.
Source: https://raw.githubusercontent.com/unicode-org/cldr/main/common/bcp47/calendar.xml

CLDR's design explanation identifies civil with Friday 622-07-16 Julian,
and astronomical/tabular with Thursday 622-07-15 Julian. Astronomical epoch
must not become current moon-sighting calculation: both remain tabular.
Those are Julian dates, not Gregorian dates. The current XML also marks
islamicc deprecated, preferred islamic-civil; do not add a separate locale
choice for the legacy alias as part of translation repairs.
Source: https://cldr.unicode.org/development/development-process/design-proposals/islamic-calendar-types

Current Dzongkha values Islamic civil and Islamic tabular both remain
pending: neither is a full native name, and the second omits its epoch.
Next action is to verify Dzongkha arithmetic/tabular and starting-epoch
terminology, then distinguish both names using the shared Hijri calendar
base without substituting ordinary civil status or sky observation for
these algorithm definitions. Earlier sighting-label and ISO repairs do
not resolve the two epoch labels or their grammar. No translation or
counts changed. Pending 159 original findings; Dzongkha 2. No live UI
test ran and no remote writes were made.


## Legible tabular term — visual source review 2026-09-15

The cached publisher DCT.pdf is a real 226-page PDF. A fresh pypdf
extraction reproduced the mixed-script glyph corruption, so it was not
used as final Dzongkha spelling. Local rendering of PDF page 196 (printed
192) was inspected visually at `.tools/tmp/dz-tabular-page196.png`.
The Tabular row clearly gives `རེའུ་མིག་ཅན།`, resolving the corrupted
u glyph in the extracted `རེའఆ་མིག་ཅན` candidate.
Source: https://www.cle.org.pk/research/rep/DCT.pdf

This is visual confirmation of a native computing tabular term, not merely
an indexed snippet. It does not establish the full calendar compound or
civil/astronomical epoch terminology. Next action is to apply this legible
component after checking the epoch/starting-date phrases; both variants
must retain it and their distinct epoch qualifier.

PyMuPDF was installed only in the existing temporary PDF-review venv to
render this source; no application dependency or package manifest changed.
No translations or counts changed. Pending 159 original findings;
Dzongkha 2. No live calendar UI test ran and no remote writes were made.


## Epoch versus start wording — visual review 2026-09-15

Rendered DCT.pdf page 69 (printed 65) was inspected visually at
.tools/tmp/dz-epoch-page69.png. Epoch is `གལ་ཅན་དུས་ཚོད།`, an
important time, resolving extracted vowel corruption but not establishing
a calendar reference date. Do not promote the generic entry to a precise
astronomical/civil epoch compound without context.

Rendered page 190 (printed 186), .tools/tmp/dz-starting-page190.png,
visually gives Start `འགོ་བཙུགས་ནི།`, Start-up
`འགོ་བཙུགས།`, and Starting `འགོ་བཙུགས་དོ།`. These are legible
native computing start forms, but the progressive starting form is not
itself a noun phrase for starting date. Neither should be copied as a
complete calendar epoch label. The source was rendered from the cached
publisher PDF, not inferred from mixed-script extracted text.
Source: https://www.cle.org.pk/research/rep/DCT.pdf

Next action: verify a start/reference-date construction with the date noun,
then distinguish the two Julian epochs using civil/astronomical terms or
a precise native paraphrase. Shared tabular spelling is now visually
verified; the full label remains unproven. No translation or counts changed.
Pending 159 original findings; Dzongkha 2. No live calendar UI test ran
and no remote writes were made.


## Tabular Hijri epoch labels — repair 2026-09-15

Source commit `1a174e357` replaces both English seeds. Visually verified
རེའུ་མིག་ཅན gives tabular; existing start འགོ་བཙུགས and date
ཚེས form the starting-date paraphrase. Civil epoch is explicitly Julian
622-07-16; astronomical epoch is Julian 622-07-15, as CLDR explains.
Both labels share tabular wording; neither implies moon-sighting math.
Hijri and Julian are borrowed proper names, consistent with the existing
Hijri base. Derived starting-date compound and full grammar remain low
confidence; exact components do not certify a full native calendar label.
Sources: https://www.cle.org.pk/research/rep/DCT.pdf
https://cldr.unicode.org/development/development-process/design-proposals/islamic-calendar-types

Four focused suites pass for distinct epoch dates, rejection of Gregorian
basis/wrong variant date, exact ledger and translation invariants. No live
calendar UI test ran. Ledger 19,861; original corrected 15,746, pending
157, Dzongkha 2 to 0, restored 4 unchanged. Empty original queue does not
complete Dzongkha native grammar or earlier low-confidence reviews.
Broader review remains open; no remote writes were made.
