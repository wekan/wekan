# Rule suggestions

## What it is

Board Settings → **Rules** shows, above the rule list, **Suggested rules**:
things people on this board keep doing by hand that a rule could do for them.
It is a count of what really happened on the board, not artificial
intelligence: the same activities always give the same suggestions. Trello's
Butler calls these automation suggestions.

> When a card is moved to **Done**, archive it - Done by hand on 7 cards in
> the last 30 days. **Create rule**

## Read more

- [Event condition action](https://en.wikipedia.org/wiki/Event_condition_action)
  on Wikipedia - the trigger-and-action shape every suggested rule has.
- [Association rule learning](https://en.wikipedia.org/wiki/Association_rule_learning)
  - the general idea of finding "after this, that" pairs by counting; WeKan's
  is a plain count, not a learning algorithm.
- [Trello Butler](https://trello.com/butler) - the automation in Trello these
  follow.
- In WeKan: [Rules (Automation)](Rules/README.md),
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md).

## How to use it

1. Open the board's right sidebar → **Board Settings** → **Rules** (or **List
   view**). You must be a board admin.
2. Above the rule list, read **Suggested rules**. Each line says what the rule
   would do and *Done by hand on N cards in the last 30 days*.
3. Click **Create rule** to make it, or **Dismiss** to hide that suggestion.
4. The new rule is in the rule list like any rule you built by hand; edit or
   delete it there.

### How a suggestion is found

From the board's activities of the last 30 days: when the same person does one
thing to a card and then, within two minutes, another thing to the same card,
that pair is counted for that card. A pair seen on three cards or more becomes
a suggestion, most cards first, at most five.

| First thing (the trigger) | Second thing (the action) |
| --- | --- |
| card moved to a list | label added, member added, card archived |
| card added to a list | label added, member added |
| label added | member added |

A pair that an existing rule of the board already does is not suggested. A
suggestion's **Create rule** makes the trigger, the action and the rule in one
step, exactly as building it by hand would; **Dismiss** hides that one
suggestion for you on this board.

Only board admins see the section, because only they may create rules.

### Hiding it

Admin Panel / Settings / Features: **Rule suggestions**. Rules
themselves are not affected.

## How the numbers are calculated

All in [models/lib/ruleSuggestions.js](../../../models/lib/ruleSuggestions.js):

- **30 days** (`DAYS`): only activities with `createdAt` in the last
  30 × 24 × 60 × 60 × 1000 ms are read, newest first, at most 20,000
  (`MAX_ACTIVITIES` in
  [server/methods/ruleSuggestions.js](../../../server/methods/ruleSuggestions.js)).
- **Two minutes** (`WINDOW_MS` = 2 × 60 × 1000 ms): the activities are grouped
  by card and person and sorted by time; every trigger activity is paired with
  each later allowed action of the same card and person no more than two
  minutes after it.
- **The count** shown is the number of **different cards** the pair happened
  on (`cards.size`), not the number of times: doing it twice on one card counts
  once.
- **Three cards** (`MIN_CARDS`) is the threshold, and **five** (`LIMIT`) the
  most suggestions shown, sorted by the count, then by the pair's key.
- A pair whose list, label or member no longer exists (an archived list, a
  label removed, an inactive member) is not suggested.

## How it works in WeKan

- `models/lib/ruleSuggestions.js` (pure: pairs from activities, counting,
  filtering out existing rules, `isSuggestionKey`).
- Methods `rules.suggestions` and `rules.dismissSuggestion` in
  `server/methods/ruleSuggestions.js`: they answer only a board admin, and only
  while the feature is on for that user (`featureOnFor(userId,
  'rule-suggestions')`); `rules.suggestions` is rate-limited to 10 calls and
  `rules.dismissSuggestion` to 20 calls per 10 seconds per connection. A
  dismissed suggestion's key is stored in your
  `profile.dismissedRuleSuggestions.<boardId>`.
- **Create rule** goes through `rules.createRule`, unchanged.
- Drawn by `ruleSuggestions` in
  [client/components/rules/ruleSuggestions.jade](../../../client/components/rules/ruleSuggestions.jade),
  placed by `rulesMain` in
  [client/components/rules/rulesMain.jade](../../../client/components/rules/rulesMain.jade)
  above `rulesList`, so it shows only in the list view.
- Tests: [tests/ruleSuggestions.test.cjs](../../../tests/ruleSuggestions.test.cjs)
  and [tests/rulesWorkflowViewToggle.test.cjs](../../../tests/rulesWorkflowViewToggle.test.cjs).

## Commits

 - [Rule suggestions from what people on a board keep doing by hand](https://github.com/wekan/wekan/commit/2211b2411931b84ef0ec71c197e5630f71bff3c6)
