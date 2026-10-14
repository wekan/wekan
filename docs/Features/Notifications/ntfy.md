# Notifications on your phone with ntfy

[#5148](https://github.com/wekan/wekan/issues/5148). [ntfy](https://ntfy.sh) is
a free, open source push service with Android and iOS apps. Each member can have
their WeKan notifications sent to an ntfy topic of their own.

1. In the ntfy app, subscribe to a topic. On the public server ntfy.sh anybody
   who knows a topic's name can read it, so use a long, secret name - or run
   your own ntfy server with access control.
2. In WeKan: **Member Settings → Notification Settings → ntfy phone
   notifications**. Paste the topic's address (`https://ntfy.sh/a-long-secret-name`
   or `https://ntfy.example.com/team`), add an access token if the topic needs
   one, tick **Send my notifications to ntfy** and save.

Each notification you would get in WeKan - same boards, same watching, same
activity kinds left out under *Which activity notifies me* - also arrives in
the app: the board and card as the title, what happened as the message, and a
tap opens the card.

- The topic address and token are yours alone: they are saved through your own
  account, never shown to other members, and never sent to browsers.
- They go through WeKan's SSRF guard like every outgoing webhook. An ntfy
  server on WeKan's own network is reached only when a site admin lists it
  under Admin Panel → Settings → Global Webhooks → **Internal destinations**.
- It is best effort, like any phone push: an ntfy server that is down only
  leaves a line in WeKan's server log, and your e-mail and in-app
  notifications are unaffected.

## Browser notifications

[#2026](https://github.com/wekan/wekan/issues/2026). Without any app: Member
Settings → Notification Settings → **Browser notifications on this device** →
**Turn on for this device**. The browser asks for permission, and from then on
every notification you get in WeKan also pops up from that browser - even when
WeKan's tab is closed - and a click opens the card. Turn it on in each browser
and device you use; up to ten per account.

WeKan makes its own key pair for this once, keeps the private key on the
server, and sends only to the push services browsers use (Google, Mozilla,
Apple, Microsoft), so a member cannot point it anywhere else. It is not
offered on Sandstorm.
