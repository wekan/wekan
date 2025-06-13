# Disclaimer

This page tries to be as up to date as possible. If you see something wrong here, feel free to update the page and help other people like you, that greatly depends on our APIs. If you don't feel comfortable doing this kind of changes, please contact us by creating an [issue](https://github.com/wekan/wekan/issues/new).

# Retrieve cards by swimlane id

Please somebody add example by looking this:

[Issue](https://github.com/wekan/wekan/issues/1934) and [code](https://github.com/wekan/wekan/pull/1944/commits/be42b8d4cbdfa547ca019ab2dc9a590a115cc0e2). Also add to [Cards page](REST-API-Cards)

# Add Swimlane to Board

| API URL / Code Link | Requires Admin Auth | HTTP Method |
| :--- | :--- | :--- |
| [/api/boards/:boardId/swimlanes](https://github.com/wekan/wekan/blob/main/models/swimlanes.js#L223) | `yes` | `POST` |

```shell
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/YRgy7Ku6uLFv2pYwZ/swimlanes \
     -d '{ "title": "Swimlane title text" }'
```
## Result example
The new swimlane's ID is returned in the format:
```json
{
    "_id": "W9m9YxQKT6zZrKzRW"
}
```

# Delete a swimlane

| API URL / Code Link | Requires Admin Auth | HTTP Method |
| :--- | :--- | :--- |
| [/api/boards/:boardId/swimlanes/:swimlaneId](https://github.com/wekan/wekan/blob/main/models/swimlanes.js#L257) | `yes` | `DELETE` |

```shell
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X DELETE \
     http://localhost:3000/api/boards/YRgy7Ku6uLFv2pYwZ/lists/PgTuf6sFJsaxto5dC/cards/ssrNX9CvXvPxuC5DE
```
## Result example
The swimlane's ID is returned in the format:
```json
{
    "_id": "W9m9YxQKT6zZrKzRW"
}
```

# In Wekan code

If you believe that code is the best documentation, be our guest: [models/cards.js](https://github.com/wekan/wekan/blob/main/models/swimlanes.js "Swimlane API code")