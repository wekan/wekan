'use strict';

// A named import or a destructured require of a name the module does not
// export is undefined, silently. fileIntegrityScan.js asked cpuMonitor for
// currentCpuPercent, which it never exported, so the hourly integrity scan's
// "wait while the CPU is busy" check was always NaN and never waited. Five
// more files imported names their modules do not have (never used, so only
// misleading).
//
// The sweep parses every app file and checks each `import { x } from` and
// `const { x } = require(...)` of an app module against what that module
// exports. A module whose exports cannot be listed statically (export *, a
// computed module.exports) is skipped rather than guessed.
//
// Run: node tests/namedImportsExist.test.cjs

const assert = require('assert');
const fs=require('fs'),path=require('path');const {parse}=require('@babel/parser');
const ROOT=path.join(__dirname,'..');const files=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['_build','node_modules','.npm','tests'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(f.endsWith('.js')||f.endsWith('.cjs'))files.push(f);}}
['client','server','models','imports','config'].forEach(t=>walk(path.join(ROOT,t)));
const cache=new Map();
function resolve(from,spec){let b;if(spec.startsWith('/'))b=path.join(ROOT,spec);else if(spec.startsWith('.'))b=path.resolve(path.dirname(from),spec);else return null;for(const c of [b,b+'.js',b+'.cjs',path.join(b,'index.js')])if(fs.existsSync(c)&&fs.statSync(c).isFile())return c;return null;}
function exportsOf(f){if(cache.has(f))return cache.get(f);let ast;try{ast=parse(fs.readFileSync(f,'utf8'),{sourceType:'unambiguous',errorRecovery:true,plugins:['jsx','topLevelAwait']});}catch(e){cache.set(f,null);return null;}
 const names=new Set();let dynamic=false;
 for(const n of ast.program.body){
  if(n.type==='ExportNamedDeclaration'){if(n.declaration){const d=n.declaration;if(d.id)names.add(d.id.name);if(d.declarations)d.declarations.forEach(x=>{if(x.id.type==='Identifier')names.add(x.id.name);else dynamic=true;});}n.specifiers.forEach(s=>names.add(s.exported.name??s.exported.value));if(n.source&&n.specifiers.length===0)dynamic=true;}
  if(n.type==='ExportAllDeclaration')dynamic=true;
  if(n.type==='ExportDefaultDeclaration'){names.add('default');const d=n.declaration;if(d.type==='ObjectExpression')d.properties.forEach(p=>p.key&&names.add(p.key.name));}
  if(n.type==='ExpressionStatement'&&n.expression.type==='AssignmentExpression'){const l=n.expression.left;const src=fs.readFileSync(f,'utf8').slice(l.start,l.end);
   if(src==='module.exports'){const r=n.expression.right;if(r.type==='ObjectExpression'){r.properties.forEach(p=>{if(p.type==='SpreadElement')dynamic=true;else if(p.key)names.add(p.key.name??p.key.value);});}else dynamic=true;}
   else if(/^(module\.)?exports\.\w+$/.test(src))names.add(src.split('.').pop());}
 }
 const r={names,dynamic};cache.set(f,r);return r;}
const bad=[];
for(const f of files){let ast;try{ast=parse(fs.readFileSync(f,'utf8'),{sourceType:'unambiguous',errorRecovery:true,plugins:['jsx','topLevelAwait']});}catch(e){continue;}
 (function visit(n){if(!n||typeof n.type!=='string')return;
  if(n.type==='ImportDeclaration'){const t=resolve(f,n.source.value);if(t){const ex=exportsOf(t);if(ex&&!ex.dynamic)n.specifiers.forEach(s=>{if(s.type==='ImportSpecifier'){const nm=s.imported.name??s.imported.value;if(!ex.names.has(nm))bad.push(`${path.relative(ROOT,f)}:${n.loc.start.line} ${nm} from ${n.source.value}`);}});}}
  if(n.type==='VariableDeclarator'&&n.id.type==='ObjectPattern'&&n.init&&n.init.type==='CallExpression'&&n.init.callee.name==='require'&&n.init.arguments[0]&&n.init.arguments[0].type==='StringLiteral'){const t=resolve(f,n.init.arguments[0].value);if(t){const ex=exportsOf(t);if(ex&&!ex.dynamic)n.id.properties.forEach(p=>{if(p.key&&!ex.names.has(p.key.name))bad.push(`${path.relative(ROOT,f)}:${n.loc.start.line} ${p.key.name} from ${n.init.arguments[0].value}`);});}}
  for(const k of Object.keys(n)){if(k==='loc')continue;const v=n[k];if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v.type==='string')visit(v);}})(ast.program);}


let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('namedImportsExist:');

test('the integrity scan reads the CPU through what cpuMonitor exports', () => {
  const scan = fs.readFileSync(path.join(ROOT, 'server/lib/fileIntegrityScan.js'), 'utf8');
  assert.match(scan, /const \{ getCurrentCpu \} = require\('\/server\/lib\/cpuMonitor'\);/);
  assert.match(scan, /Number\(getCurrentCpu\(\)\.percent\)/);
  assert.ok(exportsOf(path.join(ROOT, 'server/lib/cpuMonitor.js')).names.has('getCurrentCpu'));
});

test('the sweep sees the files and the exports it checks', () => {
  assert.ok(files.length > 1000, `found only ${files.length} files`);
  assert.ok(!exportsOf(path.join(ROOT, 'server/lib/cpuMonitor.js')).names.has('currentCpuPercent'),
    'and would catch the old name');
});

test('every named import of an app module exists in it (negative)', () => {
  assert.deepStrictEqual(bad, [], 'these names are undefined where they are used');
});

console.log(`\nnamedImportsExist: ${passed} tests passed`);
