import { ReactiveCache } from '/imports/reactiveCache';

export async function getMembersToMap(data) {
  // we will work on the list itself (an ordered array of objects) when a
  // mapping is done, we add a 'wekan' field to the object representing the
  // imported member
  const membersToMap = data.members || [];
  const users = data.users || [];
  // auto-map based on username
  const mappable = [];
  for (const importedMember of membersToMap) {
    importedMember.id = importedMember.userId;
    delete importedMember.userId;
    const user = users.filter(user => {
      return user._id === importedMember.id;
    })[0];
    // Skip dangling user references (e.g. a board member whose account was
    // deleted): the export only includes users that still exist, so `user`
    // can be undefined. Dereferencing it would throw and abort the clone.
    if (!user) {
      continue;
    }
    if (user.profile && user.profile.fullname) {
      importedMember.fullName = user.profile.fullname;
    }
    importedMember.username = user.username;
    const wekanUser = await ReactiveCache.getUser({ username: importedMember.username });
    if (wekanUser) {
      importedMember.wekanId = wekanUser._id;
    }
    mappable.push(importedMember);
  }
  return mappable;
}
