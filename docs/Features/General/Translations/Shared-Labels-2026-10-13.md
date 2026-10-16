# Shared-label translation review — 2026-10-13

This batch fills **3,129 English placeholders** and repairs **167 seeded values**
across **130 locale paths** (including the `km-KH` alias). It covers 46 repeated
labels in notification delivery, Blockly, Scrum and interrupted-operation
recovery. The registered locale names are authoritative: `ve` is Venda,
`ve-CC` is Venetian and `ve-PP` is Veps. None of the human-verified `zh` catalogs
was changed.

## Scope and preservation

The fills reuse a translation from the same locale only after reviewing its
context and confirming identical English source text. Existing non-English
values are preserved except for the 167 explicitly recorded repairs. Those
repairs remove language-name prefixes surrounding English and replace known
wrong-language terminology. Every changed value was compared with a snapshot
of the original catalogs; no other existing translation changed.

The [reviewed key pairs](../../../../tests/fixtures/shared-translation-labels.json)
exclude homonyms: a chart's Control is not the Control key; navigation Home is
not the Home key; a date's End is not the End key; and the Clear theme is not a
Clear action. Existing human wording need not match the donor wording when it
is already translated. Native shared spellings such as Bislama `red`, Frisian
`list` and Afrikaans/Portuguese `item` remain intact.

The 15 completed keys formerly in `pending-transifex.json` leave that queue.
There was no Transifex download in this batch: the configured `../tx` executable
is unavailable. No external translation service or translation upload was used.

## Terminology evidence and uncertainty

The short labels combine existing locale terminology with these references:

- Tongan `tohi māhina`, calendar: [bilingual dictionary](https://www.pasifikapages.net/wp-content/uploads/2023/01/eald-bilingual-dictionary-tongan.pdf)
  and [ANU calendar catalog](https://asiapacific.anu.edu.au/pambu/catalogue/index.php/ko-e-tohi-mahina-nuku).
- Aymara organization terminology: [pedagogical vocabulary](https://aymaraclub.com/wp-content/uploads/2024/01/LIBRO-VOCABULARIO-PEDAGOGICO-AYMARA-OK-1.pdf).
- Quechua evaluation terminology: [Ministry of Education vocabulary](https://repositorio.minedu.gob.pe/bitstream/handle/20.500.12799/6974/Chawpi%20Qichwa%20Yachachinapaq%20Shimikuna.pdf?isAllowed=y&sequence=4).
- Venda arrangement terminology: [government access-to-information manual](https://www.dpme.gov.za/publications/Promotion%20of%20Access%20to%20Information/DPME%20translations%20-%202017%20-%20Venda.pdf).
- Tswana `thulaganyo`: [government THRIP description](https://www.gov.za/tn/services/business-incentives/thulaganyo-ya-thekenoloji-le-badiri-ba-intaseteri-thrip).
- Acehnese vocabulary: [official dictionary collection](https://repositori.kemendikdasmen.go.id/23925/)
  and [dictionary entries](https://kaikki.org/dictionary/Acehnese/index.html).
- Volapük linking terminology: [dictionary collection](https://volapuk.temerov.org/Volap%C3%BCkanef/Lingl%C3%A4nap%C3%BCk/v%C3%B6dabuks.php).
- Wolaytta colors: [phrasebook](https://en.wikivoyage.org/wiki/Wolayttattuwa_phrasebook).
  Blue and green use the attested sky/grass comparisons. Its apology wording
  must not be used for cancellation. `Aggida` uses the abandonment/cessation
  stem found in the [Wolaytta corpus](https://www.divinerevelations.info/documents/bible/All_HTML/wolaytta_bible/LUK18.htm)
  and [school morphology examples](https://pdf.usaid.gov/pdf_docs/PA00MQWZ.pdf);
  its use as a software cancellation state remains provisional.

These references establish component vocabulary, not native approval of the
complete software labels. New Luganda, Tswana, Tongan, Tsonga, Aymara, Quechua,
Wolaytta, Venda, Acehnese, Walloon, Wolof and Tamazight compounds are low
confidence and remain in the broader language-quality review. In particular,
assigned-person, preview, layout and state labels need contextual review.
There are still many mixed-language values elsewhere in those catalogs.

## Validation

`sharedLabelTranslations.test.cjs` checks all 46 labels in every non-English
locale through i18next, exact placeholders, absence of known fake language
prefixes, native shared spellings and cancellation/state distinctions. The
existing correction-ledger suite checks exact historical bad-value repair,
idempotence and preservation of newer human wording. The human-preference
workflow's 21 checks pass. All 307 translation/Blockly suites pass, and all
1,016,472 locale/key pairs preserve their exact source-token inventories.

The notification-delivery browser spec now checks layout, list, swimlane and
quiet-hours From labels and includes ten additional locales. Syntax validation
and Playwright discovery register 125 Chromium tests. Browser execution remains
unverified: no application is listening on the configured localhost:3000.

Structural coverage is separate from meaning and fluency. The full fill
inventory still contains **55,375 values across 130 non-English locale paths**;
it includes pending Transifex keys. This batch does not complete the goal of
reviewing every string in every language.
