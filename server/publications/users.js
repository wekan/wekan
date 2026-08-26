import Users from '/models/users';
import { ReactiveCache } from '/imports/reactiveCache';
import escapeForRegex from 'escape-string-regexp';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { tripCanary } from '/server/lib/canary';

DDPRateLimiter.addRule(
  { type: 'subscription', name: 'user-search' },
  20,
  10 * 1000,
);

Meteor.publish('user-miniprofile', async function (usernames) {
  check(usernames, Array);

  if (!this.userId) {
    tripCanary('user.miniprofile-without-login', {
      ip: this.connection && this.connection.clientAddress,
    });
    return this.ready();
  }

  // eslint-disable-next-line no-console
  // console.log('usernames:', usernames);
  const ret = await ReactiveCache.getUsers(
    {
      $or: [
        { username: { $in: usernames } },
        { importUsernames: { $in: usernames } },
      ],
    },
    {
      fields: {
        ...Users.safeFields,
        importUsernames: 1,
      },
    },
    true,
  );
  return ret;
});

Meteor.publish('user-admin', function () {
  const ret = Meteor.users.find(this.userId, {
    fields: {
      isAdmin: 1,
      teams: 1,
      orgs: 1,
      authenticationMethod: 1,
    },
  });
  return ret;
});

Meteor.publish('user-authenticationMethod', async function (match) {
  check(match, String);
  if (!this.userId) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authn.authentication-method',
        action: 'blocked',
        source: 'user-authenticationMethod',
        ip: this.connection && this.connection.clientAddress,
        detail: 'unauthenticated user authentication metadata subscription',
      });
    } catch (e) { /* logging must never break the guard */ }
    return this.ready();
  }
  const ret = await ReactiveCache.getUsers(
    { $or: [{ _id: match }, { email: match }, { username: match }] },
    {
      fields: {
        authenticationMethod: 1,
        teams: 1,
        orgs: 1,
      },
    },
    true,
  );
  return ret;
});

// Secure user search publication for board sharing
Meteor.publish('user-search', async function (searchTerm) {
  check(searchTerm, String);

  // Only allow logged-in users to search for other users
  if (!this.userId) {
    return this.ready();
  }

  // Create a regex for case-insensitive search
  const searchRegex = new RegExp(escapeForRegex(searchTerm), 'i');

  // This general publication deliberately exposes only public identity fields.
  // Board-authorized email lookup is handled by the bounded searchUsers method.
  const ret = await ReactiveCache.getUsers(
    {
      $or: [
        { username: searchRegex },
        { 'profile.fullname': searchRegex },
      ],
    },
    {
      fields: {
        _id: 1,
        username: 1,
        'profile.fullname': 1,
        'profile.avatarUrl': 1,
        'profile.initials': 1,
      },
    },
    true,
  );

  return ret;
});

// update last connection date and last connection average time (in seconds) for a user
// function UpdateLastConnectionDateAndLastConnectionAverageTime(lstUsers) {
//   let lastConnectionAverageTime;
//   lstUsers.forEach((currentUser) => {
//     lastConnectionAverageTime =
//       currentUser.lastConnectionAverageTimeInSecs !== undefined
//         ? currentUser.lastConnectionAverageTimeInSecs
//         : 0;
//     lastConnectionAverageTime =
//       currentUser.lastConnectionDate !== undefined
//         ? ((new Date().getTime() - currentUser.lastConnectionDate.getTime()) /
//             1000 +
//             lastConnectionAverageTime) /
//           2
//         : 0;

//     Users.update(currentUser._id, {
//       $set: {
//         lastConnectionDate: new Date(),
//         lastConnectionAverageTimeInSecs: parseInt(lastConnectionAverageTime),
//       },
//     });
//   });
// }

if (Meteor.isServer) {

/* Got this error, so using this code only when metrics enabled with process.env... below
I20221023-09:15:09.599(3)? Exception in onConnection callback: TypeError: Cannot read property 'userId' of null
I20221023-09:15:09.601(3)?     at server/publications/users.js:106:44
I20221023-09:15:09.601(3)?     at Array.forEach (<anonymous>)
I20221023-09:15:09.601(3)?     at server/publications/users.js:102:46
I20221023-09:15:09.601(3)?     at runWithEnvironment (packages/meteor.js:1347:24)
I20221023-09:15:09.601(3)?     at packages/meteor.js:1360:14
I20221023-09:15:09.601(3)?     at packages/ddp-server/livedata_server.js:1614:9
I20221023-09:15:09.601(3)?     at Hook.forEach (packages/callback-hook/hook.js:110:15)
I20221023-09:15:09.601(3)?     at Hook.each (packages/callback-hook/hook.js:122:17)
I20221023-09:15:09.602(3)?     at Server._handleConnect (packages/ddp-server/livedata_server.js:1612:27)
I20221023-09:15:09.602(3)?     at packages/ddp-server/livedata_server.js:1496:18
*/

  if (process.env.WEKAN_METRICS_ACCEPTED_IP_ADDRESS) {
/*
    Meteor.onConnection(function (connection) {
    // console.log(
    //   'Meteor.server.stream_server.open_sockets',
    //   Meteor.server.stream_server.open_sockets,
    // );
    //console.log('connection.Id on connection...', connection.id);
    // connection.onClose(() => {
    //   console.log('connection.Id on close...', connection.id);
    //   // Get all user that were connected to this socket
    //   // And update last connection date and last connection average time (in seconds) for each user
    //   let lstOfUserThatWasConnectedToThisSocket = ReactiveCache.getUsers({
    //     lastconnectedSocketId: connection.id,
    //   }, {}, true).fetch();
    //   if (
    //     lstOfUserThatWasConnectedToThisSocket !== undefined &&
    //     lstOfUserThatWasConnectedToThisSocket.length > 0
    //   ) {
    //     console.log({ lstOfUserThatWasConnectedToThisSocket });
    //     UpdateLastConnectionDateAndLastConnectionAverageTime(
    //       lstOfUserThatWasConnectedToThisSocket,
    //     );
    //   }
    // });

    // Meteor.server.stream_server.open_sockets.forEach((socket) =>
    //   console.log('meteor session', socket._meteorSession.userId),
    // );

    // update last connected user date (needed for one of the KPI)
    Meteor.server.stream_server.open_sockets.forEach(
      (socket) => {
        if (socket?._meteorSession?.userId) {
          Users.updateAsync(socket._meteorSession.userId, {
            $set: {
              lastConnectionDate: new Date(),
            },
          }).catch(error => {
            if (process.env.DEBUG === 'true') {
              console.error('Failed to update lastConnectionDate:', error);
            }
          });
        }
      });
    });
*/
  }
}
