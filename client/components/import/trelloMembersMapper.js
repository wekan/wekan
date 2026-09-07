import { ReactiveCache } from '/imports/reactiveCache';
const { membersFromImport } = require('/models/lib/importMembers');

export function trelloGetMembersToMap(data) {
  // we will work on the list itself (an ordered array of objects) when a
  // mapping is done, we add a 'wekan' field to the object representing the
  // imported member
  const membersToMap = membersFromImport('trello', data);
  // auto-map based on username
  membersToMap.forEach(importedMember => {
    const wekanUser = ReactiveCache.getUser({ username: importedMember.username });
    if (wekanUser) {
      importedMember.wekanId = wekanUser._id;
    }
  });
  return membersToMap;
}
