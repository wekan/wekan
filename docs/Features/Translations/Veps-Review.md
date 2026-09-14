# Veps translation review

Reviewed: **2026-09-14**. Review is incomplete; this document does not
claim that the remaining Finnish-seeded strings are valid Veps.

The registry names `ve-PP` **Vepsän kelʹ**. Its legacy `ve` identifier must
not be interpreted as Venda when choosing terminology sources.

Directly inspected [native MediaWiki Veps strings](https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json):

| Meaning | Source key | Native value | Limit |
| --- | --- | --- | --- |
| Show | show | Ozuta | Direct imperative; full WeKan sentence still needs grammar review. |
| Activate | tags-activate | pane radho | Software tag action; adaptation to another control needs review. |
| Deactivate | tags-deactivate | kel'dä | Software tag action; distinguish disabling from deleting. |
| Enabled | default-skin-not-found-row-enabled | om lasktud | Direct state wording inside a skin report. |
| Disabled | default-skin-not-found-row-disabled | om kel'tüd | Direct state wording inside a skin report. |

The inspected source has no keyboard/shortcut keys. Do not substitute
its abbreviation term for Keyboard Shortcuts without evidence. Existing
`keyboard-shortcuts` is Finnish **Pikanäppäimet** and needs broader review,
even though it is outside the ten remaining original findings.

The enabled/disabled shortcut tooltips each contain both the current state
and an action that reverses it. Preserve both. The shortcut-list instruction
must open the list, not merely describe a shortcut.

Other original findings require complete native phrases: accessibility
information not added **yet**, accessibility page **enabled**, custom URL
schemes automatically clickable with **one per line**, **vertical**
scrollbars enabled, parent displayed **in the minicard**, and the sum of
fields displayed **at the top of the list**. Related Finnish vocabulary
or shared loanwords alone do not validate full Finnish-seeded values.

The advanced-filter description requires a separate full review. Preserve
all comparisons and Boolean operators, single-quote rules and escape
characters, left-to-right evaluation with parenthesized precedence, and
the exact regular-expression example. Lexical repairs cannot silently
simplify or omit these rules. Verify examples against English and the
actual filter parser, then run placeholder/example regression checks;
those checks do not establish fluency.

No locale values were changed by this review. Native terminology for the
full remaining labels, inflection and UI phrasing still need verification.

Follow-up review: **2026-09-14**. Direct JSON inspection confirms the
local advanced-filter example contains `Field1 = I\\'m`, while English
contains `Field1 == I\'m`. The locale has a single equality sign and two
literal backslashes rather than the source's comparison operator and single
escape. The first review description incorrectly called this an absent
escape; the exact decoded JSON establishes malformed operator/escaping.
Repairing only the example would not resolve the wrong-language sentence;
keep its language review open rather than count a syntax-only repair as a
completed translation. Literal apostrophe/backslash rules must remain
visible in the final native help.

Additional directly inspected native MediaWiki evidence: `apisandbox-alert-field`
uses `pöudon` for a field's value/size, `apisandbox-alert-page` uses plural
`Pöudod`, and `authmanager-create-from-login` asks to fill `nene pöudod`.
These provide native field terminology and inflected forms; they do not
prove a complete Sum Of Fields At Top Of List translation. Mathematical
Sum and the top-of-list position still need separate evidence and grammar
review. Preserve all three concepts when repairing that label.

Syntax repair applied **2026-09-14**: restored the comparison operator,
source escape example, control-character group, quoted field/value example
and parenthesized Boolean example. Regression coverage checks every canonical
English executable example and explicitly asserts the Veps language queue
remains open. Finnish prose is still awaiting full translation; this repair
is not entered as a completed wrong-language correction.

Further syntax repair **2026-09-14**: the standalone escape instruction
still had two literal backslashes despite the repaired examples. Reduced it
to the English single-backslash marker and extended regression coverage to
compare the complete backslash-run inventory, not just selected examples.
Full Finnish-prose translation remains pending.

Additional dictionary access review **2026-09-14**: the Language Bank of
Finland identifies the digitized Kettunen Veps lexicon, but its linked Kotus
endpoint returned HTTP 403 in this review; VepKar returned 502. Those results
do not validate or invalidate terminology. The metadata page describes
historical field notes, not modern computer vocabulary. Further sources
remain available for review; this is not a language-repair completion claim.
Source: https://www.kielipankki.fi/lexical-conceptual-resources/vepsa/

Expanded local-value review **2026-09-14** found additional unflagged
wrong-language values. These remain repair work; they must not be hidden
by the ten-row original-finding count.

| Key | Current local value | Problem |
| --- | --- | --- |
| subtask-inherit-parent-labels | Ḓadzhela zwiredzo zwa khadi ya mubebi | Venda wording in the Veps locale; requires the complete label-inheritance instruction. |
| accessibility | Saavutettavuus | Finnish, not Veps. |
| accessibility-title | Saavutettavuus otsikko | Finnish, not Veps. |
| accessibility-content | Saavutettavuus sisältö | Finnish, not Veps. |
| parent-card | Ylätehtäväkortti | Finnish, not Veps. |
| change-card-parent | Muuta kortin ylätehtävää | Finnish, not Veps. |
| prefix-with-parent | Etuliite ylätehtävällä | Finnish, not Veps. |
| subtext-with-parent | Aliteksti ylätehtävällä | Finnish, not Veps. |
| no-parent | Älä näytä ylätehtävää | Finnish, not Veps; preserve display-only meaning. |
| trello-parent-workspace-top | Ylä taso | Finnish, not Veps. |

The source-language key `subtask-inherit-parent-labels` is
“Inherit parent's labels”; local `labels` is `Znamad` and `card` is `Kart`.
Those two nouns do not establish a native inheritance verb or the complete
parent-card relationship phrase. No replacement is claimed by this review.
Direct MediaWiki inspection also confirms `pageinfo-title` uses `Tedod`
for information and `pageinfo-robot-index` / `pageinfo-robot-noindex` use
`Lasktud` / `Kel'tüd` for enabled and disabled indexing. These support
terminology, but do not validate the Finnish accessibility noun.

Authentication label repair **2026-09-14**, local commit `780f51f5d`:
twoFactorCode-cancel changes Hül'gäta to Heitä. Direct current MediaWiki
vep.json inspection shows Heitä in cancel, userlogin-authpopup-cancel and
resetpass-submit-cancel, as well as upload and feedback cancellation.
This agrees with WeKan's existing general cancel. All correction checks
pass. This lexical repair does not validate the Finnish-seeded prose or
live authentication flow. Server terminology and full review remain open.

Server-label review resolved **2026-09-14**, local commit `39af6aae5`:
current native MediaWiki vep.json provides more than inflected serveral.
view-pool-error uses the nominative server in a complete native sentence;
api-clientside-error-http starts with Server and describes an HTTP error.
Therefore local server = Server is a valid technical noun, retained unchanged.
Protect only ve-PP:server from placeholder filling; do not apply that conclusion
to Venda or every locale. Regression fixtures prove other locales, unrelated
keys and prose containing server remain translatable, and --apply preserves
this reviewed noun while filling ordinary prose. The completeness gate now
reports no unreviewed English placeholders; this does not resolve the ten
Finnish-prose findings or the broader unflagged/dialect/browser review.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json

Dictionary/source expansion **2026-09-14**:

- Downloaded the Veps Wiktionary-derived JSONL from
  <https://kaikki.org/dictionary/Veps/index.html> (11 MB), then inspected
  relevant senses and forms. It is a secondary extraction, not a complete
  phrase authority; individual entries still need source/form review.
- `üläh` means top/upper part; extracted singular inessive `ülähas`
  supplies a candidate top-position construction. `pä` has both head and
  top/summit senses, so its spelling alone is not an interface-location
  proof. `päl` is stationary on top of; `päle` expresses movement onto.
  Do not interchange them in the field-sum display label.
- `ühthevedota` means summarize/sum up, not verified arithmetic addition.
  It cannot establish the required mathematical sum. The Finnish `summa`
  and a corpus occurrence likewise do not establish the full Veps label.
- The primary analyzer source
  <https://github.com/giellalt/lang-vep/tree/1e03c7cdd87dea888e91e7cbf5e8f72f51c07a59>
  was downloaded and its lexicons/frequency files inspected. Frequency
  entries include forms of `vanhemb`, but frequency alone does not prove
  a software parent relationship or a complete inherited-label phrase.
  The UiT tools page states the analyzer is in development and handles
  only a handful of words: <https://giellatekno.uit.no/cgi/index.vep.eng.html>.
- VepKar's alternate lemma endpoint timed out; the dump endpoint returned
  502. Neither response validates language. Full native terminology for
  accessibility, keyboard shortcuts, inheritance and arithmetic remains
  unresolved. No locale values or classifications changed; all ten
  original Veps findings and broader unflagged repairs remain open.

Complete action-label repairs **2026-09-14**, local commit `6c30c4cfc`:
`view-all` now uses **Ozuta kaik**, `delete-all` **Heitä kaik**, and
`remove-btn` **Heitä**. Current native MediaWiki keys
`collapsible-expand-all-text`, `filehist-deleteall` and
`rcfilters-savedqueries-remove` attest these complete software labels;
initial capitalization follows the WeKan label presentation.
The notification drawer consumes View All and sidebar archive controls
consume Delete All. No active client consumer was found for Remove's stored
label. Removal remains distinct from disabling, and All remains explicit.
Focused tests plus correction, retained-review and completeness checks pass.
These three unflagged repairs do not resolve the ten original Veps findings,
unflagged longer phrases or live browser verification.

Title/page repairs **2026-09-14**, local commit `70d9264f1`:
`text-note-title` now uses **Nimi**, matching existing native `title`;
`operator-title` uses lowercase **nimi**, and `page` uses **Lehtpol'**.
Native MediaWiki `title-invalid`, `titlematches` and `newtitle` attest the
title noun; `editpage` and `deletepage` attest the page noun. The text-note
form consumes its title label. The actual search parser accepts `nimi:`
with quoted and unquoted values and rejects a syntactically valid unknown
operator. Operator lookup uses translated names, so the test does not claim
English `title:` remains an alias in Veps. A hyphenated unknown name is
ordinary text under this grammar, not an unknown parsed operator.
All seven registered tests across five affected files pass, including
exact correction/preference/token checks. These additional repairs leave
the original ten Veps findings and full phrase/browser review open.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json

More popup-title repairs **2026-09-14**, local commit `84bffe61a`:
`cardMorePopup-title` and `listMorePopup-title` now use **Enamba**,
replacing Finnish Lisää. Native MediaWiki `moredotdotdot` provides
Enamba...; the ellipsis is omitted to match English popup-title presentation.
Seven tests across four files pass, including exact correction values,
placeholder inventories and preference preservation. The ledger has 18,820
records; ten original Veps findings remain pending.

A fresh bounded native MediaWiki key search found no keyboard, shortcut,
accessibility, vertical or scroll keys establishing those full instructions.
The inspected secondary Wiktionary extraction also supplied no matching
English glosses for those concepts or arithmetic sums. General web searches
returned unrelated Finnish/medical meanings of Veps/VEPS; exclude them as
terminology evidence. These searches are not proof that native terms do not
exist. The Veps Wikipedia mathematics page opens but is not a primary
terminology authority; the inspected computer-page endpoint failed.
Further phrase, grammar and native technical-source review remains necessary.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json

Filter-heading drafts **2026-09-14**, local commit `a60cf42ad`:
`advanced-filter-label` becomes **Levenzoittud puhtastim** and
`other-filters-label` **Toižed puhtastimed**. Native MediaWiki
`rcfilters-advancedfilters` attests the plural advanced-filter heading;
WeKan's existing `filter` supplies the singular noun.
`rcfilters-other-review-tools` attests toižed (other), while
`rcfilters-filterlist-title` attests puhtastimed (filters).
Both assembled/adapted full headings remain **low confidence** for native
UI grammar. Eight registered tests across four files pass for exact values,
number distinction, placeholders and preference protection; these do not
prove fluency. The original ten Veps findings and the complete advanced-filter
instructions remain pending.

The native source also supplies `rcfilters-clear-all-filters` =
Heitä kaik puhtastimed, already matching local `shortcut-clear-filters`;
that existing complete label is retained. No activity noun was inferred
from actions alone: `actions` = Tegendad does not by itself establish the
full activity-history heading. Watchlist activity uses Rad kacundlugetišes
and describes changes; activity phrasing still needs context review.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json

Hide-empty action repair **2026-09-14**, local commit `3a10fb927`:
`filter-hide-empty` changes Finnish Näytä tyhjät listat (Show empty lists)
to **Peitä tühjad lugetišed** (Hide empty lists draft). Actual
`sidebarFilters.jade` uses this label for `js-toggle-hideEmpty-filter`;
its handler toggles `Filter.hideEmpty`, which the swimlane renderer consults.
Native MediaWiki `rcfilters-activefilters-hide` attests Peitä and
`invalid-langconvert-attrs` uses tühjad for plural empty. Existing local
`lists` = Lugetišed supplies the plural list noun.
The complete assembled phrase remains **low confidence** for object
agreement and noun spelling. Regression checks preserve hiding, emptiness
and plural lists and reject showing. All ten registered tests across five
files pass; source wiring is verified, live browser behavior is not.
This unflagged repair leaves the ten original Veps findings pending.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
