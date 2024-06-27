# Disclaimer

This page tries to be as up to date as possible. If you see something wrong here, feel free to update the page and help other people like you, that greatly depends on our APIs. If you don't feel comfortable doing this kind of changes, please contact us by creating an [issue](https://github.com/wekan/wekan/issues/new).

## Information about boards of user
```
curl -H "Authorization: Bearer a6DM_gOPRwBdynfXaGBaiiEwTiAuigR_Fj_81QmNpnf" \
      http://localhost:3000/api/users/XQMZgynx9M79qTtQc/boards
```

## Add/Remove Board Member and Change Role

[Add/Remove Board Member and Change Role admin/normal/nocomments/commentonly](REST-API-Role).

## The admin takes the ownership of ALL boards of the user (archived and not archived) where the user is admin on.

| URL | Requires Admin Auth | HTTP Method |
| :--- | :--- | :--- |
| `/api/users/:id` | `yes` | `PUT` |

```shell
curl -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
     -H "Content-type:application/json" \
     -X PUT \
     http://localhost:3000/api/users/ztKvBTzCqmyJ77on8 \
     -d '{ "action": "takeOwnership" }'
```

## Create board

Required:
- "title":"Board title here"
- "owner":"ABCDE12345"   <= User ID in Wekan. Not username or email.

Optional, and defaults:
- "isAdmin":"true"
- "isActive":"true"
- "isNoComments":"false"
- "isCommentOnly":"false"
- "permission":"private"   <== Set to "public" if you want public Wekan board
- "color":"belize"        <== Board color: belize, nephritis, pomegranate, pumpkin, wisteria, midnight.

<img src="https://wekan.github.io/board-colors.png" width="40%" alt="Wekan logo" />

Example:
```
curl  -H "Authorization: Bearer t7iYB86mXoLfP_XsMegxF41oKT7iiA9lDYiKVtXcctl" \
      -H "Content-type:application/json" \
      -X POST \
      http://localhost:3000/api/boards \
      -d '{"title":"Board title here","owner":"ABCDE12345","permission":"private","color":"nephritis"}'
```

## In Wekan code

If you believe that code is the best documentation, be our guest: [models/cards.js](https://github.com/wekan/wekan/blob/main/models/boards.js "Board API code")