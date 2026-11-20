'use strict';

// The Kanban and Scrum flow fields of a card (docs/Features/Cards/Flow-Fields.md),
// stored together on `card.flow`:
//
//   blocked, blockedReason,   a blocked card and why (the Kanban impediment:
//   blockedAt, blockedBy      who marked it and since when - set by the server)
//   classOfService            standard | fixed-date | expedite | intangible;
//                             Expedite has a WIP limit of ONE per board
//   moscow                    must | should | could | wont
//   wsjf                      { businessValue, timeCriticality, riskReduction,
//                             jobSize } - Weighted Shortest Job First, the cost
//                             of delay (the first three) divided by the size
//
// Each is a row of Board Settings / Card (models/lib/cardSettingsRows.js) in
// the Card section, so a board admin shows or hides it on cards and minicards,
// and an Admin Panel / Visibility / Features card field hides it everywhere.
// Off until a board turns it on.
//
// Written only by the server method setCardFlow (server/lib/cardFlowMethod.js),
// which validates through flowModifier below; a direct client write of `flow`
// is denied (models/cards.js). Pure CommonJS: tests/cardFlow.test.cjs.

const CLASSES_OF_SERVICE = Object.freeze(['standard', 'fixed-date', 'expedite', 'intangible']);
const MOSCOW = Object.freeze(['must', 'should', 'could', 'wont']);
const WSJF_PARTS = Object.freeze(['businessValue', 'timeCriticality', 'riskReduction', 'jobSize']);
// The modified Fibonacci scale SAFe scores each part on.
const WSJF_SCALE = Object.freeze([1, 2, 3, 5, 8, 13, 20]);
const MAX_REASON = 1000;
const EXPEDITE_LIMIT = 1;

const CLASS_LABEL = { standard: 'class-of-service-standard', 'fixed-date': 'class-of-service-fixed-date',
  expedite: 'class-of-service-expedite', intangible: 'class-of-service-intangible' };
const MOSCOW_LABEL = { must: 'moscow-must', should: 'moscow-should', could: 'moscow-could', wont: 'moscow-wont' };

// The WSJF score of a card's parts, one decimal; null until every part is set.
function wsjfScore(wsjf) {
  if (!wsjf || typeof wsjf !== 'object') return null;
  const values = WSJF_PARTS.map(part => Number(wsjf[part]));
  if (values.some(v => !WSJF_SCALE.includes(v))) return null;
  const [bv, tc, rr, size] = values;
  return Math.round(((bv + tc + rr) / size) * 10) / 10;
}

function invalid(what) {
  const error = new Error(`invalid-flow-${what}`);
  error.code = `invalid-flow-${what}`;
  return error;
}

// The Mongo modifier a patch makes, or throws. `patch` holds any of
// { blocked, blockedReason, classOfService, moscow, wsjf }; '' or null clears a
// field. `userId` and `now` are the server's: a client never sets who or when.
function flowModifier(patch, { userId, now = new Date(), listId = null } = {}) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw invalid('patch');
  const known = ['blocked', 'blockedReason', 'classOfService', 'moscow', 'wsjf', 'splitDone'];
  const keys = Object.keys(patch);
  if (!keys.length || keys.some(key => !known.includes(key))) throw invalid('patch');
  const $set = {};
  const $unset = {};
  const clear = value => value === '' || value === null;

  if ('blocked' in patch) {
    if (typeof patch.blocked !== 'boolean') throw invalid('blocked');
    if (patch.blocked) {
      $set['flow.blocked'] = true;
      $set['flow.blockedAt'] = now;
      if (userId) $set['flow.blockedBy'] = userId;
    } else {
      for (const field of ['blocked', 'blockedReason', 'blockedAt', 'blockedBy']) $unset[`flow.${field}`] = '';
    }
  }
  if ('blockedReason' in patch && patch.blocked !== false) {
    const reason = patch.blockedReason;
    if (clear(reason)) $unset['flow.blockedReason'] = '';
    else if (typeof reason !== 'string' || reason.length > MAX_REASON) throw invalid('reason');
    else $set['flow.blockedReason'] = reason.trim();
  }
  if ('classOfService' in patch) {
    if (clear(patch.classOfService)) $unset['flow.classOfService'] = '';
    else if (!CLASSES_OF_SERVICE.includes(patch.classOfService)) throw invalid('class');
    else $set['flow.classOfService'] = patch.classOfService;
  }
  if ('moscow' in patch) {
    if (clear(patch.moscow)) $unset['flow.moscow'] = '';
    else if (!MOSCOW.includes(patch.moscow)) throw invalid('moscow');
    else $set['flow.moscow'] = patch.moscow;
  }
  if ('wsjf' in patch) {
    const wsjf = patch.wsjf;
    if (clear(wsjf)) $unset['flow.wsjf'] = '';
    else {
      if (typeof wsjf !== 'object' || Array.isArray(wsjf)) throw invalid('wsjf');
      if (Object.keys(wsjf).some(part => !WSJF_PARTS.includes(part))) throw invalid('wsjf');
      for (const part of WSJF_PARTS) {
        if (!(part in wsjf)) continue;
        if (clear(wsjf[part])) $unset[`flow.wsjf.${part}`] = '';
        else if (!WSJF_SCALE.includes(Number(wsjf[part]))) throw invalid('wsjf');
        else $set[`flow.wsjf.${part}`] = Number(wsjf[part]);
      }
    }
  }
  // Done here in a split list (models/lib/boardFlowPolicies.js): the list it
  // was marked in is the server's - the card's own list when it is written.
  if ('splitDone' in patch) {
    if (typeof patch.splitDone !== 'boolean') throw invalid('split');
    if (patch.splitDone) {
      if (!listId) throw invalid('split');
      $set['flow.splitDoneListId'] = listId;
    } else {
      $unset['flow.splitDoneListId'] = '';
    }
  }
  const modifier = {};
  if (Object.keys($set).length) modifier.$set = $set;
  if (Object.keys($unset).length) modifier.$unset = $unset;
  return modifier;
}

// Whether making `cardId` Expedite goes over the board's limit of one: the
// other open (not archived, not done) Expedite cards of the board.
function expediteOverLimit(cardId, boardCards) {
  const others = (boardCards || []).filter(card => card && card._id !== cardId && !card.archived
    && !card.dueComplete && card.flow && card.flow.classOfService === 'expedite');
  return others.length >= EXPEDITE_LIMIT;
}

// What the opened card and the minicard draw. Each is null when there is
// nothing to show, so an empty row draws nothing on the minicard.
function flowView(card) {
  const flow = (card && card.flow) || {};
  return {
    blocked: flow.blocked === true,
    blockedReason: flow.blockedReason || '',
    blockedAt: flow.blockedAt || null,
    blockedBy: flow.blockedBy || null,
    classOfService: CLASSES_OF_SERVICE.includes(flow.classOfService) ? flow.classOfService : null,
    classLabelKey: CLASS_LABEL[flow.classOfService] || null,
    moscow: MOSCOW.includes(flow.moscow) ? flow.moscow : null,
    moscowLabelKey: MOSCOW_LABEL[flow.moscow] || null,
    wsjf: flow.wsjf || {},
    wsjfScore: wsjfScore(flow.wsjf),
  };
}

module.exports = {
  CLASSES_OF_SERVICE, MOSCOW, WSJF_PARTS, WSJF_SCALE, MAX_REASON, EXPEDITE_LIMIT, CLASS_LABEL, MOSCOW_LABEL,
  wsjfScore, flowModifier, expediteOverLimit, flowView,
};
