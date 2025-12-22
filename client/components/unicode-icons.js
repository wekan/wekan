Meteor.startup(() => {
  const greyscaleIcons = [
    '🔼', '❌', '🏷️', '📅', '📥', '🚀', '👤', '👥', '✍️', '📋', '✏️', '🌐', '📎', '📝', '📋', '📜', '🏠', '🔒', '🔕', '🃏',
    '⏰', '🛒', '🔢', '✅', '❌', '👁️', '👍', '📋', '🕐', '🎨',
    '📤', '⬆️', '⬇️', '➡️', '📦',
    '⬅️', '↕️', '🔽', '🔍', '▼', '🏊',
    '🔔', '⚙️', '🖼️', '🔑', '🚪', '◀️', '⌨️', '👥', '🏷️', '✅', '🚫'
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

  function processNode(root) {
    try {
      if (!root) return;
      if (root.nodeType === Node.TEXT_NODE) {
        wrapTextNodeOnce(root.parentNode, root);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      if (isExcluded(root)) return;
      // Fast path: only check direct text children first
      const children = Array.from(root.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.TEXT_NODE) {
          wrapTextNodeOnce(root, child);
        }
      }
      // If element is small, also scan one level deeper to catch common structures
      if (children.length <= 20) {
        for (const child of children) {
          if (child.nodeType === Node.ELEMENT_NODE && !isExcluded(child)) {
            for (const gchild of Array.from(child.childNodes)) {
              if (gchild.nodeType === Node.TEXT_NODE) wrapTextNodeOnce(child, gchild);
            }
          }
        }
      }
    } catch (_) {}
  }

  function processInitial() {
    // Process only frequently used UI containers to avoid full-page walks
    const roots = [
      document.body,
      document.querySelector('#header-user-bar'),
      ...Array.from(document.querySelectorAll('.pop-over, .pop-over-list, .board-header, .card-details, .sidebar-content')),
    ].filter(Boolean);
    roots.forEach(processNode);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      // Batch process only added nodes, ignore attribute/character changes
      for (const m of mutations) {
        if (m.type !== 'childList') continue;
        m.addedNodes && m.addedNodes.forEach((n) => {
          // Avoid scanning huge subtrees repeatedly by limiting depth
          processNode(n);
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
    Meteor.defer(processInitial);
    startObserver();
  }

  function disableGrey() {
    if (!enabled) return;
    enabled = false;
    stopObserver();
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
