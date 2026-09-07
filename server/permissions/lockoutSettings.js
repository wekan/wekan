import LockoutSettings from '/models/lockoutSettings';

LockoutSettings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});
