# Transifex download review, 2026-09-27

The maintainer requested correction of wrong-language and wrong-meaning text
after downloading translations. This is a targeted repair request; it does
not resume filling every untranslated string in every language.

The working-tree comparison against `ba97a6aadd4ce2e645394db51fa34c246663567c`
contained 2,548 changed values in 238 files: 1,652 new English placeholders,
299 values changed from English, 398 localized replacements and 199 English
fallbacks. These are observed changes, not proof of human or machine authorship.
Some fallbacks may result from local merge rejection, not Transifex itself.

## Completed repair

487 locale/key pairs in 57 locales are corrected. The
[exact correction inventory](../../../releases/translations/transifex-review-2026-09-27.json)
contains 488 fingerprints: the Tamazight SMTP port label has two rejected
spellings. The normal pull repair ledger contains the same records, so another
download of an exact bad value is repaired without replacing a newer value.

- Arabic received Persian colors, item names and completion labels. Slovenian
  received Serbian controls and sprint states; Vietnamese received Malay colors,
  zoom controls and states. Those labels now use their target languages.
- Blockly Blocks uses a noun rather than a blocking verb. Clear means erase,
  not bright or transparent. Numeric inputs use number terms rather than serial
  identifiers; Control and Pause identify keyboard keys.
- Existing translations and localized help links lost to English fallbacks are
  retained, including Mongolian labels and Occitan Blockly text. The Polish
  atan2 label preserves `%1` and `%2` without the malformed `%X` token.
- Older Hindi fragments in Urdu and Hindi calendar labels in Odia are repaired.
  English remnants in Hindi, Kannada and Tamil constant tooltips are translated;
  mathematical symbols remain unchanged.
- Seven source keys missing from seven regional/additional catalogs are added
  as English placeholders. They are not presented as completed translations.

Valid new Finnish Scrum labels, Vietnamese spelling corrections, Swedish movement
labels and other valid downloaded changes are retained.

Walloon wording has lower confidence and still benefits from fluent review.
`Netyî` agrees with the existing cron error-clear action and the
[Walloon dictionary](https://lucyin.walon.org/diccionairaedje/johan_viroux_DTW.html);
`Cloyou` is supported by its
[close entry](https://dtw.walon.org/index.php?query=cl%C3%B4re).
Yoruba clear uses the existing erase vocabulary, also seen in
[WordPress localization](https://translate.wordpress.com/projects/wpcom/-all-translated/37212/).
Tamazight SMTP port reuses the catalog's S3 port spelling.

## Validation and remaining work

The Blockly inventory suite, the new positive/negative/replay suite and the
full 22,790-record correction-ledger suite pass. Source tokens, key ordering,
exact bad-value replay, newer-value preservation and retained valid translations
are checked. Six Chromium scenarios pass for Finnish, Arabic, Gujarati,
Swedish, Slovenian and Vietnamese, including localized editor labels, dragging,
field editing and context menus.

This does not certify every string in every catalog. The earlier broader
semantic audit remains open, including Tamazight mixed-language wording,
Tigre terminology and possible Greenlandic mixtures in Inuktitut. Inuktitut
can use Latin letters legitimately; writing-system detection alone cannot
decide those cases. Greek mathematical symbols, inverse-trigonometric names
and URLs are not evidence of a wrong-language translation. New English
placeholders remain outside this repair batch. No translations were uploaded.
