# Rocket.Chat

## What it is

Info for Self-Hosted RocketChat Community Server, using RocketChat server Snap from https://snapcraft.io/rocketchat-server

[Rocket.Chat](https://rocket.chat) is a chat server that can receive WeKan's
outgoing webhooks in a channel, and can be WeKan's OAuth2 login. This page is
about running a self-hosted Rocket.Chat Community Server from its Snap, next
to WeKan.

## Read more

- [Wikipedia: Rocket.Chat](https://en.wikipedia.org/wiki/Rocket.Chat)
- [Deploy Rocket.Chat with snaps](https://docs.rocket.chat/docs/deploy-with-snaps)
- [rocketchat-server on the Snap Store](https://snapcraft.io/rocketchat-server)
- [OAuth2](../../../../Login-Page/OAuth2.md)
- [Webhook data](../Webhook-data.md)

## How to use it

**Send a board's activities to Rocket.Chat:** create an incoming webhook
integration in Rocket.Chat's administration, then in WeKan:

1. Open the board, its right sidebar, then **Board Settings → Outgoing
   Webhooks** (board admins; for every board at once, Admin Panel → Settings
   → Global Webhooks).
2. Write the **Webhook Name**, the **URL** the receiver gave you and, when the
   receiver wants one, the **Token (Optional for Authentication)**.
3. Choose the type (**Outgoing Webhooks**) and under **Send this webhook:**
   either **Every activity** or the activities to send.
4. Click **Create**. A saved webhook can be changed and saved again, or turned
   off with **Disable This Webhook**.

Rocket.Chat needs nothing added to the webhook's URL: WeKan's body is in the
Slack-compatible format Rocket.Chat reads.

**Run Rocket.Chat from its Snap:**

### Install snapd

Linux:

https://snapcraft.io/docs/installing-snapd

Windows:

https://github.com/wekan/hx/tree/main/prototypes/ui/gambas#install-on-windows

### Install RocketChat Snap

```
sudo snap install rocketchat-server
```

### Setup siteurl

List current Snap settings:
```
sudo snap get rocketchat-server
```
Then set your siteurl of your RocketChat server:
```
sudo snap set rocketchat-server siteurl='https://chat.yourcompany.com'
```

### RocketChat Skip Install Registration Wizard Fix

Q:

- [RocketChat Skip Install Registration Wizard Fix](https://github.com/RocketChat/Rocket.Chat/issues/31163#issuecomment-1848364117)


A:

For someone using snap, it means creating a file `/var/snap/rocketchat-server/common/override-setup-wizard.env ` (the name of the file itself could be anything as long as it has an .env extension) and setting its content to `OVERWRITE_SETTING_Show_Setup_Wizard=completed`
 
Then, restarting the server by `systemctl restart snap.rocketchat-server.rocketchat-server.service`

If it does not work yet, then reboot.

### Workspace version unsupported

Q:

- [Workspace version unsupported, Self-Host Community Server](https://forums.rocket.chat/t/workspace-version-unsupported-self-host-community-server/19698)

A:

1) Change to newest Snap Stable channel, list at https://snapcraft.io/rocketchat-server dropdown menu

```
sudo snap refresh rocketchat-server --channel=6.x/stable --amend
```

2) Register your Self-Managed instance here, so login and mobile app start to work after that:

- https://cloud.rocket.chat/home
- https://chat.yourcompany.com/admin/subscription

### More RocketChat Snap related info

[OAuth2](../../../../Login-Page/OAuth2.md)

https://docs.rocket.chat/deploy/deploy-rocket.chat/deploy-with-snaps

## How the numbers are calculated

The numbers every outgoing webhook has:

- **Timeout**: one request may take 30 seconds (`totalTimeoutMs: 30000` in
  [server/notifications/outgoing.js](../../../../../../server/notifications/outgoing.js)).
  A 2xx answer is success.
- **At once or queued**: a webhook with the built-in delivery settings is
  POSTed at once. One whose delivery groups or schedules its notifications
  goes through the durable queue
  ([server/lib/webhookOutbox.js](../../../../../../server/lib/webhookOutbox.js)),
  scanned every 5 seconds: at most 100 jobs a pass, a body of at most 1 MB,
  and a failed job is tried again after `min(60 minutes, 30 seconds x
  2^(attempts - 1))` - 30 s, 1 min, 2 min, 4 min ... - up to 10 attempts.
- **Internal destinations**: Admin Panel can list at most 50 hosts on WeKan's
  own network that webhooks may reach
  ([models/lib/internalWebhookHosts.js](../../../../../../models/lib/internalWebhookHosts.js)).

## How it works in WeKan

A webhook is a document of the `Integrations` collection
([models/integrations.js](../../../../../../models/integrations.js)): the board it
belongs to (`_global` for Admin Panel → Settings → Global Webhooks), its type
(Outgoing Webhooks, or Two-Way Webhooks whose answer can change the board), its
name, URL, optional token and the activities it sends. Only a board admin or a
site admin may add, change or remove one, and it cannot be moved to another
board ([server/permissions/integrations.js](../../../../../../server/permissions/integrations.js)).
When a board activity happens,
[server/notifications/outgoing.js](../../../../../../server/notifications/outgoing.js)
builds the JSON body ([models/lib/webhookPayload.js](../../../../../../models/lib/webhookPayload.js),
described in [Webhook data](../Webhook-data.md))
and POSTs it through the outgoing request guard
([server/lib/ssrfGuard.js](../../../../../../server/lib/ssrfGuard.js)), which
refuses private, loopback and link-local addresses unless Admin Panel lists
them, and trusts `WEBHOOK_TLS_CA_CERT` for TLS. The webhooks are set in
`outgoingWebhooksPopup` in
[client/components/sidebar/sidebar.jade](../../../../../../client/components/sidebar/sidebar.jade).

## Commits

 - [Add the Rocket.Chat setup notes from the wiki to the docs](https://github.com/wekan/wekan/commit/13be8160d5b6a894c674d04c37ff9e653e7bd4b0)
 - [Add the docs from the wekan.wiki and wekan-snap.wiki](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
