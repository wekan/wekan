import { ReactiveCache } from '/imports/reactiveCache';

export function wekanGetMembersToMap(data) {
  // we will work on the list itself (an ordered array of objects) when a
  // mapping is done, we add a 'wekan' field to the object representing the
  // imported member
  const membersToMap = data.members || [];
  const users = data.users || [];
  // auto-map based on username
  const mappable = [];
  membersToMap.forEach(importedMember => {
    importedMember.id = importedMember.userId;
    delete importedMember.userId;
    const user = users.filter(user => {
      return user._id === importedMember.id;
    })[0];
    // The exported `users` array only contains users that still exist in the
    // source instance, so a member whose account was deleted (or any other
    // dangling user reference, e.g. from an older export) has no matching
    // user. Skip it instead of dereferencing `undefined`, which would throw
    // and make the whole import fail as "error-json-malformed".
    if (!user) {
      return;
    }
    if (user.profile && user.profile.fullname) {
      importedMember.fullName = user.profile.fullname;
    }
    importedMember.username = user.username;
    const wekanUser = ReactiveCache.getUser({ username: importedMember.username });
    if (wekanUser) {
      importedMember.wekanId = wekanUser._id;
    }
    mappable.push(importedMember);
  });
  return mappable;
}
