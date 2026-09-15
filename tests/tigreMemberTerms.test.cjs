'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');const read=c=>JSON.parse(fs.readFileSync(path.join(root,`imports/i18n/data/${c}.i18n.json`),'utf8'));const tig=read('tig');const terms={
  "userPopup-title": "አባል",
  "cardMemberPopup-title": "አባል",
  "r-member": "አባል",
  "operator-member": "አባል",
  "predicate-member": "አባል",
  "cardMembersPopup-title": "አባላት",
  "members": "አባላት"
};for(const[k,v]of Object.entries(terms))assert.equal(tig[k],v);assert.equal(tig['r-member'],'አባል');assert.equal(tig.members,'አባላት');assert.notEqual(tig['r-member'],'መሕበር');console.log('Checked Tigre member terminology.');
