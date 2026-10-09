// The column mapping step of the CSV/TSV and Excel imports. After the file is
// read and before anything is imported, the page shows every card field with a
// choice of the file's columns, pre-filled from the column names
// (models/lib/csvImportMapping.js, which also knows the names WeKan's own
// exports write in every language). A file with no list column is not
// imported as one list per row: the person chooses a column, or names the one
// list every card goes into. What was chosen is sent with the import as
// data.csvMapping, and the server checks it against the file again.
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { CSV_IMPORT_FIELDS, csvSeparatorOf, normalizeHeader } from '/models/lib/csvImportMapping';
import { csvGetMembersToMap } from './csvMembersMapper';

const Papa = require('papaparse');

// The import template instance the step belongs to: one import page at a time.
let activeImportTpl = null;

// CSV/TSV text as rows. A text whose first line has a tab is parsed with tab
// as the separator, so a TSV value that holds a comma stays one value.
export function parseCsvImportText(text) {
  const input = String(text == null ? '' : text).replace(/^﻿/, '');
  const result = Papa.parse(input, { delimiter: csvSeparatorOf(input), skipEmptyLines: 'greedy' });
  return result && Array.isArray(result.data) ? result.data : [];
}

// Show the step. `rows` for a CSV/TSV text (read in the browser), or
// `excelBase64` for a workbook (read on the server, which answers with the
// first board sheet's header and the sheets it found). `membersStep`: the
// "map members" step follows this one.
export async function startCsvMapping(importTpl, { rows, excelBase64, membersStep = false }) {
  activeImportTpl = importTpl;
  if (!importTpl.csvMappingState) importTpl.csvMappingState = new ReactiveVar(null);
  importTpl.csvMapping = null;
  importTpl.csvMappingState.set({ loading: true });
  const previousSteps = importTpl.steps;
  importTpl.steps = ['importTextarea', 'importCsvMapping', ...(membersStep ? ['importMapMembers'] : [])];
  importTpl._currentStepIndex.set(1);
  try {
    let preview;
    if (excelBase64) {
      preview = await Meteor.callAsync('excelImportPreview', excelBase64);
    } else {
      const header = (rows && rows[0]) || [];
      preview = {
        header,
        samples: rows.slice(1, 4),
        boards: [],
        skipped: [],
        mapping: await Meteor.callAsync('csvImportGuessMapping', header),
      };
    }
    const mapping = {
      columns: { ...((preview.mapping && preview.mapping.columns) || {}) },
      customFieldColumns: [],
      listName: TAPi18n.__('scrum-category-todo'),
    };
    importTpl.csvMappingState.set({
      loading: false,
      header: (preview.header || []).map(cell => (cell == null ? '' : String(cell))),
      samples: preview.samples || [],
      boards: preview.boards || [],
      skipped: preview.skipped || [],
      rows: rows || null,
      membersStep,
      mapping,
    });
  } catch (error) {
    importTpl.steps = previousSteps;
    importTpl._currentStepIndex.set(0);
    importTpl.setError((error && error.error) || 'error-csv-schema');
  }
}

// What finishImport sends in its data argument.
export function csvMappingData(importTpl) {
  return importTpl && importTpl.csvMapping ? { csvMapping: importTpl.csvMapping } : {};
}

const isCustomFieldHeader = name => normalizeHeader(name).startsWith('customfield');

function columnText(state, index) {
  const name = state.header[index] || TAPi18n.__('csv-mapping-column-number', { number: index + 1 });
  const sample = (state.samples || []).map(row => (row && row[index] != null ? String(row[index]).trim() : ''))
    .find(Boolean);
  if (!sample) return name;
  const short = sample.length > 40 ? `${sample.slice(0, 40)}…` : sample;
  return `${name} (${short})`;
}

Template.importCsvMapping.onCreated(function () {
  this.importTpl = activeImportTpl;
  this.chosen = new ReactiveVar(null);
  this.mappingError = new ReactiveVar('');
  this.state = () => (this.importTpl && this.importTpl.csvMappingState && this.importTpl.csvMappingState.get()) || {};
  // The choices start from the server's guess, once it has answered.
  this.autorun(() => {
    const state = this.state();
    if (!state.loading && state.mapping && !this.chosen.get()) {
      this.chosen.set(JSON.parse(JSON.stringify(state.mapping)));
    }
  });
});

Template.importCsvMapping.helpers({
  loading() {
    const tpl = Template.instance();
    return tpl.state().loading || !tpl.chosen.get();
  },
  fields() {
    return CSV_IMPORT_FIELDS.map(({ field, label }) => ({ field, label }));
  },
  columns() {
    const state = Template.instance().state();
    return (state.header || []).map((name, index) => ({ index, text: columnText(state, index) }));
  },
  isChosen(field, index) {
    const chosen = Template.instance().chosen.get();
    return !!chosen && chosen.columns[field] === index;
  },
  listMissing() {
    const chosen = Template.instance().chosen.get();
    return !!chosen && chosen.columns.list === undefined;
  },
  listName() {
    const chosen = Template.instance().chosen.get();
    return chosen ? chosen.listName : '';
  },
  // The columns no field uses, offered as text custom fields. WeKan's own
  // CustomField-... columns are custom fields already.
  extraColumns() {
    const tpl = Template.instance();
    const state = tpl.state();
    const chosen = tpl.chosen.get();
    if (!chosen) return [];
    const used = new Set(Object.values(chosen.columns));
    return (state.header || [])
      .map((name, index) => ({ name, index }))
      .filter(({ name, index }) => !used.has(index) && !isCustomFieldHeader(name))
      .map(({ index }) => ({ index, text: columnText(state, index), checked: chosen.customFieldColumns.includes(index) }));
  },
  boardsText() {
    const boards = Template.instance().state().boards || [];
    return boards.length > 1 ? boards.map(board => board.title || board.sheet).join(', ') : '';
  },
  skippedText() {
    return (Template.instance().state().skipped || []).join(', ');
  },
  mappingError() {
    return Template.instance().mappingError.get();
  },
  continueLabel() {
    return Template.instance().state().membersStep ? 'next' : 'import';
  },
});

Template.importCsvMapping.events({
  'change .js-csv-map-field'(event, tpl) {
    const chosen = { ...tpl.chosen.get() };
    chosen.columns = { ...chosen.columns };
    const field = event.currentTarget.dataset.field;
    const value = event.currentTarget.value;
    if (value === '') delete chosen.columns[field];
    else {
      const index = parseInt(value, 10);
      chosen.columns[field] = index;
      chosen.customFieldColumns = chosen.customFieldColumns.filter(i => i !== index);
    }
    tpl.chosen.set(chosen);
  },
  'input .js-csv-map-list-name'(event, tpl) {
    tpl.chosen.set({ ...tpl.chosen.get(), listName: event.currentTarget.value });
  },
  'click .js-csv-map-custom-column'(event, tpl) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index, 10);
    const chosen = { ...tpl.chosen.get() };
    chosen.customFieldColumns = chosen.customFieldColumns.includes(index)
      ? chosen.customFieldColumns.filter(i => i !== index)
      : [...chosen.customFieldColumns, index];
    tpl.chosen.set(chosen);
  },
  'click .js-csv-mapping-import'(event, tpl) {
    event.preventDefault();
    const chosen = tpl.chosen.get();
    const importTpl = tpl.importTpl;
    if (!chosen || !importTpl) return;
    if (chosen.columns.title === undefined) {
      tpl.mappingError.set('csv-mapping-title-required');
      return;
    }
    const listName = String(chosen.listName || '').trim();
    if (chosen.columns.list === undefined && !listName) {
      tpl.mappingError.set('csv-mapping-list-required');
      return;
    }
    tpl.mappingError.set('');
    importTpl.csvMapping = {
      columns: chosen.columns,
      customFieldColumns: chosen.customFieldColumns,
      ...(chosen.columns.list === undefined ? { listName } : {}),
    };
    const state = tpl.state();
    // The people to map are the ones in the columns chosen for people.
    if (state.rows && state.membersStep) {
      importTpl.membersToMap.set(csvGetMembersToMap(state.rows, chosen.columns));
    }
    importTpl.nextStep();
  },
});
