'use strict';

// A card, as a DOCUMENT - one layout, drawn by both exporters.
//
// THE RULE THIS SERVES: the same functions, layouts and templates for every PDF
// and Excel export, so that there is no duplicated code
// (docs/Features/ImportExport/One-Card-Layout.md).
//
// The layout is the one "Export card to Excel" already draws, because it is the
// one that was designed: a title, meta rows of label/value pairs, then a section
// per part of the card - description, custom fields, checklists, subtasks,
// comments, attachments, voting, poker - each under a filled header. What was
// missing is that only ONE exporter could draw it. The Excel code knew the
// layout AND how to write a worksheet, so the PDF could not use it without
// becoming a worksheet, and the PDF grew its own layout instead: a list of
// monospaced lines with none of the structure.
//
// So the layout is described here, once, in blocks that name no colour, no
// column letter and no font size:
//
//   { type: 'title',   runs }                     the card's name
//   { type: 'section', key, title }               a filled header bar
//   { type: 'meta',    pairs: [[label, value]] }  up to three label/value pairs
//   { type: 'text',    blocks }                   markdown, as parsed blocks
//   { type: 'list',    items: [{ runs, done, marker, level }] }
//   { type: 'rows',    header, rows }             a small bordered grid
//   { type: 'images',  images: [{ name, ext, data }] }
//   { type: 'note',    runs }                     one line, quiet
//
// A renderer decides what those look like in its medium, and only the renderer
// knows the difference between a spreadsheet and a page. Nothing here can put a
// colour in a PDF or a page break in a worksheet, which is the point.
//
// PURE. No Meteor, no database, no ExcelJS: it is given a card and the rows that
// belong to it, and returns an array. That is what lets both exporters be
// checked against the same document, and lets this be tested as arithmetic.

const { markdownBlocks } = require('./exportMarkdown');

const EMPTY_STYLE = { bold: false, italic: false, code: false, strike: false, link: '' };
const plainRuns = text => (text ? [{ text: String(text), ...EMPTY_STYLE }] : []);

// A section is only in the document when the export asked for it. `fields` is
// the popup's selection - the same `?fields=` both exporters already read - so
// unticking "Comments" removes the section from BOTH formats by removing it
// from the document, rather than from two `if`s that can disagree.
function wanted(fields, key) {
  if (!fields || !fields.length) return true;      // no selection means all of it
  return fields.includes(key);
}

// The card's own header: the title, then the meta pairs the Excel layout puts
// under it. `labels` are prepared strings - a colour name means nothing here.
function cardHeaderBlocks(card, data, fields, t) {
  const blocks = [{ type: 'title', runs: plainRuns(card.title || '') }];
  const pairs = [];
  const add = (labelKey, value) => {
    if (value === undefined || value === null || value === '') return;
    pairs.push([t(labelKey), String(value)]);
  };

  if (wanted(fields, 'board-info')) {
    add('board', data.boardTitle);
    add('list', data.listTitle);
    add('swimlane', data.swimlaneTitle);
  }
  if (wanted(fields, 'people')) {
    add('createdBy', data.createdBy);
    add('members', (data.members || []).join(', '));
    add('assignees', (data.assignees || []).join(', '));
  }
  if (wanted(fields, 'dates')) {
    add('createdAt', data.createdAt);
    add('receivedAt', data.receivedAt);
    add('startAt', data.startAt);
    add('dueAt', data.dueAt);
    add('endAt', data.endAt);
  }
  if (wanted(fields, 'labels')) add('labels', (data.labels || []).join(', '));

  // Three to a row, which is what the Excel layout does with A–F.
  for (let i = 0; i < pairs.length; i += 3) {
    blocks.push({ type: 'meta', pairs: pairs.slice(i, i + 3) });
  }
  return blocks;
}

// The whole card. `data` is what the exporters already gather - titles, names,
// dates as strings, and the rows of each collection - so this adds no queries
// and knows nothing about where any of it came from.
function buildCardDocument(card, data, fields, translate) {
  // A card must always export, so every argument is taken as missing rather
  // than as wrong: an exporter that has not loaded a collection yet passes
  // nothing for it, and a document with an empty section is still a document.
  const rows = data || {};
  const selection = Array.isArray(fields) ? fields : [];
  const t = typeof translate === 'function' ? translate : key => key;
  const blocks = cardHeaderBlocks(card || {}, rows, selection, t);
  const section = (key, titleKey) => blocks.push({ type: 'section', key, title: t(titleKey) });

  if (wanted(selection, 'description')) {
    section('description', 'description');
    blocks.push({ type: 'text', blocks: markdownBlocks((card && card.description) || '') });
  }

  if (wanted(selection, 'custom-fields')) {
    section('custom-fields', 'custom-fields');
    const pairs = (rows.customFields || []).map(f => [f.name, f.value]);
    if (!pairs.length) blocks.push({ type: 'note', runs: [] });
    for (let i = 0; i < pairs.length; i += 3) {
      blocks.push({ type: 'meta', pairs: pairs.slice(i, i + 3) });
    }
  }

  if (wanted(selection, 'checklists')) {
    section('checklists', 'checklists');
    for (const checklist of rows.checklists || []) {
      blocks.push({ type: 'note', runs: [{ text: checklist.title || '', ...EMPTY_STYLE, bold: true }] });
      blocks.push({
        type: 'list',
        items: (checklist.items || []).map(item => ({
          // The item's title is markdown; the box in front of it is the
          // export's own mark, which is why the two are separate.
          runs: markdownBlocks(item.title || '').flatMap(b => b.runs || []),
          done: !!item.isFinished,
          marker: item.isFinished ? '[x]' : '[ ]',
          level: 0,
        })),
      });
    }
  }

  if (wanted(selection, 'subtasks')) {
    section('subtasks', 'export-card-subtasks');
    blocks.push({
      type: 'list',
      items: (rows.subtasks || []).map(subtask => ({
        runs: plainRuns(subtask.title || ''),
        done: !!subtask.archived,
        marker: subtask.archived ? '[x]' : '[ ]',
        level: 0,
      })),
    });
  }

  if (wanted(selection, 'comments')) {
    section('comments', 'comments');
    blocks.push({
      type: 'rows',
      header: [t('date'), t('comment')],
      rows: (rows.comments || []).map(comment => [
        plainRuns(comment.date || ''),
        [
          ...(comment.author ? [{ text: `${comment.author}: `, ...EMPTY_STYLE, bold: true }] : []),
          ...markdownBlocks(comment.text || '').flatMap(b => b.runs || []),
        ],
      ]),
    });
  }

  if (wanted(selection, 'attachments')) {
    section('attachments', 'attachments');
    blocks.push({
      type: 'list',
      items: (rows.attachments || []).map(attachment => ({
        runs: plainRuns(attachment.size
          ? `${attachment.name} (${attachment.size})`
          : attachment.name || ''),
        done: false,
        marker: '-',
        level: 0,
      })),
    });
    // The pictures themselves, when the exporter could read them. Both formats
    // draw the same ones: a renderer that cannot embed a kind says so rather
    // than dropping it (see the design doc).
    const images = (rows.images || []).filter(image => image && image.data);
    if (images.length) blocks.push({ type: 'images', images });
  }

  if (wanted(selection, 'voting') && rows.voting) {
    section('voting', 'voting');
    blocks.push({ type: 'meta', pairs: rows.voting });
  }

  if (wanted(selection, 'poker') && rows.poker) {
    section('poker', 'poker-question');
    blocks.push({ type: 'meta', pairs: rows.poker });
  }

  return blocks;
}

// The sections a document contains, in order - what a test asserts against, and
// what a renderer can use to build a table of contents.
const documentSections = document => (document || [])
  .filter(block => block.type === 'section')
  .map(block => block.key);

module.exports = {
  buildCardDocument,
  cardHeaderBlocks,
  documentSections,
  wanted,
};
