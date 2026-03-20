import { ReactiveCache } from '/imports/reactiveCache';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN = 50;
const LINE_HEIGHT = 14;
const FONT_SIZE = 10;
const TEXT_WIDTH = 90;

function sanitizeFilename(value) {
  return String(value || 'export-card')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'export-card';
}

function normalizePdfText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '?');
}

function escapePdfText(value) {
  return normalizePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLine(line, width = TEXT_WIDTH) {
  if (!line) {
    return [''];
  }

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [''];
  }

  const wrapped = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
      continue;
    }

    wrapped.push(current);
    current = word;
  }

  if (current) {
    wrapped.push(current);
  }

  const splitLongWords = [];
  for (const item of wrapped) {
    if (item.length <= width) {
      splitLongWords.push(item);
      continue;
    }

    for (let index = 0; index < item.length; index += width) {
      splitLongWords.push(item.slice(index, index + width));
    }
  }

  return splitLongWords;
}

function wrapTextBlock(text) {
  return normalizePdfText(text)
    .split('\n')
    .flatMap(line => wrapLine(line));
}

function paginateLines(lines) {
  const linesPerPage = Math.floor(
    (PAGE_HEIGHT - PAGE_MARGIN * 2) / LINE_HEIGHT,
  );
  const pages = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  return pages.length > 0 ? pages : [['No data']];
}

function buildPdfBuffer(lines) {
  const pages = paginateLines(lines);
  const objects = [];
  const addObject = content => {
    objects.push(content);
    return objects.length;
  };

  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontId = addObject(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
  );

  const pageIds = [];

  for (const pageLines of pages) {
    const textCommands = ['BT', `/F1 ${FONT_SIZE} Tf`, `${LINE_HEIGHT} TL`];
    textCommands.push(
      `1 0 0 1 ${PAGE_MARGIN} ${PAGE_HEIGHT - PAGE_MARGIN - FONT_SIZE} Tm`,
    );

    pageLines.forEach((line, index) => {
      if (index > 0) {
        textCommands.push('T*');
      }
      textCommands.push(`(${escapePdfText(line)}) Tj`);
    });

    textCommands.push('ET');
    const stream = textCommands.join('\n');
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function formatDateValue(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '-';
  }

  return value.toISOString().replace('T', ' ').slice(0, 16);
}

function formatUser(user) {
  if (!user) {
    return 'Unknown';
  }

  return user.profile?.fullname || user.username || user.profile?.initials || user._id;
}

class ExporterCardPDF {
  constructor(boardId, listId, cardId) {
    this._boardId = boardId;
    this._listId = listId;
    this._cardId = cardId;
  }

  async _getCardData() {
    const board = await ReactiveCache.getBoard(this._boardId);
    const list = await ReactiveCache.getList({
      _id: this._listId,
      boardId: this._boardId,
    });
    const card = await ReactiveCache.getCard({
      _id: this._cardId,
      boardId: this._boardId,
      listId: this._listId,
    });

    if (!board || !list || !card) {
      return null;
    }

    const swimlane = card.swimlaneId
      ? await ReactiveCache.getSwimlane({ _id: card.swimlaneId })
      : null;
    const checklists = await ReactiveCache.getChecklists(
      { cardId: this._cardId },
      { sort: { sort: 1 } },
    );
    const comments = await ReactiveCache.getCardComments(
      { cardId: this._cardId },
      { sort: { createdAt: 1 } },
    );

    const checklistItemsByChecklistId = {};
    for (const checklist of checklists) {
      checklistItemsByChecklistId[checklist._id] = await ReactiveCache.getChecklistItems(
        { checklistId: checklist._id },
        { sort: { sort: 1 } },
      );
    }

    const userIds = new Set([
      card.userId,
      ...(card.members || []),
      ...(card.assignees || []),
      ...comments.map(comment => comment.userId),
    ]);
    const usersById = {};

    await Promise.all(
      [...userIds]
        .filter(Boolean)
        .map(async userId => {
          usersById[userId] = await ReactiveCache.getUser({ _id: userId });
        }),
    );

    return {
      board,
      list,
      card,
      swimlane,
      checklists,
      checklistItemsByChecklistId,
      comments,
      usersById,
    };
  }

  async build(res) {
    const data = await this._getCardData();
    if (!data) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Card not found');
      return;
    }

    const { board, list, card, swimlane, checklists, checklistItemsByChecklistId, comments, usersById } = data;
    const labelsById = Object.fromEntries(
      (board.labels || [])
        .filter(label => label && label._id)
        .map(label => [label._id, label.name || label.color || label._id]),
    );

    const lines = [
      'Wekan Card Export',
      '',
      `Title: ${card.title || '-'}`,
      `Board: ${board.title || '-'}`,
      `List: ${list.title || '-'}`,
      `Swimlane: ${swimlane?.title || '-'}`,
      `Created by: ${formatUser(usersById[card.userId])}`,
      `Members: ${(card.members || []).map(userId => formatUser(usersById[userId])).join(', ') || '-'}`,
      `Assignees: ${(card.assignees || []).map(userId => formatUser(usersById[userId])).join(', ') || '-'}`,
      `Labels: ${(card.labelIds || []).map(labelId => labelsById[labelId] || labelId).join(', ') || '-'}`,
      `Created: ${formatDateValue(card.createdAt)}`,
      `Last activity: ${formatDateValue(card.dateLastActivity)}`,
      `Received: ${formatDateValue(card.receivedAt)}`,
      `Start: ${formatDateValue(card.startAt)}`,
      `Due: ${formatDateValue(card.dueAt)}`,
      `End: ${formatDateValue(card.endAt)}`,
      `Spent time: ${card.spentTime ?? '-'}`,
      '',
      'Description:',
      ...wrapTextBlock(card.description || '-'),
    ];

    lines.push('', 'Checklists:');
    if (checklists.length === 0) {
      lines.push('-');
    } else {
      for (const checklist of checklists) {
        lines.push(...wrapTextBlock(`- ${checklist.title || 'Checklist'}`));
        const items = checklistItemsByChecklistId[checklist._id] || [];
        if (items.length === 0) {
          lines.push('  (no items)');
          continue;
        }
        for (const item of items) {
          lines.push(...wrapTextBlock(`  ${item.isFinished ? '[x]' : '[ ]'} ${item.title || ''}`));
        }
      }
    }

    lines.push('', 'Comments:');
    if (comments.length === 0) {
      lines.push('-');
    } else {
      for (const comment of comments) {
        lines.push(
          ...wrapTextBlock(
            `- ${formatDateValue(comment.createdAt)} ${formatUser(usersById[comment.userId])}: ${comment.text || ''}`,
          ),
        );
      }
    }

    const filename = `${sanitizeFilename(card.title)}.pdf`;
    const pdf = buildPdfBuffer(lines);

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}

export { ExporterCardPDF };
