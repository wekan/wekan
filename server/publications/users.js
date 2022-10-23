Meteor.publish('user-miniprofile', function (usernames) {
  check(usernames, Array);

  // eslint-disable-next-line no-console
  // console.log('usernames:', usernames);
  return Users.find(
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
  );
});

Meteor.publish('user-admin', function () {
  return Meteor.users.find(this.userId, {
    fields: {
      isAdmin: 1,
      teams: 1,
      orgs: 1,
      authenticationMethod: 1,
    },
  });
});

Meteor.publish('user-authenticationMethod', function (match) {
  check(match, String);
  return Users.find(
    { $or: [{ _id: match }, { email: match }, { username: match }] },
    {
      fields: {
        authenticationMethod: 1,
        teams: 1,
        orgs: 1,
      },
    },
  );
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

  if (process.env.WEKAN_METRICS_ACCEPTED_IP_ADDRESS !== '') {
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
    //   let lstOfUserThatWasConnectedToThisSocket = Users.find({
    //     lastconnectedSocketId: connection.id,
    //   }).fetch();
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
      (socket) =>
        //console.log('meteor session', socket._meteorSession.userId),
        socket !== undefined &&
        socket._meteorSession?.userId !== null &&
        Users.update(socket._meteorSession.userId, {
          $set: {
            lastConnectionDate: new Date(),
          },
        }),
      );
    });
  }
}
