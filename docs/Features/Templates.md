[VIDEO ABOUT HOW TO USE BOARD TEMPLATES](https://www.youtube.com/watch?v=K0_cP85Bvas)

[More about templates explained here](https://github.com/wekan/wekan/issues/3127#issuecomment-634348524)

[Templates feature requests and bugs](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+templates+label%3AFeature%3ATemplates)

***
There is currently:
- [Per-user templates](https://github.com/wekan/wekan/issues/2209), it works as described below.
- Card hamburger menu / Copy Checklist Template to Many Cards

At [Roadmap](https://boards.wekan.team/b/D2SzJKZDS4Z48yeQH/wekan-open-source-kanban-board-with-mit-license) of xet7, Maintainer of Wekan, these already have [some funding](https://wekan.team/commercial-support/):
- [Collapsible Swimlanes with count](https://github.com/wekan/wekan/issues/2804)
- [Single fixed list titles static at top of swimlanes view](https://github.com/wekan/wekan/issues/2805).
- [Main Boards/Organizing Boards/Nested Tabs](https://github.com/wekan/wekan/issues/2796) + [Shared templates](https://github.com/wekan/wekan/issues/2209) + [Top Level Projects](https://github.com/wekan/wekan/issues/641).
- [Teams/Organization Templates](https://github.com/wekan/wekan/issues/802).
- [Bug: Board templates aren't created automatically whenever the user was created by REST API or OAuth2](https://github.com/wekan/wekan/issues/2339).

These don't yet have [funding](https://wekan.team/commercial-support/):
- [Notification Email templates](https://github.com/wekan/wekan/issues/2148).
- [Email templates](https://github.com/wekan/wekan/issues/2022).
- [Import and Export Checklists](https://github.com/wekan/wekan/issues/904).

At Roadmap of some other Wekan Contributors:

- Prettify email notifications.

***

# Current Per-User Templates Feature

## 1) All Boards page, top right: Templates

### a) Create Card templates

1. Create a new list to Card Templates Swimlane
2. Add template cards to that new list.

### b) Create List templates

1. Create Lists to List Templates Swimlane
2. Add cards etc content to lists.

### c) Create Board Templates

1. Create List to Board Templates Swimlane.
2. Create Card to List that is at Board Templates Swimlane
3. Clicking black folder icon on that card goes to your new Board Template full screen view.
4. Add content to your Board Template

## 2) Insert new Cards/Lists/Boards from Templates

### a) Insert Card Templates

1. Go to some board.
2. Click Add Card. (Do not write card text).
3. Click Template.
5. Write new Title for template card you are planning to add.
4. Search for Template Card name or see that Template Card name is visible.
6. Click that Template Card.
7. Now Template Card is inserted with your new title.

### b) Insert List Templates

1. Go to some board.
2. At right edge or all lists, click Add List. (Do not add list name).
3. Click Template.
4. Write new Title for Template List you are planning to add.
5. Search for Template List Name or see if Template List Name is visible.
6. Click that Template List Name.
7. Now Template List is inserted with your new title.

### c) Insert Board Templates

1. Go to All Boards.
2. Click Add Board. (Do not add new board name).
3. Click Template.
4. Write new Title for Template Board you are planning to add.
5. Search for Template Board Name or see if Template Board Name is visible.
6. Click that Template Board Name.
7. Now Template Board is inserted with your new title.