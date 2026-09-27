// Shared by the selection popup and the server copy pipeline.
export const BOARD_COPY_FIELDS = [
  { key: 'swimlanes', label: 'swimlanes' },
  { key: 'lists', label: 'lists', parent: 'swimlanes' },
  { key: 'labels', label: 'labels' },
  { key: 'customFields', label: 'custom-fields' },
  { key: 'rules', label: 'rules' },
  { key: 'integrations', label: 'outgoing-webhooks' },
  { key: 'cards', label: 'cards', parent: 'lists' },
  { key: 'checklists', label: 'checklists', parent: 'cards' },
  { key: 'comments', label: 'comments', parent: 'cards' },
  { key: 'attachments', label: 'attachments', parent: 'cards' },
];
export function allBoardCopyOptions(value = true) {
  return Object.fromEntries(BOARD_COPY_FIELDS.map(field => [field.key, value]));
}
export function normalizeBoardCopyOptions(input) {
  if (input === undefined) return allBoardCopyOptions();
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid copy options');
  const result = allBoardCopyOptions();
  for (const [key, value] of Object.entries(input)) {
    if (!Object.hasOwn(result, key) || typeof value !== 'boolean') throw new Error('Invalid copy option');
    result[key] = value;
  }
  for (const field of BOARD_COPY_FIELDS) {
    if (field.parent && !result[field.parent]) result[field.key] = false;
  }
  return result;
}
export function toggleBoardCopyOption(input, key) {
  const result = normalizeBoardCopyOptions(input);
  const field = BOARD_COPY_FIELDS.find(field => field.key === key);
  if (!field) throw new Error('Invalid copy option');
  result[key] = !result[key];
  if (result[key]) {
    let parent = field.parent;
    while (parent) {
      result[parent] = true;
      parent = BOARD_COPY_FIELDS.find(field => field.key === parent).parent;
    }
  }
  return normalizeBoardCopyOptions(result);
}
