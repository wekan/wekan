import { ReactiveCache } from '/imports/reactiveCache';
import { csvPeopleNames } from '/models/lib/csvPeople';

// The people to map, each matched to a WeKan user of the same username when
// there is one. `rows` are the file's rows, or `names` the usernames the
// server read from an uploaded file (csvUploadPeople).
export function csvMembersFromNames(names) {
  return names.map(username => {
    const member = { username, id: username };
    const wekanUser = ReactiveCache.getUser({ username });
    if (wekanUser) member.wekanId = wekanUser._id;
    return member;
  });
}

export function csvGetMembersToMap(data, columns) {
  return csvMembersFromNames(csvPeopleNames(data, columns));
}
