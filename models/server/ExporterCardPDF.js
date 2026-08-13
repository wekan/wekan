import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
import {
  wrapTextBlock,
  wrapRichTextBlock,
  line,
  buildPdfBuffer,
} from '/models/lib/pdfDocument';

// #6586: the PDF itself - encoding, markdown, wrapping, pagination - lives in
// models/lib/pdfDocument.js, where it can be tested against the bytes a reader's
// viewer sees. This file decides WHAT a card and a board export say.
//
// The reopened half of that report is about exactly this file:
//
//   "Assignee, Labels, due,... these titels should be in the user set language"
//   "There is 'Assignee: ', 'Labels:' and then 'due' (lowercase letter and no ':')"
//   "I think all those other things we set in a card should be also present"
//   "the time is not in the user set timezone (-2h wrong for Europe/Berlin)"
//
// So every label goes through `__()` in the requesting user's language, both
// exports build their labels from the SAME i18n keys - which is what makes the
// board export's "due" become "Due:" like the card export's, rather than being
// fixed twice and drifting again - dates are formatted in the browser's own time
// zone, and the card export carries the rest of what a card holds.

function sanitizeFilename(value) {
  return String(value || 'export-card')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'export-card';
}

// A card's dates are stored in UTC, and printing them in the SERVER's zone is
// what "-2h wrong for Europe/Berlin" was: 14:00 in Berlin left the server as
// 12:00, and a server started with another TZ would have printed a third time.
// The zone is the browser's own IANA name, sent by the export link, because
// WeKan stores no timezone on a profile.
//
// The formatter is the one the Excel card export uses
// (imports/lib/dateUtils.js), and the FORMAT is the reader's own
// `profile.dateFormat`, so the same card exported twice cannot come out with two
// different dates on it. Without a zone it renders UTC and says UTC - which is
// honest, and does not depend on how the server happens to be started.
function formatDateValue(value, timezone, dateFormat) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '-';
  }

  const zone = timezone || 'UTC';
  const formatted = formatDateByUserPreference(value, dateFormat || 'YYYY-MM-DD', true, zone);
  if (!formatted) return '-';
  return timezone ? formatted : `${formatted} UTC`;
}

function formatUser(user) {
  if (!user) {
    return 'Unknown';
  }

  return user.profile?.fullname || user.username || user.profile?.initials || user._id;
}

// A custom field's value can be a string, a number, a boolean, a date or a list
// of strings (a dropdown's selection is an item id, resolved by the caller).
function formatCustomFieldValue(value, timezone, dateFormat) {
  if (value === null || value === undefined || value === '') return '-';
  if (value instanceof Date) return formatDateValue(value, timezone, dateFormat);
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'boolean') return value ? 'x' : '-';
  return String(value);
}

function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// Shared by both exporters, so a label cannot say one thing on a card and another
// on the board it is in. The English text is the fallback for every key, so a
// language that has not translated one shows the word rather than the key.
class PDFExporterBase {
  constructor(userLanguage, timezone, dateFormat) {
    this.userLanguage = userLanguage || 'en';
    this.timezone = timezone || '';
    this.dateFormat = dateFormat || 'YYYY-MM-DD';
  }

  __(key, fallback) {
    try {
      const translated = TAPi18n.__(key, '', this.userLanguage);
      if (translated && translated !== key) return translated;
    } catch (error) {
      // A missing bundle is not a reason to fail an export.
    }
    return fallback;
  }

  // "Label: value", once, so every caller gets the same colon and spacing - the
  // reported "there is 'Assignee: ', 'Labels:' and then 'due'".
  field(key, fallback, value) {
    return `${this.__(key, fallback)}: ${value === '' || value === undefined || value === null ? '-' : value}`;
  }

  date(value) {
    return formatDateValue(value, this.timezone, this.dateFormat);
  }
}

class ExporterCardPDF extends PDFExporterBase {
  constructor(boardId, listId, cardId, userLanguage, timezone, dateFormat) {
    super(userLanguage, timezone, dateFormat);
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

    // "I think all those other things we set in a card should be also present in
    // the pdf? Location, Voting, Checklists, Subtasks, Custom Fields,
    // Attachments, Comments,...?" - the three that were not fetched at all.
    const subtasks = await ReactiveCache.getCards(
      { parentId: this._cardId },
      { sort: { sort: 1 } },
    );
    const attachments = await ReactiveCache.getAttachments(
      { 'meta.cardId': this._cardId },
      { sort: { uploadedAt: 1 } },
    );
    const customFieldIds = (card.customFields || [])
      .map(field => field && field._id)
      .filter(Boolean);
    const customFieldsById = {};
    if (customFieldIds.length) {
      const definitions = await ReactiveCache.getCustomFields({
        _id: { $in: customFieldIds },
      });
      for (const definition of definitions || []) {
        customFieldsById[definition._id] = definition;
      }
    }

    const userIds = new Set([
      card.userId,
      ...(card.members || []),
      ...(card.assignees || []),
      ...comments.map(comment => comment.userId),
      ...((card.vote && card.vote.positive) || []),
      ...((card.vote && card.vote.negative) || []),
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
      subtasks,
      attachments,
      customFieldsById,
      usersById,
    };
  }

  // The vote as a reader can check it: the question, who was for and against, and
  // when it closes. Counts alone would not say who, which is the part a printed
  // card is kept for.
  _voteLines(card, usersById) {
    const vote = card.vote;
    if (!vote || (!vote.question && !(vote.positive || []).length && !(vote.negative || []).length)) {
      return [];
    }

    // The same six values the Excel export's Voting section carries, in the same
    // order and from the same keys.
    const names = ids => (ids || []).map(id => formatUser(usersById[id])).join(', ') || '-';
    const yesNo = value => (value ? this.__('yes', 'Yes') : this.__('no', 'No'));
    return [
      '',
      line(`${this.__('voting', 'Voting')}:`, true),
      this.field('vote-question', 'Voting question', vote.question || '-'),
      this.field('vote-public', 'Show who voted what', yesNo(vote.public)),
      this.field('card-end', 'End', this.date(vote.end)),
      this.field('vote-for-it', 'for it', (vote.positive || []).length),
      this.field('vote-against', 'against', (vote.negative || []).length),
      this.field('positiveVoteMembersPopup-title', 'Proponents', names(vote.positive)),
      this.field('negativeVoteMembersPopup-title', 'Opponents', names(vote.negative)),
    ];
  }

  // Planning Poker keeps its estimation and its deadline; the per-value member
  // lists are a board-side detail and would be a page of ids here.
  _pokerLines(card) {
    const poker = card.poker;
    if (!poker || (poker.estimation === undefined && !poker.end)) return [];

    const lines = ['', line(`${this.__('poker-question', 'Planning Poker')}:`, true)];
    lines.push(this.field('set-estimation', 'Set Estimation', poker.estimation ?? '-'));
    if (poker.end) lines.push(this.field('card-end', 'End', this.date(poker.end)));
    return lines;
  }

  async build(res) {
    const data = await this._getCardData();
    if (!data) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Card not found');
      return;
    }

    const {
      board, list, card, swimlane, checklists, checklistItemsByChecklistId,
      comments, subtasks, attachments, customFieldsById, usersById,
    } = data;
    const labelsById = Object.fromEntries(
      (board.labels || [])
        .filter(label => label && label._id)
        .map(label => [label._id, label.name || label.color || label._id]),
    );

    const names = ids => (ids || []).map(userId => formatUser(usersById[userId])).join(', ') || '-';

    // Every value goes through the document's own encoder as it is written
    // (models/lib/pdfDocument.js), so a title, a name or a comment with umlauts in
    // it arrives as those letters rather than as question marks (#6586).
    //
    // The ORDER, the section names and the i18n keys are the Excel card export's
    // (models/server/ExporterExcelCard.js): title, labels, people, board info,
    // dates, description, custom fields, checklists, subtasks, comments,
    // attachments, voting, poker. Two exports of one card that disagree about
    // what a card contains, or about what a field is called, is the same bug
    // twice - so they carry the same fields, in the same order, under the same
    // words, and only the medium differs.
    const lines = [
      line(card.title || '-', true),
      '',
      this.field('labels', 'Labels',
        (card.labelIds || []).map(labelId => labelsById[labelId] || labelId).join(', ') || '-'),
      this.field('creator', 'Creator', formatUser(usersById[card.userId])),
      this.field('assignees', 'Assignees', names(card.assignees)),
      this.field('members', 'Members', names(card.members)),
      '',
      this.field('board', 'Board', board.title || '-'),
      this.field('swimlane', 'Swimlane', swimlane?.title || '-'),
      this.field('list', 'List', list.title || '-'),
      this.field('card-number', 'Card number', card.cardNumber ?? '-'),
      this.field('requested-by', 'Requested By', card.requestedBy || '-'),
      this.field('assigned-by', 'Assigned By', card.assignedBy || '-'),
      '',
      this.field('createdAt', 'Created at', this.date(card.createdAt)),
      this.field('card-received', 'Received', this.date(card.receivedAt)),
      this.field('card-start', 'Start', this.date(card.startAt)),
      this.field('card-due', 'Due', this.date(card.dueAt)),
      this.field('card-end', 'End', this.date(card.endAt)),
      this.field('last-activity', 'Last activity', this.date(card.dateLastActivity)),
      this.field('card-spent', 'Spent Time', card.spentTime ?? '-'),
      this.field('overtime', 'Overtime', card.isOvertime ? this.__('yes', 'Yes') : this.__('no', 'No')),
      '',
      line(`${this.__('description', 'Description')}:`, true),
      // The one place the card's own markdown is RENDERED rather than flattened:
      // "so it gets transformed correct in the pdf output with bold, ...".
      ...wrapRichTextBlock(card.description || '-'),
    ];

    lines.push('', line(`${this.__('custom-fields', 'Custom Fields')}:`, true));
    const customFields = (card.customFields || []).filter(field => field && field._id);
    if (!customFields.length) {
      lines.push('-');
    } else {
      for (const field of customFields) {
        const definition = customFieldsById[field._id];
        const name = definition?.name || field._id;
        // A dropdown stores the id of its item, which says nothing on paper.
        let value = field.value;
        if (definition?.type === 'dropdown') {
          const item = (definition.settings?.dropdownItems || [])
            .find(entry => entry && entry._id === field.value);
          if (item) value = item.name;
        }
        lines.push(...wrapTextBlock(`${name}: ${formatCustomFieldValue(value, this.timezone, this.dateFormat)}`, '- '));
      }
    }

    lines.push('', line(`${this.__('checklists', 'Checklists')}:`, true));
    if (checklists.length === 0) {
      lines.push('-');
    } else {
      for (const checklist of checklists) {
        const items = checklistItemsByChecklistId[checklist._id] || [];
        // The same progress the Excel export shows beside a checklist title.
        const finished = items.filter(item => item.isFinished).length;
        lines.push(...wrapTextBlock(
          `${checklist.title || 'Checklist'} (${finished}/${items.length})`, '- '));
        if (items.length === 0) {
          lines.push('  (no items)');
          continue;
        }
        for (const item of items) {
          lines.push(...wrapTextBlock(`${item.isFinished ? '[x]' : '[ ]'} ${item.title || ''}`, '  '));
        }
      }
    }

    lines.push('', line(`${this.__('export-card-subtasks', 'Subtasks')}:`, true));
    if (!subtasks.length) {
      lines.push('-');
    } else {
      for (const subtask of subtasks) {
        lines.push(...wrapTextBlock(`${subtask.archived ? '[x]' : '[ ]'} ${subtask.title || ''}`, '- '));
      }
    }

    lines.push('', line(`${this.__('comments', 'Comments')}:`, true));
    if (comments.length === 0) {
      lines.push('-');
    } else {
      for (const comment of comments) {
        lines.push(
          ...wrapTextBlock(
            `${this.date(comment.createdAt)} ${formatUser(usersById[comment.userId])}: ${comment.text || ''}`,
            '- ',
          ),
        );
      }
    }

    lines.push('', line(`${this.__('attachments', 'Attachments')}:`, true));
    if (!attachments.length) {
      lines.push('-');
    } else {
      for (const attachment of attachments) {
        const name = attachment.name || attachment.meta?.name || attachment._id;
        const size = formatFileSize(attachment.size);
        lines.push(...wrapTextBlock(size ? `${name} (${size})` : `${name}`, '- '));
      }
    }

    lines.push(...this._voteLines(card, usersById));
    lines.push(...this._pokerLines(card));

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
// card's own markdown rendered rather than reproduced.
//
// The same report asked for what was missing: "I can't see in which swimlane a card
// is in that export, no tags". So the board is walked SWIMLANE by swimlane (when it
// has more than the one every board is created with), and each card carries its
// labels, members, assignees and dates.
class ExporterBoardPDF extends PDFExporterBase {
  constructor(boardId, userLanguage, timezone, dateFormat) {
    super(userLanguage, timezone, dateFormat);
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
        lines.push(line(this.field('swimlane', 'Swimlane', group.title), true));
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
          if (labels.length) {
            lines.push(...wrapTextBlock(this.field('labels', 'Labels', labels.join(', ')), '    '));
          }
          const members = (card.members || []).map(id => formatUser(usersById[id])).filter(Boolean);
          if (members.length) {
            lines.push(...wrapTextBlock(this.field('members', 'Members', members.join(', ')), '    '));
          }
          const assignees = (card.assignees || []).map(id => formatUser(usersById[id])).filter(Boolean);
          if (assignees.length) {
            lines.push(...wrapTextBlock(this.field('assignees', 'Assignees', assignees.join(', ')), '    '));
          }
          // The same labels the card export uses, from the same keys: this is
          // where "due" was lowercase and colonless while the card export said
          // "Due: ", and one vocabulary is what stops that happening again.
          const dates = [];
          if (card.receivedAt) dates.push(this.field('card-received', 'Received', this.date(card.receivedAt)));
          if (card.startAt) dates.push(this.field('card-start', 'Start', this.date(card.startAt)));
          if (card.dueAt) dates.push(this.field('card-due', 'Due', this.date(card.dueAt)));
          if (card.endAt) dates.push(this.field('card-end', 'End', this.date(card.endAt)));
          for (const entry of dates) lines.push(...wrapTextBlock(entry, '    '));
          if (card.description) {
            lines.push(...wrapRichTextBlock(card.description, '    '));
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
