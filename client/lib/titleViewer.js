import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { ReactiveCache } from '/imports/reactiveCache';
import './titleViewer.jade';

// Third-party charts do not mount Blaze fields. Render their HTML through
// the same viewer so Markdown, emoji and Admin Panel policies stay shared.
// toHTMLWithData disposes its temporary view after producing the markup.
export function titleViewerHtml(value) {
  // Read in the chart's outer computation: temporary Blaze rendering owns
  // its own computation, so it cannot keep the chart reactive by itself.
  ReactiveCache.getCurrentSetting();
  return Blaze.toHTMLWithData(Template.chartTitleViewer, { value: value || '' });
}

export function escapeTitleText(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

// SVG text labels cannot contain HTML blocks. Keep the viewer's rendered
// text/emoji, escaping it because Frappe inserts the label via innerHTML.
export function titleViewerText(value) {
  const container = document.createElement('div');
  container.innerHTML = titleViewerHtml(value);
  return container.textContent;
}

export function titleViewerSvgText(value) {
  return escapeTitleText(titleViewerText(value));
}
