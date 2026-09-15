'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=code=>JSON.parse(fs.readFileSync(path.join(root,`imports/i18n/data/${code}.i18n.json`),'utf8'));
const tig=read('tig');
const ti=read('ti');
const terms={
  admin:'ሓክም',
  'impersonation-admin':'ሓክም',
  'orgAdminsPopup-title':'መዳይር መነዘመት',
  'org-admins':'መዳይር መነዘመት',
  'confirm-btn':'ኣክድ',
  confirm:'ኣክድ',
  'twoFactorCode-submit':'ኣክድ',
  'export-card-attachment-type':'ዐይነት',
  type:'ዐይነት',
  'stats-scope':'ዐይነት',
  location:'አካን',
  'office-location':'አካን',
  'add-location':'አካን ወስክ',
  'cardLocationsPopup-title':'አካን ወስክ',
};
for(const [key,value] of Object.entries(terms)) {
  assert.equal(tig[key],value,`${key} uses the reviewed Tigre term`);
  assert.notEqual(tig[key],ti[key],`${key} must not retain its Tigrinya seed`);
}
assert.equal(tig.admin,tig['impersonation-admin']);
assert.equal(tig.confirm,tig['twoFactorCode-submit']);
assert.match(tig['org-admins'],/^መዳይር /);
assert.match(tig['add-location'],/ ወስክ$/);
console.log('Checked 14 Tigre administrative and location controls.');
