import { Meteor } from 'meteor/meteor';

// #6691: this also follows this.setUserId() during admin impersonation. The
// preference belongs to the connection's user, not every board member.
Meteor.publish('userBoardView', async function() {
  if (!this.userId) return this.ready();
  // DDP merges only top-level fields. A narrow profile publication can win
  // over the full account profile after impersonation, hiding boardView even
  // when another publication supplies it. Publish this one private preference
  // under its own top-level field; do not compete for the profile object.
  let stopped = false;
  let handle;
  this.onStop(() => {
    stopped = true;
    if (handle) handle.stop();
  });
  handle = await Meteor.users.find({ _id: this.userId }, {
    fields: { 'profile.boardView': 1 },
  }).observeChangesAsync({
    added: (id, fields) => {
      if (!stopped) this.added('users', id, { boardViewPreference: fields.profile?.boardView });
    },
    changed: (id, fields) => {
      if (!stopped) this.changed('users', id, { boardViewPreference: fields.profile?.boardView });
    },
    removed: id => {
      if (!stopped) this.removed('users', id);
    },
  });
  if (stopped) handle.stop();
  else this.ready();
});
