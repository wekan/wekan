import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { formatDateForDisplay } from '/client/lib/dateDisplay';
import { buildFilters, buildHeader, buildRows, pageInfo } from '/models/lib/tablePage';
import { errorMessage } from '/client/lib/errorMessage';

// Admin Panel / Problems / Password length: the two settings and the table of
// accounts that sign in with a password shorter than the minimum
// (server/lib/shortPasswordLogins.js; docs/Features/Admin-Panel/Problems/Password-length.md).
const { addressValue, locationText, locationFlag } = require('/models/lib/addressReportColumns');
const { DEFAULT_FILTER } = require('/models/lib/shortPasswordLogins');

const PER_PAGE = 25;
const formatDate = date => (date ? formatDateForDisplay(date) : '');

// One cell per family: the address, then the city when a CDN in front of
// WeKan said where it is, and the country's flag before both.
const addressColumn = (labelKey, family) => ({
  labelKey,
  nowrap: true,
  value: row => [addressValue(row, family), locationText(row, family)].filter(Boolean).join(' '),
  flag: row => locationFlag(row, family),
});

const COLUMNS = [
  { labelKey: 'username', value: row => row.username || row.userId },
  { labelKey: 'password-length-first-login', nowrap: true, value: row => formatDate(row.firstAt) },
  addressColumn('event-ipv4', 'ipv4'),
  addressColumn('event-ipv6', 'ipv6'),
  { labelKey: 'password-length-last-login', nowrap: true, value: row => formatDate(row.at) },
  { labelKey: 'password-length-login-count', align: 'end', value: row => row.count || 0 },
  { labelKey: 'password-length-fixed', nowrap: true, value: row => formatDate(row.fixedAt) },
];

const FILTER_OPTIONS = [
  { value: 'short', labelKey: 'password-length-filter-short' },
  { value: 'fixed', labelKey: 'password-length-filter-fixed' },
  { value: 'all', labelKey: 'password-length-filter-all' },
];

Template.passwordLengthReport.onCreated(function () {
  this.rows = new ReactiveVar([]);
  this.total = new ReactiveVar(0);
  this.page = new ReactiveVar(1);
  this.search = new ReactiveVar('');
  this.filter = new ReactiveVar(DEFAULT_FILTER);
  this.sources = new ReactiveVar(null);
  // The working copy of the two settings, until Save.
  this.minLength = new ReactiveVar(8);
  this.enforce = new ReactiveVar(false);
  this.saved = new ReactiveVar(false);
  this.error = new ReactiveVar('');

  this.load = () => {
    Meteor.call('shortPasswordLoginsPage', {
      filter: this.filter.get(),
      search: this.search.get() || undefined,
      limit: PER_PAGE,
      skip: (this.page.get() - 1) * PER_PAGE,
    }, (error, result) => {
      if (error) return;
      this.rows.set((result && result.rows) || []);
      this.total.set((result && result.total) || 0);
    });
  };
  this.loadSettings = () => {
    Meteor.call('getAuthConfigSources', 'login', (error, result) => {
      if (error || !result) return;
      this.sources.set(result.sources || {});
      this.minLength.set(result.sources?.passwordMinLength?.value || 8);
      this.enforce.set(result.sources?.passwordMinLengthEnforce?.value === true);
    });
  };
  this.load();
  this.loadSettings();
});

Template.passwordLengthReport.helpers({
  minLength() { return Template.instance().minLength.get(); },
  enforce() { return Template.instance().enforce.get(); },
  saved() { return Template.instance().saved.get(); },
  saveError() { return Template.instance().error.get(); },
  // An environment variable set on the host is overridden by a save here; say
  // so, rather than let the admin wonder which one is in effect.
  fromEnvironment() {
    const sources = Template.instance().sources.get() || {};
    return ['passwordMinLength', 'passwordMinLengthEnforce'].some(key => sources[key]?.source === 'env');
  },
  tablePageData() {
    const t = Template.instance();
    const rows = t.rows.get() || [];
    const info = pageInfo(t.total.get(), t.page.get(), PER_PAGE);
    return {
      descKey: 'password-length-report-desc',
      emptyKey: 'password-length-no-results',
      searchTerm: t.search.get(),
      filters: buildFilters([{
        id: 'password-length-status', labelKey: 'status', current: t.filter.get(), options: FILTER_OPTIONS,
      }]),
      header: buildHeader(COLUMNS),
      rows: buildRows(rows, COLUMNS),
      rowCount: rows.length,
      totalCount: t.total.get(),
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
    };
  },
});

Template.passwordLengthReport.events({
  'input .js-password-min-length'(event, tmpl) {
    tmpl.minLength.set(parseInt(event.currentTarget.value, 10) || '');
    tmpl.saved.set(false);
  },
  'click .js-toggle-password-min-length-enforce'(event, tmpl) {
    event.preventDefault();
    tmpl.enforce.set(!tmpl.enforce.get());
    tmpl.saved.set(false);
  },
  'click .js-save-password-length'(event, tmpl) {
    event.preventDefault();
    Meteor.call('saveAuthConfigSettings', 'login', {
      passwordMinLength: tmpl.minLength.get() || null,
      passwordMinLengthEnforce: tmpl.enforce.get(),
    }, error => {
      tmpl.error.set(error ? errorMessage(error) : '');
      if (error) return;
      tmpl.saved.set(true);
      tmpl.loadSettings();
    });
  },
  'change .js-table-page-filter'(event, tmpl) {
    tmpl.filter.set(event.currentTarget.value || DEFAULT_FILTER);
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
