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
