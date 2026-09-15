# Standard Moroccan Tamazight reference review

## Board/card headings and removal actions, 2026-09-15 (`18a11d121`)

My Boards and My Cards now combine native plurals with the existing
possessive `ⵉⵏⵓ`; My Cards exactly matches the shortcut-filter phrase.
To boards uses the local direction marker `ⵖⵔ`, Close Board the local
close verb `ⵔⴳⵍ`, and the board/card member-removal actions the local
Remove Member verb `ⴽⴽⵙ` and from marker `ⵙⴳ`. The board/card nouns
come from existing WeKan phrases. The full constructions remain
**low confidence** for native grammatical review.

The focused test verifies source tokens, exact correction records and
active My Cards, invitation and member-removal controls. My Boards
and Close Board are present as locale keys but were not found in the
current active templates. All 234 locales remain structurally complete;
Arabic-script values fall from 109 to 104. Other wrong-language values
need individual semantic review.

## Check Version button and failure message, 2026-09-15 (`ff5a286b5`)

The Admin Panel button and its offline/timeout/error fallback no longer
use mixed French and Arabic shorthand. The
[Tamazight verb list](https://huggingface.co/datasets/Tamazight/Tamazight-Verbs/blob/main/Tamazight%20Verbs.tsv)
glosses `ⵙⵙⵉⴷⴻⴷ` as “check” (distinct from `ⵙⵙⵉⴷⴷ`, “light up”).
The version noun remains the
[MediaWiki zgh locale's](https://github.com/wikimedia/mediawiki/blob/master/languages/i18n/zgh.json)
`ⵜⵓⵏⵖⵉⵍⵜ`; the number noun and could-not construction already occur
in the WeKan locale. The complete failure clause and verb inflection
are **low confidence** pending native review, although all semantic
components are individually supported.

Focused source-wiring, exact-ledger, token and 234-locale checks pass.
Arabic-script values fall from 111 to 109; remaining version-name and
broader wrong-language values still need classification.

## Admin Panel version terminology, 2026-09-15 (`413b4ef40`)

The native Standard Moroccan Tamazight MediaWiki locale uses
`ⵜⵓⵏⵖⵉⵍⵜ` in its Version page and version-required messages:
[MediaWiki zgh locale](https://github.com/wikimedia/mediawiki/blob/master/languages/i18n/zgh.json).
The WeKan, Meteor, MongoDB, FerretDB and Node version rows now use
that noun instead of Arabic, French or a different local noun.
Product names are preserved, as is the existing MongoDB compatibility
qualifier. The exact compound grammar needs native review.

Focused production-source, token and correction-ledger checks pass;
all 234 locale files remain complete. Arabic-script values fall from
113 to 111. The adjacent Check Version button and error message were
repaired in `ff5a286b5`; their full grammar and other version-name
terminology still need review.

## Shared UI labels, 2026-09-15 (`63da3d3c9`)

Six Arabic-seeded labels outside the original findings now reuse native
terms already present in the locale: Import Board, Invite People, Unknown,
Type, Size and Restore. English source meanings match case-insensitively.
These labels occur in the sidebar, user header, result cards and attachment
settings; the focused test checks those live template references, exact
ledger entries and unchanged source tokens. All 234 locale files remain
structurally complete. Arabic-script values fall from 119 to 113. Full
native wording and remaining Arabic-script values need individual review.

## Member/action popup labels and Copy Link, 2026-09-15 (`e11a2654c`)

Five Arabic labels outside the original findings are repaired.
`memberMenuPopup-title` exactly matches the existing
`memberPopup-title`; Move Card reuses the action phrase in
`r-move-card-to`. Leave Board and Remove Member reuse their
native actions plus the popup question mark. Copy Link to
Clipboard reuses the copy/link/clipboard phrase already shown
for card links, omitting only the card qualifier.

The card menu still references the Move Card key. Focused
positive/negative, source-wiring, exact-ledger (22,281 records)
and 234-locale checks pass. Arabic-script values fall from
124 to 119. Complete phrases and interaction context remain
open to fluent native review.

## Comments, Link and Email Addresses, 2026-09-15 (`2b22dd0be`)

Three Arabic UI labels outside the original flagged table are repaired.
`comments` reuses the existing plural in `card-comments-title`, and
`link` reuses the native noun in `link-to-search`. For
`email-addresses`, the [IRCAM media glossary](https://biblio.ircam.ma/pmb/uploads/publications/133.pdf)
lists address as `ansa` and its plural as `ansiwn`; the plural
is rendered `ⴰⵏⵙⵉⵡⵏ` and paired with the already established local
email noun `ⵉⵎⴰⵢⵍ`. The singular `email-address` remains intact.
The full software compound and register still need fluent review.

The focused positive/negative and source-token test, exact-ledger
check (22,276 records) and 234-locale structural check pass.
Arabic-script values fall from 127 to 124. Remaining Arabic
values need individual semantic classification; intentional
symbols and technical names must not be treated as prose errors.

## Common popup titles, 2026-09-15 (`79e5a93b4`)

Thirteen unflagged popup titles formerly in Arabic now use
native local Tamazight board, card, label, language, settings,
notification and profile terms. The settings, label creation,
profile edit and import-board titles reuse exact existing
labels. Full board-information and create/edit phrase grammar
remains **low confidence** pending fluent review.

Focused positive and wrong-language negative assertions,
ledger and 234-locale completeness checks pass. Arabic-script
values fall from 140 to 127. Original flagged findings are
unchanged; permissions and link actions still need review.

## Unset status and removal action contexts, 2026-09-15 (`f0ceb8d72`)

The Arabic `unset-color` key was used for both status displays
and removal buttons. Six Jade controls now use existing action
translations: five generic `remove-btn` buttons and one specific
`remove-background-image` button. All locale files already have
these keys. Settings status displays continue to use `unset-color`;
zgh now takes its native not-set wording from `cloud-secret-none`.
This avoids showing an imperative as a status or “not set” on
an active removal button.

The source test checks all locale inventories and rejects any
old `unset-color` button use. All edited Jade compiles, ledger
and 234-locale checks pass. A focused Chromium card-color popup
test passed (1 UI test, list reporter). Arabic-script values
fall from 141 to 140; original flagged finding categories
are unchanged.

## Board settings and color popups, 2026-09-15 (`87c049571`)

Eight unflagged Arabic board, visibility, watch and color popup
labels are repaired. `boardChangeTitlePopup-title` exactly
reuses native `rename-board`; three choose-a-color titles
exactly reuse `select-color`. The visibility control and popup
are byte-identical; native visibility, watching, set and color
components replace the other Arabic phrases.

Full visibility/watch/set-color command grammar remains
**low confidence** pending fluent review. The focused test
checks source keys, native components, duplicate popup/control
wording and absence of Arabic seeds; exact-ledger and 234-locale
checks pass. Arabic-script values fall from 149 to 141.

The shared `unset-color` action/status issue identified in this
batch was resolved in `f0ceb8d72`. Original flagged finding
classifications are unchanged.

## Board-background controls, 2026-09-15 (`79d58098f`)

Nine unflagged Arabic color/image controls and popup titles are
repaired from existing native zgh terms. Change color exactly
reuses `ⴱⴻⴷⴷⴻⵍ ⵉⵏⵉ`; background image reuses the noun in
`upload-background`. Add/remove commands use `ⵔⵏⵓ` and `ⴽⴽⵙ`.
The board-background popup title now names the board backdrop,
using `ⴰⴳⴰⵍⵉⵙ` found in local set-as-background wording,
instead of the former Arabic “screen background.” Technical
`URL` is retained for the field. Duplicate popup/control labels
are byte-identical.

The complete background-image and board-backdrop phrases remain
**low confidence** for Standard Moroccan Tamazight grammar.
The focused test checks native components, duplicate UI labels,
and absence of Arabic seeds; exact-ledger and 234-locale checks
pass. Arabic-script values fall from 158 to 149. Original
flagged finding classifications are unchanged.

## Activity messages and production context, 2026-09-15 (`ada7e3533`)

Nine unflagged Arabic/French messages are repaired. The activity
UI uses `activity-sent` only when restoring a card to a board;
its replacement therefore uses the native `act-restoredCard`
verb. `activity-excluded` is used for removing a board member,
so it uses the same remove/from pattern as native member-removal
messages. Create, move, comment edit, comment-on-card, show and
notification messages reuse native local activity and UI terms.
The earlier Arabic `activity-removed` also used the wrong
preposition (“to”) for English “from”; it now uses `ⵙⴳ`.

All `%s` tokens retain their exact count. The focused test
checks the actual production activity types, positive native
components and negative wrong-language seeds. Exact-ledger and
234-locale checks pass. The notification compound and complete
activity clauses remain **low confidence** pending fluent review.
`activity-joined`/`activity-unjoined` still have Arabic seeds;
their native membership verbs need separate verification.
Arabic-script values fall from 166 to 158. Original flagged
finding categories remain unchanged.

## Admin active and inactive labels, 2026-09-15 (`f10daf2ae`)

Four unflagged wrong-language labels are repaired: `active` and
`admin-people-filter-active` were Arabic, while
`admin-people-filter-inactive` and `admin-people-active-status`
were French. The replacement active term is the component of
the existing `active-person`, `active-team` and `active-org`
labels. The inactive qualifier comes from `inactive-member`;
the status noun comes from `operator-status` and other status
headings. A focused negative check rejects the former Arabic
and French seeds, and exact-ledger and 234-locale checks pass.

These isolated adjective uses, the inactive qualifier as a
filter value, and complete status compound grammar remain
**low confidence** pending fluent review. Arabic-script values
fall from 168 to 166. The original flagged finding categories
are unchanged.

## Filter and sort controls, 2026-09-15 (`65c667419`)

Three unflagged wrong-language controls are repaired:
`filter-hide-empty` was French, `set-filter` was French, and
`sort-is-on` was Arabic. The hide command uses the local
`ⴼⴼⵔ`; the plural list and lists-without-cards clause comes
from the duplicate-empty-list migration. The set-filter command
uses local `ⵙⵔⵙ` and `ⵜⴰⵎⵣⵉⵣⴷⴳⵜ`; sort-active adapts the
existing filter-active sentence and `ⴰⴼⵔⴰⵏ` sort noun.

These complete assembled sentences, including the masculine
agreement in sort-active, remain **low confidence** pending fluent
review. The components have independent local uses. Focused
positive/negative, exact-ledger and 234-locale checks pass.
Arabic-script review values fall from 169 to 168; original
flagged finding classifications are unchanged.

## Creator labels, 2026-09-15 (`bea96680e`)

The mixed French/Arabic `filter-creator-label` and Arabic
`creator-on-minicard` were outside the original flagged queue.
Both now use the local native `ⴰⵎⵙⵏⴼⵍⵓⵍ` creator label, the
existing filter `ⵣⵉⵣⴷⵉⴳ`, and the established minicard
`ⵖⴼ ⵜⴽⴰⵕⴹⴰ ⵜⴰⵎⵥⵢⴰⵏⵜ` location phrase.
The assembled genitive and minicard sentence grammar remain
**low confidence** pending fluent review; the native component
terms are independently present in WeKan's zgh labels.
Focused positive/negative, exact-ledger and 234-locale checks pass.
Arabic-script values fall from 171 to 169; original flagged
finding classifications are unchanged.

## Search predicate and syntax review, 2026-09-15 (`32c2d9575`)

Fifteen French/Arabic operator and predicate values are repaired.
Ten one-word syntax terms use stable search codes `assignee`, `due`,
`modified`, `has`, `debug`, `quarter` and `selector` where available
native display wording is multiword or lacks a verified one-word term.
Their **exact zgh keys only** are exempted from fill detection;
a negative fixture proves ordinary English prose in zgh and the
same keyword in another locale still appear as missing and can be
filled. Existing native assignee display prose remains intact.

Native `ⴰⴳⵍⴰⵎ` description and `ⵓⵙⵍⵉⴳ` private match other
zgh labels. `ⴰⵔⵛⵉⴼ`, `ⵔⵥⵎ` and `ⵜⵉⴳⵉⵔⴰ` replace French/Arabic
archived, open and ended status seeds. Their **status versus noun
or imperative nuance is low confidence** pending fluent review.
The ended predicate checks for an end date; the local end noun
is reused, but the full qualifier is not proved by that noun.

The parser currently starts an operator with one Unicode word.
Existing correct-language `operator-attachment-text` and
`operator-checklist-text` are multiword values, so they are not
parseable as written in search help. This remains a separate
compatibility repair: preserve the native phrases and provide
a parseable UI/syntax path. Focused, related-search, fill-negative,
ledger and 234-locale checks pass for this batch. Arabic-script
values fall from 173 to 171. Original flagged counts unchanged.

## Search operator names and aliases, 2026-09-15 (`c365e2cf6`)

The production [query parser](../../../config/query-classes.js) maps
translated `operator-*` values to search predicates. It accepts
Tifinagh letters in full operator names, and its short aliases are
syntax codes. Thirteen Arabic or French values are repaired.
Full names for board, swimlane, creator, status, sort, limit,
organization, title and description reuse native zgh terms already
present in board controls or invalid-predicate messages. The four
short `b`, `s`, `l` and `m` aliases match English portable codes and
avoid an Arabic-keyboard requirement. All short aliases in the zgh
file are distinct; `#` and `@` retain their label/user meanings.

The swimlane-as-path metaphor and its complete UI meaning remain
**low confidence** pending fluent review. Focused source, alias
collision, related search, ledger and 234-locale checks pass.
Arabic-script values fall from 178 to 173; the count includes
possible intentional abbreviations and symbols. Original flagged
finding classifications remain unchanged.

## Board and missing-state labels, 2026-09-15 (`d1c4a7290`)

Three Arabic and three French values are repaired from existing zgh
board (`ⵜⴰⴼⵍⵡⵉⵜ`), page (`ⵜⴰⵙⵏⴰ`), list
(`ⵜⴰⵍⴳⴰⵎⵜ`) and swimlane/path (`ⵓⴱⵔⵉⴷ`) usage. The feminine
`ⵓⵔ ⵜⵍⵍⵉ` and masculine `ⵓⵔ ⵉⵍⵍⴰ` missing patterns follow
other local organization, team and label diagnostics. `%s` is kept
exactly in each named-item error. The view label `ⵉⴱⵔⵉⴷⵏ` spells
local Latin `Ibriden` in Tifinagh.

These are direct native drafts, **low confidence** for full sentence
grammar, list terminology and swimlane metaphor pending fluent review.
Focused positive/negative, ledger and all-234-locale checks pass.
The zgh file's Arabic-script values drop from 181 to 178. Some are
symbols or abbreviations; the rest still require key-by-key review.
The original 20,081 flagged finding counts do not change.

## Sky, gold and silver labels, 2026-09-15 (`e114ffde8`)

The [IRCAM Moroccan Amazigh dictionary](https://biblio.ircam.ma/pmb/uploads/publications/177.pdf)
directly glosses `ⵉⴳⵏⵏⴰ` as `ciel` and `ⵓⵔⵖ` as `or`.
French `color-sky` and Arabic `color-gold` now use those terms.
[Central Atlas Tamazight's silver dictionary entry](https://en.wiktionary.org/wiki/ⴰⵥⵔⴼ)
attests `ⴰⵥⵔⴼ`, with related Tashelhit use; it replaces Arabic
`color-silver`. These are unflagged wrong-language repairs.

The source records gold and silver as metal nouns. Their use as CSS
color names, and the silver spelling preferred by Standard Moroccan
Tamazight, remain **low confidence** pending fluent review. An unrelated
university [paper](https://toubkal.imist.ma/server/api/core/bitstreams/6ece0670-742b-4aea-8564-20d8cda3b273/content)
glosses `ⵓⵔⵖ` as steel; IRCAM's explicit gold entry
is the chosen local sense, but the conflicting gloss warrants checking.
Focused positive/negative, ledger and 234-locale checks pass. The
20,081 original finding classifications remain unchanged.

## Native pink and adapted dark-green, 2026-09-15 (`06678678d`)

The [IRCAM Moroccan Amazigh dictionary](https://biblio.ircam.ma/pmb/uploads/publications/177.pdf)
directly glosses `ⴰⵣⵡⴰⵡⴰⵖ` as `rose (couleur)`. WeKan's French
`color-pink` is replaced by that color word, avoiding the flower sense.
Arabic `color-darkgreen` is replaced by a draft combining the existing
native green `ⴰⵣⴳⵣⴰ` and dark/black `ⴰⴱⵔⴽⴰⵏ`, which is also used
for WeKan's black label and appears in a [Moroccan Amazigh word list](https://www.amazigh.online/dictionary).
The complete shade compound and adjective order remain **low confidence**
pending fluent Standard Moroccan Tamazight review; the component senses
alone do not certify the full phrase. Focused positive/negative, ledger
and 234-locale checks pass. Both repairs were unflagged and leave the
original 20,081 finding classifications unchanged.

The plural email-addresses placeholder remains Arabic. Indexed
`ⵜⵉⵏⵙⵉⵡⵉⵏ` examples mix regional uses and unrelated software
contexts, so they do not prove the Moroccan plural of `ⵜⴰⵏⵙⴰ`.

## Email-address placeholder, 2026-09-15 (`ce5092966`)

The local `email-address` search-member placeholder was French,
`Adresse de courriel`. [Native MediaWiki zgh software translations](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
use `ⴰⵏⵙⴰ ⵏ ⵉⵎⴰⵢⵍ` in the email-address input prompts
`createacct-email-ph` and `createacct-another-email-ph`. The corrected
WeKan label keeps both address and email; reusing the short MediaWiki
`createacct-emailrequired` value would omit the address qualifier in
WeKan's member-search placeholder. Focused positive/negative, ledger
and all-234-locale checks pass. This was an unflagged repair and does
not change the 20,081 original finding classifications.

The separate `email-addresses` invitation placeholder is still Arabic.
Its plural Tamazight phrase needs a native Moroccan source; an Algerian
plural example alone does not establish Moroccan wording. That
wrong-language value remains open, as do broader native grammar reviews.

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

## Generic rule name labels, 2026-09-14 (7f3a0d7db)

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

## One-unit recurrence labels, 2026-09-14 (5b3ca809d)

[Native grammar lesson by Aznzar Abudrar](https://tamazight.abudrar.com/2018/02/addad-amaruz-almmud-n-tamazight-learning.html)
uses `ⴽⵓ ⴰⵙⵙ` in the daily wolf example (body line 45). The opened
[IRCAM primary-school teacher guide, revised 2020](https://ircam.biblio.ma/uploads/explnum/explnum_26.pdf)
also contains daily examples on PDF page 41; its extracted word order is
reversed in the surrounding Arabic layout, so the HTML lesson independently
establishes the phrase order. This supports everyday repetition, not merely
one elapsed day. The [CLDR Moroccan locale](https://raw.githubusercontent.com/unicode-org/cldr/main/common/main/zgh.xml)
provides `ⵜⴰⵙⵔⴰⴳⵜ` (hour) and `ⵜⵓⵙⴷⵉⴷⵜ` (minute).

Three French labels become every day/hour/minute. Hour and minute combinations
are adapted, not exact phrases quoted from CLDR: LOW CONFIDENCE full native
fluency remains for review. Numeric multi-unit labels remain unchanged until
their plural/number construction is checked. No direct current client/server
reference to these legacy keys was found; scheduled workflow labels use other
keys. Therefore no running-browser verification of these labels is claimed.
Exact values, wrong-language negatives and three distinct intervals are tested.
Three additional unflagged repairs leave the original queue counts unchanged.

## OIDC button: reject unrelated dictionary senses — 2026-09-14

The pending `oidc-button-text` introduces the configurable authentication
button text in `client/components/settings/settingBody.jade`. It needs the
interface-control meaning of button, not a biological noun.

The downloaded DGLAI reference has French `bouton` entries 141517 and 142757,
but their Arabic definitions are `حبة، بثرة` (skin bump/pustule). Consequently
`ⵜⴰⵔⵃⵙⵉⵜ` and `ⵜⵉⵎⵉⵙⵜ` are not established interface-button terminology
and must not be selected from the French gloss alone. This is a sense mismatch,
not evidence that the underlying native words themselves are wrong.

The primary [IRCAM computing reference](https://www.ircam.ma/sites/default/files/2021-02/TICAM14.pdf)
is the next domain source to inspect. Its search metadata identifies mobile
computing vocabulary; the full PDF fetch timed out during this review, so
no term from its body has been accepted. The scraped dictionary remains a
research lead, not a bundled dependency or sole authority for a UI compound.

The French local value remains pending until the complete customization,
text and control meaning is translated. No replacement or unchanged acceptance
was made. Counts remain 283 pending and 4 restored; browser review is open.

## Primary dictionary obtained — 2026-09-14

The IRCAM library's [General Dictionary of the Amazigh Language, Amazigh–English](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
was downloaded successfully. Its title and publication pages identify the
Language Planning Centre, Rabat, 2019, Meftaha Ameur and colleagues, with the
English version by Khalid Ansar. This supplies primary entries independently
of the scraped French/Arabic dataset. The 882-page reference and page-wise
text extraction are temporary research files under `.tools/tmp`; neither
is bundled, committed, or added as a dependency.

Directly inspected entries:

| PDF page | Entry | Native form | Meaning and limit |
| --- | --- | --- | --- |
| 57 | 795 | ⴰⴷⵓⵣⵡⵍ | Subtitle; does not establish a complete path/parent phrase. |
| 537 | 10106 | ⵙⵙⵔⴼⵓ | Activate; does not establish the complete account toggle clause. |
| 33 | 287 | ⴰⴱⵔⵉⴷ | Path/road; a filesystem metaphor needs domain review. |
| 562 | 10528 | ⵜⴰⴳⵎⵎⵓⵜ | Button/round jewel; an interface-control sense is not explicit. |

The computing PDF could not be downloaded with certificate verification:
curl reported an untrusted issuer. Its body remains unread. No TLS bypass
was used. Next use the primary dictionary's grammatical forms together with
native computing usage to complete the pending phrases; a generic English
gloss still cannot establish the correct software sense. No pending phrase
was accepted from these components. Counts remain unchanged, and native
full-phrase and browser verification remain open.

## Numeric interval repairs — 2026-09-14

Four additional French labels now express every 5, 10 and 30 minutes and
every 6 hours. The primary dictionary's PDF page 702, entry 13256, gives
minute and plural `ⵜⵓⵙⴷⵉⴷⵉⵏ`; page 641, entry 12030, gives hour and
plural `ⵜⵉⵙⵔⴰⴳⵉⵏ`. The hour plural is placed in the construct state
after `ⵏ`. Native MediaWiki `search-result-category-size` independently
uses number-plus-`ⵏ` plural quantities. The earlier native daily lesson
supports `ⴽⵓ` for recurrence.

These complete interval phrases are adapted, **low confidence**, not exact
dictionary quotations. Full native number/construct-state and recurrence
grammar remains open. Regression checks preserve all four numeric intervals,
distinguish hours from minutes and reject the French text; they cannot prove
fluency. These legacy keys have no direct current client/server reference
in the inspected source, so no browser rendering is claimed. Original pending
counts are unchanged; these four unflagged repairs are tracked separately.

## Active daily trigger clause — 2026-09-14

`r-w-every-day-at` now uses `ⴽⵓ ⴰⵙⵙ ⴳ __time__`, aligning the active
daily schedule label with the native everyday lesson and primary dictionary.
PDF page 335, entry 6418, establishes `ⴽⵓ` each; page 306, entry 5962,
establishes `ⴳ` and its alternatives. Page 588 gives a temporal sunrise
example. The dictionary explicitly supports `ⴷⴳ`; this change does not
declare that every alternative preposition or schwa spelling is wrong.

The complete at-time clause is adapted, **low confidence** pending full
native grammatical validation. `client/components/rules/rulesWorkflow.js`
uses this key for a daily scheduled trigger with time `09:00`. Regression
checks preserve `__time__` exactly and check substitution without retaining
the prior wording. No live browser check ran; uncertainty remains tracked.

## Migration progress message — 2026-09-14

The French `migration-progress-note` is replaced by an adapted Tamazight
wait/board-transfer/latest-structure clause. Primary dictionary PDF pages
306 (entry 5975), 335 (6420), 503 (9495), 703 (13278) and 126 (2274)
establish wait, while, transfer/move, structure and last respectively.
Native MediaWiki `move` independently uses the same transfer verb in
software. The board noun follows the existing local `Tafelwit` vocabulary.

The complete clause, verbal aspect, possessive and feminine adjective
agreement are adapted, **low confidence**, pending native grammatical review.
The imperative conveys the request to wait; courteous idiom still needs
review. This replaces wrong-language prose without claiming independently
attested full fluency. `migrationProgress.jade` renders this key in the
progress popup. Exact wording and French-negative regression checks are
added; no live browser validation ran. The original key is now corrected,
but this uncertainty remains in the broader review rather than disappearing
when the pending counter decreases.

## Orphaned-card repair label — 2026-09-14

`step-fix-orphaned-cards` no longer contains French. Primary dictionary
PDF page 516, entry 9735, supports the correction verb; page 45, entry 532,
supports orphan. The card noun follows existing local `Tikarḍiwin`.
`server/migrations/ensureValidSwimlaneIds.js` explicitly describes orphaned
cards as references to nonexistent swimlanes; the label retains repair and
that orphan metaphor rather than describing deletion or conversion.

The full software metaphor and feminine plural agreement are adapted,
**low confidence**, pending native validation. Exact wording and French
negatives are tested. The inspected progress helper formats received step
names, so the existence of the translation key alone does not prove this
label is actually rendered in the live popup; integration/browser review
remains open. Classifying the original French value as corrected does not
close these uncertainty and rendering requirements.

## Progress label integration traced — 2026-09-14

The integration gap is confirmed from current source, rather than inferred
from an absent browser. `migrationProgress.js`'s `stepNameFormatted` reads
the reactive step ID, splits underscores and capitalizes words; it never
requests a `step-*` translation. `attachments.js`'s current database dashboard
sends `repair_board_data` and `copy_collections`. Neither has a corresponding
English translation key. Therefore translating a legacy `step-*` value alone
does not translate these active progress labels.

No current source reference to the legacy orphaned-card step ID was found.
`tests/obsoleteBoardMigrationsRemoved.test.cjs` explains why comprehensive
board migrations were removed: they recreated obsolete per-swimlane lists
and moved cards. They must not be restored to make a translation reachable.
The dictionary-based legacy repair remains tracked as an adapted phrase,
but has no proved live display requirement in the current interface.

Next integration work needs new accurately scoped labels for the two active
database stages, translations for all locales, and a reactive helper using
those labels while preserving sensible unknown-stage fallback. Existing
`migration-progress-note` is independently rendered and does not solve the
step-ID gap. No runtime code or translation value changed in this review.
Counts remain 281 pending and 4 restored; native phrase review stays open.

## Explicit computer-server term — 2026-09-14

Local `server` changes from French `Serveur` to the primary dictionary's
explicit computer-server phrase `ⴰⵎⴰⴽⴽⴰⵢ ⴰⵙⵏⵎⴰⵍⴰⵢ` (PDF page 120,
entry 2157). Unlike a generic helper or a physical support, the full quoted
phrase has an expressly technical sense. Exact and French-negative regression
checks cover the additional unflagged repair. No direct reference to this
generic key was found in the inspected client source; no live rendering is
claimed, and the original queue counts are unchanged.

`smtp-tls-description` still contains Arabic. Its protocol-support meaning
cannot be established by dictionary nouns for physical props or assistance.
That pending phrase needs software compatibility terminology and complete
grammar, preserving TLS/SMTP exactly. The verified server term supplies only
one component and does not close the original finding.

## OIDC configurable caption repair — 2026-09-14

The original French `oidc-button-text` now uses an adapted edit-text-of-OIDC-
button phrase. Native MediaWiki `edit` supplies `ⵙⵏⴼⵍ`; the primary dictionary
PDF page 63, entry 916, explicitly gives the text noun. Page 562, entry 10528,
gives button/round jewel. That generic button noun is adapted metaphorically
to an interface control, **low confidence** pending native computing usage;
the source does not quote an interface-button sense or this complete phrase.
The previously rejected pustule nouns are not used.

The actual setting is a freely editable `oidcBtnText` input followed by Save
in `settingBody.jade`; the edit verb describes customization in this context.
OIDC remains unchanged. Exact caption wording, one preserved OIDC token,
French negatives and rejected-sense negatives are tested. Full grammar,
software metaphor and live browser rendering remain open. Replacing the
wrong-language value moves the original finding to corrected but does not
remove these documented uncertainties from the remaining review scope.

## Overdue-time warning — 2026-09-14

French `pastdue` is replaced by an adapted deadline-time/has-passed clause,
preserving `%s` exactly. Primary dictionary PDF page 79 gives time; page 126,
entry 2274, gives last; page 721, entry 13549, gives pass. The deadline
concept follows the existing local last-time construction rather than
describing completion. The source English explicitly refers to current due
time; the demonstrative marks the time in question.

The exact technical deadline compound and full grammar remain **low
confidence**, pending native review. These component entries do not quote
the complete warning. Exact wording, French negatives and placeholder
inventory checks are added. Browser rendering remains unverified. Changing
the original wrong-language value does not close these broader uncertainties.

## Parser-error sense review — 2026-09-14

The three pending `operator-has-invalid`, `operator-debug-invalid` and
`operator-limit-invalid` values are French. English distinguishes existence
checks, debug predicates and numeric limits; the last additionally requires
a positive integer. Every `%s` must survive a complete repair.

Primary IRCAM dictionary PDF page 177, entry 3292, uses English “invalid”
alongside paralyzed/immobilized; page 354, entry 6732, also describes inability
to move. Those physical senses cannot establish invalid parser input and
must not be substituted from the English keyword alone.

Verified leads are existence (`ⵉⵍⵉ`, page 377, entry 7138), verification/check
(`ⵜⵉⵎⵏⵥⵉⵜ`, page 678, entry 12776), and be correct (page 334, entry 6406).
Native MediaWiki `feed-invalid` and `rcfilters-invalid-filter` provide software
invalidity constructions, but not these full messages. Compose complete
technical clauses only after checking predicate, numeric-limit and positive-
integer meanings; do not drop those distinctions to produce a short generic
error. No value was changed or accepted. Counts remain 279 pending/4 restored;
native phrase and browser validation remain open.

## Existence-check error repair — 2026-09-14

`operator-has-invalid` now uses an adapted verification-of-existence/not-
correct clause, replacing French and preserving `%s`. The preceding parser
review identifies the primary dictionary entries for all three concepts.
`config/query-classes.js` emits this tag when an `OPERATOR_HAS` value does
not match a supported predicate; the clause retains that specific check
rather than becoming a generic debug or numeric-limit error.

Negative conjugation, agreement and full technical phrasing remain **low
confidence**, pending native grammar review. Component evidence is not an
attested complete warning. Exact wording, placeholder, French/physical-sense
negatives and distinction from debug errors are tested. No live browser
validation ran. The original French key is corrected; full native validation
remains in scope after its pending classification changes.

## Debug-predicate context review — 2026-09-14

Primary IRCAM General Dictionary PDF page 383, entry 7269, gives
`ⵉⵎⵏⵏⵉ` for a grammatical predicate, explicitly marked `gram.`. This
is not evidence for a computational debug predicate. In
`config/query-classes.js`, the debug predicate catalogue accepts the
translated values of `predicate-all`, `predicate-selector` and
`predicate-projection`; the error at lines 597–605 rejects an unsupported
catalogue value. It does not test a Boolean condition.

Consequently neither the grammatical noun nor an existence-check clause
is accepted as the complete debug error translation. The French
`operator-debug-invalid` remains pending with its exact `%s` intact.
`predicate-selector` also still contains French `sélecteur`; improving
only the warning would leave this user-entered filter vocabulary unresolved.
`predicate-projection` contains `askan`, whose computational sense also
needs verification. Native computing terminology and the complete warning
remain open; no values or counts changed in this review.

## Parent-subtitle option repair — 2026-09-14

Local commit `b93379067` replaces French `subtext-with-parent` with
`ⴰⴷⵓⵣⵡⵍ ⴰⴽⴷ ⵓⵎⴰⵔⴰⵡ`. Primary IRCAM General Dictionary PDF page
57, entry 795, supplies subtitle; page 122, entry 2198, supplies father
and its construct form. The latter reuses the existing `parent-card`
metaphor, not an independently attested computing term. The conjunction
`ⴰⴽⴷ` follows existing locale usage.

Sidebar options at sidebar.jade lines 355–357 display this label;
minicard.jade lines 353–355 show `parentCardName` below the title. This
differs from the full ancestor path option. Software parent terminology
and complete phrase grammar remain **low confidence**. Four translation
checks pass, preserving placeholders and unchanged reviewed translations;
no live browser validation ran. Counts are 15,625 corrected, 277 pending
(including 164 Tamazight), four restored and 4,175 retained.

## Full-path subtitle repair — 2026-09-14

Local commit `7acd0f72c` replaces French `subtext-with-full-path` with
`ⴰⴷⵓⵣⵡⵍ ⴰⴽⴷ ⵓⴱⵔⵉⴷ ⴰⴽⴽⵯ`. Primary IRCAM General Dictionary
PDF page 57, entry 795, gives subtitle; page 76, entry 1196, gives with;
page 33, entry 287, gives path and its construct form; page 77, entry
1214, gives all/entirely. This also strengthens the preceding parent
label's conjunction evidence beyond existing locale usage.

The sidebar displays this option, and minicard.jade calls
`parentString(' > ')`; models/cards.js maps parent-list card titles and
joins them. The translation preserves the full ancestor-path distinction
from the single parent. **Low confidence** remains for the software path
metaphor, noun/adverb construction and full native phrase. Component
entries are not a complete attested software label. Four focused checks
pass, including exact wording, French negatives and preservation of the
fullness term; no live browser validation ran.

Counts now: 15,626 corrected, 276 pending (163 Tamazight), four restored
and 4,175 retained; 18,712 correction-ledger records. Broader validation
remains open after the original French finding is classified corrected.

## Parent display-prefix repairs — 2026-09-14

Local commit `16232ae09` replaces French `prefix-with-full-path` and
`prefix-with-parent` with `ⴰⵣⵡⵉⵔ ⴰⴽⴷ ⵓⴱⵔⵉⴷ ⴰⴽⴽⵯ` and
`ⴰⵣⵡⵉⵔ ⴰⴽⴷ ⵓⵎⴰⵔⴰⵡ`. Primary IRCAM General Dictionary PDF
page 284, entry 5564, gives prefix, explicitly grammatical. Its extension
to prepended display text is an adaptation, not an attested software
term. Previously documented entries establish with, path, entirely and
father; existing `parent-card` supplies the software parent convention.

Minicard.jade lines 52–57 put either the joined ancestor path or single
parent title in `.parent-prefix` before the card title. Lines 350–355
put the corresponding subtext below it. The two new labels preserve
both contrasts. Unlike the debug-predicate catalogue, this is prepended
text; nevertheless the grammatical sense extension and full noun phrases
remain **low confidence**, requiring native validation. Four translation
checks pass, including French/subtitle negatives and distinct values.
Browser rendering is unverified. Counts: 15,628 corrected, 274 pending
(161 Tamazight), four restored, 4,175 retained; 18,714 ledger records.

## Multi-selection label repairs — 2026-09-14

Local commit `027bdc446` repairs five additional, previously unflagged
French values: move/copy selection, both popup titles, and selection color.
Primary IRCAM General Dictionary PDF page 70, entry 1069, gives selection
`ⴰⴼⵔⴰⵏ` and construct `ⵓⴼⵔⴰⵏ`; page 503, entry 9495, gives move
`ⵙⵎⵓⵜⵜⵉ`; page 532, entry 10013, gives copy `ⵙⵙⵏⵖⵍ`; page 77,
entry 1233, gives color `ⴰⴽⵍⵓ`. The adjacent poison homonym is entry
1232, not the cited color sense. The dictionary's `ⵉⵏⵉ` entry inspected
at page 388 means say; it does not establish the color noun by spelling.

SidebarFilters.jade displays the three action labels; sidebarFilters.js
opens their popups. The move handler calls card.move and the copy handler
calls copyCard for selected cards. Both action/popup titles now agree;
move and copy remain distinct. Selection-color uses a color-of-selection
construction. **Low confidence** remains for treating selection as the
selected-card collection and for complete grammar; component entries do
not attest the full software phrases. Four focused checks pass, preserving
all English placeholders and reviewed unchanged values. Browser validation
was not run. Original counts remain 15,628 corrected, 274 pending, four
restored and 4,175 retained; the ledger grows to 18,719 records.

## Parent-change and card-display repairs — 2026-09-14

Local commit `f3d3aa4b2` repairs original pending `change-card-parent`
and additional French `show-on-card`. Primary IRCAM General Dictionary
PDF page 532, entry 10003, gives transitive change `ⵙⵙⵏⴼⵍ`; page 521,
entry 9816, gives show `ⵙⵙⴽⵏ`; page 122, entry 2198, gives father;
page 306, entry 5962, establishes the in preposition. Existing locale
card vocabulary and software parent convention are reused.

CardDetails.jade line 1415 introduces the parent-board/card selectors,
so the replacement says change the parent of the card, not merely change
the card. Sidebar.jade line 323 labels the card field-display column,
so show-on-card retains its display-on-card meaning. **Low confidence**
remains for the full grammar and software parent metaphor. Dictionary
action entries do not attest these complete software phrases. Four
focused translation checks pass; live browser validation was not run.
Counts: 15,629 corrected, 273 pending (160 Tamazight), four restored and
4,175 retained. The ledger contains 18,721 corrections; broader native
validation remains open after changed findings are classified corrected.

## Moroccan authentication-term repair — 2026-09-14

Local commit `40491764c` revises four already corrected keys:
`authentication-method`, `authentication-type`,
`default-authentication-method`, and `display-authentication-method`.
Primary IRCAM General Dictionary PDF page 249, entry 4801, explicitly
gives authentication `ⴰⵙⵖⵣⵏ` and construct `ⵓⵙⵖⵣⵏ`. This replaces
`ⵓⵙⵙⵜⴱ`, previously derived from CNAM's Tuareg-marked Asesteb.
The exact Moroccan component no longer depends on that cross-variety
source; the complete phrases still require native technical review.

ConnectionMethod.jade displays method; peopleBody.jade displays type;
settingBody.jade displays default-method and display-method controls.
All four modifiers and distinctions survive. The dictionary's method
entry at page 621, entry 11649, says way of education, not an attested
computational authentication method. Existing method wording is retained
as an adaptation, not newly accepted from this narrower sense. **Low
confidence** remains for full software phrases and native/browser
validation. Four focused checks pass; original before-values and exact
placeholder inventories remain preserved. No live browser test ran.

Original counts stay 15,629 corrected, 273 pending, four restored and
4,175 retained. Ledger count stays 18,721: existing records were revised,
not duplicated. Other Tuareg-sourced records remain under renewed review.

## Moroccan analysis/structure revision — 2026-09-14

Local commit `776840a4c` revises already corrected
`step-analyze-board-structure` to
`ⴰⵙⴼⵙⵉ ⵏ ⵜⵓⵚⴽⵉⵡⵜ ⵏ ⵜⴼⵍⵡⵉⵜ`. Primary IRCAM General
Dictionary PDF page 221, entry 4239, explicitly gives the neologism
analysis in addition to melting. The cited sense is analysis, not
physical melting. Page 703, entry 13278, gives structure. This replaces
unsupported `ⵙⵍⴹ` and cross-variety `ⵜⴰⵎⵚⵓⴽⵜ` with a nominal
analysis-of-board-structure stage label and verified Moroccan components.

The full noun phrase, genitive agreement and software structure metaphor
remain **low confidence**, requiring native validation. The source review
already establishes that active migration progress formats raw stage IDs
and removed legacy migrations must stay removed. A repository search
found no current client/server reference to this key; this repair does
not claim the stage is visible or solve that integration gap. Four
translation checks pass, preserving original ledger before-values and
placeholders; no live browser test ran. Counts stay 15,629 corrected,
273 pending, four restored, 4,175 retained and 18,721 ledger records.

## Approaching-deadline warning repair — 2026-09-14

Local commit `4f99247e8` replaces French `almostdue` with an adapted
current-due-time/approaching clause, preserving the exact `%s`. Primary
IRCAM General Dictionary PDF page 59, entry 845, gives approach/be close
`ⴰⴷⵙ` with imperfect `ⵜⵜⴰⴷⵙ`. Earlier cited time and last components
are reused consistently with `pastdue`. **Low confidence** remains for
the deadline/current-time compound, temporal metaphor and full ongoing
conjugation. Component entries do not attest the complete warning.

Models/cards.js selects `almostdue` for positive day offsets, starting
tomorrow; negative offsets select `pastdue`, and zero selects `duenow`.
The warning retains approaching versus passed, not a generic due status.
Four focused translation checks pass, including exact placeholder and
French/overdue negatives. Browser rendering was not tested. Counts now:
15,630 corrected, 272 pending (159 Tamazight), four restored, 4,175
retained, 18,722 ledger records. Broader native review remains open.

Migration follow-up also confirms boardBody.js emits `repair_board_data`,
in addition to attachments.js. Active repair/copy stages need accurate
new locale labels and reactive integration; legacy stage labels describe
different operations and must not be substituted as a shortcut.

## Swimlane-height label repairs — 2026-09-14

Local commit `c986121af` repairs original pending
`set-swimlane-height-value` and additional Arabic action/popup-title
values. Primary IRCAM General Dictionary PDF page 686, entry 12929,
gives height `ⵜⵉⵖⵣⵉ`; page 513, entry 9675, gives put `ⵙⵔⵙ`. The
existing path/swimlane convention is retained. Setting a numeric dimension
and the software swimlane metaphor remain adaptations, not independently
attested complete software phrases; full native grammar remains **low
confidence**. Pixels are retained using `px`, not replaced by a different
unit. Action and popup title agree.

SwimlaneHeader.jade displays the value label over a number input with
min=100; the error popup appends >=100 to its separate constraint text.
The Arabic positive-integer error remains pending: primary page 450,
entry 8544, gives positive, while page 457, entry 8684, contrasts negative
with positive, but these do not establish the complete integer requirement.
Do not replace that constraint with only a positive-number clause.

Four translation checks pass, including exact labels, action/title
agreement, Arabic negatives and pixel-unit preservation. Browser
validation did not run. Counts: 15,630 corrected, 272 pending (159
Tamazight), four restored, 4,175 retained; 18,725 ledger records.
Broader native and runtime verification remains open.

These counts are reconstructed from the original tables and current
ledgers. Earlier narrative totals are historical reported snapshots; the
current summary uses the live reconstruction, not arithmetic increments.

## Integer-constraint source follow-up — 2026-09-14

The new primary PDF at
<https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=131>
downloaded successfully with certificate verification. All 144 pages
were extracted; page 4 was rendered and inspected. The title identifies
IRCAM's general Amazigh dictionary, volume 1, expanded/revised edition,
Rabat 2009, not a mathematical lexicon. Arabic text extraction uses broken
legacy encoding and some pages have no extracted text, so a zero search
result cannot establish that a term is absent from the book.

The cached secondary DGLAi leads for French entier concern whole/complete
or completion (entries 136613, 151543 and 147684), not an attested
mathematical integer. The positive-number search likewise does not
establish integer: positive real numbers include fractions. The IRCAM
catalogue's mathematics lexicons encountered in this search include
French/Arabic works and a Tizi-Ouzou French/Berber work; catalogue hosting
alone does not establish Standard Moroccan vocabulary.

The primary school-lexicon publication lead is
<https://www.ircam.ma/fr/edition/lexique-scolaire-2025>; its contents were
not fetched successfully in this pass. A listing or publication title is
not a verified mathematical entry. `swimlane-height-error-message` and
`operator-limit-invalid` retain their exact constraints and remain pending
until full native numeric terminology is established. No translation or
classification changed. Live counts remain 272 pending/four restored;
this follow-up strengthens source boundaries, not a fluency claim.

## SMTP TLS description repair — 2026-09-14

Local commit `086a02734` replaces Arabic `smtp-tls-description` with
an adapted enable-TLS-use-for-SMTP-computer-server clause. Primary IRCAM
General Dictionary PDF page 537, entry 10106, gives activate; page 236,
entry 4544, gives use `ⴰⵙⵎⵔⵙ`; page 120, entry 2157, gives the exact
computer-server compound and the noun's construct form. The full phrase
retains literal `TLS` and `SMTP`, avoiding a physical support noun.

SettingBody.jade binds this checkbox to mailConfiguration.secure; its
JavaScript saves mailServer.enableTLS, and mailTransport.js reads secure.
The repaired prose therefore describes enabling TLS use on this SMTP
server, not generic help/support or authentication. This source review
does not claim unchecked means all TLS negotiation is disabled. **Low
confidence** remains for the full technical clause, preposition and
genitive agreement. The component entries are not a full attested warning.
Four focused translation checks pass, preserving placeholders, protocol
names and enabled-action wording; no live browser validation ran.

The repaired CLI updater reconstructs both count tables: 15,631 corrected,
271 pending (158 Tamazight), four restored and 4,175 retained; 18,726
ledger records. Broader native and runtime verification remain open.

## Private-board description repair — 2026-09-14

Local commit `d7bdf6ac6` replaces Arabic `private-desc` with an adapted
Tamazight private-board/members-only description. Current English explicitly
contains both view and edit actions; the Arabic seed only described members
as allowed. The repair restores both actions, not just the privacy adjective.

Primary IRCAM General Dictionary PDF page 454, entry 8633, gives private;
page 43, entry 502, gives member; page 468, entry 8843, gives only; page
719, entry 13518, gives be able; page 727, entry 13642, gives see/look.
The only sense is entry 8843, not adjacent except entry 8845. Native
MediaWiki supplies edit `ⵙⵏⴼⵍ`; existing board vocabulary is reused.
These are component attestations, not a complete published software phrase.
**Low confidence** remains for feminine agreement, focus construction,
plural verbs/object pronouns and full software wording. No authorization
logic or board-role permissions were changed by this translation repair.

BoardHeader.js chooses this translated fallback through visibilityDesc
when there is no custom private-board description. Four focused checks
pass, preserving exact placeholders and both action terms; live browser
validation was not run. The CLI recounts 15,632 corrected, 270 pending
(157 Tamazight), four restored, 4,175 retained and 18,727 ledger records.
Broader native phrasing, prior low-confidence and browser review remain open.

## Custom assetlinks labels — 2026-09-14

Local commit `d6a358160` repairs French custom-assetlinks-enabled and
custom-assetlinks-content in Tamazight. IRCAM 2019 General Dictionary
PDF page 537 entry 10106 attests activate; page 83 entry 1346 attests
content; page 404 entry 7686 attests specific/exclusive. Dictionary source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Specific is adapted to custom user-provided configuration. This is not
an attestation of a complete personalized software phrase. **Low confidence**
remains for this adaptation, modifier scope and full native grammar.
SettingBody.jade displays the activation checkbox and JSON textarea title;
settingBody.js validates and cleans JSON before saving. Literal assetlinks.json
and (JSON) survive exactly; activation and content labels remain distinct.
Four focused checks pass, including placeholder, key-order and ledger checks.
No live browser validation was run. Recount: 15,634 corrected, 268 pending
(155 Tamazight), four restored, 4,175 retained and 18,729 correction records.
Broader native and runtime verification remain open.

## WIP activation label — 2026-09-14

Local commit `a5edc6d3c` repairs unflagged French enable-wip-limit.
IRCAM 2019 PDF page 537 entry 10106 attests activate; page 270 entry
5271 attests limit/boundary/border. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

The label uses activate plus boundary, preserving WIP exactly. **Low
confidence** remains for applying boundary to a numerical work-in-progress
limit and for full native phrasing. ListHeader.jade displays the action;
ListHeader.js enables the limit and ensures it is at least the card count.
No limit logic is changed. Four focused translation checks pass; browser
validation was not run. This key was outside the original flagged queue:
268 original findings remain pending; the correction ledger now has 18,730
records. Prior low-confidence and broader runtime/native reviews remain open.

## Custom product name — 2026-09-14

Local commit `c4a40896b` repairs unflagged French custom-product-name,
restoring product, which was absent from the French seed. IRCAM 2019
PDF page 397 entry 7541 attests name; page 271 entry 5286 attests product
and construct uyafu; page 404 entry 7686 attests specific/exclusive.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence** remains for custom branding, complete grammar and final
modifier scope. The dictionary's ism izlin proper-noun compound does not
prove custom product-name software wording. This adaptation instead retains
the explicit product component. SettingBody.jade uses the label above the
product-name input. Four focused translation checks pass; no live browser
validation was run. Original pending count stays 268; correction records
increase to 18,731. Broader native and runtime reviews remain open.

## Show parent in minicard — 2026-09-14

Local commit `89ebd29cc` repairs French show-parent-in-minicard. IRCAM
2019 PDF page 521 entry 9816 attests show, page 122 entry 2198 father
and page 575 entry 10775 card. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

The small-card adjective is reused from existing minicard-settings and
nearby card controls; this reuse does not independently validate agreement.
**Low confidence** remains for the feminine small adjective, complete
clause and software-parent metaphor. Sidebar.jade uses the label above
prefix/subtext/full-path/parent choices; those choices remain distinct.
Four focused translation checks pass; no browser validation was run.
Recount: 15,635 corrected, 267 pending (154 Tamazight), four restored,
4,175 retained and 18,732 correction records. Broader reviews remain open.

## SMTP host sentence terminology review — 2026-09-14

The French smtp-host-description remains pending. Primary IRCAM 2019
General Dictionary PDF page 185 entry 3464 attests ansa (construct wansa)
with address as a neologism and an explicit email-address compound.
Page 533 entry 10031 attests ssugur with administer/manage as sense two;
its physical drive/make-walk sense is not the intended software meaning.
Page 342 entry 6519 instead gives hawl xf take care of/manage; the
English index's manage-to heading must not be treated as an interchangeable
bare verb. Management nouns occur at entries 4565 (page 237), 4874
(page 252, neologism) and 11897 (page 634).
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Native MediaWiki tool-link-emailuser attests singular electronic message,
not the full possessive plural/relative clause required by this sentence.
The actual input is mail-server-host with placeholder smtp.domain.com;
settingBody.js trims configuration.host and saves mailServer.host. This is
the SMTP computer server's address, not the user's own email address.
Do not substitute the dictionary's email-address compound for the host.
No translation or ledger acceptance was made: the full message plural,
possession, participle and server-relative clause remain to verify.
Original pending count remains 267; low-confidence and browser reviews
remain open. This review changes the next translation choice by excluding
email-address and the wrong manage sense.

## SMTP host description repair — 2026-09-14

Local commit `584dbfc7c` repairs smtp-host-description after finding the
missing primary email noun evidence. IRCAM 2019 PDF page 608 entry 11389
attests correspondence, plural timyazanin and the explicit singular
email compound tamyazant taliktrunit. Native MediaWiki tool-link-emailuser
independently uses that electronic-message compound. Earlier verified
address, computer-server and administer/manage components are reused.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

The sentence keeps SMTP, a server's address and your electronic correspondence;
it does not change the input to a user's email address. **Low confidence**
remains for the electronic adjective plural, participle, possession and
complete relative-clause grammar. The dictionary attests components, not
this complete software sentence. Four focused checks pass; no browser
validation was run. Recount: 15,636 corrected, 266 pending (153 Tamazight),
four restored, 4,175 retained and 18,733 correction records. The prior
pending note is historical; full native validation remains open.

## SMTP host label and port review — 2026-09-14

Local commit `eb710395b` repairs unflagged Arabic smtp-host with the
explicit computer-server compound from IRCAM 2019 PDF page 120 entry
2157. SMTP is preserved; actual settingBody.jade host input is distinct
from the adjacent port input. Four focused translation checks pass.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

The related smtp-port-description remains pending. Primary PDF page 530
entry 9981 attests use/exploit; page 524 entry 9873 attests send/ship.
Page 513 entry 9685 specifically use land is not the preferred bare
software-use verb. These do not establish a networking-port noun or
complete outgoing-email sentence. smtp-port remains Arabic and needs a
separate direct repair; no port acceptance is recorded. Host-label repair
increases correction records to 18,734 but leaves 266 original findings
pending. Full native/browser validation remains open.

## Advanced-filter escape repair — 2026-09-14

Local commit `72b212a5d` removes doubled backslashes from Tamazight
advanced-filter-description, matching all literal examples and escape
markers to English. Syntax regression rejects the doubled apostrophe
escape and explicitly requires the original audit row to stay pending.
No correction-ledger acceptance was added: the prose is still English.

Three checks pass (syntax examples, correction ledger, retained reviews).
allTranslationCompleteness.test.cjs now correctly fails with one unreviewed
English placeholder in zgh. Before the repair, malformed backslashes made
English look different from the source, bypassing the structural fill gate.
This is exposed missing translation work, not a reason to restore broken
syntax, change punctuation to evade detection or weaken the gate. Translate
the full prose while retaining exact operators/examples to resolve it.
Original pending count stays 266 and ledger records stay 18,734. No live
browser validation was run; broader native/runtime work remains open.

## Full advanced-filter help repair — 2026-09-14

Local commit `04aba67e0` directly translates the full advanced-filter help
and its unflagged French label. IRCAM 2019 PDF page 165 entry 3053 attests
filter and page 570 entry 10673 attests condition; existing locale custom
field wording is reused. Every operator, comparison, quoted-field example,
escape marker, Boolean combination, grouped expression and regex example
is preserved exactly. The label and help opening use the same filter name.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence** remains for the advanced modifier, computational operator
and value adaptations, spaces/quotes/brackets, interpretation order and full
technical grammar. These component sources are not a native attestation of
the complete prose. Direct fill is recorded for future correct-language
human replacement, without external translation services or remote writes.
Four checks pass; completeness again reports zero placeholders across 234
locales. The earlier one-placeholder failure is resolved by translation,
not by weakening the gate or reintroducing malformed escapes. Native/browser
validation was not run. Recount: 15,637 corrected, 265 pending (152 Tamazight),
four restored, 4,175 retained and 18,736 correction records. Full uncertain
and broader runtime/native review remains open.

## Filter punctuation terminology revision — 2026-09-14

Local commit `ac4b1dcdc` revises the prior direct filter-help repair after
primary evidence exposed unsupported conflated quote/bracket forms.
IRCAM 2019 PDF page 633 entry 11892 attests quotation marks and plural
taskarin; page 687 entry 12948 attests parentheses/brackets and plural
tiskiwin. Page 212 entry 4045 attests space and plural isayrarn; applying
this to whitespace remains an adaptation. These exact nouns replace the
previous unverified forms. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Tests require distinct quotation-mark and grouped-expression nouns,
reject old conflated forms, and preserve all literal syntax examples.
Original ledger before value is preserved; its after/reason are revised,
not duplicated. Four focused checks pass and completeness stays green.
**Low confidence** remains for single modifier, plural case/agreement,
operator/value and advanced adaptations, full software prose and grammar.
No native/browser validation was run. Original pending count remains 265;
ledger records remain 18,736. Broader validation remains open.

## Single quotation mark and value review — 2026-09-14

Local commit `d1214818b` replaces an unsupported single-quote modifier
with explicit one-character wording and the literal apostrophe. This keeps
single quotes distinct from grouping parentheses and makes the required
character visible. The complete explanatory construction remains **low
confidence** for native grammar, not an attested dictionary phrase.

IRCAM 2019 PDF page 263 entry 5110 explicitly gives both price and value
for atig; existing value terminology is retained rather than discarded
because of the price sense. Page 273 entry 5342 supplies azal value as an
alternative, not proof that shared existing atig is wrong. Page 282 entry
5518 single means unmarried and is unsuitable for parser quotation marks.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Four focused checks pass; exact syntax/escape examples and original ledger
before value survive. No new ledger acceptance or duplicate is added.
265 original findings remain pending; 18,736 corrections are recorded.
Full native/browser validation and earlier technical adaptations stay open.

## Trello import instruction repair — 2026-09-14

Local commit `91ebdcc27` repairs cosmetically changed English
import-board-instruction-trello. The direct Tamazight instruction keeps
Trello and the exact ordered UI labels Menu, More, Print and Export,
Export JSON. Copy text is explicit, using IRCAM 2019 PDF page 532
entry 10013 copy and existing board/text/navigation vocabulary.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence** remains for board possession, navigation/then wording,
result relative clause and complete instruction grammar. No exact current
client reference was found for this legacy key; no claim is made that a
live import popup was exercised. Four focused translation checks pass;
menu literals/order and copy instruction have regression coverage.
Recount: 15,638 corrected, 264 pending (151 Tamazight), four restored,
4,175 retained and 18,737 correction records. Native/browser and earlier
uncertain repairs remain open.

## New board invitation notification — 2026-09-14

Local commit `7dfbbecbd` repairs French just-invited using a nominal
new invitation for you to this board notification. IRCAM 2019 PDF page
227 entry 4358 attests invitation; existing new/board vocabulary is reused.
Page 506 entry 9539 invite/receive differs from page 523 entry 9861,
which specifically invites to a meal and is unsuitable as sole authority
for board membership. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence** remains for rendering just-invited recency with new,
recipient/preposition and complete nominal notification grammar. BoardsList
and Sidebar display this notification; it must stay distinct from
not-accepted-yet, which remains French and pending. The dictionary's
accept destiny/God's will/intercession entries do not establish generic
accepting a board invitation; no such acceptance is recorded.
Four focused checks pass; no browser validation was run. Recount: 15,639
corrected, 263 pending (150 Tamazight), four restored, 4,175 retained and
18,738 correction records. Broader native/runtime verification stays open.

## Accept versus kiss search ambiguity — 2026-09-14

The remaining not-accepted-yet finding was reviewed against new external
search evidence. An Arabic-to-zgh Glosbe result for unvocalized يقبل gives
ssudm. This spelling can represent a kiss reading and must not be treated
as invitation acceptance. Primary IRCAM 2019 PDF page 533 entry 10038
explicitly attests ssudm, variant ssudn, as to kiss. Reject this candidate
for accept/not-accepted-yet; no translation or acceptance is recorded.
Sources:
https://ar.glosbe.com/ar/zgh/يقبل
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

The currently indexed official DGLAI site is a further primary lead:
https://tal.ircam.ma/dglai/
A live open returned 502; the accepter search URL was not retrieved.
Neither result establishes an accept lemma. No external translation service
was used. not-accepted-yet remains French and pending; the dictionary's
accept-destiny/intercession senses also remain unsuitable. This negative
semantic evidence excludes a newly encountered false candidate, rather
than asserting no suitable Tamazight word exists. Original pending findings
remain 263; full native and browser validation remain open.

## Support-page enabled label — 2026-09-14

Local commit `46090ad0e` repairs French support-page-enabled with page,
assistance and activated wording. IRCAM 2019 PDF page 691 entry 13033
attests tiwisi help/assistance and construct twisi, which also occurs in
the existing support label; page 537 entry 10106 attests activate.
The collective-work sense is not the intended support-page meaning;
physical supporting-beam terms are likewise not used. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence** remains for the adapted passive activated form and
complete page-status grammar. SettingBody.jade displays this checkbox
label for the support page. Four focused translation checks pass; no
live browser validation was run. Recount: 15,640 corrected, 262 pending
(149 Tamazight), four restored, 4,175 retained and 18,739 correction
records. Prior low-confidence and broader native/runtime work remain open.

## Hidden activities notification — 2026-09-14

Local commit `c0edf1104` repairs Arabic
now-activities-of-all-boards-are-hidden. IRCAM 2019 PDF page 327 entry
6267 attests hide/be hidden; existing activities/boards terminology is
reused. Now and both all quantifiers survive, so this does not collapse
all activities across all boards into only some board's activities.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence** remains for feminine plural verb, genitive and complete
notification grammar. No exact current client reference was found for
this key; no live rendering was verified. Four focused checks pass,
including both quantifiers, Arabic removal and exact ledger/token checks.
Recount: 15,641 corrected, 261 pending (148 Tamazight), four restored,
4,175 retained and 18,740 correction records. Broader native/browser
validation and earlier low-confidence wording remain open.

## Board visibility and private-only restriction — 2026-09-14

Local commit `267913e2f` repairs French tableVisibilityMode (unflagged)
and tableVisibilityMode-allowPrivateOnly (flagged). Existing visibility
and boards vocabulary is reused. IRCAM 2019 PDF page 477 entry 9012
attests allow/authorize; page 454 entry 8633 attests private; page 468
entry 8843 attests only. The label retains all three restriction meanings.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence** remains for feminine plural private agreement,
visibility genitive and the full restriction grammar. BoardBody renders
the message; board-header/settings code reads the matching setting.
No permission or visibility logic is changed. Four focused checks pass;
heading prefix consistency and only/private scope have regression checks.
No browser validation was run. Recount: 15,642 corrected, 260 pending
(147 Tamazight), four restored, 4,175 retained and 18,742 correction
records. Broader native/runtime and prior low-confidence work stays open.

## Card-count threshold label — 2026-09-14

Local commit `529775d9c` repairs Arabic show-cards-minimum-count.
IRCAM 2019 PDF page 444 entry 8404 gives ugar, variant uggar, more
than/more. Existing card/list/count vocabulary is reused. The label
retains the if condition and unfinished more-than comparison before
the numeric threshold control, rather than becoming unconditional show.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

UserHeader.jade places this label above show-cards-count-at, a number
input with minimum -1. No numeric sentinel or counting logic is changed.
**Low confidence** remains for full conditional/existential grammar,
count terminology and plural/genitive agreement. Four focused checks
pass; no browser validation was run. Recount: 15,643 corrected, 259
pending (146 Tamazight), four restored, 4,175 retained and 18,743
correction records. Broader native/runtime reviews remain open.


Tamazight field total — 2026-09-14, local commit `af4faeb70`.
showSum-field-on-list replaces French with native aggregate/top wording.
IRCAM Amazigh-English dictionary PDF page 602 entry 11282 supplies total;
page 67 entry 1008 supplies top and its construct form. Existing show,
field and list terms are reused. The actual currency/number controls in
sidebarCustomFields.jade lines 54–61 share this label. Aggregate meaning
is distinguished from a count and a prose summary in regression coverage.
Low confidence: plural genitive and full software phrase remain subject to
native review. Four structural/source checks pass across all 234 locales;
these do not prove native fluency or browser layout. Browser not executed.
Original pending 259 → 258, Tamazight 146 → 145; ledger 18,754.
Primary source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339


Tamazight rule destinations — 2026-09-14, local commit `a4439d400`.
Unflagged r-top-of and r-bottom-of replace French with aflla n and
abraw n, respectively. Primary IRCAM Amazigh-English PDF page 67 entry
1008 attests top; page 32 entry 262 attests bottom and a noun+n example.
Actual boardActions.jade top/bottom options precede list/board fragments.
Positive/negative checks preserve distinct positions and the of component;
four suites pass, including token and human-preference checks. Low
confidence: physical position nouns adapted to software list ordering and
full assembled rule grammar. Browser verification remains unexecuted.
Both keys are outside the original queue: pending stays 258, Tamazight
145. Correction ledger grows from 18,754 to 18,756.
Primary source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339


Tamazight custom-field operator — 2026-09-14, local commit `d0175d46a`.
Unflagged operator-customfield French is replaced with joined igr izlin
from the existing singular custom-field activity phrase. IRCAM dictionary
PDF page 404 entry 7686 supports specific/exclusive modifier terminology.
Query.buildParams maps localized operators but its operator expression
does not accept spaces: translating this as a spaced label would fail.
Regression invokes the actual Query implementation with both quoted and
unquoted values and verifies the customfield predicate. Four suites pass;
placeholders and newer human translations remain preserved. Low confidence:
joined technical operator and native software compound; browser not run.
Original pending remains 258; correction ledger grows to 18,757.


Tamazight numeric-field total — 2026-09-14, local commit `318e5030b`.
Unflagged sum-of-number-fields now uses primary total/top/mark components
in place of unsupported seed wording, reusing existing custom-field and
number terms. IRCAM PDF 602 entry 11282, PDF 67 entry 1008 and PDF 467
entry 8828 supply the respective components. Actual listHeader.js helper
uses summarizableCustomFields with number type, so the numeric and
marked-for-display restrictions must both remain. Regression checks
preserve those components and reject previous aggregate/top wording.
Four suites pass with exact tokens, JSON order and human preference.
Low confidence: plural genitive, passive marking and full relative clause;
browser not run. Original pending remains 258; ledger grows to 18,758.


Tamazight custom-field creation — 2026-09-14, local commit `b2f574536`.
Unflagged activity-customfield-created Arabic is replaced with Tamazight
isnulfa igr izlin %s. IRCAM PDF page 509 entry 9599 supplies create/invent
and its preterite stem; existing singular custom-field terminology is
reused. activities.jade passes activityValue(customField), so the lone
%s denotes the field value, with actor rendered separately. Tests retain
that inventory and reject Arabic prose; four suites pass. Low confidence:
finite-verb morphology and full activity fragment. Browser not run.
Original pending remains 258; correction ledger grows to 18,759.


Tamazight exceeded WIP — 2026-09-14, local commit `fc73c77eb`.
wipLimitErrorPopup-dialog-pt1 French becomes Tamazight with task count,
this list, greater-than WIP limit and user-defined qualifier preserved.
IRCAM PDF 270 entry 5271 supplies limit/construct, PDF 444 entry 8404
more than, PDF 508 entry 9575 define. Actual exceededWipLimit uses
strict value < count; reachedWipLimit separately uses <=. Regression
checks retain the comparison and defining qualifier, reject French, and
four suites pass with exact token/human-preference preservation. Low
confidence: second-person defining form and complete comparative relative
clause; browser not run. Original pending 258 → 257, Tamazight 145 → 144;
correction ledger grows to 18,760.


Tamazight WIP-value setting — 2026-09-14, local commit `6e1292cd0`.
set-wip-limit-value French is replaced with imperative define, limit,
maximum task count and this-list wording. IRCAM PDF page 508 entry 9575
supplies define, PDF 270 entry 5271 limit, PDF 457 entry 8699 maximum
and its construct form. The actual numeric setting label is rendered in
listHeader.jade; no WIP logic changes. Regression preserves maximum and
imperative meanings and distinguishes the exceedance warning. Four suites
pass with token, order and human-preference protection. Low confidence:
maximum-of-count compound, construct grammar and full software phrase;
browser not run. Pending 257 → 256, Tamazight 144 → 143; ledger 18,761.


Browser coverage — 2026-09-14, local commit `c8bcfb258`.
Spec 03 seeds numeric fields valued 7 and 100, enables display only for 7,
sets zgh profile language and checks the rendered total and translated
tooltip. Negative assertions reject 107 and obsolete aggregate/top words.
Syntax and Playwright discovery pass. Default HTML reporter encountered
an existing report-file permission error during discovery; line reporter
discovery succeeded without changing ownership or claiming execution.
HTTP probe to localhost:3000 failed connection: no app was running there.
The browser regression is registered, not executed, and no native fluency
acceptance or pending-count reduction is made.


Tamazight plural error review — 2026-09-14, `a693a0093`.
IRCAM PDF page 658 entry 12346 explicitly attests tazglt singular and
tizglin plural. Errors now matches Error; unsupported izgaln is replaced.
The previous correction record is revised, preserving original before
and reason history; ledger stays 18,761 and pending stays 256. Four suites
pass, including exact tokens, order and human-preference preservation.
Related cron error strings still use the prior plural and need contextual
grammar repairs; account lockout failures must not be equated with errors
without semantic review. The full import warning remains French and
pending; no incomplete component-only translation is accepted for it.
Browser verification remains open.


Tamazight migration errors — 2026-09-14, local commit `3d891b203`.
cron-migration-errors and cron-clear-errors revise earlier corrections to
use tizglin error plural (IRCAM PDF 658 entry 12346) and mhu delete/erase
(PDF 418 entry 7924). Clear retains all scope; heading retains migration.
PDF 519 entry 9788 ssfd means clean/wipe, while the earlier emphatic
ss spelling was not supported by that entry. Erase better fits removing
diagnostic records. Original before/reason history retained; ledger stays
18,761 and pending stays 256. Four suites pass. Low confidence: software
diagnostic metaphor and complete migration genitive; browser not run.
cron-errors-cleared still needs complete success semantics and plural
agreement; account lockout failures remain separate semantic review.


Tamazight successful clearing — 2026-09-14, `233955a45`.
cron-errors-cleared now restores the omitted successful qualifier and
attested error plural. IRCAM PDF 146 entry 2672 gives amurs success and
construct umurs; PDF 418 entry 7924 gives delete/be deleted, PDF 658
entry 12346 error plural. Earlier exact-arrow search missed the success
entry because it has two glosses; the full-text/index search found it.
Original ledger before and reason history preserved; four suites pass.
Low confidence: mhant feminine plural and s umurs adverbial construction,
complete status grammar and browser behavior. Components do not attest
the whole sentence. Original pending remains 256; ledger remains 18,761.


Tamazight Optional — 2026-09-14, local commit `855219d70`.
Unflagged optional Arabic becomes aruccil, explicitly attested by IRCAM
Amazigh-English dictionary PDF page 194 entry 3684. Positive/negative
checks verify the adjective and reject Arabic; four suites pass including
all token/order/human-preference invariants. Longer webhook token and
authentication phrase remains pending rather than being accepted after
a component-only change. Original pending 255; ledger grows to 18,764.
Dzongkha official 2023 dictionary direct download timed out at connection
setup after 10 seconds, confirming current retrieval failure; no epoch
translation or absence claim follows from that timeout. Browser open.


Tamazight webhook qualifier — 2026-09-14, `5b89d5168`.
webhook-token French prose is replaced with optional/authentication
components: IRCAM PDF page 194 entry 3684 optional, PDF 249 entry 4801
authentication and its construct. Token is explicitly a technical borrowing,
not certified native terminology. Full prepositional phrase/borrowing
remain low confidence, browser not run. Actual outgoing notification
adds X-Wekan-Token only for a nonempty configured token; wording preserves
optional role and no auth logic changes. Four suites pass with exact
placeholders, order and human preference. Original pending 255 → 254;
Tamazight 143 → 142; correction ledger grows to 18,765.


## Account status vocabulary review — 2026-09-14

admin-people-user-active and admin-people-user-inactive remain French and
pending. peopleBody.jade renders these as tooltips on toggle controls:
the first currently enabled account can be deactivated; the second
currently disabled account can be activated. They are not descriptions
of frequent activity or permanent membership.

Native MediaWiki statistics-users-active uses imghlaln, but IRCAM
Amazigh-English PDF page 150 entry 2766 explicitly glosses its singular
amghlal as permanent. Do not transplant that statistics label as proof
of account-enabled meaning. MediaWiki active filters uses a different
working-form phrase, likewise not a complete account-status attestation.

IRCAM PDF page 727 entry 13652 supplies be active, PDF page 537 entry
10106 activate, and PDF page 333 entry 6381 click (alongside peck).
Those component meanings are available, but deactivation, state/verb
morphology and complete click-purpose clauses need further native review.
No translation or ledger acceptance is made. Pending stays 254,
including Tamazight 142; browser verification remains open.
Primary: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Native interface: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


Tamazight WIP tasks — 2026-09-14, local commit `a9406c278`.
IRCAM PDF page 605 entry 11328 gives tamskirt task, plural timskirin,
and complex-task compound. Entry 11329 instead means billhook: spelling
without i must not be substituted for the task term. Two existing WIP
repairs replace general work vocabulary with a task plural adaptation.
Original before/reason history retained; ledger stays 18,765, pending 254.
Four suites pass, preserving maximum/greater-than/user-defined meanings
and exact placeholders/order/human preference. Low confidence: plural
genitive tmskirin and full maximum/comparative clauses; browser not run.
Account-status activation/deactivation wording remains separately open.


Tamazight task/subtask batch — 2026-09-14, `8bf9f58cf`.
Task French is replaced with directly attested tamskirt (IRCAM PDF 605
entry 11328). Four prior subtask labels reuse its plural/construct forms,
retaining add/show/field and below-parent-task qualifiers. IRCAM PDF 315
entry 6099 supplies ddaw below/under. Export and general subtask labels
remain identical. Four suites pass with placeholder/order/human preference
preservation; original before and reasons retained for prior revisions.
Low confidence: below-task adaptation, plural genitive and full software
compounds; standalone task is directly attested. Browser not executed.
One new unflagged record, four revisions: ledger 18,766, pending stays 254.


Tamazight subtask board — 2026-09-14, `9515511af`.
default-subtasks-board French description is replaced with current
subtask terms and for-board wording, preserving __board__ exactly.
models/boards.js uses it for the generated board description, not its
title. Deposit-to-this-board label reuses the same updated task phrase.
Primary task/below components remain IRCAM PDF 605 entry 11328 and PDF
315 entry 6099. Four suites pass; token/order/human preference preserved.
Low confidence: below-task software compound and full prepositional/
description grammar. Browser not run; original pending remains 254.
Landing-list French phrase remains a separate complete repair.


Tamazight subtask landing list — 2026-09-14, `d968e4bb2`.
deposit-subtasks-list French is replaced with complete arrival-list,
subtasks and deposited-here components. IRCAM PDF 265 entry 5164
arrival/construct; PDF 469 entry 8866 here; PDF 464 set-down verb;
PDF 605 entry 11328 task and PDF 315 entry 6099 below. Actual sidebar
label precedes target-list selection. Four suites pass and preserve exact
placeholders/order/newer human translations. Low confidence: landing-list
metaphor, rsant relative-clause agreement and genitive subtask compounds;
components do not certify full phrase, browser not run. Original pending
254 → 253; Tamazight 142 → 141; correction ledger grows to 18,768.


Tamazight currency and integer evidence — 2026-09-14, `551e1ec04`.
Unflagged custom-field-currency Arabic is replaced with adrim anzmar,
explicitly glossed currency in IRCAM PDF page 58 entry 810, alongside
adrim money/currency and national-currency compound. This is full primary
compound evidence rather than a money-only extrapolation. Four suites
pass with token/order/human-preference protection. Currency-code label
remains French and needs separate review; browser unexecuted.
Integer research: PDF 450 entry 8544 supplies positive; PDF 162 entry
3011 zero. Fraction entries 7482/11605 mean tribal subdivisions, not
mathematical fractions. Neither those nor positive alone completes the
positive-integer error. That full message remains Arabic and pending.
No partial acceptance made; pending 253, ledger grows to 18,769.

Currency-code repair — 2026-09-14, `356836c4f`.
French custom-field-currency-option is replaced with inigl n udrim anzmar.
IRCAM Amazigh-English PDF page 388 entry 7364 explicitly glosses inigl
as code, with postal and bank code examples; page 58 entry 810 explicitly
glosses adrim anzmar as currency and gives construct udrim.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
The locally cached primary PDF was inspected; web retrieval rejected its
63 MB length. The full currency-code phrase is an assembled genitive,
not an attested dictionary sentence: low confidence for native grammar
and adjective agreement. Both currency and code meanings are retained.
Four source checks pass; browser/native review remains open. This key was
unflagged, so the original 253-finding queue is unchanged; ledger 18,770.

Basic color repairs — 2026-09-14, `502c7e0cf`.
Six unflagged French/Arabic color labels now use exact standalone IRCAM
Amazigh-English entries: black abrkan (PDF 32, 276), blue anili (178,
3332), green azgza (275, 5385), red azggʷaɣ (275, 5375), white amllal
(138, 2526), yellow awraɣ (268, 5233). No inflections were invented.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Green has green/blue polysemy in the primary entry; blue uses a distinct
explicitly blue lemma, with regression coverage preventing conflation.
Four source checks pass, including exact values, wrong-language negatives,
tokens, ordering and human preference. Complex CSS shades remain separate
review; browser rendering is not certified. Ledger: 18,776; original
pending queue remains 253 because these six keys were unflagged.

Planning Poker repair and integer review — 2026-09-14, `8d48c0e3e`.
French poker-finish and poker-replay become smd and als respectively.
IRCAM Amazigh-English PDF page 499 entry 9408 explicitly means to
complete/finish; page 117 entry 2103 means repeat/do again/start again.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Actual cardDetails.js handlers set the poker end date for Finish, and
replay/unset end and estimation for Replay. Short action imperatives use
verb lemmas; native/browser context review remains open. Four source
checks pass. These keys were unflagged: original pending remains 253,
ledger 18,778.
The same complete-verb entry glosses participle ismdn as integral. That
is not explicit attestation of the mathematical noun integer, so it is
not substituted into swimlane-height-error-message. Comprehensive-board
migration likewise needs a full-scope modifier, not a completed-status
verb that would suggest the operation already finished. Both stay open.

Positive integer error repair — 2026-09-14, `597098ac1`.
The Arabic swimlane-height-error-message is replaced with a complete
Tamazight draft retaining height, swimlane, obligation, integer and positive.
IRCAM Amazigh-English gives height ijgil (PDF 376, 7115), positive umnig
(450, 8544) and have-to xss (356, 6770). Existing number and swimlane
terms are reused. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
New mathematics evidence: University Mouloud Mammeri 2015/2016 study,
PDF page 59 table, explicitly maps Entier to ummid, referencing the
1984 mathematics lexicon page 52. This establishes a mathematical
meaning beyond the earlier integral adjective search. Source:
https://dspace.ummto.dz/server/api/core/bitstreams/c93d3708-e773-47ec-af3b-1173a10436f5/content
Low confidence: transferring Algerian pan-Amazigh technical terminology
to Moroccan standard, genitive ubrid and the full modal/be sentence.
Native/browser review remains open; this is a draft, not fluent certification.
Four checks pass with independent positive/integer components and Arabic
negatives. Corrected original findings 15,650; pending 252 (zgh 140);
ledger 18,779. Earlier dated notes leaving this message Arabic are superseded.
Catalogue PDF fetch failed certificate verification; no TLS checks were
disabled. System pdftotext is unavailable; neither is evidence of lexical
absence. Comprehensive-board-migration remains separately open.

Comprehensive migration title — 2026-09-14, `4091c14e4`.
French comprehensive-board-migration becomes a full board migration title
(exact Tifinagh value recorded in the correction ledger). IRCAM Amazigh-English
PDF page 63 entry 916 explicitly uses ismdn in full text, which provides
a scope-modifier example beyond the earlier complete/finish verb search.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Low confidence: full-text modifier adapted to comprehensive software
migration, and genitive attachment. Avoid worldwide/global and physical
filled-container senses. No migration implementation or description is
changed. No direct title-key consumer was found in client/models search;
this repairs stored translation data, not proof of a visible active UI.
Four source checks pass; native/browser review remains open. Corrected
original findings 15,651; pending 251 (zgh 139); ledger 18,780. Earlier
dated notes leaving this title French are superseded by this draft.

Shared-list conversion repair — 2026-09-14, `7817aa29f`.
French step-convert-shared-lists becomes a complete Tamazight draft,
with exact value in the correction ledger. IRCAM Amazigh-English gives
ssnfl transitively change/transform (PDF 532, entry 10003), talgamt list
and plural tilgamin (589, 11039), ssur be common/be shared (535, 10073).
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Low confidence: applying transformation to software conversion and
feminine plural ssurnt in the relative clause. The label retains shared
status; it does not mean public/general lists or partition the lists.
Only stored translation data changes; no obsolete migration is restored.
Four source checks pass, covering exact full components and wrong-language
negatives alongside tokens, ordering and human preference. An initial
command had a misspelled suite filename; corrected invocation passed.
Native/browser context review remains open. Corrected original findings
15,652; pending 250 (zgh 138); correction ledger 18,781.

Time label repairs — 2026-09-14, `e9ef2b88b`.
French duration becomes azmz, explicitly used in duration compounds in
IRCAM Amazigh-English PDF 279 entry 5472. Estimated-time-remaining
becomes estimation of the time that remains, retaining all components:
asutg estimation/assessment (PDF 244, 4716), azmz/uzmz time period
(279, 5472), qqim remain (359, 6809). Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Low confidence: full genitive phrase and relative participle qqimn.
Native/browser context review remains open; timing logic is unchanged.
Four source checks pass with full-value positives, French negatives,
token inventories, ordering and human preference. These keys were
unflagged, so pending stays 250 and ledger rises to 18,783.

Account tooltip drafts — 2026-09-14, `439ac5789`.
Both French admin-people-user-active/inactive values become complete
Tamazight drafts retaining user, account state, click and opposite action.
The actual peopleBody.jade loginDisabled true branch uses inactive with
activation; false uses active with deactivation. IRCAM Amazigh-English:
user anssmrs (PDF 186, 3493), click kliki (333, 6391), activate ssrfu
(537, 10106), be active zwr (727, 13652), switch off ssns (532, 10015).
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Low confidence: finite/negative state verb, second-person purpose clause,
and switch-off metaphor for account deactivation. These are assembled
drafts, not attested whole sentences or browser-validated wording. The
previous permanent-user alternative remains excluded. Earlier dated
notes leaving these tooltips French are superseded, not native approval.
Four source checks pass including exact components, French negatives,
and protection against reversing activation/deactivation. Original
corrected 15,658; pending 244 (zgh 136); ledger 18,789.

Automatic-width drafts — 2026-09-14, `9978b92d2`.
Arabic auto-list-width and both click-to-enable/disable-auto-width
values become complete Tamazight drafts. Width and list use IRCAM
Amazigh-English afltas (PDF 68, 1016) and talgamt (589, 11039).
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Automatic awurman is explicitly listed as a coined adjective in the
Bouzefrane computer lexicon, PDF page 24, not the Tuareg MC alternative.
Source: https://cedric.cnam.fr/~bouzefra/books/amawal.pdf
Native MediaWiki automatic log messages corroborate this terminology:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
Low confidence: coined cross-variety adjective, width compound and
finite/negative/purpose-clause grammar. State/action terms reuse the
account-tooltip drafts, so their outstanding native review also applies.
Four source checks pass, including Arabic negatives and protection
against reversed click actions. No layout logic is changed. Two original
findings corrected plus one unflagged label: original corrected 15,660,
pending 242 (zgh 134); ledger 18,792. Native/browser review remains open.

Computing domain — 2026-09-14, `da45e203a`.
The unflagged domain label changes from geographic region to taɣult.
Bouzefrane computer lexicon: PDF 52 domain (MW/CLH), 71 domain
identifiers, 132 DNS, https://cedric.cnam.fr/~bouzefra/books/amawal.pdf
These attestations are distinct from the invalidated Tuareg MC records.
Consumers: sidebar.jade domain sharing and peopleBody.js email-domain
column. Four focused translation checks pass; ledger 18,793. Original
pending stays 242 (zgh 134); this is an additional unflagged repair.
Cross-variety native software usage and browser review remain open.
The autoAddUsersWithDomainName Arabic sentence remains pending: the
orgsToAutoAddForEmail helper matches email domains exactly, ignores
empty domains and does not match subdomains. The signup hook adds
matching organization memberships. Its label is a text-input label,
not a checkbox. A generic “add users using a domain name” draft would
lose the condition; the documented domain noun alone does not validate
that complete sentence. No automatic-addition behavior was changed.

Search-limit terminology review — 2026-09-14.
operator-limit-invalid is still French and remains pending. Its English
source requires both invalid-limit diagnosis and positive-integer guidance,
with the exact %s placeholder. IRCAM Amazigh-English PDF 177 entry 3292
ankruf means bound/tied, invalid in the disability sense, paralyzed or
immobilized. PDF 354 entry 6732 likewise describes inability to move.
Neither is evidence for invalid query syntax or an unacceptable limit.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
The local cached primary PDF extraction was inspected; the web viewer
rejects this 63 MB document, which does not invalidate that local evidence.
Boundary/limit candidates include agguttu (40, 445), amari (122, 2201),
awttu (270, 5271) and tiggumra (666, 12525). No whole software-error clause
is attested by these lemmas. The positive-integer draft terminology has
separate cross-variety provenance and cannot alone validate the sentence.
No locale value is changed or counted as corrected by this review.
Outstanding work: faithful complete diagnosis, modal guidance, native
syntax and runtime interpolation; do not translate %s or use disability
terms merely because their dictionary English gloss includes “invalid”.

Search-limit complete draft — 2026-09-14, `10b47a7ed`.
French operator-limit-invalid becomes a full Tamazight draft: invalid
limit diagnosis, required positive integer, exact %s. MediaWiki zgh
feed-invalid supplies the software not-valid construction:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
IRCAM PDF 270 entry 5271 awttu limit, 356 entry 6770 obligation,
450 entry 8544 positive; integer ummid retains separate mathematics
thesis provenance from the height-error repair. Primary dictionary:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Low confidence: assembled negative and modal clauses, noun state,
software-boundary metaphor and cross-variety integer terminology.
The earlier French-pending note is superseded by this draft, not native
approval. Disability terminology stays excluded. Four translation checks
pass, including complete components, exact token inventory and French/
disability negatives. Native/browser acceptance remains open. Original
corrected 15,661; pending 241 (zgh 133); correction ledger 18,794.

Search-limit runtime dispatch — 2026-09-14, `8715c094e`.
The real Query parser is exercised in localizedSearchApostrophes.test.cjs
with zgh operator-limit: abc and -2 produce operator-limit-invalid and
retain the exact offending string; 12 and 0 are accepted. The error draft
has one %s. This verifies dispatch and data retention, not actual TAPi18n
interpolation, browser rendering or native fluency. query-classes.js treats
zero as no limit and uses parseInt, so its accepted input set is broader
than strict positive integers. Translation still matches English guidance;
this behavioral distinction must not be described as strict validation.
The focused parser test passes; no locale values or audit counts change.

Positional runtime formatting fix — 2026-09-14, `c74009b21`.
Actual installed i18next/sprintf reproduced a raw %s when the search error
argument was passed directly as a string. TAPi18n now converts non-null
scalar arguments to sprintf options. The actual translation method is
executed with the installed formatter: Tamazight abc/-2/50% values render,
zero formats, named objects and explicit arrays retain their behavior,
English fallback formats and null/absent arguments do not crash.
Three runtime/parser/lazy-loading suites pass. This supersedes the earlier
unverified runtime-interpolation note for this tested path; browser
rendering and native wording remain unverified. No locale/count changes.

Lost-card restoration title — 2026-09-14, `73543f47a`.
French restore-lost-cards-migration becomes a complete Tamazight draft.
IRCAM Amazigh-English PDF 534 entry 10051 ssukn restore/repair,
575 entry 10775 tikarḍiwin cards, 383 entry 7266 imnidi lost.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Low confidence: adapted feminine plural timnidin, imperative context and
software restoration metaphor. Textile-card and bereavement senses are
excluded. No active key consumer was found in client/models/server; this
repairs stored translation data and does not restore removed migrations.
Four focused checks pass for complete components, negative wrong-language
and wrong-sense coverage, token inventory and protected newer values.
Native/browser review remains open. Original corrected 15,662;
pending 240 (zgh 132); correction ledger 18,795.

Automatic user addition — 2026-09-14, `94205ae5f`.
The Arabic autoAddUsersWithDomainName label becomes a complete Tamazight
draft: add automatically users who have the domain name. The possessive
relative clause preserves the condition instead of describing unrestricted
addition using a domain. Actual orgsToAutoAddForEmail requires exact email
matching, excludes empty domains and does not match subdomains. Creation
and editing templates use this key above a text field, not a checkbox.
IRCAM PDF 463 entry 8773 add, 186 entry 3493 users, 397 entry 7541 name:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Native automatic adverb: MediaWiki logentry-newusers-autocreate:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
Computing-domain provenance remains in the domain repair. Low confidence:
assembled relative possessive ghursn, noun state and adverb placement;
the complete sentence is not attested or native/browser accepted. Earlier
Arabic-pending notes are superseded by this draft, not native approval.
Four source checks pass for complete condition, wrong-language negatives,
tokens, key order and protected newer translations. Original corrected
15,663; pending 239 (zgh 131); correction ledger 18,796.

Possession grammar review — 2026-09-14.
New primary source: Faits de syntaxe amazighe, Miloud Taifi,
“De la prédication seconde en berbère”, PDF 286–288 (printed 285–287).
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=216
PDF 287 explains that a prepositional construction can express possession,
not physical location, and equate to French avoir. PDF 288 identifies
preposition + noun/pronoun + noun as the minimal structure. Singular
examples use ġur-s. This supports a possessive construction for users
with a domain name in draft 94205ae5f; it does not attest ghursn, the
plural relative clause, its standard orthography or the complete label.
Those uncertainties stay open. The primary PDF was downloaded and
page text inspected locally after the web viewer rejected its size.
Social-media search snippets were not used as grammar proof. No locale
value or pending count changes; this review strengthens specific evidence
without claiming native acceptance.

Relative clause provenance — 2026-09-14, `44cb2f6ca`.
Faits de syntaxe amazighe, Ali Barakate, relative-clause standardization
study, PDF 22–25 (printed 21–24), documents lli as a relative marker
with variation among dialects. Primary source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=216
This evidence is appended directly to the automatic-addition correction
record, preserving its original before/after values. Taifi possession
evidence remains restricted to the inspected singular examples. No exact
ghursn match was located in the extracted text; this is not proof of
absence. Whole plural relative syntax and standard wording remain open.
The correction-ledger regression passes for all 18,796 records. No locale
values, corrected counts or pending counts change in this review.

Repository action review — 2026-09-14.
Upload/Update Repository and Sign In to upload repositories remain French.
Native MediaWiki zgh upload/uploadbtn use sktr with file as an object;
login uses kcm; externaldberror uses an inflected update verb sdɣi.
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
IRCAM Amazigh-English PDF 218 entry 4175 asdɣi is the update noun,
not evidence that a noun alone is the required imperative. PDF 68 entry
1021 gives afniq n tmuca as data warehouse. That is not an attested source
repository term. Warehouse/depot and cabinet entries do not resolve this
software distinction. No repository lemma was found by the bounded
English-gloss search; negative search is not proof that none exists.
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
No active consumers for upload-repository/sign-in-to-upload were found
under client. Correcting these stored labels must preserve repository
singular/plural, both upload/update actions and login purpose. Do not
reuse the upload message's file noun as repository or silently drop update.
No locale changes or corrected-count increase result from this review.
Terminology, assembled purpose grammar and native runtime wording remain
open; existing correct-language values and placeholders are preserved.

Additional native software corpus — 2026-09-14.
Read-only GitHub tree inspection located current Common Voice zgh Fluent
resources under web/locales/common-voice/zgh/, not web/locales/zgh/ or
locales/zgh/. The complete tree response was not truncated; locales/
contains generated/test metadata, not the requested translation bundles.
The failed old paths are not evidence of absent language support.
Inspected primary resources:
https://raw.githubusercontent.com/common-voice/common-voice/main/web/locales/common-voice/zgh/pages/common.ftl
https://raw.githubusercontent.com/common-voice/common-voice/main/web/locales/common-voice/zgh/pages/about.ftl
Neither inspected resource contains a repo key. Repository labels remain
unresolved; project-info “Repository” metadata and machine-translation
sites are not native terminology evidence. The corpus also includes
profile, contribution, guidelines and request-language resources suitable
for subsequent contextual review. Read translations against source keys
and full meanings before adopting terms; do not convert Fluent variables
to WeKan placeholders without comparing the exact English token inventory.
No locale values or counts change. This records a usable primary corpus
location and avoids repeatedly treating obsolete URLs as lexical proof.

Email warning retained review — 2026-09-14, `3eaad375b`.
Common Voice zgh email-already-used corroborates the already-used predicate
in an actual email/account message. Keep error-email-taken unchanged and
attach this evidence to its prior correction record:
https://raw.githubusercontent.com/common-voice/common-voice/main/web/locales/common-voice/zgh/pages/profile/settings.ftl
The primary software context strengthens earlier generic MediaWiki
already-used evidence. Full noun/predicate agreement and browser output
remain unverified; unrelated import and plural uncertainties in the older
shared reason must not be treated as evidence against this email clause.
The full correction-ledger check passes; no counts or locale values change.
Invitation review remains open: IRCAM invitation asigr PDF 227/4358 and
not-yet ur ta PDF 452/8585 are attested, but ssidn accepts destiny and
sslɣd accepts intercession. Those senses do not establish accepting a
board invitation; approve/agree alternatives do not certify equivalence.

Invitation acceptance drafts — 2026-09-14, `a47e7141d`.
Arabic accept and French not-accepted-yet become Tamazight drafts. The
full status includes invitation, not yet and a derived passive accept.
Secondary vocabulary qbl accept: https://learnamazigh.com/words
Primary IRCAM invitation asigr PDF 227 entry 4358 and ur ta not yet
PDF 452 entry 8585:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Low confidence: secondary verb provenance and dialect fit, derived
ittu qbil passive spelling/inflection and complete status-clause grammar.
This is not primary attestation of the whole sentence. Acceptance-of-
destiny and intercession senses stay excluded. Earlier French-pending
notes are superseded by drafts, not native acceptance. Four checks pass
for full components, wrong-language/wrong-sense negatives, tokens and
protected newer values. Native/browser review remains open. One original
finding and one unflagged repair: original corrected 15,664; pending 238
(zgh 130); correction ledger 18,798.

Wait-spinner descriptions — 2026-09-14, `aebb361d2`.
Cube-Grid, Double-Bounce, Rotateplane and Scaleout French descriptions
become Tamazight waiting-indicator compounds with exact style identifiers
retained. IRCAM PDF 180 entry 3376 anmmal indicator, 39 entry 415 agani
waiting, 566 entry 10591 n ugani in waiting-room compound:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
The preserved strings are named animation identifiers, not English prose
substituted for a missing translation. Spinner selection maps identifiers
to template names in settingBody.js; no mapping is changed. Low confidence:
assembled software waiting-indicator compound; no full native/browser
acceptance. Textile spinning senses are excluded. Four focused checks
pass for exact style distinctions, wrong-language and wrong-sense negatives,
tokens and protected newer translations. Original corrected 15,668;
pending 234 (zgh 126); correction ledger 18,802.

Start/end field consistency — 2026-09-14, `b0f447c57`.
Four unflagged Arabic labels r-df-start-at/r-df-end-at and predicate-start/
predicate-end now match card-start/card-end native vocabulary. Exact
IRCAM PDF 696 entry 13146 tuddma beginning/start and 666 entry 12533
tigira end: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Rule cardActions.jade option values remain startAt/endAt; Query maps
predicates to the existing date fields. No derived word or full sentence
is introduced. Four translation checks pass for consistency, distinction,
tokens and newer-value preservation. Browser context remains unverified.
Original pending stays 234 (zgh 126); four additional corrections bring
ledger to 18,806. Export-card-field-dates is still French and actually
contains five types including Created. Received and due semantics must
be preserved independently; dictionary “receive” used for hosting guests
is not alone evidence for software reception. No export label repair is
counted by this batch.

Start/end runtime verification — 2026-09-14, `bc9860dff`.
Actual Query parsing with Tamazight has operator and repaired start/end
predicate names preserves startAt/endAt for present and negated-absent
queries. Using those existence predicates for sorting is rejected. The
focused parser suite passes; no query implementation or locale changes.
This verifies runtime metadata mapping rather than merely comparing JSON
labels. Native UI usage and live browser rendering remain unverified;
original pending 234 and correction counts do not change.

Export dates and creation — 2026-09-14, `49aec4fa9`.
French export-card-field-dates becomes a complete five-field draft:
Created, Received, Start, Due, End in unchanged order. French
operator-created/predicate-created become creation noun labels.
IRCAM PDF 209 entry 3982 date plural isakudn, 238 entry 4583 creation
asnflul, 382 entry 7245 reception imiẓ, 696 entry 13146 start and
666 entry 12533 end:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Due reuses the existing due-date label. PDF 279 entry 5472 expiry-date
compound supports related vocabulary, not exact deadline equivalence.
Low confidence: software reception and creation noun adaptation plus
software due-date semantics; no native/browser acceptance. Earlier
French-pending export notes are superseded by this draft, not approval.
Four source checks pass for complete ordered types, French negatives,
tokens and protected newer values. One original and two unflagged repairs:
original corrected 15,669; pending 233 (zgh 125); ledger 18,809.

Creation runtime verification — 2026-09-14, `27f6c9d2a`.
Actual Query parsing with the repaired Tamazight creation operator maps
three-day filtering to createdAt, using deterministic date helpers.
Invalid periods are rejected. The repaired creation sort predicate maps
to createdAt for ascending and descending queries, preserving direction.
The focused parser regression passes. This validates metadata dispatch,
not date-library internals, native fluency or browser rendering. Export
field metadata still maps dates to export-card-field-dates. Original
pending remains 233; no locale values or audit counts change.

Received/due field drafts — 2026-09-14, `822d6dfb5`.
French card-received/r-df-received-at and Arabic card-due are repaired
using the export reception noun and existing due-date terminology.
IRCAM PDF 382 entry 7245 imiẓ reception; related expiry vocabulary
PDF 279 entry 5472:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Actual cardDate.jade badges distinguish received-date and due-date;
rule options retain receivedAt. Low confidence: software reception noun
and due-versus-expiry semantic adaptation. Native deadline terminology
and browser output remain unverified. Four translation checks pass for
consistency, field distinctions, wrong-language negatives, tokens and
protected newer values. Three unflagged repairs; original pending stays
233 (zgh 125), ledger 18,812. No date calculation or query mapping changes.

Received-time activity revision — 2026-09-14, `e3ae37bc5`.
Two prior drafts act-a-receivedAt/a-receivedAt replace derived bound
tarmest with primary IRCAM reception imiẓ, PDF 382 entry 7245:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
This aligns reception vocabulary with received-date labels. The old MW
reception entry was not itself Tuareg-marked; the supporting root had
been misattributed. Preserve that distinction and all earlier evidence.
Original before values stay unchanged; current after values and revision
reasons update in place. Four translation checks pass for new noun,
old-term negatives and complete previous/new time token inventories.
Genitive form, finite activity clause and software reception remain low
confidence. Native/browser review remains open. No extra repair record is
added; ledger remains 18,812 and original pending 233 (zgh 125).


Numeric-total browser verification **2026-09-14**, local commit `75fbb698c`:
Spec 03 executed against the live Meteor app in Chromium: **1 passed
(3.5s)**. Test fixture now enables profile.showCardsCountAt, the actual
setting gating total-badge visibility, and waits for resumed login before
reopening the board after reload. Rendered sum is 7; hidden-field 100 is
excluded, 107 rejected, and translated tooltip checked against the locale.
Earlier registered-but-unrun notes are superseded. This verifies rendering
and calculation scope, not native phrase fluency. Browser snapshots also
show remaining mixed French/Arabic Tamazight values; those require repair.
No locale values/counts changed: pending 232, restored 4, ledger 18,832.


Conjunction repair **2026-09-14**, local commit `4941f33fd`:
Unflagged zgh `or` changes French **ou** to **ⵏⵖ**. Native MediaWiki
`category-empty` directly places ⵏⵖ between media and page alternatives.
The actual main/header.jade sidebar toggle composes sidebar-open, or,
sidebar-close. Source regression checks that composition and rejects ou;
Chromium checks the rendered title and rejects French ou: **1 passed
(4.1s)**. Four translation suites pass with exact placeholders, English
key order and newer-translation preference. This repairs the conjunction
only; full sidebar noun compounds and other French/Arabic values remain
under review. Ledger 18,833; original pending 232/restored 4 unchanged.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


Board control repairs **2026-09-14**, local commit `164268616`;
Chromium coverage `1efbb9034`, **1 passed (3.6s)**.
Four additional unflagged values replace French/Arabic: add-swimlane and
r-add-swimlane become ⵔⵏⵓ ⴰⴱⵔⵉⴷ; listActionPopup-title becomes
ⵜⵉⴳⴰⵡⵉⵏ ⵏ ⵜⵍⴳⴰⵎⵜ; swimlaneActionPopup-title becomes
ⵜⵉⴳⴰⵡⵉⵏ ⵏ ⵓⴱⵔⵉⴷ. Native MediaWiki actions/create-local support
actions/add; list noun follows existing native talgamt repair, while abrid
retains the established path/swimlane convention. Low confidence: composed
construct-state grammar and software swimlane metaphor require native
review. Actual list/swimlane/add-swimlane title attributes pass browser
checks, including rejection of old French/Arabic. The rule label receives
source coverage, not a separate browser execution. Four locale suites pass
with exact placeholders, ordering and newer-translation preference. Ledger
18,837; original pending 232/restored 4 unchanged. Correct counts do not
certify native fluency. French Default labels remain for further review.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


Default label repairs **2026-09-14**, local commit `58169ab23`:
Additional unflagged default, defaultdefault and font-size-default change
French Défaut to ⵙ ⵓⵡⵏⵓⵍ. Native MediaWiki img-lang-default supplies the
exact by-default phrase; pageinfo-default-sort and metadata-fields also
attest it. Preserve the default-setting meaning rather than substituting
First. Actual swimlaneHeader.jade renders defaultdefault for the reserved
Default lane. Chromium verifies the rendered label and rejects Défaut:
**1 passed (3.5s)**. Setting keys receive source regression coverage, not
separate browser execution. Low confidence: adapting the native adverbial
phrase to standalone setting and lane labels merits native review. Four
locale suites pass with tokens/order/newer human translations preserved.
Ledger 18,840; original pending 232/restored 4 unchanged. Earlier notes
that these three French labels remain unchanged are superseded.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


Excel prompt repair **2026-09-14**, local commit `56c2c5331`:
Original flagged export-card-excel-fields replaces French with
ⵙⵜⵉ ⵉⴳⵔⴰⵏ ⵍⵍⵉ ⵔⴰ ⵜⵙⵙⵓⴼⵖⴷ ⵖⵔ Excel: (choose the fields you
will export to Excel). Native MediaWiki history-fieldset-title supports
choose, metadata-fields supplies fields and export supplies export verb.
Excel and the trailing colon remain. Low confidence: relative/future
conjugation and complete software phrase require native review. No active
client source reference was found for this key, so no browser execution
is claimed and no UI was added solely to exercise a translation. Four
locale suites pass with exact tokens, order and newer-human preference.
Ledger 18,841; original corrected 15,671, pending 232 → 231, zgh 125 → 124;
restored 4 unchanged. Queue classification records repair, not fluency.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


Debug catalogue error repair **2026-09-14**, local commit `138b1b0af`:
operator-debug-invalid replaces French with **%s: ⴰⵣⴰⵍ ⵏ debug ⵓⵔ ⵉⵣⵔⵉ**
(%s: invalid debug value). Actual query-classes.js rejects unsupported
values in the debug catalogue. This rephrases predicate as its actual
catalogue-value meaning; it does not replace a Boolean test or use IRCAM's
grammatical predicate noun. Native MediaWiki unexpected supplies value
ⴰⵣⴰⵍ, while title-invalid supplies ⵓⵔ ⵉⵣⵔⵉ for invalid. Technical debug
and exact %s remain. Low confidence: complete diagnostic grammar requires
native review; existing selector/projection catalogue vocabulary remains
separate unresolved work. Four affected suites pass with token/order/newer
translation preference. Source regression checks the debug branch and
keeps existence-check warnings distinct. This is source coverage, not
browser execution. Earlier unchanged-French warning notes are superseded.
Ledger 18,842; corrected 15,672, pending 231 → 230, zgh 124 → 123;
restored 4 unchanged. Corrected classification does not certify fluency.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


Free-memory repair **2026-09-14**, local commit `1bfe76828`:
OS_Freemem replaces Arabic with **OS: ⵜⴰⴽⴰⵜⵓⵜ ⵜⴰⵎⵛⵉⵅⵜ**. Primary
IRCAM General Dictionary PDF page 160, entry 2970 gives amcix vacant/free;
free-of-charge is a separate entry 5739. Derived feminine tamcixt agrees
with existing memory noun takatut. Low confidence: derived form and
computing collocation require native review; the source is not an attested
complete computing phrase. server/statistics.js uses os.freemem(), which
Node documents as free system memory in bytes. informationBody.jade
renders that value via fileSize; no byte/metric logic changed. Regression
distinguishes free from total memory and rejects Arabic/total wording.
Four locale suites pass with tokens, order and newer-translation preference.
No browser execution is claimed for this admin diagnostic. Ledger 18,843;
corrected 15,673, pending 230 → 229, zgh 123 → 122, restored 4 unchanged.
Sources:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
https://nodejs.org/api/os.html#osfreemem


OS release/type repair **2026-09-14**, local commit `163a755c0`:
OS_Release is **OS: ⵜⵓⵏⵖⵉⵍⵜ**; OS_Type is **OS: ⴰⵏⴰⵡ**;
generic type is **ⴰⵏⴰⵡ**. These replace three additional unflagged
Arabic values. Native MediaWiki versionrequiredtext attests software
version tunɣilt; file-info-size attests MIME type anaw. Actual
server/statistics.js reads os.release() and os.type(), separately from
platform and Node version. Node documents type as the operating-system
name (Linux, Darwin, Windows_NT); release uses platform release APIs.
Low confidence: adapting the native terms to OS diagnostics remains open.
Four focused locale suites pass, including exact values, Arabic rejection,
metric-source distinctions, placeholder inventories and human preference.
No admin browser execution is claimed. Ledger 18,846; original corrected
15,673, pending 229 (zgh 122), restored 4 unchanged: these unflagged
repairs do not reduce the original pending list or prove native fluency.
Sources:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
https://nodejs.org/api/os.html#ostype
https://nodejs.org/api/os.html#osrelease


Architecture repair **2026-09-14**, local commit `69d9adb6c`:
OS_Arch is **OS: ⵜⴰⵎⵙⴷⴰⴳⵜ**, replacing an additional unflagged Arabic
label. IRCAM General Dictionary PDF page 604, entry 11323 attests tamsdagt
for architecture and a modular-architecture compound. Actual statistics
reads os.arch(); the information table renders statistics.os.arch. Node
identifies this as the CPU architecture for which its binary was compiled,
not the OS name, platform, bit count or CPU count. Low confidence:
specializing this native architecture term to computing remains open.
Four locale suites pass, with exact wording, Arabic rejection, distinct
OS labels and metric-source/template regressions. Tokens, order and newer
correct-language translations are preserved. No admin browser execution
is claimed. Ledger 18,847; original corrected 15,673, pending 229
(zgh 122), restored 4 unchanged. Changed-value checks do not prove fluency.
Sources:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
https://nodejs.org/api/os.html#osarch

Reference follow-up **2026-09-14**: IRCAM document 333 was downloaded
from its working ircam.biblio.ma endpoint and 306 pages extracted. The
biblio.ircam.ma endpoint failed certificate verification; validation was
not bypassed. Document 333 is the TICAM conference proceedings, published
2020, not a dedicated computing lexicon. Its title or French technical
prose cannot establish native diagnostic vocabulary. This bounded check
provides no acceptance for load-average, platform, uptime or heap labels.
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=333

Short audit verification summary corrected **2026-09-14**: earlier
registered-but-unrun notes are superseded by the dated successful Basque
and Tamazight Chromium executions already recorded in their reviews.
Full clauses and other UI paths remain open; no additional browser run is
claimed by this documentation correction.


Troubleshooting repair **2026-09-14**, local commit `1f0d46494`:
server-error-troubleshooting replaces the full French message with a
Tamazight draft asking the user to submit the server-generated error,
then giving separate Snap and Docker installation instructions. Native
MediaWiki wrongpassword attests the please phrase; emailuser and
htmlform-submit attest send; internalerror attests error. Its blockedtext
also attests using a feature. IRCAM General Dictionary page 120 entry 2157
attests computer server amakkay asnmalay; page 246 entry 4749 attests
installation asrus, with bound form usrus. The instruction uses commands
rather than translating their code. Both literal backtick command bodies
match English exactly, including wekan.wekan and wekan-app; three separate
lines are retained. globalSearch.jade uses this actual translation key.
Four locale suites pass, including rejection of French/Arabic prose,
command inventory, distinct installation lines, placeholders, key order
and newer correct-language preference. No browser error-path execution is
claimed. Low confidence: the full relative clause and instruction grammar
remain open for native review; lexical evidence alone is not full fluency.
Ledger 18,848; corrected original findings 15,674; pending 229 → 228,
zgh 122 → 121; restored 4 unchanged. Other remaining French, Arabic,
calendar, diagnostic and prior uncertain values remain in the full scope.
Sources:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339


Archive/restore repairs **2026-09-14**, local commit `1e3ccd4f0`:
listArchivePopup-title uses the existing complete list-to-archive phrase
with a question mark. restore-board becomes **ⵙⵙⵓⴽⵏ ⵜⴰⴼⵍⵡⵉⵜ**,
replacing Arabic. MediaWiki logentry-delete-restore attests this restore
verb in a software restoration action. IRCAM General Dictionary page 534,
entry 10051 independently attests ssukn as restore/repair. The existing
generic restore key already uses ssukn. The actual boardArchive click
handler calls board.restore(), whereas the list confirmation archives.
Four locale suites pass, preserving exact placeholders/order and newer
translations, and rejecting French/Arabic and archive/restore conflation.
Playwright spec 03 executed in Chromium: **1 passed (3.8s)**. It verifies
the translated list confirmation title, rejects French, closes the popup
without confirmation and checks that the list remains visible. The first
run passed title checks but timed out using the detached-popup close
selector. The ordinary popup uses js-close-pop-over; corrected fixture
then passed. This proves archive title/cancellation rendering, not actual
board restoration. Board restore has source coverage only. Low confidence:
computing board/list noun compounds remain in the native review scope.
Two additional unflagged repairs: ledger 18,850; original corrected 15,674,
pending 228 (zgh 121), restored 4 unchanged. Full native clauses, prior
low-confidence values and remaining wrong-language prose remain open.
Sources:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

SMTP terminology check **2026-09-14**: the bounded IRCAM dictionary port
hits identify a harbour, not a network port. They cannot justify replacing
SMTP terminology with the harbour noun. SMTP label/description and the
full board-restoration guidance remain unresolved; no acceptance is
recorded from these unrelated senses.


Temporary account lockout repair **2026-09-14**, `b54bc8935`:
account-locked replaces the complete French message with a Tamazight
draft: an account blocked for a period because login failed many times,
followed by please try again later. Native MediaWiki blockedtext attests
blocking; passwordreset-emailtitle attests account; wrongpassword attests
login and please; userlogin-authpopup-retry attests try again. The existing
lockout-period uses tizi for period. The draft paraphrases repeated failed
attempts as login failing many times; it does not substitute an unrelated
assassination-attempt noun. It retains a time limit and retry instruction,
separate from the generic user-is-locked status. Four locale suites pass,
including concept checks, French/Arabic rejection, tokens, key order and
newer correct-language preference. No authentication UI execution is
claimed. Low confidence: complete causal and temporal collocations remain
under native review; these checks do not establish full native fluency.
Ledger 18,851; original corrected 15,675; pending 228 → 227, zgh 121 → 120;
restored 4 unchanged. Other lockout settings/info and all prior uncertain
findings remain within scope. Bounded searches supplied no trustworthy
native brute-force technical term, so those messages remain unresolved.
Source:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


Locked-users description repair **2026-09-14**, `8d3dca66a`:
accounts-lockout-locked-users-info replaces the complete French value
with a Tamazight draft. It preserves the existing localized plural
blocked-users subject and ghila/currently, followed by the reason that
login failed many times. The individual account-locked and no-locked-users
messages stay distinct and unchanged. Native MediaWiki blockedtext supports
block/login vocabulary; the existing correct-language plural empty-state
supplies the blocked-users construction. Full causal phrasing and the
per-user interpretation remain low confidence, not accepted as native
fluency solely from component terms. Four locale suites pass, including
concept retention, French/Arabic rejection, exact token inventories,
English key order and newer correct-language translation preference.
A bounded search found no active Jade reference to this description key.
No UI code was added to expose a dormant catalogue message; no browser
verification is claimed. lockedUsersBody.js obtains remainingLockTime
from getLockedUsers; this source check does not prove this key is rendered.
Ledger 18,852; original corrected 15,676; pending 227 → 226,
zgh 120 → 119; restored 4 unchanged. All remaining full phrases and
prior low-confidence values remain within the audit scope.
Source:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


Remaining-time repair **2026-09-14**, local commit `852861ce0`:
accounts-lockout-remaining-time replaces French Temps restant with
**ⴰⴽⵓⴷ ⵍⵍⵉ ⵉⵇⵇⵉⵎⵏ**, a draft meaning time that remains. Primary
IRCAM General Dictionary page 79 entry 1260 attests akud/time; page 359
entry 6809 attests qqim/stay-remain. Low confidence: the derived relative
verb and countdown collocation require native review; the dictionary
attests the component roots, not this full computing phrase. Four locale
suites pass with exact wording, French/Arabic rejection and distinction
from configured lockout period/failure window. Tokens, English key order
and newer correct-language translation preference remain protected.
No active Jade/JS reference to this key was found in the bounded client
search. No UI was added to expose a dormant key, and no browser execution
is claimed. lockedUsersBody.js formats remainingLockTime separately;
that source does not prove this label is rendered. Additional unflagged
repair: ledger 18,853; original corrected 15,676, pending 226 (zgh 119),
restored 4 unchanged. Full phrases and prior uncertainties stay in scope.
Attempt terminology follow-up: the tirmit hits concern experience/travel
or geological experimentation, not unsuccessful authentication attempts.
No acceptance of failed-attempts is inferred from those different senses.
Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339


Board archive guidance review **2026-09-14**:
close-board-pop remains French and unresolved. A complete replacement must
retain restoration, clicking the Archive button and its home-header
location; lexical fragments are insufficient. Native MediaWiki
nstab-mainpage directly attests tasna n usnubg (home page), so the existing
home term is supported in this software context and is retained. A
hypothesis that this could only mean hospitality is not an acceptance or
reason to replace it. Native logentry-delete-restore supports ssukn for
restoration. However IRCAM General Dictionary page 584 entry 10946 defines
taqffalt as a pad/plug blocking a hole, not a UI button. Clothing-button
entries 258 (page 31), 1558 (page 92), 10955 (page 585), 12100 (page 645)
and button/round-jewel entry 10528 (page 562) do not by themselves attest
computing controls. Do not cite those senses as an attested complete UI
instruction. Existing taqffalt occurrences need software-terminology
review; they are not accepted merely because they use Tifinagh. The actual
archiveBoardPopup renders close-board-pop and its Archive confirmation
button. The bounded header search did not locate the home Archive control,
so its location still needs source/runtime verification. No locale was
changed in this review and no browser execution is claimed. Counts remain
ledger 18,853, original pending 226 (zgh 119), restored 4. This evidence
changes the next action: verify UI button/header terminology and actual
restoration entry location before writing the full guidance.
Sources:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339


Archive guidance source discrepancy **2026-09-14**:
The earlier bounded header search is superseded by direct source inspection.
boardsList.js menuSections supplies archive with labelKey archives and
extraClass js-open-archived-board. boardsList.jade renders these sections
as js-select-menu links; the click handler selects the archive section.
The old board-header-btn js-open-archived-board markup at lines 390 onward
is commented out. Thus close-board-pop's English home-header button location
is outdated too; translating that location literally would perpetuate the
error. Full repairs must use the active All Boards menu Archive location
and preserve board restoration. This is an additional source-language
finding, not proof that all other locales already describe it correctly.
Do not make UI changes just to match obsolete prose. No locale/count
changes or new browser execution are claimed. Original pending remains
226 (zgh 119), restored 4, correction ledger 18,853. Next action includes
repairing English and reviewing the same location in other locales, along
with the unresolved Tamazight full sentence and UI terminology.


Archive guidance repair **2026-09-14**, `143965460`:
close-board-pop now directs users to Archive on the All Boards page in
English and six English variants (en-BR, en-DE, en-GB, en-IT, en-MY, en-YS).
The full French Tamazight value is replaced with a draft using restore,
board and the exact existing Archive/All Boards UI labels. This supersedes
notes leaving the source location and French value unchanged. Active
boardsList menuSections supplies the Archive row and the template/click
handler selects it; obsolete header markup stays commented out. No UI
was changed to reproduce obsolete guidance. Native MediaWiki supports the
restore verb and home/page terminology; full Tamazight navigation grammar
and conjugation remain low confidence. Five focused suites pass, covering
all English variants, distinct active place labels, obsolete/French/Arabic
rejection, menu behavior, exact tokens, key order and human preference.
No new browser execution is claimed for board archive/restoration.
Other locales must still be audited for this same obsolete location;
retain ones already correct, repair erroneous locations directly. This
additional multilingual requirement remains within the full goal even
though it is not represented by the original pending table. Ledger
18,861; original corrected 15,677; pending 226 → 225, zgh 119 → 118;
restored 4 unchanged. Prior low-confidence full phrases remain open.
Source:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json


### 2026-09-14 — Full migration-description draft

Local source commit `ef2b560fc`. French comprehensive-board-migration-description
replaced with a Tamazight draft, preserving data-integrity checks and repairs
and list ordering, card positioning and swimlane structure. Original corrected
15,679; pending 224 (zgh 117); restored four unchanged. Ledger 19,757.

[IRCAM General Dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339),
previously downloaded and extracted under .tools/tmp/tamazight-reference:
p523 entry 9864 ssided check; p534 entry 10051 ssukn restore/repair;
p476 entry 9000 sastwa put in order; p678 data-integrity phrase
ⵜⴰⵢⴰⵏⵜ ⵏ ⵜⵎⵓⵛⴰ and entry 12781 timrsi positioning;
p703 entry 13278 tuṣkiwt structure. Current web reader reports the
63,806,653-byte PDF too large; cached primary text remains readable.

Derived asastwa ordering noun (written ⴰⵙⴰⵙⵜⵡⴰ), inflections, technical
list/card/swimlane compounds and general/comprehensive phrasing require
further native review. The draft removes French but does not close these
uncertain findings. Do not use the script/lexical checks as fluency proof.
No active client/server reference found for this description in the source
search; no browser execution claimed, and removed migrations stay removed.
Four focused suites pass (locale meaning/token checks, full correction ledger,
unchanged reviews and completeness), after correcting ROOT in the test.
No external translation service and no remote push.


### 2026-09-14 — Supersede speculative ordering noun

Source commit `3e7b05f82` revises comprehensive-board-migration-description;
original French before-value preserved. Ledger 19,757; pending 224 (zgh 117),
restored four unchanged. IRCAM General Dictionary p180 entry 3360 attests
anmala (order), including word order and classification/tidying compounds.
[MediaWiki primary Tamazight catalogue](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json),
pageinfo-default-sort, independently uses the noun in software sorting.
Replace derived ⴰⵙⴰⵙⵜⵡⴰ with ⴰⵏⵎⴰⵍⴰ; dictionary plus actual computing
usage is stronger than deriving a noun solely from sastwa put-in-order verb.
No remaining superseded noun in the local Tamazight locale search.

Four focused suites pass, including positive ordering phrase and negative
superseded-form checks, ledger exact tokens/order/examples/newer-human
preservation, unchanged reviews and completeness. No browser run or migration
activation. These sources resolve the noun choice, not complete sentence
fluency: comprehensive/general wording, inflection and remaining list/card/
swimlane compounds still require review. Earlier draft evidence is historical
and superseded on this noun only. No service translation or remote push.


### 2026-09-14 — OS uptime label draft

Source commit `2ad05d681`: unflagged Arabic OS_Uptime replaced with a Tamazight
time-elapsed-since-OS-start label. Ledger 19,758; original pending 224
(zgh 117), four restored values unchanged. server/statistics.js obtains
statistics.os.uptime from os.uptime(); informationBody.jade renders it with
humanReadableTime. It is distinct from statistics.process.uptime.
[Node OS documentation](https://nodejs.org/api/os.html#osuptime) supports the
OS-uptime semantics; no numeric values or runtime behavior were changed.

Cached IRCAM General Dictionary: p240 entry 4642 asnti beginning; p721
entry 13549 zri pass; p688 entry 12970 tisnsi application/operating system.
Existing akud time reused. The phrase ⴰⴽⵓⴷ ⵍⵍⵉ ⵉⵣⵔⵉⵏ ⵙⴳ ⵓⵙⵏⵜⵉ
ⵏ ⵜⵉⵙⵏⵙⵉ is a derived computing clause requiring native inflection and
startup adaptation review. Avoid aswuri use/employment and dictionary
projection-period/running-time phrase: neither directly attests OS uptime.
Physical platform senses found in the dictionary do not establish a term for
os.platform(); platform and load-average terminology remain unresolved.

Four focused suites pass after renaming a duplicate statisticsSource constant:
locale meaning checks and actual source/template binding, exact ledger
values/tokens/examples/order/newer-human preservation, unchanged reviews and
completeness. No admin browser run claimed. Structural/script checks do not
certify native fluency. No translation service or remote push.


### 2026-09-14 — Distinct due reminder drafts

Source commit `6171a92af`: act-almostdue, act-duenow and act-pastdue French
replaced with Tamazight drafts retaining exact __timeValue__/__card__ tokens.
Ledger 19,761; original corrected 15,682; pending 221 (zgh 114), restored four
unchanged. models/cards.js routes positive, zero and negative day windows to
almostdue, duenow and pastdue respectively; retain all three distinctions.

Cached IRCAM General Dictionary p521 entry 9825 attests sskti with marked
variant sskwti for reminding/helping remember. Entry 9826 shares unmarked
sskti for fanning/kindling fire. Use the explicit marked reminder variant;
do not incorrectly reject unmarked sskti, which is valid for reminding too.
P59 entry 845 ads/uds approach; p721 entry 13549 zri pass. Existing deadline
term reused. Relative clause, imperfect aspect and computing deadline
collocation remain low-confidence; lexical/script tests do not certify them.

Four suites pass: meaning-state distinction/token inventory checks, ledger
exact values/order/examples/idempotency/newer-human preservation, unchanged
reviews and completeness. A stricter negative check was removed because it
incorrectly rejected a valid unmarked variant; marked-form check retained.
No new browser run. Original queue reduction removes French findings, not
all grammar uncertainties. No external service translation or remote push.

Additional terminology searches: IRCAM p208 entry 3966 asadf is entrance/
access, not itself proof of disability/software accessibility. Easy/ease
entries and inaccessible shelter likewise do not attest that full concept;
accessibility French/Arabic values remain open. Aromanian magenta searches
returned Romanian-context pages, not Aromanian attestations; do not count
those as proof or mark that pending finding resolved.


### 2026-09-14 — Muted/tracking notification drafts

Local source commit `3121eea2f`: two complete French instructions replaced.
Original corrected 15,684; pending 219 (zgh 112); restored four unchanged.
Ledger 19,763. boardHeader.jade renders muted-info and tracking-info in the
watch menu, alongside already translated watching-info. Preserve never
notified for this board vs changes on cards involving creator/member.

Cached [IRCAM General Dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339):
p452 entry 8585 explicitly distinguishes ur sar (never in the future) from
ur jju (never in the past); p155 entry 2866 amsnflul creator/designer/inventor;
p43 entry 502 agmam member, plural igmamn. Reuse existing notification and
change terms, not a newly invented participant label. Whole notification
passive, future-negation placement and card-relative agreement are derived
low-confidence prose and require full native review. Original watching-info
reuse is consistency evidence, not independent fluency proof.

Four focused suites pass: notification-scope distinction, rejection of French/
Arabic and actual watch-menu source references; ledger exact values, tokens,
examples, key order, idempotency and newer-human preservation; unchanged
reviews; completeness. No new watch-menu browser execution claimed. Queue
reduction records French removal, not complete native clause acceptance.
All prior grammar/restored/uncertain findings remain open. No external
translation service or remote push.

## Participation and watch notification messages — 2026-09-14

Local commit `3eb7ae103` replaces two full French catalogue values with
Tamazight drafts. notify-participate reuses the tracking-info notification
sentence, preserving creator/member participation in cards. notify-watch
specifies watched boards, lists or cards, rather than restricting delivery
to card membership or all board changes. English source values establish
these different scopes. No active client/model references were found for
these two keys; this repair does not activate a removed notification UI.

[Primary MediaWiki Tamazight source](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
attests the monitoring verb and the relative watchlist phrase used as a
component of the watched-object qualifier (tooltip-pt-watchlist). Its
watchlist and mywatchlist values also support a native list/monitoring
combination. This does not independently establish WeKan's passive
notification sentence or its adapted mixed-object agreement. Existing
tracking-info provenance and creator/member dictionary references remain
recorded above, including their uncertainty.

**Low confidence:** complete passive inflection, plural/mixed-object
agreement, relative grammar and adapting MediaWiki monitoring to WeKan
notifications still need native review. Reusing a recent draft improves
consistency, not confidence in its full grammar. Existing Latin-script
list label and Tifinagh dictionary list wording also remain broader
terminology-review items.

Four focused suites pass, covering placeholders/tags, key order, original
provenance and newer translation preference, plus distinct message scopes.
No live notification UI/browser test was run. Ledger 19,770; original
corrected 15,690, pending 213 (zgh 110), restored 4 unchanged. Other
uncertain/restored/unflagged findings remain open. No remote push.

## WIP recovery guidance — 2026-09-15

Local commit `414beceef` replaces the French WIP-limit recovery sentence
with a Tamazight draft. English source says move some tasks out of the
list OR set a higher WIP limit. The French seed's remove-card wording
must not be turned into a delete instruction. The replacement names
moving tasks from this list and increasing the WIP limit. Active
listHeader.jade renders this sentence below the limit-exceeded message.

[Primary MediaWiki Tamazight source](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
provides the move action (tooltip-ca-move) and enlarge action
(thumbnail-more). Enlarging a thumbnail supports the verb, not an attested
complete phrase for increasing a numerical WIP limit. Existing first
WIP-error paragraph supplies task/list/limit components for consistency.

**Low confidence:** adapting enlargement to a numerical threshold, full
imperative/object grammar, indefinite-task quantity and the existing
politeness/dialect form remain under native review. Reusing existing
components does not independently validate their complete wording.
Four focused suites pass, including exact placeholders, key order,
correction provenance/newer translation preference and the active template
reference. No live WIP popup browser test was run. Ledger 19,771;
original corrected 15,691, pending 212 (zgh 109), restored 4 unchanged.
All broader uncertain/restored/unflagged findings remain open. No push.

## Bulk-card instructions and description — 2026-09-15

Local commit `df50d9f6e` translates French bulk-card instructions and
repairs description terminology in the generic label and three example
objects. Description uses aglam, not the existing summary noun asgzl.
The instruction identifies titles/descriptions of the cards the user will
create in the displayed JSON format. The title and description JSON
property names remain literal code; only sample prose changes.

[Primary IRCAM English dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
PDF page 42, entry 486, explicitly attests aglam (description) with plural
iglamn. Cached full dictionary text was inspected. The dictionary marks
this noun as a neologism. This is component evidence, not an attested
complete bulk-card instruction. Existing MediaWiki title/create components
and WeKan's card-example terminology provide consistent vocabulary.

Active cardDetails.jade renders the instruction above the JSON textarea
and destination picker. cardDetails.js parses each object and uses its
literal properties for the resulting cards. No JSON schema or application
behavior is changed by this translation repair.

**Low confidence:** complete future-relative grammar, destination-as-created
card interpretation, plural title morphology and the JSON-format compound
remain under native review. The description noun is supported directly;
that does not establish full fluency of every field/example sentence.
Five focused suites pass, including summary remaining distinct, exact JSON
properties, placeholders/tags/key order, original correction provenance
and newer translations. No live bulk-copy browser test was run. Two existing
ledger records are revised with their original before values retained; one
new record brings total to 19,772. Original corrected 15,692, pending 211
(zgh 108), restored 4 unchanged. Broader uncertain review remains open.
No remote push.

## Remaining description noun corrections — 2026-09-15

Local commit `cb7df8bbc` corrects description-on-minicard and addmore-detail
from summary noun to aglam (description). The full locale scan found only
these two remaining description-labelled values containing that summary
noun. Actual summary and search shorthand values remain unchanged; this
is a selected terminology correction, not a global string replacement.

[Primary IRCAM dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
page 42, entry 486, directly supports description aglam. Cached full PDF
text was inspected again; browser retrieval rejects the oversized PDF.
The compound surrounding this noun, especially more detailed wording,
remains under native review. No active client references were found for
these two catalogue keys. No UI activation or live browser verification
is claimed. Existing Latin/Tifinagh terminology consistency also stays open.

Five focused suites pass, including all description-labelled values staying
distinct from summary and preservation of literal JSON properties and
placeholders. Both existing ledger records retain their original before
values with revised after/reasons. Ledger 19,772; original pending 211
(zgh 108), restored 4 unchanged. Broader uncertain/unflagged review remains
open. No remote push.

## Missing-list repair description — 2026-09-15

Local commit `59aa02a7e` replaces the French missing/corrupted-list
migration description with a Tamazight draft. It retains discovering AND
repairing, missing OR damaged lists, and the board structure. No active
client/server/model references were found for this removed migration key;
the repair does not reactivate migration code. Its confirmation remains
French and pending, rather than being silently declared complete.

[Primary IRCAM dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
cached full text supplies discover/find (entry 10232, PDF page 546) and
spoil/damage (entry 9847, page 522). Earlier recorded repair, list and
structure component evidence remains applicable. Physical damage is not
independent attestation of software data corruption; that adaptation stays
low confidence. The dictionary lack entry has a second obligation sense,
so the draft instead reuses the existing not-present list-heading wording.

**Low confidence:** passive formation, feminine/plural object agreement,
existential missing-list clause, tense and software corruption/structure
compounds still need native review. Individual dictionary verbs do not
prove the assembled sentence. Four focused suites pass, covering original
provenance, placeholders/tags/key order and newer human translations. No
live migration/browser test was run. Ledger 19,773; original corrected
15,693, pending 210 (zgh 107), restored 4 unchanged. Full uncertain,
restored and unflagged reviews remain open. No remote push.

## Missing-list confirmation draft — 2026-09-15

Local commit `8e7006cde` repairs the matching French confirmation. It
preserves the description's discovery/repair scope and missing-or-damaged
lists in board structure, with future wording and an explicit continuation
question. This supersedes the earlier note that this confirmation remains
French; native grammatical review is still open.

[Primary MediaWiki Tamazight source](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
pt-login-continue-button uses the continuation/follow verb in a software
workflow. This supports a component, not the full interrogative adapted
here. Dictionary continue/last/remain entries were also checked; their
durational senses were not treated as independent proof of a workflow
confirmation. Earlier discovery/repair/damage references remain recorded.

**Low confidence:** the complete continuation question, future coordination,
passive agreement and data-corruption compound require native review.
Four focused suites pass, including confirmation distinct from description,
exact placeholders/tags/key order, provenance and newer human translation
preference. No active references to this removed migration were found and
no live browser test was run. No removed code is reactivated. Ledger
19,774; original corrected 15,694, pending 209 (zgh 106), restored 4 unchanged.
All broader uncertain/restored/unflagged findings remain open. No push.

## Duplicate-list deletion confirmation — 2026-09-15

Local commit `8b44ebd33` replaces the French confirmation with a Tamazight
draft. It retains the certainty question, future deletion, all duplicate
lists, a shared name AND absence of cards. This is distinct from the more
specific empty-list migration messages, whose extra conditions and
shared-list conversion remain pending. Their conditions are not silently
substituted into this different source string.

Active sidebar.jade deleteDuplicateListsPopup renders this confirmation
above the delete button. Only translation data changed; deletion behavior
is not modified. [Primary MediaWiki Tamazight source](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
attests deletion and a no-matching-action negative existential formulation
(delete-confirm and logempty). Those support components, not the full
adapted no-card/shared-name compound. Existing duplicate-list label and
workspace confirmation provide consistent local vocabulary.

**Low confidence:** full passive and plural/feminine agreement, repeated-
list terminology, shared-name construction and adapting the negative
existential to cards still need native review. Existing compound reuse is
not independent attestation. Four focused suites pass, preserving exact
placeholder/tag inventories, key order, provenance and newer translations,
with regressions for all deletion conditions and question structure. No
live deletion-popup browser test was run. Ledger 19,775; original corrected
15,695, pending 208 (zgh 105), restored 4 unchanged. Full uncertain,
restored and unflagged review remains open. No remote push.

## Empty-duplicate-list restriction — 2026-09-15

Local commit `8378f9f39` translates the French migration description.
It retains safely, only, no cards AND another same-title list containing
cards. The counterpart's populated state is essential; generic duplicate-
list wording alone would omit a deletion restriction.

[Primary IRCAM dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
PDF page 613, entry 11473, attests tanfrut safety/guarantee. Cached full
text was inspected. Adapting safety to data deletion is not attestation of
the complete software phrase. Existing deletion, list/card and title
components provide consistent vocabulary, not independent grammar proof.

**Low confidence:** full restriction and relative grammar, same-title
construction, plural/feminine agreement and duplicate terminology remain
under native review. No active references to this removed migration key
were found. The separate conversion/confirmation message remains pending;
no migration is reactivated. Four focused suites pass, preserving literal
code and placeholders, original provenance and newer human translations.
No live browser test was run. Ledger 19,776; original corrected 15,696,
pending 207 (zgh 104), restored 4 unchanged. Broader uncertain review stays
open. No remote push.

## Ordered empty-duplicate-list confirmation — 2026-09-15

Local commit `38c76afb7` replaces the French confirmation with a Tamazight
draft using explicit ordered steps. Shared lists become lists for each
swimlane before deletion. Only empty duplicates with another same-title
list containing cards are described as removed, followed by a continuation
question. The source's redundant-empty-list assurance is expressed through
these deletion restrictions, rather than inventing a new redundancy noun.

[Primary IRCAM dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
PDF page 535 attests ssur common/shared (also mix/mixed). Cached full text
was inspected; the mixed sense does not prove software shared-list usage.
Religious convert terminology was excluded as inappropriate. The draft
adapts the existing change verb to the representation transformation.
Earlier list/card/swimlane, deletion and continuation evidence remains
recorded, with its limitations.

**Low confidence:** sharing inflection, change-to-convert interpretation,
same-title grammar, relative agreement and expressing redundancy through
conditions need native review. Ordered numeric steps make the sequence
explicit without translating a new unverified temporal adverb. Four
focused suites pass for order, both restrictions, continuation, exact
placeholders, provenance and newer translations. No active migration
references or live browser test; removed code remains removed. Ledger
19,777; original corrected 15,697, pending 206 (zgh 103), restored 4 unchanged.
All broader uncertain/restored/unflagged review remains open. No push.

## SMTP networking-port evidence boundary — 2026-09-15

The full cached [primary IRCAM dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
was rechecked by numbered lexical entries, excluding its English index.
Page 120 entry 2157 explicitly attests computer server as
ⴰⵎⴰⴽⴽⴰⵢ ⴰⵙⵏⵎⴰⵍⴰⵢ (amakkay asnmalay). The existing SMTP host label
and server compound are retained; this supports the noun, not complete
host-description grammar. A scan found no mistakenly split
ⴰⵎⴰⴽⴽⴰ ⵢⴰⵙⵏⵎⴰⵍⴰⵢ form in the locale.

Page 74 entry 1154 gives aftas as harbour/port; page 176 entry 3283
gives anftas as of the port. Neither attests a numbered TCP endpoint.
Those entries must not justify replacing smtp-port with a harbour term.
Cross-dialect computing lexicons and Chilean hosting pages returned by
search do not establish Standard Moroccan Tamazight networking terminology.
The Arabic smtp-port label and French smtp-port-description remain open,
including the complete outgoing-email clause. No locale value, acceptance
or correction count changes in this evidence review. Original pending
206, zgh 103; restored 4 and all broader uncertain findings remain open.

## Unsaved card description warning — 2026-09-15

Local commit `ed8256d45` replaces the unflagged Arabic unsaved-description
warning with a Tamazight draft retaining possession and not-yet-saved status.
[Native MediaWiki](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
new-messages supplies ghurk possession;
rcfilters-quickfilters-placeholder-title supplies not-yet-saved passive
wording for a feminine filter. IRCAM PDF page 42 entry 486 attests aglam
as description. Adapting the passive to a masculine description is
**low confidence**, and the full clause remains under native review.
CardDetails.jade line 913 renders this warning; four focused suites pass
for vocabulary, negative status, source registration, exact placeholders,
key order, provenance and newer human translations. No live UI test ran.
Ledger 19,778; original pending 206 (zgh 103) and restored 4 unchanged.
All broader uncertain findings remain open. No remote push.

## Card description recovery confirmation — 2026-09-15

Local commit `d9cebf2b0` replaces French rescue-card-description-dialogue
with a Tamazight draft asking to change the current card description with
your changes. CardDetails.js line 2972 confirms before setDescription
replaces the stored value with the editor contents; cancelling does not
save. This is distinct from the unsaved-status warning.

[Native MediaWiki](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
changeemail-no-info supplies the change verb in a second-person clause;
changeemail-oldemail attests current and savechanges attests changes.
IRCAM page 42 entry 486 supplies the description noun.
**Low confidence:** change-to-overwrite interpretation, complete question,
card/description construction and possession need native review. These
component attestations do not prove the full recovery prompt. Four focused
suites pass for scope, question, source registration, placeholders,
provenance and newer human translations; no live browser test ran. Ledger
19,779; original corrected 15,698, pending 205 (zgh 102), restored 4.
All broader uncertain/restored/unflagged review remains open. No push.

## Migration help and individual execution — 2026-09-15

Local commit `a00a983c1` replaces French migrations-description with a
Tamazight draft retaining data-integrity checking and repairing for this
board, followed by each migration being executable by itself. Existing
documented IRCAM check/repair/integrity components are reused; the full
cached [IRCAM dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
page 488 entry 9202 attests skr do/make. Physical division/separation
entries were excluded as proof of individual software execution. Entry
7184 iman soul is not evidence for the adapted reflexive phrase.

**Low confidence:** the by-itself reflexive construction, modal/passive
agreement, migration metaphor and complete integrity compound remain under
native review. Four focused suites pass for both actions, board scope,
each/individual execution, placeholders, provenance and newer translations.
No active key reference or live browser run; removed migrations remain
removed. Ledger 19,780; original corrected 15,699, pending 204 (zgh 101),
restored 4 unchanged. All broader uncertain/restored findings remain open.
No push.

## Checklist item and comma instructions — 2026-09-15

Local commit `35dcd699a` replaces French r-items-check and
r-checklist-note with Tamazight drafts. The instruction remains mandatory:
write checklist items with commas between them. The existing checklist
compound and item noun are reused.

The [IRCAM dictionary](https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339)
page 686 entry 12946 explicitly attests tiskrt, plural tiskrin, as a
punctuation comma, alongside garlic and small-fingernail senses. Page 194
entry 3669 attests aru write; the separate childbirth homograph is excluded.
[Native MediaWiki messages](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json)
attest the item plural in transaction-duration-limit-exceeded.

**Low confidence:** full checklist compound, note noun and between-them
agreement remain under native review. These components do not prove the
complete clause. checklistActions.jade registers the instruction beside
its input; no live browser test ran. Four focused suites verify exact
values, mandatory input wording, negative French checks, registration,
placeholders, key order and newer human translation preference. Ledger
19,794; original corrected 15,708, pending 195 (zgh 100), restored 4.
The item label additionally repairs an unflagged value. Broader uncertain,
restored and unflagged review remains open. No push.

## Rule objects and add-label action — 2026-09-15

Local commit `54218b150` replaces French r-card, r-item and r-d-add-label.
Reuse the existing card noun, singular checklist-item noun and r-add plus
r-label terminology. The object nouns remain separate from the action;
add label remains distinct from remove label. checklistActions.jade uses
r-item beside the selected check/uncheck action and item-name input.
This consistency repair supplies no new independent lexical attestation.
**Low confidence:** complete contextual rule wording remains under native
review. Four focused suites pass for exact values, add/remove distinction,
negative French checks, placeholders, key order and human preference. No
live browser test ran. Ledger 19,797; original pending 195 (zgh 100),
restored 4 unchanged: all three repairs were unflagged. Broader uncertain,
restored and unflagged review remains open. No push.

## Rule destinations and member fragments — 2026-09-15

Local commit `d9bcfcd2f` replaces eight French rule fragments:
r-its-list, r-in-list, r-in-swimlane, r-d-add-member,
r-d-remove-member, r-d-check-of-list, r-with-items and r-swimlane-name.
Reuse existing list/swimlane/member/item/name nouns, add/remove imperatives,
and possession/destination constructions. r-d-check-of-list matches the
existing r-of-checklist; member removal matches remove-member. The English
source requests member, rather than retaining the old French participant.
boardActions.jade registers list ownership and distinct list/swimlane
locations around action selectors and name inputs. This consistency repair
adds no independent lexical attestation.

**Low confidence:** complete contextual grammar, including the swimlane
locative and fragment composition, remains under native review. Four
focused suites pass for exact values, object/action distinctions, negative
French checks, placeholders, JSON examples, order and human preference.
No live browser test ran. Ledger 19,805; original pending 195 (zgh 100),
restored 4 unchanged. All eight repairs were unflagged; broader uncertain,
restored and unflagged review remains open. No push.

## Unsaved-description rescue setting — 2026-09-15

Local commit `c9f033fe3` replaces French rescue-card-description with a
Tamazight draft retaining rescue dialogue before closing an unsaved card
description. The cached full IRCAM dictionary, page 152 entry 2806,
attests amsawal dialogue. Existing show, restore, close, card-description
and not-yet-saved terms are reused. A fresh browser fetch of the dictionary
failed because the PDF exceeds the tool's size limit; the cached full
source supplied the entry, rather than relying on the index.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence:** the software-dialogue metaphor, before-closing temporal
construction and agreement remain under native review. userHeader.jade
registers the setting label; cardDetails.js uses its separate rescue prompt.
Four focused suites pass for scope, timing, negative French checks,
registration, placeholders, key order and human preference. No live browser
test ran. Ledger 19,806; original corrected 15,709, pending 194 (zgh 99),
restored 4 unchanged. Broader uncertain/restored/unflagged review remains
open. No push.

## No lost objects to restore — 2026-09-15

Local commit `ab336422a` replaces French
restore-lost-cards-nothing-to-restore with a Tamazight draft. Preserve
negative existence, swimlanes OR lists OR cards, their lost state and
restoration purpose. Reuse existing negative/object/conjunction/restore
terms; the cached full IRCAM dictionary page 120 entry 2158 attests
amakul lost/misplaced and plural imakuln. This is an object adjective,
rather than a lost-person expression.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence:** mixed-gender agreement, the collective qualifier and
complete software phrasing remain under native review. No active key
reference was found in client/server/models; removed migrations stay
removed. No live browser test ran. Four focused suites pass for all three
objects, negation, lost/restoration scope, negative French checks,
placeholders, order and human preference. Ledger 19,807; original corrected
15,710, pending 193 (zgh 98), restored 4 unchanged. Broader uncertain,
restored and unflagged review remains open. No push.

## Card and vote deletion notices — 2026-09-15

Local commit `9e26815db` replaces Arabic card-delete-notice and French
vote-delete-pop. Retain permanent deletion as an explicit cannot-undo
clause and loss of all activities associated with this card or vote.
Reuse existing account/team deletion cannot-undo wording, board deletion
future passive, activity plural and card/voting nouns. Vote and card
objects remain distinct. cardDetails.jade registers the vote notice.
This consistency repair adds no independent lexical attestation.

**Low confidence:** permanence paraphrase, possessive scope and passive
agreement remain under native review. Four focused suites pass for
non-undoable deletion, all activities, distinct objects, negative
wrong-language checks, placeholders, order and human preference. No live
browser test ran. Ledger 19,809; original corrected 15,712, pending 191
(zgh 96), restored 4 unchanged. Broader uncertain/restored/unflagged
review remains open. No push.

## Card and swimlane deletion popups — 2026-09-15

Local commit `7a51038bf` replaces Arabic card-delete-pop and French
swimlane-delete-pop. Preserve all actions removed from the activity feed,
no card reopening versus no swimlane recovery, and no undo. Reuse existing
future deletion, activity/list nouns, board-open and restore verbs, and
cannot-undo clauses. Activity feed is adapted as activity list; this
consistency repair adds no independent lexical attestation.

**Low confidence:** feed adaptation, again adverb and full contextual
agreement remain under native review. cardDetails.jade and
swimlaneHeader.jade register the respective warnings. Four focused suites
pass for feed/all-actions scope, distinct restrictions, no undo, negative
wrong-language checks, placeholders, order and human preference. No live
browser test ran. Ledger 19,811; original corrected 15,714, pending 189
(zgh 94), restored 4 unchanged. Broader uncertain/restored/unflagged review
remains open. No push.

## Update noun and repository-label review — 2026-09-15

Local commit `52b264894` replaces Arabic r-update with asdghi, the update
noun explicitly attested by the cached full IRCAM dictionary page 218
entry 4175. The noun is used as a standalone UI action label; this does
not attest an imperative verb. **Low confidence:** contextual action-label
suitability remains under native review.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

A bounded search through cached lexical pages 1–729 found this update
entry but no repository/upload entry. This is not proof that the language
lacks those terms. Existing upload terminology is available locally, but
repository/repositories/upload-repository/sign-in-to-upload remain French
pending appropriate repository terminology. Do not derive a software
repository noun from an unattested physical-deposit sense. No active
upload-repository/sign-in-to-upload reference was found under client.

Four focused suites pass for the exact update noun, negative Arabic/English
checks, placeholders, order and human preference. No live browser test
ran. Ledger 19,812; original pending 189 (zgh 94), restored 4 unchanged.
The repaired rule label was unflagged; broader uncertain/restored/unflagged
review remains open. No push.

## Checklist mark terminology — 2026-09-15

Local commit `cda3ca904` repairs six French check/uncheck/one/all labels
and revises two existing rule descriptions. Cached IRCAM page 467 entry
8828 attests rcm mark; page 595 entry 11152 attests tamatart sign and plural
timitar. Check is adapted as mark, uncheck as remove sign. These components
replace reliance on the existing, unverified smatr wording. One/all and
item/checklist scope remain distinct. **Low confidence:** checkbox
adaptation and full phrase grammar remain open. Four focused suites pass;
no live browser test ran. Ledger 19,818, original pending 189 (zgh 94),
restored 4 unchanged. Six new records and two revisions were unflagged.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Issue fixes #6694/#6693 now take priority; broader translation work remains
active and incomplete. No push.

## Quick-access hint and technical-term review — 2026-09-15

Local commit `636dae2df` replaces Arabic quick-access-description with a
Tamazight draft retaining star-board action and the resulting shortcut at
this location. The cached full IRCAM dictionary page 210 entry 4007
attests asanf shortcut. Existing star/add/purpose/here terms are reused.
The hint is registered in header.jade's quick-access empty-message row;
contextual here identifies the containing bar. Physical door-bar entries
2442/10905 were excluded as proof of a software bar term.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence:** the software-shortcut metaphor, purpose clause and
contextual location adaptation remain under native review. Four focused
suites pass for star action, board/shortcut/location scope, negative Arabic
checks, source registration, placeholders, order and human preference.
No live browser test ran. Ledger 19,819; original corrected 15,715,
pending 188 (zgh 93), restored 4 unchanged.

Brute-force settings/info remain French. IRCAM protection entries alone
do not attest the complete cybersecurity compound; literal violent-force
wording would not establish exhaustive credential-guessing meaning. No
change was made to these labels. Broader uncertain/restored/unflagged
review remains open. No push.

## Multi-selection and label shortcuts — 2026-09-15

Local commit `3a090333c` replaces Arabic multi-selection and French
toggle-labels using existing Tamazight terminology. Express toggle as add
or remove labels 1-9 for a card; multi-selection adds labels 1-9. Both
numeric ranges remain exact. Existing remove-labels-multiselect supplies
the selection compound, while add/remove/labels/card terms are reused.
keyboard.js lines 197/210 implement add for selection versus toggle for a
card, and its shortcut list registers toggle-labels. This consistency
repair adds no independent lexical attestation.

**Low confidence:** computing selection compound and complete contextual
grammar remain under native review. Four focused suites pass for both
behaviors, exact ranges, negative wrong-language checks, placeholders,
order and newer human translation preference. No live browser test ran.
Ledger 19,821; original corrected 15,716, pending 187 (zgh 92), restored 4
unchanged. multi-selection additionally repairs an unflagged value.
Broader uncertain/restored/unflagged review remains open. No push.

The supplied Transifex support response promises catalogue support for
gv/lld/rup/tig/wal; it does not prove live availability or translation
quality. The existing force-push regression verifies re-registration and
upload after previously missing targets become supported, without network
writes. Unicode CLDR validates Manx's four integer categories plus decimal
many, and Ladin/Tigre integer rules. Aromanian/Wolaytta proposed two-form
rules remain provisional, not native-translator approval. None of this
closes the local native wording review.
Reference: https://raw.githubusercontent.com/unicode-org/cldr/main/common/supplemental/plurals.xml


## Assignee shortcut record reconciled — 2026-09-15

Local source commit `50b68ca45` replaces Arabic toggle-assignees with
Tamazight using existing add/remove, assignee, card and board terminology.
Preserve 1-9 and the English hint's order of addition to the board.
client/lib/keyboard.js maps numeric keys to board-member indexes and
calls toggleAssignee for selected cards or the current card. This source
inspection does not independently establish the ordering semantics of
memberUsers; the order wording is retained from the English source.

**Low confidence:** the assignee relative clause and complete
order-of-addition construction have no independent full-phrase
attestation. Existing terminology is consistency evidence, not proof of
native fluency. Full contextual grammar remains under review.

Verification rerun on 2026-09-15: the Tamazight regression, correction
ledger, retained-review and completeness suites pass. These check exact
placeholders, ranges, repaired values and structure; no live UI test was
run for this batch. Ledger 19,822; original corrected 15,717, pending 186
(zgh 91), restored 4 unchanged. Broader uncertain, restored and unflagged
values remain open. No remote writes.


## Checkbox trigger states — 2026-09-15

Local commit `4e8f1b7dd` repairs unflagged French r-checked/r-unchecked.
Use with a mark / without a mark, rather than imperative mark/remove.
checklistTriggers.jade lines 101-102 and 127-128 use these as state options;
the JavaScript handlers map them to checkedItem/uncheckedItem activities.

IRCAM's cached complete dictionary, page 595 entry 11152, gives tamatart
(sign) with bound form tmatart. Page 297 entry 5800 gives bla (without).
Existing Tamazight with-preposition usage supplies s. The live PDF fetch
exceeded the browser tool's size limit; the full cached lexical entries
were inspected instead. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence:** mark-to-checkbox adaptation and complete grammatical
composition with the surrounding trigger text remain under native review.
The entries support components, not an attested complete computing phrase.
Four focused suites pass: Tamazight state/imperative distinction, negative
French checks and actual template wiring, correction ledger, retained
reviews and completeness. No live UI test ran. Ledger 19,824; original
pending 186 (zgh 91), restored 4 unchanged. Unflagged repairs do not reduce
the original queue. Broader wording review remains open. No remote writes.


## Board action labels — 2026-09-15

Local commit `7c6688b63` replaces unflagged French r-move-card-to and
r-create-card. Preserve moving toward the selected destination and
creating a new card; neither becomes a generic archive action.
boardActions.jade uses move text before the top/bottom and list/board
controls, and create text before the new-card fields.

The full cached IRCAM dictionary gives smutti (move, transitive), page
503 entry 9495; snulfu (create/invent), page 509 entry 9599; amaynu (new),
page 125 entry 2250. Its introduction, PDF page 10, describes deriving
feminine adjectives by adjoining the feminine affix. The new-card label
uses derived tamaynut with the existing feminine card noun. This is
component and morphology evidence, not an independently attested complete
software phrase. Existing move-card descriptions supply the same move
verb/card construction. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence:** full action-fragment composition, feminine agreement
and destination phrasing remain under native contextual review. Four
focused suites pass for exact wording, negative French checks, template
wiring, placeholders, correction ledger, retained reviews and completeness.
No live UI test ran. Ledger 19,826; original pending 186 (zgh 91), restored
4 unchanged. Both repairs were unflagged. Broader review remains open.
No remote writes.


## Planning Poker deletion warning — 2026-09-15

Local commit `53fba5240` replaces French poker-delete-pop. Preserve the
inability to undo permanent deletion and removal of all actions associated
with this Planning Poker. Reuse the card/vote warning construction and
existing Planning Poker feature name. cardDetails.jade's deletePokerPopup
renders this value directly. This repair provides consistency with related
warnings; it adds no independent complete-phrase lexical attestation.

**Low confidence:** permanence expressed as inability to undo, association
expressed through possession, future passive agreement and complete
contextual grammar remain under native review. Four focused suites pass:
warning irreversibility, all-actions/feature scope, negative French checks,
actual template wiring, exact placeholders, ledger, retained reviews and
completeness. No live UI test ran. Ledger 19,827; original corrected 15,718,
pending 185 (zgh 90), restored 4 unchanged. Broader reviews remain open.

Source review also distinguishes attachment-delete-pop's legacy hard-delete
wording from the current attachmentDeletePopup, which renders
attachment-soft-delete-pop and calls attachments.softDelete. Do not insert
permanent/no-undo text into that active soft-delete popup. The legacy key's
wrong-language translation remains in the pending queue. No remote writes.


## Label deletion warning — 2026-09-15

Local commit `4f07f43d8` replaces Arabic label-delete-pop. Retain no undo,
this label's removal from all cards, and deletion of its history. A separate
history clause avoids implying merely removal of a label from history.
The active deleteLabelPopup in labels.jade renders this warning.

IRCAM cached dictionary page 166 entry 3066 gives amzruy (history), bound
form umzruy. MediaWiki's native zgh history_short/history_small and
history labels independently support the noun in an interface context:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
Dictionary: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Existing warning/future, removal and plural-card terminology are reused.
These support components, not the entire newly composed warning.

**Low confidence:** future passive agreement, label demonstrative and
history ownership construction remain under native contextual review.
Four focused suites pass: no undo, all-card scope, independent history
removal clause, negative Arabic checks, actual popup wiring, placeholders,
ledger, retained reviews and completeness. No live UI test ran. Ledger
19,828; original corrected 15,719, pending 184 (zgh 89), restored 4
unchanged. Broader uncertain/restored/unflagged review remains open.
No remote writes.


## Keyboard shortcut status — 2026-09-15

Local commit `260258983` replaces Arabic keyboard-shortcuts (unflagged)
and both flagged enabled/disabled messages. Retain current activation
status and the opposite click action. sidebar.jade's isKeyboardShortcuts
conditional selects enabled versus disabled messages.

IRCAM cached lexical entries: page 210 entry 4007 asanf (shortcut), plural
isunaf; page 611 entry 11436 tanast (keyboard), bound tnast; page 537 entry
10106 ssrfu (activate); page 532 entry 10015 ssns (switch off/put out).
Do not confuse ssns with hospitality homograph 10014. Existing interface
click and activation constructions are reused. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence:** computing shortcut compound, derived plural passive
forms and pronoun/verb agreement in the click clauses remain under native
review. Lexical components do not independently attest the complete
software sentences. Four focused suites pass: heading consistency,
status/opposite-action distinction, negative Arabic checks, actual template
conditional wiring, placeholders, correction ledger, retained reviews and
completeness. No live UI test ran. Ledger 19,831; original corrected 15,721,
pending 182 (zgh 87), restored 4 unchanged. Broader review remains open.
No remote writes.


## PDF preview warning — 2026-09-15

Local commit `9680e2393` replaces Arabic preview-pdf-not-supported.
Preserve your device's inability to preview PDF and try downloading instead.
The attachments.jade pdf-preview-error element renders the warning.
Use inability to display the preview rather than a literal physical-support
verb. Existing preview and file terminology are reused.

IRCAM cached dictionary page 43 entry 501 explicitly gives agm as download
in its computing sense; page 124 entry 2233 gives amattiw as equipment.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
**Low confidence:** general equipment adapted to device, preview compound,
capability clause, try/download conjugation and instead construction remain
under native contextual review. These component entries do not attest the
complete software warning.

Four focused suites pass for device negation, PDF/preview, attempted
download alternative, negative Arabic checks, placeholders, ledger,
retained reviews and completeness. No live UI test ran. Ledger 19,832;
original corrected 15,722, pending 181 (zgh 86), restored 4 unchanged.
Broader review remains open. Accessibility dictionary search found no
suitable direct entry in the inspected cached lexical pages; this is not
proof that no native computing term exists. Both accessibility findings
remain open rather than being replaced with a physical access/permission
term. No remote writes.


## Last administrator warning — 2026-09-15

Local commit `14af25915` replaces Arabic last-admin-desc, which incorrectly
explained the refusal as requiring administrator permissions. English
requires at least one administrator to remain. Preserve inability to change
roles and the minimum as one administrator or more. sidebar.jade displays
the warning under isLastAdmin, alongside disabled role-change controls.

Existing roles/admin vocabulary is reused. IRCAM cached dictionary page
257 entry 4969 gives acku (because); the similar-looking next entry is a
sharp object, not the conjunction. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
**Low confidence:** role terminology, obligation construction, bound admin
form and minimum-count paraphrase remain under native contextual review.
Component vocabulary does not attest the complete warning.

Four focused suites pass: role-change negation, one-or-more administrator
scope, negative Arabic checks, actual last-admin template wiring,
placeholders, ledger, retained reviews and completeness. No live UI test
ran. Ledger 19,833; original corrected 15,723, pending 180 (zgh 85),
restored 4 unchanged. Broader review remains open. No remote writes.


## Import error guidance — 2026-09-15

Local commit `40f06e1d8` replaces French import-board-instruction-about-errors.
Keep conditional errors, possible successful import rather than guaranteed
success, and the All Boards page location. The location uses the exact
existing all-boards translation. import.jade renders this guidance beside
the import instruction. No runtime import behavior was changed.

IRCAM cached dictionary page 262 entry 5099 gives ataf (perhaps); page
424 entry 8034 gives murs (succeed). Existing board, import, error and page
vocabulary are reused. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
**Low confidence:** source sometimes-still-works expressed as possible
success, success-verb morphology, conditional agreement and complete
sentence composition remain under native contextual review. Components
do not independently attest the entire software instruction.

Four focused suites pass for conditional errors, possible success,
translated All Boards location, negative French checks, template wiring,
placeholders, ledger, retained reviews and completeness. No live UI or
runtime import test ran. Ledger 19,834; original corrected 15,724, pending
179 (zgh 84), restored 4 unchanged. Broader review remains open.
No remote writes.


## JSON-schema warning source review — 2026-09-15

The remaining error-json-schema value is French. Actual current caller:
server/notifications/watch.js throws this key when watchableType is neither
board, list nor card. The source string refers to JSON data and proper
information in the correct format, but this caller is not an import parser.
Future translation or UI verification must not claim an import failure was
reproduced solely from this reference. No application behavior was changed.

Cached IRCAM lexical entries support isfka (data), page 395 entry 7505;
anɣmis/inɣmisn (information), page 184 entry 3457; kn (be correct), page
334 entry 6406. Existing r-workflow-format uses amasal, but a bounded search
of the cached lexical pages found no entry containing that spelling. This
is not proof the term is wrong or absent elsewhere, and does not establish
its suitability for a serialization format. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Still open:** complete correct-format terminology, proper-information
qualifier, containment construction and contextual grammar. Do not mark
this value reviewed-correct or reuse the unverified format term as lexical
proof. No locale/ledger/count change: pending 179 (zgh 84), ledger 19,834,
restored 4. This review changes the next action to verifying serialization
format terminology and testing the actual invalid watch-type path, rather
than attributing this caller to import. No remote writes.


## Watching label and disabled warning — 2026-09-15

Local commit `45d2b2b2e` replaces Arabic watching (unflagged) and French
error-watch-disabled (flagged). Preserve the administrator disabling watch
for both boards and cards; do not turn this into user permissions or
watching only cards. The current watch method throws the warning when
getFeatureFlags().disableWatch is true. boardHeader.js translates that
specific error for display. No watch behavior changed.

IRCAM cached dictionary page 123 entry 2228 gives amatr (monitoring,
observation); page 417 entry 7893 gives matr (watch/monitor/guard); page
532 entry 10015 gives ssns (switch off), distinct from hospitality 10014.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Existing administrator and card/board terms are reused.
**Low confidence:** monitoring adapted to notifications, switch-off tense,
bound actor form and coordinated noun agreement remain under native
contextual review. Components do not attest the complete software warning.

Four focused suites pass for watching noun, disabled action, administrator,
board AND card scope, negative wrong-language checks, actual feature-flag
throw wiring, placeholders, ledger, retained reviews and completeness.
No live UI test ran. Ledger 19,836; original corrected 15,725, pending 178
(zgh 83), restored 4 unchanged. Broader review remains open. No remote writes.


## Case-insensitive search hint — 2026-09-15

Local commit `35f74fd04` replaces French globalSearch-instructions-notes-4.
Preserve text search not distinguishing upper/lowercase letters. A/a
clarifies the letter-case adaptation rather than font size. globalSearch.js
includes this key in the generated instruction notes. Search behavior was
not changed or independently retested for this translation batch.

IRCAM cached lexical entries: page 506 entry 9534 snaḥya (distinguish);
page 222 entry 4259 askkil/iskkiln (letters); page 135 entry 2460 plural
imqqrann (big) and page 168 entry 3112 plural imẓẓyann (small).
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
Native MediaWiki zgh search supplies arzzu. Its current file does not supply a case-insensitive term found by
this review; absence in that file does not prove absence elsewhere.
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json

**Low confidence:** big/small letters adapted to upper/lowercase, negative
verb construction and full contextual grammar remain under native review.
Four focused suites pass for text-search negation, both letter forms,
exact A/a example, negative French checks, placeholders, ledger, retained
reviews and completeness. No live UI test ran. Ledger 19,837; original
corrected 15,726, pending 177 (zgh 82), restored 4 unchanged. Broader
review remains open. No remote writes.


## Invalid filename warning — 2026-09-15

Local commit `327a35b82` replaces Arabic invalid-file. Preserve conditional
incorrect filename and cancellation of upload OR renaming. Express invalid
as not correct; IRCAM invalid entries 3292/6732 refer to physical immobility
and are unsuitable here. Current cardDetails.jade and userAvatar.jade
render this warning; no validation behavior changed.

IRCAM cached entries: page 334 entry 6406 kn (be correct); page 537 entry
10095 ssr (cancel); page 238 entry 4582 asnfl (change). Native MediaWiki zgh
uses ssr for cancel and sktr afaylu for upload in interface context:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
Dictionary: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
**Low confidence:** derived upload action noun, conditional/negative
conjugation, cancellation passive and name-change construction remain
under native contextual review. Components do not attest the whole warning.

Four focused suites pass for filename condition, cancelled operation,
upload OR rename, negative Arabic and physical-invalidity checks,
placeholders, ledger, retained reviews and completeness. No live UI test
ran. Ledger 19,838; original corrected 15,727, pending 176 (zgh 81),
restored 4 unchanged. Broader review remains open. No remote writes.


## Created/modified date hint bounds — 2026-09-15

Both flagged globalSearch-instructions-operator-created and -modified
remain French. Their __operator_created__/__operator_modified__ tokens,
backticks, :<n> and *<n>* examples must remain literal.

Actual parser in config/query-classes.js constructs $gte at the date
obtained by subtracting days from now for created/modified numeric values.
server/publications/cards.js copies that operator and date into the field
selector. This includes the lower boundary and has no upper bound at today.
Do not rewrite the hint as an exclusive older-than limit, exactly N days,
or a closed window ending today. The existing English says days ago or less.

Cached IRCAM entries 6175/6176 and 7000 attest few/scarce/small number;
these alone do not attest the relative comparative fewer than N days.
The complete quantitative temporal construction remains under native
review. No translation, ledger or count change: pending 176 (zgh 81),
restored 4, ledger 19,838. This source review establishes the boundary
constraint for the next wording repair; no live date-search UI ran.
No remote writes.


## Import mapping and check-verb spelling — 2026-09-15

Local commit `4a2821835` replaces French import-show-user-mapping with
check the members' mapping/connection. IRCAM cached page 523 entry 9864
ssided (ⵙⵙⵉⴷⴻⴷ) means check; immediately preceding 9863 ssidd
(ⵙⵙⵉⴷⴷ) means light. They must not be treated as interchangeable.
Page 275 entry 5391 azday means link/connection. Existing members noun
is reused. Source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence:** connection adapted to imported-member mapping and
complete ownership grammar remain under native contextual review. No
current client reference to this legacy import-show-user-mapping key was
found in the source search; no live UI claim is made.

The check/light distinction also invalidates treating the older checklist
compound's ssidd spelling alone as attested check terminology. Existing
checklist compounds remain under review and require a separate noun and
software-compound repair; do not mechanically replace all occurrences of
the lighting verb or invent a noun from a verb. This extends the broader
uncertain review beyond the original flagged queue.

Four focused suites pass for exact review label, negative French/Arabic
and wrong check-verb spelling, placeholders, ledger, retained reviews and
completeness. Ledger 19,839; original corrected 15,728, pending 175 (zgh
80), restored 4 unchanged. No live UI test ran. No remote writes.


## Checklist verification noun revised — 2026-09-15

Local commit `5434775ba` revises 49 existing checklist compounds from
list of unsupported assidd to list of verification, using timnẓit's bound
form tmnẓit. IRCAM page 678 entry 12776 attests both forms and the meaning
verification/control/check. This avoids deriving a checking noun from
ssidd, which means light (9863); ssided is the separate check verb (9864).
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

All 49 keys already had correction-ledger records. Preserve each original
before value, revise after, and append dated reasons. Surrounding prose,
placeholder inventories and literal examples remain unchanged. Update
existing regression expectations to the supported noun and reject the old
compound across the entire locale. No unrelated lighting terms changed.

**Low confidence:** the list-of-verification software compound and complete
contextual agreement remain under native review. Attested components do
not certify all 49 complete sentences. Earlier notes reusing the unsupported
noun are superseded for this component by this dated correction; their
other grammar uncertainties remain open.

Four focused suites pass: Tamazight wording regression, exact correction
ledger, retained reviews and completeness. No live UI test ran. Ledger
19,839; original corrected 15,728, pending 175 (zgh 80), restored 4
unchanged. Revising prior repairs does not resolve new original queue
findings. Broader review remains open. No remote writes.


## CSV/TSV import guidance — 2026-09-15

Local source fix `cc2b110ba` replaces French
`import-board-instruction-csv` prose with Tamazight. CSV and TSV remain
literal format names; the alternatives distinguish comma-separated values
from tab-separated values.

Cached IRCAM general English dictionary evidence: page 498 entry 9393
`slɣ` means paste/stick/glue, rather than the food-paste homograph; page
263 entry 5110 `atig`, plural `atign`, includes value; page 686 entry
12946 `tiskrt`, plural `tiskrin`, includes the neologism comma. Entry
5765 supports separate/divide, and entry 4259 supplies letters/characters.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

**Low confidence:** computing paste/value adaptations, passive
`ⵉⵜⵜⵓⴱⴹⴰⵏ` and full contextual grammar remain open. Literal `Tab` is a
borrowed technical term, not an attested native separator name.

Four focused suites pass: Tamazight wording, correction ledger, retained
reviews and completeness. No live UI or runtime import test ran. Ledger
19,840; original corrected 15,729, pending 174 (zgh 79), restored 4
unchanged. Broader review remains open. No remote writes.


## Permanent attachment warning — terminology review 2026-09-15

`attachment-delete-pop` still contains Arabic and remains pending. IRCAM
page 150 entry 2766 attests `amɣlal` / `ⴰⵎⵖⵍⴰⵍ` as permanent,
with bound form `umɣlal`. This supplies a lexical candidate for permanence;
it does not establish adjective agreement or a complete warning sentence.

The dictionary's page 591 entry 11085 `taluft` gives grief, sorrow and
attachment together. Do not treat this ambiguous entry as proof of a
computer-file attachment noun. Page 247 entry 4766 `asɣ` supports attach/join;
page 717 entry 13467 `zdi` includes attach/join/tie and a distinct computer
log-on phrase. Neither establishes the full file-attachment expression.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Current `client/components/cards/attachments.jade:32` renders
`attachment-soft-delete-pop`, not the legacy permanent-delete warning.
Keep that distinction: repairing the unused translation must not change
soft deletion into a permanent-delete UI message. Next action is to verify
a file-attachment expression and agreement for permanent deletion, then
retain the explicit no-undo sentence. This review changes no translation
or classification; 174 findings remain pending. No live UI test ran and
no remote writes were made.


## ZIP import structure — terminology review 2026-09-15

`import-board-zip` remains Arabic and pending. IRCAM page 217 entry 4147
attests computing folder `asdaw` / `ⴰⵙⴷⴰⵡ`, bound `usdaw`, plural
`isdawn`. Its explicit main-folder phrase `asdaw adslan` distinguishes
this entry from a generic physical container.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Actual `client/components/import/import.js:244` describes one or more board
JSON files plus per-board attachment subdirectories. The following Trello
branch reads `.js-import-zip-file` and calls `importTrelloZip`. Keep `.zip`
and JSON literal, preserve board-name subdirectories with attachments,
and do not imply that the archive contains only one board or only JSON.
The current source comment confirms the structure, not full execution.

Next action: combine the attested folder noun with a verified subdirectory
expression and file-attachment terminology, preserving containment and
board naming in the complete instruction. No occurrence of this folder
spelling was found in the cached MediaWiki Tamazight file; that limited
search does not invalidate IRCAM or prove absence in native usage.
No translation or classification changed. Pending 174, zgh 79. No live
ZIP import or UI test ran; no remote writes were made.


## Custom head-tag activation — repair 2026-09-15

Source commit `8362a8a2e` replaces French `custom-head-tags-enabled`.
IRCAM page 537 entry 10106 attests `ssrfu` activate. Existing adjacent
`custom-head-meta-tags` and `custom-head-link-tags` supply custom-tag
terminology. Borrowed `head (HTML)` preserves document-head scope;
it is not presented as a native lexical attestation.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

`client/components/settings/settingBody.jade:555` renders this label beside
`.js-toggle-custom-head`, with checked state from customHeadEnabled.
Regression checks retain activate, custom tags and head scope and reject
French/Arabic prose. Four focused suites pass; no live UI test ran.
Full software compound and agreement remain low confidence. Ledger
19,841; original corrected 15,730, pending 173 (zgh 78), restored 4
unchanged. Broader review remains open; no remote writes.


## Custom web manifest — repair 2026-09-15

Source commit `7c1c4623d` replaces French activation and content labels.
IRCAM page 537 entry 10106 supplies activate `ssrfu`; page 83 entry
1346 supplies content `akttur`. Existing custom assetlinks labels provide
parallel custom-content wording. Borrowed `web manifest` preserves the
technical concept rather than inventing an unattested native equivalent;
JSON remains literal. Full borrowed compound and qualifier agreement
remain low confidence.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Settings template lines 568 and 571 renders the activation and content
labels. Four focused suites pass for exact repairs, rejection of French,
placeholder preservation and completeness. No live UI test ran. Ledger
19,843; original corrected 15,732, pending 171 (zgh 76), restored 4
unchanged. Broader review remains open; no remote writes.


## Legal-notice labels — repair 2026-09-15

Source commit `9baa8f69d` replaces flagged French custom legal-notice URL
and unflagged Arabic legalNotice. IRCAM page 702 entry 13259 gives
`tusmirt` advert/notice; page 283 entry 5527 gives `azrfan` legal.
The feminine adjective `tazrfant` and custom qualifier `tiẓlin` are derived
agreement forms. Complete legal-notice compound remains low confidence:
components do not independently attest the website legal concept.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

The custom link keeps URL, page, legal notice and custom scope. Settings
template line 415 and people settings line 367 render that label. Four
focused suites pass for exact wording, rejection of French/Arabic,
placeholder preservation and completeness. No live UI test ran. Ledger
19,845; original corrected 15,733, pending 170 (zgh 75), restored 4
unchanged. The unflagged repair does not count as a resolved original
finding. Broader review remains open; no remote writes.


## Legal-notice acceptance fragment — review 2026-09-15

Unflagged `acceptance_of_our_legalNotice` remains Arabic. Its English source
is `By continuing, you accept our`; the current Arabic omits the possessive
our. This is both wrong-language prose and a missing meaning component.

`client/components/main/layouts.jade:105` renders this span immediately
before a separate anchor whose label is `legalNotice`. Layouts.js line 310
also updates the span dynamically. Review the rendered pair as a sentence,
not an isolated label: copying English word order could put a Tamazight
possessive in the wrong position. The prior legalNotice noun repair does
not resolve this fragment or certify the complete displayed sentence.

IRCAM page 318 entry 6158 `dum` includes continue/last; page 511 entry
9631 `sul` includes continue/remain/be alive. Existing locale `accept`
uses `ⵇⴱⵍ`, but this limited dictionary search did not independently
attest that verb. Page 524 entry 9868 concerns accepting destiny, and
page 529 entry 9962 accepting intercession: neither establishes generic
acceptance of website legal terms. Do not substitute those narrow senses.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Next action is to verify a generic acceptance verb, continuation phrase
and possessive construction compatible with the linked notice. Preserve
continuing, acceptance and our, then check the full rendered composition.
No translation or original queue classification changed. Pending 170;
unflagged and earlier low-confidence reviews remain in scope. No live UI
test ran; no remote writes were made.


## Generic acceptance verb — source review 2026-09-15

The Friends of Morocco Tamazight verb dictionary directly lists `qbl`
with English accept and agree, habitual `tqbal`, first-person `qblġ`.
It also lists an accept variant `qvl` and agree `tafq`. The actual HTML
was fetched and cached at
`.tools/tmp/tamazight-acceptance-reference/verbs.html`; this is inspected
source text, not only a search-result claim. Browser-tool fetch failed,
but direct HTTPS retrieval succeeded, so the source was available.
Source: https://friendsofmorocco.org/Docs/Dict/Tamazizght%20verbs.htm

This supports the existing locale `accept` verb `ⵇⴱⵍ` as a generic
acceptance candidate, improving on IRCAM's narrow destiny/intercession
entries. A regional Moroccan Tamazight dictionary is evidence for the
verb, not certification of every Standard Moroccan Tamazight inflection.

The cached MediaWiki zgh strings contained no exact `ⵇⴱⵍ` or `ⵏⵏⵖ`
occurrence in the limited search; broad q-prefix matches were mostly
unrelated old/password wording and cannot serve as acceptance evidence.
Next action narrows to continuation, second-person inflection and the
possessive order around the separately rendered legal-notice anchor.
Do not treat `qblġ` (first person) as the required second-person form.
No translation or counts changed; 170 original findings remain pending.
No live UI test ran and no remote writes were made.


## Possessive placement in acceptance sentence — review 2026-09-15

Peace Corps Morocco's Tamazight textbook, printed page 11 / PDF page 16
(zero-based 15), explicitly teaches possession as an ending on the noun,
combining a pronoun with the preposition n. Printed page 12 / PDF page 17
examples include house followed by the our ending, rather than our before
house. The browser-extracted transliteration renders the consonant as
`nā`; the accompanying Arabic example contains gh. Do not normalize that
extraction artifact into a confident Standard Tamazight spelling without
checking the source convention. This review relied on extracted text;
requested screenshots did not expose usable image content here.
Source: https://www.livelingua.com/peace-corps/Tamazight/Tamazight%20Textbook%202007.pdf

This confirms a composition constraint for the current separate acceptance
span and legalNotice link: simply putting a possessive at the end of the
prefix would leave it before the notice noun. Generic legalNotice appears
elsewhere and must not be globally changed to our legal notice.
Next action is to verify a grammatical complete acceptance clause that
preserves ownership while retaining the distinct linked label, or an
existing localized composition mechanism. Do not silently omit our or
change every legal-notice label to a possessive form. The generic acceptance
verb evidence remains valid; complete clause and continuation are open.
No translation, runtime template or counts changed. Pending 170 original
findings. No live UI test ran; no remote writes were made.


## Due-card empty states — repair 2026-09-15

Source commit `3ce7ed2a0` replaces two flagged French due-card messages
and unflagged French no-cards-found. IRCAM page 64 entry 934 attests
find `af`, distinct from surpass/exceed homograph 933. Page 320 entry
6184 attests `dɣi` now/for the moment. Reuse existing due-date phrase
`ⴰⵙⴰⴽⵓⴷ ⴰⵎⴳⴳⴰⵔⵓ` to keep UI terminology consistent.
The compound's precise software deadline meaning and negative passive
`ⵜⵜⵓⵢⴰⴼⵏⵜ` agreement remain low confidence; these complete phrases
still require native review. Due cards must not be narrowed to overdue.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

`client/components/main/dueCards.jade:48` and line 49 render title and
explanation. Description retains possession and at-the-moment qualifier;
generic no-cards-found does not add a due-date condition. Four focused
suites pass for exact wording and translation invariants. No live UI test
ran. Ledger 19,848; original corrected 15,735, pending 168 (zgh 73),
restored 4 unchanged. Unflagged repair is outside original queue totals.
Broader review remains open; no remote writes.


## Imported-member empty state — review 2026-09-15

Flagged French `map-to-existing-user-none` remains pending. IRCAM page
452 entry 8585 explicitly gives `ur ta` not yet; page 435 entry 8259
`nnig` above/on/over supplies a location candidate for the search control.
Page 440 entry 8361 `ntu` means be genuine, but does not establish a
software actual-account adjective. Do not substitute real-estate entry
13277 or believe-true entry 2562 for real user/member.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Actual `client/components/sidebar/sidebar.js:976` distinguishes why the
mapping target list is empty. `searchResults === null` selects this
no-other-real-members-yet message; after a search it instead selects
`map-to-existing-user-no-results`. Its neighboring helpers use
`importedMapTargets(this.userId)` before a search, and returned search
results afterward. Thus no search match and no initial board targets are
different states. Do not replace this instruction with a generic no-results
label or imply that all WeKan users are absent.

Next action: verify actual-account/virtual-member contrast in Tamazight,
then preserve other members, on this board, not yet, search above and
any user in the complete two-sentence instruction. Not-yet wording must
not become never. This evidence narrows meaning without certifying full
grammar. No translation or counts changed. Pending 168 original findings.
No live mapping UI test ran and no remote writes were made.


## Automatic board watching — repair 2026-09-15

Source commit `d0bf77715` replaces Arabic auto-watch. IRCAM page 417
entry 7893 supports watch `matr`, and page 506 entry 9599 supports create
`snulfu`. Native MediaWiki zgh `logentry-newusers-autocreate` uses
`ⵙ ⵓⵡⵔⵎⴰⵏ` for automatic account creation; that computing phrase
supplies automatic wording here. Board watching retains the condition
when boards are created, rather than watching every existing board.
Sources: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json

Full conditional and passive feminine-plural agreement remain low
confidence. No auto-watch/autoWatch/autowatch caller was found in the
searched models, client and server source; this repairs a legacy locale
value without claiming an active UI integration. Four focused suites pass
for exact wording, Arabic rejection and translation invariants. No live
UI test ran. Ledger 19,849; original corrected 15,736, pending 167
(zgh 72), restored 4 unchanged. Broader review remains open; no remote
writes were made.


## Excel disk-space error — terminology review 2026-09-15

Flagged French `export-card-excel-no-disk-space` remains pending. IRCAM
page 212 entry 4045 attests space `asayrar`, with an advertising-space
phrase; page 711 entry 13405 `wdu` means suffice/be enough. Page 584
entry 10935 gives diskette `taqaṛiḍt` and an explicit hard-disk compound
`taqaṛiḍt taquṛaṛt`. These supply candidates, not attestation of a full
free-storage-space error sentence.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Do not use the dictionary's pathway-between-tents sense (7493), dental
space (10747/11555/12213), or exclamation That's enough (5732/7595)
as computing storage capacity. The hard-disk compound should not narrow
the error to physical hard disks; the English says disk space generally.
Free means available/unallocated capacity, not free-of-charge or political
freedom. Preserve cannot export to Excel and insufficient free capacity.

Next action is to verify a general storage-volume/free-capacity expression,
combine it with negated sufficiency and the export failure, and keep Excel
literal. This review changes no translation or counts. Pending 167
original findings; full contextual grammar remains open. No runtime export
or live UI test ran and no remote writes were made.


## Card-export people label — repair 2026-09-15

Source commit `897c89740` replaces French export-card-field-people.
IRCAM page 155 entry 2866 attests creator/designer/inventor `amsnflul`,
matching the existing creator label; page 292 entry 5710 gives `bab`
owner of/possessor of. The card-owner compound makes the owned object
explicit and avoids land-owner (2825) or contractor (2921) specialization.
Existing people, members and assignees labels provide the other terms.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

`models/lib/exportFields.js:27` registers this label for the people field.
The parenthetical roles retain the English order: Creator, Owner, Members,
Assignees. Computing owner compound, gender-neutral use of the ownership
expression, assignee relative-clause grammar and full contextual phrasing
remain low confidence. This does not certify other owner labels.
Four focused suites pass for exact role inventory, French rejection and
translation invariants. No live export UI test ran. Ledger 19,850;
original corrected 15,737, pending 166 (zgh 71), restored 4 unchanged.
Broader review remains open; no remote writes were made.


## Blank rule-field matching — review 2026-09-15

Arabic `r-board-note` remains pending. IRCAM page 147 entry 2709
`amrdu` includes possible/potential; page 189 entry 3565 `ar` includes
empty/unoccupied, while page 356 entry 6773 `xwu` means be empty.
Empty-handed hunting or fishing (473/2276/10493) does not attest an empty
software input. Note-down verb 13515 is recording, not proof of a noun
for an explanatory note.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Board triggers template line 103 renders this instruction. Actual
`models/lib/ruleCardTitleFilter.js` function `cardTitleFilterOrWildcard`
trims a string and returns `*` when the result is empty. Non-string inputs
also return `*`. The trigger code imports and uses this helper. This
supports wildcard matching for the card-title filter; it does not prove
every unrelated field in the app has the same conversion.

Next action: verify explanatory-note, field-empty and software-match
phrases, preserving leave empty to match every possible value. Do not
translate this as deleting stored card data or matching only blank values.
Trimmed whitespace also means no title filter in the inspected helper.
No translation or counts changed. Pending 166 original findings; broader
contextual reviews remain open. No live rule UI test ran; no remote writes.


## Rule matching versus homographs — review 2026-09-15

Further IRCAM review rules out misleading translations for r-board-note.
Page 255 entry 4930 and page 586 entry 10983 are lighting matches;
page 601 entry 11259 is a sporting match. They do not describe matching
rule values. Page 236 entry 4542 and page 608 entry 11389 use
correspondence for letters/email, not value correspondence.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Equality entry 6001 (page 308) and equal-amount entry 7866 (page 416)
are also insufficient alone: the inspected card-title matcher supports
wildcards and historic word matches, so equality-only wording would narrow
its behavior. Entry 3956 (page 207) includes suit/coincide but usually
requires an orientation particle; it is not a verified standalone software
match verb. Observation entry 12851 supplies a possible explanatory-note
noun, but that adaptation remains unverified.

Next action is to seek native computing matching/filter terminology or a
grammatical paraphrase of an unrestricted filter, retaining every possible
value and the instruction to leave a field empty. Do not use mail, fire,
sport or amount-equality vocabulary based on English homographs. This
review changes the candidate selection, not the translation or counts.
Pending 166 original findings; full contextual reviews remain open.
No live UI test ran and no remote writes were made.


## Mobile/desktop mode labels — repair 2026-09-15

Source commit `5f41f83ca` replaces flagged mobile-desktop-toggle and two
unflagged French mode labels. Reuse existing `snfl` change and `talɣa`
form/format terminology; IRCAM page 309 entry 6034 gives `gr` between.
Mobile and Desktop are borrowed technical identifiers, not claimed native
translations. Form-to-layout-mode adaptation and the complete compounds
remain low confidence and require native review.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

`client/components/main/header.jade:74` and cardDetails.jade line 61
render the toggle tooltip. The text retains switching between both modes,
not simply enabling mobile mode or powering a device on/off. Exact checks
cover all three values and reject French toggle prose. Four focused
translation suites pass; no live UI toggle test ran. Ledger 19,853;
original corrected 15,738, pending 165 (zgh 70), restored 4 unchanged.
Two unflagged repairs do not alter original finding totals. Broader review
remains open; no remote writes were made.


## Blank rule-field instruction — repair 2026-09-15

Source commit `d90707d5d` replaces Arabic r-board-note. Native MediaWiki
zgh `search-file-match` uses `ⵉⵎⵙⴰⵙⴰ` for matching file content;
`logempty` also uses a related matching participle. This provides computing
context absent from the earlier lighting/sport/mail homographs.
Derived bound action noun `ⵓⵎⵙⴰⵙⴰ` remains low confidence: verb
attestation does not independently certify this noun or complete sentence.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json

Observation noun tinẓi is adapted as explanatory note; existing field,
empty and value wording combines with IRCAM possible/potential amrdu.
The complete instruction retains leave field empty to match every possible
value, not erasure or matching only blanks. Earlier source review confirms
card-title blanks/trimmed whitespace become the wildcard. Full clause,
note adaptation and contextual agreement remain under native review.
Four focused suites pass for exact repair, Arabic/homograph rejection and
translation invariants. No live rule UI test ran. Ledger 19,854;
original corrected 15,739, pending 164 (zgh 69), restored 4 unchanged.
Broader review remains open; no remote writes were made.


## Search limit instruction — review 2026-09-15

French globalSearch-instructions-operator-limit remains pending. Preserve
literal `__operator_limit__`, backtick example `:<n>` and italic `*<n>*`.
English describes a positive integer and the number of cards per page.
IRCAM page 450 entry 8544 attests positive `umnig`; grammatical negative
entry 3115 and curiosity entry 10687 do not establish mathematical
positivity. A native integer expression still needs evidence.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Actual `config/query-classes.js:584` uses `parseInt(value, 10)`, rejects
NaN and negative values, and treats zero as no operator limit by continuing
without storing it. Thus the parser is more permissive than a strict
positive-integer grammar and the zero behavior must not be presented as a
normal positive page size. `server/publications/cards.js:1078` reads the
operator predicate when present. This source review does not reproduce
all pagination behavior or establish strict integer input validation.

Next action: verify mathematical integer wording and complete cards-per-
page phrase, preserving the English instruction rather than silently
rewording it to allow decimals or zero. Any change to the source guidance
or parser would be a separate behavior change requiring its own tests.
Cached MediaWiki limit labels supply displayed-result terminology, not
an attested positive-integer phrase. No translation or counts changed.
Pending 164 original findings. No live search UI test ran; no remote writes.


## Permanent attachment warning — repair 2026-09-15

Source commit `ecbe3856d` replaces Arabic attachment-delete-pop. Added
file `afaylu yrnan` paraphrases a file attachment rather than using
ambiguous emotional-attachment talu ft / taluft. IRCAM page 150 entry
2766 attests amɣlal as noun/adjective permanent, bound umɣlal. The
adverbial construction s umɣlal is an adaptation, not independently
attested full computing wording. Existing deletion/passive and no-undo
clauses preserve permanent removal and inability to reverse the action.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Full added-file, adverbial permanence and passive grammar remain low
confidence. This supersedes the earlier pending status for wrong-language
prose, not its native-review limits. Active attachments.jade line 32 still
uses attachment-soft-delete-pop; no runtime or soft-delete text changed.
Four focused suites pass for exact wording, Arabic/emotional-term rejection
and translation invariants. No live UI test ran. Ledger 19,855; original
corrected 15,740, pending 163 (zgh 68), restored 4 unchanged. Broader
review remains open; no remote writes were made.


## Linked-card deletion dependencies — source review 2026-09-15

Two French warnings remain pending. Actual cardDetails.js line 2705
appends literal `linkedId:` and the current card ID after
`delete-linked-card-before-this-card`, followed by source-location text.
The source fragment ends with has; do not translate the complete assembled
message as if a linked card title, checklist item or username follows.
The preceding query checks cards whose linkedId equals the current card ID.
References point to this card, not from this card to unrelated targets.

Actual listHeader.js line 651 checks cards with listId different from the
current list and linkedId in IDs of that list's cards. Internal linked cards
on the same list are explicitly allowed. The blocked message appends the
list ID after literal linkedId, even though the selector checks card IDs;
this is source behavior, not a validated identifier description. Preserve
the English warning's incoming reference direction and avoid claiming all
linked cards anywhere block list deletion. Do not independently change
runtime IDs or diagnostic suffixes as a translation repair.

The allowed list path invokes lists.softRemove. These dependency warnings
must not be turned into permanent-delete/no-undo warnings: they explain
why deletion is blocked until dependent linked cards are removed. Earlier
attachment permanence review concerns a separate legacy key.

Next action: compose the two Tamazight warnings using the established
card/list/deletion terms and a verified incoming-linked relationship,
retaining the card fragment's continuation. No translation or counts
changed. Pending 163 original findings. No live deletion UI test ran and
no remote writes were made.


## Linked-card deletion fragment — repair 2026-09-15

Source commit `efdf49b29` replaces French card-dependency warning.
Established cannot-delete wording combines with before `dat` and link
participle derived from `zdi` (IRCAM page 717 entry 13467 attach/join/tie).
The clause places linked-card deletion before deleting this card. Final
`nna dars` preserves which has before the literal linkedId suffix;
it must not be completed with an invented card title or checklist item.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Full before-action clause, linked participle, possession continuation and
complete displayed alert remain low confidence. The source query's
incoming-reference direction remains unchanged. No permanent-deletion
or no-undo claim was added. Earlier list warning remains pending and its
same-list exception still needs correct contextual wording.
Four focused suites pass for exact wording, French rejection and translation
invariants. No live deletion UI test ran. Ledger 19,856; original corrected
15,741, pending 162 (zgh 67), restored 4 unchanged. Broader review remains
open; no remote writes were made.


## List linked-card deletion warning — repair 2026-09-15

Source commit `18e197947` replaces French list-dependency instruction.
Reuse established cannot-delete/before pattern and card/list terms.
IRCAM page 717 entry 13467 zdi attach/join/tie supplies connection wording
for linked cards pointing to cards in this list. Directional pointing is
paraphrased as connection to the specified cards; that software adaptation
and complete relative/feminine-plural agreement remain low confidence.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

The target noun remains cards in this list, not the list itself or unrelated
boards. Earlier source review shows incoming links from other lists are
checked and same-list links allowed; runtime selector is unchanged. The
translation follows the English dependency warning and adds no permanent
or no-undo claim. No runtime deletion behavior or diagnostic suffix changed.
Four focused suites pass for exact repair, French rejection and translation
invariants. No live deletion UI test ran. Ledger 19,857; original corrected
15,742, pending 161 (zgh 66), restored 4 unchanged. Earlier wrong-language
pending classification is superseded by this repair, not the native-review
limits. Broader review remains open; no remote writes were made.


## Private-page login guidance — repair 2026-09-15

Source commit `27dbc30c2` replaces Arabic page-maybe-private. IRCAM
page 262 entry 5099 gives perhaps ataf; page 454 entry 8633 gives
private uslig, also used in private-access phrase entry 3966. Feminine
tusligt is derived to agree with page tasna. Existing login kcm supplies
the linked login clause. Both propositions remain uncertain: page may be
private and signing in may allow viewing, without guaranteeing access.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Literal `<a href='%s'>` and closing anchor are preserved. Template
layouts.jade line 170 supplies /sign-in and renders this below messages
when no current user is present. By-logging-in is paraphrased as if you
log in; complete conditional, pronoun placement and derived adjective
remain low confidence. Four focused suites pass for exact wording and
placeholder/translation invariants. No live UI test ran. Ledger 19,858;
original corrected 15,743, pending 160 (zgh 65), restored 4 unchanged.
Broader review remains open; no remote writes were made.


## Clipboard-image gesture instruction — review 2026-09-15

French paste-or-dragdrop remains pending. attachments.jade line 25 places
literal kbd Ctrl + V before the localized fragment. Preserve this as a
continuation of the shortcut instruction, not a second independently
invented keyboard shortcut. The source image-only qualifier restricts file
type; do not render it as a guarantee that only one image can be uploaded.

Actual attachments.js previewClipboardImagePopup onRendered handler
checks `results.dataURL.startsWith('data:image/')` before setting the
preview/pastedResults. Both document-body pasteImageReader and
dropImageReader use this same handler. The accepted image may be shrunk
before preview when MAX_IMAGE_PIXEL is configured. This proves the
inspected handler's image-type gate, not every upload path's restrictions.
Do not imply general attachments can only be images or that every gesture
is restricted to the preview image element.

IRCAM page 81 entry 1298 akrer and page 336 entry 6439 kriru mean drag.
Page 541 entry 10175 stutti means drop something; physical UI adaptation
needs review. Page 307 entry 5992 specifically drops on the ground;
liquid-drop entries 11206/11484/12745 do not describe a UI drop gesture.
Paste remains supported by entry 9393 slɣ, distinct from food-paste senses.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Next action is to compose paste OR drag-and-drop an image file here,
retaining both gesture steps and image-type-only meaning. Full software
gesture compound, placement and grammar remain open. No translation or
counts changed. Pending 161 original findings. No live clipboard/drop UI
test ran and no remote writes were made.


## Clipboard-image gesture instruction — repair 2026-09-15

Source commit `047c860ea` replaces French paste-or-dragdrop. IRCAM
entry 9393 slɣ paste/glue supports derived aslaɣ action noun; page 336
entry 6439 kriru drag and page 541 entry 10175 stutti drop something
supply gesture components. Existing file/image wording retains image file
here, paste OR drag AND drop, and image-only qualifier. Computing gesture
adaptation, derived paste noun, conjunction/clause grammar and kan only
qualifier remain low confidence; components do not certify the full phrase.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

The Ctrl+V prefix remains in attachments.jade line 25; no shortcut or
runtime handler changed. Earlier review confirms the shared image-type
gate, not a limit on the number of images or other attachment types.
Four focused suites pass for exact wording, French rejection and translation
invariants. No live clipboard/drop UI test ran. Ledger 19,859; original
corrected 15,744, pending 159 (zgh 64), restored 4 unchanged. Broader
review remains open; no remote writes were made.


## Tamazight tabular-calendar qualifier — review 2026-09-15

Tamazight civil/tbla seeds remain English and pending. The Dzongkha repair
uses a visually verified computing tabular term; that evidence cannot be
transferred as Tamazight vocabulary. IRCAM English dictionary page 566
entry 10588 tadabut is table/tribune/platform; page 649 entry 12177
taṭṭblat is table. Neither attests the arithmetic/tabular calendar sense.
People sitting round a table entries 4703/11900 and table of contents
11895 are likewise unsuitable semantic shortcuts.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

A limited search of the cached French/Arabic pages for tabulaire,
arithmétique and tableau returned no matches; this is an extraction/cache
result, not proof those concepts lack Tamazight terms. Do not construct
a calendar adjective from furniture table and present it as attested.

Both variants must preserve a shared tabular/arithmetic description and
the epoch distinction: civil Friday Julian 622-07-16 versus astronomical
Thursday Julian 622-07-15. A computed-calendar paraphrase alone is too
general because other calculated Hijri algorithms also exist. Next action
is to find a computing/mathematics term or precise fixed-rule paraphrase,
then combine it with existing start/date and calendar wording. Saudi
sighting remains a separate unresolved qualifier.
No translations or counts changed. Pending 157 original findings;
Tamazight 64. No live calendar UI test ran; no remote writes were made.

### Resolution — 2026-09-15

Source commit `10aa310033` replaces both seeds using the established Islamic
calendar base, local calculation `ⵓⵙⵉⴹⴻⵏ` and beginning `ⵜⵓⴷⴷⵎⴰ` terms.
Rather than inventing a tabular adjective, it states the defining Julian start
dates: civil 622-07-16 and astronomical 622-07-15. Exact tests preserve the
shared calculated form and distinct epochs. Four focused files pass for all
20,052 corrections and 234 locale inventories. Pending is 33 (Tamazight 32),
restored four unchanged. Julian-name adaptation and full compounds remain low
confidence; no live selector or remote write.


## Saudi sighting-calendar label — repair 2026-09-15

Source commit `103457ada` replaces English Islamic (Saudi Arabia).
Existing Islamic calendar base combines with IRCAM page 278 entry 5445
azlam spotting/seeing and page 273 entry 5329 ayyur moon/crescent moon,
bound wayyur. Country name remains a borrowed proper name. The full
azlam n wayyur sighting-calendar compound is adapted and low confidence;
individual senses do not certify a complete native calendar name.
Source: https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Sighting must not become full-moon reckoning: entries 12370/13059 include
full moon, whereas ayyur explicitly includes crescent. The label retains
calendar, country and sighting distinctions, separate from tabular epochs
and Umm al-Qura. No date algorithm changed. Four focused suites pass
for exact repair, rejection of country-only seed and translation invariants.
No live calendar UI test ran. Ledger 19,862; original corrected 15,747,
pending 156 (zgh 63), restored 4 unchanged. Earlier pending status for
this seed is superseded by the repair, not its grammar-review limits.
Broader review remains open; no remote writes were made.


## Member-removal confirmation — repair 2026-09-15

Source commit `3fd9413b3` replaces Arabic remove-member-pop. All literal
__name__, __username__, __boardTitle__ tokens remain exact. Established
removal/card/board/member wording keeps removal of the member from ALL
cards on this board, not deletion of those cards or removal from unrelated
boards. Receive notification is paraphrased as notification sent to member.
The singular notification is adapted from existing notifications wording;
passive sending and full contextual grammar remain low confidence.

Sidebar template line 828 supplies named tokens for full name, username
and board title. Narrow dictionary receive candidates concern hospitality
or receiving help, so they were not substituted for software notification.
This draft uses existing send wording instead; it does not independently
certify notification delivery at runtime. Four focused suites pass for
exact wording and literal-token/translation invariants. No live removal UI
test ran. Ledger 19,863; original corrected 15,748, pending 155 (zgh 62),
restored 4 unchanged. Broader review remains open; no remote writes.


2026-09-15 — `3da9c1f4e`: unflagged Tamazight `owner` changed from
French Propriétaire to ⴱⴰⴱ ⵏ ⵜⴽⴰⵕⴹⴰ, consistent with repaired
export-card-field-people. IRCAM general English dictionary entry 5710,
page 292, attests bab as owner of/possessor of. This is a card-owner
software adaptation, not independently attested gender-neutral UI wording.
models/exporter.js and models/server/ExporterExcel.js use this key for
card owner columns. Exact agreement, negative French/Arabic checks and
translation/token invariants pass across four focused suites. No live UI
or generated spreadsheet test ran. Ledger 19,865; tracked pending stays
154 because this key was unflagged. Broader native grammar review is open.


2026-09-15 — `11fc595a0`: repair unflagged smtp-tls (Arabic) and
email-smtp-test-subject (French), reusing existing smtp-tls-description
and send-smtp-test wording. Protocol identifiers TLS and SMTP stay literal.
Support is paraphrased as use of TLS, consistent with its enable-control
description; the test subject preserves email/test/SMTP without adding
success or recipient wording. settingBody.jade renders the TLS description;
server/models/settings.js localizes the test subject. Four focused suites
pass for exact values, negative wrong-language checks and all literal-token
invariants. No live mail delivery/UI verification ran. Existing computing
terms and complete phrase grammar remain open to contextual review. Ledger
19,867; tracked pending remains 154 because both findings were unflagged.
The French smtp-port-description and Arabic smtp-port remain pending work;
network port must not be confused with a harbour or physical connector.


2026-09-15 — `e1c372071`: smtp-port-description French replaced with
Tamazight outgoing-email wording; nearby unflagged Arabic smtp-port label
changed to borrowed technical Port SMTP. Port is explicitly a loan, not a
new attested Tamazight networking term. IRCAM entry 1154 aftas is harbour,
so it was excluded; 5476 azn means send/dispatch and 9981 ssmrs means use.
Existing smtp-host-description supplies server and electronic-message
phrases. Description retains your server and sending purpose rather than
incoming delivery, protocol or credential settings. settingBody.jade binds
mailConfiguration.port and suggests 587; server/models/settings.js inserts
that setting in MAIL_URL. Four focused suites pass for exact values,
negative wrong-language/harbour wording and literal-token invariants.
No live UI or SMTP delivery verification ran. Software compound and full
contextual grammar remain low confidence. Ledger 19,869, corrected 15,750,
pending 153 (zgh 60), restored 4 unchanged. Previous note's pending SMTP
port wording is now repaired; native terminology review remains open.


2026-09-15 — `b0ad9320f`: show-desktop-drag-handles French replaced
using IRCAM general English dictionary entry 9816 sskn show/indicate,
10938 taqbbidt handle with attested plural tiqbbidin, and 6439 kriru drag.
Derived action noun akriru/bound ukriru is not independently attested;
complete software compound remains low confidence. Desktop is a borrowed
mode identifier consistent with repaired Mobile/Desktop toggle terminology.
Bucket handle akaram (1179), mill handle igum (6967) and pickaxe handle
 tirjxt (12867) were excluded as specialized physical objects. userHeader.jade
and header.jade use this label for the desktop drag-handle visibility
control; userHeader.js/header.js toggle showDesktopDragHandles. This is
showing handles, not enabling a Desktop application or moving a desk.
Four focused suites pass for exact wording, negative French/Arabic checks
and translation/token invariants. No live drag or UI verification ran.
Ledger 19,870, corrected 15,751, pending 152 (zgh 59), restored 4 unchanged.


2026-09-15 — `66f2a8fee`: French created/modified search hints replaced
with cards created/modified during the last n days. This paraphrases
n days ago or less, rather than only exactly n days ago or future days.
Literal __operator_created__/__operator_modified__, backticks, :<n> and
*<n>* remain exact. IRCAM entry 2274 amggaru last attests plural imggura;
10003 ssnfl means change; creation follows existing snulfu wording.
Full passive feminine-plural and temporal construction remain low
confidence. Earlier parser review in this file establishes $gte bounds
in config/query-classes.js; no parser behavior changed. Four focused
suites pass for distinct values, wrong-language negatives and all literal
placeholder inventories. No live search UI verification ran. Ledger
19,872; corrected 15,753, pending 150 (zgh 57), restored 4 unchanged.


2026-09-15 — `64e524f27`: French due search instruction replaced with
Tamazight numeric deadline and separate all-overdue example. IRCAM entry
3563 ar means until, 6184 dghi now; existing due-date compound is retained.
Before now paraphrases past due date. Numeric prose does not add a future
lower bound or exclude overdue cards. Literal __operator_due__ twice,
__predicate_overdue__, :<n>, *<n>* remain exact. Existing balanced locale
backticks retained despite English missing its closing example backtick.
Full temporal/possessive grammar and computing deadline compound remain
low confidence. Four focused suites pass; no live search UI test ran.
Actual config/query-classes.js numeric due $lt uses nested add(now(), 1 day)
and then days+1: an n+2 cutoff, rather than the English up-to-n hint.
Overdue predicate uses $lt now. This translation repair follows source
prose, not a silent parser rewrite; numeric source/hint conflict is open.
Ledger 19,873; corrected 15,754, pending 149 (zgh 56), restored 4 unchanged.


2026-09-15 — `e908ec0a2`: unflagged accounts-lockout-locked-users French
navigation label replaced by exact locked-user plural wording already
present in accounts-lockout-locked-users-info. peopleBody.js navigation
entry locked-users-setting uses this key. Preserve users temporarily
locked out, not removed accounts or a successful unlock message. Four
focused suites pass for exact label, agreement with description, negative
French/Arabic checks and all placeholder inventories. No live navigation
UI test ran. Existing passive participle grammar remains under contextual
review. Ledger 19,874; tracked pending remains 149 because key was unflagged.
Remaining failed-attempts label is still French. IRCAM entry 11918 tasiɣt
means attack/assault/assassination attempt, not a software login attempt;
it is excluded. A suitable attempt expression or contextual login-failure
paraphrase is still required. Broad native fluency review remains open.


## Failed-attempt noun and software verb review — 2026-09-15

New IRCAM lexical evidence changes the next action for the still-French
accounts-lockout-failed-attempts label. General English dictionary page 193
entry 3653 arm means taste OR try/test/experiment; page 687 entry 12953
 tisirimt (bound tsirimt, plural tisiram) means testing/trial. Court case
amṣiriḍ (2960/7318) and assassination attempt tasiɣt (11918) are excluded.
Failure azgal (5372) is distinct from technical rupture anngzi (3402) and
tragic disappointment inidi (7366); an authentication rejection need not
mean a broken server.

Native MediaWiki zgh source confirms arm in software, not only tasting:
userlogin-authpopup-retry is arm daɣ; wrongpassword uses the same retry;
changepassword-throttled uses turmd ad tkčmd ... tikkal (tried logging in
many times). This supports a verbal attempt paraphrase or an arm-derived
noun, but does not attest a complete failed-attempt noun phrase.
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/zgh.json
Dictionary source/cache:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339

Exact tisiram searches also retrieve Agadir municipal restaurant/shop
lists and an IRCAM literary text about visiting cafes/restaurants. That
spelling is therefore not by itself proof of the trial sense. Those hits
must not be treated as login terminology or a native validation of a draft.
The dictionary's testing/trial sense is usable lexical evidence, while
full failure attribution and plural construction still need contextual
review. Next action: compare an arm-based attempted-login paraphrase with
trial/failure noun wording, preserving countable failed attempts. Do not
substitute technical malfunction, attack or a singular retry instruction.

No source caller of this exact key was found in targeted client settings
searches; this does not prove absence in dynamic integrations. No live UI
verification or locale edit was performed. Ledger 19,874 and tracked
pending 149 remain unchanged; broader grammar review is open.


2026-09-15 — `bf9a929e1`: unflagged French failed-attempts label replaced
with ⵜⵉⵙⵉⵔⴰⵎ ⵙ ⵉⵣⴳⴰⵍⵏ, literally trials with failures.
IRCAM entry 12953 tisirimt testing/trial attests plural tisiram; failure
azgal entry 5372 supports existing izgaln in failures-before. This is a
software attempt adaptation, not independent attestation of the whole
phrase. The previous review's pending French wording is now replaced;
trial sense and full attributive phrase still remain low confidence.
Restaurant homonym search hits do not validate this draft. Court,
assassination-attempt and technical server-rupture vocabulary are excluded.
A more idiomatic arm-based phrase remains a possible native improvement;
no native speaker verification is claimed. Four focused suites pass for
exact value, wrong-language/domain negatives and placeholder inventories.
No live UI test ran; no targeted source caller was found for this key.
Ledger 19,875; tracked pending 149 unchanged because finding was unflagged.
Full native fluency review remains open.


2026-09-15 — `7c58d6c3d`: French accounts-lockout-settings and
accounts-lockout-settings-updated replaced using existing tisghal settings,
IRCAM entry 1065 afrag protection (bound ufrag), update root sdghi.
IRCAM entry 4175 asdghi is update; native MediaWiki updatedmarker and
externaldberror support the software update root. Derived passive plural
 ttusdghint and complete settings/protection construction remain low
confidence. Brute force is explicitly a borrowed cybersecurity phrase,
not an attested Tamazight compound. Physical adwas (853), coercion bssif
(5943)/bzzez (5956/5957) and force-to-swallow sslghj (9963) are excluded.
The confirmation says settings were updated, not that an attack was
blocked or authentication succeeded. peopleBody.jade displays the heading.
Four focused suites pass for exact distinct messages, negative French,
Arabic and physical-force wording, and all token inventories. No live
settings UI or update verification ran. Ledger 19,877; corrected 15,756,
pending 147 (zgh 54), restored 4 unchanged. Brute-force explanatory prose
remains French and pending; full contextual grammar review is open.


2026-09-15 — `5211bf315`: accounts-lockout-info French explanation
replaced with nominal paraphrase: these settings for controlling protection
of login trials from brute-force attacks. IRCAM entry 4565 asnam means
adjustment/control/management (bound usnam); 1065 afrag protection (ufrag),
12953 tisirimt testing/trial plural tisiram, 5575 azzagh attack/raid plural
azzaghn. Existing login noun ukččum retained. The attested attack plural
starts a-, not an inferred i-. Brute force remains a technical loan.
Control tower tanḍaft, sound-level reconciliation asmsasa and verification
 timnẓit are not substituted for general settings control. No attack-blocked
or universal-security-success claim added. Complete nominal chain, bound
states and software attempt sense remain low confidence; lexical entries
do not certify full native grammar. peopleBody.jade line 749 renders this
paragraph below account-protection heading. Four focused suites pass for
exact value, wrong-language/domain negatives and all token inventories.
No live UI or authentication-security test ran. Ledger 19,878; corrected
15,757, pending 146 (zgh 53), restored 4 unchanged. Broader review is open.


2026-09-15 — `0567c1aac`: French total/used heap-size labels replaced
using IRCAM entry 528 agudi heap/pile (ugudi), 1779 aquddi size (uquddi),
11282 tamuttrt total, 9981 ssmrs use. This is a computing metaphor and
software size adaptation, not independent native attestation of the
complete label. Used passive participle and total nominal chain remain
low confidence. Specialized sheaf heap akmin (1241), straw heap ancr
(3506), corpulence azzntr (5586) and paper-size phrase (12207) excluded.

Node V8 documentation distinguishes allocated total_heap_size from
used_heap_size, the amount used by JavaScript objects. informationBody.jade
binds labels to separate totalHeapSize/usedHeapSize fileSize values.
No diagnostic keys or data bindings changed. Four focused suites pass for
exact distinct values, wrong-language negatives and all token inventories.
No live information-panel UI test ran. Ledger 19,880; corrected 15,759,
pending 144 (zgh 51), restored 4 unchanged. Other nine heap labels remain
French and need review, not a whole-batch completion claim.
https://nodejs.org/api/v8.html#v8getheapstatistics

New technical evidence for next actions: total_physical_size is committed
physical heap memory, not total system RAM; total_available_size is further
heap headroom before its limit, not free disk space. does_zap_garbage is a
0/1 flag indicating zap_code_space, not generic successful garbage
collection. Native contexts are active top-level contexts; detached contexts
are detached and not yet collected. Preserve these distinctions when
repairing the remaining diagnostics. Generic physical-force, recollection
or court-context words cannot validate computing compounds.


2026-09-15 — `88add3006`: French heap-size-limit label replaced with
IRCAM abstract limit tiggumra (entry 12525, page 666), alongside existing
repaired agudi heap and aquddi size compounds. Appointment/boundary
taktut (10845) was excluded; mountain peak vocabulary does not express
a configured maximum. Computing metaphor and full nominal chain remain
low confidence; this lexical choice is not native full-label validation.
informationBody.jade binds heapSizeLimit separately from totalHeapSize
and usedHeapSize. Node V8 documentation defines heap_size_limit as its
maximum heap size; labels must not imply remaining headroom, current
allocation or total system RAM. Four focused suites pass for exact value,
negative French/Arabic/appointment checks and token invariants. No live
information-panel UI test ran. Ledger 19,881; corrected 15,760, pending
143 (zgh 50), restored 4 unchanged. Eight other heap labels still need work.
https://nodejs.org/api/v8.html#v8getheapstatistics

Next allocation-wording evidence: IRCAM amuzzur (2691) includes maximum
but also fat; mountain summit words are excluded for peak_malloced_memory.
The Node metric is process-lifetime peak allocation through malloc, not
current used heap or the heap limit. A memory/allocation computing noun
phrase still needs review. No allocation labels were changed this batch.


2026-09-15 — `6481e8bbd`: malloced_memory and peak_malloced_memory
French labels replaced with concise memory-through-malloc phrasing.
IRCAM entry 12742 timktit memory (bound tmktit) and entry 2691 amuzzur
maximum provide lexical components, not independently validated software
phrases. Literal malloc identifies allocation; allocation verb remains
implicit. Peak retains maximum, but complete process-lifetime peak
interpretation and computing memory sense remain low confidence. Do not
claim native fluency or use the fat sense of amuzzur. Dictionary reserve
entries for shyness/discretion (219/440/4086/5168/12517) were excluded;
stock asatim (4030) does not attest virtual-memory allocation.

Node V8 documentation defines malloced_memory as bytes allocated through
malloc and peak_malloced_memory as their process-lifetime peak. The labels
remain separate from used heap and heap limit; informationBody.jade binds
separate mallocedMemory/peakMallocedMemory values. No data behavior changed.
Four focused suites pass for distinct exact values, literal malloc,
negative French/Arabic/mountain wording and placeholder inventories.
No live information UI test ran. Ledger 19,883; corrected 15,762,
pending 141 (zgh 48), restored 4 unchanged. Six heap labels still need work;
previous full-label and native grammar reviews remain open.
https://nodejs.org/api/v8.html#v8getheapstatistics


2026-09-15 — `0f545fd8a`: available/executable heap diagnostic labels
French replaced using existing heap/size/total compounds. IRCAM entry
9632 sula available/free explicitly prefers imperfective ttsala; derived
participle ittsalan is low confidence. 5578 azzgir means execution or
accomplishment (bound uzzgir). Executable heap is paraphrased as heap for
execution; this does not independently attest software executable capability
or the whole phrase. Node definitions retain the distinction: available
size is further heap capacity before its limit, not disk capacity;
executable size is heap capable of containing executable code, not the
application's currently executed instructions or total source-file size.

informationBody.jade uses distinct totalAvailableSize/totalHeapSizeExecutable
bindings. Four focused suites pass for exact distinct labels, wrong-language
negatives and all placeholder inventories. No live information UI test
ran. Full computing capability, temporal availability participle and
nominal compounds remain low confidence. Ledger 19,885; corrected 15,764,
pending 139 (zgh 46), restored 4 unchanged. Four other heap labels remain
French: physical, garbage flag, native contexts and detached contexts.
Previous computing-memory/heap phrase reviews remain open.
https://nodejs.org/api/v8.html#v8getheapstatistics


2026-09-15 — `8516ab9a7`: Node_heap_does_zap_garbage French replaced
with existing heap and use nouns, preserving literal does_zap_garbage.
This identifies use/status of the technical flag rather than claiming
successful garbage collection, ordinary rubbish deletion or an enabled
application security feature. The identifier is intentionally untranslated;
full heap/use computing compound remains low confidence. Node V8 docs
define the property as a 0/1 boolean for zap_code_space, which overwrites
heap garbage with a bit pattern. server/statistics.js reads that exact
V8 property, and informationBody.jade displays the numeric value directly.
No flag setting, data binding or runtime behavior changed. Four focused
suites pass for exact label/identifier, negative French/Arabic wording and
all token inventories. No live information UI test ran. Ledger 19,886;
corrected 15,765, pending 138 (zgh 45), restored 4 unchanged. Physical size
and native/detached context labels still need repair; previous heap grammar
reviews remain open.
https://nodejs.org/api/v8.html#v8getheapstatistics


2026-09-15 — `0f4fc5d22`: French native/detached context counts replaced
using IRCAM entry 8679 uttun number and 2563 amnad environment/context,
attested plural imnadn. Native and detached remain exact technical loans
in parentheses, not claimed fully localized qualifiers. Indigenous/native
arṣli (3760), Saharan origin (4903), son/daughter origin (8393/8528), and
physical coming-undone/untie terms (8277/8286/10322) are excluded. This
avoids translating native context as a person's origin. Computing context
noun and complete qualifier localization remain under review.

Node docs distinguish active top-level native contexts from detached
contexts not yet garbage-collected. server/statistics.js reads separate
number_of_native_contexts/number_of_detached_contexts; informationBody.jade
displays each count separately. No metric behavior changed. Four focused
suites pass for exact distinct qualifiers, negative French/Arabic/origin
wording and all token inventories. No live information UI test ran.
Ledger 19,888; corrected 15,767, pending 136 (zgh 43), restored 4 unchanged.
Physical size is the last still-French heap label; earlier full-phrase
reviews and technical loan localization remain open.
https://nodejs.org/api/v8.html#v8getheapstatistics


2026-09-15 — `0b259c2d3`: French physical heap-size label replaced using
existing heap/total/size compounds and akmam. IRCAM entry 1237 akmam is
concrete/tangible; entry 10742 has physical portrait tafrist takmamt.
Neither independently attests a computing physical-memory phrase, so that
sense and adjective/nominal grammar remain low confidence. Physical force
adwas, bodily exhaustion anzaf and material wealth are excluded. V8 metric
means actual physical memory used/committed by heap, not total system RAM
or merely reserved address space. informationBody.jade binds totalPhysicalSize
separately from totalHeapSize. No metric behavior changed. Four focused
suites pass for exact value, negative French/Arabic/physical-force wording
and all placeholder inventories. No live information UI test ran.

Ledger 19,889; corrected 15,768, pending 135 (zgh 42), restored 4 unchanged.
All eleven previously French heap labels have now been replaced; this is
wrong-language repair progress, not full native computing-language proof.
Earlier heap, memory, capability, temporal and nominal grammar reviews and
native/detached technical loan localization remain open. Full goal remains
incomplete alongside the remaining locale queue and unflagged reviews.
https://nodejs.org/api/v8.html#v8getheapstatistics


2026-09-15 — `ec1f2cb21`: two French top-left logo URL labels replaced
using existing custom-login-logo-image/link-url noun patterns, adapting
location. IRCAM 11729 taghmrt corner (bound tghmrt); 1008 aflla top
(uflla); 4507 left justification uses ghr uẓlmaḍ with emphatic ẓ, not z.
Full top-left spatial chain and logo software compounds remain low
confidence. URL stays literal. Image resource and click destination remain
distinct: settingBody.jade binds customTopLeftCornerLogoImageUrl and
customTopLeftCornerLogoLinkUrl separately. No settings behavior changed.
Four focused suites pass for exact values, image/link distinction,
negative French/Arabic wording and all token inventories. No live logo
settings UI test ran. Ledger 19,891; corrected 15,770, pending 133
(zgh 40), restored 4 unchanged. Height/default label and unflagged hide-logo
and header-logo-title still need repair; broader contextual review is open.


2026-09-15 — `8d9facf9a`: logo height, unflagged hide-logo and
header-logo-title French/Arabic values replaced. Height uses IRCAM 11797
taghzi height/length and the repaired top-left spatial chain; exact default
27 remains. Existing default s uwnul is reused, not independently certified
computing default terminology. Hide uses IRCAM 6267 ffr hide/conceal and
existing logo noun; return uses existing back aghul plus your boards page,
not logout or return of an object. Full spatial chain, default vocabulary
and page/board possessive phrase remain under contextual review. settingBody
binds height separately and toggles hideLogo. Four focused suites pass for
exact values, negative French/Arabic wording, default numeral and all token
inventories. No live logo UI test ran. Ledger 19,894; corrected 15,771,
pending 132 (zgh 39), restored 4 unchanged. Only height was originally
flagged; nearby two repairs add ledger records without lowering queue count.
Broader native phrase review remains open.


## Accessibility fallback and lexical scope — 2026-09-15

New source evidence affects both pending accessibility-info-not-added-yet
and accessibility-page-enabled, plus unflagged accessibility/title/content.
client/components/main/accessibility.js isAccessibilityEnabled checks only
AccessibilitySettings.enabled. accessibility.jade renders the not-added-yet
fallback whenever enabled is false/missing, without inspecting body. Thus
saved content on a disabled page can still produce a missing-information
claim; enabled with empty body instead gets the generic accessibility-content
helper fallback. Do not silently translate not-added-yet as disabled or
assume the source proves content absence. The source/UI wording conflict
needs follow-up distinct from translation repair.

settingBody.jade's checkbox edits page enabled; title/body editors are
hidden when disabled. Translation of that checkbox must describe enabling
the information page, not asserting the whole application meets an
accessibility standard or granting board access. The content viewer renders
admin-supplied page body. No source behavior changed in this review.

IRCAM dictionary entry 3966 asadf means entrance/access; public/private
access phrases do not attest digital accessibility or disability inclusion.
No accessibility-specific entry was found in the targeted cached English
text search; this is limited evidence, not proof no native term exists.
Native MediaWiki zgh cached keys yielded no accessibility-labelled message.
Web searches found French prose on accessibility on Amazigh-related sites,
not a supported zgh equivalent. Such pages cannot validate a Tamazight
translation. Next action: seek a digital-accessibility/inclusive-usability
term or clearly documented native paraphrase, then apply consistently to
all five keys while preserving enabled vs absent-information distinction.

No locale edit, runtime or live UI test performed. Ledger 19,894 and
tracked pending 132 remain unchanged; broader native review stays open.


2026-09-15 — `ac95ce3aa`: error-json-schema French replaced with your
JSON data lacking correct information in correct format. IRCAM 7505 isfki
plural isfka data; 3457 anghmis information plural inghmisn; 6406 kn means
be right/correct. Derived correct participles iknan and plural possession
ur darsn remain low confidence. Format is an explicit technical loan, not
attested localized formatting vocabulary. Complete schema phrase remains
under contextual review. trelloCreator.js wraps multiple board/action/
label/list/card/checklist validation failures with this generic key;
translation does not narrow it to JSON parse syntax alone. Four focused
suites pass for exact value, negative French/Arabic and token inventories.
No live import UI test ran. Ledger 19,895; corrected 15,772, pending 131
(zgh 38), restored 4 unchanged. CSV error remains Arabic and pending.
Source CSV branch only checks nonempty Papa.parse data before this key;
that fact does not establish validation of every CSV schema/format failure.
Preserve CSV/TSV explanations when repairing that message next.


2026-09-15 — `52b73cacc`: error-csv-schema Arabic replaced using the
repaired JSON information/format pattern. Both CSV comma-separated values
and TSV Tab-separated values are spelled out using the already repaired
import-board-instruction-csv terms. Literal CSV/TSV and borrowed Tab/format
remain. This is a data warning, not a claim every parse/schema defect is
validated by the current Papa.parse nonempty-data branch. Full passive
separation, correct participles, format term and possessive plural grammar
remain low confidence, alongside the previous CSV instruction review.
Four focused suites pass for exact warning, negative Arabic, both format
explanations and token inventories. No live CSV import UI test ran.
Ledger 19,896; corrected 15,773, pending 130 (zgh 37), restored 4 unchanged.
Broader native fluency and technical-loan localization remain open.


2026-09-15 — `a6d77ba0e`: act-newDue French replaced with a Tamazight
first due-reminder draft. IRCAM General Dictionary, cached primary PDF
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339 : entry 4289
(page 224) askti is reminder/commemoration, bound uskti; entry 3071
(page 166) amzwaru is first/group leader. Use reminder and ordinal senses,
not cognitive memory or group leadership. Existing due-date compound is
retained with bound usakud; full deadline compound and possessive grammar
remain low confidence. Preserve __list__, __card__, __board__, slash and
brackets exactly. Source server/models/activities.js selects act-newDue
when dueAt timeValue exists without timeOldValue, including initial date
assignment; it does not establish reminder delivery. Keep English source
meaning pending resolution of that discrepancy. act-withDue remains French;
its plural reminder wording needs review, and this dictionary entry gives
no plural to copy. Native MediaWiki zgh source was read on this date but
does not independently attest the complete compound. Four focused checks
pass for exact replacement, negative French/Arabic and token inventories;
no live activity UI test ran. Ledger 19,897, corrected 15,774, pending 129
(zgh 36), restored 4 unchanged. Broader language review remains open.


2026-09-15 — `06be23201`: Node_memory_usage_heap_used French replaced
with a Tamazight actual-used-memory draft. IRCAM General Dictionary primary
PDF https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339 : 12742
memory timktit/bound tmktit, 9981 ssmrs use, 12572 tidt truth/reality.
The phrase s tidt paraphrases actual; computing memory adaptation, passive
agreement and the full usage compound remain low confidence. Existing
memory-usage and external-memory labels use a different memory term
whose computer-memory usage is also documented; terminology needs review; do not call this a
completed terminology audit. Node primary documentation read 2026-09-15:
https://nodejs.org/api/process.html#processmemoryusage states heapTotal and
heapUsed refer to V8 usage, whereas RSS covers resident process memory,
including C++/JavaScript objects and code. Source server/statistics.js:87
calls process.memoryUsage; informationBody.jade:181 displays heapUsed.
The English label is broader than that field; retain its wording without
claiming whole-process memory. Four focused checks pass, including exact
replacement, negative French/Arabic and unchanged placeholder inventories.
No live diagnostic UI test ran. Ledger 19,898; corrected 15,775, pending
128 (zgh 35), restored 4 unchanged. Reminder plural remains unflagged French:
IRCAM 4289 gives no plural; 9120 sfggt and 9825 sskti attest remind verbs,
not a complete plural reminder compound. That review remains open.


2026-09-15 — memory terminology follow-up, retained values: do not replace
memory-usage or Node_memory_usage_external merely to force timktit across
all labels. The current exact ledger records retain independent Moroccan
hardware-site RAM usage of takatut, recorded on 2026-09-14, in addition to
the correctly identified Tuareg dictionary provenance. The previous note's
claim that this is only a cognitive-memory term was too strong and is
corrected above. IRCAM entry 12742 timktit means memory, but that entry
alone does not specifically prove computer-memory terminology or make
another attested computer-memory term wrong. Preserve both existing values
while comparing native computing sources and full grammar. Do not erase
the independent RAM attestation or the remaining low-confidence warning.
Node process.memoryUsage documentation was read again on 2026-09-15:
https://nodejs.org/api/process.html#processmemoryusage . The external field
is C++ object memory bound to JavaScript objects managed by V8; it is not
external-device or disk storage. This limits the meaning of the existing
external qualifier, whose Moroccan adaptation still requires review.
No locale values, original classifications or ledger counts change: 128
tracked pending, zgh 35, four restored values still await validation.
This retention is evidence-based preservation, not full fluency approval.


2026-09-15 — `ef5a6c5ba`: Node_memory_usage_rss French replaced with
Tamazight memory-usage and size wording plus the technical RSS acronym.
IRCAM General Dictionary primary PDF, cached source:
https://ircam.biblio.ma/catalogue/doc_num.php?explnum_id=339 : 12742
memory timktit/bound tmktit, 1779 aquddi size, 9981 ssmrs use. Full
computing compound remains low confidence; the acronym identifies the
exact statistic but does not complete native expansion of resident set.
A targeted lexical search found no direct resident/allocation entries;
this limited search does not prove that native computing terms are absent.
Node primary documentation read again 2026-09-15:
https://nodejs.org/api/process.html#processmemoryusage defines RSS as
resident process memory, including C++/JavaScript objects and code. Source
server/statistics.js:87-93 reads memoryUsage.rss; informationBody.jade:175
uses this translation next to that value. Do not describe it as heapUsed,
free system RAM or disk space. Four focused checks pass for exact value,
negative French/Arabic, acronym retention and full token inventories.
No live diagnostic UI test ran. Ledger 19,899; corrected 15,776, pending
127 (zgh 34), restored 4 unchanged. Native expansion and grammar remain
within the full audit scope despite this original classification change.


2026-09-15 — `7d87955de`: seven Arabic or French accessibility and UI
values replaced with Standard Moroccan Tamazight drafts. Reuse existing
access-for-all, page, enabled, information, add, label, action, file, board,
attachment, card, open and close vocabulary. Preserve the literal `.zip` and
`JSON` tokens. Full accessibility, scrollbar and window compounds remain low
confidence pending fluent review. Four focused suites pass for exact ledger
values, negative Arabic checks, literal preservation and all 234 locale
inventories. Ledger 20,059; corrected 15,853, pending 27 (zgh 26, rup 1),
restored four unchanged. No live UI test or remote write ran.


2026-09-15 — `3d79d5ca5`: four French diagnostic and repository-action
values replaced with Standard Moroccan Tamazight drafts. Reuse existing
memory usage, total size, heap, export, Excel, free disk space, sign-in,
upload and update vocabulary. Allocated-heap and software-repository compounds
remain low confidence pending fluent review. Four focused suites pass for
exact values, negative French prose after preserving `Node` and `Excel`, and
all 234 locale inventories. Ledger 20,063; corrected 15,857, pending 23
(zgh 22, rup 1), restored four unchanged. No live UI test or remote write ran.


2026-09-15 — `36c8afc8e`: repair five Arabic/French board and offline values,
and complete the correct-language Roman Tamazight Markdown-import instruction
with its omitted plain-bullet behavior. Preserve all Markdown examples,
Obsidian Kanban, URL and Google literals. Four focused suites pass; full URL
scheme, bucket and long-sentence grammar remain low confidence.

2026-09-15 — `a11978016`: replace three French global-search instructions.
Every operator placeholder, backtick, `<n>`, quoted value and `list:Blocked`
example remains exact. Four focused suites pass; explanatory operator grammar
remains low confidence pending fluent review.

2026-09-15 — `ee9228ab6`: replace all thirteen remaining French member-mapping
and board-migration values with one consistent Tamazight vocabulary. Preserve
`URL`, `ID`, `swimlaneId` and `listId` literally and keep every confirmation a
question. Four focused suites pass. Full technical compounds and longer
mapping/confirmation grammar remain low confidence. This clears the original
Tamazight audit queue; it does not certify the whole locale or earlier draft
compounds. No live UI test or remote write ran.

2026-09-15 — `780a75a2b`: replace one unflagged French due-reminder activity.
IRCAM attests `askti` (reminder); the plural adaptation `ⵉⵙⴽⵜⵉⵏ` and
complete phrase remain low confidence pending fluent review. Preserve
`__list__`, `__card__` and `__board__` exactly. Source selects `act-withDue`
after an earlier due date, and the focused runtime test verifies slot
interpolation. Ledger 21,898; original classified counts unchanged. No
live UI test or remote write ran.
