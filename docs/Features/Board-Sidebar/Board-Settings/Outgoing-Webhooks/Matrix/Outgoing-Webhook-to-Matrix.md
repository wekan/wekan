# Outgoing webhook to Matrix

[#1100](https://github.com/wekan/wekan/issues/1100). WeKan's notifications can
go to a Matrix room through an ordinary outgoing webhook. WeKan needs no Matrix
bot, account or access token of its own.

## How it works

[matrix-hookshot](https://github.com/matrix-org/matrix-hookshot), the Matrix
project's own integration service, has **generic webhooks**: an address that
posts what it receives into a room. A JSON body with a top-level `text` field
becomes the message. That is exactly what WeKan's outgoing webhook sends: the
activity as a sentence in `text` (`models/lib/webhookPayload.js`), plus
whichever properties the webhook is set to carry.

## Set it up

1. **In Matrix** (Element or any client), in the room the notifications should
   go to, with hookshot on your homeserver: invite the hookshot bot and run
   `!hookshot webhook wekan`. It answers with an address such as
   `https://hookshot.example.org/webhook/abcdef…`. matrix.org and other public
   servers may not run hookshot; it is part of your own homeserver's setup.
2. **In WeKan**: Board Settings → **Outgoing Webhooks** → add one with that
   address (or Admin Panel → Settings → Global Webhooks for every board).
   Choose the activities to send. Only the `text` is needed, so the webhook's
   **delivery** setting can turn off the extra properties.
3. Make a change on the board: the sentence appears in the room, for example
   *"Alice moved Fix login to Done at board Dev https://wekan.example.com/b/…"*.

## Notes

- The address is reached through WeKan's SSRF guard like every webhook, so it
  must be a public address: a hookshot reachable only on WeKan's internal
  network is refused. Publish hookshot's webhook listener through your
  reverse proxy, as its documentation describes.
- Hookshot can also format messages with a JavaScript transformation on its
  side, for example to make the card title a link. WeKan's body is the
  documented webhook payload ([Webhook data](../Webhook-data.md)).
- Two-way webhooks are not for Matrix: a reply in the room does not come back
  to WeKan.
