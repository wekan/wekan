{% raw %}
<!-- Contains literal {{_ '...'}} template snippets; wrap in raw so Jekyll's
     Liquid engine does not try to evaluate them when building GitHub Pages. -->
# Adding language support for new language

You are encouraged to translate (or improve the translation of) Wekan in your
locale language. For that purpose we rely on
[Transifex](https://app.transifex.com/wekan/). So the first step is to
create a Transifex account if you don’t have one already. You can then send a
request to join one of the translation teams. If there we will create a new one.

Once you are in a team you can start translating the application. Please take a
look at the glossary so you can agree with other (present and future)
contributors on words to use to translate key concepts in the application like
“boards” and “cards”.

# Supporting automatic translation when adding new features

The original application is written in English, and if you want to contribute to
the application itself, you are asked to fill the `i18n/en.i18n.json` file with your new phrases.

![adding words to translation file](https://i.imgur.com/GOVY141.png)

When you do that the new strings of text to translate automatically appears on
Transifex to be translated (the refresh may take a few hours).

Then in your JADE files, use the string like so:

`h3.card-details-item-title {{_ 'members'}}`

We pull all translations from Transifex before every new Wekan release
candidate, ask the translators to review the app, and pull all translations
again for the final release.

## Example

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
## Translation regression checks and remaining work

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

{% endraw %}
