Meteor.startup(() => {
  const greyscaleIcons = [
    '🔼', '❌', '🏷️', '📅', '📥', '🚀', '👤', '👥', '✍️', '📋', '✏️', '🌐', '📎', '📝', '📋', '📜', '🏠', '🔒', '🔕', '🃏',
    '⏰', '🛒', '🔢', '✅', '❌', '👁️', '👍', '👎', '📋', '🕐', '🎨',
    '📤', '⬆️', '⬇️', '➡️', '📦',
    '⬅️', '↕️', '🔽', '🔍', '▼', '🏊',
    '🔔', '⚙️', '🖼️', '🔑', '🚪', '◀️', '⌨️', '👥', '🏷️', '✅', '🚫', '☑️', '💬',
    // Mobile/Desktop toggle + calendar
    '📱', '🖥️', '🗓️'
  ];

  const EXCLUDE_SELECTOR = '.header-user-bar-avatar, .avatar-initials, script, style';
  let observer = null;
  let enabled = false;

  function isExcluded(el) {
    if (!el) return true;
    if (el.nodeType === Node.ELEMENT_NODE && (el.matches('script') || el.matches('style'))) return true;
    if (el.closest && el.closest(EXCLUDE_SELECTOR)) return true;
    return false;
  }

  function wrapTextNodeOnce(parent, textNode) {
    if (!parent || !textNode) return;
    if (isExcluded(parent)) return;
    if (parent.closest && parent.closest('.unicode-icon')) return;
    const raw = textNode.nodeValue;
    if (!raw) return;
    const txt = raw.trim();
    // small guard against long text processing
    if (txt.length > 3) return;
    if (!greyscaleIcons.includes(txt)) return;
    const span = document.createElement('span');
    span.className = 'unicode-icon';
    span.textContent = txt;
    parent.replaceChild(span, textNode);
  }

  function wrapSubtree(root) {
    try {
      if (!root) return;
      // Walk only within this subtree for text nodes
      const walker = document.createTreeWalker(
        root.nodeType === Node.ELEMENT_NODE ? root : root.parentNode || document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
            const parent = node.parentNode;
            if (!parent || isExcluded(parent)) return NodeFilter.FILTER_REJECT;
            if (parent.closest && parent.closest('.unicode-icon')) return NodeFilter.FILTER_REJECT;
            const txt = node.nodeValue.trim();
            if (!txt || txt.length > 3) return NodeFilter.FILTER_REJECT;
            return greyscaleIcons.includes(txt) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
          },
        },
        false,
      );
      const toWrap = [];
      while (walker.nextNode()) {
        toWrap.push(walker.currentNode);
      }
      for (const textNode of toWrap) {
        wrapTextNodeOnce(textNode.parentNode, textNode);
      }
    } catch (_) {}
  }

  function processInitial() {
    // Process only frequently used UI containers to avoid full-page walks
    const roots = [document.body].filter(Boolean);
    roots.forEach(wrapSubtree);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      // Batch process only added nodes, ignore attribute/character changes
      for (const m of mutations) {
        if (m.type !== 'childList') continue;
        m.addedNodes && m.addedNodes.forEach((n) => {
          // Process only within the newly added subtree
          wrapSubtree(n);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (observer) {
      try { observer.disconnect(); } catch (_) {}
    }
    observer = null;
  }

  function enableGrey() {
    if (enabled) return;
    enabled = true;
    try { document.body.classList.add('grey-icons-enabled'); } catch (_) {}
    Meteor.defer(processInitial);
    startObserver();
  }

  function disableGrey() {
    if (!enabled) return;
    enabled = false;
    stopObserver();
    try { document.body.classList.remove('grey-icons-enabled'); } catch (_) {}
    // unwrap existing
    document.querySelectorAll('span.unicode-icon').forEach((span) => {
      const txt = document.createTextNode(span.textContent || '');
      if (span.parentNode) span.parentNode.replaceChild(txt, span);
    });
  }

  Tracker.autorun(() => {
    const user = Meteor.user();
    const on = !!(user && user.profile && user.profile.GreyIcons);
    if (on) enableGrey(); else disableGrey();
  });
});
