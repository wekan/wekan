# Sandstorm

WeKan imports the grain backups of [Sandstorm](https://sandstorm.org)
([source](https://github.com/sandstorm-io/sandstorm)) apps, and exports a board
as a grain backup Sandstorm restores. The import page and the export menu list
them under the heading **Sandstorm**.

| App | Import (the grain's content) | Export (a grain Sandstorm restores) |
| --- | --- | --- |
| WeKan | boards, lists, swimlanes, cards, labels, members, dates, checklists, comments, attachments | — (see below) |
| Prioritize | each task, its repeat period and urgency growth | yes |
| Yet Another TODO list | each todo, in To do or Done | yes |
| μTodo | each todo, in To do or Done | yes |
| SandChat | the room as a card, its messages as comments | yes |
| EtherCalc | each sheet as a list, each row as a card | yes |
| Radicale calendar | events and tasks | yes |
| Radicale address book | contacts, with their e-mail, phone, organization and the rest as custom fields | yes |
| Davros | each folder as a list, each file as a card (text files as its description, other files as its attachment) | yes |
| Hacker CMS | each page of the site's source as a card | yes |
| Gogs | issues of each repository, Open and Closed, with labels, milestone, assignee and comments | — |
| WordPress | posts and pages by status, with categories, tags and approved comments | — |

## How to import

1. In Sandstorm, open the grain and choose **Download backup** in the grain's
   top bar. Sandstorm downloads the grain as a `.zip`.
2. In WeKan, go to **All Boards → New → Import**, and under **Sandstorm**
   choose the grain's app.
3. Choose the `.zip`.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

A grain of another app than the one chosen is refused with the name of its app;
a grain of an app WeKan cannot read (below) is refused with the reason.

## How to import many boards at once

1. On the import page, choose the app under **Sandstorm**, then under **Import
   many boards** choose several grain backups.
2. Each grain becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

The grains are imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: a WeKan grain with several boards becomes those boards again.

From a script:

```bash
python3 api.py importboardsfrom sandstormyatl FILE_OR_DIR ...
```

## How to export

1. Open the board, then **Board Settings → Export**, and under **Sandstorm**
   choose the app. The board downloads as `<board>.zip`.
2. In Sandstorm, choose **Restore grain backup** on the Grains page (or
   **Apps → Restore grain backup**), and choose the `.zip`. The app has to be
   installed on that Sandstorm.

The restored grain is owned by whoever restores it. How each app gets the board:
a card is a Prioritize task (its repeat period from the custom field **Repeat
every (days)**, else a week), a todo of Yet Another TODO list or μTodo (done
when its list is named Done or it is archived), a row of an EtherCalc sheet
(Title, List, Swimlane, Labels, Start, Due, Description), a Radicale event
(with a date) or task (without), a Radicale contact, a Davros file
`<list>/<card>.md` with its attachments in `<list>/<card>/`, or a Hacker CMS
page; the comments of every card are the messages of one SandChat room.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then an app under **Sandstorm**.
2. One `.zip` downloads, with one grain backup per board you can export.

From a script:

```bash
python3 api.py exportallboards sandstormyatl boards.zip
```

## Format details

A grain backup (`src/sandstorm/backup.c++`) is a `.zip` of `metadata`, `log`
(the grain's console) and the grain's `/var` as `data/`. `metadata` is a
`GrainInfo` (`src/sandstorm/grain.capnp`) as an unpacked Cap'n Proto message -
the app id, the app version, the grain's title, the owner and the users -
which WeKan reads and writes without a Cap'n Proto library
(`models/lib/sandstorm/grainInfo.js`). What is in `data/` is each app's own
storage (`models/lib/sandstorm/grainApps.js`, `server/lib/sandstormGrain.js`):

| App | Its data in the grain |
| --- | --- |
| WeKan | FerretDB's SQLite backend, `data/files/db/wekan.sqlite`: a table of JSONB documents per collection, each with its own type schema; attachments in `data/files/attachments/` |
| Prioritize | `data/data.json` (`jobs`: title, period in milliseconds, lastDone, urgencyGrowth), `data-version`, `csrfkey` |
| Yet Another TODO list | SQLite `data/db.sqlite3`, table `todos` (id, done, descr) |
| μTodo | `data/todo.db/`, a bitcask log: key size, value size, key, JSON value and the value's CRC-32 per entry |
| SandChat | SQLite `data/db.sqlite3` of a Rails app: `chats`, `users`, `tabs` |
| EtherCalc | `data/dump/snapshot-<sheet>.txt`, SocialCalc's save format; `snapshot-sheet.txt` the index of the sheets |
| Radicale | `data/lib/radicale/owner/calendar.ics` or `addressbook.vcf` with its `.props`, and `data/action.txt` (`caldav` or `carddav`) |
| Davros | the files themselves, under `data/davros/data/` |
| Hacker CMS | a Jekyll site: `data/src/` (front matter, Markdown or HTML), `data/published`, and `data/www`, a symbolic link to it |
| Gogs | SQLite `data/gogs/data/gogs.db` |
| WordPress | SQLite `data/wordpress/wp-content/database/.ht.sqlite` (the SQLite Integration plugin) |

A SQLite database is read with Node's own `node:sqlite`, from a copy in a
directory of its own that is removed afterwards; it is never written back.

## What is kept

What the table above lists for each app. Titles, descriptions, lists, labels,
dates, people, comments and files go where each app has them; what an app has
no place for is written in the card's custom fields when WeKan reads it back.

## What is not kept

- **WeKan, Gogs and WordPress are imported only.** A grain of theirs is a whole
  installation: WeKan's users there are the Sandstorm identities of that grain,
  which no file can know beforehand, so its boards would have no members; Gogs
  keeps git repositories and its configuration beside its database, WordPress
  its PHP. To move a board into WeKan on Sandstorm, export it as WeKan's JSON or
  `.zip` and import that in the grain.
- **Rocket.Chat, Text Editor, SandForms and Piwik are not imported.** They keep
  their data in MongoDB's or MySQL's database files, which only those database
  engines read. Rocket.Chat's own export (**My Account → Download my data**)
  is imported under Rocket.Chat.
- On import: a WordPress site's media files, Gogs' pull requests, Davros' file
  cache and the apps' logs. On export: comments other than SandChat's,
  checklists, and the dates and labels of the apps that have none.

What was left out is listed in the import's loss report, also in **Admin Panel
→ Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/<source>` with `{ "zipBase64": "..." }`,
  where `<source>` is `sandstormwekan`, `sandstormprioritize`, `sandstormyatl`,
  `sandstormmutodo`, `sandstormsandchat`, `sandstormethercalc`,
  `sandstormradicalecalendar`, `sandstormradicalecontacts`, `sandstormdavros`,
  `sandstormhackercms`, `sandstormgogs` or `sandstormwordpress`.
- Export: `GET /api/boards/:boardId/export/<source>` for the apps WeKan writes.

## How it is built and tested

`tests/sandstormGrain.test.cjs` writes and reads `GrainInfo`, reads a grain's
users from a SandChat grain's metadata with every name replaced; writes a board
as each app's grain and reads it back; checks the written grains have the
layout of the apps' own (Yet Another TODO list's table, μTodo's CRCs,
SocialCalc's save format, Hacker CMS's `www` link); reads a WeKan, a Gogs and a
WordPress grain made in the test; and refuses another app's grain, an
unreadable app's, a backup without metadata, a damaged μTodo file and a path
out of `data/`. The readers were also run on real grains of every app above.

## Sources

- [Sandstorm](https://sandstorm.org)
- [Sandstorm source](https://github.com/sandstorm-io/sandstorm)
- [grain.capnp (GrainInfo)](https://github.com/sandstorm-io/sandstorm/blob/master/src/sandstorm/grain.capnp)
- [backup.c++](https://github.com/sandstorm-io/sandstorm/blob/master/src/sandstorm/backup.c++)
- [Cap'n Proto encoding](https://capnproto.org/encoding.html)
- [SocialCalc save format](https://github.com/marcelklehr/socialcalc)
- [prologic/bitcask](https://git.mills.io/prologic/bitcask)
