import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { ReactiveCache } from '/imports/reactiveCache';
import { TriggersDef } from '/server/triggersDef';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';

// REST API for board automation Rules (add / edit / remove).
//
// A rule links a trigger (the event/schedule) to an action (what happens). The
// API embeds the full trigger and action inline so a rule is self-contained:
//
//   POST   /api/boards/:boardId/rules
//     body: { "title": "...", "trigger": { "activityType": "...", ... },
//             "action":  { "actionType": "...", ... } }
//   GET    /api/boards/:boardId/rules
//   GET    /api/boards/:boardId/rules/:ruleId
//   PUT    /api/boards/:boardId/rules/:ruleId
//     body: { "title"?, "trigger"?: {...}, "action"?: {...} }
//   DELETE /api/boards/:boardId/rules/:ruleId

const STRIP = ['_id', 'boardId', 'createdAt', 'modifiedAt', 'updatedAt'];

function strip(doc) {
  const out = {};
  Object.keys(doc || {}).forEach(k => {
    if (!STRIP.includes(k)) out[k] = doc[k];
  });
  return out;
}

// #2674 ("Rule: remove USER from card when move"): the rule matcher
// (server/rulesHelper.js buildMatchingFieldsMap) queries EVERY matching field
// of the trigger's activityType with {$in: [<activity value>, '*']}. A Mongo
// $in never matches a document that LACKS the field, so a trigger created over
// REST without e.g. userId / listName / swimlaneName / cardTitle could never
// match any activity and its rule silently never fired — exactly the "user is
// added when the card moves to the list, but never removed when it moves away"
// failure of #2674. The Rules UI wizard (sanitizeObject) and the rules JSON
// import (normalizeTrigger) both default missing matching fields to the '*'
// wildcard; do the same for API-created/edited triggers. Trigger kinds not
// driven by activities (scheduledTrigger, button — not in TriggersDef) are
// left untouched.
function normalizeTriggerDoc(trigger) {
  const out = { ...trigger };
  const def = TriggersDef[out.activityType];
  if (def) {
    def.matchingFields.forEach(field => {
      if (out[field] === undefined || out[field] === null || out[field] === '') {
        out[field] = '*';
      }
    });
  }
  return out;
}

async function serializeRule(rule) {
  const trigger = await ReactiveCache.getTrigger(rule.triggerId);
  const action = await ReactiveCache.getAction(rule.actionId);
  return {
    _id: rule._id,
    title: rule.title,
    trigger: trigger ? strip(trigger) : null,
    action: action ? strip(action) : null,
  };
}

if (Meteor.isServer) {
  /**
   * @operation get_board_rules
   * @tag Rules
   * @summary Get the list of automation rules of a board
   *
   * @param {string} boardId the board ID
   * @return_type [{_id: string, title: string, trigger: object, action: object}]
   */
  WebApp.handlers.get('/api/boards/:boardId/rules', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      await Authentication.checkBoardAccess(req.userId, paramBoardId);
      const rules = await ReactiveCache.getRules({ boardId: paramBoardId });
      const data = [];
      for (const rule of rules) {
        // eslint-disable-next-line no-await-in-loop
        data.push(await serializeRule(rule));
      }
      sendJsonResult(res, { code: 200, data });
    } catch (error) {
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
    }
  });

  /**
   * @operation get_board_rule
   * @tag Rules
   * @summary Get a single automation rule
   *
   * @param {string} boardId the board ID
   * @param {string} ruleId the rule ID
   * @return_type {_id: string, title: string, trigger: object, action: object}
   */
  WebApp.handlers.get('/api/boards/:boardId/rules/:ruleId', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      await Authentication.checkBoardAccess(req.userId, paramBoardId);
      const rule = await ReactiveCache.getRule({
        _id: req.params.ruleId,
        boardId: paramBoardId,
      });
      if (!rule) throw new Meteor.Error('not-found', 'Rule not found');
      sendJsonResult(res, { code: 200, data: await serializeRule(rule) });
    } catch (error) {
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
    }
  });

  /**
   * @operation new_board_rule
   * @tag Rules
   * @summary Add an automation rule to a board
   *
   * @description The trigger and action are embedded inline. See the Rules
   * documentation for the available trigger activityTypes and action actionTypes.
   * Trigger matching fields that are omitted (e.g. userId, listName,
   * swimlaneName, cardTitle) default to the '*' wildcard, so e.g. issue #2674's
   * "remove a member when a card is moved away from a list" only needs
   * trigger {activityType: 'moveCard', oldListName: '...'} and
   * action {actionType: 'removeMember', username: '...'}.
   *
   * @param {string} boardId the board ID
   * @param {string} title the rule title
   * @param {object} trigger the trigger document (must include activityType)
   * @param {object} action the action document (must include actionType)
   * @return_type {_id: string, triggerId: string, actionId: string}
   */
  WebApp.handlers.post('/api/boards/:boardId/rules', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
      const { title, trigger, action } = req.body;
      if (!trigger || !action) {
        throw new Meteor.Error('bad-request', 'trigger and action are required');
      }
      if (!trigger.activityType) {
        throw new Meteor.Error('bad-request', 'trigger.activityType is required');
      }
      if (!action.actionType) {
        throw new Meteor.Error('bad-request', 'action.actionType is required');
      }
      const triggerId = await Triggers.insertAsync({
        ...normalizeTriggerDoc(strip(trigger)),
        boardId: paramBoardId,
      });
      const actionId = await Actions.insertAsync({ ...strip(action), boardId: paramBoardId });
      const ruleId = await Rules.insertAsync({
        title: title || 'API rule',
        triggerId,
        actionId,
        boardId: paramBoardId,
      });
      sendJsonResult(res, { code: 200, data: { _id: ruleId, triggerId, actionId } });
    } catch (error) {
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
    }
  });

  /**
   * @operation edit_board_rule
   * @tag Rules
   * @summary Edit an automation rule
   *
   * @description Any of title, trigger and action may be supplied; the trigger
   * and action documents are replaced ($set) when present. A supplied trigger
   * that includes an activityType gets its missing matching fields defaulted
   * to the '*' wildcard, like on creation.
   *
   * @param {string} boardId the board ID
   * @param {string} ruleId the rule ID
   * @param {string} [title] the new rule title
   * @param {object} [trigger] the new trigger document
   * @param {object} [action] the new action document
   * @return_type {_id: string}
   */
  WebApp.handlers.put('/api/boards/:boardId/rules/:ruleId', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
      const rule = await ReactiveCache.getRule({
        _id: req.params.ruleId,
        boardId: paramBoardId,
      });
      if (!rule) throw new Meteor.Error('not-found', 'Rule not found');

      if (typeof req.body.title === 'string') {
        await Rules.updateAsync(rule._id, { $set: { title: req.body.title } });
      }
      if (req.body.trigger) {
        await Triggers.updateAsync(rule.triggerId, {
          $set: { ...normalizeTriggerDoc(strip(req.body.trigger)), boardId: paramBoardId },
        });
      }
      if (req.body.action) {
        await Actions.updateAsync(rule.actionId, {
          $set: { ...strip(req.body.action), boardId: paramBoardId },
        });
      }
      sendJsonResult(res, { code: 200, data: { _id: rule._id } });
    } catch (error) {
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
    }
  });

  /**
   * @operation delete_board_rule
   * @tag Rules
   * @summary Remove an automation rule (and its trigger and action)
   *
   * @param {string} boardId the board ID
   * @param {string} ruleId the rule ID
   * @return_type {_id: string}
   */
  WebApp.handlers.delete('/api/boards/:boardId/rules/:ruleId', async function(req, res) {
    try {
      const paramBoardId = req.params.boardId;
      await Authentication.checkBoardWriteAccess(req.userId, paramBoardId);
      const rule = await ReactiveCache.getRule({
        _id: req.params.ruleId,
        boardId: paramBoardId,
      });
      if (!rule) throw new Meteor.Error('not-found', 'Rule not found');
      await Rules.removeAsync(rule._id);
      await Triggers.removeAsync(rule.triggerId);
      await Actions.removeAsync(rule.actionId);
      sendJsonResult(res, { code: 200, data: { _id: rule._id } });
    } catch (error) {
      sendJsonResult(res, { code: error.statusCode || 500, data: error });
    }
  });
}
