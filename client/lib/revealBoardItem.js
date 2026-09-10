import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import {
  REVEAL_KINDS,
  REVEAL_TARGETS,
  HASH_REVEAL_KINDS,
  revealElementId,
} from '/models/lib/revealBoardItem';

// Bring the swimlane or list a link named into view.
//
// The route names it in a Session value (config/router.js) because the route
// runs before the board has rendered, and on a board that is already open it
// runs without re-creating anything - so there is nothing to scroll at the
// moment the address changes.
//
// This waits for the element instead of assuming it. Swimlanes and lists arrive
// as their subscriptions do, and a board with many of them renders in more than
// one pass, so a single look on the next tick finds nothing on a cold load. It
// retries on a short interval and gives up after a few seconds rather than
// spinning forever: a link to a list that was archived or deleted names an
// element that is never going to exist, and the board is still the right place
// to have landed.
//
// The Session value is cleared as soon as it is acted on - or given up on - so
// it is a one-shot instruction about the address you followed, not a standing
// order that re-scrolls the board every time something re-renders.
//
// docs/Features/Page/Board-Item-Links.md

const RETRY_MS = 100;
const GIVE_UP_MS = 8000;

function scrollIntoView(element) {
  if (!element) return;
  // `center` on both axes: a swimlane is a row and a list is a column, so one
  // of the two is always the axis that matters and neither kind knows which.
  if (typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  }
  // A brief highlight, because a scroll that lands mid-board gives no sign of
  // WHICH of the things on screen the link was about. The class removes itself;
  // the animation is in the stylesheet.
  element.classList.add('is-revealed');
  setTimeout(() => element.classList.remove('is-revealed'), 2000);
}

// Watch one kind. Returns the Tracker computation so a caller can stop it.
function watchKind(kind) {
  const { sessionKey } = REVEAL_TARGETS[kind];
  let timer = null;
  const stopTimer = () => {
    if (timer) { clearInterval(timer); timer = null; }
  };

  const computation = Tracker.autorun(() => {
    const id = Session.get(sessionKey);
    stopTimer();
    const elementId = revealElementId(kind, id);
    if (!elementId) return;

    const started = Date.now();
    const attempt = () => {
      const element = document.getElementById(elementId);
      if (element) {
        stopTimer();
        // Cleared first: scrollIntoView can re-enter this autorun through the
        // reactive Session read, and clearing before scrolling makes the second
        // pass a no-op rather than a second scroll.
        Session.set(sessionKey, null);
        scrollIntoView(element);
        return;
      }
      if (Date.now() - started > GIVE_UP_MS) {
        // Archived, deleted, or on a board this user cannot see all of. The
        // board is still the right place to have landed, so this stops quietly.
        stopTimer();
        Session.set(sessionKey, null);
      }
    };

    // Once now - on a board that is already open the element is already there,
    // and waiting a tick to find it makes the jump visibly late.
    attempt();
    if (Session.get(sessionKey)) timer = setInterval(attempt, RETRY_MS);
  });

  return { stop() { stopTimer(); computation.stop(); } };
}

// A comment or an activity (issue #4757) has no route of its own - it only
// ever appears inside a card - so its permalink is the card's own URL plus a
// `#comment-<id>` / `#activity-<id>` fragment (built in
// client/components/activities/comments.js and activities.js) instead of a
// route param. This reads that fragment into the same Session keys the
// generic watcher above already polls for, so a comment/activity permalink
// reveals exactly the way a swimlane/list link does.
//
// Read on: a fresh load of a URL that already carries the fragment (the
// fragment is never sent to the server, so nothing but the client can see
// it); the `hashchange` listener below on top of that for a link clicked
// while the card is already open, since neither FlowRouter's `pushState`
// navigation nor a same-page anchor click is guaranteed to re-run this
// function on its own. The permalink click handlers in comments.js/
// activities.js also set the Session value directly, so this is a second,
// redundant path to the same place rather than the only one.
function applyLocationHash() {
  if (typeof window === 'undefined' || !window.location) return;
  const hash = window.location.hash || '';
  HASH_REVEAL_KINDS.forEach(kind => {
    const { sessionKey } = REVEAL_TARGETS[kind];
    const prefix = `#${kind}-`;
    if (hash.indexOf(prefix) === 0) {
      const id = hash.slice(prefix.length);
      if (id) Session.set(sessionKey, id);
    }
  });
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('hashchange', applyLocationHash);
}

// Start watching every kind. Called from the board body once it has rendered.
export function watchBoardItemReveals() {
  // Picks up a fragment that was already in the address when this board body
  // was created (a fresh load, or a card opened by URL).
  applyLocationHash();
  const watchers = REVEAL_KINDS.map(watchKind);
  return { stop() { watchers.forEach(w => w.stop()); } };
}
