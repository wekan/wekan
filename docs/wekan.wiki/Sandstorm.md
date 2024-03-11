## Sandstorm Website

[Sandstorm Website](https://sandstorm.io)

If you have any grains at Sandstorm's **Oasis montly paid service**, please move those to self-hosted, because [only **Oasis grain hosting** part is shutting down](https://sandstorm.io/news/2019-09-15-shutting-down-oasis) - [HN](https://news.ycombinator.com/item?id=20979428). This does not affect any other parts like self-hosting at sandcats.io, App Market, updates, etc.

Works on Ubuntu 64bit, on Debian 64bit.

[Security audited](https://sandstorm.io/news/2017-03-02-security-review), recommended for security critical use on public internet or internal network. [Sandstorm Security Features](https://docs.sandstorm.io/en/latest/using/security-practices/). Sandstorm is [completely Open Source](https://sandstorm.io/news/2017-02-06-sandstorm-returning-to-community-roots), including [Blackrock Clustering](https://github.com/sandstorm-io/blackrock).

Install to your own server. Automatic updates, tested before release. Sandstorm Wekan has different features than Standalone.

**Works**
- Google/GitHub/LDAP/SAML/Passwordless email login.
- Import from Wekan JSON.
- Free SSL at https://yourservername.sandcats.io domain.
- [Rescuing MongoDB data from Sandstorm Grain .zip file to Standalone Wekan](Export-from-Wekan-Sandstorm-grain-.zip-file)

**Does not work**
- [Sandstorm open issues](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+sandstorm+label%3ATargets%3ASandstorm)
- Import from Trello does not import attachments, because Sandstorm-compatible HTTP-access from Wekan to outside of Wekan grain sandbox is not implemented yet 
- [Copying/Moving card to another board](https://github.com/wekan/wekan/issues/1729).
- [REST API](https://github.com/wekan/wekan/issues/1279) 
- [Outgoing Webhooks](Outgoing-Webhook-to-Discord)
- [Email from Wekan](https://github.com/wekan/wekan/issues/2208#issuecomment-469290305)

## Demo

[![Try on Sandstorm][sandstorm_button]][sandstorm_appdemo]

## Keep backups

- Keep backups. Download your Wekan grains.
- It's possible to [Export from Wekan Sandstorm grain .zip file to rescue data](Export-from-Wekan-Sandstorm-grain-.zip-file)

## Wekan App

Wekan at [experimental](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h?experimental=true) or [official](https://apps.sandstorm.io/app/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h) Sandstorm App Market. Note: Only use official. Experimental versions are broken.

Newest Wekap app .spk file download at https://releases.wekan.team/sandstorm/

## Bug reports and Feature Requests

[Wekan for Sandstorm bug reports and feature requests](https://github.com/wekan/wekan/issues)

[Sandstorm bug reports and feature requests](https://github.com/sandstorm-io/sandstorm/issues)

## Building Wekan for Sandstorm

[Building Wekan for Sandstorm](https://github.com/wekan/wekan-maintainer/wiki/Building-Wekan-for-Sandstorm)

## Wekan Sandstorm cards to CSV using Python

[Wekan Sandstorm cards to CSV using Python](Wekan-Sandstorm-cards-to-CSV-using-Python)

## Importing to Trello workaround

It is not possible to import attachments directly from Trello when using Sandstorm version of Wekan. This is because Wekan is in secure sandbox at Sandstorm, and does not yet have Sandstorm-compatible way to import attachments from outside of Sandstorm. You need to:
1. Install Standalone version of Wekan, for example Docker/Snap/VirtualBox, for example to your own computer
2. Import board from Trello
3. Export board as Wekan board. Exported JSON file includes attachments as base64 encoded files.
4. Import board as Wekan board to Sandstorm.

[sandstorm_button]: https://img.shields.io/badge/try-Wekan%20on%20Sandstorm-783189.svg
[sandstorm_appdemo]: https://demo.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h