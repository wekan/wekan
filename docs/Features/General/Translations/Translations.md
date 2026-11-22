# Translations

{% raw %}
<!-- Contains literal {{_ '...'}} template snippets; wrap in raw so Jekyll's
     Liquid engine does not try to evaluate them when building GitHub Pages. -->

## What it is

WeKan is written in English and translated into many languages. Translators
work on [Transifex](https://app.transifex.com/wekan/); developers add every new
text to the English catalog, and the translations come back into WeKan's
`imports/i18n/data/<language>.i18n.json` files. Each user picks their language
in the [language popup](Language-Popup.md).

## Read more

- [Internationalization and localization](https://en.wikipedia.org/wiki/Internationalization_and_localization)
  and [Transifex](https://en.wikipedia.org/wiki/Transifex) on Wikipedia.
- [WeKan on Transifex](https://explore.transifex.com/wekan/wekan/).
- WeKan pages: [Language popup](Language-Popup.md),
  [Customize translations](Customize-Translations.md),
  [Push all translations](Push-All.md), [Translation audit](Audit.md),
  [RTL](../Editor/RTL/RTL.md).

## How to use it

### Adding language support for new language


You are encouraged to translate (or improve the translation of) Wekan in your
locale language. For that purpose we rely on
[Transifex](https://app.transifex.com/wekan/). So the first step is to
create a Transifex account if you don’t have one already. You can then send a
request to join one of the translation teams. If there we will create a new one.

Once you are in a team you can start translating the application. Please take a
look at the glossary so you can agree with other (present and future)
contributors on words to use to translate key concepts in the application like
“boards” and “cards”.

### Supporting automatic translation when adding new features


The original application is written in English, and if you want to contribute to
the application itself, you are asked to fill the `i18n/en.i18n.json` file with your new phrases
(today `imports/i18n/data/en.i18n.json`).

![adding words to translation file](https://i.imgur.com/GOVY141.png)

When you do that the new strings of text to translate automatically appears on
Transifex to be translated (the refresh may take a few hours).

Then in your JADE files, use the string like so:

`h3.card-details-item-title {{_ 'members'}}`

We pull all translations from Transifex before every new Wekan release
candidate, ask the translators to review the app, and pull all translations
again for the final release. (Today the pull is
`releases/translations/pull-translations.sh`, which merges key by key: a real
Transifex translation in the right language wins, a local translation fills a
key Transifex left in English, and nothing is pushed back automatically.)

### Example

```
diff --git a/client/components/cards/cardDetails.jade b/client/components/cards/cardDetails.jade
index ee31d76be..e3b2ea7cd 100644
--- a/client/components/cards/cardDetails.jade
+++ b/client/components/cards/cardDetails.jade
@@ -142,19 +142,19 @@ template(name="cardDetails")
           .card-details-item.card-details-item-recurring
             h3.card-details-item-title
               i.fa.fa-repeat
-              | Recurrence
+              | {{_ 'recurrence'}}
             label
               input.js-recurring-checkbox(type="checkbox" checked=card.isRecurring)
-              |  Repeat this card
+              |  {{_ 'repeat-this-card'}}
             if card.isRecurring
               label
-                | Repeat every
+                | {{_ 'repeat-every'}}
                 select.js-recurring-pattern
-                  option(value="daily" selected=card.recurrencePattern === 'daily') Daily
-                  option(value="weekly" selected=card.recurrencePattern === 'weekly') Weekly
-                  option(value="monthly" selected=card.recurrencePattern === 'monthly') Monthly
+                  option(value="daily", selected="#{card.recurrencePattern === 'daily'}") {{_ 'daily'}}
+                  option(value="weekly", selected="#{card.recurrencePattern === 'weekly'}") {{_ 'weekly'}}
+                  option(value="monthly", selected="#{card.recurrencePattern === 'monthly'}") {{_ 'monthly'}}
               label
-                | End repeat on
+                | {{_ 'end-repeat-on'}}
                 input.js-recurring-end-date(type="date" value=card.recurrenceEndDate)
         if currentBoard.hasAnyAllowsUser
           hr
diff --git a/imports/i18n/data/en.i18n.json b/imports/i18n/data/en.i18n.json
index 10260ff2b..b16200c1a 100644
--- a/imports/i18n/data/en.i18n.json
+++ b/imports/i18n/data/en.i18n.json
@@ -1270,5 +1270,12 @@
   "supportPopup-title": "Support",
   "accessibility-page-enabled": "Accessibility page enabled",
   "accessibility-title": "Accessibility topic",
-  "accessibility-content": "Accessibility content"
+  "accessibility-content": "Accessibility content",
+  "recurrence": "Recurrence",
+  "repeat-this-card": "Repeat this card",
+  "repeat-every": "Repeat every",
+  "daily": "Daily",
+  "weekly": "Weekly",
+  "monthly": "Monthly",
+  "end-repeat-on": "End repeat on"
 }
```
### Translation regression checks and remaining work

Run `node tests/run-node-suites.cjs Translation translation i18n boardItemLinks`
for the catalog regression suites. Key order and interpolation tokens are checked
against the full current English source, including newly added feature strings.

The historical no-English assertions use `--completed-catalog` to check the
2,417 source strings from the September 6 completion milestone, commit
`6cae1d48b9`. Its source snapshot is
`releases/translations/completed-source.json`. This scope preserves the earlier
completion guarantee without treating later feature additions as regressions.
Feature-specific translation assertions continue checking their named strings.
Passing these suites does **not** mean every newer string is translated.

For the actual work queue, use `node releases/translations/fill-translations.mjs
--list <locale>` without that flag. This includes strings awaiting Transifex.
`--missing` reports other unfinished strings separately from the pending-Transifex
key count. The snapshot is historical evidence; do not regenerate it from a
partially translated current catalog to make tests pass.

## How the numbers are calculated

- WeKan has 246 catalog files in `imports/i18n/data/`, and 245 entries in
  [imports/i18n/languages.js](../../../../imports/i18n/languages.js) (counted
  for this page; English `en.i18n.json` is the source, with 5230 keys).
- `node releases/translations/fill-translations.mjs --missing` counts, per
  language, the keys still equal to the English source; English and `en-*` are
  skipped.
- The completed-catalog check uses the 2,417 source strings of
  `releases/translations/completed-source.json`.

## How it works in WeKan

- `TAPi18n` in [imports/i18n/tap.js](../../../../imports/i18n/tap.js) loads a
  language's catalog on demand (`languages.js` maps each tag to its loader) and
  translates `{{_ 'key'}}` in templates and `TAPi18n.__('key')` in code.
- [releases/translations/pull-translations.sh](../../../../releases/translations/pull-translations.sh)
  runs `tx pull -a -f` and then the per-key merge,
  [merge-translations.mjs](../../../../releases/translations/merge-translations.mjs);
  [verify-human-preference.mjs](../../../../releases/translations/verify-human-preference.mjs)
  proves a human translation is never overwritten.
- [fill-translations.mjs](../../../../releases/translations/fill-translations.mjs)
  lists and fills only the keys still in English.
- Admins can override single strings, see
  [Customize translations](Customize-Translations.md).

{% endraw %}

## Commits

 - [Keep translation regression gates scoped to the completed source catalog](https://github.com/wekan/wekan/commit/225d875b09a711f5c9a3c4dcc0fb92c1a9e8f145)
 - [Rewrite locale files that held another language](https://github.com/wekan/wekan/commit/ba6d0014f7b16c2abd2093e4c3bf953131915396)
 - [Korean is Korean again](https://github.com/wekan/wekan/commit/f225b3245df2d29d77fb49f9744628f4d405c9de)
 - [Merge Transifex human translations over local fills](https://github.com/wekan/wekan/commit/0e12a467a6a74368d86535f2be1d1a6af8e3d569)
 - [Fill remaining strings directly, with no service, keeping human translations](https://github.com/wekan/wekan/commit/4146c5374523b978b448bbfaafd25db4a7ed35c6)
 - [Never overwrite human translations](https://github.com/wekan/wekan/commit/a78843330cb6abf584bc21fa224d00f5a958ac43)
 - [Fifteen more languages, most of them African](https://github.com/wekan/wekan/commit/2395dfd0840b39f584c0338fc4683e560a9af0e8)
 - [Enforce translation completeness, the milestone of the completed catalog](https://github.com/wekan/wekan/commit/6cae1d48b93055993a325825d422c80dd7aa056b)
 - [Switch tap:i18n to the custom TAPi18n implementation](https://github.com/wekan/wekan/commit/60af7766bfd34338e1cc3a77a7250a3e791180ab)
