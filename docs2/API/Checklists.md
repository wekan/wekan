## In Wekan code

## 1) Checklists

wekan/models/checklists.js at bottom:

```
  JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/checklists', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramCardId = req.params.cardId;
    const checklists = Checklists.find({ cardId: paramCardId }).map(function (doc) {
      return {
        _id: doc._id,
        title: doc.title,
      };
    });
    if (checklists) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: checklists,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 500,
      });
    }
  });

  JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramChecklistId = req.params.checklistId;
    const paramCardId = req.params.cardId;
    const checklist = Checklists.findOne({ _id: paramChecklistId, cardId: paramCardId });
    if (checklist) {
      checklist.items = ChecklistItems.find({checklistId: checklist._id}).map(function (doc) {
        return {
          _id: doc._id,
          title: doc.title,
          isFinished: doc.isFinished,
        };
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: checklist,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 500,
      });
    }
  });

  JsonRoutes.add('POST', '/api/boards/:boardId/cards/:cardId/checklists', function (req, res) {
    Authentication.checkUserId( req.userId);

    const paramCardId = req.params.cardId;
    const id = Checklists.insert({
      title: req.body.title,
      cardId: paramCardId,
      sort: 0,
    });
    if (id) {
      req.body.items.forEach(function (item, idx) {
        ChecklistItems.insert({
          cardId: paramCardId,
          checklistId: id,
          title: item.title,
          sort: idx,
        });
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 400,
      });
    }
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramChecklistId = req.params.checklistId;
    Checklists.remove({ _id: paramChecklistId });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramChecklistId,
      },
    });
  });
```

### 2) Checklist Items

wekan/models/checklistItems.js at bottom:

```
JsonRoutes.add('GET', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramItemId = req.params.itemId;
    const checklistItem = ChecklistItems.findOne({ _id: paramItemId });
    if (checklistItem) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: checklistItem,
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 500,
      });
    }
  });

  JsonRoutes.add('PUT', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);

    const paramItemId = req.params.itemId;

    if (req.body.hasOwnProperty('isFinished')) {
      ChecklistItems.direct.update({_id: paramItemId}, {$set: {isFinished: req.body.isFinished}});
    }
    if (req.body.hasOwnProperty('title')) {
      ChecklistItems.direct.update({_id: paramItemId}, {$set: {title: req.body.title}});
    }

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramItemId,
      },
    });
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramItemId = req.params.itemId;
    ChecklistItems.direct.remove({ _id: paramItemId });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: paramItemId,
      },
    });
```
