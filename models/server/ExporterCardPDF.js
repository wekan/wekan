import { ReactiveCache } from '/imports/reactiveCache';
import {
  wrapTextBlock,
  line,
  buildPdfBuffer,
} from '/models/lib/pdfDocument';

// #6586: the PDF itself - encoding, markdown flattening, wrapping, pagination -
// lives in models/lib/pdfDocument.js, where it can be tested against the bytes a
// reader's viewer sees. This file decides WHAT a card and a board export say.

function sanitizeFilename(value) {
  return String(value || 'export-card')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'export-card';
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

    // Every value goes through the document's own encoder as it is written
    // (models/lib/pdfDocument.js), so a title, a name or a comment with umlauts in
    // it arrives as those letters rather than as question marks (#6586).
    const lines = [
      line('Wekan Card Export', true),
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
      line('Description:', true),
      ...wrapTextBlock(card.description || '-'),
    ];

    lines.push('', line('Checklists:', true));
    if (checklists.length === 0) {
      lines.push('-');
    } else {
      for (const checklist of checklists) {
        lines.push(...wrapTextBlock(`${checklist.title || 'Checklist'}`, '- '));
        const items = checklistItemsByChecklistId[checklist._id] || [];
        if (items.length === 0) {
          lines.push('  (no items)');
          continue;
        }
        for (const item of items) {
          lines.push(...wrapTextBlock(`${item.isFinished ? '[x]' : '[ ]'} ${item.title || ''}`, '  '));
        }
      }
    }

    lines.push('', line('Comments:', true));
    if (comments.length === 0) {
      lines.push('-');
    } else {
      for (const comment of comments) {
        lines.push(
          ...wrapTextBlock(
            `${formatDateValue(comment.createdAt)} ${formatUser(usersById[comment.userId])}: ${comment.text || ''}`,
            '- ',
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

// #395: board-level PDF export, written with the same document builder as the card
// export (models/lib/pdfDocument.js).
//
// #6586: it used to print MARKDOWN - "## List (3)" and "- Card title" - into a PDF,
// where a "##" is just two hash marks: "all the text in this PDF file is markdown
// formatted - this doesn't make sense in a pdf file, does it?" It does not. The
// structure is drawn instead: headings in the bold font, cards as bullets, and the
// card's own markdown flattened rather than reproduced.
//
// The same report asked for what was missing: "I can't see in which swimlane a card
// is in that export, no tags". So the board is walked SWIMLANE by swimlane (when it
// has more than the one every board is created with), and each card carries its
// labels, members, assignees and dates.
class ExporterBoardPDF {
  constructor(boardId) {
    this._boardId = boardId;
  }

  async build(res) {
    const board = await ReactiveCache.getBoard(this._boardId);
    if (!board) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Board not found');
      return;
    }

    const labelsById = Object.fromEntries(
      (board.labels || [])
        .filter(label => label && label._id)
        .map(label => [label._id, label.name || label.color || label._id]),
    );

    const lists = await ReactiveCache.getLists(
      { boardId: this._boardId, archived: false },
      { sort: { sort: 1 } },
    );
    const swimlanes = await ReactiveCache.getSwimlanes(
      { boardId: this._boardId, archived: false },
      { sort: { sort: 1 } },
    );
    const cards = await ReactiveCache.getCards(
      { boardId: this._boardId, archived: false },
      { sort: { sort: 1 } },
    );

    // The names behind the ids on the cards. One pass, so a board with hundreds of
    // cards does not do a lookup per member.
    const userIds = new Set();
    for (const card of cards) {
      if (card.userId) userIds.add(card.userId);
      (card.members || []).forEach(id => userIds.add(id));
      (card.assignees || []).forEach(id => userIds.add(id));
    }
    const usersById = {};
    await Promise.all([...userIds].filter(Boolean).map(async userId => {
      usersById[userId] = await ReactiveCache.getUser({ _id: userId });
    }));

    const lines = [line(board.title || 'Board', true), ''];

    // A board created normally has exactly one swimlane and nobody thinks in terms
    // of it; only name the swimlanes when there is a choice to be made.
    const named = swimlanes.filter(swimlane => swimlane && swimlane.type !== 'template-swimlane');
    const groups = named.length > 1
      ? named.map(swimlane => ({ swimlane, title: swimlane.title || 'Swimlane' }))
      : [{ swimlane: null, title: null }];

    for (const group of groups) {
      if (group.title) {
        lines.push(line(`Swimlane: ${group.title}`, true));
      }
      for (const list of lists) {
        const listCards = cards.filter(card =>
          String(card.listId) === String(list._id)
          && (!group.swimlane || String(card.swimlaneId) === String(group.swimlane._id)));
        if (group.title && listCards.length === 0) continue;
        lines.push(line(`${list.title || 'List'} (${listCards.length})`, true));
        for (const card of listCards) {
          lines.push(...wrapTextBlock(card.title || '', '\u2022 '));
          const labels = (card.labelIds || [])
            .map(labelId => labelsById[labelId] || labelId)
            .filter(Boolean);
          if (labels.length) lines.push(...wrapTextBlock(`Labels: ${labels.join(', ')}`, '    '));
          const members = (card.members || []).map(id => formatUser(usersById[id])).filter(Boolean);
          if (members.length) lines.push(...wrapTextBlock(`Members: ${members.join(', ')}`, '    '));
          const assignees = (card.assignees || []).map(id => formatUser(usersById[id])).filter(Boolean);
          if (assignees.length) lines.push(...wrapTextBlock(`Assignees: ${assignees.join(', ')}`, '    '));
          const dates = [];
          if (card.receivedAt) dates.push(`received ${formatDateValue(card.receivedAt)}`);
          if (card.startAt) dates.push(`start ${formatDateValue(card.startAt)}`);
          if (card.dueAt) dates.push(`due ${formatDateValue(card.dueAt)}`);
          if (card.endAt) dates.push(`end ${formatDateValue(card.endAt)}`);
          if (dates.length) lines.push(...wrapTextBlock(dates.join(', '), '    '));
          if (card.description) {
            lines.push(...wrapTextBlock(card.description, '    '));
          }
        }
        lines.push('');
      }
    }

    const pdf = buildPdfBuffer(lines);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${sanitizeFilename(board.title)}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  async canExport(user) {
    const board = await ReactiveCache.getBoard(this._boardId);
    return board && board.isVisibleBy(user);
  }
}

export { ExporterCardPDF, ExporterBoardPDF };
