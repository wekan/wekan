# Quechua calendar terminology review

Reviewed **2026-09-14**. The generic `calendar` label is now `Watanqillqa`,
replacing `Kay willaymi: Calendarta`. The prefix did not translate the noun.

The Chilean Ministry of Education's [illustrated Quechua dictionary](https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-134497_recurso_pdf.pdf)
was downloaded and its title, provenance and relevant entry read directly.
PDF page 19, printed page 18, gives the calendar term. The introduction
identifies native authors from Ollagüe and the Cusco Collao variety; the
edition is January 2019, by Julia Quispe, Miguel Urrelo and Agustina Morales.
This is native dictionary evidence for a generic calendar, not a claim that
every Quechua variety uses the same term.

The specific calendar-system values still use `Intiwatana`; their full
compounds require separate review. The pending astronomical-epoch value
still lacks translated qualifiers. Do not accept it by replacing only its
base noun. No original pending finding is counted as resolved here.

The focused locale test checks the exact noun and rejects the prior prefix
and solar-observatory term. Locale-wide placeholder and key-order checks
remain in that suite. A direct interface reference to the generic key was
not located in the inspected client source, so no browser rendering of this
key is claimed. Calendar-system settings verification remains open.

## Day and daily recurrence — 2026-09-14

The same primary dictionary directly attests `P’unchay` (day) in its time
vocabulary (printed page 158) and `Sapa p’unchay` (each day) on printed page 18. Local `day`
and `every-1-day` previously contained English words with a language prefix;
they now use those native terms. These are quoted lexical entries rather
than newly composed astronomical terminology. Other Quechua varieties may
spell the day noun differently; this batch consistently follows the native
Cusco Collao source without overwriting unrelated existing values.

The board calendar and multiboard calendar both translate the `day` toolbar
label through this key. The focused test verifies that wiring, exact native
values, and rejection of the previous English wrappers. The older recurrence
key has no direct reference in the inspected client source. No live browser
check is claimed. The pending astronomical-epoch compound remains unresolved.

## Named calendar noun corrections — 2026-09-14

Dangi, Minguo and the generic Hijri option now use the dictionary's generic
calendar noun, preserving their proper names. The same dictionary's printed
page 42 identifies `Inti watana` as a clock; page 18 distinguishes calendar.
These options select a calendar system in Member Settings, rather than a
clock. Their name-plus-noun constructions are adapted, **low confidence**
pending full native compound review; the dictionary does not quote these
three complete labels. Exact noun/proper-name regression tests cannot prove
full fluency or browser rendering.

The remaining calendar options, settings heading, astronomical qualifier
and other existing uncertain translations still require review. No original
pending finding is resolved by this batch, and no live browser test ran.

## Nine calendar-option noun repairs — 2026-09-14

Local commit `474a2909e` replaces Intiwatana (clock) with Watanqillqa
(calendar) in Gregorian, Buddhist, Chinese, Coptic, Ethiopic Amete Alem,
Ethiopic, Hebrew, Japanese and Umm al-Qura options. The Chilean Ministry
of Education Cusco Collao dictionary 2019 printed page 18 attests calendar;
printed page 42 identifies Inti watana as clock. Source:
https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-134497_recurso_pdf.pdf

Exact existing names and qualifiers are preserved. **Low confidence**
remains for retained naming/modifiers, native full compounds and browser
rendering. This lexical repair does not certify all components or all
Quechua varieties. The generic calendar-system heading and remaining
Jalali, ISO week and civil/sighting/astronomical labels still need their
complete source meanings checked. No pending qualifier is accepted here.
Existing ledger original-before values are preserved where present; eight
new unflagged records and one revision bring total records to 18,751.
Four focused checks pass; no browser validation was run. Original pending
findings remain 259; native/runtime and prior uncertain repairs stay open.

## Jalali, ISO weeks and week label — 2026-09-14

Local commit `2307b8332` repairs three Quechua values. Jalali's omitted
proper name is restored while retaining Persian identification. ISO 8601
now explicitly identifies the Gregorian calendar and weeks, rather than
only naming the standard with a clock noun. The generic week label is
Simana, removing the unrelated Kay willaymi wrapper.

The Chilean Ministry of Education Cusco Collao dictionary 2019 PDF pages
45, 83 and 159 explicitly attest Simana as Quechuized week. A word being
a Spanish loan does not make it wrong-language when the primary native
dictionary explicitly accepts it. Calendar Watanqillqa is separately
attested; the previous clock/calendar distinction applies here too.
Source:
https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-134497_recurso_pdf.pdf

**Low confidence** remains for retained Persa/Gregoriano names, adapted
plural simanakuna and full native compounds. The generic calendar-system
heading and civil/sighting/astronomical labels remain open. Four focused
checks pass; no browser validation was run. Original ledger before values
are preserved on revisions; two new records bring total to 18,753.
Original pending findings remain 259; broader native/runtime review stays open.

## Calendar-system heading — 2026-09-14

Local commit `06f88d5ed` replaces clock-only calendar-system with a
calendar/system/date-display heading. Peru Ministry of Education Central
Quechua vocabulary PDF page 85 (printed 84) attests llika system/network
with a respiratory-system example; PDF page 141 (printed 140) repeats the
Spanish-to-Quechua system/network entry. This is primary evidence, not
sole reliance on crowdsourced system candidates. Source:
https://formacionenservicio.minedu.gob.pe/sifods/centro-recurso/2022/Material-educativo/726.ITEM-56-VOCABULARIO-QUECHUA-CENTRAL-PDFWEB.pdf

**Low confidence** remains for borrowing this component across Central
Quechua and the locale's Cusco Collao base, day-to-date interpretation,
existing display rikuchiy and full compound grammar. The complete calendar
system phrase is adapted, not quoted from either dictionary. UserHeader.jade
uses the heading above the calendar-system selector. No live browser
verification was run. Four focused translation checks pass; original ledger
before is preserved on revision. Original pending remains 259; records stay
18,753. Specific civil/sighting/astronomical qualifiers and broader native
verification remain open.

## Tabular Hijri epoch labels — 2026-09-14

Local commit `963a3965b` repairs civil and astronomical tabular Hijri labels.
Both use Watanqillqa rather than the clock-related Intiwatana. The previously
English-only astronomical label now has the same table/count and beginning
wording as the civil variant. Explicit Julian starting dates preserve their
one-day difference: 622-07-15 versus 622-07-16. These are fixed epoch
identifiers in selector labels, not a second user calendar or date formatter.

Primary references:
- [Peru Ministry of Education mathematics glossary](https://formacionenservicio.minedu.gob.pe/sifods/centro-recurso/2022/Material-educativo/392.Matematica-2-Quechua-2021-ITEM-18-PAG-WEB.pdf): tawla (table), yupay (number/count).
- [USMP Quechua dictionary, volume 2](https://fcctp.usmp.edu.pe/librosfcctp/DICCIONARIO-Quechua-espanol-VOL_2.pdf): qallariy includes beginning and point of departure.
- [Unicode CLDR calendar types](https://cldr.unicode.org/development/development-process/design-proposals/islamic-calendar-types): civil Friday and astronomical Thursday epochs, both tabular, with Julian dates.

**Low confidence:** tawla yupay is an assembled technical description, not
an attested complete translation of tabular-calendar calculation. Using
qallariy for a calendar epoch is likewise an adaptation. Dialect consistency,
Juliano borrowing, the complete grammar and Saudi sighting wording still
need review. Zero original Quechua pending entries does not close this
broader review. Four focused suites pass; no live calendar-selector browser
validation was run. Ledger 19,765; original corrected 15,685, pending 218,
restored 4 unchanged. No remote push.

## Saudi moon-sighting label — 2026-09-14

Local commit `3edd8d499` revises calendar-system-islamic-rgsa: replace
clock-only Intiwatana with Watanqillqa, and explicitly identify moon sighting
in Saudi Arabia. The old rikusqa qualifier left the observed object unclear.

Primary references:
- [USMP Quechua dictionary, volume 1](https://fcctp.usmp.edu.pe/librosfcctp/DICCIONARIO-Quechua-espanol-VOL_1.pdf): AVISTAMIENTO gives qhawarisqa for the result of sighting.
- [Peru Ministry of Education Southern Quechua vocabulary](https://formacionenservicio.minedu.gob.pe/sifods/centro-recurso/2022/Material-educativo/757.018453-ITEM-16-Vocabulario-pedinaria-Quechua-Sureno-ALTA.pdf): killa in lunar vocabulary and a moon-phase section.
- [Unicode CLDR calendar types](https://cldr.unicode.org/development/development-process/design-proposals/islamic-calendar-types): rgsa is Saudi Arabia sighting, distinct from both tabular epochs.

Full calendar compound and dialect consistency remain low confidence.
The individual dictionary entries do not attest the assembled technical
phrase. Four focused suites pass, preserving all locale placeholders,
key order, original ledger before values and newer translations. The
regression rejects clock wording in all calendar-system labels and tabular
calculation/epoch wording in the Saudi sighting label. No browser run.
Counts unchanged: ledger 19,765, original pending 218, restored 4. This
revises an existing correction; zero Quechua queue entries does not prove
completion of broader native review. No remote push.
