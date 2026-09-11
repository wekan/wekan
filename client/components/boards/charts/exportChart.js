// ITS OWN TEMPLATE FIRST - same reason as exportScope.js: this module is
// imported by several views, any of which can be evaluated before
// client/features/boards.js reaches the .jade.
import './exportChart.jade';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Accounts } from 'meteor/accounts-base';
import { TAPi18n } from '/imports/i18n';

// ONE url builder for every chart export, every view. There used to be five
// copies of this (gantt.js, frappeGantt.js, dhtmlxGantt.js, timeView.js,
// boardCharts.js), each behind its own pair of untranslated "Export to PDF"
// / "Export to Excel" links; a query parameter added to one was missing from
// the other four. models/exportCharts.js serves
// /api/boards/:boardId/charts/:chartKey/exportPDF and .../exportExcel.
export function chartExportUrl(chartKey, format) {
  const boardId = Session.get('currentBoard');
  if (!boardId || !chartKey) return '';
  const path = format === 'PDF' ? 'exportPDF' : 'exportExcel';
  const user = Meteor.user();
  const params = new URLSearchParams({
    authToken: Accounts._storedLoginToken() || '',
    lang: TAPi18n.getLanguage ? TAPi18n.getLanguage() : 'en',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    dateFormat: (user && user.profile && user.profile.dateFormat) || 'YYYY-MM-DD',
  });
  return `/api/boards/${boardId}/charts/${chartKey}/${path}?${params.toString()}`;
}

// The same two file formats, icons and labels the board export popup's
// "files" group offers (exportScope.js EXPORT_FORMAT_GROUPS).
const CHART_EXPORT_FORMATS = [
  { key: 'pdf', icon: 'fa-file-pdf-o', label: 'PDF', format: 'PDF' },
  { key: 'excel', icon: 'fa-file-excel-o', label: 'Excel', format: 'Excel' },
];

Template.exportChartPopup.helpers({
  formats() {
    const chartKey = Template.currentData().chartKey;
    return CHART_EXPORT_FORMATS.map(entry => ({
      ...entry,
      url: chartExportUrl(chartKey, entry.format),
    }));
  },
});

// Every chart view renders the same `a.js-export-chart(data-chart-key=...)`
// button; one delegated handler opens the popup for all of them with that
// chart key as the popup's data context, rather than each view carrying its
// own event map entry to keep in sync.
Meteor.startup(() => {
  $(document).on('click', '.js-export-chart', function (evt) {
    evt.preventDefault();
    const chartKey = evt.currentTarget.getAttribute('data-chart-key');
    Popup.open('exportChart').call({ chartKey }, evt);
  });
});
