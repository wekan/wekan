import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { fontFamilyValue, fontSizeValue, colorValue } from '/models/lib/uiFonts';

// #4759: apply the user's chosen UI font AND font-size preset to the whole UI by
// setting CSS variables on :root and toggling marker classes on <body> (uiFont.css
// consumes them). fontFamilyValue()/fontSizeValue() return '' for anything not on the
// curated whitelist/presets, so only known, safe values can ever reach the DOM — the
// saved values are also validated server-side. Unset => nothing applied (defaults).

Meteor.startup(() => {
  function toggle(varName, className, value) {
    try {
      if (value) {
        document.documentElement.style.setProperty(varName, value);
        document.body.classList.add(className);
      } else {
        document.documentElement.style.removeProperty(varName);
        document.body.classList.remove(className);
      }
    } catch (_) {
      // document not ready in exotic embeddings; ignore.
    }
  }

  Tracker.autorun(() => {
    const user = Meteor.user();
    const profile = (user && user.profile) || {};
    toggle('--wekan-ui-font', 'has-ui-font', fontFamilyValue(profile.uiFont));
    toggle('--wekan-ui-font-size', 'has-ui-font-size', fontSizeValue(profile.uiFontSize));
    toggle('--wekan-ui-text-color', 'has-ui-text-color', colorValue(profile.uiTextColor));
    toggle('--wekan-ui-bg-color', 'has-ui-bg-color', colorValue(profile.uiTextBgColor));
  });
});
