import { Meteor } from 'meteor/meteor';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';
import { secureTransfer } from '/server/lib/secureTransfer';
import {
  collectRuleTransferEntries,
  ruleTransferDocument,
  rulesToCsv,
} from '/models/lib/ruleTransfer';
const { assertExportEnabled } = require('/models/lib/importExportSecurity');
const { attachmentDisposition } = require('/models/lib/exportFilename');

const RULE_EXPORT_FORMATS = new Set(['json', 'csv']);

function componentSelector(ids, boardId) {
  return {
    _id: { $in: ids },
    $or: [{ boardId }, { boardId: { $exists: false } }],
  };
}

async function buildAccessibleRulesExport(userId, boardId, format) {
  if (!userId || typeof boardId !== 'string' || !RULE_EXPORT_FORMATS.has(format)) {
    throw new Meteor.Error('forbidden');
  }
  await assertExportEnabled();
  if (!(await canUserSeeBoard(userId, boardId))) {
    throw new Meteor.Error('forbidden');
  }
  const rules = await Rules.find(
    { boardId }, { sort: { title: 1, _id: 1 }, limit: 10001 },
  ).fetchAsync();
  if (rules.length > 10000) throw new Meteor.Error('too-many-rules');
  const triggerIds = rules.map(rule => rule.triggerId).filter(Boolean);
  const actionIds = rules.map(rule => rule.actionId).filter(Boolean);
  const [triggers, actions] = await Promise.all([
    Triggers.find(componentSelector(triggerIds, boardId)).fetchAsync(),
    Actions.find(componentSelector(actionIds, boardId)).fetchAsync(),
  ]);
  const triggerById = new Map(triggers.map(doc => [doc._id, doc]));
  const actionById = new Map(actions.map(doc => [doc._id, doc]));
  const entries = collectRuleTransferEntries(
    rules,
    id => triggerById.get(id),
    id => actionById.get(id),
  );
  const document = secureTransfer(ruleTransferDocument(boardId, entries), {
    direction: 'export', source: `rules:${format}`, userId,
    maxDepth: 25, maxNodes: 100000, maxArray: 10000, maxString: 256 * 1024,
  });
  return format === 'csv'
    ? { body: rulesToCsv(document.rules), contentType: 'text/csv; charset=utf-8',
      filename: 'wekan-rules.csv' }
    : { body: `${JSON.stringify(document, null, 2)}\n`,
      contentType: 'application/json; charset=utf-8', filename: 'wekan-rules.json' };
}

async function serveAccessibleRulesExport({ res, userId, boardId, format }) {
  const result = await buildAccessibleRulesExport(userId, boardId, format);
  res.statusCode = 200;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', attachmentDisposition(result.filename));
  res.end(result.body);
}

export {
  RULE_EXPORT_FORMATS,
  buildAccessibleRulesExport,
  componentSelector,
  serveAccessibleRulesExport,
};
