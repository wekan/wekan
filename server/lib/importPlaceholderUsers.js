// Placeholder users for the people of an imported file who were not mapped to
// an existing user (models/lib/importMembersMode.js): one account per person
// that cannot log in, is inactive and holds no secrets, carrying the original
// username and name - so the board keeps who did what - and the name in
// importUsernames, where a board admin maps it to a real user later. The same
// placeholders Trello and WeKan imports make (#6506), for every source.
const { Random } = require('meteor/random');

async function uniqueUsername(base) {
  const name = String(base || '').trim().replace(/\s+/g, '-').slice(0, 60) || 'imported';
  let candidate = name;
  for (let n = 1; await Meteor.users.findOneAsync({ username: candidate }, { fields: { _id: 1 } }); n += 1) {
    candidate = `${name}-${n}`;
  }
  return candidate;
}

// people: [{ key, name }]; `mapping` is the creator's members mapping, which
// gets an entry for each placeholder made. Returns the placeholders' ids.
async function createImportPlaceholders(people, mapping, { source } = {}) {
  const Users = Meteor.users;
  const made = [];
  for (const person of people || []) {
    if (!person || !person.key || mapping[person.key]) continue;
    try {
      const _id = Random.id();
      // .direct bypasses the after.insert hooks (identity sync, the
      // registration/invitation gate) that would reject a non-account.
      await Users.direct.insertAsync({
        _id,
        username: await uniqueUsername(person.name || person.key),
        profile: { fullname: person.name || person.key, initials: String(person.name || person.key).slice(0, 2).toUpperCase() },
        authenticationMethod: 'imported',
        loginDisabled: true,
        isActive: false,
        importUsernames: [person.key],
        importedFrom: source || null,
        importedAt: new Date(),
        createdAt: new Date(),
        services: {},
      });
      mapping[person.key] = _id;
      made.push(_id);
    } catch (e) {
      // Best effort: a person who cannot be made a placeholder stays text.
      if (process.env.DEBUG === 'true') console.warn('import placeholder user:', person.key, e && e.message);
    }
  }
  return made;
}

module.exports = { createImportPlaceholders };
