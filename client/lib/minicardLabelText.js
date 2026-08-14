import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';

// "Hide minicard label text" - the labels on a minicard as coloured bars
// instead of coloured words.
//
// It is a PERSONAL setting, not a board one: it is stored on the user's profile
// when there is a user, and in this browser's localStorage when there is not,
// so it works for somebody reading a public board while logged out. That is why
// it is not one of the board's Card Settings checkboxes, and why it is offered
// to everybody rather than to board admins - it changes nothing for anyone else.
//
// It used to be written out three times: the sidebar had a helper and a
// handler, and the minicard had its own copy of each - and the minicard's copy
// only ever wrote localStorage, so a logged-in user toggling it from there set
// something nothing reads. One module, read and write, is what keeps the two
// halves in step.
export function hiddenMinicardLabelText() {
  const currentUser = ReactiveCache.getCurrentUser();
  if (currentUser) {
    return Boolean((currentUser.profile || {}).hiddenMinicardLabelText);
  }
  return Boolean(window.localStorage.getItem('hiddenMinicardLabelText'));
}

export function toggleMinicardLabelText() {
  const currentUser = ReactiveCache.getCurrentUser();
  if (currentUser) {
    // The profile is reactive, so the board redraws by itself.
    Meteor.call('toggleMinicardLabelText');
    return;
  }
  // localStorage is not, so the page has to be read again for the change to
  // show. Only the logged-OUT half pays that.
  if (window.localStorage.getItem('hiddenMinicardLabelText')) {
    window.localStorage.removeItem('hiddenMinicardLabelText');
  } else {
    window.localStorage.setItem('hiddenMinicardLabelText', 'true');
  }
  location.reload();
}
