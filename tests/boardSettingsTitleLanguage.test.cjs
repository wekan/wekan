'use strict';
// "Board Settings" (boardMenuPopup-title) in the language its locale names:
// Mandarin and Cantonese had 棋盘/棋盤 - "chessboard" settings - beside their
// own 看板 for a board; Yoruba had the English "Board" in it, and Yiddish
// spelled the English words out in Hebrew letters (2026-11-20).
// Run: node --test tests/boardSettingsTitleLanguage.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const load = tag => require(`../imports/i18n/data/${tag}.i18n.json`);

test('Board Settings is a board, not a chessboard, in Mandarin and Cantonese', () => {
  for (const tag of ['cmn', 'yue_CN']) {
    const d = load(tag);
    assert.ok(d['boardMenuPopup-title'].startsWith(d.board), `${tag}: starts with its own word for a board`);
    assert.doesNotMatch(d['boardMenuPopup-title'], /棋/, `${tag}: no chessboard`);
  }
});

test('negative: no English left in Yoruba\'s, and no transliterated English in Yiddish\'s', () => {
  assert.doesNotMatch(load('yo')['boardMenuPopup-title'], /Board/);
  assert.ok(load('yo')['boardMenuPopup-title'].includes(load('yo').board));
  const yi = load('yi');
  for (const key of ['boardMenuPopup-title', 'settings', 'boards']) {
    assert.doesNotMatch(yi[key], /באָרד|סעטטינגס/, `yi ${key}`);
  }
});
