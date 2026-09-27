'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('client/components/sidebar/sidebarCustomFields.js','utf8');
const start=source.indexOf("  'click .primary'(evt, tpl) {");
const end=source.indexOf('\n    Popup.back();',start);
assert.ok(start>=0&&end>start);
const body=source.slice(source.indexOf('{',start)+1,end);
function save(type,marker){
 let update;
 const field={_id:'field',type,settings:{jiraTimeField:marker}};
 const handler=vm.runInNewContext(`(function(evt,tpl){${body}})`,{
  Template:{currentData:()=>field},ReactiveCache:{getCustomField:()=>field},
  getSettings:()=>({}),CustomFields:{update:(id,modifier)=>{update=modifier.$set;}},
 });
 handler({preventDefault(){}},{type:{get:()=>type},find:selector=>selector==='.js-field-name'?{value:'Renamed'}:null});
 return update;
}
test('numeric custom-field saves retain valid Jira estimate markers',()=>{
 for(const marker of ['original','remaining']){
  const data=save('number',marker);
  assert.equal(data.name,'Renamed');assert.equal(data.settings.jiraTimeField,marker);
 }
});
test('non-numeric and invalid integration markers do not survive a field save',()=>{
 for(const [type,marker] of [['text','original'],['number','unknown'],['number',undefined]]){
  assert.equal(save(type,marker).settings.jiraTimeField,undefined);
 }
});
