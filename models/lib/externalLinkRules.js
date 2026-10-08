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
// Pure, and mirrored in packages/markdown/src/template-integration.js (a
// package cannot import app code) between the BEGIN/END markers below;
// tests/externalLinkRules.test.cjs keeps the two copies identical.
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

module.exports = { parseExternalLinkRules, parseExternalLinkAliases, applyExternalLinkRules, EXTERNAL_LINK_RULES_MAX };
