# Nahuatl calendar terminology review

Reviewed **2026-09-14**. All 17 original calendar findings remain open.
No locale values were accepted or changed during this reference review.

The current calendar-system value is Azerbaijani, not Nahuatl. The
remaining names include English placeholders and a Jalali/Fars label.
Country, tradition and calendar identifiers must remain distinguishable;
Hijri civil/astronomical epochs and moon-sighting variants need full labels.

The [University of Oregon Nahuatl Dictionary](https://nahuatl.wired-humanities.org/node/196911)
identifies tonalpohualli as a day count associated with the 260-day
Mesoamerican divinatory calendar. Its entry distinguishes the 365-day
xiuhpohualli. This is evidence for historical terminology, not proof that
tonalpohualli alone is a neutral modern label for Gregorian, Coptic or Hijri.

[UNAM's terminology study](https://nahuatl.historicas.unam.mx/index.php/ecn/article/view/77841)
distinguishes several historical calendar counts. A blanket prefix applied
to all modern calendar names would therefore need semantic validation.

The [dictionary entry for tlamantli](https://nahuatl.wired-humanities.org/content/tlamantli)
describes an item or separate thing and a counter used with quantifiers.
It does not independently establish a software-calendar-system compound.
No dictionary attestation was found for the proposed display noun neztiliztli.
Do not claim an assembled compound is attested from these entries.

Next: find modern Nahuatl calendar/date-display usage, choose wording consistent
with this locale's dialect and spelling, translate the missing distinctions,
and document any provisional compounds. Then verify placeholder inventories,
calendar-option wiring and browser rendering. Existing English/Azerbaijani
values remain repairs to do; reference uncertainty is not a reason to omit them.

## Modern calendar labels repaired — 2026-09-15

Source commit `56ce505d0` replaces all 17 Azerbaijani, English and incomplete
calendar labels with a coordinated `tonalli tlapohualiztli` modern
date-reckoning family. UNAM's terminology evidence shows that `tonalpohualli`,
`xiuhtlapohualli` and related names identify particular historical counts, so
the generic software selector deliberately does not reuse them.

The repaired family retains Jalali/Persia, Buddhist, Chinese, Coptic,
Dangi/Korea, Ethiopic/Amete Alem, Hebrew, Indian national, Hijri, Umm al-Qura,
Japanese and Minguo/Republic of China identities. The Hijri labels separately
retain calculated civil and astronomical starting points and Saudi moon
sighting. Entity names, modern technical vocabulary and the assembled generic
compound remain LOW CONFIDENCE pending native contextual review.

Four focused files pass: 20,008 exact correction records, all 17 exact labels,
negative historical/foreign names, every runtime calendar ID, distinct Hijri
variants, newer-value preservation and all 234 locale token/key inventories.
No live calendar picker ran. The tracked Nahuatl queue is complete: overall
pending 100, no Nahuatl row, restored four unchanged. Broader uncertain review
continues.
