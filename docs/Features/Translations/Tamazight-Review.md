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
| 134310 | ⴰⵏⵙⵎⵔⴰⵙ | utilisateur, usager | Independently attested in native software; full account clauses remain open. |
| 136226 | ⴽⵍⵉⴽⵉ | cliquer | Native software imperative attested; complete toggle instruction remains open. |
| 136215 | ⴽⴽⵯⵔ | becqueter, cliquer | Verify technical sense and dialect/register. |

Do not reuse the invalid Tuareg CNAM MCΓ provenance as Moroccan evidence.
Next steps are to cross-check these entries and compose complete Moroccan
phrases, preserving warning negation, temporary lockout, role scopes and
source placeholders. Script conversion alone cannot establish translation
correctness. No locale strings changed in this reference review.

## Independent native cross-checks, 2026-09-14

[ESEFA, Ibn Zohr University's calendar page](https://esef.uiz.ac.ma/tz/%E2%B4%B0%E2%B5%99%E2%B5%8E%E2%B5%8D%E2%B5%93%E2%B5%99%E2%B5%99%E2%B4%B0%E2%B5%8F-%E2%B5%8F-%E2%B5%9C%E2%B5%89%E2%B5%8D%E2%B4%B0%E2%B5%8D/)
uses `ⴰⵙⵎⵍⵓⵙⵙⴰⵏ` in its native calendar heading. This independently
supports dataset entry 134276 and the existing local `calendar` value. It
does not validate missing calendar qualifiers. The page also contains English
dates; those are not evidence for native date-format prose.

[MediaWiki's Standard Moroccan Tamazight software translations](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
use `ⴰⵏⵙⵎⵔⴰⵙ` in `passwordreset-emailtext-user` and `redirect`.
`filehist-help` and `rcfilters-quickfilters-placeholder-description` use
`ⴽⵍⵉⴽⵉ` for the click instruction. These cross-check the user noun and
software imperative without treating the entire scraped dataset as validated.
The existing username value follows a different spelling used by the same
software source; this difference alone does not justify replacing it.

The dictionary login still returned 502. The IRCAM publication-177 PDF could
not be verified through the web reader; direct curl failed certificate-chain
validation. No unverified PDF content was accepted and no certificate bypass
was used. The school-lexicon publication remains a potential primary lead.

These results change the next repair step: complete account/toggle phrases
can use the independently attested user/click components, but activation
versus attempting, negation and full clause grammar must be checked separately.
No pending finding or invalidated Tuareg record is resolved by component-word
evidence. All 173 original Tamazight findings remain pending.
