import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

// #6457: Replace the default accounts-base "resume" login handler.
//
// The upstream handler projects a single array element with the positional
// operator:
//
//   Meteor.users.findOneAsync(
//     { 'services.resume.loginTokens.hashedToken': hashedToken },
//     { fields: { 'services.resume.loginTokens.$': 1 } })
//
// FerretDB rejects that find with
//
//   Executor error during find command :: caused by :: positional operator
//   '.$' couldn't find a matching element in the array   (code 51246)
//
// Resume is how every already-logged-in browser re-authenticates on page load
// and on every DDP reconnect, so the throw logs users out, the client retries
// the connection, and the retry loop pins the database CPU — the board looks
// broken after migrating to FerretDB.
//
// The whole loginTokens array is projected instead and the matching token is
// picked in JS. Upstream already does exactly this in its own $or fallback
// query ("Cannot use ...loginTokens.$ positional operator with $or query"), so
// the array is known to be small enough to fetch. Behaviour is otherwise
// unchanged, including looking up the hashed token on its own first so the
// unhashed token is not sent to the database unless it has to be.
async function resumeLoginHandler(options) {
  if (!options.resume) return undefined;

  check(options.resume, String);

  const hashedToken = Accounts._hashLoginToken(options.resume);
  const fields = { fields: { 'services.resume.loginTokens': 1 } };

  let user = await Meteor.users.findOneAsync(
    { 'services.resume.loginTokens.hashedToken': hashedToken },
    fields,
  );

  if (!user) {
    // The token may still be stored in the old unhashed style, or another
    // connection logging in at the same time may have just converted it.
    user = await Meteor.users.findOneAsync(
      {
        $or: [
          { 'services.resume.loginTokens.hashedToken': hashedToken },
          { 'services.resume.loginTokens.token': options.resume },
        ],
      },
      fields,
    );
  }

  const loggedOut = () => ({
    error: new Meteor.Error(
      403,
      "You've been logged out by the server. Please log in again.",
    ),
  });

  if (!user) return loggedOut();

  const loginTokens = user.services?.resume?.loginTokens || [];

  // The token is either { hashedToken, when } or the old { token, when }.
  let oldUnhashedStyleToken = false;
  let token = loginTokens.find(each => each.hashedToken === hashedToken);
  if (!token) {
    token = loginTokens.find(each => each.token === options.resume);
    oldUnhashedStyleToken = true;
  }

  // The selector matched but the array does not contain the token, so it was
  // removed between the two. Upstream throws on `token.when` here instead.
  if (!token) return loggedOut();

  const tokenExpires = Accounts._tokenExpiration(token.when);
  if (new Date() >= tokenExpires) {
    return {
      userId: user._id,
      error: new Meteor.Error(403, 'Your session has expired. Please log in again.'),
    };
  }

  if (oldUnhashedStyleToken) {
    // Add the hashed token only while the unhashed one still exists, so a token
    // deleted in the meantime is not resurrected. $addToSet avoids an index
    // error if another connection already inserted the hashed token.
    await Meteor.users.updateAsync(
      {
        _id: user._id,
        'services.resume.loginTokens.token': options.resume,
      },
      {
        $addToSet: {
          'services.resume.loginTokens': { hashedToken, when: token.when },
        },
      },
    );

    // Remove the old token only after adding the new one, so a connection
    // logging in in between still finds a token to log in with.
    await Meteor.users.updateAsync(user._id, {
      $pull: { 'services.resume.loginTokens': { token: options.resume } },
    });
  }

  return {
    userId: user._id,
    stampedLoginToken: { token: options.resume, when: token.when },
  };
}

// accounts-base registers its "resume" handler in the AccountsServer
// constructor, so it is already present here. Register the replacement (which
// wraps it the same way accounts-base does) and move it into the slot the
// default one occupied, so login handler order stays as it was.
const handlers = Accounts._loginHandlers;
const defaultResumeIndex = handlers.findIndex(each => each.name === 'resume');

Accounts.registerLoginHandler('resume', resumeLoginHandler);

if (defaultResumeIndex >= 0) {
  handlers[defaultResumeIndex] = handlers.pop();
}
