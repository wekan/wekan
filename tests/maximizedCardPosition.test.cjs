'use strict';

// Plain-Node regression guard (no Meteor) for issue #4822:
// "Maximized card does not display at the right place when scrolling down in
// swimlanes view".
//
// Root cause class covered here: the maximized card pane was laid out as an
// in-flow flex/float item INSIDE the scrolled swimlane/board container (the
// legacy .card-details-maximized block still carries flex-basis/float and
// offsets but declared no position of its own), so after scrolling down the
// pane rendered at its swimlane's position in the tall scrolled canvas —
// off-screen — instead of over the viewport. On top of that, in desktop mode
// the floating-window rules (top: 8px / inset-inline-end: 8px /
// width: min(650px, 90vw), specificity up to 0,5,1) silently overrode ALL of
// the lower-specificity maximized geometry, and inline left/top styles written
// by the drag handle survived into the maximized state (a stale dragged offset
// is exactly the "wrong place" of #4822, since inline styles beat every
// non-!important stylesheet rule).
//
// The fix is pinned BEHAVIORALLY: a small cascade resolver (importance >
// specificity > source order, honoring @media, :not(), :nth-of-type(),
// [style*=...] and inline styles) is run against the real cardDetails.css and
// must resolve a maximized card to viewport-fixed geometry — including when
// stale inline drag offsets are present — while a NON-maximized card must keep
// the floating-window behavior (negative cases).
//
// Run: node tests/maximizedCardPosition.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const cssPath = path.join(repoRoot, 'client', 'components', 'cards', 'cardDetails.css');
const css = fs.readFileSync(cssPath, 'utf8');
const cardDetailsJs = fs.readFileSync(
  path.join(repoRoot, 'client', 'components', 'cards', 'cardDetails.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --------------------------------------------------------------------------
// Minimal CSS parser: rules with selector, declarations, media condition.
// --------------------------------------------------------------------------
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseRules(source) {
  const text = stripComments(source);
  const rules = [];
  let i = 0;
  let order = 0;

  function parseBlockBody(media) {
    // Parses "selector { decls }" sequences until an unmatched '}' or EOF.
    for (;;) {
      while (i < text.length && /\s/.test(text[i])) i++;
      if (i >= text.length) return;
      if (text[i] === '}') {
        i++;
        return;
      }
      const selStart = i;
      while (i < text.length && text[i] !== '{') i++;
      const selector = text.slice(selStart, i).trim();
      i++; // consume '{'
      if (selector.startsWith('@media')) {
        parseBlockBody(selector.replace(/^@media/, '').trim());
        continue;
      }
      if (selector.startsWith('@')) {
        // @keyframes and friends: skip the whole block, nested braces included.
        let depth = 1;
        while (i < text.length && depth > 0) {
          if (text[i] === '{') depth++;
          else if (text[i] === '}') depth--;
          i++;
        }
        continue;
      }
      const declStart = i;
      while (i < text.length && text[i] !== '}') i++;
      const declText = text.slice(declStart, i);
      i++; // consume '}'
      const declarations = [];
      for (const part of declText.split(';')) {
        const idx = part.indexOf(':');
        if (idx === -1) continue;
        const prop = part.slice(0, idx).trim().toLowerCase();
        let value = part.slice(idx + 1).trim();
        if (!prop || !value) continue;
        let important = false;
        if (/!important$/i.test(value)) {
          important = true;
          value = value.replace(/\s*!important$/i, '').trim();
        }
        declarations.push({ prop, value, important });
      }
      for (const sel of selector.split(',')) {
        rules.push({ selector: sel.trim(), declarations, media, order: order++ });
      }
    }
  }

  parseBlockBody(null);
  return rules;
}

// --------------------------------------------------------------------------
// Media evaluation for a desktop viewport.
// --------------------------------------------------------------------------
function mediaMatches(media, viewportWidth) {
  if (!media) return true;
  let ok = true;
  const conds = media.match(/\((min|max)-width:\s*([\d.]+)px\)/g) || [];
  for (const c of conds) {
    const m = c.match(/\((min|max)-width:\s*([\d.]+)px\)/);
    const px = parseFloat(m[2]);
    if (m[1] === 'min' && !(viewportWidth >= px)) ok = false;
    if (m[1] === 'max' && !(viewportWidth <= px)) ok = false;
  }
  // Unknown feature queries (device-width, pixel-ratio, orientation...) are
  // treated as non-matching to stay conservative for a plain desktop screen.
  if (/device-width|pixel-ratio|orientation/.test(media)) ok = false;
  return ok;
}

// --------------------------------------------------------------------------
// Selector matching for the subset used by the card positioning rules:
// descendant combinators of compound selectors made of tags, classes,
// :not(<class>|<attr>), :nth-of-type(n) and [style*="..."].
// --------------------------------------------------------------------------
function splitCompounds(selector) {
  if (/[>+~]/.test(selector)) return null; // combinators we don't model
  return selector.split(/\s+/).filter(Boolean);
}

function parseSimpleSelectors(compound) {
  // Returns list of simple selector tokens or null when unsupported.
  const tokens = [];
  const re = /([a-zA-Z][a-zA-Z0-9-]*)|(\.[a-zA-Z0-9_-]+)|(:not\([^)]*\))|(:nth-of-type\(\d+\))|(\[[^\]]*\])|(::?[a-zA-Z-]+(\([^)]*\))?)/y;
  let i = 0;
  while (i < compound.length) {
    re.lastIndex = i;
    const m = re.exec(compound);
    if (!m || m.index !== i) return null;
    tokens.push(m[0]);
    i += m[0].length;
  }
  return tokens;
}

function simpleMatches(token, el) {
  if (token.startsWith('.')) return el.classes.includes(token.slice(1));
  if (token.startsWith(':not(')) {
    const inner = token.slice(5, -1).trim();
    const res = simpleMatches(inner, el);
    return res === null ? null : !res;
  }
  if (token.startsWith(':nth-of-type(')) {
    const n = parseInt(token.slice(13, -1), 10);
    return el.nthOfType === n;
  }
  if (token.startsWith('[')) {
    const m = token.match(/^\[([a-zA-Z-]+)\*=["']?([^"'\]]*)["']?\]$/);
    if (!m) return null;
    const attr = (el.attributes && el.attributes[m[1]]) || '';
    return attr.includes(m[2]);
  }
  if (token.startsWith(':') || token.startsWith('::')) return null; // :hover etc.
  return el.tag === token.toLowerCase(); // type selector
}

function compoundMatches(compound, el) {
  const tokens = parseSimpleSelectors(compound);
  if (!tokens) return false;
  for (const t of tokens) {
    const r = simpleMatches(t, el);
    if (r !== true) return false; // null (unsupported) counts as no-match
  }
  return true;
}

function selectorMatches(selector, el, ancestors) {
  const compounds = splitCompounds(selector);
  if (!compounds || compounds.length === 0) return false;
  if (!compoundMatches(compounds[compounds.length - 1], el)) return false;
  // Remaining compounds must match ancestors, outermost-to-innermost order.
  let ai = 0;
  for (let ci = 0; ci < compounds.length - 1; ci++) {
    let found = false;
    while (ai < ancestors.length) {
      if (compoundMatches(compounds[ci], ancestors[ai])) {
        found = true;
        ai++;
        break;
      }
      ai++;
    }
    if (!found) return false;
  }
  return true;
}

function specificity(selector) {
  let b = 0; // classes, attributes, pseudo-classes
  let c = 0; // types
  const compounds = splitCompounds(selector) || [];
  for (const compound of compounds) {
    const tokens = parseSimpleSelectors(compound) || [];
    for (const t of tokens) {
      if (t.startsWith('.') || t.startsWith('[')) b++;
      else if (t.startsWith(':not(')) {
        const inner = t.slice(5, -1).trim();
        if (inner.startsWith('.') || inner.startsWith('[')) b++;
        else c++;
      } else if (t.startsWith(':nth-of-type')) b++;
      else if (!t.startsWith(':')) c++;
    }
  }
  return b * 256 + c;
}

const LOGICAL = {
  'inset-inline-start': 'left', // LTR
  'inset-inline-end': 'right',
};

function resolveStyles(rules, el, ancestors, viewportWidth) {
  const winners = {}; // prop -> {value, important, spec, order, inline}
  function consider(prop, cand) {
    const p = LOGICAL[prop] || prop;
    const cur = winners[p];
    if (
      !cur ||
      (cand.important && !cur.important) ||
      (cand.important === cur.important &&
        !cand.inline &&
        !cur.inline &&
        (cand.spec > cur.spec || (cand.spec === cur.spec && cand.order >= cur.order))) ||
      (cand.important === cur.important && cand.inline && !cur.important)
    ) {
      winners[p] = cand;
    }
  }
  for (const rule of rules) {
    if (!mediaMatches(rule.media, viewportWidth)) continue;
    if (!selectorMatches(rule.selector, el, ancestors)) continue;
    const spec = specificity(rule.selector);
    for (const d of rule.declarations) {
      consider(d.prop, { value: d.value, important: d.important, spec, order: rule.order, inline: false });
    }
  }
  // Inline styles: beat every non-important author declaration.
  for (const [prop, value] of Object.entries(el.inlineStyle || {})) {
    consider(prop.toLowerCase(), { value, important: false, spec: Infinity, order: Infinity, inline: true });
  }
  const out = {};
  for (const [p, w] of Object.entries(winners)) out[p] = w.value;
  return out;
}

const rules = parseRules(css);

// The DOM context of the inline swimlane render path: the card section lives
// inside the vertically scrolled .board-canvas, inside a .swimlane row.
const DESKTOP_ANCESTORS = [
  { tag: 'body', classes: ['desktop-mode'], nthOfType: 1 },
  { tag: 'div', classes: ['board-wrapper'], nthOfType: 1 },
  { tag: 'div', classes: ['board-canvas', 'js-swimlanes', 'dragscroll'], nthOfType: 1 },
  { tag: 'div', classes: ['swimlane', 'js-lists', 'js-swimlane', 'dragscroll'], nthOfType: 1 },
];
const MOBILE_ANCESTORS = [
  { tag: 'body', classes: ['mobile-mode'], nthOfType: 1 },
  ...DESKTOP_ANCESTORS.slice(1),
];

function cardEl({ maximized = false, inlineStyle = {} } = {}) {
  const classes = ['card-details', 'js-card-details', 'nodragscroll'];
  if (maximized) classes.push('card-details-maximized');
  const styleAttr = Object.entries(inlineStyle)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
  return {
    tag: 'section',
    classes,
    nthOfType: 1,
    inlineStyle,
    attributes: { style: styleAttr },
  };
}

const VIEWPORT = 1280;

// --------------------------------------------------------------------------
// POSITIVE: the maximized card is anchored to the viewport.
// --------------------------------------------------------------------------
test('maximized card resolves to position: fixed (desktop mode, swimlanes DOM)', () => {
  const styles = resolveStyles(rules, cardEl({ maximized: true }), DESKTOP_ANCESTORS, VIEWPORT);
  assert.strictEqual(styles.position, 'fixed');
});

test('maximized card fills the viewport from fixed insets (top/left/right/bottom)', () => {
  const styles = resolveStyles(rules, cardEl({ maximized: true }), DESKTOP_ANCESTORS, VIEWPORT);
  assert.strictEqual(styles.top, '8px');
  assert.strictEqual(styles.left, '8px');
  assert.strictEqual(styles.right, '8px');
  assert.strictEqual(styles.bottom, '8px');
  // The floating-window width (min(650px, 90vw)) must NOT survive maximizing.
  assert.strictEqual(styles.width, 'auto');
  assert.strictEqual(styles.height, 'auto');
});

test('#4822 core: stale inline drag offsets cannot move the MAXIMIZED card', () => {
  // The drag handle writes document-coordinate left/top inline styles; a value
  // like top: 1876px is what "scrolled down in swimlanes view" produced. The
  // maximized state must beat them (only !important declarations beat inline).
  const styles = resolveStyles(
    rules,
    cardEl({ maximized: true, inlineStyle: { left: '2340px', top: '1876px' } }),
    DESKTOP_ANCESTORS,
    VIEWPORT,
  );
  assert.strictEqual(styles.position, 'fixed');
  assert.strictEqual(styles.top, '8px');
  assert.strictEqual(styles.left, '8px');
});

test('the legacy media-query maximized block declares position: fixed itself', () => {
  // Belt and braces: even without body.desktop-mode (first paint before the
  // mode class is applied) the maximized pane must not fall back to in-flow
  // flex/float layout inside the scrolled container.
  const styles = resolveStyles(
    rules,
    cardEl({ maximized: true }),
    [{ tag: 'body', classes: [], nthOfType: 1 }, ...DESKTOP_ANCESTORS.slice(1)],
    VIEWPORT,
  );
  assert.strictEqual(styles.position, 'fixed');
});

test('mobile mode keeps its full-screen fixed card for maximized cards too', () => {
  const styles = resolveStyles(rules, cardEl({ maximized: true }), MOBILE_ANCESTORS, VIEWPORT);
  assert.strictEqual(styles.position, 'fixed');
  assert.strictEqual(styles.top, '0');
});

// --------------------------------------------------------------------------
// NEGATIVE: the fix is scoped to the maximized state.
// --------------------------------------------------------------------------
test('NEGATIVE: non-maximized floating card keeps its dragged inline position', () => {
  const styles = resolveStyles(
    rules,
    cardEl({ inlineStyle: { left: '300px', top: '120px' } }),
    DESKTOP_ANCESTORS,
    VIEWPORT,
  );
  assert.strictEqual(styles.position, 'fixed'); // still viewport-fixed ...
  assert.strictEqual(styles.top, '120px'); // ... but the user's drag wins
  assert.strictEqual(styles.left, '300px');
});

test('NEGATIVE: non-maximized card is the floating window, not full-viewport', () => {
  const styles = resolveStyles(rules, cardEl(), DESKTOP_ANCESTORS, VIEWPORT);
  assert.strictEqual(styles.position, 'fixed');
  assert.strictEqual(styles.top, '8px');
  assert.notStrictEqual(styles.width, 'auto');
  assert.ok(styles.width.includes('650px'), `floating width kept, got ${styles.width}`);
});

// --------------------------------------------------------------------------
// Content pins: the position strategy may not silently regress.
// --------------------------------------------------------------------------
test('cardDetails.css: .card-details-maximized block contains position: fixed and no absolute/static', () => {
  const block = stripComments(css).match(/\n\s*\.card-details-maximized\s*\{([^}]*)\}/);
  assert.ok(block, '.card-details-maximized block exists');
  assert.ok(/position:\s*fixed/.test(block[1]), 'declares position: fixed explicitly');
  assert.ok(!/position:\s*(absolute|static|relative)/.test(block[1]), 'never absolute/static/relative');
});

test('cardDetails.css: desktop-mode maximized override exists with !important viewport insets', () => {
  const m = stripComments(css).match(
    /body\.desktop-mode \.card-details\.card-details-maximized[^{]*\{([^}]*)\}/,
  );
  assert.ok(m, 'desktop-mode maximized rule exists');
  for (const decl of ['position: fixed', 'top: 8px', 'inset-inline-start: 8px', 'inset-inline-end: 8px', 'bottom: 8px']) {
    assert.ok(
      // Escape ALL regex metacharacters (incl. backslash), not just parens —
      // flagged by CodeQL js/incomplete-sanitization.
      new RegExp(`${decl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*!important`).test(m[1]),
      `${decl} !important present`,
    );
  }
});

test('cardDetails.js: no scrollParentContainer / scroll-offset position math (the pre-6.27 mechanism)', () => {
  // #4822 was introduced when scrollParentContainer() calls were shuffled
  // around while the pane was still laid out inside the scrolled container.
  // The pane is viewport-fixed now, so no code may reintroduce scroll-based
  // positioning of the card details pane.
  assert.ok(!/scrollParentContainer/.test(cardDetailsJs));
  assert.ok(!/cardMaximized[\s\S]{0,200}scrollTop\(/.test(cardDetailsJs));
});

// --------------------------------------------------------------------------
// Self-check: the resolver actually detects the broken (pre-fix) stylesheet.
// --------------------------------------------------------------------------
test('resolver self-check: the pre-fix CSS (in-flow maximized pane) FAILS the viewport anchor', () => {
  const brokenCss = `
    .card-details { flex-basis: min(600px, 80vw); }
    @media screen and (min-width: 801px) {
      .card-details-maximized {
        flex-basis: calc(100% - 20px);
        top: 97px;
        inset-inline-start: 0px;
        float: inline-start;
      }
    }
  `;
  const brokenRules = parseRules(brokenCss);
  const styles = resolveStyles(brokenRules, cardEl({ maximized: true }), DESKTOP_ANCESTORS, VIEWPORT);
  assert.notStrictEqual(styles.position, 'fixed'); // in-flow: scrolls away with the swimlane
});

console.log(`maximizedCardPosition.test.cjs: ${passed} tests passed`);
