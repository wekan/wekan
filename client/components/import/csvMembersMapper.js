export function getMembersToMap(data) {
  // we will work on the list itself (an ordered array of objects) when a
  // mapping is done, we add a 'wekan' field to the object representing the
  // imported member

  const membersToMap = [];
  const importedMembers = [];
  let membersIndex;

  for (let i = 0; i < data[0].length; i++) {
    if (data[0][i].toLowerCase() === 'members') {
      membersIndex = i;
    }
  }

  for (let i = 1; i < data.length; i++) {
    if (data[i][membersIndex]) {
      for (const importedMember of data[i][membersIndex].split(' ')) {
        if (importedMember && importedMembers.indexOf(importedMember) === -1) {
          importedMembers.push(importedMember);
        }
      }
    }
  }

  for (let importedMember of importedMembers) {
    importedMember = {
      username: importedMember,
      id: importedMember,
    };
    const wekanUser = Users.findOne({ username: importedMember.username });
    if (wekanUser) importedMember.wekanId = wekanUser._id;
    membersToMap.push(importedMember);
  }

  return membersToMap;
}
