# WeKan ® 2026-10 releases, part 2

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 2 of 5, newest first: [1](10.md), 2, [3](10-part3.md), [4](10-part4.md), [5](10-part5.md).

Releases per day:

| 2026-10 | Releases |
| --- | --- |
| 03 | 1 |
| 04 | 1 |
| 05 | 1 |
| 07 | 2 |

# v12.21 2026-10-07 WeKan ® release

**In short:** The **Snap** backup and restore commands now start the database
they need and say why it does not answer. All supported languages now have
**login-setting text** for HTTP-header authentication, stored-value removal and
restart guidance, and archiving and date-filter text. Minority-language wording
remains provisional and needs speaker review.

This release fixes the following bugs:

**Snap database tools** - backup, restore and WeKan's wait for its database.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa75d59fd0">Backup and restore start the database first, and every wait says why it fails</a>. Thanks to fabiosalles and xet7.</summary>

`wekan.database-restore` and `wekan.database-backup` only talked to whatever
was on the database port. After `snap stop wekan` nothing is there. On a
FerretDB snap the database is a service of its own, so they failed after 30
seconds with a driver topology dump ([#6746](https://github.com/wekan/wekan/issues/6746)).
`bin/database-ready` asks `bin/database-role` which database holds the data,
starts that service and waits for it. If it still does not answer, it stops
with the driver's error and the `snap logs` command to run. A "permission
denied" is named as a security-policy denial on the server. WeKan's own wait
for FerretDB now shows the ping error too, and no longer suggests the removed
`database` setting. The backup path may contain spaces.
`tests/snapDatabaseRestore.test.cjs` runs both tools in a stand-in snap, with
negative tests for a database that never answers. Not run in an installed
snap.

</details>

and updates the following translations:

**Activity notifications** - choosing which card activity sends notifications.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28b9ce74072a241db36a1029b3d9d1031c905cd4">Translate Blockly controls in Quechua, Aymara, Guarani, Volapük and Klingon.</a></summary>

- Fill 71 comment and accessibility-label placeholders, preserving four existing
  Guarani/Klingon values. Correct the generic Quechua, Volapük and Klingon text
  labels.
- Extend exact-placeholder and opposing-action regressions and translated
  comment-menu assertions. Vocabulary references and provisional technical
  wording are documented in the translation audit.
- Ordinary untranslated values decrease from 48,461 to 48,390 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d695b240b4fdd2f91f31f1305cea92af4a60938">Translate Blockly accessibility labels from Buryat through Tigrinya.</a></summary>

- Fill 88 comment and accessibility-label placeholders in Buryat, Chuvash,
  Sakha, Tibetan, Dzongkha and Tigrinya, preserving two existing Tigrinya
  translations and all source arguments.
- Extend opposing-action regressions and translated comment-menu browser
  assertions. Vocabulary references and low-confidence conditional and input
  wording are documented in the translation audit.
- Ordinary untranslated values decrease from 48,549 to 48,461 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d2e5bbb6ebe07a35d32cf10519313f830d874ff">Translate Blockly accessibility controls in six more locales.</a></summary>

- Fill 88 comment and accessibility-label placeholders in Akan, Bambara, Ewe,
  Wolof, Fula and Kashmiri. Preserve two existing Ewe translations and correct
  the generic Akan text label.
- Extend exact-placeholder and opposite-action regressions and translated
  comment-menu browser assertions. Low-confidence technical wording and
  vocabulary evidence are recorded in the translation audit.
- Ordinary untranslated values decrease from 48,637 to 48,549 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30a40c8747182dde2b57ed8ddb671a49be91dac2">Translate Blockly accessibility labels in five more locales.</a></summary>

- Fill 75 comment and accessibility-label placeholders in Walloon, Waray,
  Acehnese, Northern Sámi and Venetian. Preserve existing Manx and Aromanian
  translations and extend regression coverage to all seven locales.
- Check exact source placeholders and opposing actions. Dictionary references
  and provisional technical wording are recorded in the translation audit,
  including the limited Sámi input-field paraphrase.
- Ordinary untranslated values decrease from 48,712 to 48,637 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Translated
  comment-menu browser coverage is syntax-checked; browser and spoken
  accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dc46f81c027b0e425fc74d9a33d44b85b461b5b">Translate Blockly accessibility controls in nine more locales.</a></summary>

- Fill 135 comment and accessibility-label placeholders in Bislama, Tok Pisin,
  Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Correct the
  generic Tongan text label, which contained prefixed English.
- Preserve source arguments and existing translations, extend checks for
  opposing actions, and add translated comment-menu assertions. Vocabulary
  references and low-confidence technical wording are documented in the
  translation audit.
- Ordinary untranslated values decrease from 48,847 to 48,712 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2b84d3afcb3c81bb1fdcdee6c9aeec62213877e">Translate Blockly accessibility labels for southern African locales.</a></summary>

- Fill 150 comment and accessibility-label placeholders across Sesotho,
  Setswana, Northern Sotho, both Zulu locales, Xhosa, Swati, Northern Ndebele,
  Tsonga and Venda. Preserve source arguments and existing translations.
- Extend opposing-action regressions and translated comment-menu browser
  assertions. Vocabulary references and low-confidence technical wording are
  recorded in the translation audit.
- Ordinary untranslated values decrease from 48,997 to 48,847 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6d4f5f92043f642c59ffb14b1698c19d72b7b64">Translate Blockly accessibility controls in eight more languages.</a></summary>

- Fill 120 English placeholders for comment controls and accessibility labels in
  Turkmen, Yiddish, Bhojpuri, Maithili, Odia, Konkani, Papiamentu and Moroccan
  Arabic, preserving existing translations and source placeholders.
- Extend checks for opposing actions and the translated add-comment menu.
  Conditional-branch wording remains provisional; low-confidence phrases are
  documented in the translation audit.
- Ordinary untranslated values decrease from 49,117 to 48,997 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9cc757aa19feaa3dbec3ddd597f1f091518495a">Translate Blockly accessibility controls in seven languages.</a></summary>

- Fill 104 English placeholders for comment controls and accessibility labels in
  Kurmanji, Central Kurdish, Tatar, Somali, Chichewa, Māori and Samoan. Preserve
  the existing Kurmanji comment translation and correct the generic Tatar text
  label.
- Check exact placeholders and opposing add/remove and collapse/expand labels.
  Technical wording marked low confidence is recorded in the translation audit.
- Ordinary untranslated values decrease from 49,221 to 49,117 across 70
  languages; 148 pending source keys and the broader language-quality audit
  remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Added
  translated comment-menu browser assertions and syntax-checked the suite;
  browser and spoken accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/361dab8b2b74bb1d48e1c64212d47afe3fa913c5">Translate Cherokee Blockly movement announcements.</a></summary>

- Fill twelve Cherokee movement and scrolling announcements. This group now has
  non-English values in all 234 non-English locales, with exact placeholders and
  distinct direction labels checked throughout.
- Cherokee full-sentence wording remains low confidence; vocabulary references
  and limitations are recorded in the translation audit.
- Ordinary untranslated values decrease from 49,233 to 49,221 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.
- Validation: 12 focused tests and 21 human-preference checks pass. Cherokee
  browser coverage is registered and syntax-checked; Playwright and spoken
  screen-reader checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db6c28e86b7dc5ba0c852ae19262514d293a4732">Translate Tigre Blockly movement announcements.</a></summary>

- Filled twelve Tigre movement and scrolling announcements, preserving arguments
  and distinct directions. Technical clauses remain low confidence; spatial
  vocabulary references and grammatical uncertainties are recorded in the
  translation audit.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,245 to 49,233 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/036e902d6bddd9384252656c1360a2c7961d5e98">Translate Greenlandic and Inuktitut Blockly announcements.</a></summary>

- Filled twelve movement and scrolling announcements in Greenlandic and
  Inuktitut (24 values), preserving arguments and distinct directions. Technical
  wording and case endings in both locales remain low confidence.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,269 to 49,245 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72b1f80e756ae5e311e05e2124567275ad79f92d">Translate Blockly announcements in four further locales.</a></summary>

- Filled twelve movement and scrolling announcements in Nahuatl, Wolaytta,
  Standard Moroccan Tamazight and Wu Chinese (48 values), preserving arguments
  and distinct directions. Nahuatl, Wolaytta and Tamazight technical wording
  remains low confidence.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,317 to 49,269 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/26d74f05aa45b22179dcb8bd80268a5abfd2ebb9">Translate Blockly announcements in six more locales.</a></summary>

- Filled twelve movement and scrolling announcements in Quechua, Aymara,
  Guaraní, Veps, Volapük and Klingon (72 values), preserving arguments and
  distinct directions. Technical wording remains provisional, particularly
  Aymara, Veps, Volapük and Klingon.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,389 to 49,317 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25e8a1533764c33e9aa41c483be808f31f3beed9">Translate Blockly announcements in six Asian and African locales.</a></summary>

- Filled twelve movement and scrolling announcements in Buryat, Chuvash, Sakha,
  Tibetan, Dzongkha and Tigrinya (72 values), preserving arguments and distinct
  directions. Technical wording remains provisional, particularly Buryat,
  Chuvash, Sakha and Dzongkha.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,461 to 49,389 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f205bba2e1f4f2314be40725b013b5e85dea645">Translate Blockly announcements in six further locales.</a></summary>

- Filled twelve movement and scrolling announcements in Akan, Bambara, Ewe,
  Wolof, Fulah and Kashmiri (72 values), preserving arguments and distinct
  directions. Technical wording remains provisional, particularly Bambara, Ewe
  and Fulah.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,533 to 49,461 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1879399ba2cfafbcb4d7cc06b02a70e7bee2e1ce">Translate Blockly announcements in five further locales.</a></summary>

- Filled twelve movement and scrolling announcements in Walloon, Waray,
  Acehnese, Northern Sámi and Venetian (60 values). Preserved existing Manx and
  Aromanian values and extended coverage to all seven locales. Technical wording
  remains provisional, particularly Walloon, Acehnese and Northern Sámi.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,593 to 49,533 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f4403c8e7af2c959168659b78f5e406d9ef7a6b">Translate Blockly announcements in nine Pacific and African locales.</a></summary>

- Filled twelve movement and scrolling announcements in Bislama, Tok Pisin,
  Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda (108
  values), preserving arguments and distinct directions. Technical wording
  remains provisional, particularly Tongan, Hawaiian and Luganda.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,701 to 49,593 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3dd7baf95b7703a17eaa71a5836f660a8e639ab8">Translate Blockly announcements in southern African locales.</a></summary>

- Filled twelve movement and scrolling announcements in Sesotho, Setswana,
  Sepedi, Zulu (two locales), Xhosa, Swati, Northern Ndebele, Tsonga and Venda
  (120 values), preserving arguments and distinct directions. Technical wording
  remains provisional, particularly Swati, Northern Ndebele and Venda.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,821 to 49,701 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3cbe00a74ba0e6a688b564785f06f51a79330fb">Translate Blockly movement announcements in eight further locales.</a></summary>

- Filled twelve movement and scrolling announcements in Turkmen, Yiddish,
  Bhojpuri, Maithili, Odia, Konkani, Papiamento and Moroccan Arabic (96 values),
  preserving arguments and distinct directions. Maithili, Konkani and Papiamento
  technical wording remains provisional.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,917 to 49,821 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5bfa8121bd6f12995ab17bbe006c9d6f55f6de6">Translate Blockly movement announcements in seven locales.</a></summary>

- Filled twelve movement and scrolling announcements in Kurmanji, Sorani, Tatar,
  Somali, Chichewa, Māori and Samoan (84 values), preserving arguments and
  distinct directions. Chichewa and Samoan technical wording remains
  provisional.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,001 to 49,917 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23dd54615d25fbc97c4cad56c5e2744a4cb72155">Complete drag permission label placeholder coverage.</a></summary>

- Filled the final Cherokee placeholder with a provisional ability-to-pull
  phrase. The label now has non-English text in all 234 non-English locales.
  Cherokee grammar remains low-confidence and requires review.
- Both focused Node tests and 21 human-preference checks pass, including token
  checks across all non-English catalogs and positive/negative drag-policy
  assertions. Localized browser coverage passes syntax validation; execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,002 to 50,001 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8b31018e68242499e0f665894b5b28f818a2396">Translate drag permission label in six further locales.</a></summary>

- Filled the drag-permission column label in Nahuatl, Wolaytta, Standard
  Moroccan Tamazight, Greenlandic, Inuktitut and Tigre. All six remain
  low-confidence technical drafts. Cherokee still has the English label.
- Both focused Node tests and 21 human-preference checks pass, including
  positive and negative drag-policy assertions. Extended localized settings
  heading and disable/re-enable browser coverage passes syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,008 to 50,002 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a52f25da97d9f1cb9d01bf4a592d105c3f3f9d8">Translate drag permission label in twelve further locales.</a></summary>

- Filled the drag-permission column label in twelve locales. Technical wording
  remains provisional, particularly Chuvash, Veps, Volapük and Klingon.
- Both focused Node tests and 21 human-preference checks pass, including
  positive and negative drag-policy assertions. Extended localized settings
  heading and disable/re-enable browser coverage passes syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,020 to 50,008 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44fe1d4316e4042c1a4d8096efb3f9be487e2879">Translate drag permission label in thirteen further locales.</a></summary>

- Filled the drag-permission column label in thirteen locales. Technical wording
  remains provisional, particularly Aromanian, Fulah and Kashmiri; the Fulah
  vocabulary lookup was inconclusive.
- Both focused Node tests and 21 human-preference checks pass, including
  positive and negative drag-policy assertions. Extended localized settings
  heading and disable/re-enable browser coverage passes syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,033 to 50,020 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d96d8a564feb77b590b44eff53ea91bf0040a636">Translate drag permission label in nineteen further locales.</a></summary>

- Filled the drag-permission column label in nineteen locales. Pronoun agreement
  and technical wording remain provisional, particularly Swati, Northern
  Ndebele, Venda, Fijian and Tongan.
- Both focused Node tests and 21 human-preference checks pass, including
  existing positive and negative drag-policy assertions. Extended localized
  settings heading and disable/re-enable browser coverage passes syntax
  validation; execution remains unverified because Playwright is unavailable
  locally.
- Ordinary untranslated values decrease from 50,052 to 50,033 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/665d33e1410d4f1ce0e222faf8259a1231730ef9">Translate board drag permission label in fifteen locales.</a></summary>

- Filled the drag-permission column label in fifteen locales. Chichewa, Maithili
  and Konkani wording remains provisional.
- Both focused Node tests and 21 human-preference checks pass, including
  existing positive and negative drag-policy assertions. Extended localized
  settings heading and disable/re-enable browser coverage passes syntax
  validation; execution remains unverified because Playwright is unavailable
  locally.
- Ordinary untranslated values decrease from 50,067 to 50,052 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e31679f46a194b9a245b0f0794e6320414f5860f">Complete duplicate relationship placeholder coverage.</a></summary>

- Filled both duplicate-card relationship directions in the final seven locales
  (14 values). Both labels now have non-English values in all 234 non-English
  locales. The final seven sets remain low-confidence drafts, especially
  Cherokee; semantic review remains open.
- All four focused Node tests and 21 human-preference checks pass, including
  token and distinct-label checks across all non-English locales. Extended
  localized editing and undo/redo browser coverage passes syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,081 to 50,067 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99bb6df956ac4e4726f8d2856a89f597f77b6a6b">Translate duplicate relationship labels in twelve further locales.</a></summary>

- Filled both duplicate-card relationship directions in twelve locales (24
  values). Technical wording remains provisional, particularly Chuvash, Veps,
  Volapük and Klingon.
- All four focused Node tests and 21 human-preference checks pass. Extended
  localized editing and undo/redo browser coverage; existing negative checks
  cover self-links and foreign-board links. Browser syntax passes, but execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,105 to 50,081 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37c941609f75061662915a7e95b1dd8dbf0b371c">Translate duplicate relationship labels in thirteen further locales.</a></summary>

- Filled both duplicate-card relationship directions in thirteen locales (26
  values). Technical wording remains provisional, particularly Manx, Aromanian,
  Fulah and Kashmiri; the Fulah vocabulary lookup was inconclusive.
- All four focused Node tests and 21 human-preference checks pass. Extended
  localized editing and undo/redo browser coverage; existing negative checks
  cover self-links and foreign-board links. Browser syntax passes, but execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,131 to 50,105 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e42efb2e5f3ab1419301d6d0e9d1dc0bfd91007">Translate duplicate relationship labels in nineteen further locales.</a></summary>

- Filled both duplicate-card relationship directions in nineteen locales (38
  values). Pronoun agreement and technical wording remain provisional,
  particularly Swati, Northern Ndebele, Venda, Fijian and Tongan.
- All four focused Node tests and 21 human-preference checks pass. Extended
  localized editing and undo/redo browser coverage; existing negative checks
  cover self-links and foreign-board links. Browser syntax passes, but execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,169 to 50,131 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cd38f6de04cbe436420800ffa3bf364c9f2eaac">Translate duplicate relationship labels in fifteen locales.</a></summary>

- Filled both duplicate-card relationship directions in fifteen locales (30
  values). Chichewa, Samoan and Konkani wording remains particularly
  provisional; semantic review remains open.
- All four focused Node tests and 21 human-preference checks pass. Extended
  localized editing and undo/redo browser coverage; existing negative checks
  cover self-links and foreign-board links. Browser syntax passes, but execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,199 to 50,169 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8675861577ba7165857d5496fd70b2c82edc007a">Complete String Template hint placeholder coverage.</a></summary>

- Filled the variable and URL-encoding hint in Cherokee, Inuktitut and Tigre,
  completing non-English coverage in all 234 non-English locales. These final
  drafts remain low-confidence, especially Cherokee; wording review remains
  open.
- All 23 focused Node tests and 21 human-preference checks pass, including
  executable examples and token checks across every non-English locale.
  Localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,202 to 50,199 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6d81e1fd96a41a1e5a51a5a112f104fbdf1d3a3">Translate String Template hints in four further locales.</a></summary>

- Filled the variable and URL-encoding hint in Nahuatl, Wolaytta, Standard
  Moroccan Tamazight and Greenlandic, and replaced English filler in the
  Wolaytta format label. All four sets remain low-confidence drafts requiring
  semantic review.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,206 to 50,202 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/314e00355587e3e0101cbae33a2f3ee710606f3d">Translate String Template hints in six further locales.</a></summary>

- Filled the variable and URL-encoding hint in Quechua, Aymara, Guarani, Veps,
  Volapük and Klingon. All six sets remain low-confidence technical drafts
  requiring semantic review.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,212 to 50,206 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edef644ef7013e0b1d53ea59eaa3c4d6f60eaa8f">Translate String Template hints in twelve further locales.</a></summary>

- Filled the variable and URL-encoding hint in Akan, Bambara, Ewe, Wolof, Fulah,
  Kashmiri, Buryat, Chuvash, Sakha, Tibetan, Dzongkha and Tigrinya. These
  technical translations remain low-confidence drafts requiring semantic review.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,224 to 50,212 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75312bf9b40df9ba5173254de01d78507c25cd80">Translate seven further String Template hints.</a></summary>

- Filled the variable and URL-encoding hint in Walloon, Waray, Acehnese, Manx,
  Northern Sami, Venetian and Aromanian. Technical wording remains provisional,
  particularly Manx, Northern Sami and Aromanian.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,231 to 50,224 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5338d4a8ebe39675e757b2a2e221b5b0dcd798bc">Translate String Template hints in nine further locales.</a></summary>

- Filled the variable and URL-encoding hint in Bislama, Tok Pisin, Fijian,
  Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Technical wording
  remains provisional, especially in Fijian, Tongan and Hawaiian.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,240 to 50,231 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21396dc192c6e415fbbaef72ed7f3c78cc4b7d81">Translate String Template hints in eighteen further locales.</a></summary>

- Filled the variable and URL-encoding hint in eighteen locales and replaced
  generic filler in a Xitsonga format label. Technical wording remains
  provisional, particularly in Konkani, Swati, Northern Ndebele and Venda.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation; browser
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,258 to 50,240 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d79b10f588e4b3f55bc5c5877414fd359a7fb3d2">Translate String Template hints in seven more locales.</a></summary>

- Filled the context-variable and URL-encoding hint in Kurmanji, Sorani, Tatar,
  Somali, Chichewa, Māori and Samoan, preserving executable examples. Chichewa
  and Samoan technical wording remains provisional.
- Corrected mixed-language Tatar format and separator labels, including a
  malformed HTML space entity.
- All 23 focused Node tests and 21 human-preference checks pass. Localized
  positive and negative browser checks pass syntax validation; browser execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,265 to 50,258 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de482cddc5d9ee6496bce22778ed872cdd41b0e9">Complete saved filter placeholder coverage</a></summary>

- Filled the final 30 English values in Cherokee, Inuktitut and Tigre. All ten
  saved-filter strings now have non-English values in all 234 non-English
  locales; the new technical clauses remain low-confidence drafts requiring
  semantic review.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- Ordinary untranslated values decrease from 50,295 to 50,265 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99ee5e0ddcb85a6a143e67bafd5b29e44fa5b251">Fill saved filter translations in four further locales</a></summary>

- Filled 40 English placeholders in Nahuatl, Wolaytta, Standard Moroccan
  Tamazight and Greenlandic. All four sets remain low-confidence technical
  drafts requiring semantic review.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in Cherokee, Inuktitut and Tigre.
  Ordinary untranslated values decrease from 50,335 to 50,295 across 70
  languages; 148 pending source keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5791adc9f5d1a211f027f95bca4d2670577850e2">Fill six further saved filter translations</a></summary>

- Filled 60 English placeholders in Quechua, Aymara, Guarani, Veps, Volapük and
  Klingon. All six sets remain low-confidence technical drafts, particularly
  Veps, Volapük and Klingon.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in seven locales. Ordinary
  untranslated values decrease from 50,395 to 50,335 across 70 languages; 148
  pending source keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e46f22e4e38317cb85586afda6ae4d8b4f192d7c">Translate saved filter controls in six more locales</a></summary>

- Filled 60 English placeholders in Buryat, Chuvash, Sakha, Tibetan, Dzongkha
  and Tigrinya. Technical clauses remain provisional, especially Buryat, Chuvash
  and Dzongkha.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 13 locales. Ordinary untranslated
  values decrease from 50,455 to 50,395 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af96f4e963869a120324e36ad5440685acf5b66a">Translate saved filter controls in six further locales</a></summary>

- Filled 60 English placeholders in Akan, Bambara, Ewe, Wolof, Fulah and
  Kashmiri. Technical clauses remain provisional, especially Ewe, Fulah and
  Kashmiri.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 19 locales. Ordinary untranslated
  values decrease from 50,515 to 50,455 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dad4b31bc37a0afaaf977bf12135fb439fe671e">Translate saved filter controls in seven further locales</a></summary>

- Filled 70 English placeholders in Walloon, Waray, Acehnese, Manx, Northern
  Sami, Venetian and Aromanian, and corrected wrong-language Waray and Acehnese
  filter labels. Technical clauses remain provisional, especially Waray,
  Acehnese, Manx and Aromanian.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 25 locales. Ordinary untranslated
  values decrease from 50,585 to 50,515 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7015e111ee99ddd7800379a4b48ab9629ad2caef">Translate saved filter controls in nine further locales</a></summary>

- Filled 90 English placeholders in Bislama, Tok Pisin, Fijian, Tongan,
  Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Technical clauses remain
  provisional, especially Fijian, Tongan, Hawaiian and Kirundi.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 32 locales. Ordinary untranslated
  values decrease from 50,675 to 50,585 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a60e55e3a5c20df77e9a9ec4eb6656c708c74769">Translate saved filter controls in ten African locale files</a></summary>

- Filled 100 English placeholders in Southern Sotho, Tswana, Northern Sotho,
  both Zulu locales, Xhosa, Swati, Northern Ndebele, Tsonga and Venda. Technical
  clauses remain provisional, especially Swati, Northern Ndebele, Tsonga and
  Venda.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 41 locales. Ordinary untranslated
  values decrease from 50,775 to 50,675 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ef7469ce5c6a5d6e7c523997a9a346a947bc43d">Translate saved filter controls in eight further locales</a></summary>

- Filled 80 English placeholders in Turkmen, Yiddish, Bhojpuri, Maithili, Odia,
  Konkani, Papiamentu and Moroccan Arabic. Technical clauses remain provisional,
  especially Konkani and Papiamentu.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 51 locales. Ordinary untranslated
  values decrease from 50,855 to 50,775 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78ca2530a24c44236c88f963818515711bf921eb">Translate saved filter controls in seven locales</a></summary>

- Filled 70 English placeholders in Kurmanji, Sorani, Tatar, Somali, Chichewa,
  Māori and Samoan, and corrected mixed-language Tatar filter-menu wording.
  Technical clauses remain provisional, especially Chichewa and Samoan.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 59 locales. Ordinary untranslated
  values decrease from 50,925 to 50,855 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30ccbcfe8e7cc0f118662c8a731d87257bebe17f">Complete rule email report placeholder coverage</a></summary>

- Filled the final 30 English values in Cherokee, Inuktitut and Tigre. All ten
  report strings now have non-English values in all 234 non-English locales; the
  new technical clauses remain low-confidence drafts requiring semantic review.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; browser execution remains
  unverified because the local Playwright executable is unavailable.
- Ordinary untranslated values decrease from 50,955 to 50,925 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33f35c657c94855b229c695ae548da96dcd8f32f">Translate rule email reports in Nahuatl, Wolaytta and Tamazight</a></summary>

- Filled 30 English placeholders. All three sets remain low-confidence technical
  drafts requiring semantic review.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; browser execution remains
  unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in Cherokee, Inuktitut and Tigre.
  Ordinary untranslated values decrease from 50,985 to 50,955 across 70
  languages; 148 pending source keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6800674da741c8927568fdc334e14f1d12982ca0">Fill six further rule email report translations</a></summary>

- Filled 60 English placeholders in Quechua, Aymara, Guarani, Veps, Volapük and
  Klingon. All six sets remain low-confidence technical drafts, particularly
  Veps, Volapük and Klingon.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in six locales. Ordinary untranslated
  values decrease from 51,045 to 50,985 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf44a8bcdf4b7efe5d9cbb5aa8236d410cb32056">Translate rule email reports in six more locales</a></summary>

- Filled 60 English placeholders in Buryat, Chuvash, Sakha, Tibetan, Dzongkha
  and Tigrinya. Technical clauses remain provisional, especially Buryat, Chuvash
  and Dzongkha.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 12 locales. Ordinary untranslated
  values decrease from 51,105 to 51,045 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f561ee6ca6565a54977a7b2031fecff52910621b">Translate rule email reports in six further locales</a></summary>

- Filled 60 English placeholders in Akan, Bambara, Ewe, Wolof, Fulah and
  Kashmiri. Technical clauses remain provisional, especially Ewe, Fulah and
  Kashmiri.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 18 locales. Ordinary untranslated
  values decrease from 51,165 to 51,105 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7535a1c0dc45246f38f61f7508a6cd80d51ad6bd">Translate rule email reports in seven further locales</a></summary>

- Filled 70 English placeholders in Walloon, Waray, Acehnese, Manx, Northern
  Sami, Venetian and Aromanian. Technical clauses remain provisional, especially
  Acehnese, Manx and Aromanian.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 24 locales. Ordinary untranslated
  values decrease from 51,235 to 51,165 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04c10bc9e65d4338d4966f2219ae230668f0bb7d">Translate rule email reports in nine further locales</a></summary>

- Filled 90 English placeholders in Bislama, Tok Pisin, Fijian, Tongan,
  Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Technical clauses remain
  provisional, particularly Fijian, Tongan, Hawaiian and Kirundi.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; browser execution remains
  unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 31 locales. Ordinary untranslated
  values decrease from 51,325 to 51,235 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39f31def59fc907d5fdb0edd40d1ef5eda1cd272">Translate rule email reports in ten African locale files</a></summary>

- Filled 100 English placeholders in Southern Sotho, Tswana, Northern Sotho,
  both Zulu locales, Xhosa, Swati, Northern Ndebele, Tsonga and Venda. Technical
  clauses remain provisional, especially Swati, Northern Ndebele, Tsonga and
  Venda.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 40 locales. Ordinary untranslated
  values decrease from 51,425 to 51,325 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d803eda6d899b17411b4551eeb9fc44f737d68b">Translate rule email reports in eight further locales</a></summary>

- Filled 80 English placeholders in Turkmen, Yiddish, Bhojpuri, Maithili, Odia,
  Konkani, Papiamentu and Moroccan Arabic. Technical clauses remain provisional,
  especially Konkani and Papiamentu.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; browser execution remains
  unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 50 locales. Ordinary untranslated
  values decrease from 51,505 to 51,425 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f663811a02b91e12ee43e150f9b8ef64241d3ed">Translate rule email reports in seven more locales</a></summary>

- Filled 70 English placeholders in Kurmanji, Sorani, Tatar, Somali, Chichewa,
  Māori and Samoan. Technical clauses remain provisional, particularly Chichewa
  and Samoan.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 58 locales. Ordinary untranslated
  values decrease from 51,575 to 51,505 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0777dd3ba7eed2687c6581a1bd6882b2ade35cf4">Complete rule variable picker placeholder coverage</a></summary>

- Filled the final twelve English labels. All 234 non-English locales now have a
  translated label; the twelve new drafts remain low confidence and semantic
  review remains open.
- All 13 focused Node tests and 21 human-preference checks pass. Browser syntax
  passes, but browser execution remains unverified.
- Removed the picker label from the pending queue: 149 to 148 source keys. The
  freshly checked broader backlog remains 51,575 ordinary untranslated values
  across 70 languages.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5da7829eb150f64b2b169c6d213562db8aed60a2">Fill ten further rule variable picker translations</a></summary>

- Filled ten English labels. Full clauses remain provisional, especially
  Bambara, Ewe, Aymara, Guarani, Manx and Aromanian.
- Extended locale and browser coverage. All 13 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This label remains untranslated in twelve locales. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 149 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ab05383f473073528df0b54d4807ddb67965e58">Translate ten more rule variable picker labels</a></summary>

- Filled ten English labels. Full clauses remain provisional, especially
  Dzongkha, Buryat, Chuvash, Sakha and Acehnese.
- Extended locale and browser coverage. All 13 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This label remains untranslated in 22 locales. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 149 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84fc9203ddc0b589bb48d29e9549037eb4653f9f">Translate seventeen more rule variable picker labels</a></summary>

- Filled seventeen English labels in African and Pacific locales. Technical
  paraphrases remain provisional, especially Northern Sotho, Tsonga, Venda,
  Fijian, Tongan, Hawaiian and Kirundi.
- Extended locale and browser coverage. All 13 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This label remains untranslated in 32 locales. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 149 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af5ba32503ea2a35e82a0a69285c28ee22a46b0b">Translate the rule variable picker label in seventeen locales</a></summary>

- Filled seventeen English labels, describing insertion into the text field most
  recently selected. Technical phrasing remains provisional, especially Konkani,
  Southern Sotho, Tswana, Chichewa and Samoan.
- Extended locale and browser coverage. All 13 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This label remains untranslated in 49 locales. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 149 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9afc5bf221138091c8ec718d8a898dd05725787b">Fill the Cherokee Leo instruction and cover all locales</a></summary>

- Filled the final English Leo instruction placeholder. All 234 non-English
  locales now have a value; the Cherokee draft remains very low-confidence and
  linguistic review stays open.
- Added all-locale regression coverage and extended the browser import scenario.
  All 12 focused Node tests and 21 human-preference checks pass; browser syntax
  passes, but browser execution remains unverified.
- Removed the Leo instruction from the pending queue: 150 to 149 source keys.
  The broader backlog remains 51,575 ordinary untranslated values across 70
  languages.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/598893c70b7402fd96597ece006ce6be1d31f1a1">Add Tigre and Wolaytta Leo import instructions</a></summary>

- Filled two English instructions. Both full translations remain very
  low-confidence drafts requiring linguistic review.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- Cherokee still uses the English Leo instruction. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 150 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09429dcfed399dde73c2226b94c8bdaa97473fc5">Add Nahuatl and Tamazight Leo import instructions</a></summary>

- Filled two English instructions. Both full translations remain low-confidence
  drafts requiring linguistic review.
- Extended locale, script and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in Cherokee, Tigre and Wolaytta. The
  broader backlog remains 51,575 ordinary untranslated values across 70
  languages plus 150 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48d3e716484edffde1fa4abbefda10b68f986a8b">Add Greenlandic and Inuktitut Leo import instructions</a></summary>

- Filled two English instructions. Both full translations remain low-confidence
  drafts requiring linguistic review.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in five locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc9749b1139373c2e0fc199936cd80a09b165bb1">Translate five more Leo import instructions</a></summary>

- Filled five English instructions in Kashmiri, Fulah, Veps, Volapük and
  Klingon. All five complete instructions remain low-confidence drafts requiring
  linguistic review.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in seven locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e56723274be1c37cf9160330269fec3b4b58e04f">Translate six more Leo import instructions</a></summary>

- Filled six English instructions in Tibetan, Dzongkha, Tigrinya, Quechua,
  Aymara and Guarani. Technical clauses remain provisional, particularly
  Dzongkha, Quechua, Aymara and Guarani.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in 12 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebb12f9537c3dee6207737c701ae73f3b3914a86">Translate seven more Leo import instructions</a></summary>

- Filled seven English instructions in Akan, Bambara, Ewe, Wolof, Buryat,
  Chuvash and Sakha. Full clauses remain provisional, particularly the hierarchy
  terminology.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in 18 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5afa11bde01dc38d4764117011861802f3388342">Translate eight Leo instructions and correct the Darija completion label</a></summary>

- Filled eight English instructions and replaced a Persian completion label in
  Moroccan Arabic with Darija. Technical phrasing remains provisional,
  especially Acehnese, Manx, Northern Sami and Aromanian.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in 25 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0874a292d88f092ec742e814615e6963b815164">Translate Leo import instructions in twelve more locales</a></summary>

- Filled twelve English placeholders in Pacific, Papiamento and eastern African
  locales. Technical phrasing remains provisional, especially Fijian, Tongan,
  Hawaiian, Oromo and Kirundi.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This instruction remains untranslated in 33 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e174595ba4e0d1c593f6406e0b10d946a4515f2">Translate Leo import instructions in fourteen more locales</a></summary>

- Filled fourteen English placeholders in four Indic and ten southern African
  locales. Technical phrasing remains provisional, especially Konkani, Swati,
  Northern Ndebele and Venda.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This instruction remains untranslated in 45 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a2a7dbd0dbb3fff600e78601d90be7af0f2d1f6">Translate Leo import instructions in seven more locales</a></summary>

- Filled seven English placeholders in Kurdish, Central Kurdish, Tatar, Turkmen,
  Yiddish, Somali and Chichewa. Technical phrasing, especially Somali and
  Chichewa, remains provisional.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This instruction remains untranslated in 59 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d19b35b6f9451e0dfe7596ba7cfe3074dd0e4851">Fill remaining parent-card controls and verify all-locale coverage</a></summary>

- Filled six Tigre and Wolaytta placeholders. All three parent-card controls now
  have non-English values in all 234 non-English locales; low-confidence wording
  and further language review remain documented in the translation audit.
- Expanded regression coverage to all locales and added both languages to the
  browser scenario. All 12 focused tests and 21 human-preference checks pass;
  browser syntax passes, but browser execution remains unverified.
- Removed three keys from the pending inventory, reducing it to 150. The fresh
  ordinary backlog count remains 51,575 untranslated values across 70 languages.
  Structural coverage does not establish fluency.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a129d9709e6dd4e934083ec6563898f55a1effc0">Translate parent-card controls into Cherokee</a></summary>

- Filled three placeholders. Low-confidence phrasing, the larger-task paraphrase
  and grammar limitations are documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in two locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c79e6d538e95b1cd9842eac8913cf8332c67a56">Translate parent-card controls into Nahuatl and Moroccan Tamazight</a></summary>

- Filled six placeholders. Low-confidence phrases, parent-card metaphors and
  vocabulary references are documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in three locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 153
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73030eb1c5d36b61dcc9aaf8e89e0bdc60c9bd0d">Translate parent-card controls into Fulah and Veps</a></summary>

- Filled six placeholders. Low-confidence wording, agreement and terminology
  limitations are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in five locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 153
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e372a695f76b4d0fe1fcd49008fd2d8a746681c">Translate parent-card controls into Klingon and Volapuk</a></summary>

- Filled six placeholders. Provisional parent-card metaphors and vocabulary
  limitations are documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in seven locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 153
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6005d0ab612f1f4129e726f6eec22e32ba87fb6b">Translate parent-card controls into Inuktitut and Greenlandic</a></summary>

- Filled six placeholders. Low-confidence technical phrasing and inflections are
  documented with vocabulary references in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in nine locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 153
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/333561b9ea8080f0865105bd858cf54bed47bdad">Translate parent-card controls in five more locales</a></summary>

- Filled 15 placeholders in Moroccan Arabic, Manx, Venetian, Aromanian and
  Northern Sami. Low-confidence terminology and reference limitations are
  documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 11 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89b4a553337a160989f87849d8f355f7428e0255">Translate parent-card controls into Quechua, Aymara and Guarani</a></summary>

- Filled nine placeholders. Provisional technical wording, variety consistency
  and vocabulary references are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 16 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/813c9baa255e19819b56be998c21534085171ef9">Translate parent-card controls into Tibetan, Dzongkha and Tigrinya</a></summary>

- Filled nine placeholders. Provisional technical wording and vocabulary
  limitations are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 19 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00011c073c933f2b4c25151b89b23f8e46907bbb">Translate parent-card controls into Buryat, Chuvash and Sakha</a></summary>

- Filled nine placeholders. Provisional technical terminology, inflections and
  vocabulary references are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 22 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69598b56d899d356fdea248dc516c60a8b20e755">Translate parent-card controls in four more locales</a></summary>

- Filled 12 placeholders in Papiamento, Walloon, Waray and Acehnese.
  Low-confidence technical wording and terminology limitations are recorded in
  the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 25 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6a25535cd37dc87d869f10fc7fc95fa9f3dd639">Translate parent-card controls in eight more African locales</a></summary>

- Filled 24 placeholders in Oromo, Kinyarwanda, Kirundi, Luganda, Wolof, Akan,
  Ewe and Bambara. Provisional software terminology and vocabulary references
  are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 29 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/797d236c7b70ff2974009ee42f437fa916b9b700">Translate parent-card controls in seven Pacific locales</a></summary>

- Filled 21 placeholders in Bislama, Tok Pisin, Maori, Samoan, Fijian, Tongan
  and Hawaiian. Provisional technical wording and terminology references are
  recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 37 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d58d0ffa4e996408c6ad77a6e7c78444841c34b9">Translate parent-card controls in southern African locales</a></summary>

- Filled 30 placeholders across Sesotho, Setswana, Northern Sotho, both Zulu
  locales, Xhosa, Swati, Ndebele, Tsonga and Venda. Provisional terminology and
  language-quality limitations are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 44 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d484b2e1787a2d1c27c9bfcceddbe43c88d57b9">Translate parent-card controls in five South Asian locales</a></summary>

- Filled 15 placeholders in Bhojpuri, Maithili, Odia, Konkani and Kashmiri.
  Removal wording describes ending a parent relationship; low-confidence
  Kashmiri phrasing is documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 54 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5990d89ac508365cb00232c636a3342d7ce3bc7">Translate multiple-parent controls in seven more locales</a></summary>

- Filled 21 placeholders in Kurdish, Sorani, Tatar, Turkmen, Yiddish, Somali and
  Chichewa. The removal label describes ending a parent relationship;
  provisional technical wording is documented in the translation audit.
- Extended locale and browser coverage, including preservation of both parent
  cards. All 12 focused tests and 21 human-preference checks pass; browser
  syntax passes, but browser execution remains unverified.
- These controls remain English in 59 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/399d8787fb81e5205f7272f8a95b4ee1d65f0436">Fill Wolaytta map strings and verify map-view coverage across all locales</a></summary>

- Filled seven Wolaytta placeholders. All seven map-view keys now have
  non-English values in all 234 non-English locales; low-confidence wording and
  further language review remain documented in the translation audit.
- Expanded regression coverage to all locales and added Wolaytta browser
  coverage. All 12 focused tests and 21 human-preference checks pass; browser
  syntax passes, but browser execution remains unverified.
- Removed seven keys from the pending inventory, reducing it to 153. The fresh
  ordinary backlog count remains 51,575 untranslated values across 70 languages.
  Structural coverage does not establish fluency.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6131d3eed7f6e538ef70b53900f4a4a306cb5e21">Translate map view into Tigre</a></summary>

- Filled seven placeholders. These are low-confidence drafts; vocabulary
  references, grammar limitations and possible Tigrinya interference are
  recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  still awaits Playwright and a running application.
- Wolaytta still has English map-view strings. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 160 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29a4180ec324c9f1d30af22be20760f3178d68bc">Translate map view into Cherokee</a></summary>

- Filled seven placeholders. The map label follows Cherokee Nation usage;
  technical sentences remain low-confidence drafts, with terminology references
  and limitations recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  still awaits Playwright and a running application.
- Two locale paths still have English map-view strings. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9169523ae25b78d2803ae20d3070c42ebbc78b5a">Translate map view into Inuktitut</a></summary>

- Filled seven placeholders, retaining both placement methods and the image
  examples. Technical wording remains low confidence; terminology evidence and
  limitations are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  still awaits Playwright and a running application.
- Three locale paths still have English map-view strings. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f23a9d2a884406c6de2197958f1fde0738c72206">Translate map view into Nahuatl and Moroccan Tamazight</a></summary>

- Filled 14 placeholders. Technical sentences in both languages remain
  low-confidence drafts; terminology references and limitations are recorded in
  the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in four locale paths. The broader
  backlog remains 51,575 ordinary untranslated values across 70 languages plus
  160 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4b7124442a0577cf991badfc8122b2598436d92">Translate map view into Veps and Greenlandic.</a></summary>

- Filled 14 placeholders. Veps compounds are low-confidence drafts; Greenlandic
  technical wording remains provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in six locale paths. The broader
  backlog remains 51,575 ordinary untranslated values across 70 languages plus
  160 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15e8f59fba49c93b51fb1f9ee019fbc6b62f9d81">Translate map view into Klingon and Volapuk.</a></summary>

- Filled 14 placeholders and checked key vocabulary against dictionaries. Full
  technical sentences remain provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in eight locale paths. The broader
  backlog remains 51,575 ordinary untranslated values across 70 languages plus
  160 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6b4fe7e5764bb793195bd19a167f160bacfba57">Translate map view into Northern Sami, Fulah and Kashmiri.</a></summary>

- Filled 21 placeholders. Fulah and Kashmiri technical clauses are
  low-confidence drafts; floor-plan wording remains provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 10 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc4bfee6d9f2c84a404e9a629851a630390af85c">Translate map view into Quechua, Aymara and Guarani.</a></summary>

- Filled 21 placeholders. Map compounds, floor-plan and upload wording remain
  provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 13 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/172e75c074025679d79cc98899899e91c77052ba">Translate map view into Akan, Ewe and Bambara.</a></summary>

- Filled 21 placeholders. Technical clauses remain provisional, particularly
  floor-plan, upload and click wording.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 16 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e064776ff18caf31bf808f94b9d898b47a6ceac8">Translate map view into Manx, Venetian and Aromanian.</a></summary>

- Filled 21 placeholders. Aromanian technical clauses are low-confidence drafts;
  floor-plan wording remains provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 19 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4cf96773d93a9a06f1a5c35b87756b118bed9e4a">Translate map view into Tibetan, Dzongkha and Tigrinya.</a></summary>

- Filled 21 placeholders. Technical wording remains provisional, particularly
  Dzongkha floor-plan terminology.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 22 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e73aa11f9b85929f0f508b96a2ee6ae38b7aaa3">Translate map view into Buryat, Chuvash and Sakha.</a></summary>

- Filled 21 placeholders. Technical sentences remain provisional, particularly
  Chuvash floor-plan wording.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 25 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba1845e9ee1193dbd3cd1aaf62ed3fe7a711b16b">Translate map view into Waray, Fijian, Tongan, Luganda and Wolof.</a></summary>

- Filled 35 placeholders. Technical phrases, especially floor-plan wording and
  the Wolof map/card distinction, remain provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 28 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3008049d2368945aabc234435048bc228cc8f71b">Translate map view into Papiamento, Walloon, Acehnese and Hawaiian.</a></summary>

- Filled 28 placeholders. Walloon and Acehnese technical phrases are
  low-confidence drafts; floor-plan wording remains provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 33 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44e386567359d1697696894f792de789eb84f91c">Translate map view into Bislama, Tok Pisin, Maori and Samoan.</a></summary>

- Filled 28 placeholders. Floor-plan phrases and Samoan UI wording remain
  provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 37 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b1aab5795362d96d854fe6e12b09f72270e37d4">Translate map view into Swati, Ndebele, Tsonga and Venda.</a></summary>

- Filled 28 placeholders. Technical wording remains provisional, especially
  floor-plan and click terminology.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 41 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/521228a31b47f61327f2c28b717f937045253e60">Translate map view into Sesotho, Setswana, Northern Sotho, Zulu and Xhosa.</a></summary>

- Filled 42 placeholders across six locale files, including both Zulu paths.
  Floor-plan terminology remains provisional, especially Northern Sotho.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 45 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a394fc63bc6eda730b6e7ab2d3d56933bd120d00">Translate map view into Somali, Oromo, Kinyarwanda, Kirundi and Chichewa.</a></summary>

- Filled 35 placeholders and distinguished map and task-card terms in
  Kinyarwanda and Kirundi. Technical sentences and floor-plan terms remain
  provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 51 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b02a46d525f1d6ac24e60d45f61e37f90f5f26a">Translate map view into Moroccan Arabic, Bhojpuri, Maithili, Odia and Konkani.</a></summary>

- Filled 35 placeholders, preserving both placement methods and map-image
  examples. Technical phrases remain provisional, especially the Konkani
  floor-plan wording.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 56 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bab737e36465a98168a1b9a2a2df15aa5dac1f0b">Translate map-view messages into Kurdish, Sorani, Tatar, Turkmen and Yiddish.</a></summary>

- Filled 35 placeholders, including upload/removal controls and both
  card-placement methods. Technical wording remains provisional, especially
  Turkmen.
- Extended regression and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- These seven map-view keys remain English in 61 locale paths. The broader
  backlog remains 51,575 ordinary untranslated values across 70 languages plus
  160 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/208c052c844f052cfddc5f8ca2a5194fce1985cc">Complete history-recovery placeholder coverage in all languages.</a></summary>

- Filled five Cherokee messages with provisional, low-confidence wording. All
  five recovery messages now have non-English values in all 234 non-English
  locale paths; linguistic review remains open.
- Extended the regression to all locales and added the Cherokee browser
  scenario. The 13 focused tests and 21 human-preference checks pass. Browser
  syntax passes; execution awaits Playwright and a running application.
- Removed these five source keys from the pending queue, leaving 160. The
  ordinary backlog remains 51,575 untranslated locale/string values across 70
  languages; coverage does not establish fluent wording.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69b151f2e52ab975bd712de25a9c7840f81a55fe">Translate history recovery in Tigre</a>. Thanks to xet7.</summary>

- Translate five recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in one locale: Cherokee. The broader
  backlog remains 51,575 ordinary missing values across 70 languages and 165
  pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9daaa68ccddc39112cd9d7b6a4e548cfb46b9838">Translate history recovery in Wolaytta</a>. Thanks to xet7.</summary>

- Translate five recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 2 locales: Tigre and Cherokee. The
  broader backlog remains 51,575 ordinary missing values across 70 languages and
  165 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aade6ac1ec63b51de15dd2bab76c11ba15447171">Translate history recovery in Inuktitut</a>. Thanks to xet7.</summary>

- Translate five recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 3 locales: Tigre, Cherokee and
  Wolaytta. The broader backlog remains 51,575 ordinary missing values across 70
  languages and 165 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5666d8d5d8c863c29a832427b044251bb33c763">Translate history recovery in Nahuatl and Tamazight</a>. Thanks to xet7.</summary>

- Translate 10 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 4 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fafca4f49ee646878b05515d80f2458eff97639f">Translate history recovery in Veps and Greenlandic</a>. Thanks to xet7.</summary>

- Translate 10 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 6 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4708cfacb86bafd3665c68f08708ce37ff8cc7db">Translate history recovery in Klingon and Volapük</a>. Thanks to xet7.</summary>

- Translate 10 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 8 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e99ccda86ade8b6d67f7809090d5092da3bea4a">Translate history recovery in Northern Sámi, Fulah and Kashmiri</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 10 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef2dcedf2a2f8aadb95db9dfb2b363d013e43c23">Translate history recovery in Quechua, Aymara and Guarani</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 13 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/119e6648c81d0dd51ce1a6ec07996cd04fc83334">Translate history recovery in Akan, Ewe and Bambara</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 16 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/291e4a4e5f955e43ab639d62bf8574c62d587858">Translate history recovery in Manx, Venetian and Aromanian</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 19 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee0cddff894ef302d44a968e5f3c403ae9f8c170">Translate history recovery in Tibetan, Dzongkha and Tigrinya</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 22 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bb22322f524ee34f7557e74d96d2034bff4a2ff">Translate history recovery in Buryat, Chuvash and Sakha</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 25 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f9c7196928cb6c8a3c3737abcd834345217c92c">Translate history recovery in Waray, Fijian, Tongan, Luganda and Wolof</a>. Thanks to xet7.</summary>

- Translate 25 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 28 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f7f29363962373a9584c5c67bdeee98ca90df78">Translate history recovery in Papiamentu, Walloon, Acehnese and Hawaiian</a>. Thanks to xet7.</summary>

- Translate 20 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 33 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a52901739385df5e82f9428838f7013a6a5c284">Translate history recovery in Bislama, Tok Pisin, Māori and Samoan</a>. Thanks to xet7.</summary>

- Translate 20 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 37 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57afc10e49803118e009a2e860d7fad55df3df2f">Translate history recovery in Swati, Ndebele, Tsonga and Venda</a>. Thanks to xet7.</summary>

- Translate 20 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 41 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3c1a3ddfb30220375deab17737f510f59a6ac60">Translate history recovery in southern African locales</a>. Thanks to xet7.</summary>

- Translate 30 recovery messages across Southern Sotho, Tswana, Northern Sotho,
  both Zulu variants and Xhosa, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 45 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5349fc057c6872f6ed4abf81d430295c020f1555">Translate history recovery in five African languages</a>. Thanks to xet7.</summary>

- Translate 25 recovery messages in Somali, Oromo, Kinyarwanda, Kirundi and
  Chichewa, keeping undo/redo, retry/forget and safe request repetition
  distinct. Full clauses and technical wording remain provisional for language
  review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 51 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18c0b640261248f2d19ab1366ffaaef4f2345899">Translate more history recovery messages</a>. Thanks to xet7.</summary>

- Translate 25 recovery messages in Moroccan Arabic, Bhojpuri, Maithili, Odia
  and Konkani, keeping undo/redo, retry/forget and safe request repetition
  distinct. Full clauses and technical wording remain provisional for language
  review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 56 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0acb21a162c19d32896f986a33607e6e102830d7">Translate history recovery in five languages</a>. Thanks to xet7.</summary>

- Translate 25 recovery messages in Kurmanji, Sorani, Tatar, Turkmen and
  Yiddish, distinguishing undo/redo and retry/forget while explaining safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases retain
  positive and negative behavior coverage; syntax checks pass, but browser
  execution requires Playwright and a running application.
- This five-key group remains English in 61 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44cecb2cb7aa853ff8def0d820d6538e83709774">Complete import-report placeholder coverage across locales</a>. Thanks to xet7.</summary>

- Translate the remaining Cherokee import messages. All 234 non-English locales
  now have nonempty, non-English values for this three-key group. Cherokee
  sentences and broader provisional wording still need language review.
- Expand regression coverage to every non-English locale, preserving
  Hebrew/Persian navigation arrows, source order and interpolation tokens.
  Translation, import-loss, structural and human-preference checks pass. Browser
  cases are syntax-checked; execution requires Playwright and a running
  application.
- Remove the three filled keys from the pending inventory, leaving 165. A fresh
  report still counts 51,575 ordinary missing values across 70 languages;
  language-quality review and the broader translation task remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/802440b7c097e6caeccef082ef9fdb38f42f577d">Translate import reports in Tigre</a>. Thanks to xet7.</summary>

- Translate three import-report messages and replace a Tigrinya Admin Panel
  phrase with Tigre wording. Full sentences, warning paraphrase and technical
  terminology remain low confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Tigre browser case is syntax-checked;
  execution requires Playwright and a running application.
- This group remains English in Cherokee only. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 168 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6400c6f9f480f3084cf631616c965c7e90990e1">Translate import reports in Tamazight</a>. Thanks to xet7.</summary>

- Translate three import-report messages and replace the Arabic Admin Panel
  label with Tamazight wording. Full sentences and technical terminology remain
  low confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Tamazight browser case is syntax-checked;
  execution requires Playwright and a running application.
- This group remains English in two locales. The broader backlog remains 51,575
  ordinary missing values across 70 languages and 168 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34bfeb77ca1c3891e0e8302ec5888cb5e11ea6c6">Translate import reports in Inuktitut</a>. Thanks to xet7.</summary>

- Translate three import-report messages, retaining board creation, incomplete
  transfer and recovery navigation. Full sentences and technical terminology
  remain low confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Inuktitut browser case is syntax-checked;
  execution requires Playwright and a running application.
- This group remains English in three locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 168 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9af64cf7191926029d14f555d5a8532915434404">Translate import reports in Wolaytta</a>. Thanks to xet7.</summary>

- Translate three import-report messages and replace two prefixed-English
  recovery-menu labels. Full sentences and technical terminology remain low
  confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Wolaytta browser case is syntax-checked;
  execution requires Playwright and a running application.
- This group remains English in four locales. The broader backlog remains 51,575
  ordinary missing values across 70 languages and 168 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae9af70f64bc1458b9b4ca8cf65b0ac8ef833d7a">Translate import reports in Greenlandic and Nahuatl</a>. Thanks to xet7.</summary>

- Translate six import-report messages, retaining board creation, incomplete
  transfer and recovery navigation. Full clauses and technical terminology
  remain low confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. Both browser cases are syntax-checked; execution
  requires Playwright and a running application.
- This group remains English in five locales. The broader backlog remains 51,575
  ordinary missing values across 70 languages and 168 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90e72235594e885db9b8b62c3b932ad907c67723">Translate import reports in Veps</a>. Thanks to xet7.</summary>

- Translate three import-report messages and replace a Venda recovery-menu seed
  in Veps. Full clauses and derived terminology remain low confidence,
  documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Veps browser case is syntax-checked; browser
  execution requires Playwright and a running application.
- This group remains English in seven locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 168 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec3a8cd7981850b51b371e544817becbd997fd91">Translate import reports in Volapük</a>. Thanks to xet7.</summary>

- Fill three English values for import warnings, incomplete transfer
  explanations and opening the created board. Preserve existing translations and
  recovery paths. Low-confidence grammar and technical phrasing remain recorded
  for fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser coverage was
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in eight locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d94f256dcbe559121f225bfd075e4f37d05f454e">Translate import reports in Tigrinya and Klingon</a>. Thanks to xet7.</summary>

- Fill six English values for import warnings, incomplete transfer explanations
  and opening the created board. Preserve existing translations and recovery
  paths. Low-confidence grammar and technical paraphrases remain recorded for
  fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in nine locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6e0289a4209fb90097c74729ba590c6a60a6d90">Translate import reports in Guarani, Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill nine English values and replace four prefixed-English menu labels in
  Quechua and Aymara. Preserve existing translations and use matching recovery
  paths. Low-confidence grammar and technical phrasing remain recorded for
  fluent-speaker review.
- Extend source-order, placeholder, menu-path, vocabulary and localized browser
  coverage. Translation, import-loss and human-preference checks pass; browser
  cases were syntax-checked only because the local Playwright executable and
  running application are unavailable.
- These three keys remain English in 11 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdd93651cab409822bad3401e98b07d7eb1a75d8">Translate import reports in Manx, Walloon and Aromanian</a>. Thanks to xet7.</summary>

- Fill nine English values for import warnings, incomplete transfer explanations
  and opening the created board. Preserve existing translations and recovery
  paths. Low-confidence grammar and technical phrasing remain recorded for
  fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in 14 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b9a31cc1093d1bf1043cf8e128c19b1f6f32ab6">Translate import reports in Tibetan, Dzongkha and Kashmiri</a>. Thanks to xet7.</summary>

- Fill nine English values for import warnings, incomplete transfer explanations
  and opening the created board. Preserve existing translations and
  recovery-menu terminology. Low-confidence grammar and technical phrasing
  remain recorded for fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in 17 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec468ac7eacf587e943cf61120ca038354ca79fb">Translate import reports in Buryat, Chuvash, Sakha and Northern Sámi</a>. Thanks to xet7.</summary>

- Fill twelve English values for import warnings, incomplete transfer
  explanations and opening the created board. Preserve existing menu paths and
  translations. Low-confidence grammar and technical phrasing in all four drafts
  remain recorded for fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in 20 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14fa33a3ff0a14e342f8745b22e2e8ba42b8cd92">Translate import reports in six further languages</a>. Thanks to xet7.</summary>

- Fill 18 English values in Acehnese, Bambara, Ewe, Fulah, Fijian and Tongan.
  Replace two prefixed English Tongan menu labels and use the corrected recovery
  path. Low-confidence technical phrasing remains recorded for fluent-speaker
  review.
- Extend source-order, placeholder, corrected-vocabulary and localized browser
  coverage. Translation, import-loss and human-preference checks pass; browser
  cases were syntax-checked only because the local Playwright executable and
  running application are unavailable.
- These three keys remain English in 24 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6d6908fad06767bf2043482cfa2d2fd8f5d6574">Translate eight more import reports and repair recovery paths</a>. Thanks to xet7.</summary>

- Fill 24 English values in Akan, Luganda, Wolof, Swati, Tsonga, Venda, Waray
  and Venetian. Correct eleven generic or wrong-language menu values so the
  report points to matching recovery labels. Lower-confidence technical phrasing
  remains recorded for fluent-speaker review.
- Extend source-order, placeholder, menu-path, vocabulary and localized browser
  coverage. Translation, import-loss and human-preference checks pass; browser
  cases were syntax-checked only because the local Playwright executable and
  running application are unavailable.
- These three keys remain English in 30 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ab324cfeb3aed52733d34981f05efc51bb08d71">Translate import reports in eight locales and repair recovery labels</a>. Thanks to xet7.</summary>

- Fill 24 English values in Bislama, Tok Pisin, Māori, Samoan, Hawaiian,
  Papiamentu, Xhosa and Northern Ndebele. Replace five mixed-language or
  malformed menu values in Bislama, Tok Pisin and Hawaiian. Lower-confidence
  technical phrasing remains recorded for fluent-speaker review.
- Extend source-order, placeholder, corrected-vocabulary and localized browser
  coverage. Translation, import-loss and human-preference checks pass; browser
  cases were syntax-checked only because the local Playwright executable and
  running application are unavailable.
- These three keys remain English in 38 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b53206d9dffe9d1d3d6f60c399a119a44f550526">Translate import reports in ten African locale files</a>. Thanks to xet7.</summary>

- Fill 30 English values in Somali, Oromo, Kinyarwanda, Kirundi, Chichewa,
  Sesotho, Setswana, Northern Sotho and both Zulu locales. Preserve the warning,
  incomplete import explanation and recovery-menu path. Lower-confidence
  technical phrasing remains recorded for fluent-speaker review.
- Extend existing source-order, placeholder and localized browser coverage.
  Translation, import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in 46 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e0084b1c7ac1ef1a5749a80c509194a96c95773">Translate import warning reports in ten further languages</a>. Thanks to xet7.</summary>

- Fill 30 English values in Moroccan Arabic, Sorani, Kurmanji, Bhojpuri,
  Maithili, Odia, Konkani, Turkmen, Tatar and Yiddish. Correct two Tatar
  recovery menu labels so the report points to the matching menu.
  Lower-confidence technical wording is recorded for fluent-speaker review.
- Extend source-order, token and vocabulary regressions and add ten localized
  browser cases covering malformed input, the warning report and opening the
  imported board. Node checks pass; browser cases were syntax-checked only
  because the local Playwright executable and running application stack are
  unavailable.
- These three keys remain English in 56 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5aa3a4f1087c7ebab616deb386aec27a71ec82f">Fill final board visibility translations and verify all locales</a>. Thanks to xet7.</summary>

- Fill the final three English values in Cherokee. All 234 non-English locales
  now have nonempty values different from English for the signed-in visibility
  label, description and confirmation. Low-confidence grammar and technical
  phrasing remain recorded for fluent-speaker review.
- Extend regression coverage to every locale for source order, tokens, markup
  and rendered emphasis, and verify that the group has left the pending
  inventory. Translation and permission tests pass; the browser suite was
  syntax-checked only because the application stack is unavailable.
- Reduce pending source keys from 171 to 168. The ordinary backlog remains
  51,575 missing values across 70 languages; language-quality review and the
  broader translation goal remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1365619b6a0d0aaa9980047088d3b10f1711eb4a">Translate board visibility in Tigre</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record grammar references and low-confidence software
  vocabulary and agreement for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English only in Cherokee. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/feea9100493586ce0cbaf082bac7e04f18a00cc8">Translate board visibility in Wolaytta</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and low-confidence login phrasing,
  negation and membership wording for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in two locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bbc75e16f497a431abcb00aa5ab43b5bed91485e">Translate board visibility in Inuktitut</a>. Thanks to xet7.</summary>

- Fill three English values in syllabics, preserving viewing and editing
  distinctions and confirmation emphasis. Record low-confidence technical
  phrasing and inflection for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in three locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64ed67170dd07f14316cce450926de15c93871f7">Translate board visibility in Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill three English values in Tifinagh, preserving viewing and editing
  distinctions and confirmation emphasis. Record low-confidence login phrasing
  and grammar for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in four locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a516f1442d85b1d61b8d3e0a92feacae68ba8a0">Translate board visibility in Nahuatl</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and low-confidence software
  terminology and grammar for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in five locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab8fd1d8abe3d54b32c784db10a6865a054f476a">Translate board visibility in Greenlandic</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record vocabulary references and lower-confidence
  technical phrasing and inflection for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in six locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/053ed2d22bd4d1acdb5fcc054aaa98a05d868a3b">Translate board visibility in Veps</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and low-confidence login phrasing and
  case endings for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in seven locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b1005d6532ffbb6279f433c91891952b5589de4">Translate board visibility in Volapük</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record vocabulary references and lower-confidence
  phrasing for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in eight locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/712e503516279f1bbe54169a42ee8fef6eb356bc">Translate board visibility in Tigrinya and Klingon</a>. Thanks to xet7.</summary>

- Fill six English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and lower-confidence technical
  phrasing and clause structure for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in nine locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cfd9b64ea3260c92ffd33a45a22b26ca6cb2e81">Translate board visibility in Guaraní, Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill nine English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record vocabulary references and lower-confidence login
  phrasing and dialect choices for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in 11 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/168c9b97b0a9dc5a3fdf80113636260dc48ad3d8">Translate board visibility in Manx, Walloon and Aromanian</a>. Thanks to xet7.</summary>

- Fill nine English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and lower-confidence grammar and
  dialect choices for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in 14 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4dbca343d731aecd2f2d143c256327a30fd52e51">Translate board visibility in Tibetan, Dzongkha and Kashmiri</a>. Thanks to xet7.</summary>

- Fill nine English values, preserving the viewing/editing distinction and
  confirmation emphasis. Record lower-confidence technical phrasing and grammar
  for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in 17 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/663833ed9a8429533c183aa47339649bc1cdb7f4">Translate board visibility in four further locales</a>. Thanks to xet7.</summary>

- Fill 12 English values in Buryat, Chuvash, Sakha and Northern Sámi. Preserve
  viewing and editing distinctions and confirmation emphasis; record terminology
  references and lower-confidence grammar for fluent-speaker review.
- Extend the existing source-order, token, markup and rendered-emphasis
  regression. Translation and permission checks pass; the browser suite was
  syntax-checked only because the application stack is unavailable.
- These three keys remain English in 20 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b9c99d97d5cc0707c15a813bd0bee15d45e0c06">Translate board visibility in six further locales</a>. Thanks to xet7.</summary>

- Fill 18 English values in Acehnese, Bambara, Ewe, Fulah, Fijian and Tongan,
  preserving the viewing/editing distinction and confirmation emphasis. The
  audit records lower-confidence login terminology and grammar for
  fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in 24 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ac1110946fb3498b3a4dfbfe8aed641ced179cd">Translate board visibility in Akan through Venetian</a>. Thanks to xet7.</summary>

- Fill 24 English values in Akan, Luganda, Wolof, Swati, Tsonga, Venda, Waray
  and Venetian, preserving signed-in viewing, board-member editing and
  confirmation emphasis. Lower-confidence technical phrasing is recorded for
  fluent-speaker review.
- Extend the existing source-order, token, markup and rendered-emphasis
  regression. Translation and permission checks pass; the browser suite was
  syntax-checked only because the application stack is unavailable.
- These three keys remain English in 30 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e46d3e208f2ab54967ba82e649cb9aafd945788">Translate board visibility in eight further locales</a>. Thanks to xet7.</summary>

- Fill 24 English values in Bislama, Tok Pisin, Māori, Samoan, Hawaiian,
  Papiamento, Xhosa and Northern Ndebele, preserving viewing and editing
  distinctions and confirmation emphasis. The audit records lower-confidence
  wording for fluent-speaker review.
- Extend the existing translation regression for source key order, tokens,
  markup and rendered emphasis. Translation and permission checks pass; the
  browser suite was syntax-checked only because the application stack is
  unavailable.
- These three keys remain English in 38 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abcdd5c3529fa03bc9bdaaf21fec7fc257d887e9">Translate board visibility in ten more locales</a>. Thanks to xet7.</summary>

- Fill 30 English values in Somali, Oromo, Kinyarwanda, Kirundi, Chichewa,
  Sesotho, Setswana, Northern Sotho and both Zulu locales. Preserve viewing and
  editing distinctions and confirmation emphasis. The audit records
  lower-confidence wording for fluent-speaker review.
- Extend existing source-order, placeholder, markup and rendered-emphasis
  coverage. Translation and permission checks pass; the browser suite was
  syntax-checked only because the application stack is unavailable.
- These three keys still need filling in 46 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b985c0c590a0e048455b362a816e8a11897593d7">Translate signed-in board visibility in ten locales</a>. Thanks to xet7.</summary>

- Fill 30 English placeholders in Moroccan Arabic, Central Kurdish, Kurdish,
  Bhojpuri, Maithili, Odia, Konkani, Turkmen, Tatar and Yiddish. Preserve the
  distinction between viewing by signed-in users and editing by board members,
  and the confirmation's emphasis. Lower-confidence wording is recorded in the
  translation audit for fluent-speaker review.
- Regression checks cover source key order, placeholders, exact markup and
  rendered emphasis. Board visibility and permission tests pass. The existing
  browser suite was syntax-checked only; the application stack is unavailable.
- These three keys remain English in 56 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys; language-quality
  review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/486543fc04f346f7bdfd092e3cf573e424af509c">Fill Cherokee URL hint and verify all locale scheme identifiers</a>. Thanks to xet7.</summary>

- Fill the final English URL-scheme hint in Cherokee and document low-confidence
  wording. All 234 non-English locales now have filled hints; linguistic review
  remains open, including previously documented drafts.
- Discover every non-English locale in regression coverage and verify literal
  scheme
  identifiers, placeholders and key order. Parser, sanitizer, locale structure
  and
  human-preference checks pass. Browser tests were syntax-checked only because
  the
  application stack is unavailable.
- Remove the filled hint from the pending inventory, reducing it to 171 source
  keys.
  The ordinary backlog remains 51,575 values across 70 languages; broader work
  continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8db74f37123d9306f1fac5086da9b4ca0a6b0c3">Translate URL scheme hint in Tigre</a>. Thanks to xet7.</summary>

- Fill the English hint while preserving literal scheme names and existing
  translations. Record low-confidence terminology and grammar for fluent review.
- Hint checks cover 65 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Only Cherokee still has this hint in English. The broader backlog remains
  51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c98ea17f1adf00bc28d94535f243563dde0aba84">Translate URL scheme hint in Wolaytta</a>. Thanks to xet7.</summary>

- Fill the English hint while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording and grammar for
  review.
- Hint checks cover 64 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Two locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa5f00e7ebf2d7b12a7bb8412e8e8c514dc18139">Translate URL scheme hint in Inuktitut</a>. Thanks to xet7.</summary>

- Fill the English hint in syllabics while preserving literal scheme names and
  existing translations. Record lower-confidence terminology and grammar for
  review.
- Hint checks cover 63 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Three locales still need this hint. The broader backlog remains 51,575
  ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6789dc75f9409827e24df51d247af0395490583">Translate URL scheme hint in Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill the English hint in Tifinagh while preserving literal scheme names and
  existing translations. Record lower-confidence terminology and grammar for
  review.
- Hint checks cover 62 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Four locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6e89219ff77ada412054733f7d923b5493bd7a3">Translate URL scheme hint in Nahuatl</a>. Thanks to xet7.</summary>

- Fill the English hint while preserving literal scheme names and existing
  translations. Record lower-confidence regional grammar and technical wording.
- Hint checks cover 61 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Five locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a6d51f5023bb8cbde7766274beec7a5369ea132">Translate URL scheme hint in Klingon</a>. Thanks to xet7.</summary>

- Fill the English hint while preserving literal scheme names and existing
  translations. Record lower-confidence technical phrasing for fluent-speaker
  review.
- Hint checks cover 60 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Six locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc81d9e9995e546996305bd64738282f9414deae">Translate URL scheme hint in Veps and Volapük</a>. Thanks to xet7.</summary>

- Fill two English hints while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording and dictionary
  references.
- Hint checks cover 59 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Seven locales still need this hint. The broader backlog remains 51,575
  ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1d05258ab26319b50f6bd709762c48ba7f8b424">Translate URL scheme hint in Greenlandic and Kashmiri</a>. Thanks to xet7.</summary>

- Fill two English hints while preserving literal scheme names and existing
  translations. Record lower-confidence wording and outstanding mixed-script
  review.
- Hint checks cover 57 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Nine locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/deac86fb7eb6566166345bfc31ba10dbba371172">Translate URL scheme hint in Bambara, Ewe and Fulah</a>. Thanks to xet7.</summary>

- Fill three English hints while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording for native review.
- Hint checks cover 55 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Eleven locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ebdb47beaea5b9b8055a6d3f99eb9f04b0d33f2">Translate URL scheme hint in Tibetan and Dzongkha</a>. Thanks to xet7.</summary>

- Fill two English hints while preserving literal scheme names and existing
  translations. Record lower-confidence URI scheme terminology for native
  review.
- Hint checks cover 52 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Fourteen locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9b1f9330727ae0af6ebcbb97d317b9ca4b68c9f">Translate URL scheme hint in Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill two English hints while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording and regional spelling.
- Hint checks cover 50 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Sixteen locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8fcaf3e0673662b6a80c72863c04ad80312cf4f">Translate URL scheme hint in Buryat, Sakha and Chuvash</a>. Thanks to xet7.</summary>

- Fill three English hints while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording for native review.
- Hint checks cover 48 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Eighteen locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f79e3b437fa552f4e4dc1f5cab46df34e2d4da0">Translate URL scheme hint in Tigrinya, Akan, Wolof and Guarani</a>. Thanks to xet7.</summary>

- Fill four English hints, preserving literal scheme names and existing
  translations.
  Record lower-confidence technical wording and vocabulary references for native
  review.
- Hint checks cover 45 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Twenty-one locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/978296fa9db4a7fe910bb67aff35464fc1b34542">Translate URL scheme hint in Manx and Northern Sami</a>. Thanks to xet7.</summary>

- Fill two hints while preserving literal scheme identifiers and existing
  translations. Lower-confidence technical wording is recorded for native/UI
  review.
- Hint checks cover 41 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Twenty-five locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdaa7d0cb32b0b7240c7b53157358c86de06f4b1">Translate URL scheme hint in Waray and Acehnese</a>. Thanks to xet7.</summary>

- Fill two hints while preserving literal scheme identifiers and existing
  translations. Vocabulary sources and lower-confidence technical wording are
  recorded for native/UI review.
- Hint checks cover 39 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Twenty-seven locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efac273833c35c71082d44441d861f87f213c9e4">Translate URL scheme hint in Venetian, Walloon and Aromanian</a>. Thanks to xet7.</summary>

- Fill three hints while preserving literal scheme identifiers and existing
  translations. Lower-confidence technical wording remains open for native/UI
  review.
- Hint checks cover 37 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Twenty-nine locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca45662e64272098297c25242a93ea7860932e03">Translate URL scheme hint in five Pacific languages</a>. Thanks to xet7.</summary>

- Fill Māori, Samoan, Tongan, Fijian and Hawaiian hints while preserving literal
  scheme identifiers. Lower-confidence wording remains documented for native/UI
  review.
- Hint checks cover 34 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Thirty-two locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2a6a537be11664d1aa5e6aa7844564d1dbae707">Translate URL scheme hint in five more African languages</a>. Thanks to xet7.</summary>

- Fill Kinyarwanda, Kirundi, Luganda, Tsonga and Venda hints while preserving
  literal identifiers. Lower-confidence technical prose remains documented for
  native/UI review.
- Hint checks cover 29 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Thirty-seven locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c84b64379e23ddcc57c3a45c2558e7bd0b756a9">Translate URL scheme hint in southern African locales</a>. Thanks to xet7.</summary>

- Fill eight values in Zulu, Xhosa, North Ndebele, Swati, Southern Sotho, Tswana
  and Northern Sotho locales, preserving literal identifiers. Lower-confidence
  technical wording remains documented for native/UI review.
- Hint checks cover 24 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Forty-two locale paths still need this hint. The ordinary backlog remains
  51,575
  values plus 172 pending source keys; broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27f499c7f8d5ea5b1b55ab168ef13102cc1311b1">Translate URL scheme hint in six further languages</a>. Thanks to xet7.</summary>

- Fill Tok Pisin, Bislama, Papiamento, Somali, Oromo and Nyanja hints while
  preserving literal scheme names. Lower-confidence technical wording remains
  documented for native/UI review.
- Hint checks cover 16 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass. Browser scenarios were syntax-checked but not
  run
  without the application stack.
- Fifty locale paths still need this hint. The ordinary backlog remains 51,575
  values plus 172 pending source keys; broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2e304eb602d8f3fe2920d64d774083fe7ca9c2b">Translate custom URL scheme hint in ten locales</a>. Thanks to xet7.</summary>

- Fill ten Admin Panel hints, preserving the five literal scheme names and the
  distinction between configured application links and permanently blocked
  schemes.
  Lower-confidence technical wording remains documented for native/UI review.
- Positive and negative identifier checks, parser and sanitizer tests,
  all-locale
  structure and human-preference checks pass. Browser scenarios were
  syntax-checked
  but not run without the application stack.
- Fifty-six locale paths still need this hint. The ordinary backlog remains
  51,575
  values plus 172 pending source keys; broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af64e879df1d65195b25b7f09a4a12d755b9fa22">Complete placement label placeholders across locales</a>. Thanks to xet7.</summary>

- Fill the Cherokee and Wolaytta placement labels. Both labels now have distinct
  non-English values in all 234 non-English locale paths. Lower-confidence
  wording
  and native/UI review remain open.
- Discover every locale in the regression suite and verify source tokens and key
  order. Runtime, structural and human-preference checks pass; browser scenarios
  were syntax-checked but not run without the application stack.
- Remove two filled keys from the pending inventory, leaving 172 source keys.
  The ordinary backlog remains 51,575 values across 70 languages; broader
  translation and language-quality work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91054ae84d3b3fca114705dd14b520377043a3ad">Translate placement labels in Nahuatl, Tamazight and Tigre</a>. Thanks to xet7.</summary>

- Fill six placement labels, preserving existing translations. Record vocabulary
  sources and lower-confidence standalone wording for native/UI review.
- Placement checks cover 64 recently filled locales. Runtime, structural and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Cherokee and Wolaytta still need this pair. The ordinary backlog remains
  51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/737de798ce62275269f192e7a69f0b1fc14526a5">Translate placement labels in Dzongkha, Greenlandic and Inuktitut</a>. Thanks to xet7.</summary>

- Fill six spatial placement labels, preserving existing translations. Record
  vocabulary references and lower-confidence standalone wording for native/UI
  review.
- Placement checks cover 61 recently filled locales. Runtime, structural and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Five locale paths still need this pair. The ordinary backlog remains 51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fc66b2b71181bf84a6d9f1b5c5acc8e8cc97223">Translate placement labels in Acehnese, Fula, Guarani and Veps</a>. Thanks to xet7.</summary>

- Fill eight relative-placement labels and preserve existing translations.
  Record vocabulary references and lower-confidence Veps wording for native/UI
  review.
- Placement checks cover 58 recently filled locales. Runtime, structural and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Eight locale paths still need this pair. The ordinary backlog remains 51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88f728a49d83f5835ad1e5cd3f44977f0cecb2ea">Translate placement labels in five further languages</a>. Thanks to xet7.</summary>

- Fill ten Buryat, Chuvash, Yakut, Aromanian and Klingon placement labels,
  preserving existing translations. Record dictionary references and
  native-review
  limitations for standalone UI wording.
- Placement checks cover 54 recently filled locales. Runtime, structural and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Twelve locale paths still need this pair. The ordinary backlog remains 51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba6d41e1e573e772cdd6fa72c930bf85d57c43be">Translate placement labels in 13 more locales</a>. Thanks to xet7.</summary>

- Fill 26 “Before” and “After” labels using spatial terminology. Preserve
  existing
  translations and record vocabulary references. Lower-confidence Aymara,
  Northern
  Sami and Waray wording remains open for native/UI review.
- Placement translation checks cover 49 recently filled locales. Runtime
  selection,
  structural and human-preference checks pass. Browser scenarios were
  syntax-checked
  but not run without the application stack.
- Seventeen locale paths still need these labels. The ordinary backlog remains
  51,575 values plus 174 pending source keys; broader language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e32e50a5e1beb9ba406284ee58b384c4c42d4101">Translate move-position labels in 36 locales</a>. Thanks to xet7.</summary>

- Fill 72 “Before” and “After” labels for relative placement of selected
  objects.
  Preserve existing translations; use spatial placement wording for Wolof.
  Lower-confidence minority-language wording remains recorded for native/UI
  review.
- Selection runtime, translation structure and human-preference checks pass.
  Browser scenarios were syntax-checked but not run without the application
  stack.
- Thirty locale paths still need these labels. The ordinary backlog remains
  51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20c986cc20e9d7d37667288c30dd591f98b68ad3">Complete rule-builder placeholder translations across locales</a>. Thanks to xet7.</summary>

- Fill the seven remaining Cherokee instructions. These seven keys now have
  non-English values in all 234 non-English locale paths. Technical Cherokee
  prose
  has low confidence; native-language and composed UI wording review remains
  open.
- Extend the regression suite to discover every locale and verify exact
  variables,
  source tokens and key order. Runtime, structural and human-preference checks
  pass.
  Browser scenarios were syntax-checked but not run without the application
  stack.
- Remove seven filled keys from the pending inventory, leaving 174 pending
  source
  keys. The ordinary backlog remains 51,575 values across 70 languages; this
  does
  not complete the broader translation and language-quality work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fccbc4ebddd59ff4d30d7d84f367c0818a22edfb">Translate rule-builder instructions in Tigre</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered
  actions. Technical wording has low confidence and needs Tigre speaker review,
  including composed date fragments and trigger terminology.
- Translation checks now cover 65 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run because the application stack was unavailable.
- Cherokee still needs this group. The ordinary backlog remains 51,575 values
  plus
  181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0b3b45fbe0e8d7d17dc8b4b452dc352bea979b0">Translate rule-builder instructions in Wolaytta</a>. Thanks to xet7.</summary>

- Fill seven strings and correct five related prefixed labels, preserving
  literal
  variables, any-trigger behavior and ordered actions. Technical prose has lower
  confidence; terminology and composed date fragments need native/UI review.
- Translation checks now cover 64 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- Two locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15af3c9f521bcee668f9f38405899115812f6b48">Translate rule-builder instructions in Inuktitut</a>. Thanks to xet7.</summary>

- Fill seven strings in syllabics, preserving literal variables, any-trigger
  behavior and ordered actions. Technical prose has lower confidence;
  dialect, inflections and composed date fragments need native/UI review.
- Translation checks now cover 63 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 3 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58c0d84d7ab78bcf1d8e17c256c1f5b99b178ffd">Translate rule-builder instructions in Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill seven strings in Tifinagh, preserving literal variables, any-trigger
  behavior and ordered actions. Technical prose has lower confidence;
  regional usage and composed date fragments need native/UI review.
- Translation checks now cover 62 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 4 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ff08a05979719a908fed919a2f7dafa92aaeefc">Translate rule-builder instructions in Klingon</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence and borrows the software
  word card; grammar and composed date fragments need speaker/UI review.
- Translation checks now cover 61 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 5 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ebae861bea6f307195858a266b7351a12751617">Translate rule-builder instructions in Nahuatl</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; dialect, terminology
  and composed date fragments need native/UI review.
- Translation checks now cover 60 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 6 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93db0b817b0f0e0d498fba462d9c3e775521ab71">Translate rule-builder instructions in Greenlandic</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; terminology,
  inflections
  and composed date fragments need native/UI review.
- Translation checks now cover 59 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 7 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c5ecfcddb253c879d11a097bda8d621b0ff4213">Translate rule-builder instructions in Volapük</a>. Thanks to xet7.</summary>

- Fill seven strings and correct three labels, preserving literal variables,
  any-trigger behavior and ordered actions. Technical prose has lower
  confidence;
  terminology and composed date fragments need speaker/UI review.
- Translation checks now cover 58 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 8 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3009b5267e71b628276e2a38214d954713d3e1b6">Translate rule-builder instructions in Veps</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; terminology,
  inflections
  and composed date fragments need native/UI review.
- Translation checks now cover 57 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 9 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b82329cf185872af19e63d38f6f0cc93fca633f">Translate rule-builder instructions in Fulah</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; dialect, terminology
  and composed date fragments need native/UI review.
- Translation checks now cover 56 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 10 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b44322d5620c748324c978e7620a94a2a2c7820">Translate rule-builder instructions in Guaraní</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; terminology and
  composed date fragments need native/UI review.
- Translation checks now cover 55 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 11 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53c658698d65471604a3d56d5c12f29789f96e25">Translate rule-builder instructions in Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and replace three prefixed English labels.
  Preserve literal variables, any-trigger behavior and ordered actions. Both
  translations have lower confidence and need native/UI terminology review.
- Translation checks now cover 54 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 12 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54a1bf66995a9d143d514421199f111db19d5649">Translate rule-builder instructions in Tigrinya and Kashmiri</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Kashmiri prose has lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 52 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 14 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed136c7037db96dcfd842e351d0518ca4b971b48">Translate rule-builder instructions in Tibetan and Dzongkha</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Both translations have lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 50 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 16 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/013b40fa0751f8d03cabf6fabc6dfb3e8094568e">Translate rule-builder instructions in Northern Sámi and Acehnese</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Both translations have lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 48 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 18 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e825c8e1dd81eba327ad97d57bb83af7a8e686ba">Translate rule-builder instructions in Chuvash and Venda</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and correct three Nguni seed labels in
  Venda.
  Preserve literal variables, any-trigger behavior and ordered actions. Both
  translations have lower confidence and need native/UI terminology review.
- Translation checks now cover 46 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 20 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04719178b320467b8317b695be40effa0101399b">Translate rule-builder instructions in Buryat and Sakha</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Both translations have lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 44 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 22 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ceca0364750ba85e78b79efe6d4f8952ec80770d">Translate rule-builder instructions in Aromanian and Venetian</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and correct five wrong-language labels.
  Preserve literal variables, any-trigger behavior and ordered actions.
  Aromanian
  prose has lower confidence; both locales need native/UI terminology review.
- Translation checks now cover 42 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 24 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73af562b00b75c2eb5a05e059bbf1d957a469702">Translate rule-builder instructions in Bambara and Ewe</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Both translations have lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 40 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 26 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04b3ad18b93ef3e331bb5bbc9d7e8a7299e53ec2">Translate rule-builder instructions in Luganda and Wolof</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and replace Luganda's English trigger label.
  Preserve literal variables, any-trigger behavior and ordered actions.
  Technical
  prose has lower confidence and needs native/UI review.
- Translation checks now cover 38 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 28 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/808829a9dc4d2fbe1c10773262fa5d012a88603e">Translate rule-builder instructions in Waray and Akan</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and replace three wrong-language Waray
  labels.
  Preserve literal variables, any-trigger behavior and ordered actions. Akan
  technical prose has lower confidence and needs native/UI review.
- Translation checks now cover 36 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 30 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d9a2451635ed56b8cccc40b3e3923af0315eed3">Translate rule-builder instructions in Manx and Walloon</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Manx prose has lower confidence; technical terms
  and composed date fragments need native/UI review.
- Translation checks now cover 34 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 32 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df715c24385d9b169a3e5224213714ec37b20b55">Translate rule-builder instructions in Oromo, Fijian and Tongan</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and replace two prefixed English Tongan
  labels.
  Preserve literal variables, any-trigger behavior and ordered actions. Fijian
  and
  Tongan technical prose has lower confidence and needs native/UI review.
- Translation checks now cover 32 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 34 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a87d0a82d6278449f01fedb4eb3cb10beae43a93">Translate rule-builder instructions in Northern Ndebele, Swati, Northern Sotho and Tsonga</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Northern Ndebele and Swati prose has
  lower confidence; terminology and date fragments need native/UI review.
- Translation checks now cover 29 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 37 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e2d9d4ff7168de793af61c92b79e65a9fb11056">Translate rule-builder instructions in Moroccan Arabic and Yiddish</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Correct three Persian seed labels in
  Moroccan Arabic. Technical terms, date fragments and RTL display need
  native/UI review.
- Translation checks now cover 25 recently filled locales and the corrected
  labels.
  Runtime variable, all-locale structural and human-preference checks pass.
  Browser
  scenarios were not run; the app stack was unavailable.
- 41 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56c95029c051b6b5b1bf66dc3642992f720b1200">Translate rule-builder instructions in Odia and Konkani</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Konkani prose has lower confidence;
  technical terms and composed date labels need native/UI review.
- Translation checks now cover 23 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 43 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/132706de4f2998c68727889325a1bec8c3503a15">Translate rule-builder instructions in Bhojpuri and Maithili</a>. Thanks to xet7.</summary>

- Fill seven strings in two locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Technical terms and composed date
  labels
  need native/UI review.
- Translation checks now cover 21 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 45 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abde97a3de219c08e9f012237c98b25058bfac55">Translate rule-builder instructions in Kinyarwanda, Kirundi and Chichewa</a>. Thanks to xet7.</summary>

- Fill seven strings in three locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Technical terms and composed date
  labels
  need native/UI review, especially the Kirundi phrases.
- Translation checks now cover 19 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 47 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ce1dfb0185174ded494e5eeffbb5acbe9fed252">Translate rule-builder instructions in Sesotho and Setswana</a>. Thanks to xet7.</summary>

- Fill seven strings in two locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Technical phrases and composed date
  labels have lower confidence and need native/UI review.
- Translation checks now cover 16 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 50 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3edf06cee81ae2dc0f5b4aee4fd08778eee3be48">Translate rule-builder instructions in Zulu and Xhosa</a>. Thanks to xet7.</summary>

- Fill seven strings in zu, zu-ZA and xh, preserving literal variable
  expressions,
  any-trigger behavior and ordered actions. Trigger wording and composed date
  labels
  need native/UI review; the audit records Xhosa's existing swimlane
  inconsistency.
- Translation checks now cover 14 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 52 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8928e1510ea663d1f942c6ab4badcabb21e2ff57">Translate rule-builder instructions in Māori, Samoan and Hawaiian</a>. Thanks to xet7.</summary>

- Fill seven strings in three locales, preserving literal variable expressions
  and
  date-condition selector meaning. Samoan and Hawaiian phrases and technical
  terms
  are lower confidence; native/UI review remains open.
- Translation checks now cover 11 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 55 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b28b6f6c92b52a0adefbaf07f06649f7307b4a9">Translate rule-builder instructions in Tok Pisin and Bislama</a>. Thanks to xet7.</summary>

- Fill seven strings in two locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Trigger wording, recipient labels
  and
  composed date-condition fragments need native/UI review.
- Translation checks now cover eight recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 58 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c2fe314e5295d9587a0345cd775cf390e7e8b8e">Translate rule-builder instructions in Kurdish, Sorani and Papiamento</a>. Thanks to xet7.</summary>

- Fill seven strings in three locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Date-condition fragments and trigger
  terminology need native/UI review.
- Translation checks now cover six recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 60 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4beb5559b169df98373b426f3df0afc6f841571">Translate rule-builder instructions in Turkmen, Tatar and Somali</a>. Thanks to xet7.</summary>

- Fill seven strings in three locales, preserving literal rule-variable
  expressions.
  Trigger/swimlane terminology and composed date-condition labels need native/UI
  review.
- Extend trigger-variable tests to compare brace-token inventories and reject
  renamed
  examples. Runtime variable tests, all-locale structural and human-preference
  checks
  pass. The browser scenario was syntax-checked only; the app stack was
  unavailable.
- 63 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ab30ce556980bdb6aad10772bc23cbfc768d60c">Fill remaining SAML errors and reconcile all-locale coverage</a>. Thanks to xet7.</summary>

- Fill Tigre and Cherokee placeholders. Full phrases are low confidence;
  Cherokee
  retains borrowed browser/tab labels. Native terminology and grammar review
  remains.
- All 234 non-English locale paths have nonempty values different from English
  with
  exact placeholders for this message. Remove its pending entry, leaving 181
  keys.
  These checks establish coverage, not fluency or correct-language text.
- Popup-error tests pass, including positive and negative login-boundary cases
  and
  detailed translation checks for 66 recently filled locales. All-locale
  structural
  and human-preference checks pass. Browser scenarios were not run; the app
  stack
  was unavailable.
- The ordinary backlog remains 51,575 values in 70 languages. Wider
  language-quality
  review remains in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6023f4a7e86ac38184d000e49693eeda8dad0606">Translate SAML error into Nahuatl and Tamazight</a>. Thanks to xet7.</summary>

- Fill the message in nah and zgh without overwriting translations. Full phrases
  and browser-tab terminology are low confidence and need native review.
- Popup-error tests now check 64 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Tigre and Cherokee still need this message. The ordinary backlog remains
  51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c75ebfb88df1b194edd03da6228ecfb96f36162">Translate SAML error into Greenlandic and Inuktitut</a>. Thanks to xet7.</summary>

- Fill the message in kl and iu without overwriting translations. Full phrases
  and browser-tab terminology are low confidence and need native review.
- Popup-error tests now check 62 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Four locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3e9c342dda5505aea152b218f97f4db166df481">Translate SAML error into Veps and Wolaytta</a>. Thanks to xet7.</summary>

- Fill the message in ve-PP and wal without overwriting translations. Full
  phrases
  and browser-tab terms are low confidence and need native review.
- Popup-error tests now check 60 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Six locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fb61838b9cbd932ea9da6d6547bd704b6f66291">Translate SAML error into Volapük and Klingon</a>. Thanks to xet7.</summary>

- Fill the message in vo and tlh without overwriting translations. Full phrases
  are low confidence; Klingon browser and tab terms remain borrowed and need
  review.
- Popup-error tests now check 58 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Eight locale paths still need this message. The ordinary backlog remains
  51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afd51d4b50431e28287348a414b797d240ce04bd">Translate SAML error into Quechua, Aymara, Guarani and Fulah</a>. Thanks to xet7.</summary>

- Fill the browser-tab message in qu, ay, gn and ff without overwriting
  translations.
  Full phrases and browser-tab terminology are low confidence and need native
  review.
- Popup-error tests now check 56 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Ten locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e188bb0f89460ca3684a531d63eed9ba7d41fe3d">Translate SAML browser-tab error in five more locales</a>. Thanks to xet7.</summary>

- Fill the message in ace, bo, dz, ti and ks without overwriting translations.
  Browser-tab terminology and full Acehnese and Dzongkha phrases are low
  confidence
  and need native review.
- Popup-error tests now check 52 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- 14 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec117c6246ad0acb6404619f1f157da1300adb22">Translate SAML browser-tab error in seven more locales</a>. Thanks to xet7.</summary>

- Fill the message in rup, ve-CC, bua, sah, cv, ve and se without overwriting
  translations. Aromanian phrases and browser-tab terminology are low confidence
  and need native review.
- Popup-error tests now check 47 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- 19 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c53be38b0094ca91b90b90963b3a545640cea254">Translate SAML browser-tab error in eight more locales</a>. Thanks to xet7.</summary>

- Fill the message in gv, wa, wa-RR, ak, lg, bm, wo and ee without overwriting
  translations. Manx and Walloon phrases and browser/tab terminology are low
  confidence and need native review.
- Popup-error tests now check 40 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- 26 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b25eeeb5398b10ae30163c2e28885f704120acd">Translate SAML browser-tab error in 13 more locales</a>. Thanks to xet7.</summary>

- Fill the message in bho, mai, or_IN, kok, ary, yi, nd, ss, nso, ts, om, fj and
  to.
  Preserve existing translations. Browser/tab terminology in the southern
  African,
  Oromo, Fijian and Tongan phrases is lower confidence and needs native review.
- Popup-error tests now check 32 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- 34 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8096c6976dcbdae6da92b7251eab7cb0b107efaf">Translate SAML browser-tab error in 19 locales</a>. Thanks to xet7.</summary>

- Explain that SAML sign-in was not started in this browser tab and ask the user
  to sign in again. Preserve existing translated values. Pacific and southern
  African browser-tab terminology has lower confidence and needs native review.
- Popup-error, replay-boundary, all-locale structural and human-preference
  checks
  pass. The replay test required loopback permission. Existing browser scenarios
  were syntax-checked only; the app stack was unavailable.
- 47 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1f411e1a55323995f4796d225f6abf7ba6d4877">Translate Cherokee reminders and reconcile all-locale coverage</a>. Thanks to xet7.</summary>

- Fill six Cherokee reminder strings. Full phrases and technical terminology are
  low confidence and need native review.
- All 234 non-English locale paths now contain nonempty, non-English values with
  exact source placeholders for the six reminder keys. Remove these keys from
  the
  pending queue, leaving 182. This structural coverage does not certify fluency.
- Translation, all-locale structural and human-preference checks pass; detailed
  reminder checks cover 66 locales. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- The ordinary backlog remains 51,575 values in 70 languages. Wider
  language-quality
  review, including low-confidence reminder phrases, remains in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/256a6b36cf8df7ac42ec1ca33481582a4c8c239c">Translate due reminders into Tigre</a>. Thanks to xet7.</summary>

- Fill six English placeholders, retaining signed offsets, server defaults,
  whole-day bounds, the ten-entry limit and outgoing webhook delivery. Full
  phrases
  and technical terms are low confidence and need native review.
- Reminder checks now cover 65 translated locales. Translation, all-locale
  structural
  and human-preference checks pass. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- Cherokee still needs this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc84805547893f3340156980a71e2646f191d26b">Translate due reminders into Wolaytta</a>. Thanks to xet7.</summary>

- Fill six English placeholders, retaining signed offsets, server defaults,
  whole-day bounds, the ten-entry limit and outgoing webhook delivery. Full
  phrases
  and technical terms are low confidence and need native review.
- Reminder checks now cover 64 translated locales. Translation, all-locale
  structural
  and human-preference checks pass. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- Two locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8924e8c936c50330950ebb4c5623feb69594078a">Translate due reminders into Inuktitut</a>. Thanks to xet7.</summary>

- Fill six English placeholders, retaining signed offsets, server defaults,
  whole-day bounds, the ten-entry limit and outgoing webhook delivery. Full
  phrases
  and technical terms are low confidence and need native review.
- Reminder checks now cover 63 translated locales. Translation, all-locale
  structural
  and human-preference checks pass. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- Three locale paths still need this reminder group. The ordinary backlog
  remains
  51,575 values plus 188 pending source keys; wider language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5f345f6cf1ac4cb52a979ee35685aa7fd874421">Translate due reminders into Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill six English placeholders in Tifinagh, retaining signed offsets, server
  defaults, whole-day bounds, the ten-entry limit and webhook delivery. Full
  phrases
  and technical terms are low confidence and need native review.
- Reminder checks now cover 62 translated locales. Translation, all-locale
  structural
  and human-preference checks pass. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- Four locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b5d755ae6ab68db22faddcf79a56eb8a92d267d">Translate due reminders into Veps</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Full Veps phrases and technical
  terms are low confidence and need native review.
- Translation checks and existing browser scenarios now cover 61 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- Five locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e13b997904dc7b61243cba2477a350ca7be95be8">Translate due reminders into Nahuatl</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions,
  comparisons
  and technical compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 60 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 6 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89b573a778bba327386685cab662ffabe52ee384">Translate due reminders into Greenlandic</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions,
  inflections
  and technical compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 59 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 7 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef61b69b8d64c71de606920d5dfbe07de4bea1e4">Translate due reminders into Klingon</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions,
  comparisons
  and technical compounds remain low-confidence drafts for fluent-speaker
  review.
- Translation checks and existing browser scenarios now cover 58 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 8 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bedd51e10052768bec7a25d7f8cded7c544a3c2">Translate due reminders into Volapük</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for fluent-speaker review.
- Translation checks and existing browser scenarios now cover 57 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 9 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c092aabc2ec9be4fa60a20ccc6a4b73df433f16a">Translate due reminders into Fulah</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review, including dialect
  consistency.
- Translation checks and existing browser scenarios now cover 56 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 10 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14ce70fe73d04392a32b870bb014ef8d2c914685">Translate due reminders into Guarani</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 55 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 11 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a434d1b4de83a8fbcc41b692d60063813350dfbe">Translate due reminders into Aymara</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 54 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 12 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/229ef7bbcb4c3b23a23cf39b7d244bd3b52bbba1">Translate due reminders into Quechua</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review, including dialect
  consistency.
- Translation checks and existing browser scenarios now cover 53 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 13 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7816d3e4c4bd465a0fc53429642700e539797b7">Translate due reminders into Kashmiri</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 52 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 14 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b2dd52c71d5310779d3dd088b5adef9700b1a5b">Translate due reminders into Tigrinya</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds remain
  open to native review.
- Translation checks and existing browser scenarios now cover 51 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 15 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/887f1a1a2ac2a10844f034c18670819125866fe1">Translate due reminders into Dzongkha</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 50 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 16 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/867440826636394dd3d2ea7c2a373e1a4d820cba">Translate due reminders into Tibetan</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds remain
  open to native review.
- Translation checks and existing browser scenarios now cover 49 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 17 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/981101ab212933bf14b03afe2e23279dea608b26">Translate due reminders into Acehnese</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 48 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 18 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/885ceae2337f70518098f71fe90f3daf44842737">Translate due reminders into Northern Sámi</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Full instructions and technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 47 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 19 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6a880f1bb81f898df76b9e459746714e5ae789d">Translate due reminders into Venda</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds remain
  low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 46 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 20 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7d1033d265bc1c7c3a02d26a241d0e770318a37">Translate due reminders into Chuvash</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Full instructions and technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 45 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 21 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76eeac26a5549660fd14e1ba6f19293dccb511ae">Translate due reminders into Buryat and Sakha</a>. Thanks to xet7.</summary>

- Fill 12 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Full instructions and technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 44 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 22 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/135341a09ee19ad1ec1d445f4f58d80078c91fd0">Translate due reminders into Aromanian and Venetian</a>. Thanks to xet7.</summary>

- Fill 12 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Aromanian instructions and
  technical compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 42 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 24 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/876845a7212e4d42b9ddaed41da30478bc47498b">Translate due reminders into Bambara, Wolof and Ewe</a>. Thanks to xet7.</summary>

- Fill 18 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 40 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 26 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c1d3f0d4a3806c97db18ccbf3ba5fbe34f7fe16">Translate due reminders into Akan and Luganda</a>. Thanks to xet7.</summary>

- Fill 12 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds remain
  low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 37 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 29 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8ca9e47da038103faf5ba70de9064c30111c39c">Translate due reminders into Manx, Walloon and Waray</a>. Thanks to xet7.</summary>

- Fill 18 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds and
  complete
  Manx and Walloon instructions remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 35 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 31 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6690139f10762471b6d372b0efa8083d6b1768b">Translate due reminders into Oromo, Fijian and Tongan</a>. Thanks to xet7.</summary>

- Fill 18 strings, retaining signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds and
  complete
  Fijian and Tongan instructions remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 32 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 34 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae2860bac58f2a04d122b5ec8b76d6dd85c5c59f">Translate due reminders into Northern Ndebele, Swati, Northern Sotho and Tsonga</a>. Thanks to xet7.</summary>

- Fill 24 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Northern Ndebele and Swati
  instructions and technical compounds remain low-confidence drafts for native
  review.
- Translation checks and existing browser scenarios now cover 29 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 37 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11a85ea77216420b5115627ef6191ce51a60ca6d">Translate due reminders into Moroccan Arabic and Yiddish</a>. Thanks to xet7.</summary>

- Fill 12 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery.
- Translation checks and existing browser scenarios now cover 25 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 41 locale paths still need these reminder strings. The ordinary backlog
  remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16f5a92edbfd7cb00f9410be7db090944facd045">Translate due reminders into Bhojpuri, Maithili, Odia and Konkani</a>. Thanks to xet7.</summary>

- Fill 24 strings, preserving offset direction, comma separation, numeric limits
  and blank/server fallback without overwriting existing translations.
- Translation checks and existing browser scenarios now cover 23 locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Forty-three locale paths still need this six-key group. The ordinary backlog
  remains 51,575 values plus 188 pending source keys; wider review stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b05e65ac097db446bb11cfb2cca5508816df72a6">Translate due reminders into Kinyarwanda, Kirundi and Chichewa</a>. Thanks to xet7.</summary>

- Fill 18 strings, preserving offset direction, comma separation, numeric limits
  and blank/server fallback without overwriting existing translations.
- Translation checks and existing browser scenarios now cover 19 locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Forty-seven locale paths still need this six-key group. The ordinary backlog
  remains 51,575 values plus 188 pending source keys; wider review stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cb537180e4029859f64e86c331ee89a05861988">Translate due reminders into Zulu, Xhosa, Sesotho and Setswana</a>. Thanks to xet7.</summary>

- Fill 30 strings across five locale paths, including both Zulu files,
  preserving
  offset direction, comma separation, numeric limits and blank/server fallback.
- Translation checks and existing browser scenarios now cover 16 locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Fifty locale paths still need this six-key group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider review stays in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/590f813fdeb25886d1febc91798d1c765d5525e9">Translate due reminders into Māori, Samoan and Hawaiian</a>. Thanks to xet7.</summary>

- Fill 18 due-reminder strings, preserving offset direction, comma separation,
  numeric limits and blank/server fallback without overwriting existing
  translations.
- Translation checks and existing browser scenarios now cover 11 locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Fifty-five locales still need this six-key group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider review stays in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4becd76fa0008e7d540972262429c314041bc996">Translate due reminders into five more languages</a>. Thanks to xet7.</summary>

- Fill 30 strings in Kurdish, Sorani, Papiamento, Tok Pisin and Bislama,
  preserving
  signed offset directions, comma separation, numeric limits and server
  fallback.
- Translation checks and existing browser scenarios now cover eight locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Fifty-eight locales still need this six-key group. The ordinary backlog
  remains
  51,575 values plus 188 pending source keys; wider review stays in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ba3f9fc23f24237fd28a1250f257678a9046365">Translate due reminders into Turkmen, Tatar and Somali</a>. Thanks to xet7.</summary>

- Fill 18 due-reminder strings in three locales, preserving positive-before and
  negative-after offsets, comma separation, blank/server fallback and numeric
  limits.
- Add translation checks and extend the existing board-reminder UI test for
  translated labels and saved/error feedback. Translation, all-locale and
  human-preference checks pass; browser coverage is syntax-checked only because
  its application stack was unavailable.
- Another 63 locales need this six-key group. The ordinary backlog remains
  51,575
  values plus 188 pending source keys; wider translation review stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b77648b8fd24302c5356c0e3fb58a9fa3d4e7a19">Reconcile filled notification keys with translation backlog</a>. Thanks to xet7.</summary>

- Remove 13 activity-notification keys from the pending manifest after checking
  all 234 non-English locale paths for nonempty values, no exact English
  placeholders and preserved source tokens. Add regression coverage for queue
  removal.
- Pending source keys decrease from 201 to 188. The ordinary backlog remains
  51,575 values. Low-confidence wording and language review remain in TODO
  Later;
  these structural checks do not establish fluency.
- Notification, all-locale, human-preference and changelog checks pass. The next
  feature group has six due-reminder strings still English in 66 locales.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5818255c9ab38bab1f55084e893d783eae414d9">Translate Cherokee notification settings and check all locales</a>. Thanks to xet7.</summary>

- Fill 13 Cherokee notification strings with provisional wording; document
  reference limitations and fluent-speaker review needs in
  `docs/Features/Translations/Audit.md`.
- All 234 non-English locale paths now pass checks for nonempty values, no exact
  English placeholders and preserved tokens in this group. Detailed notification
  coverage includes 66 locales. Human-preference and all-locale checks pass;
  browser coverage is syntax-checked only because its application stack is
  unavailable.
- Language-quality review and the wider translation backlog remain in TODO
  Later.
  The ordinary count is still 51,575 values plus 201 pending source keys; this
  group's pending manifest entries still need reconciliation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7138ed19e0c2d7371256b7781b58b4405f1f7345">Translate Tigre notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Tigre notification strings while preserving existing translations.
  Record low-confidence wording, reference limits and possible Tigrinya
  influence
  in the broader locale in `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 65 locales. Notification, script,
  all-locale structure/token and human-preference checks pass. Browser coverage
  is syntax-checked only; its application stack was unavailable.
- Cherokee still needs this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56fd350ada934e8a6833833b1867d43e2b0ca64f">Translate Wolaytta notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Wolaytta notification strings while preserving existing translations.
  Document terminology references and low-confidence wording in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 64 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage was
  syntax-checked only because its application stack was unavailable.
- Two locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/360ffe7c50171401a27c492d0bb795dfde1a581d">Translate Inuktitut notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Inuktitut notification strings in syllabics without overwriting
  existing
  translations. Record sources and low-confidence wording in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 63 locales. Notification, syllabic,
  all-locale structure/token and human-preference checks pass. Browser coverage
  is syntax-checked only; its application stack was unavailable.
- Three locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdf21e4dbb975b3939ac53a67e5279da6e5642b4">Translate Tamazight notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Standard Moroccan Tamazight notification strings in Tifinagh without
  overwriting existing translations. Record low-confidence wording and
  vocabulary
  references in `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 62 locales, with Tifinagh checks for
  this batch. Notification, all-locale structure/token and human-preference
  checks
  pass. Browser coverage is syntax-checked only; its application stack was
  unavailable.
- Four locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54f5243cc81fa118dd455d484c26d004bc19845f">Translate Veps notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Veps notification strings without overwriting existing translations.
  Record vocabulary references and low-confidence technical wording in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 61 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage was
  syntax-checked only because its application stack was unavailable.
- Five locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17f85c385ce244e086aa31cf17dad7407905a906">Translate Nahuatl notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Nahuatl notification strings without overwriting existing
  translations.
  Document vocabulary references and low-confidence technical wording in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 60 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage was
  syntax-checked only because the application stack was unavailable.
- Six locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c365d77492115d4d519b0b23a886446e59dea4d">Translate Greenlandic notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Greenlandic notification strings, preserving existing translations and
  source tokens. Vocabulary sources and low-confidence wording are documented in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 59 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage was
  syntax-checked only; the application stack was unavailable.
- Seven locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a2fa65863a597f12f20373d749ea5168f4627e2">Translate Klingon notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Klingon notification strings and replace the French assignee label.
  Preserve source keys and tokens; record low-confidence technical wording and
  dictionary references in `docs/Features/Translations/Audit.md`.
- Notification coverage now includes 58 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage is
  syntax-checked only; its application stack was unavailable.
- Eight locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; the remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96aa165b5d4333268e577f677d9fed81ce7d5ebc">Translate Volapük notification settings</a>. Thanks to xet7.</summary>

- Fill 13 notification preferences in Volapük and replace the Esperanto member
  label with Volapük. Record provisional technical vocabulary in
  `docs/Features/Translations/Audit.md` for fluent-speaker review.
- Shared notification checks now cover 57 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage is
  registered
  and syntax-checked, but the browser stack was unavailable for execution.
- The standard backlog remains 51,575 values plus 201 pending source keys;
  these notification strings belong to the pending group. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb30d42396363aeb3ef07711fb395c69fc856dc0">Translate Fulfulde notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 56 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording and dialect consistency are low
  confidence pending speaker review; references and limits are in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d082f1d54fec4f285d1b056b22bd11a6d31ccd0a">Translate Guaraní notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 55 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is low confidence pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e779130f228e0c88429c7d5c5a08310a4fbcf05c">Translate Quechua and Aymara notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 54 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording and dialect consistency are low
  confidence pending speaker review; references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7542d278a6c0dbda63617921278808a6bf987311">Translate Kashmiri notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 52 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording and diacritics are low confidence
  pending speaker review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/136928499c46666c85087b89f14465799e80051f">Translate Tigrinya notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 51 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is provisional pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6839432bfc15a4182bc731f009adc3e046e9cab">Translate Dzongkha notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 50 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is low confidence pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/161bca4aab0a27fea791766252cfc6076684c465">Translate Tibetan notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 49 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is provisional pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96c33f68d5e0337a9fcf1826fa16f6c26b21fc95">Translate Acehnese notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 48 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is low confidence pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9a183544df25ff9bdf0d38a777edcffb625558f">Translate Northern Sámi notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders in Northern Sámi, preserving existing
  translations and the reminder/@mention exception to muting.
- Shared notification coverage now checks 47 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28fad83e87abe12839b84674f5b5db800589b3a2">Translate Venda and Venetian notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders across Venda and Venetian, preserving the
  reminder/@mention exception. Correct six Zulu/Afrikaans labels in Venda.
  The registry identifies `ve-CC` as Venetian and `ve-PP` as Veps.
- Shared notification coverage now checks 46 locales and rejects the six
  old wrong-language labels. Feature, all-locale structure and human-preference
  checks pass. Browser scenarios are syntax-checked only. Technical wording
  is low confidence pending speaker review; references are in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c3b630cec187a3dd64afd7e6ccf5a0f9786d04f">Translate Buryat, Sakha and Chuvash notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders across Buryat, Sakha and Chuvash, preserving
  existing translations and the reminder/@mention exception to muting.
- Shared notification coverage now checks 44 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33831dc768fe6618d0545641e9a7598606b73bb4">Translate Aromanian notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders in Aromanian, preserving existing translations
  and the reminder/@mention exception to muting.
- Shared notification coverage now checks 41 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91c6e2ec7e719cc28c956e4b19042e464a00752e">Translate Wolof and Ewe notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders across Wolof and Ewe, preserving existing
  translations and the reminder/@mention exception to muting.
- Shared notification coverage now checks 40 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/173ce86ceb83a4dabbc5e8a5b16258084914632a">Translate Akan, Luganda and Bambara notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders across Akan, Luganda and Bambara, preserving
  existing translations and the reminder/@mention exception to muting.
- Shared notification coverage now checks 38 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d2b5f717c9dc847cf1e0ff18b75b91f668ba27d">Translate Manx, Walloon and Waray notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders across Manx, Walloon and Waray-Waray.
  Preserve existing translations and the reminder/@mention exception.
  The registry identifies `wa-RR` as Waray-Waray, distinct from Walloon.
- Shared notification coverage now checks 35 locales. Feature, all-locale
  structure and human-preference checks pass; browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; references are recorded in the translation audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/279fbe4c5eef0286626fe31aa53a5841f3ca608f">Translate Oromo, Fijian and Tongan notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 32 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new strings; syntax checks pass, but browser execution was unavailable.
  Provisional technical wording is documented for speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e656bc76aa9db465990a0927c4a81287f3939924">Translate Northern Sotho and Tsonga notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 29 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new strings; syntax checks pass, but browser execution was unavailable.
  Provisional technical wording is documented for speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14be365fbc92b174de3b99d4072424f1e830589c">Translate Yiddish, Northern Ndebele and Swati notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 27 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new strings; syntax checks pass, but browser execution was unavailable.
  Provisional technical wording is documented for speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f21598c8466bae12ac009b75151169a7412fb78">Translate Konkani and Moroccan Arabic notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 24 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new labels and explanations; syntax checks pass, but browser execution
  was unavailable. Technical wording remains open to speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cdbc0b985c1e077e83b96ae8911ed0ccc57d1e6">Translate Bhojpuri, Maithili and Odia notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 22 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new labels and explanations; syntax checks pass, but browser execution
  was unavailable. Technical terminology remains open to speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f1c4f8f97a6c832a0824dadba0b978fb9c1e9ca">Translate Kinyarwanda, Kirundi and Chichewa notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when muting activity categories.
- Extend shared feature coverage to 19 locales. Feature, locale structure
  and human-preference checks pass. The browser mute/unmute scenario checks
  all new labels and explanations; syntax checks pass, but browser execution
  was unavailable. Technical terminology remains open to speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01d5eb0002553a7613376b793fe50d56ba87278f">Translate notification preferences into eight more locales</a>. Thanks to xet7.</summary>

- Fill 104 English placeholders in Māori, Samoan, Hawaiian, both Zulu
  locales, Xhosa, Sesotho and Setswana. Preserve existing translations and
  clarify that reminders and @mentions continue when a category is muted.
- Extend shared feature coverage to 16 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new labels and descriptions; syntax checks pass, but browser execution
  was unavailable. Technical terminology remains open to speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06000469c2842d815bf6338bfa426607eb4b8323">Translate activity notifications into five more languages</a>. Thanks to xet7.</summary>

- Fill 65 English placeholders in Kurmanji, Sorani, Papiamento, Tok Pisin
  and Bislama. Preserve existing translations and explain that reminders
  and @mentions continue when an activity category is muted.
- Extend the shared translation suite to eight locales. Feature, locale
  structure and human-preference checks pass. The browser mute/unmute
  scenario checks all new labels and explanations; syntax checks pass,
  but browser execution was unavailable.
- All values belong to separately tracked pending source keys. The standard
  51,575-value backlog is unchanged; remaining languages and terminology
  review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36be01e480044b8238ad6bc8518bb68654e5f681">Translate activity notification settings into three languages</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders in Turkmen, Tatar and Somali. Clarify that
  unchecking a category stops bell/email notifications while due-date
  reminders and @mentions continue. Distinguish members from assignees.
- Add feature coverage for the 13 messages per language. Translation,
  locale structure and human-preference checks pass. The existing browser
  mute/unmute scenario checks the translated strings; syntax checks pass,
  but browser execution was unavailable.
- These values belong to separately tracked pending source keys, so the
  standard 51,575-value backlog is unchanged. Other languages and the
  broader wording audit remain open in TODO Later.

</details>

**Archiving and date filters** - guidance for inactive cards and time ranges.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48737eb6aff070e26ced0c64cf1f3d01578e9acf">Fill Cherokee archiving translations and verify every locale</a>. Thanks to xet7.</summary>

- Fill the remaining 23 Cherokee English placeholders. All 234 non-English
  locale paths now contain non-English values for the 23-message feature
  group; the three auto-archive keys leave the pending queue.
- Expand the shared suite to discover all locales, compare equivalent
  native decimal digits, and preserve exact placeholder/query syntax.
  Feature, locale structure, human-preference and related Cherokee checks
  pass. Browser coverage includes Cherokee and is syntax-checked only.
- Cherokee technical grammar remains low confidence pending speaker review.
  Audit notes distinguish coverage from language quality. The standard
  backlog is 51,575 values, plus 201 separately tracked source keys; the
  wider translation and semantic audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86ab777a6aebdfb9d6a5bf3764d9a8771534a82f">Translate Inuktitut archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders with syllabic prose, preserving existing
  translations, exact tokens, numbers and query examples. Audit notes
  record vocabulary references and low-confidence wording for review.
- Extend feature coverage to 68 locales. Feature, script, locale structure,
  Inuktitut progress/list-width and human-preference checks pass. The
  browser mutation scenario includes Inuktitut and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/278be5039212d150e7f1f1e395bdfd31b53dce82">Translate Wolaytta archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders and repair three English-prefixed time
  labels. Preserve existing feature translations, exact tokens, numbers
  and query examples. Audit notes record sources and low-confidence wording.
- Extend shared feature coverage to 67 locales. Feature, locale structure,
  Wolaytta progress/list-width and human-preference checks pass. The browser
  mutation scenario includes Wolaytta and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ada662a24a917e2e3aee52c7a99016759953bc93">Translate Tamazight archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders with Tifinagh prose, preserving existing
  translations, numbers, exact tokens and query examples. Audit notes
  record vocabulary evidence and low-confidence wording for review.
- Extend feature coverage to 66 locales. Feature, script, locale structure,
  list-width and human-preference checks pass. The Tamazight browser
  mutation scenario is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7fc494025007d6872fd628a5f37cf19173d65956">Translate Tigre archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders while preserving existing translations,
  numbers, exact tokens and query examples. Audit notes record vocabulary
  evidence and low-confidence grammar requiring speaker review.
- Extend feature coverage to 65 locales. Feature, locale structure,
  Tigre progress/date and human-preference checks pass. The browser
  mutation scenario includes Tigre and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07f20cf87925b9445fefb147a50abcf781960628">Translate Dzongkha archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders while preserving existing translations,
  numeric bounds, placeholder tokens and literal query examples. Audit
  notes record vocabulary references and low-confidence wording for review.
- Extend feature coverage to 64 locales. Feature, locale structure,
  Dzongkha progress and human-preference checks pass. The browser mutation
  scenario includes Dzongkha and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a17ee898e6a0087084b60dc13c6cd90d08c368c">Translate Greenlandic archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders while preserving existing translations,
  numeric bounds, exact placeholders and literal query examples. Audit
  notes record vocabulary evidence and low-confidence wording for review.
- Extend feature coverage to 63 locales. Feature, locale structure,
  Greenlandic progress/calendar and human-preference checks pass. The
  browser mutation scenario includes Greenlandic and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c4176bcbfd1c3e75d8ebd7633e5ab423783915f">Translate Nahuatl archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders, preserving existing translations, exact
  placeholder tokens, numbers and literal query examples. Audit notes
  record vocabulary sources, loans and low-confidence dialect/grammar
  choices requiring speaker review.
- Extend shared feature coverage to 62 locales. Feature, locale structure,
  list-width and human-preference checks pass. The Nahuatl browser mutation
  scenario passes syntax checking only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59c0b6a8d8e664ecb13e2faef3f871ffc28cecab">Translate Volapük archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders and correct date/week/month labels. Keep
  exact placeholder tokens, numbers and literal query examples. Audit
  notes record dictionary evidence and low-confidence wording for review.
- Extend feature coverage to 61 locales. Feature, locale structure,
  related language and human-preference checks pass. The browser mutation
  scenario includes Volapük and passes syntax checking only.
- The standard backlog falls by 20 values; three auto-archive values belong
  to separately tracked pending keys. Further translation and language
  quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/960f063bb321bd71c8f978d017b49ae3ce965346">Translate Sakha archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders while preserving existing translations,
  numeric bounds, placeholder tokens and literal query examples. Audit
  notes record vocabulary sources and low-confidence wording for review.
- Extend the feature suite to 60 locales. Feature, locale structure and
  human-preference checks pass. The Sakha browser mutation scenario is
  syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to the separately counted pending keys. The broader translation
  and language-quality audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c44005eb8462271a0a86fd3a1507e0e20b28911">Translate Acehnese and Bambara archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 46 English placeholders and replace the Indonesian days label in
  Acehnese with `uroe`. Preserve exact placeholders, numeric bounds and
  query examples. Audit notes record sources and low-confidence wording
  that needs speaker review.
- Extend shared feature coverage to 59 locales. Feature, locale structure,
  language and human-preference checks pass. Browser mutation scenarios
  include both languages and pass syntax checking only.
- Reduce the standard backlog by 40 values; six auto-archive values are
  counted separately among pending keys. The broader translation and
  mixed-language audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8868aaf08ba760d476bccc563cb41a9a0e2501f">Translate Akan and Luganda archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 46 English placeholders and correct two unrelated Akan day/list
  labels. Preserve numbers, placeholder tokens and literal query examples.
  Audit notes record terminology sources and low-confidence wording for
  speaker review.
- Extend feature coverage to 57 locales. Feature, locale structure,
  language progress and human-preference checks pass. Browser mutation
  scenarios include both languages and are syntax-checked only.
- The standard backlog falls by 40 values; six auto-archive values belong
  to the separately tracked pending keys. Further translations and the
  mixed-language audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d1980d8952756a5accbd7f59ab58c1ad03d6147">Translate Aymara and Quechua archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 46 English placeholders and repair four basic time labels containing
  English or unrelated prefixes. Preserve literal query syntax and numeric
  bounds. Vocabulary references and low-confidence grammar are documented
  in the translation audit for speaker review.
- Extend the feature suite to 55 locales. Feature, locale structure,
  language progress, list-width and human-preference checks pass. The two
  browser mutation scenarios are syntax-checked, not browser-executed.
- Reduce the standard backlog by 40 values; six auto-archive values belong
  to the separately tracked pending-Transifex keys. The broader translation
  and mixed-language audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e7dd861421d6509cf0a3bd925a9709e957e236a">Translate archiving and date filters into five more languages</a>. Thanks to xet7.</summary>

- Fill 115 English placeholders in Guaraní, Ewe, Wolof, Fulah and Klingon.
  Preserve existing translations, placeholder tokens, numeric limits and
  literal query examples. The standard backlog falls by 100; the other 15
  values belong to separately tracked pending-Transifex keys.
- Extend the shared feature suite to 53 locales and add the five locales to
  the browser mutation scenario. Feature, all-locale structure and
  human-preference checks pass. Browser coverage is syntax-checked only.
- Wording remains low confidence pending speaker review. The translation
  audit records vocabulary sources, dialect concerns and technical compounds
  requiring review. The broader translation backlog remains in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc48f991937393d9bbbff303d817490024ebf703">Translate archiving and date filters into nine more languages</a>. Thanks to xet7.</summary>

- Fill 207 English placeholders in Tibetan, Buryat, Chuvash, Kashmiri,
  Tigrinya, Manx, Venetian, Veps and Venda. Existing translations, numeric
  limits and literal query examples remain intact.
- Extend the shared archiving/date-filter suite to 48 locales. Key-order,
  placeholder and human-preference checks pass. Browser scenarios cover the
  new labels and setting/clearing the threshold; syntax checks pass, but the
  scenarios were not browser-executed here.
- Wording is provisional and low confidence pending speaker review,
  particularly inclusive ranges and list-age explanations. Audit notes record
  vocabulary sources and older mixed-language values still needing repair.
- The standard backlog falls by 180 values because the 27 auto-archive values
  in this batch belong to the separately counted pending-Transifex keys.
  All-language translation and semantic review remain open in TODO Later.

</details>

**Login settings** - clearer guidance in the Admin Panel.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cf2455ab5cfbd30f5e8ea658e9eccf5f43c56a9">Fill login-setting messages in every locale</a>. Thanks to xet7.</summary>

- Add the remaining 101 non-English catalogs and align eleven English variants.
  All 234 non-English locale paths now contain the three login-setting keys;
  existing values remain unchanged and completed keys leave the pending queue.
- All 237 translation suites pass. Regression coverage includes native scripts,
  exact placeholders, source order and separate Tigre/Tigrinya and Venda/Zulu
  messages. Browser scenarios remain syntax-checked only.
- Minority-language technical compounds are provisional, especially Cherokee,
  Inuktitut, Tigre, Wolaytta, Aymara, Nahuatl, Tamazight, Veps, Ladin,
  Aromanian,
  Volapük and Klingon. Audit notes retain terminology evidence and older
  mixed-language findings that still need repair.
- The larger all-language backlog and 204 pending source keys remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f148be4ac975cf61de82e80ded22223e41a8f54">Extend login-setting translations to 32 more locales</a>. Thanks to xet7.</summary>

- Translate the three messages in 31 more physical catalogs and a shared Khmer
  alias, bringing the batch coverage to 133 locale paths.
- Existing translations remain unchanged. Locale-wide key-order, placeholder
  and human-preference checks pass.
- Kyrgyz, Mongolian, Burmese, Khmer, Pashto, Sindhi and Uyghur technical wording
  is provisional and needs speaker review. Remaining locales stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30881d1c41d1d22618ecd97810097bc4cea3ad7c">Translate login-setting messages in 101 locales</a>. Thanks to xet7.</summary>

- Add three messages in 100 physical catalogs and one shared regional alias.
  Existing translations remain unchanged; HTTP-header login is explicit.
- Locale-wide key-order and placeholder checks pass, as do human-preference,
  URL-placeholder, menu-wiring and board-item checks.
- Finnish, Arabic and Japanese browser scenarios cover labels, restart guidance
  and clearing a stored secret. Syntax checks pass; browser execution awaits
  Playwright and a running application.
- The remaining languages, pending feature strings and terminology review stay
  open in TODO Later. No translation-completeness claim is made for this batch.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.20 2026-10-07 WeKan ® release

**In short:** Makes opening and closing a card on a **large board** fast again:
one card open no longer re-renders every card on the board, and a card opened
by its address no longer rebuilds the board. The **snap** now loads big boards
lazily by default. Also verifies that the reported disclosure of a board's
**domain sharing** (GHSA-r3c4-5xwp-vf54) does not apply.

This release verifies the following security report:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb703fd326">Confirm the board domains REST route is site-admin only; GHSA-r3c4-5xwp-vf54 does not apply</a>. Thanks to a25370 and xet7.</summary>

GHSA-r3c4-5xwp-vf54 reported that `GET /api/boards/:boardId/domains` checks only
the login, because it calls `Authentication.checkUserId`, so any account could
read any private board's domain sharing. `checkUserId` is the **site admin**
check despite its name: a logged-in caller who is not an admin gets 403. The
route has answered only site admins since #5850 added it; before v12.15 the
check refused `admin === undefined`, and Meteor's `findOneAsync` gives
`undefined` for no match, so it refused everyone else then too. No Hall of Fame
entry, as there is no vulnerability.

The route's OpenAPI description, which said anyone able to read the board may
list the domains, now says site admin, and that members get the list with
`GET /api/boards/:boardId`; `checkUserId` has a comment saying what it is.
`tests/restBoardDomainsAccess.test.cjs` runs the real handler with the real
`Authentication` object: the reporter's non-member, members, ended memberships
and logged-out callers are refused, a missing board answers like an existing
one, and a site admin reads the list. A whole-tree negative test checks that
every REST route with `:boardId` checks that board or a site admin, and that a
login check alone would be caught. The report's proof of concept, run against a
running WeKan in Chromium, WebKit and Firefox, gets 403.

</details>

and fixes the following bugs:

**Large boards** - opening or closing a card took seconds on a big board
([#6745](https://github.com/wekan/wekan/issues/6745)), because one card open
made the browser redo the work of every card on the board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d5f24ee27">A card open no longer re-renders every card: lists and cards read only the user fields they use</a>. Thanks to markusst1982 and xet7.</summary>

Opening a card saves when it was last viewed into the user document (#3078).
The board view, which every list's card loop reads, and the helpers each
minicard runs read the WHOLE user document, so that one write re-ran every
list's card loop, and Blaze then re-evaluated every minicard. Measured in the
running app, one card open on a 40-card board caused 37,452 Tracker
invalidations; it now causes 390.

`client/lib/currentUserWith.js` reads the current user with only the fields a
helper needs, and minimongo re-runs such a query only when one of those fields
changes. The board view, feature preview, unread comments, folds, drag
handles, label text, dependency layers, date format, week number, mobile mode
and the admin-only custom field check use it. The "last viewed" write now sets
one entry instead of the whole map, which is capped at 5,000 cards.
`tests/largeBoardCardOpen.test.cjs` checks every such helper and that none
reads the whole user document again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4387185002">A card opened or closed by its address no longer rebuilds the whole board</a>. Thanks to markusst1982 and xet7.</summary>

A card link, the up/down card keys, back/forward and closing a card opened
from a link all re-rendered the board layout, which re-created every swimlane,
list and minicard. The router now remembers which board is on screen and the
card and board routes reuse it. Another board, a first load and the list and
swimlane links still render.
`tests/playwright/specs/large-board-card-open.e2e.js`
checks in Chromium, Firefox and WebKit that the board survives, that a card on
another board still renders that board, and that a click open and close stay
within a fixed amount of work per minicard.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecbfe59e50">Closing a card no longer makes every card re-read the current board</a>. Thanks to markusst1982 and xet7.</summary>

The routes cleared the popup card values to null and a card open or close
deleted them. Switching between the two is a change, and the current board is
read through one of them, so every minicard re-ran its board helpers. They are
now always cleared to null, and a test fails if anything deletes them again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0f2550e5d">Drag-and-drop options are set only when they change</a>. Thanks to markusst1982 and xet7.</summary>

The card, list and swimlane drag-and-drop setup re-applied its options on
every user or board change, and jQuery UI re-tags every card of a list when
the drag handle option is set, even to the same value: about k² work for k
cards, in every list. Only the options whose value differs are set now. The
swimlanes setup also stopped following the open card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96dff057a1">Opening a card no longer leaves a subscription running after it closes</a>. Thanks to markusst1982 and xet7.</summary>

Every card open started one more `unsaved-edits` subscription that nothing
stopped. It now belongs to the card and stops when the card closes.

</details>

**Snap** - how a snap install loads a board's cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2122214fb6">The snap now defaults cards-loading to auto, so big boards load only their visible cards</a>. Thanks to markusst1982 and xet7.</summary>

The snap set `CARDS_LOADING=all` whenever `cards-loading` was not set, so every
board on a snap sent all of its cards, comments, checklists and attachment
records to the browser. Every other platform defaults to `auto`: a board with
more than 500 cards loads only the cards currently visible. The snap does too
now, and `snap set wekan cards-loading='all'` still loads everything. The snap
description and help, which pointed at an Admin Panel setting that no longer
exists, are corrected.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.19 2026-10-05 WeKan ® release

**In short:** Every **login environment variable** can now be overridden in
**Admin Panel / People**, in a section per login method, with passwords never
sent to the browser - and the **LDAP** overrides, which never applied before,
now do. **LDAP and OAuth2 passwords** can come from **Docker / Kubernetes
secret files**. **LDAP** logins accept members of **nested Active Directory
groups**.
Every **release file** now appears on the GitHub Release as soon as its job has
built and checked it, also when the run is cancelled.

This release adds the following new features:

**Login settings in the Admin Panel** - every login environment variable,
overridable per login method, with the default sign-in method among them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb49a4b1b6">Override every login environment variable in Admin Panel / People, one section per login method</a>. Thanks to xet7.</summary>

People now has a section for **LDAP**, **OAuth2** (OpenID Connect, Oracle
OIM), **CAS** and **Header login**, beside SAML, OAuth login providers and
Passwordless, and the **Login** pane has `PASSWORD_LOGIN_ENABLED` and
`ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS`. Each field is labelled with its
environment variable and says whether the Admin Panel's value, the
variable's or the default is in effect; an empty field gives the variable
back. `models/lib/authConfigCatalog.js` lists all 103 variables, and
`server/lib/authConfig.js` resolves each at run time for the app and the
wekan-ldap, wekan-oidc and wekan-accounts-cas packages, so a change applies to
the next login. OAuth2 and CAS service configurations and LDAP background sync
are reapplied on save; the login expiry applies from the next start.

`LDAP_AUTHENTIFICATION_PASSWORD` and `OAUTH2_SECRET` never reach the browser:
the page learns only whether one is set and where it comes from, and a typed
one is cleared from the form after saving. Other values have a password
written inside a URL masked on the server, and URL fields refuse credentials.

Every variable is now listed in the Dockerfile, docker-compose files, snap
config and help, and `start-wekan.sh` / `.bat`; 14 were missing.
`tests/authConfigCatalog.test.cjs` pins resolution, secrets, input and platform
coverage, and across the whole tree that no code reads a login variable outside
the catalog or straight from `process.env`.
`tests/playwright/specs/admin-login-env-overrides.e2e.js` saves an override and
a secret through the pages and refuses an ordinary user; it passes in Chromium,
WebKit and Firefox.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0314406656">The Admin Panel can override DEFAULT_AUTHENTICATION_METHOD, and Default gives the variable back</a>. Thanks to xet7.</summary>

The default sign-in method is a field of the Login pane's settings form.
Choosing one there overrides `DEFAULT_AUTHENTICATION_METHOD`; **Default** leaves
the variable in charge. Before, the variable rewrote the stored method at every
start, so an administrator's choice was lost on restart whenever it was set.
The method the sign-in page uses is now the override, else the variable, else
`password`. On upgrade, a method chosen with the old dropdown while no variable
was set becomes the override, once, so nobody's choice is lost; the old dropdown
is gone, as it was a second control for the same setting.
`tests/authConfigCatalog.test.cjs` covers the order and the one-time upgrade,
with negative tests that it never invents an override, and the browser test
chooses a method, checks the sign-in page's value, and gives it back.

</details>

**Login secrets from files** - Docker and Kubernetes secrets, without the
password in an environment variable.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0314406656">Read LDAP_AUTHENTIFICATION_PASSWORD_FILE and OAUTH2_SECRET_FILE at login</a>. Thanks to Roemer, CrashOverride-lab, ww-daniel-mora and xet7.</summary>

Since [#5724](https://github.com/wekan/wekan/issues/5724) the Dockerfile, snap,
docker-compose files and `start-wekan` listed these, but no code read them, so
the password could only be an environment variable. WeKan now reads the file
itself at each login, so the password never enters the environment and a
rotated secret applies at once. The order is the Admin Panel, the variable,
then its file; one trailing line break is dropped. It is the same application
code on every platform: Docker, the snap (files under `/var/snap/wekan/common`),
bundles, AppImage, Flatpak, Mac and Windows. Admin Panel / People says when the
password comes from the file and when the file cannot be read - never its path
or content. The path is an environment variable only, on purpose: settable in
the Admin Panel beside the LDAP host or the OAuth2 token endpoint, it would make
the server read any file and send it there as the password. The snap key is now
`ldap-authentication-password-file`, like its siblings.
`MAIL_SERVICE_PASSWORD_FILE`, `MONGO_PASSWORD_FILE` and `S3_SECRET_FILE` are
still not read; `secrets/README.md` says so. Tests read a real file and a
rotated one, drive `ldap.js` to bind with it, and check that nothing reaches the
browser and that the Admin Panel cannot set a path.

</details>

and fixes the following bugs:

**LDAP login** - who gets in through a directory group, and whether the Admin
Panel's LDAP settings are used at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc2e7592a3">Accept members of nested Active Directory groups with LDAP_GROUP_FILTER_NESTED</a>. Thanks to rmb82 and xet7.</summary>

Since v12.08 (DirectoryGroupBleed) `LDAP_USER_AUTHENTICATION=true` logins check
`LDAP_GROUP_FILTER_ENABLE`; before it, every directory user got in. The check
matched `(member=<user DN>)`, which is direct membership only, so an Active
Directory that grants access through a team group nested in the access group
refused those users: web login failed when the session ended, `POST
/users/login` answered 401, and Admin Panel / Problems listed them as
`ldap.group-denied` ([#6744](https://github.com/wekan/wekan/issues/6744)).

`LDAP_GROUP_FILTER_NESTED=true` makes both group searches use AD's
`LDAP_MATCHING_RULE_IN_CHAIN`, `(member:1.2.840.113556.1.4.1941:=<user DN>)`,
so the login filter and admin status, group->role and org/team sync all see
nested groups. It is off by default, so other directories keep direct
membership, and the workaround of writing the rule into
`LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE` is used as written. The user DN stays
escaped, and a user entry with no DN is still refused without a search.
`docs/Features/Login/LDAP.md` documents it with an upgrade note, and the
Dockerfiles, docker-compose files, snap and start-wekan scripts list it.

`tests/ldapNestedGroups.test.cjs` drives `isUserInGroup` and `getUserGroups`:
a nested member is admitted with the in-chain filter, and the negative tests
check direct membership without the setting, refusal when no allowed group is
found, no search for an unnamed user, an escaped hostile DN, and that every
member clause in `ldap.js` goes through `groupMemberClause`. There is no browser
test, because the browser suite has no Active Directory server to log in to.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb49a4b1b6">Admin Panel LDAP settings are used, and Test connection exists</a>. Thanks to xet7.</summary>

The eight LDAP settings the Admin Panel offered never applied: the server read
them with a `Settings.findOne()`, which Meteor 3 refuses on the server, and the
error was swallowed, so LDAP silently used the environment variables. The
settings are now held in an observed cache. **Test connection** answered only
"Method not found", because `testConnection.js` was never loaded, and it used
the synchronous `Meteor.user()` Meteor 3 refuses. Whole-tree tests now fail on
either call in server code. Test connection still reports success without a
real connection when no service account (`LDAP_AUTHENTIFICATION`) is set.

</details>

**Other login methods** - settings that did not do what they said.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb49a4b1b6">CAS_VALIDATE_URL, PROPAGATE_OIDC_DATA=false and three snap help keys work as documented</a>. Thanks to xet7.</summary>

CAS read only the misspelling `CASE_VALIDATE_URL`; `CAS_VALIDATE_URL` now
works, and the old name still does. `PROPAGATE_OIDC_DATA=false` turned the
feature on, because any non-empty value did. `snap help` showed
`ldap-group-filter-group-id-attribute`, `-group-member-attribute` and
`-group-member-format`, which `snap set` does not know; it shows the real keys.

</details>

and has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37bc66403f">Attach each release file from the job that built it, also when cancelled</a>. Thanks to xet7.</summary>

The amd64 and arm64 bundles used to be uploaded together by the `release` job,
after both were built, and the AppImages, Mac apps, Flatpaks and the Windows
single EXE by a final `publish` job that waited for every architecture. A
cancelled run attached nothing at all, because those collecting jobs never
started.

Now every job that builds a release file attaches it, with its `.sha256sum`, as
its own last step through `releases/github-release-upload.sh` (retried, bounded,
verified by name and size; it no longer needs GNU `timeout`, so it also runs on
the macOS runners and in Windows Git Bash). `build-amd64` creates the release
with `releases/ensure-github-release.sh` right before attaching the first file,
so a run whose amd64 build fails still publishes no release. The `release` job
writes the notes and checks both base bundles are there; it uploads nothing.

The attach steps run on `always()` plus their build step's success, so a cancel
that arrives after a build still attaches its file. The final jobs - release
notes, what is still missing, and the AppImage, Mac and Flatpak summaries and
Flatpak repository - run on `always()` while still requiring the release to
exist. `tests/releaseAttachOwnFiles.test.cjs` pins both, with negative tests
that no job collects other jobs' files and uploads them at the end, and that no
attach step or final job is skipped by cancellation.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.18 2026-10-04 WeKan ® release

**In short:** Updates **Sharp** image processing and development dependencies,
including the **MongoDB driver** used by the browser tests, **Chai** assertions
and **TypeScript ESLint** tooling.

This release updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17d8f838cb">Update image processing and development dependencies</a>. Thanks to dependabot.</summary>

- **[Sharp 0.35.4 → 0.35.5](https://github.com/wekan/wekan/commit/a688411bbe37e5a9a3e303a24673e85b8620e7c9)** — image processing.
- **[MongoDB 7.6.0 → 7.7.0](https://github.com/wekan/wekan/commit/0c5617c0e07e83612b8a2512de436eeb2644ffc5)** — root development dependency.
- **[MongoDB 7.6.0 → 7.7.0 for Playwright](https://github.com/wekan/wekan/commit/41840dd32400f719f7d968d254b721950e774afd)** — browser-test database helpers.
- **[Chai 6.2.2 → 6.3.0](https://github.com/wekan/wekan/commit/56bd2fbbfec6d8e436cb5eb76a4bbbee3da6411e)** — test assertions.
- **[@typescript-eslint/parser 8.70.1 → 8.71.0](https://github.com/wekan/wekan/commit/69c55764a71ebc22f263d8e3a92b860465e4478c)** — TypeScript parsing for lint checks.
- **[@typescript-eslint/eslint-plugin 8.70.1 → 8.71.0](https://github.com/wekan/wekan/commit/66db856dbf4efb5f22d7f1017f2f3f703c6e1a19)** — TypeScript lint rules.

Thanks to dependabot.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.17 2026-10-03 WeKan ® release

**In short:** Fixes **SamlSubjectBleed** by binding SAML accounts to their
original identity; legacy accounts missing issuer information require
administrator verification before SAML access resumes. Confirms the existing
**ZipBombBleed** fix with browser regression coverage, restores **Firefox tests
on macOS**, and expands translations for archiving, date filters and other UI
guidance.

This release fixes the following CRITICAL SECURITY ISSUE:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0c6aa5414fd9fa28cef07ea89908670c424e2e9">Bind SAML accounts to their original identity</a>. Thanks to alham-rizvi and xet7.</summary>

[SamlSubjectBleed](https://wekan.fi/hall-of-fame/samlsubjectbleed/),
GHSA-966m-4qgp-j8w4: a different SAML subject could take over an existing
SAML account by claiming its username/email. Login now resolves the issuer and
qualified NameID first, persists the binding atomically, and refuses replacement
regardless of the merge setting. Email is verified only with an explicit
attestation; opt-in local linking also requires a verified matching local email.

**Upgrade:** legacy accounts without issuer scope require independent owner
verification and administrator repair. See the
[SAML upgrade instructions](docs/Features/Login/SAML.md). Transient NameIDs are
rejected. Conflicting subjects appear in Admin Panel → Problems; incomplete
legacy bindings are refused without classifying normal upgrade logins as
attacks.

Eight SAML/canary suites pass, including actual signed assertions sharing an
email but carrying different subjects, negative source checks and concurrent
updates. Chromium, Firefox and WebKit each pass the SAML error-display and
signed-login
browser regressions. External production IdPs were not tested.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48c1ad6086">Verify the native ZIP decompression report is already fixed</a>. Thanks to alham-rizvi and xet7.</summary>

GHSA-rmcq-68x2-3g5j describes the native `wekan.json` decompression path fixed
by [the ZipBombBleed patch](https://github.com/wekan/wekan/commit/e7ed71ee2ec90558abe775a48f17923e449a4d45),
included in v12.15. Current code counts actual decompressed bytes and stops at
256 MiB. Strengthened real-archive tests confirm a false size declaration cannot
bypass the counter. All three ZIP regression checks pass. Chromium, Firefox and
WebKit each
reject a small upload that expands beyond the production limit, leave board
cards unchanged, then accept a valid import in the same session.

Oversized exports can be legitimate, so this refusal intentionally does not
classify the user as an attacker in Admin Panel → Problems.

</details>

and improves browser testing:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9941680fae">Isolate Firefox app data for macOS browser tests</a>. Thanks to xet7.</summary>

On macOS 27, Firefox could fail with `Could not find profile folder` because
its shared app-data directory was protected despite a writable test profile.
Both native probes and real Playwright launches now use separate
repository-local
`MOZ_APP_DATA` and `MOZ_LOCAL_APP_DATA` directories, cleaned at process exit.
Explicit overrides remain respected; other browsers/platforms, `HOME` and
browser sandboxes are unchanged. Three helper regressions and six existing
Docker/config checks pass. All three focused security scenarios pass in Firefox
on macOS 27.0.1; Chromium and WebKit also pass all three. The 230-suite
translation
audit for the existing Upcoming entries passes.

</details>

and updates the following translations:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5dd2f9e9b6f040fdb78a89960befba6db37bb5bd">Translate archiving and date filters into Papiamento and Tok Pisin</a>. Thanks to xet7.</summary>

**Languages updated:** Papiamento, Tok Pisin.

- Fill 46 English placeholders covering automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list. Preserve existing
  translations and literal query examples.
- Seven relevant suites, 21 human-preference checks and per-locale preservation
  audits pass; regression checks cover exact placeholders, numeric limits and
  negative behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c565a873497d9e1f040916be5aaf0216d06d640">Translate archiving and date filters into Bislama and Yiddish</a>. Thanks to xet7.</summary>

**Languages updated:** Bislama, Yiddish.

- Fill 46 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and preservation audits
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf6d90277676b2c7b87008b8b196d5580ab094b5">Translate archiving and date filters into Māori and Samoan</a>. Thanks to xet7.</summary>

**Languages updated:** Māori, Samoan.

- Fill 46 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Eight relevant suites, 21 human-preference checks and preservation audits
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2f390006fcb0c2976e526577b43c07d2f1692db">Translate archiving and date filters into Hawaiian</a>. Thanks to xet7.</summary>

**Languages updated:** Hawaiian.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Eight relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/044e907276ba250f1c5e071612b89ca5d642fafc">Translate archiving and date filters into Zulu</a>. Thanks to xet7.</summary>

**Languages updated:** Zulu (`zu`, `zu-ZA`).

- Fill 46 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and preservation audits
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/937957f736df6e10737b8ddb32cf09b1a359e5b6">Translate archiving and date filters into Xhosa and Nyanja</a>. Thanks to xet7.</summary>

**Languages updated:** Xhosa, Nyanja.

- Fill 46 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and preservation audits
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed6cdd14be800d1fe4b2ca4f591c66e17fbe9c88">Translate archiving and date filters into Sesotho and Setswana</a>. Thanks to xet7.</summary>

**Languages updated:** Sesotho, Setswana.

- Fill 46 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Eight relevant suites, 21 human-preference checks and preservation audits
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b759c4ffa137b64bf539e132be122f14c1d22f57">Translate archiving and date filters into Kinyarwanda and Kirundi</a>. Thanks to xet7.</summary>

**Languages updated:** Kinyarwanda, Kirundi.

- Fill 46 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and preservation audits
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later. The standard backlog excludes the
  three automatic-archiving keys pending Transifex, so this batch reduces that
  count by 40 entries.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/373005ac3e6d2fb549637fa84cb673b86938415c">Translate archiving and date filters into Odia</a>. Thanks to xet7.</summary>

**Languages updated:** Odia.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ee5523d8082ac78ef8c43ea412762b3787637c3">Translate archiving and date filters into Bhojpuri and Maithili</a>. Thanks to xet7.</summary>

**Languages updated:** Bhojpuri, Maithili.

- Fill 46 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and preservation audits
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdf81ac8c7b08f2c61e1f611a1d0188c5a79e8bc">Translate archiving and date filters into Konkani</a>. Thanks to xet7.</summary>

**Languages updated:** Konkani.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56e58e8c36c7e0afbf886da65d9e0331df8cf833">Translate archiving and date filters into Moroccan Arabic</a>. Thanks to xet7.</summary>

**Languages updated:** Moroccan Arabic.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2b64a31d78401e49bb6bf0aae2a40c39a3d78e0">Translate archiving and date filters into Northern Sotho</a>. Thanks to xet7.</summary>

**Languages updated:** Northern Sotho.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dde49cba967f9cd64dde3b4dae48393e1d09199f">Translate archiving and date filters into Northern Ndebele and Swati</a>. Thanks to xet7.</summary>

**Languages updated:** Northern Ndebele, Swati.

- Fill 46 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and preservation audits
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is low confidence and needs speaker review. Remaining all-language
  work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85c64923dc73e93a25ad44ccad9724fe758cdb35">Translate archiving and date filters into Tsonga</a>. Thanks to xet7.</summary>

**Languages updated:** Tsonga.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Eight relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3ca217312d17546f3770c18f1af58389322d093">Translate archiving and date filters into Oromo</a>. Thanks to xet7.</summary>

**Languages updated:** Oromo.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Wording is provisional and would benefit from speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd75ef5d5099048e75da786ec05dd70361afb033">Translate archiving and date filters into Fijian</a>. Thanks to xet7.</summary>

**Languages updated:** Fijian.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Fijian wording is low confidence and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef45187bf93491acc71ffbd4e31d9b36060b3789">Translate archiving and date filters into Tongan</a>. Thanks to xet7.</summary>

**Languages updated:** Tongan.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Tongan wording is low confidence and needs speaker review. Date vocabulary was checked against [Unicode CLDR's Tongan locale data](https://unicode.org/cldr/charts/42/summary/to.html). Remaining all-language work, including older mixed-language values, is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/974e24f457b1c2e5902fd1b824ed2501166b5614">Translate archiving and date filters into Upper Sorbian</a>. Thanks to xet7.</summary>

**Languages updated:** Upper Sorbian.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Technical wording is provisional and needs speaker review. Date vocabulary was checked against [Unicode CLDR's Upper Sorbian locale data](https://unicode.org/cldr/charts/49/summary/hsb.html). Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/366d11a7318f07ccc67e4db757d5b4bd580cc82b">Translate archiving and date filters into Silesian</a>. Thanks to xet7.</summary>

**Languages updated:** Silesian.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Silesian technical wording is low confidence and needs speaker review. Time vocabulary was checked against [Wiktionary's Silesian time vocabulary](https://en.wiktionary.org/wiki/Category:szl:Time). Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7210e145c4e0c95ae5ea30bda1faca4b9cc4485">Translate archiving and date filters into Northern Sámi</a>. Thanks to xet7.</summary>

**Languages updated:** Northern Sámi.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Northern Sámi technical wording is low confidence and needs speaker review. Time vocabulary was checked against [Unicode CLDR's Northern Sámi locale data](https://unicode.org/cldr/charts/44/summary/se.html). Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/550bc0e83f537c2c75eafbcffb372c84c4217313">Translate archiving and date filters into Walloon</a>. Thanks to xet7.</summary>

**Languages updated:** Walloon.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Walloon technical wording is low confidence and needs speaker review. Vocabulary was checked against the [Walloon–French dictionary](https://dtw.walon.org/index.php). Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf1b46180f4cfb7765b609b0630777d664744990">Translate archiving and date filters into Waray-Waray</a>. Thanks to xet7.</summary>

**Languages updated:** Waray-Waray.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Waray-Waray technical wording is low confidence and needs speaker review. Time vocabulary was checked against the [Waray phrasebook](https://en.wikivoyage.org/wiki/Waray_phrasebook). Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9efc64f6b65ca86b726ca5ba0f297245dae0e676">Translate archiving and date filters into Wu Chinese</a>. Thanks to xet7.</summary>

**Languages updated:** Wu Chinese (Simplified Chinese script).

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Regional Wu wording is provisional and needs speaker review. Usage of 辰光 and 勿 was checked against [Shanghai-language examples](https://tatoeba.org/de/audio/index/wuu?page=3). Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d0efcf493265d739fc35072c6612450b7ec836f">Translate archiving and date filters into Aromanian</a>. Thanks to xet7.</summary>

**Languages updated:** Aromanian.

- Fill 23 English placeholders for automatic archiving, recent activity,
  inclusive date ranges, due dates and time in a list; preserve existing
  translations and literal query syntax.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact placeholders, numeric limits and negative
  behavioral guidance.
- Aromanian wording is low confidence and needs speaker review. Time vocabulary was checked against the [Aromanian phrasebook](https://en.wikivoyage.org/wiki/Aromanian_phrasebook) and [Wiktionary's entry for dzuã](https://en.wiktionary.org/wiki/dzu%C3%A3). Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9614de39c11d3474a2b43e7d8af2321b27e9b424">Translate Ladin map and history guidance</a>. Thanks to xet7.</summary>

**Languages updated:** Ladin.

- Fill 15 English placeholders for map views, undo/redo retry guidance, move
  ordering and SAML browser-tab guidance. Existing translations and placeholder
  tokens are preserved.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain the single-change retry guarantee, browser-tab
  restriction and distinct actions.
- Ladin wording is low confidence and needs speaker review; terminology references include the [Ladin dictionary](https://itavalbadia.ladinternet.it/applications/dictionary/index.jsp). These keys are pending Transifex and excluded from the standard missing-string report, so its total remains unchanged. Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f02955143924b8a18d897b17cf1f26af14b5f94">Translate Ladin Scrum planning and reports</a>. Thanks to xet7.</summary>

**Languages updated:** Ladin.

- Fill 84 English placeholders covering Scrum planning, sprint lifecycle,
  product backlog, reports and daily observations. Preserve existing
  translations and exact placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain unknown-versus-zero estimates, partial report
  scope, daily observation limitations and numeric limits.
- Ladin technical wording is low confidence and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b85e70e51673894972f4d6737d53e4b398193ad">Translate Ladin Sync conflicts and reports</a>. Thanks to xet7.</summary>

**Languages updated:** Ladin.

- Fill 63 English placeholders covering Sync conflicts, previews, source
  omissions, run reports, diagnostics and Jira estimates. Preserve existing
  translations and exact placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain one-way synchronization, local card
  preservation, report limitations, numeric limits and explicit null handling.
- Ladin technical wording is low confidence and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/480ba024e6a22a3a10b834e970130dbeb8e35a29">Translate Ladin notification recovery messages</a>. Thanks to xet7.</summary>

**Languages updated:** Ladin.

- Fill 46 English placeholders for email failures, activity notification
  controls and rule email reports. Preserve existing translations and exact
  placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain retry and cancellation limitations, preserved
  pending work and distinct delivery states.
- Ladin technical wording is low confidence and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd6b2923ab1742f88628ff1e8078f06c26c7790f">Translate Ladin Blockly keyboard and math labels</a>. Thanks to xet7.</summary>

**Languages updated:** Ladin.

- Fill 26 English-equal keyboard and math labels, using existing localized math
  accessibility labels. Preserve operating-system brands and existing
  translations.
- Eight relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact tokens, navigation direction, distinct
  operands and recognizable key names.
- Ladin terminology is provisional and needs speaker review. Its four remaining
  reported entries are ChromeOS, Linux, macOS and Windows; older wording still
  requires language review. Remaining all-language work is tracked in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a037bb72c18b78c34769abd65024c561a471458">Translate Upper Sorbian notification recovery messages</a>. Thanks to xet7.</summary>

**Languages updated:** Upper Sorbian.

- Fill 46 English placeholders for email failures, activity notification
  controls and rule email reports. Preserve existing translations and exact
  placeholder tokens. Update the README completeness count from 165 to 166
  catalogs after this batch crosses its threshold.
- Seven relevant suites pass after correcting the documented count; 21
  human-preference checks and a preservation audit also pass. Regression checks
  retain retry and cancellation limitations, preserved pending work and distinct
  delivery states.
- Upper Sorbian wording is provisional and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fe33d9db9a745fb4c70f5cb304ff65d4af69c1b">Translate Upper Sorbian Sync conflicts and reports</a>. Thanks to xet7.</summary>

**Languages updated:** Upper Sorbian.

- Fill 63 English placeholders covering Sync conflicts, previews, source
  omissions, run reports, diagnostics and Jira estimates. Preserve existing
  translations and exact placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain one-way synchronization, local card
  preservation, report limitations, numeric limits and explicit null handling.
- Upper Sorbian technical wording is provisional and needs speaker review.
  Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c209340e491b90043c828fb6efc1aacd74da68a">Translate Upper Sorbian Scrum planning and reports</a>. Thanks to xet7.</summary>

**Languages updated:** Upper Sorbian.

- Fill 84 English placeholders covering Scrum planning, sprint lifecycle,
  product backlog, reports and daily observations. Preserve existing
  translations and exact placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain unknown-versus-zero estimates, partial report
  scope, daily observation limitations and numeric limits.
- Upper Sorbian technical wording is provisional and needs speaker review.
  Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de21c66f024cccdb481ac52d179c7d9ba0f95146">Translate Upper Sorbian board and rule guidance</a>. Thanks to xet7.</summary>

**Languages updated:** Upper Sorbian.

- Fill 67 English placeholders for board access, rules, notifications,
  reminders, filters, imports, maps and history. Preserve existing translations,
  exact placeholders, literal rule variables and markup.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain access restrictions, blocked URL schemes,
  reminder behavior, private filter replacement and retry limitations.
- Technical wording is provisional and needs speaker review. The standard
  backlog drops by 14 because 53 of these keys are excluded as pending
  Transifex. Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bac344162708e839e80b0d13fc9cbe6792fe167">Translate Upper Sorbian Blockly keyboard labels</a>. Thanks to xet7.</summary>

**Languages updated:** Upper Sorbian.

- Fill 18 English-equal keyboard labels while preserving existing translations,
  product names and standard mathematical notation.
- Eight relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact tokens, navigation directions and
  recognizable key names.
- Technical wording is provisional and needs speaker review. The remaining 14
  reported entries are product names, mathematical notation and shared
  mathematical words; older translations still require language review.
  Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54cde6f04cd79b4938433085e054d8ba0f175a40">Translate Silesian notification recovery messages</a>. Thanks to xet7.</summary>

**Languages updated:** Silesian.

- Fill 46 English placeholders for email failures, activity notification
  controls and rule email reports. Preserve existing translations and exact
  placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain retry and cancellation limitations, preserved
  pending work and distinct delivery states.
- Silesian wording is provisional and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aebab433f13e5ece879331e56c6594d2ecb9060b">Translate Silesian Sync conflicts and reports</a>. Thanks to xet7.</summary>

**Languages updated:** Silesian.

- Fill 63 English placeholders covering Sync conflicts, previews, source
  omissions, run reports, diagnostics and Jira estimates. Preserve existing
  translations and exact placeholder tokens. Update the README completeness
  count from 166 to 167 catalogs.
- Seven relevant suites pass after updating the documented count; 21
  human-preference checks and a preservation audit also pass. Regression checks
  retain one-way synchronization, local card preservation, report limitations,
  numeric limits and explicit null handling.
- Silesian technical wording is provisional and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b7438ec298c92c1491d41ee59be8eb725481eac">Translate Silesian Scrum planning and reports</a>. Thanks to xet7.</summary>

**Languages updated:** Silesian.

- Fill 84 English placeholders covering Scrum planning, sprint lifecycle,
  product backlog, reports and daily observations. Preserve existing
  translations and exact placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain unknown-versus-zero estimates, partial report
  scope, daily observation limitations and numeric limits.
- Silesian technical wording is provisional and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5512507e64570a9b9c30489bba6121c9929ba9a1">Translate Silesian board and rule guidance</a>. Thanks to xet7.</summary>

**Languages updated:** Silesian.

- Fill 67 English placeholders for board access, rules, notifications,
  reminders, filters, imports, maps and history. Preserve existing translations,
  exact placeholders, literal rule variables and markup.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain access restrictions, blocked URL schemes,
  reminder behavior, private filter replacement and retry limitations.
- Silesian wording is provisional and needs speaker review. The standard backlog
  drops by 14 because 53 of these keys are excluded as pending Transifex.
  Remaining all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4563a4343adb46d7b37ddba2b6a80a55ca71efc2">Translate Silesian Blockly keyboard labels</a>. Thanks to xet7.</summary>

**Languages updated:** Silesian.

- Fill 19 English-equal keyboard labels while preserving existing translations,
  product names and standard mathematical notation.
- Eight relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks cover exact tokens, navigation directions and
  recognizable key names.
- Silesian wording is provisional and needs speaker review. The remaining 12
  reported entries are product names and mathematical terms or notation; older
  translations still require language review. Remaining all-language work is
  tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e778b34dedca9f0b66cdf651d09b74eff494eb94">Translate Wu Chinese notification recovery messages</a>. Thanks to xet7.</summary>

**Languages updated:** Wu Chinese (Simplified Chinese script).

- Fill 46 English placeholders for email failures, activity notification
  controls and rule email reports. Preserve existing translations and exact
  placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain retry and cancellation limitations, preserved
  pending work and distinct delivery states.
- Regional Wu wording is provisional and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d5884d86e0871e42e89bb045feb615046cf98db">Translate Wu Chinese Sync conflicts and reports</a>. Thanks to xet7.</summary>

**Languages updated:** Wu Chinese (Simplified Chinese script).

- Fill 63 English placeholders covering Sync conflicts, previews, source
  omissions, run reports, diagnostics and Jira estimates. Preserve existing
  translations and exact placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain one-way synchronization, local card
  preservation, report limitations, numeric limits and explicit null handling.
- Regional Wu wording is provisional and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e33f26b036ef523ffecd97375d21921bd7041b1c">Translate Wu Chinese Scrum planning and reports</a>. Thanks to xet7.</summary>

**Languages updated:** Wu Chinese (Simplified Chinese script).

- Fill 84 English placeholders covering Scrum planning, sprint lifecycle,
  product backlog, reports and daily observations. Preserve existing
  translations and exact placeholder tokens.
- Seven relevant suites, 21 human-preference checks and a preservation audit
  pass. Regression checks retain unknown-versus-zero estimates, partial report
  scope, daily observation limitations and numeric limits.
- Regional Wu wording is provisional and needs speaker review. Remaining
  all-language work is tracked in TODO Later.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
