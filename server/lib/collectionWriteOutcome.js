// collection-hooks runs after.update even when the conditional Mongo update
// matched zero documents. Such an attempt must not emit success side effects.
function collectionWriteSucceeded(context) {
  const affected = typeof context?.affected === 'number' ? context.affected : context?.affected?.numberAffected;
  return !context?.err && Number.isSafeInteger(affected) && affected > 0 && !!context.previous;
}
module.exports = { collectionWriteSucceeded };
