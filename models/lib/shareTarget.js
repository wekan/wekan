'use strict';

// #1293: WeKan as an Android share target. The web app manifest declares
// `share_target`, so on a phone where WeKan is installed as an app, Share →
// WeKan opens /share-target?title=…&text=…&url=…, where the member picks a
// board and list and the shared thing becomes a card there.
//
// What a share carries differs by app - a browser shares a page's title and
// URL, a notes app only text, some apps put the URL inside the text - so this
// turns it into one card title and description. Pure:
// tests/shareTarget.test.cjs.

const MAX_TITLE = 300;
const MAX_DESCRIPTION = 20000;

function clean(value, max) {
  return typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim().slice(0, max) : '';
}

function sharedCard({ title, text, url } = {}) {
  const t = clean(title, MAX_TITLE);
  const x = clean(text, MAX_DESCRIPTION);
  let u = clean(url, 2000);
  if (u && !/^https?:\/\//i.test(u)) u = '';
  const firstLine = x.split('\n').find(line => line.trim()) || '';
  const cardTitle = (t || firstLine || u).replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE);
  const parts = [];
  // The text, unless it is only the title again.
  if (x && x !== cardTitle) parts.push(x);
  // The address, unless the text already carries it or it is the title.
  if (u && !x.includes(u) && u !== cardTitle) parts.push(u);
  return { title: cardTitle, description: parts.join('\n\n').slice(0, MAX_DESCRIPTION) };
}

// The manifest's declaration, relative to the manifest's own address.
const SHARE_TARGET = Object.freeze({
  action: 'share-target',
  method: 'GET',
  params: Object.freeze({ title: 'title', text: 'text', url: 'url' }),
});

module.exports = { sharedCard, SHARE_TARGET, MAX_TITLE };
