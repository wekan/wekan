## In Wekan code

wekan/models/lists.js at bottom:
```
  JsonRoutes.add('GET', '/api/boards/:boardId/lists', function (req, res) {
    try {
      const paramBoardId = req.params.boardId;
      Authentication.checkBoardAccess( req.userId, paramBoardId);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: Lists.find({ boardId: paramBoardId, archived: false }).map(function (doc) {
          return {
            _id: doc._id,
            title: doc.title,
          };
        }),
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  JsonRoutes.add('GET', '/api/boards/:boardId/lists/:listId', function (req, res) {
    try {
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      Authentication.checkBoardAccess( req.userId, paramBoardId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Lists.findOne({ _id: paramListId, boardId: paramBoardId, archived: false }),
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  JsonRoutes.add('POST', '/api/boards/:boardId/lists', function (req, res) {
    try {
      Authentication.checkUserId( req.userId);
      const paramBoardId = req.params.boardId;
      const id = Lists.insert({
        title: req.body.title,
        boardId: paramBoardId,
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/lists/:listId', function (req, res) {
    try {
      Authentication.checkUserId( req.userId);
      const paramBoardId = req.params.boardId;
      const paramListId = req.params.listId;
      Lists.remove({ _id: paramListId, boardId: paramBoardId });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: paramListId,
        },
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });
```

## Archive and restore a list

`POST /api/boards/:boardId/lists/:listId/archive` moves a live list to the
archive, and `POST /api/boards/:boardId/lists/:listId/unarchive` restores an
archived one, as the board's list menu does (#2906). Both need write access to
the board and answer `404` when the list is not in the expected state.

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://wekan.example.com/api/boards/$BOARD/lists/$LIST/archive
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://wekan.example.com/api/boards/$BOARD/lists/$LIST/unarchive
```
