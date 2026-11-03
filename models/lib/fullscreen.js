'use strict';

// Full screen for the whole page, with the unprefixed Fullscreen API and the
// webkit-prefixed one older Safari (and iPadOS Safari before 16.4) has. Pure and
// Meteor-free, the document is passed in, so plain Node tests drive it with a
// fake one.
//
// Where it is NOT available the button must not be drawn at all:
//  - iPhone Safari (and every iPhone browser, they are all WebKit) has the API for
//    video only: document.fullscreenEnabled is false or missing;
//  - a page inside an <iframe> without allowfullscreen (a Sandstorm grain, say) has
//    fullscreenEnabled false;
//  - a very old browser has neither name.
// "Add to Home Screen" (the manifest says display: standalone) is the way there.

function isSupported(doc) {
  if (!doc) return false;
  return doc.fullscreenEnabled === true || doc.webkitFullscreenEnabled === true;
}

function currentElement(doc) {
  return (doc && (doc.fullscreenElement || doc.webkitFullscreenElement)) || null;
}

function isFullscreen(doc) {
  return currentElement(doc) !== null;
}

// Enters full screen, or leaves it. Resolves true when the page is in full screen
// afterwards, false when it is not; it never rejects - a browser that refuses (no
// user gesture, a policy) is an answer, not an error to show. The request has to
// come from a click or a key press, which is what the button is.
async function toggle(doc) {
  if (!isSupported(doc)) return false;

  try {
    if (isFullscreen(doc)) {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
      if (exit) await exit.call(doc);
    } else {
      const el = doc.documentElement;
      const request = el && (el.requestFullscreen || el.webkitRequestFullscreen);
      if (request) await request.call(el);
    }
  } catch (e) {
    // refused: the state below says what happened
  }

  return isFullscreen(doc);
}

// The events a change arrives on, both spellings.
const CHANGE_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'];

module.exports = { isSupported, isFullscreen, toggle, CHANGE_EVENTS };
