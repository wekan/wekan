# Notifications on your phone with ntfy

## What it is

Each member can have their WeKan notifications also pushed to their phone or
browser, without e-mail. [ntfy](https://ntfy.sh) is a free, open source push
service with Android and iOS apps: WeKan sends every notification to an ntfy
topic of the member's own ([#5148](https://github.com/wekan/wekan/issues/5148)).
Browser notifications do the same with no app at all, through the browser's own
push service ([#2026](https://github.com/wekan/wekan/issues/2026)).

## Read more

- [ntfy](https://ntfy.sh) and its [documentation](https://docs.ntfy.sh/).
- [Push technology](https://en.wikipedia.org/wiki/Push_technology) and
  [Server-side request forgery](https://en.wikipedia.org/wiki/Server-side_request_forgery)
  on Wikipedia; the [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
  on MDN and the [web-push](https://github.com/web-push-libs/web-push) library.
- WeKan pages: [Notification delivery](Notification-Delivery.md),
  [Notification Settings](../Member-Settings/Notifications.md),
  [Global Webhooks](../Admin-Panel/Settings/Global-Webhooks.md).

## How to use it

**ntfy.**

1. In the ntfy app, subscribe to a topic. On the public server ntfy.sh anybody
   who knows a topic's name can read it, so use a long, secret name - or run
   your own ntfy server with access control.
2. In WeKan: **Member Settings → Notification Settings → ntfy phone
   notifications**. Paste the topic's address into **Topic address**
   (`https://ntfy.sh/a-long-secret-name` or `https://ntfy.example.com/team`),
   add an **Access token (optional)** if the topic needs one, tick **Send my
   notifications to ntfy** and save.

Each notification you would get in WeKan - same boards, same watching, same
activity kinds left out under *Which activity notifies me* - also arrives in
the app: the board and card as the title, what happened as the message, and a
tap opens the card.

**Browser notifications.** Without any app: Member Settings → Notification
Settings → **Browser notifications on this device** → **Turn on for this
device**. The browser asks for permission, and from then on every notification
you get in WeKan also pops up from that browser - even when WeKan's tab is
closed - and a click opens the card. Turn it on in each browser and device you
use; up to ten per account. **Turn off for this device** stops it.

## How the numbers are calculated

From [models/lib/ntfy.js](../../../models/lib/ntfy.js) and
[models/lib/webPush.js](../../../models/lib/webPush.js):

- A topic name is 1 to 64 letters, digits, `_` or `-`; the address is at most
  500 characters, http or https, with no user, password, query or fragment.
- The token is at most 200 printable ASCII characters.
- The message is cut at 4000 characters and the title at 250; the request
  times out after 10 seconds.
- Browser notifications: at most 10 devices per account
  (`MAX_SUBSCRIPTIONS`); adding an eleventh drops the oldest. A push lives
  3600 seconds (`TTL`) at the push service and times out after 10 seconds; a
  device whose push service answers 404 or 410 is forgotten. The methods are
  rate-limited to 10 calls per 10 seconds per connection.

## How it works in WeKan

**ntfy.**

- `ntfyRequest()` builds a JSON publish (POST to the server's root with
  `{ topic, title, message, click }`), so a title in any language needs no
  header encoding; [server/notifications/ntfy.js](../../../server/notifications/ntfy.js)
  sends it.
- The topic address and token are yours alone: they are saved through your own
  account, never shown to other members, and never sent to browsers.
- They go through WeKan's SSRF guard like every outgoing webhook. An ntfy
  server on WeKan's own network is reached only when a site admin lists it
  under Admin Panel → Settings → Global Webhooks → **Internal destinations**.
- It is best effort, like any phone push: an ntfy server that is down only
  leaves a line in WeKan's server log, and your e-mail and in-app
  notifications are unaffected.

**Browser notifications.** WeKan makes its own key pair for this once, keeps the
private key on the server, and sends only to the push services browsers use
(Google, Mozilla, Apple, Microsoft), so a member cannot point it anywhere else
(`isPushServiceEndpoint()` in `models/lib/webPush.js`;
[server/webPush.js](../../../server/webPush.js)). It is not offered on
Sandstorm.

The settings form is
[client/components/settings/notificationSettingsPopup.js](../../../client/components/settings/notificationSettingsPopup.js).
Tests: [tests/ntfy.test.cjs](../../../tests/ntfy.test.cjs),
[tests/webPush.test.cjs](../../../tests/webPush.test.cjs) and
[server/lib/tests/webPush.tests.js](../../../server/lib/tests/webPush.tests.js).

## Commits

 - [Browser push notifications, per device](https://github.com/wekan/wekan/commit/0a5ae3e20546fff846cfcb97f960a6e6e65e114a)
 - [ntfy as a notification channel, per member](https://github.com/wekan/wekan/commit/d873af70e802be2418874124b2cb92ee300109ab)
