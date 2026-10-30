// LOGOUT_IDLE_MINUTES: tell the server, at most once a minute, that the user
// did something here - a key press, a click, a touch, a scroll - so a session
// in use is not signed out as idle (models/lib/idleLogout.js). Nothing is sent
// while the page only sits open, and nothing at all when the limit is off.

const { TOUCH_INTERVAL_MS } = require('../../models/lib/idleLogout');

const EVENTS = ['keydown', 'mousedown', 'touchstart', 'wheel', 'scroll'];

// target: where to listen (document); touch(): report; now(): clock.
function createIdleActivityReporter({ target, touch, now = () => Date.now(), interval = TOUCH_INTERVAL_MS }) {
  let last = 0;
  let listening = false;
  function onActivity() {
    const t = now();
    if (t - last < interval) return;
    last = t;
    touch();
  }
  return {
    start() {
      if (listening) return;
      listening = true;
      last = now(); // signing in was the activity that started this
      for (const name of EVENTS) target.addEventListener(name, onActivity, { capture: true, passive: true });
    },
    stop() {
      if (!listening) return;
      listening = false;
      for (const name of EVENTS) target.removeEventListener(name, onActivity, { capture: true });
    },
    onActivity,
  };
}

module.exports = { createIdleActivityReporter, EVENTS };
