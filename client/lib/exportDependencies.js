import { ReactiveCache } from '/imports/reactiveCache';
import {
  dependencyTypeMeta,
  normalizeDependencies,
} from '/models/metadata/dependencies';

// #3392: PI Program Board "Red Strings" — client-side export of a board's
// card-to-card dependency lines as JSON or as a standalone, round-trippable SVG.
//
// The SVG embeds each card and each line's metadata as data-* attributes so the
// same file can be re-imported (All Boards / New / Import → Dependencies).

function saveAs(blob, filename) {
  const dl = document.createElement('a');
  dl.href = window.URL.createObjectURL(blob);
  dl.style.display = 'none';
  dl.download = filename;
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
}

function xmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Collect the board's dependency lines as plain objects.
export function collectDependencyLines(boardId) {
  const cards = ReactiveCache.getCards({ boardId, archived: false });
  const cardById = {};
  cards.forEach(card => {
    cardById[card._id] = card;
  });
  const lines = [];
  cards.forEach(card => {
    normalizeDependencies(card.cardDependencies).forEach(dep => {
      const target = cardById[dep.cardId];
      lines.push({
        from: card._id,
        fromTitle: card.title,
        fromCardNumber: card.cardNumber,
        to: dep.cardId,
        toTitle: target ? target.title : null,
        toCardNumber: target ? target.cardNumber : null,
        type: dep.type,
        color: dep.color,
        icon: dep.icon,
      });
    });
  });
  return lines;
}

export function exportDependenciesJson(boardId) {
  const board = ReactiveCache.getBoard(boardId);
  const payload = {
    _format: 'wekan-dependencies-1.0.0',
    boardId,
    boardTitle: board ? board.title : '',
    lines: collectDependencyLines(boardId),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, `wekan-dependencies-${boardId}.json`);
}

// Lay the participating cards out on a simple grid (one column per list, rows by
// card sort order) so the SVG is meaningful without needing the live DOM.
function layoutCards(boardId) {
  const lists = ReactiveCache.getLists(
    { boardId, archived: false },
    { sort: { sort: 1 } },
  );
  const boxW = 180;
  const boxH = 44;
  const gapX = 60;
  const gapY = 20;
  const marginX = 20;
  const marginY = 20;
  const pos = {};
  lists.forEach((list, colIndex) => {
    const cards = ReactiveCache.getCards(
      { boardId, listId: list._id, archived: false },
      { sort: { sort: 1 } },
    );
    cards.forEach((card, rowIndex) => {
      pos[card._id] = {
        x: marginX + colIndex * (boxW + gapX),
        y: marginY + rowIndex * (boxH + gapY),
        w: boxW,
        h: boxH,
        title: card.title || '',
        cardNumber: card.cardNumber,
      };
    });
  });
  return { pos, boxW, boxH };
}

export function exportDependenciesSvg(boardId) {
  const board = ReactiveCache.getBoard(boardId);
  const lines = collectDependencyLines(boardId);
  const { pos } = layoutCards(boardId);

  let width = 400;
  let height = 200;
  Object.values(pos).forEach(p => {
    width = Math.max(width, p.x + p.w + 20);
    height = Math.max(height, p.y + p.h + 20);
  });

  const markers = {};
  const pathEls = [];
  lines.forEach(line => {
    const from = pos[line.from];
    const to = pos[line.to];
    if (!from || !to) return; // only draw lines between cards on this board
    const meta = dependencyTypeMeta(line.type);
    const prereq = meta.forward ? from : to;
    const dependent = meta.forward ? to : from;
    const x1 = prereq.x + prereq.w;
    const y1 = prereq.y + prereq.h / 2;
    const x2 = dependent.x;
    const y2 = dependent.y + dependent.h / 2;
    const dx = Math.max(40, Math.abs(x2 - x1) / 2);
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    const markerId = `arrow-${String(line.color).replace(/[^a-zA-Z0-9]/g, '')}`;
    if (meta.directed) markers[markerId] = line.color;
    pathEls.push(
      `<path class="dependency-line" d="${d}" fill="none" stroke="${xmlEscape(
        line.color,
      )}" stroke-width="2"${meta.directed ? ` marker-end="url(#${markerId})"` : ''}` +
        ` data-from="${xmlEscape(line.from)}" data-to="${xmlEscape(line.to)}"` +
        ` data-from-number="${xmlEscape(line.fromCardNumber)}" data-to-number="${xmlEscape(line.toCardNumber)}"` +
        ` data-from-title="${xmlEscape(line.fromTitle)}" data-to-title="${xmlEscape(line.toTitle)}"` +
        ` data-type="${xmlEscape(line.type)}" data-color="${xmlEscape(line.color)}" data-icon="${xmlEscape(line.icon)}" />`,
    );
  });

  const markerEls = Object.keys(markers)
    .map(
      id =>
        `<marker id="${id}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3 L0,6 Z" fill="${xmlEscape(
          markers[id],
        )}" /></marker>`,
    )
    .join('');

  const cardEls = Object.keys(pos)
    .map(cardId => {
      const p = pos[cardId];
      return (
        `<g class="dependency-card" data-card-id="${xmlEscape(cardId)}" data-card-number="${xmlEscape(
          p.cardNumber,
        )}" data-card-title="${xmlEscape(p.title)}">` +
        `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="4" fill="#ffffff" stroke="#b0b0b0" />` +
        `<text x="${p.x + 8}" y="${p.y + p.h / 2 + 4}" font-family="sans-serif" font-size="12" fill="#222">${xmlEscape(
          p.title.length > 26 ? `${p.title.slice(0, 25)}…` : p.title,
        )}</text></g>`
      );
    })
    .join('');

  const svg =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
    `data-wekan-format="wekan-dependencies-1.0.0" data-board-id="${xmlEscape(boardId)}" data-board-title="${xmlEscape(
      board ? board.title : '',
    )}">\n` +
    `<defs>${markerEls}</defs>\n${cardEls}\n${pathEls.join('\n')}\n</svg>\n`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  saveAs(blob, `wekan-dependencies-${boardId}.svg`);
}
