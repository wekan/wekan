import AccessibilitySettings from '/models/accessibilitySettings';

AccessibilitySettings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});
