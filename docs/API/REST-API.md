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
