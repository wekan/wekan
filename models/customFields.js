CustomFields = new Mongo.Collection('customFields');

/**
 * A custom field on a card in the board
 */
CustomFields.attachSchema(
  new SimpleSchema({
    boardIds: {
      /**
       * the ID of the board
       */
      type: [String],
    },
    name: {
      /**
       * name of the custom field
       */
      type: String,
    },
    type: {
      /**
       * type of the custom field
       */
      type: String,
      allowedValues: ['text', 'number', 'date', 'dropdown', 'currency'],
    },
    settings: {
      /**
       * settings of the custom field
       */
      type: Object,
    },
    'settings.currencyCode': {
      type: String,
      optional: true,
    },
    'settings.dropdownItems': {
      /**
       * list of drop down items objects
       */
      type: [Object],
      optional: true,
    },
    'settings.dropdownItems.$': {
      type: new SimpleSchema({
        _id: {
          /**
           * ID of the drop down item
           */
          type: String,
        },
        name: {
          /**
           * name of the drop down item
           */
          type: String,
        },
      }),
    },
    showOnCard: {
      /**
       * should we show on the cards this custom field
       */
      type: Boolean,
    },
    automaticallyOnCard: {
      /**
       * should the custom fields automatically be added on cards?
       */
      type: Boolean,
    },
    showLabelOnMiniCard: {
      /**
       * should the label of the custom field be shown on minicards?
       */
      type: Boolean,
    },
    createdAt: {
      type: Date,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
  }),
);

CustomFields.mutations({
  addBoard(boardId) {
    if (boardId) {
      return {
        $push: {
          boardIds: boardId,
        },
      };
    } else {
      return null;
    }
  },
});

CustomFields.allow({
  insert(userId, doc) {
    return allowIsAnyBoardMember(
      userId,
      Boards.find({
        _id: { $in: doc.boardIds },
      }).fetch(),
    );
  },
  update(userId, doc) {
    return allowIsAnyBoardMember(
      userId,
      Boards.find({
        _id: { $in: doc.boardIds },
      }).fetch(),
    );
  },
  remove(userId, doc) {
    return allowIsAnyBoardMember(
      userId,
      Boards.find({
        _id: { $in: doc.boardIds },
      }).fetch(),
    );
  },
  fetch: ['userId', 'boardIds'],
});

// not sure if we need this?
//CustomFields.hookOptions.after.update = { fetchPrevious: false };

function customFieldCreation(userId, doc) {
  Activities.insert({
    userId,
    activityType: 'createCustomField',
    boardId: doc.boardIds[0], // We are creating a customField, it has only one boardId
    customFieldId: doc._id,
  });
}

function customFieldDeletion(userId, doc) {
  Activities.insert({
    userId,
    activityType: 'deleteCustomField',
    boardId: doc.boardIds[0], // We are creating a customField, it has only one boardId
    customFieldId: doc._id,
  });
}

// This has some bug, it does not show edited customField value at Outgoing Webhook,
// instead it shows undefined, and no listId and swimlaneId.
function customFieldEdit(userId, doc) {
  const card = Cards.findOne(doc.cardId);
  const customFieldValue = Activities.findOne({ customFieldId: doc._id }).value;
  const boardId = card.boardId;
  //boardId: doc.boardIds[0], // We are creating a customField, it has only one boardId
  Activities.insert({
    userId,
    activityType: 'setCustomField',
    boardId,
    customFieldId: doc._id,
    customFieldValue,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
}

if (Meteor.isServer) {
  Meteor.startup(() => {
    CustomFields._collection._ensureIndex({ modifiedAt: -1 });
    CustomFields._collection._ensureIndex({ boardIds: 1 });
  });

  CustomFields.after.insert((userId, doc) => {
    customFieldCreation(userId, doc);
  });

  CustomFields.before.update((userId, doc, fieldNames, modifier) => {
    if (_.contains(fieldNames, 'boardIds') && modifier.$pull) {
      Cards.update(
        { boardId: modifier.$pull.boardIds, 'customFields._id': doc._id },
        { $pull: { customFields: { _id: doc._id } } },
        { multi: true },
      );
      customFieldEdit(userId, doc);
      Activities.remove({
        customFieldId: doc._id,
        boardId: modifier.$pull.boardIds,
        listId: card.listId,
        swimlaneId: card.swimlaneId,
      });
    } else if (_.contains(fieldNames, 'boardIds') && modifier.$push) {
      Activities.insert({
        userId,
        activityType: 'createCustomField',
        boardId: modifier.$push.boardIds,
        customFieldId: doc._id,
      });
    }
  });

  CustomFields.before.remove((userId, doc) => {
    customFieldDeletion(userId, doc);
    Activities.remove({
      customFieldId: doc._id,
    });

    Cards.update(
      { boardId: { $in: doc.boardIds }, 'customFields._id': doc._id },
      { $pull: { customFields: { _id: doc._id } } },
      { multi: true },
    );
  });
}

//CUSTOM FIELD REST API
if (Meteor.isServer) {
  /**
   * @operation get_all_custom_fields
   * @summary Get the list of Custom Fields attached to a board
   *
   * @param {string} boardID the ID of the board
   * @return_type [{_id: string,
   *                name: string,
   *                type: string}]
   */
  JsonRoutes.add('GET', '/api/boards/:boardId/custom-fields', function(
    req,
    res,
  ) {
    Authentication.checkUserId(req.userId);
    const paramBoardId = req.params.boardId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.find({ boardIds: { $in: [paramBoardId] } }).map(
        function(cf) {
          return {
            _id: cf._id,
            name: cf.name,
            type: cf.type,
          };
        },
      ),
    });
  });

  /**
   * @operation get_custom_field
   * @summary Get a Custom Fields attached to a board
   *
   * @param {string} boardID the ID of the board
   * @param {string} customFieldId the ID of the custom field
   * @return_type CustomFields
   */
  JsonRoutes.add(
    'GET',
    '/api/boards/:boardId/custom-fields/:customFieldId',
    function(req, res) {
      Authentication.checkUserId(req.userId);
      const paramBoardId = req.params.boardId;
      const paramCustomFieldId = req.params.customFieldId;
      JsonRoutes.sendResult(res, {
        code: 200,
        data: CustomFields.findOne({
          _id: paramCustomFieldId,
          boardIds: { $in: [paramBoardId] },
        }),
      });
    },
  );

  /**
   * @operation new_custom_field
   * @summary Create a Custom Field
   *
   * @param {string} boardID the ID of the board
   * @param {string} name the name of the custom field
   * @param {string} type the type of the custom field
   * @param {string} settings the settings object of the custom field
   * @param {boolean} showOnCard should we show the custom field on cards?
   * @param {boolean} automaticallyOnCard should the custom fields automatically be added on cards?
   * @param {boolean} showLabelOnMiniCard should the label of the custom field be shown on minicards?
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/custom-fields', function(
    req,
    res,
  ) {
    Authentication.checkUserId(req.userId);
    const paramBoardId = req.params.boardId;
    const board = Boards.findOne({ _id: paramBoardId });
    const id = CustomFields.direct.insert({
      name: req.body.name,
      type: req.body.type,
      settings: req.body.settings,
      showOnCard: req.body.showOnCard,
      automaticallyOnCard: req.body.automaticallyOnCard,
      showLabelOnMiniCard: req.body.showLabelOnMiniCard,
      boardIds: [board._id],
    });

    const customField = CustomFields.findOne({
      _id: id,
      boardIds: { $in: [paramBoardId] },
    });
    customFieldCreation(req.body.authorId, customField);

    JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        _id: id,
      },
    });
  });

  /**
   * @operation delete_custom_field
   * @summary Delete a Custom Fields attached to a board
   *
   * @description The Custom Field can't be retrieved after this operation
   *
   * @param {string} boardID the ID of the board
   * @param {string} customFieldId the ID of the custom field
   * @return_type {_id: string}
   */
  JsonRoutes.add(
    'DELETE',
    '/api/boards/:boardId/custom-fields/:customFieldId',
    function(req, res) {
      Authentication.checkUserId(req.userId);
      const paramBoardId = req.params.boardId;
      const id = req.params.customFieldId;
      CustomFields.remove({ _id: id, boardIds: { $in: [paramBoardId] } });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    },
  );
}

export default CustomFields;
