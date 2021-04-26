if (Meteor.isServer) {
  Meteor.startup(() => {
    // Date of 7 days ago
    let lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    presences.remove({ ttl: { $lte: lastWeek } });

    // Create index for serverId that is queried often
    presences._collection._ensureIndex({ serverId: -1 });
  });
}
