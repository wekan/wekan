# Multiline creation translations

Updated 2026-09-23: `add-many-lines-as` and `many-items` in all 232
non-English locale files. English variants retain the English source.
Only these two previously untranslated values changed; existing item names
and other translations remain intact. `__items__` is preserved exactly.

The shared choice uses the existing translations for boards, cards, lists
and swimlanes. Some languages put the quantity in parentheses after the
item name to avoid requiring an inflected noun from the existing label.
Regional locales share wording where appropriate; Traditional Chinese and
Uzbek Arabic retain their scripts, and Venetian, Veps, Flemish and Waray
use their own language rather than the misleading legacy tag prefix.

## Review limits and vocabulary references

These are direct translation drafts, not fluent-speaker approvals. Full
phrase grammar is particularly low confidence for Cherokee, Inuktitut,
Greenlandic, Tigre, Wolaytta, Fulah, Venda, Tamazight, Nahuatl, Veps,
Aromanian, Ladin, Kashmiri, Konkani, Dzongkha and Guarani. Regional wording
and noun agreement also remain open to native review. Automated tests prove
completeness and interpolation, not linguistic accuracy.

- [Klingon dictionary](https://klingonska.org/dict/) provides vocabulary for
  adding, lines and quantity.
- [Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary)
  provides vocabulary for the constructed-language draft.
- [Wolof rëdd](https://wo.wiktionary.org/wiki/r%C3%ABdd) provides the line noun.
- [Greenlandic dictionaries](https://ordbog.gl/) provide further native-review
  resources; the draft also follows existing local line/quantity labels.
- [Cherokee word list](https://webapps.cherokee.org/wordlist) is a resource for
  reviewing the existing local vocabulary reused in this draft.
- [Tigre resources](https://www.speaktigre.com/) distinguish Tigre references
  from Tigrinya; the complete new phrase still requires review.
- [Wolaytta textbook, section 6.6](https://www.scribd.com/document/971518557/Wolayta-Grade10-Wolaytigna-StuBook-1)
  uses `yafaraa`/`yafarata` for lines in letter-writing instructions. The
  complete software instruction is a draft, not a quotation from that source.

See also the existing [Tigre/Wolaytta review](Tigre-Wolaytta-Calendar-Review.md)
and [Inuktitut review](Inuktitut-Recurrence-Review.md). This two-key update
does not resolve their unrelated outstanding translation findings.

## Verification

`tests/multilineTitles.test.cjs` checks every locale's two strings, exact
underscore/percent token inventory, key order and real i18next interpolation
with all four existing plural item labels. Negative cases reject empty or
English values and missing, renamed, duplicated or additional tokens.
The translation human-preference verifier passes all 21 checks.

A macOS ARM64 Meteor build and nine Chromium tests against isolated
FerretDB pass: Finnish, French, Japanese and Hebrew creation labels, RTL
direction, absence of English/raw-placeholder fallbacks, and card, list,
swimlane and board creation. The final Wolaytta vocabulary correction was
verified by the locale suite; Wolaytta was not exercised in Chromium.
