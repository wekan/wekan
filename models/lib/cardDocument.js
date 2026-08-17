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

// The English word for each label, so a missing translation shows a word rather
// than the key. Both formats take their labels from here, which is also what
// stops a PDF saying "Due" where a spreadsheet says "Due date".
const FALLBACKS = {
  board: 'Board', list: 'List', swimlane: 'Swimlane', 'card-number': 'Card number',
  creator: 'Created by', members: 'Members', assignees: 'Assignees',
  'requested-by': 'Requested by', 'assigned-by': 'Assigned by',
  createdAt: 'Created at', 'card-received': 'Received', 'card-start': 'Start',
  'card-due': 'Due', 'card-end': 'End', 'last-activity': 'Last activity',
  'card-spent': 'Spent time', overtime: 'Overtime', labels: 'Labels',
  description: 'Description', 'custom-fields': 'Custom fields',
  checklists: 'Checklists', 'export-card-subtasks': 'Subtasks',
  comments: 'Comments', attachments: 'Attachments', voting: 'Voting',
  'poker-question': 'Poker', date: 'Date', comment: 'Comment',
  stickers: 'Stickers', location: 'Location', 'card-dependencies': 'Dependencies',
  sort: 'Sort', 'location-name': 'Location name', 'location-address': 'Address',
  'location-latitude': 'Latitude', 'location-longitude': 'Longitude',
};

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

function cardLocations(card = {}) {
  if (Array.isArray(card.locations) && card.locations.length) return card.locations;
  if (card.locationName || card.locationAddress
      || typeof card.locationLatitude === 'number'
      || typeof card.locationLongitude === 'number') {
    return [{
      name: card.locationName || '', address: card.locationAddress || '',
      latitude: card.locationLatitude, longitude: card.locationLongitude,
    }];
  }
  return [];
}

// The card's own header: the title, then the meta pairs the Excel layout puts
// under it. `labels` are prepared strings - a colour name means nothing here.
function cardHeaderBlocks(card, data, fields, translate) {
  const t = key => {
    const out = typeof translate === 'function' ? translate(key, FALLBACKS[key] || key) : key;
    return out || FALLBACKS[key] || key;
  };
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
    add('card-number', data.cardNumber);
  }
  if (wanted(fields, 'people')) {
    add('creator', data.createdBy);
    add('members', (data.members || []).join(', '));
    add('assignees', (data.assignees || []).join(', '));
    // Requested by / assigned by are people too, and they are a card's own
    // record of who asked for it - tests/requestedAssignedByRoundTrip.test.cjs
    // exists because they have been lost from an export before.
    add('requested-by', [...(data.requesters || []), data.requestedBy].filter(Boolean).join(', '));
    add('assigned-by', [...(data.assigners || []), data.assignedBy].filter(Boolean).join(', '));
  }
  if (wanted(fields, 'dates')) {
    add('createdAt', data.createdAt);
    add('card-received', data.receivedAt);
    add('card-start', data.startAt);
    add('card-due', data.dueAt);
    add('card-end', data.endAt);
    add('last-activity', data.modifiedAt);
    add('card-spent', data.spentTime);
    add('overtime', data.overtime);
  }
  if (wanted(fields, 'labels')) add('labels', (data.labels || []).join(', '));
  if (wanted(fields, 'sort')) add('sort', card.sort);

  // Three to a row, which is what the Excel layout does with A–F.
  for (let i = 0; i < pairs.length; i += 3) {
    const slice = pairs.slice(i, i + 3);
    const block = { type: 'meta', pairs: slice };
    if (slice.some(pair => pair[0] === t('labels')) && (data.labelDetails || []).length) {
      block.labelTitle = t('labels');
      block.labelDetails = data.labelDetails;
    }
    blocks.push(block);
  }
  return blocks;
}

// WHAT COUNTS AS EMPTY, in one place.
//
// "Only those fields that have data should be added": an export should not carry
// a Comments heading with nothing under it, or a Custom fields section for a
// card that has none. The rule belongs HERE rather than in each exporter,
// because "empty" is a judgement - a checklist with no items is empty, a
// checklist whose items are all unticked is not - and two exporters answering it
// separately is how a PDF and a spreadsheet of the same card come to contain
// different sections.
//
// `data` is the loose shape the exporters already gather. A section nobody has
// data for is simply absent from the document, so neither renderer needs to know
// this rule at all.
function hasSectionData(key, card = {}, data = {}) {
  card = card || {};
  data = data || {};
  const some = list => Array.isArray(list) && list.length > 0;
  switch (key) {
    case 'description':
      return !!String((card && card.description) || '').trim();
    case 'custom-fields':
      // A field with no value is not data. A card usually has definitions
      // attached with nothing filled in, and a section of empty labels is the
      // noise this removes.
      return (data.customFields || []).some(f => f && f.value !== undefined
        && f.value !== null && String(f.value).trim() !== '');
    case 'checklists':
      return (data.checklists || []).some(c => c && (String(c.title || '').trim()
        || some(c.items)));
    case 'subtasks':
      return some(data.subtasks);
    case 'comments':
      return (data.comments || []).some(c => c && String(c.text || '').trim());
    case 'attachments':
      return some(data.attachments) || some(data.images);
    case 'voting':
      return !!data.voting && some(data.voting);
    case 'poker':
      return !!data.poker && some(data.poker);
    case 'stickers':
      return some(card.stickers);
    case 'locations':
      return cardLocations(card).length > 0;
    case 'dependencies':
      return some(card.cardDependencies);
    default:
      return true;
  }
}

// The sections this card actually has something to say - what a renderer draws,
// and what a test can compare between the two formats.
function sectionsWithData(card, data, fields) {
  return ['description', 'custom-fields', 'checklists', 'subtasks', 'comments',
    'attachments', 'voting', 'poker', 'stickers', 'locations', 'dependencies']
    .filter(key => wanted(fields, key) && hasSectionData(key, card, data));
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
  const translator = typeof translate === 'function' ? translate : key => key;
  const t = key => translator(key, FALLBACKS[key] || key) || FALLBACKS[key] || key;
  const blocks = cardHeaderBlocks(card || {}, rows, selection, t);
  const section = (key, titleKey) => blocks.push({ type: 'section', key, title: t(titleKey) });

  if (wanted(selection, 'stickers') && hasSectionData('stickers', card, rows)) {
    section('stickers', 'stickers');
    blocks.push({
      type: 'list',
      items: (card.stickers || []).map(sticker => ({
        runs: plainRuns([
          sticker.name || '', sticker.icon || '', sticker.color || '', sticker.highlight || '',
        ].filter(Boolean).join(' - ')),
        marker: '-', level: 0,
      })),
    });
  }

  if (wanted(selection, 'locations') && hasSectionData('locations', card, rows)) {
    section('locations', 'location');
    cardLocations(card).forEach((location, index) => {
      blocks.push({
        type: 'note',
        runs: plainRuns(`${t('location')} ${index + 1}`),
      });
      const pairs = [
        [t('location-name'), location.name],
        [t('location-address'), location.address],
        [t('location-latitude'), location.latitude],
        [t('location-longitude'), location.longitude],
      ].filter(([, value]) => value !== undefined && value !== null && value !== '');
      for (let at = 0; at < pairs.length; at += 3) {
        blocks.push({ type: 'meta', pairs: pairs.slice(at, at + 3) });
      }
    });
  }

  if (wanted(selection, 'dependencies') && hasSectionData('dependencies', card, rows)) {
    section('dependencies', 'card-dependencies');
    blocks.push({
      type: 'list',
      items: (card.cardDependencies || []).map(dependency => {
        const value = typeof dependency === 'string' ? dependency : [
          dependency.cardId, dependency.type, dependency.icon, dependency.color,
        ].filter(Boolean).join(' - ');
        return { runs: plainRuns(value), marker: '-', level: 0 };
      }),
    });
  }

  if (wanted(selection, 'description') && hasSectionData('description', card, rows)) {
    section('description', 'description');
    blocks.push({ type: 'text', blocks: markdownBlocks((card && card.description) || '') });
  }

  if (wanted(selection, 'custom-fields') && hasSectionData('custom-fields', card, rows)) {
    section('custom-fields', 'custom-fields');
    const pairs = (rows.customFields || [])
      .filter(f => f && f.value !== undefined && f.value !== null && String(f.value).trim() !== '')
      .map(f => [f.name, f.value]);
    for (let i = 0; i < pairs.length; i += 3) {
      blocks.push({ type: 'meta', pairs: pairs.slice(i, i + 3) });
    }
  }

  if (wanted(selection, 'checklists') && hasSectionData('checklists', card, rows)) {
    section('checklists', 'checklists');
    for (const checklist of rows.checklists || []) {
      const items = checklist.items || [];
      blocks.push({
        type: 'note',
        runs: [{ text: checklist.title || '', ...EMPTY_STYLE, bold: true }],
        progress: { done: items.filter(item => item && item.isFinished).length, total: items.length },
      });
      blocks.push({
        type: 'list',
        items: items.map(item => ({
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

  if (wanted(selection, 'subtasks') && hasSectionData('subtasks', card, rows)) {
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

  if (wanted(selection, 'comments') && hasSectionData('comments', card, rows)) {
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

  if (wanted(selection, 'attachments') && hasSectionData('attachments', card, rows)) {
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
        attachment,
      })),
    });
    // The pictures themselves, when the exporter could read them. Both formats
    // draw the same ones: a renderer that cannot embed a kind says so rather
    // than dropping it (see the design doc).
    const images = (rows.images || []).filter(image => image && image.data);
    if (images.length) blocks.push({ type: 'images', images });
  }

  if (wanted(selection, 'voting') && hasSectionData('voting', card, rows)) {
    section('voting', 'voting');
    blocks.push({ type: 'meta', pairs: rows.voting });
  }

  if (wanted(selection, 'poker') && hasSectionData('poker', card, rows)) {
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
  FALLBACKS,
  buildCardDocument,
  cardHeaderBlocks,
  documentSections,
  hasSectionData,
  sectionsWithData,
  cardLocations,
  wanted,
};
