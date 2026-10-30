import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

// REQUIRE_2FA: after signing in, ask whether this account must still set up
// two-factor authentication, and if so show nothing but the set-up
// (twoFactorRequired.jade). accounts-2fa publishes the account's own
// services.twoFactorAuthentication.type, so finishing the set-up is seen at
// once; the page then reloads, because every subscription the server left
// empty meanwhile has to be made again.
let overlay = null;

function closeOverlay() {
  if (!overlay) return;
  Blaze.remove(overlay.view);
  overlay.node.remove();
  overlay = null;
}

function openOverlay() {
  if (overlay) return;
  const node = document.createElement('div');
  document.body.appendChild(node);
  overlay = { node, view: Blaze.render(Template.twoFactorRequired, node) };
}

Template.twoFactorRequired.events({
  'click .js-two-factor-required-logout'() {
    Meteor.logout(() => closeOverlay());
  },
});

Meteor.startup(() => {
  let askedFor = null;
  Tracker.autorun(() => {
    const userId = Meteor.userId();
    const user = Meteor.user({ fields: { 'services.twoFactorAuthentication.type': 1 } });
    if (!userId) {
      askedFor = null;
      closeOverlay();
      return;
    }
    const enabled = user?.services?.twoFactorAuthentication?.type === 'otp';
    if (overlay && enabled) {
      window.location.reload();
      return;
    }
    if (askedFor === userId) return;
    askedFor = userId;
    Meteor.call('getTwoFactorRequirement', (error, result) => {
      if (error || !result || Meteor.userId() !== userId) return;
      if (result.required && !result.enabled) openOverlay();
    });
  });
});
