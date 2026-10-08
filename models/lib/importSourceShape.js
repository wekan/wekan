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
    case 'zenkit': valid = Array.isArray(value) || arrayAt(value, 'items')
      || (arrayAt(value, 'elements') && (arrayAt(value, 'entries') || arrayAt(value, 'listEntries'))); break;
    case 'tasksorg': valid = arrayAt(value?.data, 'tasks'); break;
    case 'csv': valid = Array.isArray(value) && value.length > 0 && value.every(Array.isArray); break;
    case 'taiga': valid = arrayAt(value, 'user_stories'); break;
    case 'kanri': valid = arrayAt(value, 'columns') || arrayAt(value, 'boards'); break;
    // Vikunja: the export .zip as { zipBase64 }, or the text of its data.json.
    // Notion: the Markdown & CSV export .zip as { zipBase64 }, or one database CSV.
    case 'notion':
    case 'vikunja': valid = (typeof value?.zipBase64 === 'string' && value.zipBase64.length > 0)
      || (typeof value === 'string' && value.trim().length > 0); break;
    // Plane: the export .zip as { zipBase64 }, a workbook as { xlsxBase64 },
    // or the text of a JSON or CSV export file.
    case 'plane': valid = (typeof value?.zipBase64 === 'string' && value.zipBase64.length > 0)
      || (typeof value?.xlsxBase64 === 'string' && value.xlsxBase64.length > 0)
      || (typeof value === 'string' && value.trim().length > 0); break;
    case 'excel': case 'planner': case 'monday': case 'wrike': case 'teamwork': case 'businessmap': valid = typeof value?.excelBase64 === 'string' && value.excelBase64.length > 0; break;
    case 'markdown': case 'todotxt': case 'taskwarrior': case 'focalboard': case 'todoist': case 'meistertask': case 'obsidian': case 'linear': case 'ticktick': case 'clickup': case 'nullboard': case 'pivotal': case 'redmine': case 'superproductivity': case 'quire': case 'orgmode': valid = typeof value === 'string' && value.trim().length > 0; break;
    case 'leo': valid = typeof value === 'string' && /<leo_file[\s>]/.test(value); break;
    case 'opml': valid = typeof value === 'string' && /<opml[\s>]/.test(value); break;
  }
  if (!valid) throw new Error(`Invalid ${source} import document shape`);
}
