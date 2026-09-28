'use strict';
// SamlReplayBleed: signed responses require live request IDs and single-use consumption.
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
const {SAML}=require('@node-saml/node-saml');
const {startProvider}=require('./integration/login-providers/provider.cjs');
const {createResponseReplayGuard}=require('../packages/wekan-accounts-saml/responseReplay');

test('atomic response consumption rejects concurrent replay, malformed IDs and capacity overflow',async()=>{
 const accept=createResponseReplayGuard({maxEntries:2,ttlMs:100});
 const profile=id=>({inResponseTo:id});
 assert.deepEqual(await Promise.all([1,2].map(()=>Promise.resolve().then(()=>accept(profile('a'),1)))),[true,false]);
 assert.equal(accept.rejection,'replay');
 for(const value of [undefined,null,{},profile(''),profile({}),{getInResponseTo:()=> 'fake'}])assert.equal(accept(value,1),false);
 assert.equal(accept(profile('b'),2),true);assert.equal(accept(profile('c'),3),false);
 assert.equal(accept.rejection,'capacity');
 assert.equal(accept(profile('c'),102),true);
});
test('signed response is accepted once; replay, unsolicited, unsigned and tampered assertions fail',async t=>{
 const root=path.resolve(__dirname,'..');const parent=path.join(root,'.tools/tmp');fs.mkdirSync(parent,{recursive:true});
 const work=fs.mkdtempSync(path.join(parent,'saml-replay-'));t.after(()=>fs.rmSync(work,{recursive:true,force:true}));
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',work+'/key.pem','-out',work+'/cert.pem','-days','2','-subj','/CN=WeKan-test-only'],{stdio:'ignore',env:{...process.env,TMPDIR:parent}});
 const certificate=fs.readFileSync(work+'/cert.pem','utf8');
 const provider=await startProvider({certificate,privateKey:fs.readFileSync(work+'/key.pem','utf8')});t.after(()=>provider.close());
 const source=fs.readFileSync(path.join(root,'packages/wekan-accounts-saml/saml_server.js'),'utf8');
 const mode=/validateInResponseTo:\s*'([^']+)'/.exec(source)?.[1];assert.equal(mode,'always');
 const opts={entryPoint:provider.url+'/saml',callbackUrl:'http://wekan.invalid/_saml/validate/default',issuer:'wekan-test',idpCert:certificate,wantAssertionsSigned:false};
 const saml=new SAML({...opts,validateInResponseTo:mode});
 async function response(client){const url=await client.getAuthorizeUrlAsync('test-relay',undefined,{});const html=await(await fetch(url)).text();return {SAMLResponse:/name="SAMLResponse" value="([^"]+)"/.exec(html)[1],RelayState:'test-relay'};}
 const body=await response(saml);const first=await saml.validatePostResponseAsync(body);assert.equal(first.profile.nameID,'alice.saml@example.invalid');
 const accept=createResponseReplayGuard();
 assert.equal(typeof first.profile.inResponseTo,'string');
 assert.ok(first.profile.inResponseTo.length>0);
 assert.equal(accept(first.profile),true);assert.equal(accept(first.profile),false);
 assert.equal(accept.rejection,'replay');
 await assert.rejects(saml.validatePostResponseAsync({...body,RelayState:'different-relay'}),/InResponseTo/);
 // Reproduce the old configuration to prove the test detects the vulnerability.
 const old=new SAML(opts);await old.validatePostResponseAsync(body);await old.validatePostResponseAsync(body);
 const another=new SAML({...opts,validateInResponseTo:mode});await assert.rejects(another.validatePostResponseAsync(body),/InResponseTo/);
 for(const mode of ['unsigned','tampered']){provider.state.mode=mode;const bad=await response(saml);await assert.rejects(saml.validatePostResponseAsync(bad));}
 assert.match(source,/if \(!acceptLoginResponse\(profile\)\)/);
 assert.ok(source.indexOf('acceptLoginResponse(profile)')<source.indexOf('_storeCredential(credentialToken, { profile })'));
});
