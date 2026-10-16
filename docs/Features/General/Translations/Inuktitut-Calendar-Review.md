# Inuktitut calendar terminology review

Reviewed **2026-09-14**. The calendar findings remain open; no calendar value
was changed during this review.

The Member Settings label in `client/components/users/userHeader.jade` belongs
to `select#calendar-system`. It selects the calendar used to display dates,
not just a date formatting pattern. The separate `date-format` key must remain
a distinct concept. Current `calendar-system` is Azerbaijani:
`Kalendar sistem (data görünüşü)`.

The [Nunavut Legislative Assembly's 2026 sitting calendar](https://assembly.nu.ca/sites/default/files/2025-12/2026%20Sitting%20Calendar%20for%20the%20Legislative%20Assembly%20of%20Nunavut%20-%20Inuktitut.pdf)
attests `ᐅᓪᓗᖅᓯᐅᑎ` for calendar in the title and introductory text (PDF page
1, extracted lines 16–21). This supports the existing local calendar noun;
it does not establish a full translation of “Calendar system (date display)”.
The same PDF has English weekday abbreviations in its extracted calendar grid.
Those abbreviations do not establish native Inuktitut weekday terminology.

Existing authentication labels use `ᐱᓕᕆᔾᔪᓯᖓ` for method and display-name
uses `ᑕᑯᑎᑕᐅᔪᖅ`. Neither local usage proves the complete calendar-system
compound or the correct nominal construction for date display. Search leads
for the first term describe administrative processes. The date-display search
did not produce usable primary terminology; unrelated commercial display
results were rejected. No full phrase was accepted on script matching alone.

Remaining work includes the heading and native calendar-name qualifiers,
especially civil versus astronomical epochs and moon-sighting distinctions.
Preserve Dangi, Amete Alem, Umm al-Qura, Minguo and ISO identifiers where they
are proper names, while translating explanatory prose without losing meaning.
Do not substitute an English or Azerbaijani qualifier for native prose merely
because it accompanies a proper name. Primary terminology, complete native
phrase review and browser settings validation are still required.

## Named calendar labels, 2026-09-14 (da6762a48)

Dangi and Minguo now retain those exact source names with the independently
attested `ᐅᓪᓗᖅᓯᐅᑎ` calendar noun in parentheses. The official Nunavut PDF
was opened again and its introductory native calendar text verified. Dangi
is not replaced with a generic Korean calendar, and Minguo is distinct from
the Chinese calendar. English explanatory country descriptions are removed.

LOW CONFIDENCE full display-name convention: these combined labels are
adaptations, not exact complete labels from the official document. Native
proper-name rendering, full naming fluency and browser settings remain open.
The calendar noun alone does not resolve other qualifiers or the heading.
Focused name/noun consistency, English-negative and calendar distinction
checks pass, with all 18,687 corrections, 4,171 retained reviews and 234-locale
completeness. Two original findings are corrected; 38 Inuktitut findings and
283 original findings overall remain pending. Nine restored findings remain.
Earlier paragraphs describe the state before these two repairs.

## Qaliujaaqpait Roman orthography retained — 2026-09-15

Source commit `a0eeee9d63` reviews and retains all 23 findings whose only
detector reason was Latin script. The
[Government of Northwest Territories Inuktitut guidance](https://www.ece.gov.nt.ca/en/inuktitut)
states that Inuktitut is traditionally written in both Qaniujaaqpait
syllabics and Qaliujaaqpait Roman orthography. The Nunavut-based
[Pirurvik resources](https://www.pirurvikmedia.ca/online-resources)
likewise provide conversion in both directions and describe both writing
systems. Latin characters alone therefore do not establish a wrong-language
or wrong-script translation.

The exact existing values are recorded as unchanged acceptances; no automatic
transliteration or semantic rewrite is applied. Four focused files pass for
all 4,197 retained reviews, 20,035 corrections, placeholders, key order and
all 234 locale inventories. Original pending falls from 73 to 50, with 15
Inuktitut calendar labels remaining; restored four unchanged. Semantic
fluency and live browser behavior remain in the broader review. No remote
write occurred.

## Remaining calendar labels repaired — 2026-09-15

Source commit `b5acfdaec3` repairs all 15 remaining Inuktitut findings. Every
label uses the official Nunavut-attested `ᐅᓪᓗᖅᓯᐅᑎ` calendar noun. The heading
uses existing local `ᐱᓕᕆᔾᔪᓯᖓ` method, `ᐅᓪᓗᖅ` date and `ᑕᑯᑎᑕᐅᔪᖅ`
displayed vocabulary. Calendar identifiers remain recognizable. Existing
syllabic table, beginning, national, space/science, month and seen vocabulary
distinguishes calculated civil and astronomical starting points from Saudi
moon sighting.

**Low confidence:** complete technical compounds and proper-name adaptation
remain under fluent review. Four focused files pass for exact labels, all
20,050 correction records, distinct runtime calendar choices, newer-value
preservation and all 234 locale token/key inventories. No live selector ran.
Original pending is 35 with no Inuktitut row; restored four unchanged. No
external translation service or remote write.
