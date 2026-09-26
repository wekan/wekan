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
      && ['related-to', 'blocks', 'is-blocked-by', 'fixes', 'is-fixed-by'].includes(dep.type);
  });
}
module.exports = { validDependencyRestore };
