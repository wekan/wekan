import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { formatDateForDisplay } from '/client/lib/dateDisplay';
import { buildFilters, buildHeader, pageInfo } from '/models/lib/tablePage';
import { webhooksOff } from '/client/lib/webhooksSwitch';

// Admin Panel / Problems / Webhooks: every integration, its board or Global,
// who added it and what it sends (models/lib/webhooksSwitch.js
// webhookReportRow, server/webhooksSwitch.js webhooksReportPage).
const { DEFAULT_REPORT_FILTER } = require('/models/lib/webhooksSwitch');

const PER_PAGE = 25;

// The header of webhooksReportRow, in the same order as its cells.
const COLUMNS = [
  { labelKey: 'board' },
  { labelKey: 'owner' },
  { labelKey: 'webhook-title' },
  { labelKey: 'settings-group-url' },
  { labelKey: 'type' },
  { labelKey: 'status' },
  { labelKey: 'activities' },
  { labelKey: 'webhooks-report-token' },
  { labelKey: 'createdAt' },
];

const FILTER_OPTIONS = [
  { value: 'all', labelKey: 'webhooks-report-title' },
  { value: 'on', labelKey: 'webhooks-report-on' },
  { value: 'off', labelKey: 'webhooks-report-off' },
];

Template.webhooksReport.onCreated(function () {
  this.rows = new ReactiveVar([]);
  this.total = new ReactiveVar(0);
  this.page = new ReactiveVar(1);
  this.search = new ReactiveVar('');
  this.filter = new ReactiveVar(DEFAULT_REPORT_FILTER);
  this.load = () => {
    Meteor.call('webhooksReportPage', {
      filter: this.filter.get(),
      search: this.search.get() || '',
      limit: PER_PAGE,
      skip: (this.page.get() - 1) * PER_PAGE,
    }, (error, result) => {
      if (error) return;
      this.rows.set((result && result.rows) || []);
      this.total.set((result && result.total) || 0);
    });
  };
  this.load();
});

Template.webhooksReport.helpers({
  // The report still lists them while they are turned off: they are kept.
  reportOff() { return webhooksOff(); },
  tablePageData() {
    const t = Template.instance();
    const info = pageInfo(t.total.get(), t.page.get(), PER_PAGE);
    const docs = (t.rows.get() || []).map(row => ({
      ...row,
      boardPath: row.boardId ? FlowRouter.path('board', { id: row.boardId, slug: row.boardSlug || 'board' }) : '',
      activitiesText: (row.activities || []).join(', '),
      createdText: row.createdAt ? formatDateForDisplay(row.createdAt) : '',
    }));
    return {
      descKey: 'webhooks-report-desc',
      emptyKey: 'webhooks-report-no-results',
      searchTerm: t.search.get(),
      filters: buildFilters([{
        id: 'webhooks-report-status', labelKey: 'status', current: t.filter.get(), options: FILTER_OPTIONS,
      }]),
      header: buildHeader(COLUMNS),
      rowTemplate: 'webhooksReportRow',
      docs,
      rowCount: docs.length,
      total: t.total.get(),
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
    };
  },
});

Template.webhooksReport.events({
  'change .js-table-page-filter'(event, tmpl) {
    tmpl.filter.set(event.currentTarget.value || DEFAULT_REPORT_FILTER);
    tmpl.page.set(1);
    tmpl.load();
  },
  'click .js-table-page-prev'(event, tmpl) {
    event.preventDefault();
    if (tmpl.page.get() > 1) { tmpl.page.set(tmpl.page.get() - 1); tmpl.load(); }
  },
  'click .js-table-page-next'(event, tmpl) {
    event.preventDefault();
    const info = pageInfo(tmpl.total.get(), tmpl.page.get(), PER_PAGE);
    if (info.hasNext) { tmpl.page.set(tmpl.page.get() + 1); tmpl.load(); }
  },
  'keydown .js-table-page-search'(event, tmpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      tmpl.search.set(event.currentTarget.value || '');
      tmpl.page.set(1);
      tmpl.load();
    }
  },
});
