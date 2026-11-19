# Disclaimer

This page tries to be as up to date as possible. If you see something wrong here, feel free to update the page and help other people like you, that greatly depends on our APIs. If you don't feel comfortable doing this kind of changes, please contact us by creating an [issue](https://github.com/wekan/wekan/issues/new).

# Retrieve cards by swimlane id

| API URL / Code Link | Requires Admin Auth | HTTP Method |
| :--- | :--- | :--- |
| [/api/boards/:boardId/swimlanes/:swimlaneId/cards](https://github.com/wekan/wekan/blob/c115046a7c86b30ab5deb8762d3ef7a5ea3f4f90/models/cards.js#L487) | `yes` | `GET` |

```shell
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -X GET \
     http://localhost:3000/api/boards/YRgy7Ku6uLFv2pYwZ/swimlanes/PgTuf6sFJsaxto5dC/cards
```
## Result example

```shell
[
  {
    "_id": "AzEeHS7KAGeYZCcak",
    "boardId": "YRgy7Ku6uLFv2pYwZ",
    "title": "Create Auth Code",
    "description": "Create Auth Code for application.",
    "listId": "RPRtDTQMKpShpgqoj",
    "dueAt": "2026-11-30T12:00:00.000Z",
    "assignees": ["Ji7nMxZPTcqBDhdNa"],
    "sort": 1,
    "modifiedAt": "2026-11-19T10:00:00.000Z",
    "dateLastActivity": "2026-11-19T10:00:00.000Z",
    "labelIds": ["fHTCkZ"],
    "members": ["Ji7nMxZPTcqBDhdNa"],
    "customFields": [{ "_id": "jN7WWYvD8ywjgcpbM", "value": "Customer A" }]
  },
...
]
```

Only active (not archived) cards, in their sort order. A field the card does
not have is left out.

# Retrieve cards by list id

| API URL / Code Link | Requires Admin Auth | HTTP Method |
| :--- | :--- | :--- |
| /api/boards/:boardId/lists/:listId/cards | `no` - a board member | `GET` |

```shell
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -X GET \
     http://localhost:3000/api/boards/YRgy7Ku6uLFv2pYwZ/lists/RPRtDTQMKpShpgqoj/cards
```

The same fields as by swimlane, with `swimlaneId` in place of `listId`.

## Fields for syncing

Both card lists carry what a client needs to keep a copy of a board without
a `GET` per card ([#6928](https://github.com/wekan/wekan/issues/6928)):

- `modifiedAt` and `dateLastActivity` - a card whose values did not change
  since the last sync can be skipped;
- `labelIds` - the board's label ids, as in `GET /api/boards/:boardId`;
- `members` - user ids;
- `customFields` - `[{ "_id": "<custom field id>", "value": ... }]`. The value
  of an **admin-only** custom field is `null` unless the caller is an admin of
  the board, exactly as in the single-card `GET`.

Checklists, comments and attachments are still only in the single-card `GET`.

# Add Card to List-Board-Swimlane

| API URL / Code Link | Requires Admin Auth | HTTP Method |
| :--- | :--- | :--- |
| [/api/boards/:boardId/lists/:listId/cards](https://github.com/wekan/wekan/blob/c115046a7c86b30ab5deb8762d3ef7a5ea3f4f90/models/cards.js#L487) | `yes` | `POST` |

```shell
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/YRgy7Ku6uLFv2pYwZ/lists/PgTuf6sFJsaxto5dC/cards \
     -d '{ "title": "Card title text", "description": "Card description text", "authorId": "The appropriate existing userId", "swimlaneId": "The destination swimlaneId" }'
```
## Result example
The new card's ID is returned in the format:
```json
{
    "_id": "W9m9YxQKT6zZrKzRW"
}
```

# Update a card
You can change (any of) the card's title, list, and description.

| API URL / Code Link | Requires Admin Auth | HTTP Method |
| :--- | :--- | :--- |
| [/api/boards/:boardId/lists/:fromListId/cards/:cardId](https://github.com/wekan/wekan/blob/c115046a7c86b30ab5deb8762d3ef7a5ea3f4f90/models/cards.js#L520) | `yes` | `PUT` |

```shell
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X PUT \
     http://localhost:3000/api/boards/YRgy7Ku6uLFv2pYwZ/lists/PgTuf6sFJsaxto5dC/cards/ssrNX9CvXvPxuC5DE \
     -d '{ "title": "New title text", "listId": "New destination listId", "description": "New description text" }'
```
## Result example
The card's ID is returned in the format:
```json
{
    "_id": "W9m9YxQKT6zZrKzRW"
}
```
# Delete a card

| API URL / Code Link | Requires Admin Auth | HTTP Method |
| :--- | :--- | :--- |
| [/api/boards/:boardId/lists/:listId/cards/:cardId](https://github.com/wekan/wekan/blob/c115046a7c86b30ab5deb8762d3ef7a5ea3f4f90/models/cards.js#L554) | `yes` | `DELETE` |

```shell
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X DELETE \
     http://localhost:3000/api/boards/YRgy7Ku6uLFv2pYwZ/lists/PgTuf6sFJsaxto5dC/cards/ssrNX9CvXvPxuC5DE \
     -d '{ "authorId": "the appropriate existing userId"}'
```
## Result example
The card's ID is returned in the format:
```json
{
    "_id": "W9m9YxQKT6zZrKzRW"
}
```

# In Wekan code

If you believe that code is the best documentation, be our guest: [models/cards.js](../../models/cards.js "Card API code")