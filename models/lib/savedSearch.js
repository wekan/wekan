const SAVED_SEARCH_LIMIT = 25;

function normalizeSavedSearch(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const query = typeof input?.query === 'string' ? input.query.trim() : '';
  if (!name || name.length > 80) return { error: 'saved-search-invalid-name' };
  if (!query || query.length > 500) return { error: 'saved-search-invalid-query' };
  return { value: { name, query } };
}

module.exports = { SAVED_SEARCH_LIMIT, normalizeSavedSearch };
