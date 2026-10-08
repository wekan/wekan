import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import * as markdownItEmoji from 'markdown-it-emoji';
import markdownItMath from 'markdown-it-math/no-default-renderer';
import temml from 'temml';
import hljs from 'highlight.js/lib/common';
import { secureSanitize, getSecureDOMPurifyConfig, linkableSchemes } from './secureDOMPurify';
import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

// Code blocks with a known language (```js ... ```) are coloured with
// highlight.js. Its output is escaped HTML with hljs-* classes, which both
// sanitizer passes keep only inside <pre>. An unknown or missing language
// returns '' so markdown-it escapes the code itself, exactly as before.
function highlightCode(code, language) {
  const lang = String(language || '').trim().toLowerCase();
  if (!lang || !hljs.getLanguage(lang)) return '';
  try {
    return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } catch (e) {
    return '';
  }
}

export const Markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: highlightCode,
});

// Admin Panel / Features / Security bridge. This package cannot import app code,
// so app code (client/components/main/editor.js) keeps this reactive flag in sync
// with the `alwaysShowCodeAsText` setting. When true, the markdown helper never
// renders markdown/HTML: it shows the entire raw source as escaped plain text, so
// hidden links, HTML comments (<!-- -->), JavaScript and any other code are always
// visible, not clickable, and not running.
Markdown.alwaysShowCodeAsText = new ReactiveVar(false);

// wekan/wekan#3069: Admin Panel / Features bridge for the external issue-tracker
// autolink setting (externalLinkPatternPrefix / externalLinkPatternUrl), kept in
// sync the same way as alwaysShowCodeAsText above - this package cannot import
// app code (models/settings.js, models/lib/externalLinkAutolink.js), so
// client/components/main/editor.js writes the two configured strings here.
// Empty prefix or a template with no "{number}" placeholder means "off": see
// externalLinkAutolinkAndaSummary below, which mirrors the pure, unit-tested
// algorithm in models/lib/externalLinkAutolink.js (keep the two in sync).
Markdown.externalLinkPattern = new ReactiveVar({ prefix: '', urlTemplate: '' });
// #1463: the further rules and abbreviations (externalLinkRules /
// externalLinkIdentifierAliases), written by client/components/main/editor.js.
Markdown.externalLinkRules = new ReactiveVar({ rules: '', aliases: '' });

// #1463: a copy of models/lib/externalLinkRules.js between the markers, kept
// identical by tests/externalLinkRules.test.cjs.
// BEGIN externalLinkRules
const EXTERNAL_LINK_RULES_MAX = 50;
const EXTERNAL_LINK_IDENTIFIER = '([A-Za-z][A-Za-z0-9_-]{0,31})';

function externalLinkRuleEscape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseExternalLinkAliases(text) {
  const aliases = {};
  for (const part of String(text || '').split(/[,\n]/)) {
    const match = /^\s*([A-Za-z][A-Za-z0-9_-]{0,31})\s*=\s*([A-Za-z][A-Za-z0-9_-]{0,31})\s*$/.exec(part);
    if (match) aliases[match[1]] = match[2];
  }
  return aliases;
}

function parseExternalLinkRules(rulesText, aliasesText) {
  const aliases = parseExternalLinkAliases(aliasesText);
  const rules = [];
  for (const line of String(rulesText || '').split(/\r?\n/)) {
    const split = /\s=\s/.exec(line);
    if (!split) continue;
    const token = line.slice(0, split.index).trim();
    const url = line.slice(split.index + split[0].length).trim();
    const numbers = token.split('{number}').length - 1;
    const identifiers = token.split('{identifier}').length - 1;
    if (numbers !== 1 || identifiers > 1 || !/^https?:\/\/[^\s]+$/i.test(url)) continue;
    if (/\{identifier\}/.test(url) && !identifiers) continue;
    const source = token.split(/(\{number\}|\{identifier\})/).map(part => (part === '{number}' ? '(\\d+)'
      : part === '{identifier}' ? EXTERNAL_LINK_IDENTIFIER : externalLinkRuleEscape(part))).join('');
    const order = [...token.matchAll(/\{(number|identifier)\}/g)].map(m => m[1]);
    rules.push({ source, order, url, aliases });
    if (rules.length >= EXTERNAL_LINK_RULES_MAX) break;
  }
  return rules;
}

// The spans of existing markdown links and href values, never rewritten.
function externalLinkProtectedSpans(text) {
  const spans = [];
  for (const re of [/\[[^\]\n]*\]\([^)\n]*\)/g, /href\s*=\s*("[^"]*"|'[^']*')/gi]) {
    let match;
    while ((match = re.exec(text)) !== null) spans.push([match.index, match.index + match[0].length]);
  }
  return spans;
}

function applyExternalLinkRules(text, rules) {
  if (typeof text !== 'string' || !text || !Array.isArray(rules) || !rules.length) return text;
  const spans = externalLinkProtectedSpans(text);
  const found = [];
  for (const rule of rules) {
    const re = new RegExp(rule.source, 'g');
    let match;
    while ((match = re.exec(text)) !== null) {
      if (!match[0]) { re.lastIndex += 1; continue; }
      const start = match.index, end = start + match[0].length;
      if (spans.some(([a, b]) => start < b && end > a)) continue;
      const values = {};
      rule.order.forEach((name, i) => { values[name] = match[i + 1]; });
      if (values.identifier !== undefined && Object.prototype.hasOwnProperty.call(rule.aliases, values.identifier)) {
        values.identifier = rule.aliases[values.identifier];
      }
      const url = rule.url.replace(/\{(number|identifier)\}/g, (all, name) =>
        (values[name] === undefined ? all : encodeURIComponent(values[name])));
      const label = /^\[.*\]$/.test(match[0]) ? match[0].slice(1, -1) : match[0];
      found.push({ start, end, link: `[${label}](${url})` });
    }
  }
  if (!found.length) return text;
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  let result = '';
  let last = 0;
  for (const item of found) {
    if (item.start < last) continue;
    result += text.slice(last, item.start) + item.link;
    last = item.end;
  }
  return result + text.slice(last);
}
// END externalLinkRules

// wekan/wekan#2453: same app/package bridge as externalLinkPattern above, for
// resolving a pasted WeKan card URL's cardId to its CURRENT title. This
// package cannot import ReactiveCache (app code), so
// client/components/main/editor.js assigns a plain function here once at
// startup: `Markdown.resolveCardTitle = cardId => ReactiveCache.getCard(cardId)?.title`.
// It is a plain function reference, not a ReactiveVar, because ReactiveCache's
// own lookups are already reactive Tracker dependencies - calling it from
// inside this Blaze helper (itself a reactive computation) is what makes the
// rendered title update automatically when the target card is renamed, and
// what makes it resolve to nothing (falls back to the bare URL, see
// autolinkWekanCardUrls) for a card this client's Minimongo subscription does
// not have - a deleted card, or one on a board this viewer cannot see.
Markdown.resolveCardTitle = null;

const EXTERNAL_LINK_NUMBER_PLACEHOLDER = '{number}';

function externalLinkPatternIsConfigured(prefix, urlTemplate) {
  return (
    typeof prefix === 'string' &&
    prefix.length > 0 &&
    typeof urlTemplate === 'string' &&
    urlTemplate.includes(EXTERNAL_LINK_NUMBER_PLACEHOLDER)
  );
}

function escapeRegExpForExternalLink(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isInsideExistingLinkForExternalLink(text, index) {
  const before = text.slice(0, index);
  const openParen = before.lastIndexOf('](');
  const closeParen = before.lastIndexOf(')');
  if (openParen !== -1 && openParen > closeParen) return true;
  const hrefIdx = before.lastIndexOf('href="');
  const hrefIdx2 = before.lastIndexOf("href='");
  const lastHref = Math.max(hrefIdx, hrefIdx2);
  if (lastHref !== -1) {
    const quote = lastHref === hrefIdx ? '"' : "'";
    const closingQuote = before.indexOf(quote, lastHref + 6);
    if (closingQuote === -1 || closingQuote > before.length) return true;
  }
  return false;
}

// Replaces bare "<prefix><digits>" tokens (e.g. "#1234") with markdown links to
// the configured external tracker, skipping tokens already inside a link. A
// no-op when the setting is not configured, or when text has no match.
function autolinkExternalIssueReferences(text, prefix, urlTemplate) {
  if (!externalLinkPatternIsConfigured(prefix, urlTemplate)) return text;
  if (typeof text !== 'string' || !text) return text;

  const pattern = new RegExp(`${escapeRegExpForExternalLink(prefix)}(\\d+)`, 'g');
  let result = '';
  let lastEnd = 0;
  let match;
  let changed = false;
  while ((match = pattern.exec(text)) !== null) {
    const index = match.index;
    if (isInsideExistingLinkForExternalLink(text, index)) continue;
    result += text.slice(lastEnd, index);
    const url = urlTemplate.split(EXTERNAL_LINK_NUMBER_PLACEHOLDER).join(match[1]);
    result += `[${match[0]}](${url})`;
    lastEnd = index + match[0].length;
    changed = true;
  }
  result += text.slice(lastEnd);
  return changed ? result : text;
}

// wekan/wekan#2453: mirrors the pure, unit-tested algorithm in
// models/lib/cardUrlAutolink.js (keep the two in sync) - duplicated here for
// the same reason autolinkExternalIssueReferences is duplicated above: this
// package cannot import app/model code, only Meteor packages.
const CARD_URL_RE =
  /(?:https?:\/\/[^\s/]+)?\/b\/([^/\s#]+)\/([^/\s#]+)\/([^/\s#?]+)(#(comment|activity)-([^\s"'<>)]+))?/g;

function findCardUrlMatches(text) {
  if (typeof text !== 'string' || !text) return [];
  const pattern = new RegExp(CARD_URL_RE.source, 'g');
  const results = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    results.push({ match: match[0], index: match.index, cardId: match[3] });
    if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
  }
  return results;
}

// Replaces every matching, not-already-linked WeKan card URL in `text` with a
// markdown link "[<title>](<match>)", using `resolveTitle(cardId)`. Falls
// back to leaving the URL untouched when resolveTitle is missing, throws, or
// returns nothing - a deleted card, a card on a board this viewer cannot see
// (Minimongo simply does not have it), or the bridge not wired up yet.
function autolinkWekanCardUrls(text, resolveTitle) {
  if (typeof text !== 'string' || !text) return text;
  if (typeof resolveTitle !== 'function') return text;

  const matches = findCardUrlMatches(text);
  if (!matches.length) return text;

  let result = '';
  let lastEnd = 0;
  let changed = false;
  matches.forEach(({ match, index, cardId }) => {
    if (isInsideExistingLinkForExternalLink(text, index)) return;
    let title;
    try {
      title = resolveTitle(cardId);
    } catch (e) {
      title = undefined;
    }
    if (!title || typeof title !== 'string') return;
    result += text.slice(lastEnd, index);
    // '\' MUST be escaped before ']' - see models/lib/cardUrlAutolink.js
    // (kept in sync with this copy) for why: a title ending in a raw
    // backslash would otherwise escape the literal ']' inserted below,
    // leaving the markdown link label unterminated
    // (CodeQL js/incomplete-sanitization).
    const safeTitle = title.replace(/\\/g, '\\\\').replace(/]/g, '\\]');
    result += `[${safeTitle}](${match})`;
    lastEnd = index + match.length;
    changed = true;
  });
  result += text.slice(lastEnd);

  return changed ? result : text;
}

// Escape every HTML-significant character so the raw source is shown literally.
// DOMPurify alone is not enough here: it would strip tags like <script> rather
// than display them, which would hide code instead of revealing it.
function escapeHtmlSource(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Exposed on the exported Markdown object so the "always show code as plain text"
// escaper can be unit-tested (see client/lib/tests/alwaysShowCodeAsText.tests.js).
Markdown.escapeHtmlSource = escapeHtmlSource;

//import markdownItMermaid from "@wekanteam/markdown-it-mermaid";

// #6588: a card whose description or comment contains a `file://` link could not
// be OPENED at all - the details panel never mounted, and the swallowed exception
// was
//
//   TypeError: this.__schemas__[...].validate is not a function
//
// thrown out of markdown-it's linkify pass, so the whole card render died on one
// link.
//
// The cause is the line that used to be here: `linkify.add(scheme + ':', 'http:')`.
// A STRING second argument was linkify-it 4/5's way of saying "this scheme behaves
// like that one". linkify-it 6 removed aliases and builds the definition by
// spreading it:
//
//   const def = { normalize: ..., ...definition };
//
// Spreading the string 'http:' gives `{0:'h',1:'t',2:'t',3:'p',4:':'}` - an entry
// with NO validate - and `testSchemaAt` then calls `.validate(...)` on it. So
// every scheme registered here was a landmine: any text containing `file:`,
// `onenote:`, `thunderlink:` and the rest crashed the viewer, and the card holding
// it could not be opened again.
//
// Each scheme now carries a validate of its own, which is also what the alias was
// only ever standing in for. It matches the URL after the scheme - an optional
// `//`, then everything up to whitespace or a bracket - and hands back trailing
// sentence punctuation, so "see file://server/share/doc.xlsm." does not swallow
// the full stop.
const SCHEME_TAIL_RE = /^\/\/[^\s<>"'`{}|\\^\[\]]+|^[^\s<>"'`{}|\\^\[\]]+/;
const TRAILING_PUNCTUATION_RE = /[.,;:!?)\]}>'"]+$/;

function validateSchemeTail(text, pos) {
  const tail = String(text || '').slice(pos);
  const match = SCHEME_TAIL_RE.exec(tail);
  if (!match) return 0;
  // A scheme with nothing after it ("file:" on its own) is not a link.
  const link = match[0].replace(TRAILING_PUNCTUATION_RE, '');
  return link.length;
}

// wekan/wekan#3218: which custom schemes become links is the administrator's
// choice (Admin Panel → Features → URL, "automaticLinkedUrlSchemes"), parsed by
// the app with models/lib/urlSchemeAllowlist.js and pushed here by
// client/components/main/editor.js - this package cannot import app code.
// Off by default. A listed scheme has to pass three filters to be clickable:
// linkify must recognise it (registered below), markdown-it's validateLink
// must accept it (it refuses file: along with javascript:, vbscript: and
// data:), and both sanitizer passes must allow it as a link target
// (getSecureDOMPurifyConfig(urlSchemes) here, sanitizeHTML's urlSchemes option
// in the viewer). javascript:, data: and the like are never in the list.
//
// Before, eight schemes (thunderlink, onenote, file, ...) were hardcoded
// here: recognised, then stripped by the two later filters, so none was ever
// clickable.
Markdown.urlSchemes = new ReactiveVar([]);
Markdown.validateSchemeTail = validateSchemeTail;

let linkifiedSchemes = [];
// Register exactly the listed schemes with linkify, removing any that were
// taken off the list. linkify-it recompiles on add().
function syncLinkifySchemes(list) {
  const schemes = linkableSchemes(list);
  if (schemes.length === linkifiedSchemes.length && schemes.every((name, i) => name === linkifiedSchemes[i])) return;
  for (const name of linkifiedSchemes) {
    if (!schemes.includes(name)) Markdown.linkify.add(name + ':', null);
  }
  for (const name of schemes) {
    Markdown.linkify.add(name + ':', { validate: validateSchemeTail });
  }
  linkifiedSchemes = schemes.slice();
}
Markdown.syncLinkifySchemes = syncLinkifySchemes;

const defaultValidateLink = Markdown.validateLink;
Markdown.validateLink = function (url) {
  if (defaultValidateLink.call(this, url)) return true;
  const match = /^\s*([a-z][a-z0-9+.-]*):/i.exec(String(url || ''));
  return !!match && linkifiedSchemes.includes(match[1].toLowerCase());
};

const emojiPlugin = markdownItEmoji.full || markdownItEmoji.default || markdownItEmoji;
if (emojiPlugin) {
  Markdown.use(emojiPlugin);
}

// wekan/wekan#2419: GFM task-list items ("- [ ] Task" / "- [x] Done") rendered
// as literal text ("<input disable=\"\" type=\"checkbox\"/> Task") instead of a
// real checkbox, because plain markdown-it has no task-list extension and never
// emits an <input> in the first place - there was nothing for the sanitizer
// below to keep. This core rule runs after inline parsing (md.core.ruler.push
// appends to the end of the chain, so `children` are already tokenized) and
// looks at only the FIRST list item per bullet: a leading "[ ] "/"[x] " text
// token is swapped for a real (but disabled - see the note on click-to-toggle
// below) checkbox, matching what GitHub and other GFM renderers do.
//
// The checkbox is DISABLED and non-interactive: toggling it would need to
// write back into the raw markdown SOURCE of the card description/comment
// from a click on rendered output, which is a separate, materially larger
// feature (mapping a DOM node back to its exact source offset, then saving
// through the card's update API) - out of scope for this rendering fix. The
// bug this closes is specifically "renders as literal HTML text", and a
// disabled checkbox already fixes that: the box is real and its
// checked/unchecked state reflects the source accurately.
const TASK_LIST_ITEM_RE = /^\[([ xX])\]\s+/;
Markdown.use(function(md) {
  md.core.ruler.push('task-lists', function(state) {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'list_item_open') continue;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === 'list_item_close') break;
        if (tokens[j].type !== 'inline') continue;
        const inline = tokens[j];
        const first = inline.children && inline.children[0];
        if (first && first.type === 'text' && TASK_LIST_ITEM_RE.test(first.content)) {
          const match = TASK_LIST_ITEM_RE.exec(first.content);
          const checked = match[1].toLowerCase() === 'x';
          first.content = first.content.slice(match[0].length);
          const checkbox = new state.Token('html_inline', '', 0);
          checkbox.content = '<input type="checkbox" disabled="disabled"'
            + (checked ? ' checked="checked"' : '') + '> ';
          inline.children.unshift(checkbox);
        }
        break;
      }
    }
  });
});

// LaTeX math support. Renders $...$ (inline) and $$...$$ (block) to native
// MathML using Temml, which browsers display without any client-side rendering
// engine. Migrated from markdown-it-mathjax3 (which bundled all of MathJax and
// had a double-render bug); MathML rendering had been silently dropped in commit
// 63ce45c53 during the Meteor 3 refactor. The emitted MathML is whitelisted in
// secureDOMPurify.js so DOMPurify does not strip it.
// We use the markdown-it-math `no-default-renderer` entrypoint and call Temml
// ourselves, instead of the `markdown-it-math/temml` entrypoint, to avoid a
// top-level `await import("temml")` that the Meteor/rspack bundler dislikes.
// Docs: https://github.com/wekan/wekan/blob/main/docs/Features/LaTeX.md
const renderMath = (src, displayMode) => {
  try {
    return temml.renderToString(src, { throwOnError: false, errorColor: '#cc0000', displayMode });
  } catch (e) {
    // Never let one malformed formula break the whole markdown render.
    return src;
  }
};
Markdown.use(markdownItMath, {
  inlineRenderer: (src) => renderMath(src, false),
  blockRenderer: (src) => renderMath(src, true),
});

// Custom plugin to prevent SVG-based DoS attacks
Markdown.use(function(md) {
  // Filter out dangerous SVG content in markdown
  md.core.ruler.push('svg-dos-protection', function(state) {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Check for image tokens that might contain SVG
      if (token.type === 'image') {
        const src = token.attrGet('src');
        if (src) {
          // Block SVG data URIs and .svg files
          if (src.startsWith('data:image/svg') || src.endsWith('.svg')) {
            if (process.env.DEBUG === 'true') {
              console.warn('Blocked potentially malicious SVG image in markdown:', src);
            }
            // Replace with a warning message
            token.type = 'paragraph_open';
            token.tag = 'p';
            token.nesting = 1;
            token.attrSet('style', 'color: red; background: #ffe6e6; padding: 8px; border: 1px solid #ff9999;');
            token.attrSet('title', 'Blocked potentially malicious SVG image');

            // Add warning text token
            const warningToken = {
              type: 'text',
              content: '⚠️ Blocked potentially malicious SVG image for security reasons',
              level: token.level,
              markup: '',
              info: '',
              meta: null,
              block: true,
              hidden: false
            };

            // Insert warning token after the paragraph open
            tokens.splice(i + 1, 0, warningToken);

            // Add paragraph close token
            const closeToken = {
              type: 'paragraph_close',
              tag: 'p',
              nesting: -1,
              level: token.level,
              markup: '',
              info: '',
              meta: null,
              block: true,
              hidden: false
            };
            tokens.splice(i + 2, 0, closeToken);

            // Remove the original image token
            tokens.splice(i, 1);
            i--; // Adjust index since we removed a token
          }
        }
      }

      // Check for HTML tokens that might contain SVG or malicious content
      if (token.type === 'html_block' || token.type === 'html_inline') {
        const content = token.content;
        if (content) {
          // Check for SVG content
          const hasSVG = content.includes('<svg') ||
                        content.includes('data:image/svg') ||
                        content.includes('xlink:href') ||
                        content.includes('<use') ||
                        content.includes('<defs>');
          
          // Check for malicious img tags with SVG data URIs
          const hasMaliciousImg = content.includes('<img') && 
                                 (content.includes('data:image/svg') || 
                                  content.includes('src="data:image/svg'));
          
          // Check for base64 encoded SVG with script tags
          const hasBase64SVG = content.includes('data:image/svg+xml;base64,');
          
          if (hasSVG || hasMaliciousImg || hasBase64SVG) {
            if (process.env.DEBUG === 'true') {
              console.warn('Blocked potentially malicious SVG content in HTML:', content.substring(0, 100) + '...');
            }
            
            // Additional check for base64 encoded SVG with script tags
            if (hasBase64SVG) {
              try {
                const base64Match = content.match(/data:image\/svg\+xml;base64,([^"'\s]+)/);
                if (base64Match) {
                  const decodedContent = atob(base64Match[1]);
                  if (decodedContent.includes('<script') || decodedContent.includes('javascript:')) {
                    if (process.env.DEBUG === 'true') {
                      console.warn('Blocked SVG with embedded JavaScript in markdown');
                    }
                  }
                }
              } catch (e) {
                // If decoding fails, continue with blocking
              }
            }
            
            // Replace with warning
            token.type = 'paragraph_open';
            token.tag = 'p';
            token.nesting = 1;
            token.attrSet('style', 'color: red; background: #ffe6e6; padding: 8px; border: 1px solid #ff9999;');
            token.attrSet('title', 'Blocked potentially malicious SVG content');

            // Add warning text
            const warningToken = {
              type: 'text',
              content: '⚠️ Blocked potentially malicious SVG content for security reasons',
              level: token.level,
              markup: '',
              info: '',
              meta: null,
              block: true,
              hidden: false
            };

            // Insert warning token after the paragraph open
            tokens.splice(i + 1, 0, warningToken);

            // Add paragraph close token
            const closeToken = {
              type: 'paragraph_close',
              tag: 'p',
              nesting: -1,
              level: token.level,
              markup: '',
              info: '',
              meta: null,
              block: true,
              hidden: false
            };
            tokens.splice(i + 2, 0, closeToken);

            // Remove the original HTML token
            tokens.splice(i, 1);
            i--; // Adjust index since we removed a token
          }
        }
      }
    }
  });
});

// Try to fix Mermaid Diagram error: Maximum call stack size exceeded.
// Added bigger text size for Diagram.
// https://github.com/wekan/wekan/issues/4251
// https://stackoverflow.com/questions/66825888/maximum-text-size-in-diagram-exceeded-mermaid-js
// https://github.com/mermaid-js/mermaid/blob/74b1219d62dd76d98d60abeeb36d4520f64faceb/src/defaultConfig.js#L39
// https://github.com/wekan/cli-table3
// https://www.npmjs.com/package/@wekanteam/markdown-it-mermaid
// https://github.com/wekan/markdown-it-mermaid
//Markdown.use(markdownItMermaid,{
//  maxTextSize: 200000,
//});

Blaze.Template.registerHelper('markdown', new Template('markdown', function () {
  const self = this;
  let text = '';
  if (self.templateContentBlock) {
    text = Blaze._toText(self.templateContentBlock, HTML.TEXTMODE.STRING);
  }
  // Admin Panel / Features / Security: "show all code as plain text" forces the
  // raw-source view for ALL content, not only for hidden markdown links.
  const forceRawSource = Markdown.alwaysShowCodeAsText.get();
  // #3218: read reactively, so changing the allowlist re-renders viewers.
  const urlSchemes = linkableSchemes(Markdown.urlSchemes.get());
  syncLinkifySchemes(urlSchemes);
  const hasHiddenLink = text.includes("[]");
  if (forceRawSource || hasHiddenLink) {
    // Prevent hiding info: https://wekan.github.io/hall-of-fame/invisiblebleed/
    // Do not render markdown/HTML; show the whole source as escaped preformatted
    // text so every tag, HTML comment (<!-- -->), link and any other code is
    // visible, not clickable, and not running.
    const escaped = escapeHtmlSource(text);
    const style = hasHiddenLink ? ' style="background-color: red;"' : '';
    const warn = hasHiddenLink
      ? 'Warning! Hidden markdown link description!'
      : 'Code shown as plain text';
    return HTML.Raw('<pre' + style + ' title="' + warn + '" aria-label="' + warn + '">' + secureSanitize(DOMPurify, escaped) + '</pre>');
  } else {
    // Prevent hiding info: https://wekan.github.io/hall-of-fame/invisiblebleed/
    // If text does not have hidden markdown link, render all markdown.
    // Also show html comments.
    //
    // #6588: NOTHING a card contains may make that card impossible to open. A
    // renderer that throws here throws inside a Blaze view, Blaze swallows the
    // exception, and the details panel simply never mounts - the reporter saw a
    // card that played the open animation and then showed nothing, with no error
    // anywhere until they overrode Meteor._debug. One malformed link brought down
    // the whole view.
    //
    // The linkify crash that caused it is fixed above, but the guarantee is worth
    // more than that one fix: a plugin, a pathological formula or the next
    // markdown-it upgrade can all throw. The content is then shown as escaped
    // plain text, which is exactly what the "show code as plain text" branch above
    // renders - unformatted, but readable, and the card opens.
    let sanitized;
    try {
      const externalLinkPattern = Markdown.externalLinkPattern.get();
      const externalLinkRuleText = Markdown.externalLinkRules.get();
      // #1463: the further rules after the #3069 pattern; both skip text that
      // is already a link, so the second never rewrites the first's links.
      const textWithExternalLinks = applyExternalLinkRules(autolinkExternalIssueReferences(
        text,
        externalLinkPattern && externalLinkPattern.prefix,
        externalLinkPattern && externalLinkPattern.urlTemplate,
      ), parseExternalLinkRules(externalLinkRuleText && externalLinkRuleText.rules,
        externalLinkRuleText && externalLinkRuleText.aliases));
      // wekan/wekan#2453: relabel a pasted WeKan card URL with the target
      // card's current title, before markdown-it turns bare URLs into plain
      // autolinks. Runs unconditionally (Markdown.resolveCardTitle is null
      // until editor.js wires it at startup, in which case this is a no-op).
      const textWithCardLinks = autolinkWekanCardUrls(
        textWithExternalLinks,
        Markdown.resolveCardTitle,
      );
      // InvisibleBleed: EVERY HTML comment is made visible. String.replace
      // with a string pattern replaced only the first, so a second comment
      // stayed hidden (2026-10-02).
      const renderedMarkdown = Markdown.render(textWithCardLinks).replaceAll('<!--', '<font color="red" title="Warning! Hidden HTML comment!" aria-label="Warning! Hidden HTML comment!">&lt;!--</font>').replaceAll('-->', '<font color="red" title="Warning! Hidden HTML comment!" aria-label="Warning! Hidden HTML comment!">--&gt;</font>');
      sanitized = secureSanitize(DOMPurify, renderedMarkdown, getSecureDOMPurifyConfig(urlSchemes));
    } catch (error) {
      const message = (error && error.message) ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error('[markdown] rendering failed, showing the text as-is:', message);
      const title = 'This text could not be formatted, so it is shown as it was written';
      sanitized = '<pre title="' + title + '" aria-label="' + title + '">'
        + secureSanitize(DOMPurify, escapeHtmlSource(text)) + '</pre>';
    }
    return HTML.Raw(sanitized);
  }
}));
