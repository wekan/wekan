# Rules

## What it is

Board automation, opened from the board's right sidebar → **Board Settings** →
**Rules** (`client/components/rules/rulesMain.jade`). A rule is a trigger and an
action; rules run on the server (`server/rulesHelper.js`) for the board they
belong to.

## How to use it

Open a board's right sidebar, click **Board Settings**, then **Rules** or one
of the Rules page's views right below it (**List view**, **Workflow view**,
**Bots**, **Blocks**, **History**, **Import / Export rules**). Board admins
change rules; a member reads them where the board shows its Rules. The pages:

- [Rules (Automation)](Rules/README.md) — triggers, actions and the rule list
- [Blocks view](Rules/Blocks.md) — building a rule from blocks (`client/components/rules/rulesBlocks.jade`)
- [IFTTT](IFTTT/README.md) — the original IFTTT rules design
- [Rule suggestions](Rule-Suggestions.md) — rules offered from what people keep doing by hand
- [Bots](Bots.md) — external runners the board hands cards to (`client/components/rules/rulesBots.jade`)

See the pages above.

## Commits

 - [Rule suggestions from what people on a board keep doing by hand](https://github.com/wekan/wekan/commit/2211b2411931b84ef0ec71c197e5630f71bff3c6)
 - [Board Settings / Bots: hand cards to external runners](https://github.com/wekan/wekan/commit/aa48a2b71dea95842cba4daa908e6e236aaef1dd)
 - [File the Rules pages the way the WeKan menus are](https://github.com/wekan/wekan/commit/b7589737f5730ce1ba83244946e158519528a783)
