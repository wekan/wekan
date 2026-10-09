import { ReactiveCache } from '/imports/reactiveCache';
import { splitByField, splitPeople } from '/models/lib/csvImportMapping';

// The usernames to map. Without `columns`, the ones in a column named
// "Members"; with the columns the mapping step chose, the ones in every
// people column: owner, members, assignees, requested by and assigned by.
export function csvGetMembersToMap(data, columns) {
  // we will work on the list itself (an ordered array of objects) when a
  // mapping is done, we add a 'wekan' field to the object representing the
  // imported member

  const membersToMap = [];
  const importedMembers = [];
  const peopleColumns = [];

  if (columns) {
    ['owner', 'members', 'assignees'].forEach(field => {
      if (columns[field] !== undefined) peopleColumns.push({ index: columns[field], split: splitPeople });
    });
    ['requestedBy', 'assignedBy'].forEach(field => {
      if (columns[field] !== undefined) peopleColumns.push({ index: columns[field], split: splitByField });
    });
  } else {
    for (let i = 0; i < data[0].length; i++) {
      if (String(data[0][i] || '').toLowerCase() === 'members') {
        peopleColumns.push({ index: i, split: cell => String(cell).split(' ') });
      }
    }
  }

  for (let i = 1; i < data.length; i++) {
    for (const { index, split } of peopleColumns) {
      if (data[i][index]) {
        for (const importedMember of split(data[i][index])) {
          if (importedMember && importedMembers.indexOf(importedMember) === -1) {
            importedMembers.push(importedMember);
          }
        }
      }
    }
  }

  for (let importedMember of importedMembers) {
    importedMember = {
      username: importedMember,
      id: importedMember,
    };
    const wekanUser = ReactiveCache.getUser({ username: importedMember.username });
    if (wekanUser) importedMember.wekanId = wekanUser._id;
    membersToMap.push(importedMember);
  }

  return membersToMap;
}
