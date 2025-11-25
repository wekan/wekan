Meteor.startup(() => {
  // Unicode pictographic ranges (emoji, symbols, etc.)
  // Only greyscale these icons:
  const greyscaleIcons = [
    '🔼', '❌', '🏷️', '📅', '📥', '🚀', '👤', '👥', '✍️', '📋', '✏️', '🌐', '📎', '📝', '📋', '📜', '🏠', '🔒', '🔕', '🃏',
    '⏰', '🛒', '🔢', '✅', '❌', '👁️', '👍', '📋', '🕐', '🎨',
    '📤', '⬆️', '⬇️', '➡️', '📦',
    '⬅️', '↕️', '🔽', '🔍', '▼', '🏊',
    '🔔', '⚙️', '🖼️', '🔑', '🚪', '◀️', '⌨️', '👥', '🏷️', '✅', '🚫'
  ];

  function wrapUnicodeIcons(root) {
    try {
      // Exclude avatar initials from wrapping
      const excludeSelector = '.header-user-bar-avatar, .avatar-initials';

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node || !node.nodeValue) continue;
        const parent = node.parentNode;
        if (!parent) continue;
        if (parent.closest && (parent.closest('.unicode-icon') || parent.closest(excludeSelector))) continue;
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') continue;
        // Only wrap if the text node is a single greyscale icon (no other text)
        const txt = node.nodeValue.trim();
        if (greyscaleIcons.includes(txt)) {
          const span = document.createElement('span');
          span.className = 'unicode-icon';
          span.textContent = txt;
          parent.replaceChild(span, node);
        }
      }

      // Also wrap direct unicode icon children (e.g., <a>🎨</a>), including Member Settings and card details, but not avatar initials
      const elements = root.querySelectorAll('*:not(script):not(style):not(.header-user-bar-avatar):not(.avatar-initials)');
      elements.forEach((el) => {
        el.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const txt = child.nodeValue.trim();
            if (greyscaleIcons.includes(txt)) {
              const span = document.createElement('span');
              span.className = 'unicode-icon';
              span.textContent = txt;
              el.replaceChild(span, child);
            }
          }
        });
      });
    } catch (e) {
      // ignore
    }
  }
  function unwrap() {
    document.querySelectorAll('span.unicode-icon').forEach((span) => {
      const txt = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(txt, span);
    });
  }

  function runWrapAfterDOM() {
    Meteor.defer(() => {
      setTimeout(() => wrapUnicodeIcons(document.body), 100);
    });
    // Also rerun after Blaze renders popups
    const observer = new MutationObserver(() => {
      const user = Meteor.user();
      if (user && user.profile && user.profile.GreyIcons) {
        wrapUnicodeIcons(document.body);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  Tracker.autorun(() => {
    const user = Meteor.user();
    if (user && user.profile && user.profile.GreyIcons) {
      runWrapAfterDOM();
    } else {
      Meteor.defer(() => unwrap());
    }
  });
});
