import LockoutSettings from '/models/lockoutSettings';
Meteor.publish('lockoutSettings', async function() {
  const user = this.userId && await Meteor.users.findOneAsync(this.userId, {
    fields: { isAdmin: 1 },
  });
  return user?.isAdmin === true ? LockoutSettings.find() : [];
});
