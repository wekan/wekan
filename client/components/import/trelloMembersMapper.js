import { ReactiveCache } from '/imports/reactiveCache';

export function trelloGetMembersToMap(data) {
  // we will work on the list itself (an ordered array of objects) when a
  // mapping is done, we add a 'wekan' field to the object representing the
  // imported member
  // A Trello file may have no members (an export of a board nobody else is
  // on): there is then nobody to map, not an error. Without the fallback the
  // forEach below threw and the Import button silently did nothing.
  const membersToMap = Array.isArray(data.members) ? data.members : [];
  // auto-map based on username
  membersToMap.forEach(importedMember => {
    const wekanUser = ReactiveCache.getUser({ username: importedMember.username });
    if (wekanUser) {
      importedMember.wekanId = wekanUser._id;
    }
  });
  return membersToMap;
}
