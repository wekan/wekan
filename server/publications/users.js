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
        socket._meteorSession?.userId !== null &&
        Users.update(socket._meteorSession.userId, {
          $set: {
            lastConnectionDate: new Date(),
          },
        }),
    );
  });
}
