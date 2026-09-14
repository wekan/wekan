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

## Action-label repair and lockout comparison, 2026-09-14

Local commit `9024c6cf8` changes French `change` = Modifier to `ⵙⵏⴼⵍ`.
Native MediaWiki uses this imperative in edit and skin-view-edit. Existing
WeKan edit already has that value and is preserved. The card-details control
changes the custom-field layout; it is not an activation toggle. Focused
exact-value, French-negative and edit-consistency checks pass. This was an
unflagged repair; all 173 original pending findings remain open.

The same native source's actionthrottledtext contains only a polite request
to retry after a few minutes. Its English counterpart also explains an
anti-abuse rate limit, which the native value omits. It therefore attests
retry wording, not a complete equivalent of WeKan account-locked. WeKan
requires temporary account lockout, failed-login cause and retry later;
copying the native message would omit the cause and invent fixed timing.
User-blocked wording likewise does not establish temporary login lockout.
The next repair must retain all those meanings, not accept a source key
merely because its name concerns throttling.

Sources:
- https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
- https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/en.json

## Buddhist calendar adaptation, 2026-09-14 (8422804a4)

[Native Tamazight article, revision 140790](https://zgh.wikipedia.org/w/index.php?title=ⵜⴰⴱⵓⴷⵉⵜ&oldid=140790)
was fetched directly with curl after the web reader failed. The native image
caption uses the Buddhist adjective `ⴰⴱⵓⴷⴷⵉ`. The article is a community
stub with a missing-reference notice, so it attests vocabulary usage rather
than finalized normative terminology or historical claims. English infobox
fallbacks are not accepted as native evidence.

`calendar-system-buddhist` now combines the independently attested calendar
noun with that adjective. The whole calendar name is adapted, not quoted
from CLDR or the article; broader native compound and browser review remain
open. Exact-value, English-negative and Islamic-calendar distinction checks
pass. One original finding is corrected; 172 Tamazight findings remain pending.
Earlier paragraphs with 173 describe the queue before this repair.

## Hebrew calendar adaptation, 2026-09-14 (bd4a6a494)

[Native Safi article, revision 156843](https://zgh.wikipedia.org/w/index.php?title=ⴰⵙⴼⵉ&oldid=156843)
was fetched directly. Its native prose uses `ⴰⵄⵉⴱⵔⵉ` as the Hebrew adjective.
This attests vocabulary outside a language-name menu, not the complete
Hebrew calendar name or the truth of the article's historical account.
The calendar label combines this adjective with the verified calendar noun.
LOW CONFIDENCE full calendar terminology: the compound is adapted and needs
broader native naming review. It does not substitute Israel or a country
calendar for the Hebrew system. Exact-value, English-negative and Buddhist
calendar distinction checks pass. Browser execution remains open.
One further original finding is corrected; 171 Tamazight findings remain.
Earlier 172/173 counts describe earlier stages, not the current queue.

## Indian National Calendar adaptation, 2026-09-14 (7ba02a179)

[CLDR Moroccan locale source](https://raw.githubusercontent.com/unicode-org/cldr/main/common/main/zgh.xml)
supplies the calendar noun and territory IN = ⵍⵀⵉⵏⴷ.
[Moroccan Amazigh dictionary entry](https://en.wiktionary.org/w/index.php?title=ⴰⵏⴰⵎⵓⵔ&oldid=92669424)
defines ⴰⵏⴰⵎⵓⵔ as the national adjective. IRCAM's indexed native news
also uses it for the national translators' association, but the direct page
and lexicon PDF could not be read in this run; do not treat their indexed
snippets as full independently inspected evidence.

The English Indian national label now combines calendar, national and of
India. LOW CONFIDENCE complete compound: the sources support components,
not the exact calendar name. The national qualifier is retained; this does
not claim any calendar used in India is the Indian National Calendar.
Focused exact-name, qualifier-preservation, English-negative and Chinese
calendar distinction checks pass. Broader native naming and browser review
remain open. One further original finding is corrected; 170 Tamazight
findings remain pending. Earlier counts describe earlier review stages.

## Generic rule name labels, 2026-09-14

The native [MediaWiki Moroccan Tamazight source](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
uses `ⵉⵙⵎ` in `rcfilters-savedqueries-new-name-label`,
`upload-form-label-infoform-name`, `listfiles_name` and `allmessagesname`.
These are complete generic name labels, not just script matches or a
username compound. French `nom` in `r-name` and `r-sort-name` is replaced
with this noun. Actual rule templates use the former as a name-input
placeholder and the latter as a sorting attribute. No qualified name,
username, repository-name or display-name compound is accepted from this
single noun. Exact-value and French/English-negative checks are added.
Running-browser validation remains open. Both are unflagged additional
repairs; original pending/restored counts remain 283/9.
