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
    // What server/apiImport.js fetches (models/lib/apiImport/<key>.js).
    case 'planka': valid = Boolean(value?.planka?.item) && typeof value.planka.included === 'object'; break;
    case 'mstodo': case 'googletasks': valid = arrayAt(value, 'lists'); break;
    case 'kanbanflow': valid = Boolean(value?.board) && arrayAt(value, 'tasks'); break;
    case 'basecamp': valid = Boolean(value?.project) && (arrayAt(value, 'cardTables') || arrayAt(value, 'todolists')); break;
    case 'googlekeep': valid = arrayAt(value, 'notes'); break;
    // Vikunja: the export .zip as { zipBase64 }, or the text of its data.json.
    // Notion: the Markdown & CSV export .zip as { zipBase64 }, or one database CSV.
    case 'notion':
    case 'vikunja': valid = (typeof value?.zipBase64 === 'string' && value.zipBase64.length > 0)
      || typeof value?.zipFile === 'string'
      || (typeof value === 'string' && value.trim().length > 0); break;
    // Plane: the export .zip as { zipBase64 }, a workbook as { xlsxBase64 },
    // or the text of a JSON or CSV export file.
    case 'plane': valid = (typeof value?.zipBase64 === 'string' && value.zipBase64.length > 0)
      || typeof value?.zipFile === 'string'
      || (typeof value?.xlsxBase64 === 'string' && value.xlsxBase64.length > 0)
      || (typeof value === 'string' && value.trim().length > 0); break;
    case 'excel': case 'planner': case 'monday': case 'wrike': case 'teamwork': case 'businessmap': valid = typeof value?.excelBase64 === 'string' && value.excelBase64.length > 0; break;
    case 'markdown': case 'todotxt': case 'taskwarrior': case 'focalboard': case 'todoist': case 'meistertask': case 'obsidian': case 'linear': case 'ticktick': case 'clickup': case 'nullboard': case 'pivotal': case 'redmine': case 'superproductivity': case 'quire': case 'orgmode': valid = typeof value === 'string' && value.trim().length > 0; break;
    case 'leo': valid = typeof value === 'string' && /<leo_file[\s>]/.test(value); break;
    // Mail, calendar, chat and note exports (models/lib/mailFormat.js,
    // icalendarFormat.js, chatExportFormats.js, enexFormat.js,
    // googleTakeoutFormat.js).
    case 'mail': valid = (typeof value === 'string' && value.trim().length > 0) || typeof value?.mboxFile === 'string'; break;
    case 'whatsapp': valid = typeof value === 'string' && value.trim().length > 0; break;
    case 'ical': valid = typeof value === 'string' && /BEGIN:VCALENDAR/i.test(value); break;
    case 'mattermost': valid = (typeof value === 'string' && /"type"\s*:\s*"version"/.test(value))
      || (Array.isArray(value?.jsonLines) && value.jsonLines.some(line => line && line.type === 'version')); break;
    // Rocket.Chat and Fizzy: an export .zip, or the text of one room's or
    // card's .json.
    case 'fizzy':
    case 'rocketchat': valid = (typeof value?.zipBase64 === 'string' && value.zipBase64.length > 0)
      || typeof value?.zipFile === 'string'
      || (typeof value === 'string' && value.trim().length > 0); break;
    // Azure DevOps and Microsoft Lists CSV, Microsoft Project XML: text.
    case 'azuredevops':
    case 'mslists': valid = typeof value === 'string' && value.trim().length > 0; break;
    case 'msproject': valid = typeof value === 'string' && /<Project[\s>]/.test(value); break;
    // Outlook: a .msg as bytes, or a .zip of .msg and .eml files.
    case 'outlook': valid = (typeof value?.binaryBase64 === 'string' && value.binaryBase64.length > 0)
      || typeof value?.binaryFile === 'string'
      || (typeof value?.zipBase64 === 'string' && value.zipBase64.length > 0)
      || typeof value?.zipFile === 'string'; break;
    // Teams and OneNote: JSON (fetched, or a file), a .zip, or Teams' .tar.
    case 'teams': valid = (value && typeof value === 'object' && (value.teams === true || Array.isArray(value.value)
      || Array.isArray(value.conversations) || typeof value.binaryBase64 === 'string' || typeof value.binaryFile === 'string'
      || typeof value.zipBase64 === 'string' || typeof value.zipFile === 'string')) || Array.isArray(value)
      || (typeof value === 'string' && value.trim().length > 0); break;
    case 'onenote': valid = (value && typeof value === 'object' && (value.onenote === true
      || typeof value.zipBase64 === 'string' || typeof value.zipFile === 'string'))
      || (typeof value === 'string' && value.trim().length > 0); break;
    // A Sandstorm grain backup: a .zip, read on the server.
    case 'sandstormwekan':
    case 'sandstormprioritize':
    case 'sandstormyatl':
    case 'sandstormmutodo':
    case 'sandstormsandchat':
    case 'sandstormethercalc':
    case 'sandstormradicalecalendar':
    case 'sandstormradicalecontacts':
    case 'sandstormdavros':
    case 'sandstormhackercms':
    case 'sandstormgogs':
    case 'sandstormwordpress': valid = (typeof value?.zipBase64 === 'string' && value.zipBase64.length > 0) || typeof value?.zipFile === 'string'; break;
    case 'evernote': valid = typeof value === 'string' && /<en-export[\s>]/.test(value); break;
    case 'telegram': valid = arrayAt(value, 'messages') || arrayAt(value?.chats, 'list'); break;
    case 'discord': valid = (Array.isArray(value) ? value : [value]).every(e => e && e.channel && Array.isArray(e.messages)); break;
    // A .zip sent in the call, or one streamed to the local disk (zipFile).
    case 'slack': case 'googletakeout': valid = (typeof value?.zipBase64 === 'string' && value.zipBase64.length > 0)
      || typeof value?.zipFile === 'string'; break;
    case 'opml': valid = typeof value === 'string' && /<opml[\s>]/.test(value); break;
  }
  if (!valid) throw new Error(`Invalid ${source} import document shape`);
}
