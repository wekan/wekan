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
