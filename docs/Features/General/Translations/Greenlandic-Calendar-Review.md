# Greenlandic calendar terminology review

Reviewed **2026-09-14**. Draft repairs: local commit `3a6936cce`.
Both labels are changed; native grammar and epoch paraphrases remain open.

Initial evidence recorded in `8ba8134b9` follows; the dated repair update
at the end supersedes its unchanged-value status.

The official Language Secretariat library glossary gives calendar
qaammatisiutit and astronomy ulloriarsiorneq. Its language committee
minutes of 2023-08-16 approve matematikkimi tabelit for mathematical tables.
Thus tabelit is an approved borrowing, not automatically a wrong-language
value merely because it resembles Danish.

Sources:

- [Official library glossary](https://oqaasileriffik.gl/nunatta-atuagaateqarfiani-taaguusersuutit/nunatta-atuagaateqarfiani-sammisamut-nalunaarsuutit/)
- [2023 committee decisions](https://oqaasileriffik.gl/da/2023/08/16/oqaasiliortut-2023-8-gl/)
- [2025 start-date decision](https://oqaasileriffik.gl/en/2025/06/12/oqaasiliortut-2025-8-gl/)

The 2025 committee decision gives aallartiffik for start date. The
Secretariat dictionary also uses it to explain beginning. This supports
an epoch paraphrase as a starting date; it does not certify a full
astronomical-epoch compound or its possessive inflection.

[Dictionary beginning entry](https://oqaasileriffik.gl/en/dict/?lex=32291).

ICU defines islamic-civil and islamic-tbla as the same tabular algorithm,
with civil Friday and astronomical Thursday epochs respectively. A
repair must retain both the tabular method and the distinct starting
reference. Translating civil as civilian people or astronomy as astrology
would introduce a different meaning.

[ICU calculation types](https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/com/ibm/icu/util/IslamicCalendar.CalculationType.html).

Next review: construct complete calendar labels using these terms, check
native inflection and how the epoch distinction reads in context. Weekday
explanations are possible evidence-based paraphrases, but a generic
calendar name or a table noun alone would omit required information.
No locale values or date arithmetic are changed in this review.


Greenlandic epoch label drafts — 2026-09-14, `3a6936cce`.
Both remaining abbreviated English tabular Hijri labels are replaced with
complete explanatory drafts. Calendar/Hijri and table-based method are
retained. Civil epoch is described by its defining Friday starting
reference; the astronomical label retains astronomy and Thursday.
ICU definition and primary vocabulary sources are linked in
Greenlandic-Calendar-Review.md. Official weekday usage is also attested:
https://oqaasileriffik.gl/da/kategori/medarbejdere/
https://oqaasileriffik.gl/da/2025/06/20/oqaasiliortut-2025-4-gl/
Low confidence: table-based phrase, astronomy possessive and explanatory
epoch wording require native review. Civil is not translated as civilian
people. Date arithmetic remains unchanged. Four source checks pass with
exact full labels, English negatives and distinct-epoch coverage.
Original corrected 15,656; pending 246; Greenlandic original queue zero
is not fluency certification. Ledger 18,787. Earlier pending notes are
superseded by drafts, with native/browser validation still outstanding.
