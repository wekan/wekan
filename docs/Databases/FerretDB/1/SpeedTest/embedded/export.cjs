'use strict';

// Writes the speed test's deterministic data as JSON lines for the Go benchmark of
// embedded engines (bench.go): the cards, with the fields the queries read, and the
// parameters (the 3 biggest boards and 12 ordinary ones) the same way run.cjs picks
// them.   node embedded/export.cjs <scale> <out-directory>
const fs = require('fs');
const path = require('path');
const data = require('../data.cjs');

const scale = Number(process.argv[2] || '0.05');
const out = path.resolve(process.argv[3] || '.');
fs.mkdirSync(out, { recursive: true });

const plan = data.plan({ scale });
const lines = [];
const perBoard = new Map();
let n = 0;
for (const batch of data.documents(plan, 'cards', 5000)) {
  for (const doc of batch) {
    lines.push(JSON.stringify(doc, (k, v) => (v instanceof Date ? { $date: v.getTime() } : v)));
    perBoard.set(doc.boardId, (perBoard.get(doc.boardId) || 0) + 1);
    n += 1;
  }
}
fs.writeFileSync(path.join(out, 'cards.jsonl'), `${lines.join('\n')}\n`);

// Parameters: the 3 biggest boards, then 12 ordinary ones spread over the rest.
const boards = [...perBoard.entries()].sort((a, b) => b[1] - a[1]);
const biggest = boards.slice(0, 3).map(b => b[0]);
const rest = boards.slice(3);
const step = Math.max(1, Math.floor(rest.length / 12));
const ordinary = Array.from({ length: 12 }, (_, i) => rest[Math.min(rest.length - 1, i * step)][0]);
fs.writeFileSync(path.join(out, 'params.json'), JSON.stringify({ scale, cards: n, boards: [...biggest, ...ordinary], sizes: boards.slice(0, 3).map(b => b[1]) }));
console.log(`${n} cards, ${perBoard.size} boards; biggest boards have ${boards.slice(0, 3).map(b => b[1]).join(', ')} cards`);
