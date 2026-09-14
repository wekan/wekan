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
