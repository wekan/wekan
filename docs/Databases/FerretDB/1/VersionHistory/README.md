# Version history in the database: Dolt and TerminusDB, and WeKan's undo and redo

WeKan's undo and redo (Ctrl+Z, Ctrl+Y, History → Restore, see
[History](../../../../Features/General/History/History.md) and
[Undo](../../../../Features/General/Undo/Undo.md)) is application code: one
`changeHistory` row per change, with who, when and which field, and a restore that
reapplies the old values oldest to newest. Some databases version their data
themselves. This asks what that would give WeKan, by trying WeKan-shaped changes
(edit a card's title, move it, archive it, delete another one) on two of them.

```sh
# Dolt, under FerretDB's MySQL handler - WeKan's writes arrive over the MongoDB protocol
docker run -d --name dolttry -p 3307:3306 -e DOLT_ROOT_PASSWORD=rootpw -e DOLT_ROOT_HOST=% \
  -e DOLT_DATABASE=ferretdb dolthub/dolt-sql-server:latest
mysql ... -e 'SET GLOBAL dolt_transaction_commit = 1'          # a Dolt commit per transaction
ferretdb --handler=mysql --mysql-url='mysql://root:rootpw@127.0.0.1:3307/ferretdb' --listen-addr=127.0.0.1:27022
node docs/Databases/FerretDB/1/VersionHistory/dolt-history.cjs

# TerminusDB - REST only
docker run -d --name tdbtry -p 6363:6363 terminusdb/terminusdb-server:latest
node docs/Databases/FerretDB/1/VersionHistory/terminusdb-history.cjs
```

Run on 2026-11-03: Dolt (sql-server image, MySQL 8.0.31 protocol) with FerretDB
v1.105.0, and TerminusDB 12.0.9. Both are open source (Apache-2.0).

## What was found

| WeKan needs | Dolt under FerretDB | TerminusDB |
| --- | --- | --- |
| A record of every change | **Yes, with no change to WeKan.** With `dolt_transaction_commit` on, every FerretDB write is one Dolt commit (four writes, four commits). | Yes, one commit per write. |
| Who made it | **No.** The committer is the SQL user (`root`) for every WeKan user, and the message is always `Transaction commit`. FerretDB would have to set them. | **Yes.** Each commit has the author and message the caller gives: `alice \| edit title`. |
| What changed | Whole documents: an edit is a removed row and an added row in `dolt_diff_<table>`, because FerretDB's tables have no primary key and a card is one JSON cell. Fields are found by comparing the two. | **Field by field**: `{"title": {"@before": "Write docs v2", "@after": "Write docs", "@op": "SwapValue"}}`. |
| Undo the last change | **Yes.** `CALL DOLT_REVERT('HEAD')` brought a deleted card back, read through FerretDB over the MongoDB protocol; reverting that revert is the redo. Both are commits of their own, so history is never rewritten. | **Yes**: diff the last two commits and apply it backwards (`/api/diff`, `/api/patch`). |
| Restore one older change, keep the later ones | **Another document: yes. The same document: no.** Reverting an old title edit of card c1 after c1 was moved and archived failed with `the table(s) ... are in conflict` (the whole document is one cell). The failed revert left nothing behind, and FerretDB writes kept working. | **Yes, by field.** The title was restored while the move and the archive stayed: `title: "Write docs", listId: "l2", archived: true`. A patch whose before-value no longer matches is the conflict. |
| The board as it was | **Yes**, in SQL: `SELECT ... AS OF '<commit>'`. FerretDB does not offer it over the MongoDB protocol. | **Yes**: `GET /api/document/.../local/commit/<id>`. |
| Undo "my last change" or "this board's last change" | **No.** `HEAD` is the last commit of anyone on anything. A scope means choosing commits by their diff. | The log is per database; a scope is also chosen by the diff. |
| Cost per write | **+0.4 ms**: `updateOne` took 2.34 ms with commits off and 2.77 ms with them on (200 calls each), +18%. 223 commits for 200 updates. | About 25 ms per `PUT` of a card, an HTTP call and a commit each. |
| Can WeKan run on it | **Yes**: it is a MySQL-protocol database that FerretDB's MySQL handler already runs (it is in the [speed test](../SpeedTest/)). | **No.** It has neither the MongoDB protocol nor SQL; WeKan would need a new data layer. |

## What it means for WeKan

- **WeKan's own History is still the right undo.** It knows the user, the field,
  and the card, list or swimlane a change belongs to, and it restores one field
  while later changes stay. Dolt cannot do that for a document edited again
  afterwards, and it does not know who made a change; TerminusDB can, but WeKan
  cannot run on it.
- **Dolt would add something WeKan does not have: the whole database at any
  commit.** Restoring a board, or all of them, as they were an hour ago is
  `AS OF` or `DOLT_RESET`, with no code in WeKan. It is a backup and audit layer
  under the undo, not a replacement for it. Its costs are real: a commit per
  write of everything WeKan writes (sessions, activities and search sessions
  included, which are not the user's changes), so the history is mostly noise.
  And Dolt is slow for WeKan's reads: in the [speed test](../SpeedTest/Results.md)
  every query over cards takes about 2.8 s on 15,377 cards (MySQL: 1-8 ms), 20,470
  ms in total against MySQL's 103, because it scans the table instead of using the
  indexes. A production-size WeKan on it would not be usable as it is.
- **What FerretDB would need for Dolt to answer "who"**: set the commit author and
  message from the MongoDB command's `comment`, or the connection's user. It does
  neither today.
- **Not tried**: Dolt branches and merges for a draft board, and TerminusDB's
  history of a single document, which would answer "this card's history" directly.
