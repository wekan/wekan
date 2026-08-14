import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { fontFamilyValue, fontSizeValue, fontScaleValue, colorValue } from '/models/lib/uiFonts';

// #4759: apply the user's chosen UI font AND font-size preset to the whole UI by
// setting CSS variables on :root and toggling marker classes on <body> (uiFont.css
// consumes them). fontFamilyValue()/fontSizeValue() return '' for anything not on the
// curated whitelist/presets, so only known, safe values can ever reach the DOM — the
// saved values are also validated server-side. Unset => nothing applied (defaults).

Meteor.startup(() => {
  // #6587: the font-size preset has to land on the ROOT element, not on <body>.
  // A size on <body> is inherited only by children that ask for a relative size,
  // and it leaves `rem` — which is measured against the root — untouched. So a
  // board's type, which states its sizes in rem so it does not change with the
  // window, ignored the setting completely: "The font size setting in the user
  // menu (Settings -> Font Size) has no effect on mini cards, while it correctly
  // applies to other UI elements."
  //
  // Only ONE element may carry it. With the size on both html and body, a 130%
  // preset would compound to 169% for anything relative to body, so this marks
  // the root for font-size and <body> for everything else (the font-family and
  // colour rules match on body, and form controls are listed there explicitly).
  const ROOT_CLASSES = new Set(['has-ui-font-size']);
  function toggle(varName, className, value) {
    try {
      const el = ROOT_CLASSES.has(className) ? document.documentElement : document.body;
      if (value) {
        document.documentElement.style.setProperty(varName, value);
        if (className) el.classList.add(className);
      } else {
        document.documentElement.style.removeProperty(varName);
        if (className) el.classList.remove(className);
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
    // ...and the same preset as a number, which is what actually moves most of
    // the UI: the percentage above only reaches text written in a relative unit,
    // and WeKan writes most of its sizes in px. Every px font-size and
    // line-height in the stylesheets is multiplied by this variable
    // (uiFont.css), so one preset moves the whole interface instead of the part
    // of it that happened to be written in rem. No class goes with it - a
    // variable that is not set falls back to 1 in the calc itself.
    toggle('--wekan-ui-font-scale', null, fontScaleValue(profile.uiFontSize));
    toggle('--wekan-ui-text-color', 'has-ui-text-color', colorValue(profile.uiTextColor));
    // There was a `--wekan-ui-bg-color` here, for "text background color". It is
    // removed: a colour behind the text needs elements to sit on, and there is no
    // set of them that looks right - on the boxes it painted the page, on the text
    // carriers it striped headings and menu rows with bands. Nothing reads
    // `profile.uiTextBgColor` any more, and setUiColors unsets it, so a value
    // stored before this is gone rather than dormant.
  });
});
