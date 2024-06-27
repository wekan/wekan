1) Login as Admin user as Form Data to get Bearer token
https://github.com/wekan/wekan/wiki/REST-API#example-call---as-form-data

2) There needs to be Custom Field added to board
https://wekan.github.io/api/v4.42/#wekan-rest-api-customfields

3) Custom Field at board and card will have same `_id`
https://wekan.github.io/api/v4.42/#put_board_list_card

4) When writing Custom Field value to card, like text field, content type needs to be "application/json" and the string needs to be an array:
```
-d '{ "customFields" : [ { "_id" : "oZHkpcaxDHnbkbqGo", "value" : "foobar" } ] }'
```
5) For other types of Custom Fields, you can look at Custom Field structure from MongoDB database with [nosqlbooster](https://nosqlbooster.com/downloads) that can also login through ssh to server Wekan snap MongoDB port 27019


## In Wekan code (old)

wekan/models/customFields.js , at bottom

```
//CUSTOM FIELD REST API
if (Meteor.isServer) {
  JsonRoutes.add('GET', '/api/boards/:boardId/custom-fields', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.find({ boardId: paramBoardId }),
    });
  });

  JsonRoutes.add('GET', '/api/boards/:boardId/custom-fields/:customFieldId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const paramCustomFieldId = req.params.customFieldId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.findOne({ _id: paramCustomFieldId, boardId: paramBoardId }),
    });
  });

  JsonRoutes.add('POST', '/api/boards/:boardId/custom-fields', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const id = CustomFields.direct.insert({
      name: req.body.name,
      type: req.body.type,
      settings: req.body.settings,
      showOnCard: req.body.showOnCard,
      boardId: paramBoardId,
    });

    const customField = CustomFields.findOne({_id: id, boardId: paramBoardId });
    customFieldCreation(req.body.authorId, customField);

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });

  JsonRoutes.add('DELETE', '/api/boards/:boardId/custom-fields/:customFieldId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const id = req.params.customFieldId;
    CustomFields.remove({ _id: id, boardId: paramBoardId });
    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });
}
```