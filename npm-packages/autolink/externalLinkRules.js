'use strict';

// #1463: autolink references into other tools, with more than the single
// "<prefix><number>" pattern of #3069 (externalLinkAutolink.js):
//
//   [Task:3384]  =>  https://spirateam.com/SpiraTeam/Task/3384.aspx
//   [TK:3384]    =>  the same, with the abbreviation TK=Task
//
// Admin Panel / Settings / Features holds the rules, one per line,
// "<token> = <url>", where the token is literal text with {number} (digits)
// and optionally {identifier} (a word), and the URL uses the same two names:
//
//   [{identifier}:{number}] = https://spirateam.com/SpiraTeam/{identifier}/{number}.aspx
//   PROJ-{number} = https://jira.example.com/browse/PROJ-{number}
//
// and the abbreviations as "TK=Task, IN=Incident". All rules are matched in
// ONE pass, earliest first, so a rule never rewrites another rule's link, and
// a token already inside a markdown link or an href is left alone. Only an
// http(s) URL makes a rule; a malformed line is skipped. The link text is the
// token, without its outer brackets when it has them.
//
// Pure. The markdown package (packages/markdown/src/template-integration.js)
// and the app both load this file from @wekanteam/autolink, so there is one
// copy; tests/externalLinkRules.test.cjs drives it.
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
    // A token that STARTS with {number} would retry (\d+) from every digit
    // of a long run that is not followed by the rest of the token, which is
    // quadratic in the card text; it starts only where a run of digits does.
    const lead = token.startsWith('{number}') ? '(?<!\\d)' : '';
    const source = lead + token.split(/(\{number\}|\{identifier\})/).map(part => (part === '{number}' ? '(\\d+)'
      : part === '{identifier}' ? EXTERNAL_LINK_IDENTIFIER : externalLinkRuleEscape(part))).join('');
    const order = [...token.matchAll(/\{(number|identifier)\}/g)].map(m => m[1]);
    rules.push({ source, order, url, aliases });
    if (rules.length >= EXTERNAL_LINK_RULES_MAX) break;
  }
  return rules;
}

// The spans of existing markdown links "[text](url)" and of href="..." /
// href='...' values, never rewritten. A hand-written scan, not a regular
// expression: /\[[^\]\n]*\]\([^)\n]*\)/g restarts at every "[" and reads to
// the end of the line each time, so a card text of many "[" (or many href="
// without a closing quote) took quadratic time (CodeQL js/polynomial-redos).
// Every "next ... at or after i" is computed once, right to left, so the
// whole scan is linear and finds exactly what those expressions found.
function externalLinkNextOf(text, stops) {
  const next = new Int32Array(text.length + 1);
  next[text.length] = -1;
  for (let i = text.length - 1; i >= 0; i -= 1) {
    next[i] = stops.includes(text[i]) ? i : next[i + 1];
  }
  return next;
}

function externalLinkProtectedSpans(text) {
  const spans = [];
  const n = text.length;
  const closeBracket = externalLinkNextOf(text, ']\n');
  const closeParen = externalLinkNextOf(text, ')\n');
  for (let i = 0; i < n; i += 1) {
    if (text[i] !== '[') continue;
    const j = closeBracket[i + 1];
    if (j < 0 || text[j] !== ']' || text[j + 1] !== '(') continue;
    const k = closeParen[j + 2];
    if (k < 0 || text[k] !== ')') continue;
    spans.push([i, k + 1]);
    i = k;
  }
  const dquote = externalLinkNextOf(text, '"');
  const squote = externalLinkNextOf(text, "'");
  const space = c => c !== undefined && /\s/.test(c);
  const href = /href/gi;
  for (let m = href.exec(text); m; m = href.exec(text)) {
    const i = m.index;
    let p = i + 4;
    while (p < n && space(text[p])) p += 1;
    if (text[p] !== '=') continue;
    p += 1;
    while (p < n && space(text[p])) p += 1;
    const quote = text[p];
    if (quote !== '"' && quote !== "'") continue;
    const close = (quote === '"' ? dquote : squote)[p + 1];
    if (close < 0) continue;
    spans.push([i, close + 1]);
    href.lastIndex = close + 1;
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

module.exports = { parseExternalLinkRules, parseExternalLinkAliases, applyExternalLinkRules, EXTERNAL_LINK_RULES_MAX };
