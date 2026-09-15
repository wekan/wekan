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

Primary inheritance-verb evidence **2026-09-14**:
Noid's dictionary links a publicly downloadable 2007 Russian–Veps
dictionary, **Uz’ venä-vepsläine vajehnik**, Nina Zaiceva and Maria
Mullonen, Periodika, Petroskoi, published by the language/literature/history
institute of the Karelian Research Centre. Downloaded 520 pages to the
ignored temporary directory and inspected the title page and **page 253**.
A rendered page visibly confirms Russian наследовать (inherit) maps to
**jäl’gest|ada (-ab, -i)**, with the example **jäl’gestada mad**
(inherit land). The adjacent inheritance/heir entries are separate nouns.
This changes the next repair step: the inheritance verb is now supported
by a primary dictionary, rather than unresolved from English gloss searches.

The PDF's extracted Cyrillic and some Veps punctuation are corrupted.
The page was therefore rendered and viewed before accepting the lemma.
The rendering wrote the image successfully, then an unsupported cleanup
method failed; this does not invalidate the viewed page or imply a passed
rendering command. No converted dictionary text or binary is bundled.
Noid's English dictionary itself has no inheritance/keyboard/sum matches;
that bounded result is not evidence that the terms are absent from Veps.
Its vanhemb entry includes older/elder/senior/adult/parent, but does not
attest a software parent-card compound. The imperative, compound genitive,
label object and complete inheritance instruction remain under review; no
locale replacement or completed-language classification is claimed yet.

Sources: [Noid dictionary and preface](https://vepsnoid.blogspot.com/p/dictionary.html),
[linked primary dictionary](https://drive.google.com/file/d/0B92CAKqSx8Ped29wTmhIQ0NZSTg/view).

Inheritance instruction draft applied **2026-09-14**, local commit
`3ba133c10`: `subtask-inherit-parent-labels` now reads
**Jäl'gesta vanhemban kartan znamad**, replacing Venda wording.
The visually verified primary dictionary inheritance verb supports the
meaning; Noid's parent noun/genitive and existing WeKan card/label nouns
support the assembled instruction. This is **low confidence** for the
derived imperative, parent-card software metaphor, compound genitive and
label object agreement. It is not an attested complete native software phrase.

The subtask form's checkbox consumes this translation and its handler
passes `inheritLabels` during subtask creation. Label/parent concepts and
absence of the Venda wording have regression checks; all ten registered
tests across four files pass for corrections, placeholders and preference.
No live browser execution is claimed. Original ten Veps findings remain
pending; this additional repair brings the ledger to 18,824. Earlier
“no replacement claimed” notes describe the review before this dated draft.

Primary arithmetic/location evidence **2026-09-14**:
Visually inspected rendered pages **419** and **60** of the 2007
Zaiceva/Mullonen dictionary, after locating candidate entries in the
corrupted extracted text. Page 419 confirms **ližadu|z (-sen, -st, -sid)**
for Russian сложение (addition), with **luguiden ližaduz** (addition of
numbers). Its separate add verb entry provides **liža|ta (-dab, -zi)**
and imperative example **ližada lugud!** (add the numbers). Thus
arithmetic addition now has primary evidence; it must not be conflated
with a result noun Sum or the summary verb ühthevedota.

Page 60 confirms **üläh (-an, -id)** for upper part/top, with
**pertin üläh** (top of a house), and provides vertical terms
**püšti|oiged** and **vertikaline**, including a vertical-line example.
These are distinct from an imperative to enable vertical scrollbars.
The next phrase-review steps are now the arithmetic result noun, inflected
field/list/top relation, and the full scrollbar compound; copying Finnish
summa or inventing a bar term would not complete those translations.
A bounded extracted-text search did not locate a standalone Russian
sum entry; corruption and bounded coverage mean this is not absence proof.

Both rendered pages were successfully written with pdfjs and the existing
canvas dependency; the loading task's supported destroy method also
succeeded. Temporary images/PDF/text remain ignored and are not bundled.
No locale values, ledgers or completion counts changed by this review.
Source: [linked primary dictionary](https://drive.google.com/file/d/0B92CAKqSx8Ped29wTmhIQ0NZSTg/view).

Parent-card label draft **2026-09-14**, local commit `439a18989`:
`parent-card` now reads **Vanhemb kart**, replacing Finnish
Ylätehtäväkortti. Noid's dictionary attests vanhemb for parent/elder;
existing WeKan `card` supplies Kart. The opened-card parent selection
consumes the label. Software parent meaning and compound grammar remain
**low confidence**; this is not an attested native computer compound.
Eleven tests across four files pass for exact values, placeholders and
translation preference. Original ten Veps findings remain pending;
ledger 18,825. Live browser/native phrase verification remains open.
Source: https://vepsnoid.blogspot.com/p/dictionary.html

Parent display draft **2026-09-14**, local commit `e8692f14a`:
`show-parent-in-minicard` now reads **Ozuta vanhemb kart minikartal:**.
Native MediaWiki Show and the existing parent-card noun support terminology;
minikartal is a derived location form. Full compound/object/location grammar
remains **low confidence**, requiring native review. Display, relationship,
location and colon are preserved. Twelve tests across four files pass for
exact values, placeholders and preference. Original pending 232, Veps 9;
ledger 18,826. Changed classification does not establish native fluency
or live browser verification. Earlier counts describe prior review stages.

Parent-control drafts **2026-09-14**, local commit `b479af98f`:
`change-card-parent` now reads **Vajehta kartan vanhemb**, and
`no-parent` **Peitä vanhemb kart**, replacing Finnish. Native MediaWiki
edit/protect_change and hidetoc attest change/hide; existing card and reviewed
parent nouns support terminology. Full genitive/object grammar and parent-card
software metaphor remain **low confidence**. The opened-card parent form
uses Change; sidebar no-parent changes display, not the relationship.
Thirteen tests across four files pass for exact values, action distinction,
placeholders and preference. Original pending remains 232; ledger 18,828.
No live browser/native fluency claim.

Card-display drafts **2026-09-14**, local commit `3b12f68c7`:
`show-on-card` becomes **Ozuta kartal** and `show-on-minicard`
**Ozuta minikartal**, replacing Finnish. Native MediaWiki Show and
existing Kart support terminology; derived location forms and software
phrasing remain **low confidence**. Card/minicard targets stay distinct.
Fourteen tests across four files pass for exact values, placeholders and
preference. Ledger 18,830; original pending 232 unchanged. Native/browser
verification remains open. A bounded primary dictionary search did not
establish keyboard/shortcut terminology; it is not absence proof.


Link action repair **2026-09-14**, local commit `3f8363836`:
Unflagged Veps `link` changes Finnish **Linkitä** to **Ližada tarkenduz**.
Native MediaWiki `create-local` supplies Ližada (add), while `nlinks`
supplies singular tarkenduz (link). Actual listBody.jade and listBody.js
use this action to create linked card/board relations. A bare noun would
lose the action; the draft keeps both addition and relation concepts.
Low confidence: assembled imperative/object grammar and relation terminology
need native review. This is a direct draft, not a claimed human translation.
All four affected suites pass, including tokens, key order and newer
translation preference. Ledger 18,832; pending 232/restored 4 unchanged.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Further evidence: `http-invalid-scheme` supplies native URL-scheme wording
and `lineno` supplies rivi (line), but those components alone do not verify
the full automatic-clickability and one-scheme-per-line instructions.


Link wording revision **2026-09-14**, local commit `2dbc6ba3a`:
Replace the assembled **Ližada tarkenduz** draft with **Ühtenzoita**.
Primary native MediaWiki `linkaccounts-submit` and `linkaccounts` both
use **Ühtenzoita lehtpoled** for linking existing accounts; this supplies
the actual linking imperative, rather than separate add/link components.
WeKan listBody creates linked-card/board relations, not a deletion or merge.
Ledger preserves original Finnish Linkitä and both revision reasons.
The assembled imperative/object uncertainty is superseded by direct native
verb evidence; software-specific card/board terminology still merits review.
Four affected suites pass; ledger 18,832 and original pending 232/restored 4
unchanged. No new human translation provenance is claimed.
Source: https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json

## Numerical sum evidence boundary — 2026-09-15

The remaining Finnish showSum-field-on-list value was rechecked against
the full cached Zaiceva/Mullonen 2007 Russian–Veps dictionary. Page 419
explicitly gives numerical addition as luguiden ližaduz and the imperative
add the numbers as ližada lugud. This is direct numerical-operation
evidence, but does not establish a noun meaning the resulting total.
The separate Wiktionary candidate ühthevedota is glossed summarize/sum up,
not expressly arithmetic, and its cached entry carries an incorrect-
language-header category. Its generated imperative must not be treated
as primary evidence for this UI label.

Source context: sidebarCustomFields.jade lines 56 and 61 render the
setting; listHeader.js computes number-field statistics and a numeric sum
badge, while date fields use a range rather than summing dates. A prose
summary verb would blur that distinction. The next repair therefore needs
a numerical-total noun or a complete explicitly numerical formulation.
No translation or acceptance changed. Pending 204, including nine Veps
findings; broader prior drafts and native grammar remain open.


## Keyboard-shortcut repair scope — 2026-09-15

Live queue still has nine Veps findings, including both keyboard toggle
messages and shortcut-show-shortcuts. An additional unflagged Finnish value,
keyboard-shortcuts = Pikanäppäimet, appears in sidebar.jade:16-18 and
main/keyboardShortcuts.jade:4. Review all four together; fixing only the
flagged action leaves the actual popup title in Finnish. The action is
bound to literal ? in client/lib/keyboard.js:384-385; do not translate or
replace that key binding. Sidebar.js:364-369 distinguishes opening the
shortcuts route from toggling the user's keyboard-shortcut setting.
The two tooltip messages describe the current state followed by the
opposite click action. Keep enabled/disable and disabled/enable pairs
correct, rather than translating both as the same action.

Primary native software source read 2026-09-15:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
provides Ozuta for show and peitä for hide. Its checked key names matching
keyboard/shortcut/accesskey supply no dedicated keyboard-shortcut phrase.
The cached Russian–Veps dictionary text search for клавиатур, клавиш and
комбинац also produced no entry. These limited searches do not prove the
term is absent from Veps or from the dictionary's rendered pages. Seek
native keyboard/key-combination terminology and complete object grammar
before writing the four coordinated drafts. General list vocabulary alone
does not resolve what this specific list contains. No locale edit, ledger
or original queue classification change; all nine and broader review remain
open. This extends the repair scope to the unflagged Finnish popup title.


## Dictionary search correction — 2026-09-15

The earlier normal-Cyrillic search is not valid negative lexical evidence:
russian-veps-pages.jsonl stores the PDF's Russian text as corrupted legacy
font characters, for example the Russian keyboard/key prefix would appear
as ŒºàâŁ rather than клави. Inspect page 3 for the corrupted title and page
419 for corrupted Russian headwords next to readable Veps forms. A normal
Cyrillic substring search therefore cannot establish missing entries.
The previous no-entry statement is superseded by this encoding diagnosis.
Searching legacy glyph strings located a button entry on PDF page 189
(ŒíîïŒà) with fastening-related kingitim/plikkutim vocabulary. Those
snippets do not attest a computer keyboard key: render and read the entire
entry before using any sense. A physical tack/fastener is not automatically
a keyboard button. Search snippets containing money sum also locate page
260, but they do not provide an arithmetic resulting-total noun. These
are page locators, not accepted translations or trustworthy automatic
Cyrillic decoding. Next action is visual dictionary lookup, supplemented
by primary native software/corpus evidence for computing terminology.
No locale edit or queue acceptance change; nine Veps findings and the
unflagged Finnish keyboard-shortcuts title remain open. Audit verification
passed; overall original pending remains 127, restored 4 unchanged.


## Visual button-entry verification — 2026-09-15

Directly inspected rendered Russian–Veps dictionary PDF page 189,
button-189.png, rather than relying on corrupted extracted headwords.
The complete кнопка entry gives (1) для прикалывания, kingitim
(-men, -nt, -mid), with pinning a schedule to a board; (2) застёжка,
plikkutim (-men, -nt, -mid), with fastening a coat. Neither sense is a
keyboard key or computer button. Exclude both as evidence for the four
keyboard-shortcut repairs. The neighbouring ключ entry is a door-opening
key, avadim, so its metaphor must not be treated as an attested keyboard
key either. This settles those candidate senses; it does not prove that
Veps lacks keyboard terminology. The rendered alphabetical page goes from
preceding kl- words into key-related entries without an independent
клавиатура headword on this page. Continue with native computing corpus
lookup or an explicitly documented direct paraphrase, preserving current
state/opposite click action and the literal ? key binding.
No locale edits or classification changes. Overall tracked pending 127,
including nine Veps findings and additional unflagged title review.


2026-09-15 — `f10fe2fa5`: automatic-linked-url-schemes Finnish replaced
with a direct Veps draft. Native primary software source:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
http-invalid-scheme gives URL scheme wording; querypage-updates-periodical
provides avtomatižesti; filehist-help uses paina for clicking a date/time;
watchlistedit-raw-explain gives one item per line (rives). Existing
custom-fields supplies Kävutajan märitud (user-defined). Preserve user-defined
URL schemes, automatic clickability and one scheme per line. Complete
assembled relative/object grammar and the derived singular shem remain
low confidence. These component attestations do not certify the complete
instruction. The dictionary search diagnosis and shortcut terminology
remain open; the corpus website returned an error this lookup, not proof
of absent vocabulary. Source settingBody.jade:419-421 displays this label
beside the automaticLinkedUrlSchemes textarea; settingBody.js:1011 binds
the saved setting. Four focused test files pass (16 checks), including
negative Finnish and exact instruction, full token inventories and key
order. No live settings UI test ran. Ledger 19,900; corrected 15,777,
pending 126 (Veps 8), restored 4 unchanged. Unflagged shortcut title and
all prior low-confidence wording stay within the full review scope.


2026-09-15 — `29bf7aa22`: unflagged rules = Säännöt replaced with
Sändod. Primary native MediaWiki policy-url is Project:Sändod, read today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Existing r-rule = Sänd supplies consistent singular. Four focused files
pass (17 checks), including exact native plural, negative Finnish and
placeholder/key-order checks. No live rules UI test ran. Ledger 19,901;
original tracked pending stays 126 (Veps 8), restored 4 unchanged.

Additional live unflagged wrong-language findings require direct repairs:
r-toggle-rule-enabled = Shumisani kana litshani mulayo hoyu;
r-rule-disabled = A i shumiswi;
twoFactorAuth-enable = Vulani u Ṱhogomela nga Zwibveledzwa Zwivhili;
list-sync-enabled = U vhambadzanya ho vulwa.
These Tshivenda values are not protected Veps human translations. Also
review twoFactorAuth-enabled, which contains the same foreign wording.
Do not infer completion from the eight-row Veps original queue. The rule
button rulesList.jade:37 uses r-toggle-rule-enabled, so its tooltip must
retain both enabling and disabling rather than become a rules heading.
Scrollbar native terminology was not established by the checked MediaWiki
key-name search; the original Finnish scrollbar label remains open.


2026-09-15 — `3658f1755`: r-rule-disabled and r-toggle-rule-enabled
Tshivenda replaced with direct Veps drafts. Preserve existing r-rule-enabled
= Päl. Native primary MediaWiki source read today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
specialmute-label-mute-email uses Kel'dä for disabling/muting mail;
authmanager-autocreate-exception uses kel'düd for a disabled automatic
account. Existing custom-head-tags-enabled supplies Pane päle (turn on).
The toggle combines both actions with libo (or), nece sänd (this rule)
and sidä (it). Full assembled imperative/object grammar and suitability
of the prohibition-based disable verb for rule activation remain low
confidence; these are drafts, not claimed human translations. Source
rulesList.jade:37-43 has separate enabled/disabled labels on a toggle
button with the dual-action tooltip, so do not replace the tooltip with
a one-way action or a bare rules noun. Four focused files pass (18 checks),
including both replacements, negative Tshivenda, distinct states, retained
existing enabled value and full placeholder inventories/key order.
No live rules UI test ran. Ledger 19,903; original pending 126 (Veps 8),
restored 4 unchanged. Previous finding list's two rule keys are now repaired;
the twoFactorAuth-enable/enabled and list-sync-enabled wrong-language
values still need repairs. Original eight-row queue does not cover these
additional findings or full prior low-confidence wording.


2026-09-15 — `93a48d724`: five unflagged list synchronization values
repaired: list-sync-menu, list-sync-now, list-sync-last-error,
list-sync-project-key-placeholder and list-sync-credential-placeholder.
Reuse existing org/team synchronization imperative Sinhronirui, Peitsana
and Viga. Native primary MediaWiki source read today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
provides nügüd' (now), jäl'gmäine in latest-visit wording, and libo (or).
Preserve exact PROJECT, owner/repo and API token examples, changing only
the connective and password prose. Sync now remains distinct from Sync.
Full assembled terminology and grammar remain under review; these are
direct drafts, not asserted human translations. Source listHeader.jade
renders the labels/placeholder inputs and listHeader.js handles the popup;
no behavior or credentials were changed. Four focused files pass (19
checks), including exact replacements, negative Tshivenda, distinct actions
and complete placeholder/key-order inventories. No live sync UI test ran.
Ledger 19,908; original queue stays 126 (Veps 8), restored 4 unchanged.

The remaining synchronization block includes wrong-language description,
source, credentials, enabled state, last-sync state, never, pending,
success/failure and stop messages. Repair the whole block, including exact
%s in list-sync-now-error and the 15-minute/immediate-check distinction
in list-sync-description. Do not treat these five changes as completion of
the synchronization popup. Previously noted list-sync-enabled remains open.


2026-09-15 — `c379de7d7`: six unflagged synchronization values repaired:
list-sync-enabled, list-sync-last-synced, list-sync-now-pending,
list-sync-now-success, list-sync-now-error and list-sync-clear. Preserve
exact %s once in the error message, ellipsis for pending, success distinct
from failure, and stop distinct from initiating a sync. Existing Sinhronirui
is the base for the direct derived noun Sinhronirund; full derivation and
case morphology (including genitive Sinhronirundan and stop object) remain
low confidence and require native review. Native MediaWiki actioncomplete
supplies Tegend om loptud, createacct-loginerror supplies hüvin, and
updatedmarker supplies latest wording. Primary software source read today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Existing stop Seižuta and enabled Päl are reused. Component evidence does
not independently attest the full synchronization clauses. Source popup
listHeader.jade displays the enabled checkbox and last-sync state and
listHeader.js handles sync controls. No implementation behavior changed.
Four focused files pass (20 checks), including distinct results, negative
Tshivenda, exact replacement and full placeholders/key order. No live sync
UI test ran. Ledger 19,914; original pending stays 126 (Veps 8), restored
4 unchanged. Previously noted list-sync-enabled is now repaired, but its
full native grammar remains open. Remaining block: description, source
labels, project-key label, credential labels/statuses, optional username
and never. Keep 15-minute background checks distinct from immediate Sync
now, and preserve all literal examples. Broader mixed-language and prior
low-confidence review remains in scope.


2026-09-15 — `0ca3422a4`: list-sync-source-type = Tsimo replaced with
Lähte. Primary native MediaWiki version-libraries-source and tags-source-header
both directly give Lähte for source; read 2026-09-15:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Do not translate the source selector as not synced or failed synchronization.
Four focused files pass (21 checks), including exact noun, negative old
value, distinct source/state and full token/key-order inventories. No live
popup UI test ran. Ledger 19,915; original pending remains 126 (Veps 8),
restored 4 unchanged. Credential source gives Lehtpolen tedod for account
credentials, but that full account phrase is not automatically suitable
for an external tracker's API token/password setting. Additional unflagged
optional = valinnainen is Finnish and needs a coordinated repair with
list-sync-username-placeholder. Keep optionality explicit; removing its
qualifier would alter the field's meaning. Not-synced and never clauses,
credential statuses and full synchronization instructions remain open.


2026-09-15 — `5d0583ef5`: optional = valinnainen and
list-sync-username-placeholder wrong-language values replaced with direct
Veps not-required paraphrases. Keep the qualification explicit: Kävutajan
nimi alone would lose optionality. Existing username supplies Kävutajan
nimi. Native primary MediaWiki htmlform-required says Nece znamoičend om
tarbhaine; native negative construction ei ole gives the assembled not-required
paraphrase. Read 2026-09-15:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Full contextual negative-adjective grammar remains low confidence; the
complete optional-username phrase is not independently attested by this
component evidence. Four focused files pass (22 checks), including exact
values, negative Finnish/Tshivenda, retained username and explicit optional
qualification, plus all placeholder/key-order inventories. No live field
UI test ran. Ledger 19,917; original pending remains 126 (Veps 8), restored
4 unchanged. These two additional wrong-language findings are repaired,
but broad wording validation stays open. Never and not-synced must remain
distinct from failed sync; no unsupported translation for those was added.
The checked MediaWiki key-name search did not provide never; this limited
search does not establish that native wording is absent. Credentials and
15-minute/immediate-check instructions still require complete repairs.


2026-09-15 — `c117936ed`: list-sync-credential and its set/unset status
messages replaced with direct Veps API-token/password paraphrases. The
existing input placeholder states API token / password; preserve those
actual credential options rather than assert that an account password is
required. Existing Peitsana supplies password. Native primary MediaWiki
source read today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
supplies märitud/set-defined wording, völ/yet and ei ole/is not. The full
assembled status grammar and explicit credential paraphrase remain low
confidence; these components do not certify the complete sentences. Set
and not-set-yet states remain distinct. Neither message asserts verified
credentials, successful authentication or a completed synchronization.
Four focused files pass (23 checks), including exact replacements,
negative Tshivenda, distinct states, not-yet qualification and complete
placeholder/key-order inventories. No live credential UI test ran.
Ledger 19,920; original pending 126 (Veps 8), restored 4 unchanged.
Remaining sync block includes description, not-synced, project-key label
and never. The description must preserve external tracker, background
15-minute checks and immediate Sync now. Other wrong-language 2FA values
and prior low-confidence complete grammar remain within the audit scope.


2026-09-15 — `81c17c196`: list-sync-last-synced-never wrong-language
value replaced with Nikonz. Primary ELDIA Veps case-specific report, printed
page 89/PDF page 97 (zero-based P96 in web extraction), directly pairs
standalone nikonz with Never in a native interview response. Read today:
https://phaidra.univie.ac.at/detail/o:315545.pdf
This supplies the actual adverb and standalone response, not a generated
form. Preserve never-synced as distinct from a failed synchronization.
Four focused files pass (24 checks), including exact adverb, negative
Tshivenda and full placeholder/key-order inventories. No live sync UI test
ran. Ledger 19,921; original pending 126 (Veps 8), restored 4 unchanged.
Never candidate lookup is resolved for this label. Remaining block includes
not-synced, project-key label and the complete 15-minute background versus
immediate-check description. Native MediaWiki nstab-project and existing
gcs-project-id support Projektan, but door-key avadim does not independently
attest a software project key. Do not mechanically replace key with ID
without reviewing the accepted tracker identifier. Full native grammar
and other additional wrong-language values remain within the audit scope.


2026-09-15 — `b30fa05a9`: list-sync-source-none replaces Tshivenda with
Sinhronirund ei ole päl. The empty source option in listHeader.jade selects
no synchronization source, rather than reporting a failed or never-run job.
This inactive-state paraphrase uses existing Veps enabled vocabulary päl
and native MediaWiki ei ole negation, rechecked today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
The synchronization noun was previously derived from local Sinhronirui;
its derivation and complete sentence grammar remain low confidence. This
is a direct draft, not an independently attested complete native phrase.
Four focused files pass (25 checks), including negative wrong-language,
distinct enabled/error/never states and the empty-option template binding.
No live UI test ran. Ledger 19,922; original pending 126, restored 4.
Project-key terminology, full background/immediate synchronization
instructions and broader prior low-confidence review remain open.


2026-09-15 — `25e6eefba`: list-sync-description wrong-language Tshivenda
replaced with a direct Veps draft. Preserve all source clauses: list updated
from an external tracker, background job, every 15 minutes, and immediate
manual checking using the actual Sync now label. server/listSync.js schedules
`every 15 minutes`. Native MediaWiki updatewatchlist uses Udišta and
watchlistedit-normal-check-all uses Tarkišta; read again today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Existing local lugetiž/minutad support list/minute vocabulary. Complete
sentence is not independently attested. External-tracker inflection,
background computing loan Fonan rad, interval construction and the
without-waiting immediate-action paraphrase remain LOW CONFIDENCE.
Four focused files pass (26 checks): wrong-language rejection, interval,
manual-label agreement, code scheduling and complete token/key inventories.
No live sync UI test ran. Ledger 19,923; original pending 126/restored 4.
Project-key label still requires appropriate multi-tracker terminology;
full prior low-confidence and unflagged review remain within scope.


2026-09-15 — `29f93a888`: list-sync-project-key wrong-language Tshivenda
replaced with Projektan kod / ID / owner/repo. Read the actual fetchers:
Jira interpolates projectKey in JQL; GitHub/Gitea use owner/repo paths;
GitLab accepts a project ID or encoded path. Thus an ID-only label would
omit valid inputs. Keep code and the two literal alternatives explicit.
Native MediaWiki nstab-project attests Projektan, and confirmemail_invalid_format
attests kod for a validation code, independently of program-source code.
Source read again today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
This is a project-code paraphrase, not an attested native software-key term.
Full multi-tracker terminology remains LOW CONFIDENCE. Door-key avadim
is not used as software-key evidence. Preserve PROJECT/owner/repo examples.
Four focused files pass (27 checks), including wrong-language rejection,
identifier alternatives and actual fetcher use, plus full token inventories.
No live synchronization UI ran. Ledger 19,924; pending 126/restored 4.
The previously identified wrong-language sync block now has Veps drafts;
this does not resolve their complete grammar or the wider flagged/unflagged
review, including two-factor controls and keyboard-shortcut wording.


2026-09-15 — `7deff5697`: four unflagged Tshivenda values repaired:
twoFactorAuthPopup-title, twoFactorAuth-enabled, twoFactorAuth-disable,
and twoFactorAuth-enable. Direct Veps drafts retain two factors, opposite
actions, and enabled status specifically for the user's account. Local
org/team-sync-members-from-auth uses autentifikacijan; create-account uses
akkaunt. Native MediaWiki mute-email uses Kel'dä and existing rule-toggle
uses Pane ... päle. Source rechecked today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Kahen faktoran autentifikacii is a derived computing compound, not a fully
attested native phrase. Compound, loan form and account-case grammar remain
LOW CONFIDENCE. Four focused files pass (28 checks), including opposite
actions, account qualifier, wrong-language rejection and template binding;
full token inventories/key order pass. No live authentication UI ran.
Ledger 19,928; original pending 126/restored 4 unchanged. Remaining
wrong-language two-factor explanation, QR/six-digit instructions, manual
entry and confirm-and-enable require repair. Broader review stays open.


2026-09-15 — `f9d9c454d`: seven unflagged Tshivenda setup/login values
repaired: twoFactorAuth-explanation, scan-instructions, manual-entry,
confirm, and twoFactorCode-prompt, submit, invalid. Preserve added account
protection, enabled-state condition, code from authenticator at each login,
QR scan with Google Authenticator/Authy examples, subsequent six-digit
confirmation, manual-entry alternative, confirm-and-enable and error retry.
Existing local account/login wording and native MediaWiki kirjuta käzil,
vahvištoita, kod, kaikuččen kerdan, and programmas support basic vocabulary.
Primary source rechecked today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Complete computing instructions are direct drafts, not attested whole
native sentences. Ližakaičuz, scanner loan, six-digit compound, case forms
and full grammar remain LOW CONFIDENCE and require further review.
Four focused files pass (29 checks), including wrong-language rejection,
all setup/login qualifiers, trailing manual-entry space and token inventories.
No live authentication UI ran. Ledger 19,935; pending 126/restored 4.
Previously found wrong-language two-factor block now has Veps drafts;
that is not proof of complete native fluency. Broader review remains open.


2026-09-15 — `e722a6c17`: overlooked listSyncPopup-title Tshivenda
replaced with Lugetižen sinhronirund (derived noun/case LOW CONFIDENCE).
Project label improved to Projektan avadim / ID / owner/repo. IMPORTANT
new primary evidence corrects the previous incomplete lexical review:
MediaWiki pageinfo-default-sort = Sanumata sortiruin avadim, and
 duplicate-defaultsort uses avadim for a sort key. Thus avadim has actual
software-key usage independent of the visually reviewed door-key entry.
Source read and searched today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
The door-key dictionary alone still does not prove computing usage, but
this native software translation supplies the missing analogy. Project-key
compound is not independently attested; full terminology stays low confidence.
Retain accepted ID/owner/repo alternatives and original ledger before value.
Four focused files pass (30 checks), including title wrong-language rejection,
identifier alternatives and full token/key-order checks. No live sync UI ran.
Ledger 19,936; pending 126/restored 4. Wider native review remains open.


2026-09-15 — `4b2009229`: replace Tshivenda sort-by-votes with Sortirui
äniden mödhe, Finnish voting with Änestamine, and Tshivenda event-detail
with Ližatedod. Existing card voting keys attest änestamine; poker-result-votes
has Äned. Native MediaWiki sort-descending/sort-ascending use Sortirui ...
mödhe and block-details uses Saudatusen ližatedod for details information.
Primary native source read today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
The vote genitive and full sorting-context terminology remain low confidence;
details uses an attested additional-information paraphrase. Do not conflate
vote sorting with casting votes or event detail with severity.
Four focused files pass (31 checks), including negative foreign-language
checks, distinct sorting/detail meanings and all token/key-order inventories.
No live voting/event UI ran. Ledger 19,939; pending 126/restored 4 unchanged.
Inspection additionally finds wrong-language backup-scope-instance/description,
problem-summary/progress prose, CPU-current, severity, sum/date-range fields
and chart-forecast messages. Native voting supporters/opponents and for/against
labels also need vocabulary review; existing Finnish text is not protected
as Veps. These are within the full unflagged scope, not excluded by queue count.


2026-09-15 — `f5d72bae8`: five unflagged Tshivenda values replaced:
repair-broken-cards, repairing, repair-broken-cards-done,
repair-broken-cards-done-unfixable and restore-list-swimlanes-done.
Direct Veps drafts use existing Kohenda repair, Endišta restore, kart/list
and board vocabulary. Native MediaWiki supports ei sa negative possibility
and avtomatižesti automatic wording; source rechecked today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Read problemsSummary.js: fixed/unfixable and restored/remaining are distinct
result counters. Missing-board cards cannot be placed automatically; lists
whose original swimlane is unknown/missing cannot be restored. Preserve
__fixed__, __unfixable__, __restored__, __remaining__ exactly, not just digits.
Full count agreement, passive forms, cases and broken-card terminology
remain LOW CONFIDENCE; existing local vocabulary is not full phrase proof.
Four focused files pass (32 checks), including exact token inventories,
unresolved/automatic-limit clauses and actual result bindings. No live
repair UI ran. Ledger 19,944; pending 126/restored 4 unchanged. Remaining
problem summary/progress, backup/forecast and full earlier uncertain wording
remain within the full repair scope.


2026-09-15 — `201f8d0a4`: three wrong-language chart-forecast messages
replaced with direct Veps drafts. Read boardCharts.js forecast helper:
remaining zero selects completed branch, absent projectedDate selects
no-velocity branch, otherwise remaining/averagePerBucket/projectedDate
populate the conditional forecast. Preserve __remaining__, __average__,
__date__ exactly, weekly unit, recent-time qualifier and conditional outcome.
Existing local lopmatoi/loptud, Nedal, Päivmär and Arvosteldud wording
supply base vocabulary. Native MediaWiki jäl'gmäine/latest and completion
vocabulary were rechecked today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Complete projection clauses, recent-time paraphrase, deadline case and
count agreement remain LOW CONFIDENCE. No fully attested sentence claim.
Four focused files pass (33 checks), including negative wrong-language,
three distinct outcomes, actual forecast bindings and all token inventories.
No live chart UI ran. Ledger 19,947; pending 126/restored 4 unchanged.
Remaining backup, problems, CPU/severity, number/date-range wording and
broader prior uncertain review remain within the full repair scope.


2026-09-15 — `e8826e71a`: loading, problems-in-progress-help and
problems-none-in-progress wrong-language values replaced with Veps drafts.
Read problemsSummary.jade: statusOverview.anyInProgress chooses active
message and fa-spinner items; else chooses no-running-work message.
Preserve possible slow logins, login-required message or loading indicator,
and duration until work finishes and CPU falls. Existing migracii/kohenda,
system-login and ladind vocabulary supply bases; native MediaWiki varasta,
libo, nügüd' and completion words rechecked today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Loading-indicator paraphrase and CPU load loan, migration/repair inflections
and complete warning grammar remain LOW CONFIDENCE. The prose mentions
translated conceptual error messages; exact runtime-message agreement
requires further review. Four focused files pass (34 checks), including
foreign-language rejection, temporary condition and active/inactive contrast,
plus full token/key inventories. No live status/login UI ran.
Ledger 19,950; pending 126/restored 4 unchanged. Summary acknowledgment,
backup scope, CPU labels and wider earlier uncertain review stay in scope.


2026-09-15 — `9e0680331`: cpu-usage-current, cpu-usage and
cpu-load-average wrong-language values replaced with Veps drafts.
Reuse memory-usage Kävutand and OS_Loadavg keskmäine radmär. Native
MediaWiki poolcounter-usage-error attests Kävutamižen and nügüd' current
wording independently; source rechecked today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Read adminProblems.jade: current percent, core count and loadAverage are
separate displays. CPU usage must not be equated with average system load.
Full acronym case and computing load compound remain LOW CONFIDENCE;
existing local terminology is consistency evidence, not native fluency proof.
Four focused files pass (35 checks), including foreign-language rejection,
current qualifier and load/usage distinction plus all token/key inventories.
No live CPU UI ran. Ledger 19,953; pending 126/restored 4 unchanged.
CPU-cores/suffix still need native computing-core evidence. Do not use
MediaWiki Südäinviga/internal-error to claim processor-core attestation.
Backup/progress acknowledgment and wider prior uncertain review remain open.


2026-09-15 — `bc8988c9d`: five unflagged Tshivenda values replaced:
problems, new-problems, no-new-problems, acknowledge, problems-summary-help.
Read problemsSummary.js checked-stream collection and acknowledgeEventLog
call, and Jade checkbox/button bindings. Preserve selecting reviewed areas
then resetting their new-problem count; acknowledgment is not a repair.
Native MediaWiki sessionfailure/upload-misc-error-text attests problem;
local confirm supplies Vahvištoita. Native paina, znamoiče and lugumär
support click/mark/count vocabulary; source read today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Problem plural/cases, reviewed-area clause, zero-reset construction and
confirm-based acknowledgment paraphrase remain LOW CONFIDENCE. No whole
native phrase attestation claim. Four focused files pass (36 checks):
foreign-language rejection, button-label agreement, count-reset meaning,
checked-stream code and complete token/key-order inventories.
No live acknowledgment UI ran. Ledger 19,958; pending 126/restored 4.
Backup scope, CPU-core/severity, number/date-range and broader prior
uncertain wording remain within the full local translation repair scope.


2026-09-15 — `cfed82e70`: backup-scope, backup-scope-instance and
backup-scope-description wrong-language values replaced with Veps drafts.
Read attachments Jade scope options/helper and server/methods/backup.js
organization context/comments. Preserve whole instance or one organization,
all its board content including attachments, excluded shared user accounts
and instance settings, and restores restricted to owned boards.
Existing local Varmkopii, organizacii, tartutadud failad, akkaunt, valičused
and Endišta supply bases. Native MediaWiki libo/vaiše and system vocabulary
were rechecked today:
https://raw.githubusercontent.com/wikimedia/mediawiki/master/languages/i18n/vep.json
Kaik WeKan-sistem paraphrases the whole application instance, not a physical
machine backup. Scope-boundaries noun, whole-instance paraphrase, ownership
construction and complete grammar remain LOW CONFIDENCE. No full native
sentence attestation claim. Four focused files pass (37 checks), including
foreign-language rejection, attachment/shared-data clauses and restore
restriction plus complete token/key inventories. No live backup UI ran.
Ledger 19,961; original pending 126/restored 4 unchanged. CPU-core/severity,
number/date-range and full prior uncertain review remain in scope.


2026-09-15 — event-severity terminology review (no locale changes).
Read adminProblems.js column: r.severity is distinct from category/action/
detail. models/eventLog.js schema documents info|low|medium|high|critical.
Severity must not become generic importance, seriousness of demeanor,
or physical weight. Cached lexicon candidates were checked by individual
sense: tärged important; selʹged sober (serious); jüged heavy; kova harsh,
severe. Opened current Wiktionary Veps section, not Finnish homonym:
https://en.wiktionary.org/wiki/kova#Veps
It includes harsh/severe and references Zajceva/Mullonen 2007 entries
жёсткий, жестокий, ожесточённый, сильный, суровый, твёрдый, чёрствый.
Its adjective is real evidence; it does not attest a noun for event
severity. Do not invent Kovuz or import Finnish vakavuus without native
noun/context evidence. Next lexical action: inspect the referenced native
dictionary severe/harsh entries and derived nouns or corpus severity use.
This review rules out earlier tempting importance/sober substitutions
and narrows the search to the appropriate severe sense. event-severity
Tshivenda remains unrepaired and explicitly in scope. Audit ledger and
original queue counts unchanged: 19,961 records, pending 126/restored 4.
No live UI or translation validation test is claimed for this research.


2026-09-15 — rendered primary dictionary follow-up for event severity.
Cached russian-veps-pages.jsonl search located kovuz’ on page 442.
Rendered PDF page index 441 and visually inspected the actual page:
.tools/tmp/veps-native-source/hardness-442.png (local evidence cache).
The entry твёрдость reads kovuz’ (-den, -t), with soil hardness ma kovuz’
and firmness of judgments mel’pidoiden kovuz’. Thus the noun is attested,
including its terminal apostrophe and oblique stem. Correct the earlier
research uncertainty: noun existence is resolved, not an invented Kovuz.
Primary Zajceva/Mullonen 2007 Russian–Veps dictionary linked from:
https://en.wiktionary.org/wiki/kova#Veps
The actual scanned entry is hardness/firmness, not security-event severity.
Its figurative example establishes nonphysical firmness, still not a
severity-level label for info/low/medium/high/critical. Do not broaden
this evidence into a claim that the technical label is validated.
Next action is to compare level/degree constructions or native event-risk
terminology; spelling uncertainty alone no longer blocks that comparison.
No locale edit; event-severity remains wrong-language and within scope.
Ledger 19,961, original pending 126/restored 4 unchanged. Full translation
review remains active. Audit-progress consistency check passes; no live UI.


2026-09-15 — rendered level/degree evidence for Veps event-severity.
Searched cached primary dictionary extraction with its legacy Cyrillic
encoding, then rendered and visually read actual printed page 475,
PDF index 474: .tools/tmp/veps-native-source/level-475.png.
уровень sense 1 (ступень развития) gives korktuz’ (-den, -t, -zid),
with rahvahan hüvinvoindan korktuz’ (population well-being level).
Sense 2 gives pind (-an, -oid) for water/sea level. Thus abstract level
has independent native noun evidence; do not substitute the physical
surface-level noun pind. This changes the next candidate assessment:
compare a severity-level construction using korktuz’ with the attested
kovuz’ stem kovuden, rather than inventing a generic Finnish taso.
A Kovuden korktuz’ candidate is not yet independently attested technical
usage and must not be described as a confirmed event-severity term.
Broad web degree searches mostly returned English definitions or Estonian
linguistics, not native Veps vocabulary, and are excluded as evidence.
Primary dictionary source linked by:
https://en.wiktionary.org/wiki/kova#Veps
Event schema info|low|medium|high|critical remains the actual semantic
requirement. No locale edit or count change: ledger 19,961, original
pending 126/restored 4. Severity remains wrong-language and in scope.
Audit consistency check passes; no live UI ran.


2026-09-15 — `91d0cbf5e`: event-severity Tshivenda replaced with
Kovuden korktuz’ as a direct Veps severity-level draft. Rendered primary
dictionary page 442 supplies kovuz’ (-den), hardness/firmness including
judgments; page 475 supplies abstract korktuz’ level distinct from pind
water level. Native adjective kova has harsh/severe sense. These support
morphological bases, not independently attested computing usage:
https://en.wiktionary.org/wiki/kova#Veps
The harshness/firmness-to-event-severity analogy and whole compound remain
LOW CONFIDENCE and require further lexical/context review. Do not certify
this as native standard terminology or equate it with risk/importance.
Actual adminProblems severity column and eventLog levels remain unchanged.
Four focused files pass (38 checks): foreign-text rejection, distinct
severity/category/detail labels, code binding and all token/key inventories.
These checks do not validate technical fluency. No live event UI ran.
Ledger 19,962; original pending 126/restored 4 unchanged. CPU-core terms,
number/date-range and full broader uncertain review remain in scope.


2026-09-15 — `046830b35`: date-range-of-fields Tshivenda replaced with
Veps draft preserving dates, custom fields and list-top marking. Read
listHeader.js earliest/latest formatting; this is not numeric summation.
Rendered and visually read primary dictionary page 367 (PDF index 366):
промежуток keskust (-an, -id), time interval aigan keskust, two-year
interval kaks’vozne keskust. Evidence cache interval-367.png. The noun
is directly attested; full date/custom-field compound and list-top cases
remain LOW CONFIDENCE, not a validated native whole phrase.
Primary dictionary linked from https://en.wiktionary.org/wiki/kova#Veps
Native MediaWiki and existing Päivmär/custom-fields provide other bases.
Four focused files pass (39 checks), including date-field/top-selection
qualifiers, wrong-language rejection and complete token/key inventories.
No live date-range UI ran. Ledger 19,963; pending 126/restored 4 unchanged.
Numeric-sum terminology and full prior uncertain review remain open.


2026-09-15 — `7c17acd34`: sum-of-number-fields Tshivenda replaced with
Veps draft. Read listHeader.js numberFieldsSumTooltip/numberFieldStats:
this is the ∑ total for number-type custom fields flagged for list top,
not the date earliest/latest range. Rendered and visually read primary
Zajceva/Mullonen dictionary page 419, PDF index 418:
сложение ližaduz’ (-sen, -st, -sid); сложение чисел luguiden ližaduz.
Evidence cache: .tools/tmp/veps-native-source/addition-419.png.
Thus the core arithmetic phrase is directly attested, resolving the earlier
sum-noun gap. Kävutajan märitud lugu-pöudod and list-top clause reuse local
vocabulary; their compound/case grammar remains LOW CONFIDENCE and is not
covered by the dictionary phrase. Primary dictionary source is referenced
from https://en.wiktionary.org/wiki/kova#Veps
Four focused files pass (40 checks), including wrong-language rejection,
sum/date-range distinction, actual helper binding and all token inventories.
No live tooltip UI ran. Ledger 19,964; pending 126/restored 4 unchanged.
CPU-core terminology and full broader prior uncertain review remain open.

2026-09-15 — `21e43e8b5`: repaired the Veps card-number search group.
`card-number`, `operator-number` and its complete search-help sentence had
Zulu values. The replacement uses existing Veps UI `Kart`, the native numeric
label `Lugu`, and the already established sorting construction `nomeran
mödhe` for a card identifier. The help now reads that cards have the stated
card number. The literal `<number>` tokens, Markdown emphasis and
`__operator_number__` placeholder remain byte-for-byte equal to English.
The whole relative clause is a direct draft and remains LOW CONFIDENCE; the
component evidence does not certify its complete grammar. A bounded foreign-
language scan found 117 values with distinctive Tshivenda markers and 25 with
distinctive Finnish vocabulary. These overlap earlier repairs and include
false-positive risk, but prove that the original pending table is not a full
inventory of unflagged Veps damage; every candidate still requires individual
semantic review. Four focused files pass (40 checks): 19,967 correction
records, newer-value preservation, search substitution, wrong-language
rejection and all 234 locale token/key inventories. No live search UI ran.
Original pending remains 126 and restored remains 4; broader candidate and
prior low-confidence review remains active.

2026-09-15 — `052937ff0`: repaired the Veps Problems-page headings.
The h1 `summary` was Tshivenda and the h2 `problems-status-title` was Finnish.
The current native Veps MediaWiki catalogue directly supplies `Lühüd
südäimišt:` for its Summary form label; WeKan uses the same words without the
source-specific colon for its h1 page heading. The existing WeKan Veps
`status` value is exactly `Olo`, so the Problems status subsection now reuses
it rather than introducing another synonym. Template inspection confirms both
keys are headings in `client/components/settings/problemsSummary.jade`.
Four focused files pass (40 checks): 19,969 correction records, exact values,
negative wrong-language checks, newer-value preservation and all 234 locale
token/key inventories. No live Problems page ran. Original pending remains
126 and restored remains 4; broader candidate and prior low-confidence review
remains active.

2026-09-15 — `8a66f4c74`: repaired four Finnish voting-side values in
Veps. Visually inspected the Zajceva/Mullonen dictionary scans cached as
`.tools/tmp/veps-native-source/voting-100.png`, `voting-331.png` and
`voting-370.png`. Printed page 100 directly attests `änestamine` and
`änestada`; page 331 attests `tugeta` and `tugi`; page 370 directly attests
`vastustai (-jan, -jid)` for opponent, `vastustada` for oppose, and the
oppositional adverb/construction. Additional rendered/extracted entries attest
`polestada` for defending oneself, a position, freedom or ecology. The voting
buttons now use directly attested infinitives `Polestada` and `Vastustada`.
Popup headings use the corresponding participant plurals `Polestajad` and
`Vastustajad`; their derivation, especially Proponents → `Polestajad`, remains
LOW CONFIDENCE and needs native contextual review. Four focused files pass
(40 checks): 19,973 correction records, distinct positive/negative sides,
wrong-language rejection, newer-value preservation and all 234 locale token/key
inventories. No live voting UI ran. Original pending remains 126 and restored
remains 4; broader candidate and prior low-confidence review remains active.

2026-09-15 — `8480bee00`: repaired the Veps card-loading group. The
`cards-loading-auto` and `board-status-loading-mode` labels were Tshivenda;
`cards-loading-all` still called the all-cards path the default after automatic
per-board selection became the default; `cards-loading-description` documented
the old manual all/lazy choice and omitted `CARDS_LOADING_LAZY_THRESHOLD`; and
`cards-loading-lazy-note` contained the Russian hybrid `mnog-valind` for
multi-selection. `models/lib/cardsLoading.js` confirms that auto is the default,
boards strictly above the size threshold use the visible window and smaller
boards load every card. `server/models/settings.js` confirms there is no admin
choice and operators can override with the two environment variables. Problems
and Board Status template/logic inspection confirms where the repaired labels
render.

The replacements reuse existing Veps terminology from this locale: `Kartoiden
ladind`, `avtomatine`/`avtomatižešti`, `režim`, `ülimär`, `mušt`, `sädada`,
`pakita`, and `äi valičuz`. The performance description expresses bandwidth as
transferring less data over the network instead of inventing an unsupported
literal noun. Exact `CARDS_LOADING (all/lazy/auto)` and
`CARDS_LOADING_LAZY_THRESHOLD` literals are preserved. Four focused files pass
(40 checks): 19,978 correction records, wrong-language/stale-fragment rejection,
behavior distinctions, source-template bindings, newer-value preservation and
all 234 locale token/key inventories. No live Problems or Board Status UI ran.
The complete assembled technical description remains LOW CONFIDENCE and needs
native contextual review. Original pending remains 126 and restored remains 4;
the broader candidate and prior low-confidence review remains active.

2026-09-15 — `09b62ffa4`: repaired the complete five-key Finnish
accessibility family, including three unflagged values. Source inspection shows
`accessibility` labels the sidebar, page title and Admin navigation;
`accessibility-page-enabled` is the Admin toggle; title/content name separate
editable fields and provide public-page fallbacks; and the not-added-yet text is
the disabled public empty state. Fixing only the two original findings would
have left the same page internally inconsistent.

The checked native MediaWiki catalogue provides no dedicated accessibility
noun. The replacement therefore uses the transparent descriptive family
`Jogahižen pästand` (“access for everyone”). Its components and each surrounding
role reuse existing Veps values: `jogahine`/`jogahižen`, `Pästand`, `lehtpol'`,
`om päl`, `pälkirjutez`, `südäimuz`, `tedod`, `ei ole völ`, and `ližatud`.
This evidence establishes the components and UI distinctions, not an attested
complete accessibility term. The family remains LOW CONFIDENCE pending native
contextual review.

Four focused files pass (40 checks): 19,983 correction records, five distinct
roles, Finnish-fragment rejection, settings/public-page bindings,
newer-translation preservation and all 234 locale token/key inventories. No
live Admin or public accessibility page ran. Two tracked findings are now
corrected: overall pending 124, Veps 6, restored 4. The unflagged scan and all
prior low-confidence wording remain in scope.

2026-09-15 — `1b35cd8b4`: repaired tracked `showSum-field-on-list`, replacing
the Finnish sentence with `Ozuta pöudoiden luguiden ližaduz lugetižen ülähäl`.
The custom-field form renders this checkbox only for currency and number fields,
and listHeader computes the numeric total; date fields use a separately named
range. This source boundary makes the primary dictionary's `luguiden ližaduz`
(numerical addition, rendered page 419) suitable here without asserting an
unattested standalone result noun. Reuse the same arithmetic phrase from the
already repaired `sum-of-number-fields`, plus existing show, fields and list-top
wording. Full compound/case grammar remains LOW CONFIDENCE.

Four focused files pass (40 checks): 19,984 correction records, negative Finnish
terms, arithmetic/date-range distinction, both currency/number form bindings,
the list total binding, newer-value preservation and all 234 locale token/key
inventories. No live custom-field popup ran. One tracked finding is resolved:
overall pending 123, Veps 5, restored 4. Broader Veps and prior low-confidence
review remains active.

2026-09-15 — `b82d5761e`: repaired tracked `enable-vertical-scrollbars`,
replacing Finnish with `Pane päle vertikaližed skrolindan čurad`. Source review
shows the user-profile toggle adds or removes `no-scrollbars` on board, list,
card-detail and sidebar containers; the label therefore retains scrollbar
visibility rather than claiming that scrolling itself is enabled. The rendered
primary dictionary page 60 directly attests `vertikaline`; existing Veps values
supply `Pane päle`, `skrolind` and the UI-bar noun `čura`. Those components do
not attest the complete compound, which remains LOW CONFIDENCE.

Four focused files pass (40 checks): 19,985 correction records, Finnish-term
rejection, vertical/scrollbar wording, visible toggle binding, all four affected
template scopes, newer-value preservation and all 234 locale token/key
inventories. No live board/sidebar toggle ran. One tracked finding is resolved:
overall pending 122, Veps 4, restored 4. Broader Veps and prior low-confidence
review remains active.

2026-09-15 — `4d74f7080`: repaired the coordinated keyboard-shortcut family,
including tracked `keyboard-shortcuts-enabled`, `keyboard-shortcuts-disabled`
and `shortcut-show-shortcuts`, plus the unflagged Finnish page title
`keyboard-shortcuts`. Source inspection verifies that the first pair are
opposite profile-setting actions, the title opens and names the shortcuts
popup, and `shortcut-show-shortcuts` is bound to the literal `?` key.

No dedicated native shortcut term was established in the checked Veps sources;
dictionary button/key entries describe physical objects and are unsuitable.
Use the transparent technical label `Klaviaturan käskud`, reusing the locale's
existing `käskud` command vocabulary, and preserve established enabled,
disabled, click, show and list wording. The international loan and assembled
cases remain LOW CONFIDENCE pending native contextual review.

Four focused files pass (40 checks): 19,989 correction records, exact opposite
states/actions, route and popup bindings, literal `?` binding, Finnish-fragment
rejection, newer-value preservation and all 234 locale token/key inventories.
No live keyboard-shortcuts UI ran. Three tracked findings are resolved: overall
pending 119, Veps 1, restored four unchanged. The remaining tracked Veps item
is the syntax-bearing advanced-filter description; broader unflagged and prior
low-confidence review remains active.

2026-09-15 — `7bc3b73b0`: repaired the last tracked Veps finding,
`advanced-filter-description`, replacing the Finnish prose with a Veps draft.
The paragraph is executable documentation: preserve exactly all eight operator,
field/value, quoted-space, escaped-apostrophe, Boolean-grouping and regex
fragments, plus the source's three standalone backslashes. Source parser review
confirms spaces delimit tokens outside quotes, apostrophes quote literal strings,
backslash escapes the next character, slash delimits regex outside a quoted
string, operators evaluate in sequence and parentheses change grouping.

Reuse existing `Levenzoittud puhtastim`, custom-field, name, value, space,
symbol, write, search, ordering and left/right vocabulary from this locale.
Complete phrasing for quoting, escaping, conditions, grouping and regex remains
LOW CONFIDENCE pending native contextual review.

Six focused files pass (42 checks): the real parser/date-selector suite passes
14/14; all executable examples and escape inventories match English; Finnish
prose is rejected; 19,990 correction records and all 234 locale inventories
verify. No live filter UI ran. The original tracked Veps queue is complete:
overall pending 118, no Veps row, restored four unchanged. Broader unflagged and
all prior low-confidence Veps wording remain in scope.

2026-09-15 — `e17bb2b5e`: repaired 31 additional unflagged Finnish-seeded
interface values through exact English-source matching against the native
MediaWiki Veps catalogue. The batch covers actions, visibility, defaults,
password, file metadata, login, preview, import, message/description, paging,
history, confirmation, rename, collapse, details, user and view labels. Five
unchanged Name/No forms are separately locked because the same native
catalogue attests the byte-identical Veps forms.

Five focused files pass: exact selected values, Finnish-seed rejection, all
20,164 correction records, newer-value preservation and all 234 locale
inventories. Raw Finnish overlap falls from 540 to 509 values; subtracting the
five explicitly attested shared forms leaves 504 unclassified. Exact catalogue
matching does not establish translations for longer product-specific phrases,
which remain in scope. No live UI test or remote write ran.

2026-09-15 — `c67a91a41`: repaired 29 further Finnish-seeded terms through
exact English-gloss matching with the English Wiktionary Veps lexical dataset.
This supplies colors, weekdays and common interface nouns without deriving
them from Finnish. Existing activity prose independently confirms `laud` for
board. Queue joins the explicit shared set because both languages and the
Veps dictionary use `jono`.

Five focused files pass for 60 exact repairs, six shared forms, all 20,193
correction records and all 234 locale inventories. Raw Finnish overlap falls
from 509 to 480, leaving 474 unclassified after the six attested shared forms.
Longer and inflected product phrases remain under review. No live UI test or
remote write ran.

2026-09-15 — `a222bad2d`: repaired 128 coordinated board-interface values.
Native text already in this locale consistently supplies `Ližada`, `Vajehta`,
`Heitä`, `Tege`, `Kopirui`, `Sirdä`, `Valiče`, `Ozuta`, `laud`, `kart`,
`lugetiž`, `ujundšoid`, `ühtnik`, `znam`, `tartutadud fail`, `valičused` and
`arhiv`. These forms replace Finnish across related board/card/list/swimlane,
member/label, settings/archive, create/edit/delete/copy/move/select families.

Six focused files pass for all 128 exact values, action/object distinctions,
Finnish-seed rejection, all 20,321 correction records and all 234 locale
inventories. Raw Finnish overlap falls from 480 to 352, leaving 346
unclassified after six attested shared forms. Complete composed labels remain
open to fluent style review. No live UI test or remote write ran.

2026-09-15 — `4caef872b`: repaired 165 account, email, profile, color, status,
rules, settings and related interface values. The batch reuses checked native
lexical entries and established Veps vocabulary for users, invitations,
authentication, dates, fields, filters, rules and display actions. Literal
`CAS`, `SAML`, `Node`, `Meteor`, `MongoDB`, `Oplog`, `PDF`, `Excel`, `CSV/TSV`,
`iCal`, URLs and every source placeholder remain unchanged.

Seven focused files pass for exact family values, Finnish-seed rejection,
placeholder preservation, all 20,486 correction records and all 234 locale
inventories. Raw Finnish overlap falls from 352 to 187, leaving 181
unclassified after six attested shared forms. Full assembled grammar stays
open to fluent review. No live UI test or remote write ran.

2026-09-15 — `a4ec295ff`: completed the Finnish-seeded review. The final 177
search, report, status, storage and migration values now use Veps drafts built
from the checked lexical sources and vocabulary already established in this
locale. Placeholder inventories, HTML tags, parser examples, product names,
IDs and storage-provider names remain exact.

Ten raw matches remain and are all explicitly reviewed: `Nimi`, `Ei`, `Jono`,
`Minä` and `Repo` are independently native Veps forms; rule/display duplicates
reuse those forms; and `r-of`/`of` are intentional slash separators rather
than Finnish prose. The focused test compares the complete residual overlap to
this closed set, so no Finnish match is unclassified. Eight focused files pass
for all 20,663 corrections and all 234 locale inventories. Full draft style
remains open to fluent improvement. No live UI test or remote write ran.
