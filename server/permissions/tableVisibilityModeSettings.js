import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';

TableVisibilityModeSettings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});
