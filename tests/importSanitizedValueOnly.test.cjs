'use strict';

// Imports must continue with the value the transfer boundary RETURNS.
// Run: node tests/importSanitizedValueOnly.test.cjs
//
// secureTransfer() (and models/import.js's sanitizeImported() wrapper) returns
// a NEW value: prototype keys removed, active markup sanitized. It does not
// clean its argument in place. models/import.js computed that copy for every
// source and then handed the RAW upload to the Deck, OpenProject, GitHub,
// GitLab, Gitea/Forgejo, Asana, Zenkit and Markdown parsers, so their cards
// stored the markup the boundary had removed - while Admin Panel -> Problems
// recorded it as sanitized. The Trello API import named its workspace and job
// result from the raw board the same way.
//
// Positive: the fixed call sites parse the sanitized value, and a boundary
// followed by a parser yields a card without the active markup.
// Negative: no file under models/ or server/ uses an import-direction
// boundary's raw input after sanitizing it (other than type check() calls),
// and the detector itself flags the code as it was before the fix.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '_build', '.build', '.tools', '.meteor']);

function jsFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) jsFiles(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

// Remove comments and the literal text of strings, keeping template `${}`
// expressions, so a word inside prose or a message is not read as code.
function codeOnly(line) {
  let s = line.replace(/\/\/.*$/, '');
  s = s.replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/"(?:[^"\\]|\\.)*"/g, '""');
  // A template literal keeps only its ${...} expressions.
  return s.replace(/`[^`]*`/g, m => (m.match(/\$\{[^}]*\}/g) || []).join(' '));
}

const BOUNDARY = /(?:(?:const|let|var)\s+)?([A-Za-z_$][\w$]*)\s*=\s*(?:require\([^)]*\)\.)?(secureTransfer|sanitizeImported)\(\s*([A-Za-z_$][\w$]*)\s*[,)]/;

// Returns [{ line, raw, use }] for every use of a sanitized value's raw input
// after the boundary, within the enclosing block.
function rawUsesAfterBoundary(source) {
  const lines = source.split('\n');
  const findings = [];
  lines.forEach((line, index) => {
    if (!/\b(?:secureTransfer|sanitizeImported)\(/.test(codeOnly(line))) return;
    const joined = codeOnly(line) + ' ' + codeOnly(lines[index + 1] || '');
    const match = BOUNDARY.exec(joined);
    if (!match) return;
    const [, target, fn, raw] = match;
    // Only the import direction hands its value on to a parser or creator;
    // sanitizeImported() is import-only by definition.
    if (fn === 'secureTransfer' && !/direction:\s*'import'/.test(lines.slice(index, index + 3).join(' '))) return;
    if (target === raw) return;
    // Count from the boundary line itself, so its own options object closing
    // is not mistaken for the end of the enclosing block.
    let depth = 0;
    for (let j = index; j < lines.length; j += 1) {
      const code = codeOnly(lines[j]);
      for (const ch of code) {
        if (ch === '{') depth += 1;
        else if (ch === '}') depth -= 1;
      }
      if (depth < 0) break;
      if (j === index) continue;
      const uses = code.replace(new RegExp(`check\\(\\s*${raw}\\b`, 'g'), '')
        .match(new RegExp(`(^|[^.\\w$])${raw}\\b`));
      if (uses) findings.push({ line: j + 1, raw, use: lines[j].trim() });
    }
  });
  return findings;
}

async function main() {
  // Negative, on the detector: the code as it stood before this fix.
  const before = [
    'async importBoard(board, data, importSource) {',
    "  let importedBoard = sanitizeImported(board, importSource, this);",
    '  switch (importSource) {',
    '    default:',
    '      check(board, Match.OneOf(Object, Array));',
    '      importedBoard = EXTERNAL_PARSERS[importSource](board);',
    '  }',
    '}',
  ].join('\n');
  const flagged = rawUsesAfterBoundary(before);
  assert.equal(flagged.length, 1, 'the detector must flag the pre-fix parser call');
  assert.match(flagged[0].use, /EXTERNAL_PARSERS\[importSource\]\(board\)/);

  const trelloBefore = [
    'for (const id of ids) {',
    '  const board = await fetchBoard(id);',
    "  const sanitized = require('/server/lib/secureTransfer').secureTransfer(board, {",
    "    direction: 'import', source: 'import:trello-api',",
    '  });',
    '  const newBoardId = await creator.create(sanitized, null);',
    '  const wsName = board.organization && board.organization.name;',
    '}',
  ].join('\n');
  assert.equal(rawUsesAfterBoundary(trelloBefore).length, 1, 'the detector must flag the raw workspace name');

  // Export boundaries return what is sent; nothing is parsed from them after.
  assert.equal(rawUsesAfterBoundary([
    'function f(result) {',
    "  const out = require('/server/lib/secureTransfer').secureTransfer(result, {",
    "    direction: 'export', source: 'export:x',",
    '  });',
    '  log(result.title);',
    '  return out;',
    '}',
  ].join('\n')).length, 0);

  // Negative, on the tree: the shape is gone everywhere.
  const offenders = [];
  for (const file of [...jsFiles(path.join(ROOT, 'models')), ...jsFiles(path.join(ROOT, 'server'))]) {
    for (const finding of rawUsesAfterBoundary(fs.readFileSync(file, 'utf8'))) {
      offenders.push(`${path.relative(ROOT, file)}:${finding.line} uses raw ${finding.raw}: ${finding.use}`);
    }
  }
  assert.deepEqual(offenders, [], `raw import values used after sanitizing:\n${offenders.join('\n')}`);

  // Positive: every parser in models/import.js reads the sanitized value.
  const importJs = fs.readFileSync(path.join(ROOT, 'models/import.js'), 'utf8');
  const parserCalls = importJs.match(/EXTERNAL_PARSERS(?:\.\w+|\[\w+\])\(([^)]*)\)/g) || [];
  assert.ok(parserCalls.length >= 2, 'both parser branches are present');
  for (const call of parserCalls) assert.match(call, /\(importedBoard\)$/, call);
  assert.match(importJs, /creator\.create\(importedBoard, currentBoard\)/);
  const trelloApi = fs.readFileSync(path.join(ROOT, 'server/trelloApiImport.js'), 'utf8');
  assert.match(trelloApi, /sanitized\.organization && sanitized\.organization\.displayName/);
  assert.match(trelloApi, /title: sanitized\.name/);

  // Positive, behaviour: boundary, then parser, stores no active markup.
  const { sanitizeTransferValue } = await import('../models/lib/importExportBoundary.js');
  const { parseNextcloudDeck } = await import('../models/lib/externalParsers.js');
  const upload = JSON.parse(JSON.stringify({
    title: 'Deck',
    stacks: [{ title: 'List', cards: [{ title: 'Card', description: 'ok <img src=x onerror="alert(1)">' }] }],
  }));
  // The server's own sanitizer (server/lib/inputSanitizer.js, sanitize-html),
  // which server/lib/secureTransfer.js hands the boundary. This used to be a
  // one-pass `replace(/<[^>]*>/g, '')` stub, which CodeQL alert #545 flagged:
  // "<<script>script>" leaves "<script" behind. A test should drive the real
  // sanitizer anyway, not a weaker stand-in.
  const sanitizerSource = fs.readFileSync(path.join(ROOT, 'server/lib/inputSanitizer.js'), 'utf8');
  const sanitizeInput = new Function('require', sanitizerSource
    .replace(/import (\w+) from '([^']+)';/g, 'const $1 = require("$2");')
    .replace(/export /g, '') + '\nreturn sanitizeInput;')(require);
  const { value, warnings } = sanitizeTransferValue(upload, { direction: 'import', sanitizeHtml: sanitizeInput });
  assert.equal(warnings.length, 1);
  assert.equal(parseNextcloudDeck(value).tasks[0].description, 'ok');
  assert.match(parseNextcloudDeck(upload).tasks[0].description, /onerror/, 'the raw upload still carries it');
  // Negative: markup spliced back together by a one-pass strip does not survive.
  const spliced = sanitizeTransferValue({ title: '<<script>script>alert(1)<</script>/script>', stacks: [] },
    { direction: 'import', sanitizeHtml: sanitizeInput }).value;
  assert.doesNotMatch(spliced.title, /<\s*script/i, spliced.title);

  console.log('  ok - imports parse and store only the sanitized transfer value');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
