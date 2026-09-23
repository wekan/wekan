'use strict';

// Meteor consumes an email code with an update filtered by emails.address and
// a positional emails.$ write. Some database backends can read that selector
// but silently match no documents on update. Never issue a session while the
// already-validated code remains reusable. This also consumes username/id codes.
// On MongoDB the upstream handler has already removed the record, so no extra
// write is needed. Use the snapshot token as a compare-and-set condition: a
// concurrent login or a newly requested code must not be consumed by this one.
async function consumePasswordlessToken(user, selector, collection) {
  const token = user?.services?.passwordless?.token;
  if (!token) return true;
  const update = { $unset: { 'services.passwordless': '' } };
  if (typeof selector?.email === 'string') {
    const index = (user.emails || []).findIndex(e => e.address === selector.email);
    if (index < 0) return false;
    update.$set = { [`emails.${index}.verified`]: true };
  }
  const result = await collection.updateOne({
    _id: user._id,
    'services.passwordless.token': token,
  }, update);
  return result.modifiedCount === 1;
}

module.exports = { consumePasswordlessToken };
