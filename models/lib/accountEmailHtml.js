'use strict';

// #4434: account e-mails - reset password, verify e-mail, enroll account and
// board invitations - in the same clear HTML layout notifications use by
// default, beside the plain text they always had (sent as the text part).
//
// The HTML is built from the SAME localized text, so no translation changes:
// each blank-line-separated paragraph becomes a <p>, and a paragraph that is
// the link becomes a button. Every piece of text is escaped first; the only
// markup is the layout's own, and only an http(s) address becomes a link.
// Pure: tests/accountEmailHtml.test.cjs.

const { escapeEmailHtml } = require('./emailNotificationSafety');

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function linkify(escapedLine) {
  // Runs on ESCAPED text: an address can no longer contain < > " or ', so
  // what is matched is placed in the href and the link text as it is.
  return escapedLine.replace(URL_PATTERN, match => {
    const raw = match.replaceAll('&amp;', '&');
    return isHttpUrl(raw) ? `<a href="${match}" style="color:#0b6bcb">${match}</a>` : match;
  });
}

function renderAccountEmailHtml({ text, siteName } = {}) {
  const paragraphs = String(text ?? '').replace(/\r\n/g, '\n').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const body = paragraphs.map(paragraph => {
    if (isHttpUrl(paragraph) && !/\s/.test(paragraph)) {
      const href = escapeEmailHtml(paragraph);
      return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;padding:12px 20px;background:#0b6bcb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;word-break:break-all">${href}</a></p>`;
    }
    const lines = paragraph.split('\n').map(line => linkify(escapeEmailHtml(line)));
    return `<p style="margin:0 0 16px 0">${lines.join('<br/>\n')}</p>`;
  }).join('\n');
  const header = siteName
    ? `<div style="font-size:18px;font-weight:bold;margin:0 0 20px 0">${escapeEmailHtml(siteName)}</div>\n`
    : '';
  return '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#172b4d;max-width:600px;margin:0 auto;padding:24px">\n'
    + `${header}${body}\n</div>`;
}

module.exports = { renderAccountEmailHtml, isHttpUrl };
