REST API is not complete yet, please add missing functionality with pull requests to devel branch.

If you are in a hurry, you can use these to have more functionality:
* https://restheart.org
* http://vulcanjs.org

For workflows see [If-this-then-that issue](https://github.com/wekan/wekan/issues/1160) than mentions Huginn, Flogo etc.

# Wekan REST API

The REST API allows you to control and extend Wekan with ease.

If you are an end-user and not a dev or a tester, [create an issue](https://github.com/wekan/wekan/issues/new) to request new APIs.

> All API calls in the documentation are made using `curl`.  However, you are free to use Java / Python / PHP / Golang / Ruby / Swift / Objective-C / Rust / Scala / C# or any other programming languages.

## Production Security Concerns
When calling a production Wekan server, ensure it is running via HTTPS and has a valid SSL Certificate. The login method requires you to post your username and password in plaintext, which is why we highly suggest only calling the REST login api over HTTPS. Also, few things to note:

* Only call via HTTPS
* Implement a timed authorization token expiration strategy
* Ensure the calling user only has permissions for what they are calling and no more

# Summary

### Authentication
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `POST` | `/users/login` | [Authenticate with the REST API.](#login) |

### Users
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `POST` | `/users/register` | [Register a new user.](User.md#user-register) |
| `POST` | `/api/users` | [Create a new user.](User.md#user-create) |
| `PUT` | `/api/users/:id` | [Disable an existing user.](User.md#disable-a-user-the-user-is-not-allowed-to-login-and-his-login-tokens-are-purged) |
| `PUT` | `/api/users/:id` | [Enable an existing user.](User.md#enable-a-user) |
| `PUT` | `/api/users/:id` | [Admin takes the ownership.](User.md#the-admin-takes-the-ownership-of-all-boards-of-the-user-archived-and-not-archived-where-the-user-is-admin-on) |
| `DELETE` | `/api/users/:id` | [Delete an existing user.](User.md#user-delete) ([Warning](https://github.com/wekan/wekan/issues/1289))|
| `GET` | `/api/users/:id` | [Gets a user's information.](User.md#user-information) |
| `GET` | `/api/users` | [All of the users.](User.md#user-list) |
| `GET` | `/api/user` | [Gets a logged-in user.](User.md#user-logged-in) |
### Cards
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `POST` | `/api/boards/:boardId/lists/:listId/cards` | [Add a card to a list, board, and swimlane.](Cards.md#add-card-to-list-board-swimlane) |
| `PUT` | `/api/boards/:boardId/lists/:fromListId/cards/:cardId` | [Update a card.](Cards.md#update-a-card) |
| `DELETE` | `/api/boards/:boardId/lists/:listId/cards/:cardId` | [Delete a card.](Cards.md#update-a-card) |
### Rules (Board Automation / IFTTT)
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `GET` | `/api/boards/:boardId/rules` | [List all automation rules of a board.](Rules.md#list-rules) |
| `GET` | `/api/boards/:boardId/rules/:ruleId` | [Get one rule with its trigger and action.](Rules.md#get-one-rule) |
| `POST` | `/api/boards/:boardId/rules` | [Add an automation rule, e.g. add/remove a member when a card is moved to/from a list (#2674).](Rules.md#add-a-rule) |
| `PUT` | `/api/boards/:boardId/rules/:ruleId` | [Edit a rule's title, trigger and/or action.](Rules.md#edit-a-rule) |
| `DELETE` | `/api/boards/:boardId/rules/:ruleId` | [Remove a rule and its trigger and action.](Rules.md#delete-a-rule) |
### Board Domain Sharing
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `GET` | `/api/boards/:boardId/domains` | [List the email domains a board is shared with.](#list-board-domains) |
| `POST` | `/api/boards/:boardId/domains` | [Share a board with an email domain.](#add-a-board-domain) |
| `DELETE` | `/api/boards/:boardId/domains/:domain` | [Stop sharing a board with an email domain.](#remove-a-board-domain) |
### GlobalAdmin Settings
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `GET` | `/api/settings` | [Read the Admin Panel global settings.](#get-settings) |
| `PUT` | `/api/settings` | [Update the Admin Panel global settings.](#update-settings) |
### Attachments
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `GET` | `/api/boards/:boardId/attachments` | List the live attachments of a board. |
| `GET` | `/api/boards/:boardId/attachments/deleted` | [List the soft-deleted attachments of a board.](#list-deleted-attachments) |
| `DELETE` | `/api/boards/:boardId/attachments/:attachmentId` | [Soft-delete an attachment.](#soft-delete-an-attachment) |
| `POST` | `/api/boards/:boardId/attachments/:attachmentId/restore` | [Restore a soft-deleted attachment.](#restore-an-attachment) |
### Board Settings: card field order
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `GET` | `/api/boards/:boardId/cardFieldOrder` | [Get the order of the opened card's sections.](#get-the-card-field-order) |
| `PUT` | `/api/boards/:boardId/cardFieldOrder` | [Set the order of the opened card's sections.](#set-the-card-field-order) |
### Admin Panel: Problems
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/problems` | [The Problems status overview and new-problem counts.](#problems-overview) |
| `GET` | `/api/admin/problems/:stream` | [One page of a problem stream.](#problem-stream) |
| `POST` | `/api/admin/problems/:stream/acknowledge` | [Acknowledge a stream's new problems.](#acknowledge-a-stream) |
### Admin Panel: OAuth login providers and passwordless
| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/oauth-providers` | [Which source is in effect for every provider setting.](#get-oauth-provider-settings) |
| `PUT` | `/api/admin/oauth-providers/:providerKey` | [Update one provider's Admin Panel settings.](#update-an-oauth-provider) |
| `PUT` | `/api/admin/passwordless` | [Turn passwordless login on or off.](#passwordless) |


---

# Login
| URL | Requires Auth | HTTP Method |
| :--- | :--- | :--- |
| `/users/login` | `no` | `POST` |

## Payload

### Authentication with username
| Argument | Example | Required | Description |
| :--- | :--- | :--- | :--- |
| `username` | `myusername` | Required | Your username |
| `password` | `my$up3erP@ssw0rd` | Required | Your password |

### Authentication with email
| Argument | Example | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `my@email.com` | Required | Your email |
| `password` | `my$up3erP@ssw0rd` | Required | Your password |

* Notes:
 * **You will need to provide the `token` for any of the authenticated methods.**

## Example Call - As Form Data

DOES NOT WORK ! Please use As JSON example below !
https://github.com/wekan/wekan/issues/4807

```bash
curl http://localhost:3000/users/login \
     -d "username=myusername&password=mypassword"
```

```bash
curl http://localhost:3000/users/login \
     -d "email=my@email.com&password=mypassword"
```


## Example Call - As JSON

THIS WORKS !! Alternatively, look at api.py example at https://github.com/wekan/wekan

NOTE: Username and password is case sensitive. So type BIG and small letters correctly.

```bash
curl -H "Content-type:application/json" \
      http://localhost:3000/users/login \
      -d '{ "username": "myusername", "password": "mypassword" }'
```

```bash
curl -H "Content-type:application/json" \
      http://localhost:3000/users/login \
      -d '{ "email": "my@email.com", "password": "mypassword" }'
```


## Result
```json
{
  "id": "user id",
  "token": "string",
  "tokenExpires": "ISO encoded date string"
}
```

## Result example
```json
{
  "id": "XQMZgynx9M79qTtQc",
  "token": "ExMp2s9ML1JNp_l11sIfINPT3wykZ1SsVwg-cnxKdc8",
  "tokenExpires": "2017-12-15T00:47:26.303Z"
}
```

---

# Board Domain Sharing

Boards can be shared with every user on an email **domain** (for example everyone
with an `@example.com` address). These endpoints list, add and remove the domains a
board is shared with.

A board admin (or a site admin) is required to add or remove domains. Domains are
validated: they are stored lowercase, must contain a `.`, and must not contain `@`
or whitespace.

The matching `api.py` commands are `boarddomains`, `addboarddomain` and
`removeboarddomain`.

## List board domains
| URL | Requires Auth | HTTP Method |
| :--- | :--- | :--- |
| `/api/boards/:boardId/domains` | `yes` | `GET` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     http://localhost:3000/api/boards/abcd1234/domains
```

## Add a board domain
| URL | Requires Auth (board admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/boards/:boardId/domains` | `yes` | `POST` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/abcd1234/domains \
     -d '{ "domain": "example.com" }'
```

## Remove a board domain
| URL | Requires Auth (board admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/boards/:boardId/domains/:domain` | `yes` | `DELETE` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -X DELETE \
     http://localhost:3000/api/boards/abcd1234/domains/example.com
```

---

# GlobalAdmin Settings

These endpoints read and update the **Admin Panel** global settings (registration,
product name, logos, custom head / manifest, accessibility and support pages, and
so on). They are **global-admin only**.

Updates are applied through a field **whitelist**, so only the supported settings
fields can be changed. For security, `mailServer` / SMTP credentials are **never
returned** by `GET` and are **never writable** by `PUT`.

The matching `api.py` commands are `getsettings` and `editsettings <field> <value>`.

## Get settings
| URL | Requires Auth (global admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/settings` | `yes` | `GET` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     http://localhost:3000/api/settings
```

## Update settings
| URL | Requires Auth (global admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/settings` | `yes` | `PUT` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X PUT \
     http://localhost:3000/api/settings \
     -d '{ "productName": "My WeKan", "disableRegistration": true }'
```

---

# Attachments

Deleting an attachment from a card is a **soft delete** (see
[History.md §12](../Features/Reports/History/History.md)): the file is kept,
the card and the minicard badge hide it, and the card history - or this API -
restores it. There is **no hard delete of a single attachment** over the API;
the one hard delete is deleting an archived board with Admin Panel / Problems /
Delete enabled. All three endpoints go through the same server methods the
card and the card history use, so the permission check, the cover unset and
the history row are the ones the UI gets.

## List deleted attachments
| URL | Requires Auth (board access) | HTTP Method |
| :--- | :--- | :--- |
| `/api/boards/:boardId/attachments/deleted` | `yes` | `GET` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     http://localhost:3000/api/boards/BOARDID/attachments/deleted
```

Result:

```json
[
  {
    "attachmentId": "sKHd9a2vLQ7Wq3xPz",
    "attachmentName": "spec.pdf",
    "attachmentType": "application/pdf",
    "boardId": "BOARDID",
    "swimlaneId": "yhY4RJmoZ2P7hFjQm",
    "listId": "vFnjPvQHnKf2EzRfE",
    "cardId": "a2oXL5HGdVTZuTjxi",
    "deletedAt": "2026-09-11T10:12:41.203Z",
    "deletedBy": "USERID",
    "deleteBatchId": "attachment-1789107161203-USERID"
  }
]
```

The live attachments are listed by `GET /api/boards/:boardId/attachments`.

## Soft-delete an attachment
| URL | Requires Auth (may edit the card) | HTTP Method |
| :--- | :--- | :--- |
| `/api/boards/:boardId/attachments/:attachmentId` | `yes` | `DELETE` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -X DELETE \
     http://localhost:3000/api/boards/BOARDID/attachments/ATTACHMENTID
```

Result: `{ "deleted": true, "batchId": "attachment-1789107161203-USERID" }`.
Idempotent: an attachment that is already deleted is left as it is. If the
attachment was the card's cover, the cover is unset.

## Restore an attachment
| URL | Requires Auth (may edit the card) | HTTP Method |
| :--- | :--- | :--- |
| `/api/boards/:boardId/attachments/:attachmentId/restore` | `yes` | `POST` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -X POST \
     http://localhost:3000/api/boards/BOARDID/attachments/ATTACHMENTID/restore
```

Result: `{ "restored": true }` (`false` when the attachment was not deleted).
The cover is never re-set by a restore.

---

# Board Settings: card field order

The opened card draws its Labels, Dates, Members, Custom Fields and Description
sections in the order Board Settings sets. Whatever is stored, the order in
effect always contains each of the five keys exactly once: unknown keys are
dropped, duplicates keep their first position, and a missing key is appended in
its default position.

## Get the card field order
| URL | Requires Auth (board access) | HTTP Method |
| :--- | :--- | :--- |
| `/api/boards/:boardId/cardFieldOrder` | `yes` | `GET` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     http://localhost:3000/api/boards/BOARDID/cardFieldOrder
```

Result:

```json
{
  "cardFieldOrder": ["labels", "dates", "members", "customFields", "description"],
  "keys": ["labels", "dates", "members", "customFields", "description"]
}
```

## Set the card field order
| URL | Requires Auth (board admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/boards/:boardId/cardFieldOrder` | `yes` | `PUT` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X PUT \
     http://localhost:3000/api/boards/BOARDID/cardFieldOrder \
     -d '{ "cardFieldOrder": ["description", "customFields", "labels", "dates", "members"] }'
```

Returns the order in effect, in the same shape as `GET`.

---

# Admin Panel: Problems

The **Admin Panel → Problems** pages over the API, **global-admin only** and
read-only apart from acknowledging a stream. Each row of a stream is a
summary that accumulates (`count`, `firstAt`..`at`, `actors`), never a row per
event - see [Problems](../Features/Admin-Panel/Problems/README.md).

## Problems overview
| URL | Requires Auth (global admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/admin/problems` | `yes` | `GET` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     http://localhost:3000/api/admin/problems
```

Result:

```json
{
  "inProgress": [{ "kind": "board-repair", "active": true, "message": "Board data-repair — 12/146 boards" }],
  "problems": [{ "id": "broken-cards", "severity": "warning", "count": 3, "title": "Broken cards", "detail": "..." }],
  "newProblems": [{ "stream": "security", "count": 2 }, { "stream": "database", "count": 1 }],
  "streams": ["security", "speed", "tests", "cpu", "database", "integrity"]
}
```

## Problem stream
| URL | Requires Auth (global admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/admin/problems/:stream` | `yes` | `GET` |

`:stream` is one of `security`, `speed`, `tests`, `cpu`, `database`,
`integrity` or `api` (the REST API usage report). Query parameters: `limit`
(1..200, default 50), `skip` (default 0) and `search` (case-insensitive text
over the columns the page shows).

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     "http://localhost:3000/api/admin/problems/database?limit=20&search=disk"
```

Result: `{ "stream": "database", "total": 1, "limit": 20, "skip": 0, "rows": [ ... ] }`.

## Acknowledge a stream
| URL | Requires Auth (global admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/admin/problems/:stream/acknowledge` | `yes` | `POST` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -X POST \
     http://localhost:3000/api/admin/problems/security/acknowledge
```

Result: `{ "acknowledged": "security" }`. The overview then reports zero new
problems for the stream until the next one is recorded.

---

# Admin Panel: OAuth login providers and passwordless

The **Admin Panel / People / Login** section for Meteor's own accounts-*
login services (Google, GitHub, Facebook, X/Twitter, Meteor Developer, Weibo,
Meetup) and passwordless email codes - see
[OAuth Providers](../Features/Login/OAuth-Providers.md) and
[Passwordless](../Features/Login/Passwordless.md). **Global-admin only.** A
value saved here wins over the `OAUTH_*` / `PASSWORDLESS_ENABLED` environment
variable and takes effect without a restart. **A provider's secret is never
returned**: it is reported only as `{ "source", "hasValue" }`.

## Get OAuth provider settings
| URL | Requires Auth (global admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/admin/oauth-providers` | `yes` | `GET` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     http://localhost:3000/api/admin/oauth-providers
```

Result (`source` is `env`, `admin` or `unset`):

```json
{
  "providers": {
    "google": {
      "enabled": { "source": "admin", "value": true },
      "id": { "source": "env", "value": "1234.apps.googleusercontent.com" },
      "secret": { "source": "env", "hasValue": true }
    },
    "github": { "enabled": { "source": "unset", "value": null }, "id": { "source": "unset", "value": null }, "secret": { "source": "unset", "hasValue": false } }
  },
  "loginStyle": { "source": "env", "value": "popup" },
  "mergeExistingUsers": { "source": "unset", "value": null },
  "passwordless": { "source": "admin", "value": false }
}
```

## Update an OAuth provider
| URL | Requires Auth (global admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/admin/oauth-providers/:providerKey` | `yes` | `PUT` |

`:providerKey` is one of `google`, `github`, `facebook`, `twitter`,
`meteor-developer`, `weibo`, `meetup`. Body fields, all optional: `enabled`,
`id`, `secret` (an empty or missing secret keeps the stored one), `loginStyle`
(`popup` or `redirect`), and the two settings shared by every provider,
`globalLoginStyle` and `mergeExistingUsers`.

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X PUT \
     http://localhost:3000/api/admin/oauth-providers/github \
     -d '{ "enabled": true, "id": "Iv1.abc123", "secret": "...", "loginStyle": "redirect" }'
```

Returns the same source report as `GET` - without the secret.

## Passwordless
| URL | Requires Auth (global admin) | HTTP Method |
| :--- | :--- | :--- |
| `/api/admin/passwordless` | `yes` | `PUT` |

```bash
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X PUT \
     http://localhost:3000/api/admin/passwordless \
     -d '{ "enabled": true }'
```

Result: `{ "passwordless": { "source": "admin", "value": true } }`.
