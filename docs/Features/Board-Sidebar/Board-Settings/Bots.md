# Board Settings / Bots

## What it is

**Right sidebar / Board Settings / Bots** (`fa-android`) is the third of the
Rules entries, after **List view** and **Workflow view**. It opens the board's
Rules page in its **Bots** view: runners on your own server - an AI agent, a CI
job, a script - that this board hands cards to. A bot has no rights in WeKan of
its own: it is sent a signed dispatch, and it acts on the board only through
the REST API as an ordinary WeKan user.

## Read more

- [Wikipedia: Software agent](https://en.wikipedia.org/wiki/Software_agent)
- [Wikipedia: Webhook](https://en.wikipedia.org/wiki/Webhook)
- [Rules / Bots](../../Rules/Bots.md): what the view shows and how a bot is
  added, run and answered
- [Automation rules](../../Rules/Rules/Rules.md)

## How to use it

1. Open the board, its right sidebar, then **Board Settings → Bots** (board
   admins only).
2. The board's Rules page opens in its **Bots** view
   (`openRulesViewFromBoardMenu('bots')` in
   [client/components/sidebar/sidebar.js](../../../../client/components/sidebar/sidebar.js)).
3. Add, run and answer bots there, as described in
   [Rules / Bots](../../Rules/Bots.md).

Like every entry of the Rules group it is shown to **board admins only**. It
is not a board view, so it is not in the Board View menu.

## How the numbers are calculated

The limits of a bot run, in
[models/lib/botRuns.js](../../../../models/lib/botRuns.js):

- a run keeps at most its last 50 events (`MAX_EVENTS`);
- a text a runner reports is cut to 4,000 characters (`MAX_TEXT`), and the
  name of the tool it is using to 200 characters;
- a question to the board offers at most 8 options (`MAX_OPTIONS`);
- a run is `queued`, `running`, `awaiting_input` or `review` while it is
  active, and ends `done`, `failed` or `stopped`.

## How it works in WeKan

The menu entry is in `boardMenuPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade),
inside the board-admin group. The view is
[client/components/rules/rulesBots.jade](../../../../client/components/rules/rulesBots.jade)
and [client/components/rules/rulesBots.js](../../../../client/components/rules/rulesBots.js).
A bot is an outgoing webhook (an Integration marked `bot`,
[models/integrations.js](../../../../models/integrations.js)) subscribed only to
the `bot-dispatch` activity, so it is sent dispatches and nothing else, through
the outgoing request guard. A run is stored in
[models/botRuns.js](../../../../models/botRuns.js); what may change it is the
pure module [models/lib/botRuns.js](../../../../models/lib/botRuns.js), pinned
by [tests/botRuns.test.cjs](../../../../tests/botRuns.test.cjs); the server
side is [server/bots.js](../../../../server/bots.js).

## Commits

 - [Board Settings / Bots: hand cards to external runners, as kanbots does](https://github.com/wekan/wekan/commit/aa48a2b71dea95842cba4daa908e6e236aaef1dd)
