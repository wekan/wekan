'use strict';

// The indexes WeKan creates on the five collections of the speed test, read from
// WeKan's own `ensureIndex(...)` calls rather than written down here, so the test
// always runs with the indexes the current WeKan really creates - a new index in
// server/models/cards.js is in the next run without anybody editing this file.
//
// Meteor's accounts-base package creates the users indexes that login uses
// (`username`, `emails.address`); those are not WeKan source, so they are listed.

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const ROOT = path.resolve(__dirname, '../../../../..');

// The variable WeKan's source uses for each collection.
const COLLECTION_OF = {
  Users: 'users',
  'Meteor.users': 'users',
  Boards: 'boards',
  Lists: 'lists',
  Swimlanes: 'swimlanes',
  Cards: 'cards',
};

const ACCOUNTS_BASE = [
  { collection: 'users', key: { username: 1 }, options: { unique: true }, source: 'Meteor accounts-base' },
  { collection: 'users', key: { 'emails.address': 1 }, options: { unique: true }, source: 'Meteor accounts-base' },
];

function literal(node) {
  if (!node) return undefined;
  if (node.type === 'Literal') return node.value;
  if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'Literal') return -node.argument.value;
  if (node.type === 'ObjectExpression') {
    const out = {};
    for (const prop of node.properties) {
      if (prop.type !== 'Property' || prop.computed) return undefined;
      const name = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
      const value = literal(prop.value);
      if (value === undefined) return undefined;
      out[name] = value;
    }
    return out;
  }
  return undefined;
}

function nameOf(node) {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression' && !node.computed) return `${nameOf(node.object)}.${node.property.name}`;
  return '';
}

function sourceFiles() {
  const out = [];
  const visit = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.npm', '_build', '.build'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) visit(rel);
      else if (/\.js$/.test(e.name)) out.push(rel);
    }
  };
  ['server', 'models'].forEach(visit);
  return out;
}

function wekanIndexes() {
  const found = [];
  const skipped = [];
  for (const rel of sourceFiles()) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (!src.includes('ensureIndex(')) continue;
    let ast;
    try {
      ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true,
        allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true, allowHashBang: true });
    } catch (e) {
      skipped.push(`${rel}: could not parse (${e.message})`);
      continue;
    }
    walk.simple(ast, {
      CallExpression(node) {
        if (nameOf(node.callee) !== 'ensureIndex' || node.arguments.length < 2) return;
        const collection = COLLECTION_OF[nameOf(node.arguments[0])];
        if (!collection) return;
        const where = `${rel}:${node.loc.start.line}`;
        const key = literal(node.arguments[1]);
        const options = node.arguments[2] ? literal(node.arguments[2]) : {};
        if (key && typeof key === 'object' && options !== undefined) {
          found.push({ collection, key, options, source: where });
        } else if (rel.endsWith('users.js') && node.arguments[1].type === 'Identifier') {
          // The list sort indexes: ensureIndex(Lists, key) over
          // listSortIndexKeys(allowedSortValues) (#6794).
          const { listSortIndexKeys } = require(path.join(ROOT, 'models/lib/indexKeys.cjs'));
          const values = /export const allowedSortValues = \[([^\]]*)\]/.exec(
            fs.readFileSync(path.join(ROOT, 'models/users.js'), 'utf8'));
          const sortValues = values ? values[1].match(/'[^']*'/g).map(v => v.slice(1, -1)) : [];
          for (const k of listSortIndexKeys(sortValues)) found.push({ collection: 'lists', key: k, options: {}, source: where });
        } else {
          skipped.push(`${where}: key is not a literal`);
        }
      },
    });
  }
  // ensureIndex() skips a key that already exists; so does this.
  const seen = new Set();
  const unique = [];
  for (const ix of [...ACCOUNTS_BASE, ...found]) {
    const id = `${ix.collection} ${JSON.stringify(ix.key)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(ix);
  }
  return { indexes: unique, skipped };
}

module.exports = { wekanIndexes };

if (require.main === module) {
  const { indexes, skipped } = wekanIndexes();
  for (const ix of indexes) console.log(ix.collection.padEnd(10), JSON.stringify(ix.key), JSON.stringify(ix.options), ix.source);
  for (const s of skipped) console.log('skipped:', s);
}
