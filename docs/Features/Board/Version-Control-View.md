# Version Control view

Board → View → **Version Control** shows the board as a repository's issue
tracker. It is laid out like GitHub and Gitea and drawn in the board's own
theme. It uses the board's own data, and no second copy of anything is kept:

| GitHub / Gitea | Version Control view |
| --- | --- |
| Repository name | The board's title (and **Public** for a public board) |
| An issue | A card. Its title, its description, its comments as the conversation |
| Issue number | The upstream number of an imported or synced issue (`Source: #12`), otherwise the card number |
| Open / Closed | **Closed**: the card is archived, or is in a list named *Closed*, *Done*, *Resolved*, *Merged* or *Wontfix*, or a synced issue is closed upstream. Everything else is **Open** |
| Labels | The board's labels, with their colours |
| Milestones | Labels with a [due date](Labels-Milestone-Due-Date.md), and the `milestone:<title>` labels the importers make |
| Assignees | The card's assignees and members |
| Author | The card's *Requested by* (an imported issue's author), else whoever made the card |
| Files | The card's attachments |
| History, git log | The board's [change history](../Reports/History/History.md), where **Restore** undoes a change |

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⑂ my-project  Public        Import: GitHub GitLab Gitea Forgejo  ⟳ Sync  │
│ ◉ Issues 12 │ ⚑ Milestones 2 │ 🏷 Labels 7 │ 📄 Files 4 │ ⟲ History      │
├──────────────────────────────────────────────────────────────────────────┤
│ [is:open label:bug                     ] [Labels] [Milestones] [New issue]│
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ ◉ 12 Open   ✓ 30 Closed                                   [Newest ▾] │ │
│ │ ◉ Crash on start  bug                                   👤  💬 3     │ │
│ │   #41 opened 2026-10-01 by alice   ⚑ v1.0                            │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

## Tabs

- **Issues**: the issue list, with a search box that takes GitHub's search
  words: `is:open`, `is:closed`, `label:bug`, `-label:wontfix`,
  `milestone:"v1.0"`, `author:alice`, `assignee:@me`, `no:label`,
  `no:milestone`, `no:assignee` and `sort:created-desc`, `created-asc`,
  `updated-desc` or `comments-desc`. Other words are searched in the number,
  the title and the description. Clicking a label or a milestone filters by
  it.
- **One issue**: the issue page, with the description and the comments as a
  timeline and a comment box. **Close issue** / **Reopen issue** and, at the
  side, the assignees, labels, milestones and files. **Open as card** opens
  the card popup, where everything else is edited: labels, people, dates, and
  uploading files.
- **New issue**: a title, a description and labels. The card is made in the
  board's open list (the first list not named like a closed one, or a new
  *Open* list).
- **Milestones**: each milestone with its due date, overdue when it has open
  issues past it, and its progress bar of closed issues.
- **Labels**: each label with its number of open issues.
- **Files**: every attachment of the board's cards, with the issue it is on.
- **History**: the board's history table: who changed what and when, searchable
  and per person. **Restore** undoes the selected changes. Closing, reopening
  and new issues are ordinary card changes, so they appear here and can be
  undone like any other.

## Closing and reopening

**Close issue** moves the card to the board's *Closed* list, or to the first
list named like a closed one. A board without one gets a *Closed* list.
**Reopen issue** moves it back to the open list, and restores it if it was
archived. The move is an ordinary card move: History records it and Restore
undoes it.

A **synced** issue (below) is closed and reopened in its own tracker, and the
next sync brings the new state. Its card stays in its synced list, because
moving it out would make the sync see the issue as gone.

## Importing and syncing

**Import** at the top opens the existing importers for
[GitHub](../ImportExport/GitHub/GitHub.md),
[GitLab](../ImportExport/GitLab), [Gitea](../ImportExport/Gitea) and
[Forgejo](../ImportExport/Forgejo). They make a new board in the database
WeKan is running on, with a card per issue in *Open* and *Closed* lists, the
issue's labels and milestone as labels, its comments as card comments, and:

- **its files as card attachments**, stored where every upload is stored:
  Admin Panel → Attachments → **Default Storage**. A file is a GitHub
  `user-attachments` / `user-images` link in the issue or a comment, a GitLab
  `/uploads/…` link, or a Gitea / Forgejo issue or comment asset or
  `/attachments/<uuid>` link (`models/lib/issueAttachments.js`, at most 50 per
  issue). Each one is downloaded through the import's SSRF guard, which
  checks every redirect hop, and the upload checks its type and size. A file
  that cannot be fetched is listed in the import's losses in Admin Panel →
  Problems → Recovery.

**Sync** keeps a list up to date with a repository: List menu → **Sync**, the
same [list sync](../ImportExport/Sync.md) Jira uses. It brings every issue,
open and closed, page by page, and the issues added since last time, every
15 minutes or with **Sync now**. For each synced list the Version Control
header has a **Sync from GitHub: <list>** button. With the sync option
**Comments, labels, state and files** a sync also brings, for GitHub, GitLab,
Gitea and Forgejo:

| What | How |
| --- | --- |
| Comments | GitHub and Gitea: one paged list of the whole repository's comments (`/issues/comments`). GitLab: each issue's notes. One card comment per upstream comment, keyed by its id. An edit upstream updates it. A comment written in WeKan is never touched |
| Labels | Board labels named like the issue's (made when missing, with a stable colour). A label that sync added and the issue no longer has is taken off. A label added in WeKan stays |
| State | Open or closed upstream, shown by this view |
| Files | As for the import, each URL once, at most 100 downloads a run (the rest come next run) |

It is off by default because it writes comments and files into the cards. A
rate-limited answer is waited out once when the API frees up within a minute;
otherwise the run ends and says when to try again, and the next run picks it
up. These are the same request patterns as git-bug's GitHub and GitLab
bridges and Gitea's repository migrations. Gitea issues are fetched with
`type=issues`, so pull requests are not downloaded only to be dropped.

## Public boards

Like every view, Version Control can be offered on a public board, and be the
view it opens in: Board Settings → [Board View](../Right-Sidebar/Board-Settings/Board-View.md).
A visitor who is not logged in sees it read-only: the **New issue**, close,
reopen, comment, import and sync controls are not drawn, and the server
refuses them anyway.

## Files

| File | |
| --- | --- |
| `client/components/boards/versionControlView.jade`, `.js`, `.css` | The view |
| `server/versionControlView.js` | `vcsCreateIssue`, `vcsSetIssueState` |
| `models/lib/versionControlView.js` | State, number, milestones, search, progress. No Meteor code |
| `models/lib/issueAttachments.js` | Which links of an issue are its files |
| `models/lib/listSyncIssueDetails.js`, `server/lib/listSyncIssueDetails.js` | Sync's comments, labels, state and files |
| `tests/versionControlView.test.cjs`, `tests/issueAttachments.test.cjs`, `tests/listSyncIssueDetails.test.cjs` | The tests |
