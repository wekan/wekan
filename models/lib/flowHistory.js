'use strict';

// The history restore path uses the same board boundary as the dependency
// editor. Do not accept malformed history or targets that have moved away.
function validDependencyRestore(card, dependencies, targets) {
  if (!card || !Array.isArray(dependencies)) return false;
  const byId = new Map(targets.map(target => [target._id, target]));
  const seen = new Set();
  return dependencies.every(dep => {
    if (!dep || typeof dep.cardId !== 'string' || seen.has(dep.cardId)) return false;
    seen.add(dep.cardId);
    const target = byId.get(dep.cardId);
    return dep.cardId !== card._id && target?.boardId === card.boardId
      && !target.deletedAt
      && ['related-to', 'blocks', 'is-blocked-by', 'fixes', 'is-fixed-by', 'duplicates', 'is-duplicated-by'].includes(dep.type);
  });
}
function dependencySummary(dependencies, titleOf = id => id, translate = key => key) {
  if (!dependencies.length) return '—';
  return dependencies.map(dep => typeof dep === 'string' ? titleOf(dep)
    : `${translate(`dependency-type-${dep.type}`)}: ${titleOf(dep.cardId)}`).join('; ');
}
module.exports = { validDependencyRestore, dependencySummary };
