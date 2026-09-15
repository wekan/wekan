'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');const read=c=>JSON.parse(fs.readFileSync(path.join(root,`imports/i18n/data/${c}.i18n.json`),'utf8'));const tig=read('tig'),ti=read('ti');const terms={
  "azure-connection-string-menu-path": "Azure Portal → Storage accounts → ሕሳብከ → Security + networking → Access keys → key1 → Connection string → ኣርኤ።",
  "azure-account-key-menu-path": "Azure Portal → Storage accounts → ሕሳብከ → Security + networking → Access keys → key1 → ኣርኤ → Key።"
};for(const[k,v]of Object.entries(terms)){assert.equal(tig[k],v);assert.notEqual(tig[k],ti[k]);assert.match(v,/Azure Portal → Storage accounts →/);assert.equal(v.includes('Security + networking → Access keys → key1'),true)}console.log('Checked Tigre Azure menu paths.');
