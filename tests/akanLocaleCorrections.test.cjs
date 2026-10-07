 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/ak.i18n.json');

test('Akan controls replace unrelated filler and restore literal vote values', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["comment-in-reply-to", "actions", "allboards.starred", "allboards.remaining", "setListWidthPopup-title", "setSwimlaneHeightPopup-title", "admin-announcement", "apply", "template-container", "attached", "board-background-image-url", "desktop-mode", "mobile-mode", "zoom-in", "zoom-out", "zoom-level", "enter-zoom-level", "card-due", "card-due-on", "card-start-on", "cardAttachmentsPopup-title", "cardStartVotingPopup-title", "positiveVoteMembersPopup-title", "negativeVoteMembersPopup-title", "vote-question", "vote-against", "cardStartPlanningPokerPopup-title", "poker-question", "poker-one", "poker-two", "poker-three", "poker-five", "poker-eight", "poker-thirteen", "poker-twenty", "poker-forty", "poker-oneHundred", "poker-unsure", "poker-finish", "poker-result-votes", "poker-result-who", "poker-replay", "cardDependencyIconPopup-title", "cardStickersPopup-title", "invitePeoplePopup-title", "theme-default", "theme-category-flat", "theme-category-clear", "theme-category-dark", "theme-category-special", "font", "font-default", "font-size", "font-size-default", "font-size-smaller", "font-size-small", "font-size-large", "font-size-larger", "font-size-largest", "subtasks"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const name of ['one','two','three','five','eight','thirteen','twenty','forty','oneHundred','unsure']) assert.equal(data['poker-'+name],english['poker-'+name]);
 assert.match(data['enter-zoom-level'],/50-300%/);
 assert.notEqual(data['zoom-in'],data['zoom-out']);
 assert.notEqual(data['positiveVoteMembersPopup-title'],data['negativeVoteMembersPopup-title']);
 assert.notEqual(data['card-due-on'],data['card-start-on']);
 assert.equal(new Set(['smaller','small','large','larger','largest'].map(s=>data['font-size-'+s])).size,5);
 assert.match(data['board-background-image-url'],/URL/);
});

test('Akan colors and field controls replace filler without changing literal labels', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["card-aging-days", "go-back", "modal-title", "color-black", "color-crimson", "color-darkgreen", "color-gold", "color-gray", "color-indigo", "color-lime", "color-magenta", "color-mistyrose", "color-navy", "color-paleturquoise", "color-peachpuff", "color-pink", "color-plum", "color-purple", "color-silver", "color-sky", "color-slateblue", "color-white", "color-yellow", "comment-placeholder", "computer", "current", "custom-field-currency", "custom-field-currency-option", "custom-field-dropdown-none", "custom-field-dropdown-unknown", "custom-field-number", "custom-field-text", "decline", "default-avatar", "soft-wip-limit", "email-invite", "list-label-short-modifiedAt", "list-label-short-title", "list-label-short-sort", "trello-parent-workspace-top", "trello-clear-job", "running", "paused", "info", "check-version", "initials", "joined", "swimlaneActionPopup-title", "gantt", "log-in", "loginPopup-title", "menu", "muted", "participating", "setWipLimitPopup-title", "shortcut-autocomplete-emoji", "subscribe", "spent-time-hours", "overtime-hours", "overtime"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data['comment-placeholder'],'');
 for(const key of ['list-label-short-modifiedAt','list-label-short-title','list-label-short-sort','gantt']) assert.equal(data[key],english[key]);
 assert.match(data['card-aging-days'],/3/);
 assert.equal(data['log-in'],data['loginPopup-title']);
 assert.notEqual(data['custom-field-dropdown-none'],data['custom-field-dropdown-unknown']);
 assert.notEqual(data['running'],data['paused']);
 for(const key of ['spent-time-hours','overtime-hours']) assert.match(data[key],/nnɔnhwerew/);
 assert.equal(new Set(keys.filter(k=>k.startsWith('color-')).map(k=>data[k])).size,20);
});
