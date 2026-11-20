// The usernames of a CSV/TSV import's people, to map to WeKan users. Without
// `columns`, the ones in a column named "Members"; with the columns the
// mapping step chose, the ones in every people column: owner, members,
// assignees, requested by and assigned by. Shared: the page reads them from
// rows it parsed, the server (server/methods/csvImportMapping.js) from an
// uploaded file.
import { splitByField, splitPeople } from './csvImportMapping.js';

export function csvPeopleNames(rows, columns) {
  const data = Array.isArray(rows) ? rows : [];
  const peopleColumns = [];
  if (columns) {
    ['owner', 'members', 'assignees'].forEach(field => {
      if (columns[field] !== undefined) peopleColumns.push({ index: columns[field], split: splitPeople });
    });
    ['requestedBy', 'assignedBy'].forEach(field => {
      if (columns[field] !== undefined) peopleColumns.push({ index: columns[field], split: splitByField });
    });
  } else {
    for (let i = 0; i < ((data[0] || []).length); i++) {
      if (String(data[0][i] || '').toLowerCase() === 'members') {
        peopleColumns.push({ index: i, split: cell => String(cell).split(' ') });
      }
    }
  }
  const names = [];
  for (let i = 1; i < data.length; i++) {
    for (const { index, split } of peopleColumns) {
      if (data[i][index]) {
        for (const name of split(data[i][index])) {
          if (name && names.indexOf(name) === -1) names.push(name);
        }
      }
    }
  }
  return names;
}
