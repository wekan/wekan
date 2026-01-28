// Native replacement for mquandalle:autofocus package
// Handles autofocus attribute in dynamically rendered Blaze templates
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

// Use MutationObserver to watch for elements with autofocus attribute
Meteor.startup(() => {
  // Function to focus autofocus elements
  const focusAutofocusElements = () => {
    const elements = document.querySelectorAll('[autofocus]');
    if (elements.length > 0) {
      // Focus the last one (most recently added)
      const el = elements[elements.length - 1];
      if (el && typeof el.focus === 'function' && document.activeElement !== el) {
        setTimeout(() => {
          el.focus();
          // For textareas and text inputs, also select the content if it exists
          if ((el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) && el.value) {
            el.select();
          }
        }, 50);
      }
    }
  };

  // Watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldFocus = false;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.hasAttribute && node.hasAttribute('autofocus')) {
            shouldFocus = true;
          } else if (node.querySelector) {
            const autofocusChild = node.querySelector('[autofocus]');
            if (autofocusChild) {
              shouldFocus = true;
            }
          }
        }
      });
    });
    if (shouldFocus) {
      Tracker.afterFlush(focusAutofocusElements);
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also handle initial autofocus elements
  Tracker.afterFlush(focusAutofocusElements);
});
