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
