// Native replacement for mquandalle:autofocus package
// Handles autofocus attribute in dynamically rendered Blaze templates
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

const { autofocusTarget } = require('./autofocusDecision');

// Use MutationObserver to watch for elements with autofocus attribute
Meteor.startup(() => {
  // Focus the newest of the [autofocus] elements just added - decided when
  // the focus happens, 50 ms later, not before: in between the user may have
  // gone on typing in another field, and focusing and selecting then replaced
  // what they had pasted (client/lib/autofocusDecision.js).
  const focusAdded = added => {
    setTimeout(() => {
      const el = autofocusTarget(added, document.activeElement, document.body);
      if (!el) return;
      el.focus();
      // For textareas and text inputs, also select the content if it exists
      if ((el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) && el.value) {
        el.select();
      }
    }, 50);
  };

  // Watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    const added = [];
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.hasAttribute && node.hasAttribute('autofocus')) {
            added.push(node);
          } else if (node.querySelectorAll) {
            added.push(...node.querySelectorAll('[autofocus]'));
          }
        }
      });
    });
    if (added.length) {
      Tracker.afterFlush(() => focusAdded(added));
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also handle initial autofocus elements
  Tracker.afterFlush(() => focusAdded([...document.querySelectorAll('[autofocus]')]));
});
