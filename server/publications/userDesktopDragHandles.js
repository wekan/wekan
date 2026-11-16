import { Meteor } from 'meteor/meteor';

// #6919: DDP merges only top-level fields. This publication used to send the
// current user `{ profile: { showDesktopDragHandles } }`; when it ran before
// the accounts publication of the whole profile (Meteor re-runs named
// subscriptions first on every login, a reconnect included), that one-field
// profile won, and the client's profile stayed `{}` until the page was
// reloaded. Every preference read from it went back to its default - a
// checklist folded on a minicard unfolded half a second later - and #6691 had
// found the same for the board view. So, like userBoardView, the preference is
// published under a top-level field of its own and never competes for
// `profile`. tests/noNarrowProfileForCurrentUser6919.test.cjs.
Meteor.publish('userDesktopDragHandles', async function() {
  if (!this.userId) return this.ready();
  let stopped = false;
  let handle;
  this.onStop(() => {
    stopped = true;
    if (handle) handle.stop();
  });
  const preference = fields => {
    const value = fields.profile?.showDesktopDragHandles;
    return { desktopDragHandlesPreference: typeof value === 'boolean' ? value : null };
  };
  handle = await Meteor.users.find({ _id: this.userId }, {
    fields: { 'profile.showDesktopDragHandles': 1 },
  }).observeChangesAsync({
    added: (id, fields) => {
      if (!stopped) this.added('users', id, preference(fields));
    },
    changed: (id, fields) => {
      if (!stopped && 'profile' in fields) this.changed('users', id, preference(fields));
    },
    removed: id => {
      if (!stopped) this.removed('users', id);
    },
  });
  if (stopped) handle.stop();
  else this.ready();
});
