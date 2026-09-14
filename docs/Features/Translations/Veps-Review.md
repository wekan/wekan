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
