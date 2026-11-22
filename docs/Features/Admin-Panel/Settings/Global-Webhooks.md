# Admin Panel / Settings / Global Webhooks

## What it is

Outgoing webhooks for the whole instance, added and edited with the same form a
board uses for its own webhooks — the difference is only that these fire for
every board. A webhook is an address WeKan sends an HTTP POST to when something
happens, so a chat, an automation server or another tool can react.

Each webhook has a URL, a type, and the token used to sign the request.

The pane, its menu entry and every other webhook screen are hidden while
[Turn off all webhooks](Turn-Off-All-Webhooks.md) is on, and the list of every
webhook is [Admin Panel / Problems / All webhooks](../Problems/Webhooks.md).

The same pane also holds **Internal destinations**, the hosts on WeKan's own
network that any webhook may reach, and the
[Login and registration webhook](Login-and-Registration-Webhook.md).

## Read more

- [Webhook](https://en.wikipedia.org/wiki/Webhook) on Wikipedia.
- [Server-side request forgery](https://en.wikipedia.org/wiki/Server-side_request_forgery)
  on Wikipedia, and [OWASP on SSRF](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery) -
  why internal addresses are refused unless listed.
- [Outgoing webhooks](../../Webhooks/) — the payload, the types, and per-board
  webhooks; [Webhook data](../../Board-Sidebar/Board-Settings/Outgoing-Webhooks/Webhook-data.md)
  and [Notification delivery](../../General/Notifications/Notification-Delivery.md).

## How to use it

**Add a global webhook**

1. Open **Admin Panel / Settings / Global Webhooks**
   (`/admin/settings/global-webhooks`).
2. In the last, empty form: **Webhook Name**, the **URL**, optionally
   **Token (Optional for Authentication)**, and the type - **Outgoing
   Webhooks** (one-way) or **Two-Way Webhooks**.
3. Press **Create**.

**Change one**

1. In its form, untick or tick **Disable This Webhook**.
2. Under **Send this webhook:** keep **Every activity** or pick the groups of
   activities it is sent.
3. Optionally tick **Also send a Mattermost direct message to the card's
   members and assignees**.
4. Edit the name, URL, token or type and press **Save**.

Under each saved one-way webhook, *Outgoing Webhooks* chooses whether it sends
the message text, which groups of properties it sends, whether several
notifications go in one POST and when it is sent (\#3695). These are saved at
once. A global webhook follows its own choice, then Admin Panel / People /
Notifications; a board's settings never apply to it.

**Let webhooks reach a host on WeKan's own network**

1. Under **Internal destinations**, list the hosts - a Node-RED, a chat server -
   one per line, as a name or an address, with a port to allow only that port.
2. Press **Save**. An entry that is not a valid host is reported and not saved.

## How the numbers are calculated

- **Internal destinations**: at most **50** hosts are kept (`MAX_HOSTS` in
  [models/lib/internalWebhookHosts.js](../../../../models/lib/internalWebhookHosts.js));
  entries are lower-cased and duplicates dropped; a port above 65535 is
  refused. An entry without a port allows the host on any port. Empty, the
  default, allows none.
- The list is cached on the server for **10 seconds** between reads, and saving
  clears the cache.

## How it works in WeKan

- **Collection** `integrations`
  ([models/integrations.js](../../../../models/integrations.js)): a global
  webhook is an integration whose `boardId` is `_global`
  (`Integrations.Const.GLOBAL_WEBHOOK_ID`); the types are
  `outgoing-webhooks` and `bidirectional-webhooks`.
- **Pane**: template `webhookSettings` in
  [settingBody.jade](../../../../client/components/settings/settingBody.jade)
  renders `outgoingWebhooksPopup` from
  [client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade)
  and [sidebar.js](../../../../client/components/sidebar/sidebar.js), which use
  `_global` when no board is open.
- **Permission and publication**: the `globalwebhooks` publication in
  [server/publications/settings.js](../../../../server/publications/settings.js)
  sends the global webhooks to site administrators only, without their tokens;
  [server/permissions/integrations.js](../../../../server/permissions/integrations.js)
  lets a site administrator or the board's admin change an integration.
- **Sending**: [server/models/activities.js](../../../../server/models/activities.js)
  picks the board's webhooks and the global ones for each activity;
  [server/notifications/outgoing.js](../../../../server/notifications/outgoing.js)
  sends them through the SSRF guard. Delivery choices are in
  [server/methods/notificationDelivery.js](../../../../server/methods/notificationDelivery.js).
- **Internal destinations**: methods `getWebhookInternalHosts` and
  `saveWebhookInternalHosts` in
  [server/webhookInternalHosts.js](../../../../server/webhookInternalHosts.js),
  site-admin only and never published.
- **Tests**: [server/lib/tests/webhookPreparation.tests.js](../../../../server/lib/tests/webhookPreparation.tests.js),
  [server/lib/tests/notificationDelivery.tests.js](../../../../server/lib/tests/notificationDelivery.tests.js)
  and [tests/internalWebhookHosts.test.cjs](../../../../tests/internalWebhookHosts.test.cjs).

## Commits

 - [Moving a card with an outgoing webhook no longer counts as HookBleed](https://github.com/wekan/wekan/commit/b01c2332696fb5a6c7aeb22286ed3e22dd1445a1)
 - [Choose what notifications contain, and group and schedule them (#3695)](https://github.com/wekan/wekan/commit/ab785acd1ebd309a96e7231509796d8b71a78572)
 - [Outgoing webhooks may reach internal hosts a site admin lists](https://github.com/wekan/wekan/commit/b4d2604e6171d337b309210dbfe349c67bfcc843)
 - [Pick which activities a webhook is sent](https://github.com/wekan/wekan/commit/c3321926abcbdc09042349992285fa26691fb6e2)
 - [Also send a Mattermost direct message to the card's people](https://github.com/wekan/wekan/commit/349d6dc5e665f1ec62fe8831b91e2501a81ad3b2)
 - [Editing a card reaches the global webhook (#4912)](https://github.com/wekan/wekan/commit/691b096fafdd099da697aac895673683f36e3793)
 - [A URL for every left-menu entry, global webhooks included](https://github.com/wekan/wekan/commit/841479774e12c34337712ef26d2b808b49dc4bfc)
 - [Two-way webhooks, and the global webhook id](https://github.com/wekan/wekan/commit/3f0600fed70512f87dc20fe039695d1681a73d39)
