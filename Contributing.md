# Contributing

We’re glad you’re interested in helping the Wekan project! We welcome bug
reports, enhancement ideas, and pull requests, in our GitHub bug tracker. Before
opening a new thread please verify that your issue hasn’t already been reported.

<https://github.com/wekan/wekan>

## Security Disclosure

Security is very important to us. If discover any issue regarding security,
please disclose the information responsibly by sending an email to
security@wekan.io and not by creating a GitHub issue.

## Translations

You are encouraged to translate (or improve the translation of) Wekan in your
locale language. For that purpose we rely on
[Transifex](https://www.transifex.com/projects/p/wekan). So the first step is to
create a Transifex account if you don’t have one already. You can then send a
request to join one of the translation teams. If there we will create a new one.

Once you are in a team you can start translating the application. Please take a
look at the glossary so you can agree with other (present and future)
contributors on words to use to translate key concepts in the application like
“boards” and “cards”.

The original application is written in English, and if you want to contribute to
the application itself, you are asked to fill the `i18n/en.i18n.json` file. When
you do that the new strings of text to translate automatically appears on
Transifex to be translated (the refresh may take a few hours).

We pull all translations from Transifex before every new Wekan release
candidate, ask the translators to review the app, and pull all translations
again for the final release.

## Installation

Wekan is made with [Meteor](https://www.meteor.com). Thus the easiest way to
start hacking is by installing the framework, cloning the git repository, and
launching the application:

```bash
$ curl https://install.meteor.com/ | sh # On Mac or Linux
$ git clone https://github.com/wekan/wekan.git
$ cd wekan
$ meteor
```

As for any Meteor application, Wekan is automatically refreshed when you change
any file of the source code, just play with it to see how it behaves!

## Style guide

We follow the
[meteor style guide](https://github.com/meteor/meteor/wiki/Meteor-Style-Guide).

Please read the meteor style guide before making any significant contribution.

## Code organization

TODO
