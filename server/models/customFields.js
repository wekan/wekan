import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Random } from 'meteor/random';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Cards from '/models/cards';
import CustomFields from '/models/customFields';

async function customFieldCreation(userId, doc) {
  await Activities.insertAsync({
    userId,
    activityType: 'createCustomField',
    boardId: doc.boardIds[0],
    customFieldId: doc._id,
  });
}

async function customFieldDeletion(userId, doc) {
  await Activities.insertAsync({
    userId,
    activityType: 'deleteCustomField',
    boardId: doc.boardIds[0],
    customFieldId: doc._id,
  });
}

async function customFieldEdit(userId, doc) {
  const customFieldValue = (await ReactiveCache.getActivity({ customFieldId: doc._id })).value;
  await Activities.insertAsync({
    userId,
    activityType: 'setCustomField',
    boardId: doc.boardIds[0],
    customFieldId: doc._id,
    customFieldValue,
    listId: doc.listId,
    swimlaneId: doc.swimlaneId,
  });
}

Meteor.startup(async () => {
  await CustomFields._collection.createIndexAsync({ modifiedAt: -1 });
  await CustomFields._collection.createIndexAsync({ boardIds: 1 });
});

CustomFields.after.insert(async (userId, doc) => {
  await customFieldCreation(userId, doc);

  if (doc.alwaysOnCard) {
    CustomFields.addToAllCards(doc);
  }
});

CustomFields.before.update(async (userId, doc, fieldNames, modifier) => {
  if (fieldNames.includes('boardIds') && modifier.$pull) {
    await Cards.updateAsync(
      { boardId: modifier.$pull.boardIds, 'customFields._id': doc._id },
      { $pull: { customFields: { _id: doc._id } } },
      { multi: true },
    );
    await customFieldEdit(userId, doc);
    await Activities.removeAsync({
      customFieldId: doc._id,
      boardId: modifier.$pull.boardIds,
      listId: doc.listId,
      swimlaneId: doc.swimlaneId,
    });
  } else if (fieldNames.includes('boardIds') && modifier.$push) {
    await Activities.insertAsync({
      userId,
      activityType: 'createCustomField',
      boardId: modifier.$push.boardIds,
      customFieldId: doc._id,
    });
  }
});

CustomFields.after.update((userId, doc) => {
  if (doc.alwaysOnCard) {
    CustomFields.addToAllCards(doc);
  }
});

CustomFields.before.remove(async (userId, doc) => {
  await customFieldDeletion(userId, doc);
  await Activities.removeAsync({
    customFieldId: doc._id,
  });

  await Cards.updateAsync(
    { boardId: { $in: doc.boardIds }, 'customFields._id': doc._id },
    { $pull: { customFields: { _id: doc._id } } },
    { multi: true },
  );
});

WebApp.handlers.get('/api/boards/:boardId/custom-fields', async function(req, res) {
  const paramBoardId = req.params.boardId;
  Authentication.checkBoardAccess(req.userId, paramBoardId);
  sendJsonResult(res, {
    code: 200,
    data: (await ReactiveCache.getCustomFields({ boardIds: { $in: [paramBoardId] } })).map(cf => ({
      _id: cf._id,
      name: cf.name,
      type: cf.type,
    })),
  });
});

WebApp.handlers.get('/api/boards/:boardId/custom-fields/:customFieldId', async function(req, res) {
  const paramBoardId = req.params.boardId;
  const paramCustomFieldId = req.params.customFieldId;
  Authentication.checkBoardAccess(req.userId, paramBoardId);
  sendJsonResult(res, {
    code: 200,
    data: await ReactiveCache.getCustomField({
      _id: paramCustomFieldId,
      boardIds: { $in: [paramBoardId] },
    }),
  });
});

WebApp.handlers.post('/api/boards/:boardId/custom-fields', async function(req, res) {
  const paramBoardId = req.params.boardId;
  Authentication.checkBoardAccess(req.userId, paramBoardId);
  const board = await ReactiveCache.getBoard(paramBoardId);
  const id = await CustomFields.direct.insertAsync({
    name: req.body.name,
    type: req.body.type,
    settings: req.body.settings,
    showOnCard: req.body.showOnCard,
    automaticallyOnCard: req.body.automaticallyOnCard,
    showLabelOnMiniCard: req.body.showLabelOnMiniCard,
    showSumAtTopOfList: req.body.showSumAtTopOfList,
    boardIds: [board._id],
  });

  const customField = await ReactiveCache.getCustomField({
    _id: id,
    boardIds: { $in: [paramBoardId] },
  });
  await customFieldCreation(req.body.authorId, customField);

  sendJsonResult(res, {
    code: 200,
    data: {
      _id: id,
    },
  });
});

WebApp.handlers.put('/api/boards/:boardId/custom-fields/:customFieldId', async function(req, res) {
  const paramBoardId = req.params.boardId;
  const paramFieldId = req.params.customFieldId;
  Authentication.checkBoardAccess(req.userId, paramBoardId);

  const boardScopedField = {
    _id: paramFieldId,
    boardIds: { $in: [paramBoardId] },
  };

  if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
    await CustomFields.direct.updateAsync(boardScopedField, { $set: { name: req.body.name } });
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'type')) {
    await CustomFields.direct.updateAsync(boardScopedField, { $set: { type: req.body.type } });
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'settings')) {
    await CustomFields.direct.updateAsync(boardScopedField, { $set: { settings: req.body.settings } });
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'showOnCard')) {
    await CustomFields.direct.updateAsync(boardScopedField, { $set: { showOnCard: req.body.showOnCard } });
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'automaticallyOnCard')) {
    await CustomFields.direct.updateAsync(boardScopedField, { $set: { automaticallyOnCard: req.body.automaticallyOnCard } });
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'alwaysOnCard')) {
    await CustomFields.direct.updateAsync(boardScopedField, { $set: { alwaysOnCard: req.body.alwaysOnCard } });
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'showLabelOnMiniCard')) {
    await CustomFields.direct.updateAsync(boardScopedField, { $set: { showLabelOnMiniCard: req.body.showLabelOnMiniCard } });
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'showSumAtTopOfList')) {
    await CustomFields.direct.updateAsync(boardScopedField, { $set: { showSumAtTopOfList: req.body.showSumAtTopOfList } });
  }

  sendJsonResult(res, {
    code: 200,
    data: { _id: paramFieldId },
  });
});

WebApp.handlers.post('/api/boards/:boardId/custom-fields/:customFieldId/dropdown-items', async function(req, res) {
  const paramBoardId = req.params.boardId;
  const paramCustomFieldId = req.params.customFieldId;
  Authentication.checkBoardAccess(req.userId, paramBoardId);
  const paramItems = req.body.items;

  if (Object.prototype.hasOwnProperty.call(req.body, 'items') && Array.isArray(paramItems)) {
    await CustomFields.direct.updateAsync(
      {
        _id: paramCustomFieldId,
        boardIds: { $in: [paramBoardId] },
      },
      {
        $push: {
          'settings.dropdownItems': {
            $each: paramItems
              .filter(name => typeof name === 'string')
              .map(name => ({
                _id: Random.id(6),
                name,
              })),
          },
        },
      },
    );
  }

  sendJsonResult(res, {
    code: 200,
    data: { _id: paramCustomFieldId },
  });
});

WebApp.handlers.put(
  '/api/boards/:boardId/custom-fields/:customFieldId/dropdown-items/:dropdownItemId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramDropdownItemId = req.params.dropdownItemId;
    const paramCustomFieldId = req.params.customFieldId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);
    const paramName = req.body.name;

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      await CustomFields.direct.updateAsync(
        {
          _id: paramCustomFieldId,
          boardIds: { $in: [paramBoardId] },
          'settings.dropdownItems._id': paramDropdownItemId,
        },
        {
          $set: {
            'settings.dropdownItems.$': {
              _id: paramDropdownItemId,
              name: paramName,
            },
          },
        },
      );
    }

    sendJsonResult(res, {
      code: 200,
      data: { _id: paramDropdownItemId },
    });
  },
);

WebApp.handlers.delete(
  '/api/boards/:boardId/custom-fields/:customFieldId/dropdown-items/:dropdownItemId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    const paramCustomFieldId = req.params.customFieldId;
    const paramDropdownItemId = req.params.dropdownItemId;
    Authentication.checkBoardAccess(req.userId, paramBoardId);

    await CustomFields.direct.updateAsync(
      { _id: paramCustomFieldId, boardIds: { $in: [paramBoardId] } },
      {
        $pull: {
          'settings.dropdownItems': { _id: paramDropdownItemId },
        },
      },
    );

    sendJsonResult(res, {
      code: 200,
      data: { _id: paramCustomFieldId },
    });
  },
);

WebApp.handlers.delete('/api/boards/:boardId/custom-fields/:customFieldId', async function(req, res) {
  const paramBoardId = req.params.boardId;
  Authentication.checkBoardAccess(req.userId, paramBoardId);
  const id = req.params.customFieldId;
  await CustomFields.removeAsync({ _id: id, boardIds: { $in: [paramBoardId] } });
  sendJsonResult(res, {
    code: 200,
    data: {
      _id: id,
    },
  });
});
