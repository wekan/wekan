# Board and My Dependencies

Issue [#6732](https://github.com/wekan/wekan/issues/6732): one user turning the
dependency lines on turned them on for everyone on the board, and on some boards
a member who could see the board could not turn them on at all. Card
dependencies ("Red Strings", [RedStrings.md](RedStrings.md)) now come in two
layers, and showing them is each user's own choice.

## The two layers

| | Board Dependencies | My Dependencies |
| --- | --- | --- |
| Saved | on the board (each card's `cardDependencies`) | in your user profile (`profile.myDependencies`) |
| Who sees them | everyone who shows Board Dependencies on that board | only you |
| Who edits them | roles that can **edit or move** cards | you, always |
| Drawn as | solid lines | dashed lines |

A My Dependency is a line between two cards of one board, like a Board
Dependency, with the same relation types, colours and icons. It is a private
note: nobody else sees it, and it changes nothing on the board.

## Member Settings

At the top of **Member Settings** (your avatar):

1. **Show My Dependencies** - on or off.
2. **Show Board Dependencies** - on or off.
3. **Import** - add dependencies from a file.
4. **Export** - save dependencies to a file.

Both switches are **off by default** and are saved in your profile, so they
follow you to every board and every device. Turning one on changes only what
you see. Anyone who can view a board may show its dependencies; the switch
needs no board permission. The board header no longer has a
**Show dependencies** button.

## Who may edit Board Dependencies

A board member whose role may **edit cards or move cards** may add, change
and remove Board Dependencies:

| Role | Edit Board Dependencies |
| --- | --- |
| Board admin, Normal | yes |
| Worker (moves cards, cannot edit them) | yes |
| Normal - assigned only | yes, on cards assigned to them |
| Comment only, Comment - assigned only, No comments, Read only, Read - assigned only | no |

An assigned-only member only sees the cards assigned to them, so both cards of
a line they add must be cards they can see. The same rule applies everywhere a
Board Dependency is written: drawing a line, the card details' Dependencies
section, the line popup, Import, and the REST API
(`POST`/`PUT`/`DELETE /api/boards/:boardId/cards/:cardId/dependencies`). A
site admin may always edit them.

Every user may edit their own My Dependencies, between cards they can see.

## Drawing a line

When a layer you can add to is shown, each minicard has a connect handle.
Dragging it onto another card adds the line:

- to the **Board Dependencies** when they are shown and your role may edit
  them;
- otherwise to **My Dependencies** when those are shown.

Clicking a line opens its popup. A Board Dependency line can be changed or
removed only by a role that may edit Board Dependencies; others see it read
only. A My Dependency line is always yours to change or remove.

## Import and Export

Both work on the board that is open, in the same formats as
**Board Settings / Export / Dependencies**: WeKan dependencies JSON, and an SVG
picture that carries every line in `data-*` attributes, so it can be imported
again.

- **Export** saves My Dependencies or Board Dependencies, as JSON or SVG.
- **Import** reads a JSON or SVG file (or pasted text) into My Dependencies or
  Board Dependencies. Importing into Board Dependencies is offered only to roles
  that may edit Board Dependencies, and the server checks it again for every
  line.

Cards in the file are matched to the open board by id, then card number, then
exact title, so a file exported from one board applies to a copy of it.

**An import combines; it never replaces.** A line that is not on the board yet
is added. A line that is already there - the same two cards in the same
direction - is kept exactly as it is, and the import reports it as already
there. Lines whose cards cannot be found, or which you may not edit, are
reported as unmatched. The same applies to **All Boards / Import /
Dependencies**.

## Implementation

| Part | Where |
| --- | --- |
| The rule: who may see and edit what, merging | `models/lib/dependencyAccess.js` |
| Server methods: `setDependencyVisibility`, `setBoardDependency`, `removeBoardDependency`, `importBoardDependencies`, `setMyDependency`, `removeMyDependency`, `importMyDependencies`; REST permission | `server/models/dependencies.js` |
| Profile fields `showBoardDependencies`, `showMyDependencies`, `myDependencies` (written only by the methods) | `models/users.js` |
| The two layers on the client, and where a drawn line goes | `client/lib/dependencyLayers.js` |
| Overlay and line popup | `client/components/boards/dependencyOverlay.{jade,js}` |
| Member Settings items and the Import / Export popups | `client/components/users/dependencyMenu.{jade,js}` |

The board field `showDependencies` is no longer read; it stays in the schema so
existing boards and board imports still validate.
