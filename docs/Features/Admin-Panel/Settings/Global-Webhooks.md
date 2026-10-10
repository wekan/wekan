# Admin Panel / Settings / Global Webhooks

Outgoing webhooks for the whole instance, added and edited with the same form a board
uses for its own webhooks — the difference is only that these fire for every board.

Each webhook has a URL, a type, and the token used to sign the request.

Under each saved one-way webhook, *Outgoing Webhooks* chooses whether it sends
the message text, which groups of properties it sends, whether several
notifications go in one POST and when it is sent (#3695). A global webhook
follows its own choice, then Admin Panel / People / Notifications; a board's
settings never apply to it. See [Webhook data](../../Webhooks/Webhook-data.md)
and [Notification delivery](../../Notifications/Notification-Delivery.md).

## Related

- [Outgoing webhooks](../../Webhooks/) — the payload, the types, and per-board
  webhooks.
