import { ReactiveCache } from '/imports/reactiveCache';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import Triggers from './triggers';
import Actions from './actions';
import { generateDefaultRuleTitle } from './lib/generateDefaultRuleTitle';
const { SimpleSchema } = require('/imports/simpleSchema');

const Rules = new Mongo.Collection('rules');

Rules.attachSchema(
  new SimpleSchema({
    title: {
      type: String,
      optional: false,
      // #4294: a rule created with no title used to store an empty string
      // (the client-side "Add Rule" gate is the primary defence against
      // that, but every creation path goes through this schema, including
      // the rules.createRule server method and the rules-workflow canvas).
      // Once trigger+action are known, generate a sensible default instead
      // of leaving the rule unnamed; an existing/explicit title always wins.
      // eslint-disable-next-line consistent-return
      autoValue() {
        const value = this.value;
        if (value !== undefined && value !== null && `${value}`.trim() !== '') {
          return value;
        }
        if (this.isInsert) {
          const triggerId = this.field('triggerId').value;
          const actionId = this.field('actionId').value;
          try {
            const trigger = triggerId && Triggers.findOne(triggerId);
            const action = actionId && Actions.findOne(actionId);
            return generateDefaultRuleTitle(
              trigger && trigger.desc,
              action && action.desc,
            );
          } catch (e) {
            return 'Rule';
          }
        }
        // An update that sent no title (e.g. a partial $set from elsewhere)
        // must not blank out an existing one.
        this.unset();
      },
    },
    triggerId: {
      type: String,
      optional: false,
    },
    actionId: {
      type: String,
      optional: false,
    },
    boardId: {
      type: String,
      optional: false,
    },
    // Denormalised manual-button metadata (only present on button rules). The
    // board view renders board/card buttons from the rule alone — see
    // server/rulesButton.js (rules.createRule) for why the trigger document is
    // not relied upon on the client.
    buttonType: {
      type: String,
      optional: true,
      allowedValues: ['card', 'board'],
    },
    buttonLabel: {
      type: String,
      optional: true,
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

Rules.helpers({
  async rename(description) {
    return await Rules.updateAsync(this._id, { $set: { description } });
  },
  getAction() {
    return ReactiveCache.getAction(this.actionId);
  },
  getTrigger() {
    return ReactiveCache.getTrigger(this.triggerId);
  },
  board() {
    return ReactiveCache.getBoard(this.boardId);
  },
  trigger() {
    return ReactiveCache.getTrigger(this.triggerId);
  },
  action() {
    return ReactiveCache.getAction(this.actionId);
  },
});

if (Meteor.isServer) {
  // Admin Panel / Problems / Rules pages every rule sorted by board, and counts
  // them with the same selector (server/publications/rules.js). Without an index
  // that is a full-collection scan plus an in-memory sort for every page of ten.
  const { ensureIndex } = require('/server/lib/mongoStartup');
  Meteor.startup(async () => {
    await ensureIndex(Rules, { boardId: 1 });
  });
}

export default Rules;
