// Chat exports read into a board for Board View / Chat, and a board written
// as a Mattermost bulk import file. Plain JavaScript:
// tests/chatExportFormats.test.cjs runs it in Node.
//
// Board View / Chat shows a card as a channel and its comments as the
// channel's messages (models/lib/chatView.js), so every chat format maps the
// same way:
//   a channel, group, chat or space -> a card; its topic or purpose the
//                                      description
//   its messages, oldest first       -> the card's comments, by their author
//                                      (the import page maps authors to
//                                      members), at their time
//   the kind of chat                 -> the list: Channels, Groups or
//                                      Direct messages
//   a workspace, team or server      -> the swimlane
// Files and images in messages are not imported; how many is reported.
//
//   Slack       workspace export .zip: users.json, channels.json (and
//               groups.json, dms.json, mpims.json) and <channel>/<date>.json
//               - read from the zip by server/lib/chatArchives.js into
//               { users, channels, groups, dms, mpims, messages: { name: [] } }
//   Mattermost  bulk export JSONL (mmctl export): team, channel, post,
//               direct_channel and direct_post lines
//   Telegram    Telegram Desktop's JSON export result.json: one chat, or the
//               whole account's chats.list
//   WhatsApp    "Export chat" .txt, Android or iOS line format
//   Discord     DiscordChatExporter JSON, one channel or an array of them
//   Google Chat Google Takeout's Google Chat/Groups/<space>/messages.json and
//               group_info.json, as { name, members, messages }

export const MAX_CHAT_MESSAGES = 200000;
export const MAX_CHAT_TEXT_LENGTH = 128 * 1024 * 1024;
import { pagingOf } from './exportPaging.js';
const MESSAGE_LIMIT = 20000; // the text of one message

const clean = value => (typeof value === 'string' ? value : '').replace(/\r\n|\r/g, '\n').trim();
const cut = value => clean(value).slice(0, MESSAGE_LIMIT);
const iso = value => {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};
const byTime = (a, b) => (Date.parse(a.date || 0) || 0) - (Date.parse(b.date || 0) || 0);

// A board of chats: [{ title, description, column, swimlane, messages }].
function chatBoard(name, chats, { files = 0, unsupported = [] } = {}) {
  const columns = [];
  const swimlanes = [];
  const tasks = [];
  let total = 0;
  let cutOff = false;
  for (const chat of chats) {
    const column = chat.column || 'Channels';
    const swimlane = chat.swimlane || 'Default';
    if (!columns.includes(column)) columns.push(column);
    if (!swimlanes.includes(swimlane)) swimlanes.push(swimlane);
    const comments = [];
    for (const message of chat.messages.slice().sort(byTime)) {
      if (!message.text) continue;
      if (total >= MAX_CHAT_MESSAGES) { cutOff = true; break; }
      total += 1;
      comments.push(message);
    }
    tasks.push({
      title: clean(chat.title).slice(0, 500) || 'Chat',
      description: cut(chat.description),
      column_name: column,
      swimlane_name: swimlane,
      date_creation: chat.created || (comments[0] && comments[0].date),
      comments,
    });
  }
  const losses = [...unsupported];
  if (cutOff) losses.push({ path: '/messages', reason: `only the first ${MAX_CHAT_MESSAGES} messages are imported` });
  if (files) losses.push({ path: '/messages/files', reason: `${files} file(s) and image(s) in messages are not imported` });
  return {
    board: { name },
    columns: (columns.length ? columns : ['Channels']).map(title => ({ title })),
    swimlanes: (swimlanes.length ? swimlanes : ['Default']).map(n => ({ name: n })),
    tasks,
    warnings: [],
    unsupported: losses,
  };
}

const message = (text, author, authorName, date) => ({
  text: cut(text), author: clean(author), authorName: clean(authorName) || clean(author), date: iso(date),
});

// ----- Slack ---------------------------------------------------------------

const entities = text => String(text).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function slackText(text, userName) {
  return entities(String(text || '')
    .replace(/<@([A-Z0-9]+)(?:\|([^>]+))?>/g, (m, id, label) => `@${label || userName(id) || id}`)
    .replace(/<#[A-Z0-9]+\|([^>]*)>/g, '#$1')
    .replace(/<!(here|channel|everyone)(?:\|[^>]*)?>/g, '@$1')
    .replace(/<!subteam\^[A-Z0-9]+\|([^>]+)>/g, '$1')
    .replace(/<(https?:[^|>]+)\|([^>]+)>/g, '$2 ($1)')
    .replace(/<(mailto:)?([^|>]+)(?:\|[^>]+)?>/g, '$2'));
}

export function parseSlackExport(data) {
  if (!data || typeof data !== 'object') throw new Error('Not a Slack export');
  const users = new Map((Array.isArray(data.users) ? data.users : []).filter(u => u && u.id).map(u => [u.id, u]));
  const userName = id => {
    const u = users.get(id);
    return u ? (u.profile && (u.profile.display_name || u.profile.real_name)) || u.real_name || u.name : '';
  };
  const userKey = id => (users.get(id) && users.get(id).name) || id;
  const messages = data.messages && typeof data.messages === 'object' ? data.messages : {};
  let files = 0;
  const chats = [];
  const kinds = [['channels', 'Channels'], ['groups', 'Groups'], ['mpims', 'Groups'], ['dms', 'Direct messages']];
  for (const [key, column] of kinds) {
    for (const channel of Array.isArray(data[key]) ? data[key] : []) {
      if (!channel) continue;
      const folder = channel.name || channel.id;
      const list = Array.isArray(messages[folder]) ? messages[folder] : [];
      const members = (channel.members || []).map(userName).filter(Boolean);
      chats.push({
        title: channel.name ? (key === 'channels' ? `#${channel.name}` : channel.name)
          : members.join(', ') || channel.id,
        description: [channel.topic && channel.topic.value, channel.purpose && channel.purpose.value]
          .map(clean).filter(Boolean).join('\n\n'),
        column,
        created: iso(Number(channel.created) * 1000),
        messages: list.filter(m => m && m.type === 'message' && !['channel_join', 'channel_leave'].includes(m.subtype))
          .map(m => {
            files += Array.isArray(m.files) ? m.files.length : 0;
            const reply = m.thread_ts && m.thread_ts !== m.ts ? '↳ ' : '';
            const name = (m.user_profile && (m.user_profile.display_name || m.user_profile.real_name)) || userName(m.user);
            return message(reply + slackText(m.text, userName), userKey(m.user), name, Number(m.ts) * 1000);
          }),
      });
    }
  }
  if (!chats.length) throw new Error('Slack export has no channels');
  return chatBoard('Imported Slack', chats, { files });
}

// ----- Mattermost ----------------------------------------------------------

function jsonLines(text) {
  const source = String(text == null ? '' : text);
  if (source.length > MAX_CHAT_TEXT_LENGTH) throw new Error('Chat export is too large');
  return source.split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
    try { return JSON.parse(line); } catch (e) { throw new Error(`Line ${index + 1} is not JSON`); }
  });
}

// text: the JSONL export, or { jsonLines } - its lines already parsed one at a
// time from a file on disk (server/lib/importUploadSource.js).
export function parseMattermostBulk(text) {
  const lines = text && Array.isArray(text.jsonLines) ? text.jsonLines : jsonLines(text);
  if (!lines.some(l => l && l.type === 'version')) throw new Error('Not a Mattermost bulk export: no version line');
  const teams = new Map();
  const chats = new Map();
  let files = 0;
  const chatFor = (key, init) => { if (!chats.has(key)) chats.set(key, { ...init, messages: [] }); return chats.get(key); };
  const posted = (chat, post) => {
    files += Array.isArray(post.attachments) ? post.attachments.length : 0;
    chat.messages.push(message(post.message, post.user, post.user, post.create_at));
    for (const reply of Array.isArray(post.replies) ? post.replies : []) {
      files += Array.isArray(reply.attachments) ? reply.attachments.length : 0;
      chat.messages.push(message(`↳ ${clean(reply.message)}`, reply.user, reply.user, reply.create_at));
    }
  };
  for (const line of lines) {
    if (!line || typeof line !== 'object') continue;
    if (line.type === 'team' && line.team) teams.set(line.team.name, line.team.display_name || line.team.name);
    if (line.type === 'channel' && line.channel) {
      const c = line.channel;
      chatFor(`${c.team}/${c.name}`, { title: c.display_name || c.name, description: [c.header, c.purpose].map(clean).filter(Boolean).join('\n\n'),
        column: c.type === 'P' ? 'Groups' : 'Channels', swimlane: c.team });
    }
    if (line.type === 'post' && line.post) {
      const p = line.post;
      posted(chatFor(`${p.team}/${p.channel}`, { title: p.channel, column: 'Channels', swimlane: p.team }), p);
    }
    if (line.type === 'direct_channel' && line.direct_channel) {
      const members = (line.direct_channel.members || []).slice().sort();
      chatFor(`dm/${members.join(',')}`, { title: members.join(', '), column: 'Direct messages', swimlane: 'Direct messages' });
    }
    if (line.type === 'direct_post' && line.direct_post) {
      const members = (line.direct_post.channel_members || []).slice().sort();
      posted(chatFor(`dm/${members.join(',')}`, { title: members.join(', '), column: 'Direct messages', swimlane: 'Direct messages' }),
        line.direct_post);
    }
  }
  for (const chat of chats.values()) if (teams.has(chat.swimlane)) chat.swimlane = teams.get(chat.swimlane);
  if (!chats.size) throw new Error('Mattermost export has no channels');
  return chatBoard(teams.size === 1 ? [...teams.values()][0] : 'Imported Mattermost', [...chats.values()], { files });
}

// The board as a bulk import file for `mmctl import`: one team named after
// the board, a public channel per card, and the card's comments as its posts.
// The people are users with an address of their username at wekan.invalid,
// so the import does not merge them into existing accounts by e-mail.
const slug = (value, fallback) => (String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, 60)) || fallback;
// The whole board, or one page of it (models/lib/exportPaging.js): the team,
// every channel and every user are named over the whole board and written on
// the first page; each page then writes its own cards' posts.
export function formatMattermostBulk(collected = {}) {
  const { board } = collected;
  const { items, all, first, offset } = pagingOf(collected);
  const team = slug(board && board.title, 'wekan');
  const names = new Set();
  const users = new Set();
  const channels = all.map((item, index) => {
    let name = slug(item.title, `card-${index + 1}`);
    for (let n = 2; names.has(name); n += 1) name = `${slug(item.title, 'card').slice(0, 56)}-${n}`;
    names.add(name);
    return name;
  });
  const user = value => { const u = slug(value, 'wekan').replace(/-/g, '.').slice(0, 22); users.add(u); return u; };
  // Every user, in the order the posts name them, over the whole board.
  all.forEach(item => {
    user(item.creator || 'wekan');
    for (const comment of item.comments || []) user(comment.author || 'wekan');
  });
  const posts = [];
  items.forEach((item, pageIndex) => {
    const index = offset + pageIndex;
    const creator = user(item.creator || 'wekan');
    const at = Date.parse(item.createdAt || 0) || 0;
    if (clean(item.description)) {
      posts.push({ type: 'post', post: { team, channel: channels[index], user: creator, message: clean(item.description), create_at: at || 1 } });
    }
    for (const comment of item.comments || []) {
      posts.push({ type: 'post', post: { team, channel: channels[index], user: user(comment.author || 'wekan'),
        message: clean(comment.text), create_at: Date.parse(comment.date || 0) || at || 1 } });
    }
  });
  const lines = [
    ...(first ? [
    { type: 'version', version: 1 },
    { type: 'team', team: { name: team, display_name: (board && board.title) || team, type: 'I' } },
    ...all.map((item, index) => ({ type: 'channel', channel: { team, name: channels[index],
      display_name: String(item.title || channels[index]).slice(0, 64), type: 'O', purpose: clean(item.listTitle).slice(0, 250) } })),
    ...[...users].map(username => ({ type: 'user', user: { username, email: `${username}@wekan.invalid`,
      teams: [{ name: team, channels: channels.map(name => ({ name })) }] } })),
    ] : []),
    ...posts,
  ];
  return lines.length ? `${lines.map(line => JSON.stringify(line)).join('\n')}\n` : '';
}

// ----- Telegram ------------------------------------------------------------

const telegramText = text => (Array.isArray(text)
  ? text.map(part => (typeof part === 'string' ? part : (part && part.text) || '')).join('')
  : String(text || ''));
const TELEGRAM_COLUMNS = { personal_chat: 'Direct messages', bot_chat: 'Direct messages', saved_messages: 'Direct messages',
  private_group: 'Groups', private_supergroup: 'Groups', public_supergroup: 'Groups',
  private_channel: 'Channels', public_channel: 'Channels' };

export function parseTelegramExport(data) {
  if (!data || typeof data !== 'object') throw new Error('Not a Telegram export');
  const list = data.chats && Array.isArray(data.chats.list) ? data.chats.list
    : Array.isArray(data.messages) ? [data] : null;
  if (!list) throw new Error('Not a Telegram export: no chats.list and no messages');
  let files = 0;
  const chats = list.filter(chat => chat && Array.isArray(chat.messages)).map(chat => ({
    title: chat.name || (chat.type === 'saved_messages' ? 'Saved Messages' : `Chat ${chat.id}`),
    column: TELEGRAM_COLUMNS[chat.type] || 'Groups',
    messages: chat.messages.filter(m => m && m.type === 'message').map(m => {
      if (m.photo || m.file || m.media_type) files += 1;
      const at = m.date_unixtime ? Number(m.date_unixtime) * 1000 : `${m.date}Z`;
      return message(telegramText(m.text), m.from_id || m.from, m.from, at);
    }),
  }));
  const who = data.personal_information && [data.personal_information.first_name, data.personal_information.last_name]
    .filter(Boolean).join(' ');
  return chatBoard(who ? `Telegram - ${who}` : list.length === 1 ? list[0].name || 'Imported Telegram' : 'Imported Telegram',
    chats, { files });
}

// ----- WhatsApp ------------------------------------------------------------

// Android: "16/11/2026, 10:00 - Name: text", "11/16/26, 10:00 AM - Name: text"
// iOS:     "[16/11/2026, 10:00:00] Name: text", "[16.11.2026 klo 10.00.00] Name: text"
const WA_LINE = /^\[?(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+(?:klo\s+)?(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?\]?\s*(?:-\s+)?(.*)$/;
export function parseWhatsAppChat(text, { name } = {}) {
  const source = String(text == null ? '' : text).replace(/^\uFEFF/, '').replace(/[\u200E\u200F]/g, '').replace(/[\u00A0\u202F]/g, ' ');
  if (source.length > MAX_CHAT_TEXT_LENGTH) throw new Error('Chat export is too large');
  const raw = [];
  for (const line of source.split(/\r?\n/)) {
    const m = WA_LINE.exec(line);
    if (m) raw.push({ parts: m, rest: m[8] });
    else if (raw.length) raw[raw.length - 1].rest += `\n${line}`;
  }
  if (!raw.length) throw new Error('Not a WhatsApp chat export: no dated message lines');
  // Day first, unless a second number over 12 shows the month comes first.
  const monthFirst = raw.some(r => +r.parts[2] > 12) && !raw.some(r => +r.parts[1] > 12 && +r.parts[1] < 32);
  let files = 0;
  const messages = [];
  for (const { parts, rest } of raw) {
    const colon = rest.indexOf(': ');
    if (colon <= 0) continue; // "Messages are end-to-end encrypted" and other system lines
    let [a, b, year] = [+parts[1], +parts[2], +parts[3]];
    if (parts[1].length === 4) [year, b, a] = [+parts[1], +parts[2], +parts[3]]; // 2026-11-16
    if (year < 100) year += 2000;
    const [day, month] = monthFirst ? [b, a] : [a, b];
    let hour = +parts[4];
    const ampm = (parts[7] || '').toLowerCase();
    if (ampm.startsWith('p') && hour < 12) hour += 12;
    if (ampm.startsWith('a') && hour === 12) hour = 0;
    const date = new Date(Date.UTC(year, month - 1, day, hour, +parts[5], +(parts[6] || 0)));
    const author = rest.slice(0, colon).trim();
    let body = rest.slice(colon + 2);
    if (/^<[^>]+>$|<attached: [^>]+>|\(file attached\)|^(image|video|audio|sticker|GIF|document) omitted$/i.test(body.trim())) {
      files += 1;
      body = body.replace(/<attached: [^>]+>/g, '').trim();
      if (!body || /^<[^>]+>$/.test(body) || / omitted$/i.test(body)) continue;
    }
    messages.push(message(body, author, author, date));
  }
  const people = [...new Set(messages.map(m => m.author))];
  return chatBoard(name || 'Imported WhatsApp', [{
    title: name || people.join(', ') || 'WhatsApp chat',
    column: people.length > 2 ? 'Groups' : 'Direct messages',
    messages,
  }], { files });
}

// ----- Discord (DiscordChatExporter) ---------------------------------------

export function parseDiscordExport(data) {
  const exports = Array.isArray(data) ? data : [data];
  if (!exports.every(e => e && e.channel && Array.isArray(e.messages))) {
    throw new Error('Not a DiscordChatExporter JSON export: no channel and messages');
  }
  let files = 0;
  const chats = exports.map(e => ({
    title: e.channel.name ? (e.channel.type && /dm|direct/i.test(e.channel.type) ? e.channel.name : `#${e.channel.name}`) : e.channel.id,
    description: clean(e.channel.topic),
    column: /dm|direct|group/i.test(e.channel.type || '') ? 'Direct messages' : clean(e.channel.category) || 'Channels',
    swimlane: (e.guild && e.guild.name) || 'Discord',
    messages: e.messages.filter(m => m && (!m.type || /^(Default|Reply)$/.test(m.type))).map(m => {
      files += (Array.isArray(m.attachments) ? m.attachments.length : 0) + (Array.isArray(m.stickers) ? m.stickers.length : 0);
      const author = m.author || {};
      return message(m.content, author.name || author.id, author.nickname || author.name, m.timestamp);
    }),
  }));
  const guilds = [...new Set(chats.map(c => c.swimlane))];
  return chatBoard(guilds.length === 1 ? guilds[0] : 'Imported Discord', chats, { files });
}

// ----- Google Chat (Google Takeout) ----------------------------------------

// "Monday, November 16, 2026 at 10:00:00 AM UTC", with a narrow no-break
// space before AM in newer exports.
export function googleChatDate(value) {
  const text = String(value || '').replace(/[\u00A0\u202F]/g, ' ').replace(/^[A-Za-z]+,\s*/, '').replace(/\s+at\s+/, ' ');
  return iso(text);
}

export function parseGoogleChatSpaces(spaces) {
  let files = 0;
  const chats = (Array.isArray(spaces) ? spaces : []).map(space => {
    const members = (space.members || []).map(m => m && (m.name || m.email)).filter(Boolean);
    return {
      title: clean(space.name) || members.join(', ') || 'Google Chat',
      column: /^DM /.test(space.folder || '') || (!space.name && members.length <= 2) ? 'Direct messages' : 'Spaces',
      swimlane: 'Google Chat',
      messages: (space.messages || []).map(m => {
        files += Array.isArray(m.attached_files) ? m.attached_files.length : 0;
        const creator = m.creator || {};
        return message(m.text, creator.email || creator.name, creator.name, googleChatDate(m.created_date));
      }),
    };
  });
  return { chats, files };
}

export function parseGoogleChat(spaces) {
  const { chats, files } = parseGoogleChatSpaces(spaces);
  if (!chats.length) throw new Error('Google Chat export has no spaces');
  return chatBoard('Imported Google Chat', chats, { files });
}
