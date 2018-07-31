export function getMembersToMap(data) {
  // we will work on the list itself (an ordered array of objects) when a
  // mapping is done, we add a 'wekan' field to the object representing the
  // imported member

  // remove teams
  const membersToMap = data.members.filter((importedMember) => {
    return importedMember.isTeam !== true;
  });
  const users = data.users;
  // auto-map based on username
  membersToMap.forEach((importedMember) => {
    importedMember.id = importedMember.userId;
    delete importedMember.userId;
    const user = users.filter((user) => {
      return user._id === importedMember.id;
    })[0];
    if (user.profile && user.profile.fullname) {
      importedMember.fullName = user.profile.fullname;
    }
    importedMember.username = user.username;
    const wekanUser = Users.findOne({ username: importedMember.username });
    if (wekanUser) {
      importedMember.wekanId = wekanUser._id;
    }
  });
  return membersToMap;
}
