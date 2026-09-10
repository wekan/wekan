'use strict';

function escapeEmailHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeEmailSubject(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

// #3118: an HTML-formatted notification email must render the card/board URL
// as a real clickable <a href> link, not as plain text that merely looks like
// one. Every dynamic piece is escaped BEFORE it is placed into the markup, so
// the subject/actor name/description can never inject markup of their own;
// only the wrapping <a href="..."> tag itself is real HTML. Pulled out as a
// pure function (no Meteor/TAPi18n dependency) so it can be unit tested.
function buildHtmlNotificationLine({ existing, subject, actorName, descriptionText, url }) {
  const htmlHead = existing
    ? `<br/>\n${escapeEmailHtml(subject)}<br/>\n`
    : '';
  const safeUrl = url || '';
  const link = safeUrl
    ? `<a href="${escapeEmailHtml(safeUrl)}">${escapeEmailHtml(safeUrl)}</a>`
    : '';
  return `${htmlHead}${escapeEmailHtml(actorName || '')} ${escapeEmailHtml(
    descriptionText || '',
  )}${link ? `<br/>\n${link}` : ''}`;
}

module.exports = { escapeEmailHtml, safeEmailSubject, buildHtmlNotificationLine };
