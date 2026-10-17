# Rule suggestions

Board hamburger menu → **Rules** shows, above the rule list, **Suggested rules**:
things people on this board keep doing by hand that a rule could do for them.

> When a card is moved to **Done**, archive it - you did this 7 times in the last
> 30 days. **Create rule**

## How a suggestion is found

From the board's activities of the last 30 days: when the same person does one
thing to a card and then, within two minutes, another thing to the same card,
that pair is counted. A pair counted three times or more becomes a suggestion,
most frequent first, at most five.

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

## Hiding it

Admin Panel / Settings / Visibility / Features: **Rule suggestions**. Rules
themselves are not affected.

## Implementation

`models/lib/ruleSuggestions.js` (pure: pairs from activities, counting,
filtering out existing rules), method `rules.suggestions` in
`server/methods/ruleSuggestions.js`, drawn by `rulesMain` in
`client/components/rules/rulesMain.jade`. Tests: `tests/ruleSuggestions.test.cjs`.
