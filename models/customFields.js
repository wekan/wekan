CustomFields = new Mongo.Collection('customFields');

/**
 * A custom field on a card in the board
 */
CustomFields.attachSchema(new SimpleSchema({
  boardId: {
    /**
     * the ID of the board
     */
    type: String,
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
    allowedValues: ['text', 'number', 'date', 'dropdown'],
  },
  settings: {
    /**
     * settings of the custom field
     */
    type: Object,
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
}));

CustomFields.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['userId', 'boardId'],
});

// not sure if we need this?
//CustomFields.hookOptions.after.update = { fetchPrevious: false };

function customFieldCreation(userId, doc){
  Activities.insert({
    userId,
    activityType: 'createCustomField',
    boardId: doc.boardId,
    customFieldId: doc._id,
  });
}

if (Meteor.isServer) {
  Meteor.startup(() => {
    CustomFields._collection._ensureIndex({ boardId: 1 });
  });

  CustomFields.after.insert((userId, doc) => {
    customFieldCreation(userId, doc);
  });

  CustomFields.after.remove((userId, doc) => {
    Activities.remove({
      customFieldId: doc._id,
    });

    Cards.update(
      {'boardId': doc.boardId, 'customFields._id': doc._id},
      {$pull: {'customFields': {'_id': doc._id}}},
      {multi: true}
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
  JsonRoutes.add('GET', '/api/boards/:boardId/custom-fields', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.find({ boardId: paramBoardId }).map(function (cf) {
        return {
          _id: cf._id,
          name: cf.name,
          type: cf.type,
        };
      }),
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
  JsonRoutes.add('GET', '/api/boards/:boardId/custom-fields/:customFieldId', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const paramCustomFieldId = req.params.customFieldId;
    JsonRoutes.sendResult(res, {
      code: 200,
      data: CustomFields.findOne({ _id: paramCustomFieldId, boardId: paramBoardId }),
    });
  });

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
  JsonRoutes.add('POST', '/api/boards/:boardId/custom-fields', function (req, res) {
    Authentication.checkUserId( req.userId);
    const paramBoardId = req.params.boardId;
    const id = CustomFields.direct.insert({
      name: req.body.name,
      type: req.body.type,
      settings: req.body.settings,
      showOnCard: req.body.showOnCard,
      automaticallyOnCard: req.body.automaticallyOnCard,
      showLabelOnMiniCard: req.body.showLabelOnMiniCard,
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
