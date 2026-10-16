# Bots

Board Settings → **Bots**, below **Workflow view**, is the [Rules](Rules/Rules.md)
page's view for **bots**: runners on your own server that this board hands
cards to. A runner can be an AI coding agent, a CI job or a script. The view
looks and works like kanbots, in the board's own theme, Font Awesome icons and
drag and drop. Like the rest of the Rules page it is for **board admins only**.
It is not a board view: it is not in the Board View menu and can never be a
public view.

```
┌ Bots ───────────┬ Dev / Bots              2 running · 1 waiting for you ─┬ Fix login ─────┐
│ ⚙ Coder  host   │ TODO 3      │ IN PROGRESS 2        │ REVIEW 1 │ DONE  │ [Coder ▾][▶ Hand]│
│ [+ Add bot]     │ ┌─────────┐ │ ┌──────────────────┐ │          │       │ ■ Stop           │
│ ⚡ Live runs     │ │bug #12  │ │ │feat #7 RUNNING   │ │          │       │ RUNNING · $0.12  │
│  RUNNING Fix…   │ │Fix login│ │ │Add export        │ │          │       │ 💬 alice: please…│
│ ⟲ Activity      │ └─────────┘ │ │>_ Bash: npm test │ │          │       │ ⚙ Edit: login.js │
│  Coder: Edit…   │             │ │? Which file?     │ │          │       │ [Reply…] [Send]  │
│                 │             │ │[a.js] [b.js]     │ │          │       │                  │
└─────────────────┴─────────────┴──────────────────────┴──────────┴───────┴──────────────────┘
```

- **The rail**: this board's bots (add one with a name, the runner's address
  and an optional signing token), the **live runs** with what each is doing,
  and the bots' recent **activity**.
- **The columns** are the board's lists. Each card shows its first label, its
  number, its bot run's state (*Queued*, *Running*, *Waiting for you*, *Ready
  to review*, *Done*, *Failed*, *Stopped*), the step it is on, and when the bot
  asked a question, the answers to click. Drag a card to another column to
  move it, as on the board.
- **The drawer** shows a card's thread: its comments and its run's events, in
  order. **Hand to bot** gives the card to a bot, **Stop** stops the run, and
  the reply box answers the bot.

## A bot has no rights of its own

Bots are like Rules and workflows: they act only through what WeKan already
allows, and override no WeKan permission.

- **WeKan only sends to a bot.** A bot is an outgoing webhook marked as a bot.
  Handing it a card queues one dispatch through the ordinary webhook queue:
  the SSRF guard, the bot's signing token as `X-Wekan-Token`, retries, and on
  Sandstorm the Powerbox. A bot is subscribed to no board activity, due
  reminders included, so nothing else from the board is sent to it.
- **The runner works through the REST API.** It changes the board with its
  own WeKan user's API token, so it has that user's board role and nothing
  more: comments, moves, labels and archiving are WeKan REST calls that WeKan
  allows or refuses as for anyone.
- **Who hands over.** A board admin, in this view, or a Rule a board admin made
  with the action **Hand the card to bot**. For example, "when a card is moved
  to *In progress*, hand it to *Coder*" is kanbots' drag-to-start.
- **Answers and replies** are the admin's own card comments, written under
  their right to comment in that list, and the bot is told.

## The runner's side

The dispatch is a JSON `POST` to the runner's address:

```json
{ "event": "bot.dispatch", "runId": "…", "bot": { "id": "…", "title": "Coder" },
  "board": { "id": "…", "title": "Dev", "key": "DEV" },
  "card": { "id": "…", "number": 7, "title": "…", "description": "…",
            "list": { "id": "…", "title": "In progress" }, "labels": ["bug"], "url": "…" },
  "comments": [{ "id": "…", "text": "…", "at": "…" }],
  "report": "https://<wekan>/api/boards/<board>/cards/<card>/bot-runs/<run>",
  "api": "https://<wekan>/api" }
```

The runner reports at `report` with its own API token
(`Authorization: Bearer <token>`); WeKan requires write access to the board:

```json
{ "status": "running", "tool": "Bash", "text": "npm test" }
{ "status": "awaiting_input", "question": "Which file?", "options": ["a.js", "b.js"] }
{ "status": "review", "text": "Ready: see the comment", "tokens": 1200, "costUsd": 0.12 }
```

`status` is one of `queued`, `running`, `awaiting_input`, `review`, `done`,
`failed` and `stopped`. A finished run (`done`, `failed`, `stopped`) stays
finished, the last 50 events are kept, and texts are bounded. Later the runner
receives `bot.answer` (`value`, `text`), `bot.reply` (`text`) and `bot.stop`.

## Files

| File | |
| --- | --- |
| `client/components/rules/rulesBots.jade`, `.js`, `.css` | The view |
| `server/bots.js` | Handing over, answers, replies, stopping, the run report route |
| `models/lib/botRuns.js` | A run's states and what may change them. No Meteor code |
| `models/botRuns.js` | The runs, written by the server only, published to board admins |
| `tests/botRuns.test.cjs`, `server/lib/tests/bots.tests.js` | The tests |
