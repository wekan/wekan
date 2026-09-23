// Shape validation before creating a board. Unknown/empty objects must not
// report a successful import which silently contains no source records.
export function validateImportSourceShape(source, value) {
  const arrayAt = (object, key) => object && Array.isArray(object[key]);
  let valid = false;
  switch (source) {
    case 'wekan': case 'trello': valid = arrayAt(value, 'cards') && arrayAt(value, 'lists'); break;
    case 'kanboard': valid = arrayAt(value, 'tasks'); break;
    case 'jira': valid = arrayAt(value, 'issues'); break;
    case 'github': case 'gitlab': case 'gitea': case 'forgejo':
      valid = Array.isArray(value) || arrayAt(value, 'issues'); break;
    case 'deck': valid = arrayAt(value, 'stacks') || arrayAt(value?.board, 'stacks'); break;
    case 'openproject': valid = Array.isArray(value) || arrayAt(value, 'elements') || arrayAt(value?._embedded, 'elements'); break;
    case 'asana': valid = Array.isArray(value) || arrayAt(value, 'data'); break;
    case 'zenkit': valid = Array.isArray(value) || arrayAt(value, 'items'); break;
    case 'csv': valid = Array.isArray(value) && value.length > 0 && value.every(Array.isArray); break;
    case 'excel': valid = typeof value?.excelBase64 === 'string' && value.excelBase64.length > 0; break;
    case 'markdown': valid = typeof value === 'string' && value.trim().length > 0; break;
  }
  if (!valid) throw new Error(`Invalid ${source} import document shape`);
}
