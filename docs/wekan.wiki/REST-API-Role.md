# Change Role at Web UI

BoardAdmin can change role of user at right sidebar / click avatar / select role like Admin, Normal, etc.

# Change Role with API

- https://wekan.github.io/api/
- api.py at https://github.com/wekan/wekan
- Login to API https://github.com/wekan/wekan/wiki/REST-API#example-call---as-json

# Disclaimer

This page tries to be as up to date as possible. If you see something wrong here, feel free to update the page and help other people like you, that greatly depends on our APIs. If you don't feel comfortable doing this kind of changes, please contact us by creating an [issue](https://github.com/wekan/wekan/issues/new).

## Add New Board Member with Role
This example adds with normal role. See examples below for other roles.
```
curl -H "Authorization: Bearer a6DM_gOPRwBdynfXaGBaiiEwTiAuigR_Fj_81QmNpnf" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/BOARD-ID-HERE/members/USER-ID-HERE/add \
     -d '{"action": "add","isAdmin": "false", "isNoComments":"false", "isCommentOnly": "false", "isWorker": "false" }'
```
like
```
/api/boards/{boardid}/members/{MEMBERID}/add Body{ "action" : add, "isadmin" : false ...........
```

## Remove Member from Board
```
curl -H "Authorization: Bearer a6DM_gOPRwBdynfXaGBaiiEwTiAuigR_Fj_81QmNpnf" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/BOARD-ID-HERE/members/USER-ID-HERE/remove \
     -d '{"action": "remove"}'
```

# Change Role of Existing Board Member

## Admin
```
curl -H "Authorization: Bearer a6DM_gOPRwBdynfXaGBaiiEwTiAuigR_Fj_81QmNpnf" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/BOARD-ID-HERE/members/USER-ID-HERE \
     -d '{"isAdmin": "true", "isNoComments":"false", "isCommentOnly": "false", "isWorker": "false"}'
```
## Normal
```
curl -H "Authorization: Bearer a6DM_gOPRwBdynfXaGBaiiEwTiAuigR_Fj_81QmNpnf" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/BOARD-ID-HERE/members/USER-ID-HERE \
     -d '{"isAdmin": "false", "isNoComments":"false", "isCommentOnly": "false", "isWorker": "false"}'
```
## No Comments
```
curl -H "Authorization: Bearer a6DM_gOPRwBdynfXaGBaiiEwTiAuigR_Fj_81QmNpnf" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/BOARD-ID-HERE/members/USER-ID-HERE \
     -d '{"isAdmin": "false", "isNoComments":"true", "isCommentOnly": "false", "isWorker": "false"}'
```
## Comment Only
```
curl -H "Authorization: Bearer a6DM_gOPRwBdynfXaGBaiiEwTiAuigR_Fj_81QmNpnf" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/BOARD-ID-HERE/members/USER-ID-HERE \
     -d '{"isAdmin": "false", "isNoComments":"false", "isCommentOnly": "true", "isWorker": "false"}'
```
## Worker
- Can: move cards, can assign himself to card, can comment.
- Cannot: anything else including revoke card, change settings, create/delete/edit cards/tags and so on...
```
curl -H "Authorization: Bearer a6DM_gOPRwBdynfXaGBaiiEwTiAuigR_Fj_81QmNpnf" \
     -H "Content-type:application/json" \
     -X POST \
     http://localhost:3000/api/boards/BOARD-ID-HERE/members/USER-ID-HERE \
     -d '{"isAdmin": "false", "isNoComments":"false", "isCommentOnly": "false", "isWorker": "true"}'
```

