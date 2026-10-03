// RepointBleed: Triggers, Actions, Rules and Integrations are allowed to a
// board admin of the document's board - the board the document is on BEFORE
// the update. Nothing stopped the update itself from changing boardId, so an
// admin of their own board could move a rule trigger to another board, to '*'
// (every board) or unset it, and a webhook integration onto a private board -
// and receive that board's activity, or mail its cards to themselves. No client
// code changes these documents' boardId, so a change is an attempt.
// Pure apart from the record: tested by tests/repointBleed.test.cjs.

// Does this update write boardId - by $set/$unset/$inc/... or as the target of
// a $rename?
export function changesBoardId(fieldNames, modifier, fields = ['boardId']) {
  if (Array.isArray(fieldNames) && fieldNames.some(name => fields.includes(name))) return true;
  const rename = modifier && modifier.$rename;
  return !!(rename && typeof rename === 'object' && Object.values(rename).some(name => fields.includes(name)));
}

// A rule pointing at ANOTHER board's trigger (2026-10-03, RepointBleed
// sibling): a board admin of their own board could save a rule naming a
// trigger of a board they do not administer. Only that board's own rules run
// on its activities, but which rule a trigger led to was whichever named it
// first, so the other board's rule could stop running. No client names a
// trigger of another board - the rule editor creates the trigger on the
// rule's board first - so it is an attempt. `readTrigger(id)` returns the
// trigger, or null when there is none (nothing to point at, nothing taken).
export function rulePointsElsewhere(rule, readTrigger) {
  const ids = [rule && rule.triggerId, ...((rule && Array.isArray(rule.extraTriggerIds)) ? rule.extraTriggerIds : [])]
    .filter(id => typeof id === 'string' && id);
  return (async () => {
    for (const id of ids) {
      const trigger = await readTrigger(id);
      if (trigger && trigger.boardId !== rule.boardId) return true;
    }
    return false;
  })();
}
export function denyForeignRuleTriggers(readTrigger) {
  const refuse = (userId, rule, source) => {
    try {
      require('/server/lib/securityLog').record({ key: 'authz.repoint', action: 'blocked', source, userId,
        detail: `Tried to point a rule on board ${rule && rule.boardId} at a trigger of another board.` });
    } catch (e) { /* logging must never break the guard */ }
    return true;
  };
  return {
    async insert(userId, doc) {
      return await rulePointsElsewhere(doc, readTrigger) ? refuse(userId, doc, 'ddp:rules.insert') : false;
    },
    async update(userId, doc, fieldNames, modifier) {
      if (!fieldNames.some(name => name === 'triggerId' || name === 'extraTriggerIds')) return false;
      const set = (modifier && modifier.$set) || {};
      const after = { ...doc, ...set };
      if (modifier && modifier.$addToSet && modifier.$addToSet.extraTriggerIds !== undefined) {
        const added = modifier.$addToSet.extraTriggerIds;
        after.extraTriggerIds = [...(doc.extraTriggerIds || []), ...(added && added.$each ? added.$each : [added])];
      }
      if (modifier && modifier.$push && modifier.$push.extraTriggerIds !== undefined) {
        const added = modifier.$push.extraTriggerIds;
        after.extraTriggerIds = [...(doc.extraTriggerIds || []), ...(added && added.$each ? added.$each : [added])];
      }
      return await rulePointsElsewhere(after, readTrigger) ? refuse(userId, after, 'ddp:rules.update') : false;
    },
    fetch: ['boardId', 'triggerId', 'extraTriggerIds'],
  };
}

// A deny rule for a collection whose documents belong to one board. `fields`
// names what ties a document to its board (and to its parent on the board).
export function denyBoardRepoint(collectionName, fields = ['boardId']) {
  return {
    update(userId, doc, fieldNames, modifier) {
      if (!changesBoardId(fieldNames, modifier, fields)) return false;
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.repoint', action: 'blocked', source: `ddp:${collectionName}.update`, userId,
          detail: `Tried to move a ${collectionName} document from board ${doc && doc.boardId} to another board.`,
        });
      } catch (e) { /* logging must never break the guard */ }
      return true;
    },
  };
}
