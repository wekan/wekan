# Contributing

We’re glad you’re interested in helping the LibreBoard project! We welcome bug
reports, enhancement ideas, and pull requests, in our GitHub bug tracker. Before
opening a new thread please verify that your issue hasn’t already been reported.

<https://github.com/libreboard/libreboard>

## Translations

You are encouraged to translate (or improve the translation of) LibreBoard in
your locale language. For that purpose we rely on
[Transifex](https://www.transifex.com/projects/p/libreboard). So the first step
is to create a Transifex account if you don’t have one already. You can then
send a request to join one of the translation teams. If there we will create a
new one.

Once you are in a team you can start translating the application. Please take a
look at the glossary so you can agree with other (present and future)
contributors on words to use to translate key concepts in the application like
“boards” and “cards”.

The original application is written in English, and if you want to contribute to
the application itself, you are asked to fill the `i18n/en.i18n.json` file. When
you do that the new strings of text to translate automatically appears on
Transifex to be translated (the refresh may take a few hours).

We pull all translations from Transifex before every new LibreBoard release
candidate, ask the translators to review the app, and pull all translations
again for the final release.

## Installation

LibreBoard is made with [Meteor](https://www.meteor.com). Thus the easiest way
to start hacking is by installing the framework, cloning the git repository, and
launching the application:

```bash
$ curl https://install.meteor.com/ | sh # On Mac or Linux
$ git clone https://github.com/libreboard/libreboard.git
$ cd libreboard
$ meteor
```

As for any Meteor application, LibreBoard is automatically refreshed when you
change any file of the source code, just play with it to see how it behaves!

## Style guide

We follow the
[meteor style guide](https://github.com/meteor/meteor/wiki/Meteor-Style-Guide).

Please read the meteor style guide before making any significant contribution.

## Code organisation

TODO
