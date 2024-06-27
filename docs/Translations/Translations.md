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