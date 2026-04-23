import { Mongo } from 'meteor/mongo';
import Cards from '/models/cards';
const { SimpleSchema } = require('/imports/simpleSchema');

const CustomFields = new Mongo.Collection('customFields');

/**
 * A custom field on a card in the board
 */
CustomFields.attachSchema(
  new SimpleSchema({
    boardIds: {
      /**
       * the ID of the board
       */
      type: Array,
    },
    'boardIds.$': {
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
      allowedValues: [
        'text',
        'number',
        'date',
        'dropdown',
        'checkbox',
        'currency',
        'stringtemplate',
      ],
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
      type: Array,
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
    'settings.stringtemplateFormat': {
      type: String,
      optional: true,
    },
    'settings.stringtemplateSeparator': {
      type: String,
      optional: true,
    },
    showOnCard: {
      /**
       * should we show on the cards this custom field
       */
      type: Boolean,
      defaultValue: false,
    },
    automaticallyOnCard: {
      /**
       * should the custom fields automatically be added on cards?
       */
      type: Boolean,
      defaultValue: false,
    },
    alwaysOnCard: {
      /**
       * should the custom field be automatically added to all cards?
       */
      type: Boolean,
      defaultValue: false,
    },
    showLabelOnMiniCard: {
      /**
       * should the label of the custom field be shown on minicards?
       */
      type: Boolean,
      defaultValue: false,
    },
    showSumAtTopOfList: {
      /**
       * should the sum of the custom fields be shown at top of list?
       */
      type: Boolean,
      defaultValue: false,
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

CustomFields.addToAllCards = async cf => {
  await Cards.updateAsync(
    {
      boardId: { $in: cf.boardIds },
      customFields: { $not: { $elemMatch: { _id: cf._id } } },
    },
    {
      $push: { customFields: { _id: cf._id, value: null } },
    },
    { multi: true },
  );
};

CustomFields.helpers({
  async addBoard(boardId) {
    if (boardId) {
      return await CustomFields.updateAsync(this._id, {
        $push: { boardIds: boardId },
      });
    }
    return null;
  },
});

export default CustomFields;
