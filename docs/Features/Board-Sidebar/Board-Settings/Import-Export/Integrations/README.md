# Integrations

## What it is

The other software WeKan works together with: databases, chat through
webhooks, a Gogs integration, and a list of integrations that were wished for
as pull requests. Many of those wishes have since been built; they are marked
below with the page that describes them.

## Read more

- [Wikipedia: System integration](https://en.wikipedia.org/wiki/System_integration)
- [Import / Export with other tools](../External-Tools.md)
- [Outgoing Webhooks](../../Outgoing-Webhooks/Webhook-data.md)

## How to use it

### Current

* [PostgreSQL](https://github.com/wekan/wekan/tree/main/docs/Databases/ToroDB/PostgreSQL)
* [Webhooks](../../Outgoing-Webhooks/Webhook-data.md), works by showing board activities with [Slack](https://slack.com/), [Rocket.chat](https://rocket.chat/) and others that supports Webhooks.
* [Gogs Integration](https://github.com/wekan/wekan-gogs) as separate project.

### Wishes for pull requests

#### IFTTT

* [Huginn or Flogo](https://github.com/wekan/wekan/issues/1160)

#### Chat

* [Rocket.Chat more integrations](https://github.com/RocketChat/Rocket.Chat/issues/672#issuecomment-328469079)

#### Issue / Commit

* [GitLab](https://github.com/wekan/wekan/issues/109)
* GitHub
* Gitea

#### Time Tracking

* [Time Tracking](https://github.com/wekan/wekan/issues/812)
* Super-Productivity after [Themes](https://github.com/wekan/wekan/issues/781) and [API scripting](https://github.com/wekan/wekan/issues/794) is done.

#### Complete replacement

* Jira, plan at [Themes](https://github.com/wekan/wekan/issues/781)

#### File Sync, Groupware

* [ownCloud / Nextcloud](https://github.com/wekan/wekan/issues/687)

#### Authentication

Most are these are already available at [Sandstorm](https://sandstorm.org), for example see
screenshots of SAML support (on the old WeKan discourse, no longer online).
Following are for Source/Docker installs:

* [Google/GitHub/OAuth](https://github.com/wekan/wekan/issues/234)
* [LDAP](../../../../Login-Page/LDAP.md) ([#119](https://github.com/wekan/wekan/issues/119))
* [SAML](https://github.com/wekan/wekan/issues/708)
* [OpenID](https://github.com/wekan/wekan/issues/538)

#### Import / Export

* [Taskwarrior tasks](https://github.com/wekan/wekan/issues/827)

### More

[Features](../../../../Features.md)

### Done since this list was written

- GitLab, GitHub and Gitea: imported and exported
  ([GitLab](../GitLab/README.md), [GitHub](../GitHub/README.md),
  [Gitea](../Gitea/README.md)), and synced into a list ([Sync](../Sync.md)).
- Super-Productivity: imported and exported
  ([Super Productivity](../Super-Productivity/README.md)).
- Jira: imported, exported and synced ([Jira](../Jira/README.md)).
- Nextcloud: Deck boards imported and exported
  ([Nextcloud Deck](../Nextcloud-Deck/README.md)), and due dates in a
  CalDAV calendar ([Date](../../Date.md)).
- Taskwarrior tasks: imported and exported
  ([Taskwarrior](../Taskwarrior/README.md)).
- OAuth2, LDAP and SAML logins: [OAuth2](../../../../Login-Page/OAuth2.md),
  [LDAP](../../../../Login-Page/LDAP.md), [SAML](../../../../Login-Page/SAML.md).

## How the numbers are calculated

This page is a list; it has no numbers. Each integration's limits are on its
own page.

## How it works in WeKan

Each integration is described on its own page above. Webhooks are the
`Integrations` collection ([models/integrations.js](../../../../../../models/integrations.js));
imports and exports are listed in
[models/lib/importSources.js](../../../../../../models/lib/importSources.js)
and [client/components/boards/exportScope.js](../../../../../../client/components/boards/exportScope.js).

## Commits

 - [Sandstorm: build from install.sandstorm.org, and link sandstorm.org everywhere](https://github.com/wekan/wekan/commit/ca2dc5fae530fa70872f4945571bf8c64f434c94)
 - [Organize docs/Databases: one directory per database](https://github.com/wekan/wekan/commit/fea3c432e8c2a492f9412e23db7df6cac4bd75d6)
 - [Fix bare wiki-style links to relative paths of existing docs pages](https://github.com/wekan/wekan/commit/7b66884ba3e1206aea6e0cf57507cceffa5c91bf)
 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
