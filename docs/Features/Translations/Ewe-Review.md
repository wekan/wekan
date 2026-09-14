# Ewe calendar terminology review

Reviewed **2026-09-14**. Remaining work is not complete.

Current local `calendar-system-islamic-tbla` is **Islamic tabular**. It
is English and omits astronomical epoch. The current CLDR 49 Ewe summary
shows `islamic-tbla`, an identifier fallback rather than a translation.
CLDR's primary Ewe XML marks the generic Islamic and Islamic civil names
`draft="provisional"`. The civil name has no explicit epoch wording and
cannot supply the astronomical variant's complete translation.

| Evidence | What it establishes | What remains missing |
| --- | --- | --- |
| CLDR `calendar` | kalenda | Complete variant phrase |
| CLDR `islamic` | Provisional generic Hijri wording | Tabular calculation and epoch |
| CLDR `islamic-civil` | Provisional civil calendar wording | Explicit civil epoch; astronomical variant |
| CLDR 49 `islamic-tbla` | Identifier fallback only | Native translation of the entire label |

Sources checked directly:
- https://raw.githubusercontent.com/unicode-org/cldr/main/common/main/ee.xml
- https://unicode.org/cldr/charts/49/summary/ee.html

Do not replace astronomical epoch with astronomy, an era, a weekday alone,
or moon sighting. Tabular means calculation from calendar tables, not a
piece of furniture. The university-hosted Basic Ewe course's desk/table
examples do not establish that technical meaning. Next research must seek
native computational-table and reference-date terminology, then compose
and review the full label. Preserve correct existing translations and all
placeholders. No locale value or classification was changed by this review.
