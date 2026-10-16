# Mattermost

WeKan's outgoing webhooks post to a Mattermost **incoming webhook**: Board
Settings → Outgoing Webhooks, paste the incoming webhook's address, and each
board activity appears in that channel.

## Direct messages to the card's people

[#1297](https://github.com/wekan/wekan/issues/1297). Tick **Also send a
Mattermost direct message to the card's members and assignees** on a saved
webhook, and every message about a card is also sent to each of its members
and assignees as a direct message, so they see what happened to their cards
even when they do not follow the channel.

- In Mattermost, the incoming webhook must **not** be locked to its channel
  ("Lock to this channel" off), because a direct message is the same webhook
  posting to `@username`.
- A WeKan member is messaged under their WeKan user name, so it should be the
  same as their Mattermost user name; one that is not a valid Mattermost user
  name is skipped.
- The person who made the change is not messaged about it, nobody is messaged
  twice, and a card with very many people stops at 50 messages.
- The channel message still follows the webhook's grouping and schedule; the
  direct messages go at once. Both go through WeKan's SSRF guard, as every
  outgoing webhook does.
