'use strict';
const { normalizeDependencies } = require('../../models/metadata/dependencies');
// DHTMLX defaults: https://docs.dhtmlx.com/gantt/api/config/links/
const ganttTypes = ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'];
function ruleCardRelations(card) {
  const targets = new Map();
  const add = (id, label) => {
    if (typeof id !== 'string' || !id) return;
    if (!targets.has(id)) targets.set(id, new Set());
    targets.get(id).add(label);
  };
  for (const entry of normalizeDependencies(Array.isArray(card.cardDependencies) ? card.cardDependencies : [])) {
    add(entry.cardId, entry.type);
  }
  const ids = Array.isArray(card.targetId_gantt) ? card.targetId_gantt : [];
  const types = Array.isArray(card.linkType_gantt) ? card.linkType_gantt : [];
  // Legacy removal used independent $pull operations, which can unpair types
  // and targets. Preserve readable targets without guessing the missing type.
  const aligned = ids.length === types.length;
  ids.forEach((id, index) => {
    const type = aligned && Number.isInteger(types[index]) ? ganttTypes[types[index]] : null;
    add(id, type ? `Gantt ${type}` : 'Gantt target');
  });
  return [...targets].map(([cardId, labels]) => ({ cardId, label: [...labels].join(' / ') }));
}
module.exports = { ruleCardRelations };
