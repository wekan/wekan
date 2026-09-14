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
