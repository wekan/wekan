# Optional APIs: Trello, Jira, GitHub and Gitea compatible

Admin Panel → Settings → Visibility → **Optional APIs** turns on REST APIs in
the shape of other trackers' APIs (#4930). An app or script written for Trello,
Jira, GitHub or Gitea can then use this WeKan as its backend: what it saves is
stored in WeKan's database, on WeKan boards, and is seen in WeKan like any
other change.

| Tick | Server address for the client | Signs in with |
| --- | --- | --- |
| Trello-compatible API | `https://<wekan>/api/compat/trello` (paths `/1/...`) | `?token=<WeKan token>` (`?key=` is ignored), or `Authorization: Bearer` / `OAuth oauth_token="..."` |
| Jira-compatible API | `https://<wekan>/api/compat/jira` (paths `/rest/api/2/...`) | Basic authentication with the WeKan token as the password (any user name), or `Bearer` |
| GitHub-compatible API | `https://<wekan>/api/compat/github` | `Authorization: token <WeKan token>` or `Bearer` |
| Gitea-compatible API | `https://<wekan>/api/compat/gitea/api/v1` | `Authorization: token <WeKan token>`, `Bearer`, or `?token=` |

The token is a WeKan API token: the `token` from `POST /users/login`, as in the
[REST API](REST-API.md).

## What they may do: exactly what the person may do

**None of these APIs has rights of its own.** Each one is a translator: a
request in Trello's, Jira's, GitHub's or Gitea's shape becomes the matching
request to WeKan's own REST API, made with the caller's own token, and WeKan's
answer is turned into the other tracker's JSON. So:

- a client sees only the boards its person may see, and writes only where that
  person may write: board roles, read-only and comment-only members,
  assigned-only members, list permissions and every other WeKan permission
  apply unchanged;
- whatever WeKan's REST API refuses, these APIs refuse;
- WeKan's REST API must be on (`WITH_API=true`): with it off, every optional API
  is off too;
- an API that is not ticked answers 404, as if it did not exist.

`tests/optionalApis.test.cjs` fails if any file of `server/compatApi/` writes
to a collection, calls a method, or makes a request anywhere except WeKan's
own REST API on the loopback address.

## What maps to what

| | Trello | Jira | GitHub, Gitea |
| --- | --- | --- | --- |
| Board | board | project (key = the [board key](../Features/Board/Boards/Board-Key.md)) | repository `owner/<board key or id>` |
| List | list | status; a transition moves the card | the open / closed list |
| Card | card | issue `KEY-7` | issue `#7`, open or closed as in [Version Control](../Features/Board/Version-Control-View.md) |
| Labels | labels and `idLabels` | `labels` | labels; a label with a due date is a milestone |
| Comments | `commentCard` actions | `/issue/{key}/comment` | `/issues/{n}/comments` |
| Checklists | checklists | - | - |
| Delete | archives the card (restorable) | archives the issue | - |

The endpoints:

- **Trello**: `members/me` and its `boards`; `boards/{id}`, its `lists`,
  `cards`, `labels` and `members`; `POST boards/{id}/labels`; `lists/{id}/cards`
  (with `?idBoard=`), `POST lists` and `PUT lists/{id}`; `GET`, `POST`, `PUT` and
  `DELETE cards/{id}`; `cards/{id}/actions` and `POST
  cards/{id}/actions/comments`; `POST` and `DELETE cards/{id}/idLabels`;
  `cards/{id}/checklists` and `POST checklists`.
- **Jira**: `myself`; `project` and `project/{key}` with its `statuses`;
  `search` by GET or POST with simple JQL (`project`, `status`, `assignee =
  currentUser()`, `text ~`, `key`, `AND`, `ORDER BY created|updated|key`);
  `GET`, `POST`, `PUT` and `DELETE issue/{key}`; `issue/{key}/comment`;
  `issue/{key}/transitions`. JQL WeKan does not answer is an error, not a
  different answer.
- **GitHub and Gitea**: `user`, `user/repos`; `repos/{owner}/{repo}`; its
  `issues` (with `state`, `labels`, `page`, `per_page`, and `Link` and
  `X-Total-Count` headers), `POST` an issue, `GET` and `PATCH issues/{n}`
  (title, body, state, labels), `issues/{n}/comments`, `labels` and
  `milestones`. A synced issue is closed in its own tracker.

## Files

| File | |
| --- | --- |
| `models/lib/optionalApis.js` | The catalog, the switch and each client's way of sending the token |
| `models/lib/trelloCompatApi.js`, `jiraCompatApi.js`, `githubCompatApi.js` | The shapes, both ways. No Meteor code |
| `server/compatApi/core.js` | The switch, and the calls to WeKan's REST API as the caller |
| `server/compatApi/trello.js`, `jira.js`, `githubLike.js` | The routes |
| `tests/optionalApis.test.cjs`, `server/lib/tests/compatApi.tests.js` | The tests; the second over real HTTP |
