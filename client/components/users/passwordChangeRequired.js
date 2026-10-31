import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// PASSWORD_MIN_LENGTH: after signing in, ask whether this account must change
// a password shorter than the minimum, and if so show nothing but the Change
// Password form (passwordChangeRequired.jade). The server asks the question
// (server/passwordChangeRequired.js); config/accounts.js tells it when the
// password just typed was too short. Changing a password signs every session
// out, so the account then signs in again, with the new password.
let overlay = null;

function closeOverlay() {
  if (!overlay) return;
  Blaze.remove(overlay.view);
  overlay.node.remove();
  overlay = null;
}

function openOverlay(min) {
  if (overlay) return;
  const node = document.createElement('div');
  document.body.appendChild(node);
  overlay = { node, view: Blaze.renderWithData(Template.passwordChangeRequired, { min }, node) };
}

Template.passwordChangeRequired.events({
  'click .js-password-change-required-logout'() {
    Meteor.logout(() => closeOverlay());
  },
});

export function checkPasswordChangeRequirement() {
  const userId = Meteor.userId();
  if (!userId) return;
  Meteor.call('getPasswordChangeRequirement', (error, result) => {
    if (error || !result || Meteor.userId() !== userId) return;
    if (result.required) openOverlay(result.minLength);
  });
}

// A changed password signs this session out too (server/passwordChangeRequired.js).
// The server closes the connection as it removes the token, so the answer to
// the change - and useraccounts' onSubmitHook - may never arrive; being signed
// out soon after submitting a change is the answer, and the next stop is the
// sign-in page, from Member Settings and from this overlay alike.
const SIGN_OUT_WAIT_MS = 2 * 60 * 1000;
let changeSubmittedAt = 0;
document.addEventListener('submit', event => {
  const form = event.target;
  if (form && form.id === 'at-pwd-form' && form.querySelector('#at-field-current_password')) {
    changeSubmittedAt = Date.now();
  }
}, true);

Meteor.startup(() => {
  let askedFor = null;
  Tracker.autorun(() => {
    const userId = Meteor.userId();
    if (!userId) {
      askedFor = null;
      const changed = Date.now() - changeSubmittedAt < SIGN_OUT_WAIT_MS;
      if (overlay || changed) {
        // The change signed every session out: sign in with the new password.
        changeSubmittedAt = 0;
        closeOverlay();
        Popup.close?.();
        FlowRouter.go('atSignIn');
      }
      return;
    }
    if (askedFor === userId) return;
    askedFor = userId;
    Tracker.nonreactive(checkPasswordChangeRequirement);
  });
});
