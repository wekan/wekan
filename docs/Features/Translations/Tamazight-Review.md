# Standard Moroccan Tamazight reference review

Reviewed **2026-09-14**. Translation repairs remain open.

The first 25 pending `zgh` audit entries were inspected against English.
They contain French prose, including account lockout, user activation,
loading/data-loss warnings, board migrations and imported-member mapping.
These are confirmed wrong-language values; no acceptance was added.
The mapping description must preserve the imported member's role and the
restriction against granting additional permissions.

The [IRCAM dictionary](https://tal.ircam.ma/dglai) is the intended primary
reference. Its login page returned HTTP 502 during this review.
A [community IRCAM-derived dataset](https://huggingface.co/datasets/hbouqssi/ircam-dglai)
provides searchable entries, but describes itself as automatically scraped
and cleaned. It is a reference lead, not independently verified evidence.
Its declared CC-BY-NC license also means it must not be bundled as a WeKan
dependency. A temporary reference copy lives under `.tools/tmp`, outside git.

| Entry ID | Tifinagh | Reported French meaning | Review needed |
| --- | --- | --- | --- |
| 134310 | ⴰⵏⵙⵎⵔⴰⵙ | utilisateur, usager | Cross-check primary entry; existing username spelling differs. |
| 136226 | ⴽⵍⵉⴽⵉ | cliquer | Cross-check primary entry and inflection in instructions. |
| 136215 | ⴽⴽⵯⵔ | becqueter, cliquer | Verify technical sense and dialect/register. |

Do not reuse the invalid Tuareg CNAM MCΓ provenance as Moroccan evidence.
Next steps are to cross-check these entries and compose complete Moroccan
phrases, preserving warning negation, temporary lockout, role scopes and
source placeholders. Script conversion alone cannot establish translation
correctness. No locale strings changed in this reference review.
