// Mail: mbox (RFC 4155 - Thunderbird, Apple Mail, mutt, Gmail through Google
// Takeout) and single .eml messages (RFC 5322), read into a board whose cards
// are mail in Board View / Email, and a board written as an .mbox. Plain
// JavaScript, no Meteor: tests/mailFormat.test.cjs runs it in Node. Decoding
// MIME (encoded words, quoted-printable, base64, multipart) is the server's,
// with mailparser (server/lib/mailImport.js); this module receives the decoded
// messages:
//
//   { messageId, inReplyTo, references: [id], from: { name, address },
//     to: [{ name, address }], cc: [...], subject, date, text,
//     labels: [name], attachments: <count> }
//
// A conversation - the messages joined by Message-ID, In-Reply-To and
// References - is ONE card, as Board View / Email shows a thread:
//   first message      -> the card: subject the title, text the description,
//                         sender the owner, date the received date, its
//                         `email` (models/cards.js) so the card is mail
//   later messages     -> the card's comments, by their sender
//   Gmail labels       -> labels (X-Gmail-Labels; Inbox, Unread, Opened and
//                         the like are mail state, not labels)
//   sent by the owner  -> a message labelled Sent is direction 'out', so it is
//                         in the Email view's Sent folder
// Every card goes to the list "Inbox", the list Board View / Email reads.
// Attachments are not imported; how many were left out is reported.

import { MAX_MBOX_LENGTH, MAX_MAIL_MESSAGES, splitMbox } from './mboxSplit.js';

export { MAX_MBOX_LENGTH, MAX_MAIL_MESSAGES, splitMbox };
export const MAIL_INBOX_LIST = 'Inbox';
// Gmail's system labels that say what state a message is in rather than
// what it is about.
const STATE_LABELS = new Set(['inbox', 'unread', 'opened', 'archived', 'important', 'starred',
  'category personal', 'category social', 'category promotions', 'category updates', 'category forums',
  'spam', 'trash', 'chat', 'sent', 'draft', 'drafts']);

const clean = value => (typeof value === 'string' ? value.trim() : '');
const idOf = value => clean(value).replace(/^<|>$/g, '').trim();
const addressOf = person => clean(person && person.address).toLowerCase();

// Threads: each message joins the conversation of any id it names.
function threads(messages) {
  const parent = messages.map((m, i) => i);
  const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const byId = new Map();
  messages.forEach((m, i) => { const id = idOf(m.messageId); if (id && !byId.has(id)) byId.set(id, i); });
  messages.forEach((m, i) => {
    const named = [m.inReplyTo, ...(Array.isArray(m.references) ? m.references : [])].map(idOf).filter(Boolean);
    for (const id of named) {
      const j = byId.get(id);
      if (j !== undefined) parent[find(i)] = find(j);
    }
  });
  const groups = new Map();
  messages.forEach((m, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(m);
  });
  const time = m => { const t = new Date(m.date).getTime(); return Number.isNaN(t) ? 0 : t; };
  return [...groups.values()].map(group => group.slice().sort((a, b) => time(a) - time(b)));
}

const personName = person => clean(person && person.name) || addressOf(person);
const subjectOf = message => clean(message.subject).replace(/^((re|fwd?|vs|sv|aw|antw)\s*:\s*)+/i, '') || clean(message.subject);

// The board of decoded messages. `name` is the board title.
export function parseMailMessages(messages, { name = 'Imported mail' } = {}) {
  const list = (Array.isArray(messages) ? messages : []).filter(m => m && typeof m === 'object');
  const unsupported = [];
  if (list.length >= MAX_MAIL_MESSAGES) {
    unsupported.push({ path: '/messages', reason: `only the first ${MAX_MAIL_MESSAGES} messages are imported` });
  }
  let attachments = 0;
  const tasks = threads(list).map(thread => {
    const first = thread[0];
    thread.forEach(m => { attachments += Number(m.attachments) || 0; });
    const labels = [...new Set(thread.flatMap(m => (Array.isArray(m.labels) ? m.labels : []))
      .map(clean).filter(label => label && !STATE_LABELS.has(label.toLowerCase().replace(/[_-]/g, ' '))))];
    const sent = (Array.isArray(first.labels) ? first.labels : []).some(l => /^sent$/i.test(clean(l)));
    const ids = thread.flatMap(m => [m.messageId, m.inReplyTo, ...(Array.isArray(m.references) ? m.references : [])])
      .map(idOf).filter(Boolean);
    const from = { name: clean(first.from && first.from.name), address: addressOf(first.from) };
    return {
      title: subjectOf(first) || '(no subject)',
      description: clean(first.text),
      column_name: MAIL_INBOX_LIST,
      swimlane_name: 'Default',
      owner_id: from.address || undefined,
      date_received: first.date,
      date_creation: first.date,
      tags: labels,
      email: {
        direction: sent ? 'out' : 'in',
        from,
        to: (first.to || []).map(addressOf).filter(Boolean),
        cc: (first.cc || []).map(addressOf).filter(Boolean),
        subject: clean(first.subject),
        // Without the angle brackets: the import's sanitizer reads
        // "<id@host>" as a tag and drops it. importedEmail (importedTaskPlan.js)
        // puts them back, in the form email to card stores.
        messageId: idOf(first.messageId),
        threadIds: [...new Set(ids)],
        at: first.date,
      },
      comments: thread.slice(1).map(m => ({
        text: clean(m.text) || clean(m.subject),
        author: addressOf(m.from),
        authorName: personName(m.from),
        date: m.date,
      })).filter(c => c.text),
    };
  });
  if (attachments) {
    unsupported.push({ path: '/messages/attachments', reason: `${attachments} mail attachment(s) are not imported` });
  }
  return {
    board: { name },
    columns: [{ title: MAIL_INBOX_LIST }],
    swimlanes: [{ name: 'Default' }],
    tasks,
    warnings: [],
    unsupported,
  };
}

// ----- export: the board as an .mbox ---------------------------------------

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
// RFC 5322 date, in UTC.
export function rfc5322Date(value) {
  const d = new Date(value || 0);
  const t = Number.isNaN(d.getTime()) ? new Date(0) : d;
  return `${DAYS[t.getUTCDay()]}, ${pad(t.getUTCDate())} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()} `
    + `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())} +0000`;
}
// The separator's asctime date.
const asctime = value => {
  const t = new Date(value || 0);
  const d = Number.isNaN(t.getTime()) ? new Date(0) : t;
  return `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, ' ')} `
    + `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} ${d.getUTCFullYear()}`;
};
// A header value: one line, and non-ASCII as an RFC 2047 encoded word.
function headerText(value) {
  const one = String(value == null ? '' : value).replace(/[\r\n]+/g, ' ').trim();
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7e]*$/.test(one)) return one;
  return `=?UTF-8?B?${Buffer.from(one, 'utf8').toString('base64')}?=`;
}
const SAFE_LOCAL = /[^A-Za-z0-9._-]+/g;
const fromHeader = (name, address) => (name ? `${headerText(name)} <${address}>` : address);
const userAddress = name => `${String(name || 'wekan').replace(SAFE_LOCAL, '-') || 'wekan'}@wekan.invalid`;
// A body line that starts "From " is escaped (mboxrd), so the file splits back
// into the same messages.
const body = text => String(text || '').replace(/\r\n|\r/g, '\n').split('\n')
  .map(line => (/^>*From /.test(line) ? `>${line}` : line)).join('\n');

function message({ from, to, subject, date, messageId, inReplyTo, text }) {
  const headers = [
    `From: ${from}`,
    ...(to ? [`To: ${to}`] : []),
    `Subject: ${headerText(subject)}`,
    `Date: ${rfc5322Date(date)}`,
    `Message-ID: ${messageId}`,
    ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`] : []),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  const sender = (/<([^>]+)>/.exec(from) || [null, from])[1];
  return `From ${sender} ${asctime(date)}\n${headers.join('\n')}\n\n${body(text)}\n`;
}

// collected: { board, items } from models/lib/externalExporters.js. A card
// that came from mail keeps its sender, recipients and Message-ID; another is
// a message from its creator. Its comments follow as replies.
export function formatMbox({ items = [] } = {}) {
  const out = [];
  for (const item of items) {
    const email = item.email || null;
    const ownId = email && String(email.messageId || '').replace(/^<|>$/g, '').trim();
    const messageId = ownId && !/[\s<>]/.test(ownId) ? `<${ownId}>` : `<${item.cardId}@wekan.invalid>`;
    const from = email && email.from && email.from.address
      ? fromHeader(email.from.name, email.from.address)
      : fromHeader(item.creator, userAddress(item.creator));
    const date = (email && email.at) || item.createdAt || item.dueAt;
    out.push(message({
      from,
      to: email && Array.isArray(email.to) && email.to.length ? email.to.join(', ') : '',
      subject: item.title,
      date,
      messageId,
      text: item.description,
    }));
    (item.comments || []).forEach((comment, index) => {
      out.push(message({
        from: fromHeader(comment.author, userAddress(comment.author)),
        subject: `Re: ${item.title}`,
        date: comment.date || date,
        messageId: `<${item.cardId}.${index + 1}@wekan.invalid>`,
        inReplyTo: messageId,
        text: comment.text,
      }));
    });
  }
  return out.join('\n');
}
