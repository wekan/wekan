#!/usr/bin/env node
/*
  Node.js port of openapi/generate_openapi.py (minimal, Node 14 compatible).
  Parses models to produce an OpenAPI 2.0 YAML on stdout.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const esprima = require('esprima');

function cleanupJsdocs(jsdoc) {
  const lines = jsdoc.value.split('\n')
    .map(s => s.replace(/^\s*/, ''))
    .map(s => s.replace(/^\*/, ''));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  return lines;
}

function loadReturnTypeJsdocJson(data) {
  let s = data;
  const repl = [
    [/\n/g, ' '],
    [/([\{\s,])(\w+)(:)/g, '$1"$2"$3'],
    [/(:)\s*([^:\},\]]+)\s*([\},\]])/g, '$1"$2"$3'],
    [/([\[])\s*([^\{].+)\s*(\])/g, '$1"$2"$3'],
    [/^\s*([^\[{].+)\s*/, '"$1"']
  ];
  for (const [r, rep] of repl) s = s.replace(r, rep);
  try { return JSON.parse(s); } catch { return data; }
}

class Context {
  constructor(filePath) {
    this.path = filePath;
    this._txt = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    const data = this._txt.join('\n');
    this.program = esprima.parseModule(data, { comment: true, loc: true, range: true });
  }
  textAt(begin, end) { return this._txt.slice(begin - 1, end).join('\n'); }
}

function parseFile(filePath) {
  try { return new Context(filePath); } catch { return undefined; }
}

function getReqBodyElems(node, acc) {
  if (!node) return '';
  switch (node.type) {
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': return getReqBodyElems(node.body, acc);
    case 'BlockStatement': node.body.forEach(s => getReqBodyElems(s, acc)); return '';
    case 'TryStatement': return getReqBodyElems(node.block, acc);
    case 'ExpressionStatement': return getReqBodyElems(node.expression, acc);
    case 'MemberExpression': {
      const left = getReqBodyElems(node.object, acc);
      const right = node.property && node.property.name;
      if (left === 'req.body' && right && !acc.includes(right)) acc.push(right);
      return `${left}.${right}`;
    }
    case 'VariableDeclaration': node.declarations.forEach(s => getReqBodyElems(s, acc)); return '';
    case 'VariableDeclarator': return getReqBodyElems(node.init, acc);
    case 'Property': return getReqBodyElems(node.value, acc);
    case 'ObjectExpression': node.properties.forEach(s => getReqBodyElems(s, acc)); return '';
    case 'CallExpression': node.arguments.forEach(s => getReqBodyElems(s, acc)); return '';
    case 'ArrayExpression': node.elements.forEach(s => getReqBodyElems(s, acc)); return '';
    case 'IfStatement': getReqBodyElems(node.test, acc); if (node.consequent) getReqBodyElems(node.consequent, acc); if (node.alternate) getReqBodyElems(node.alternate, acc); return '';
    case 'LogicalExpression':
    case 'BinaryExpression':
    case 'AssignmentExpression': getReqBodyElems(node.left, acc); getReqBodyElems(node.right, acc); return '';
    case 'ChainExpression': return getReqBodyElems(node.expression, acc);
    case 'ReturnStatement':
    case 'UnaryExpression': if (node.argument) return getReqBodyElems(node.argument, acc); return '';
    case 'Identifier': return node.name;
    default: return '';
  }
}

class EntryPoint {
  constructor(schema, [method, pathLit, body]) {
    this.schema = schema;
    this.method = method; this._path = pathLit; this.body = body;
    this._rawDoc = null; this._doc = {}; this._jsdoc = null;
    this.path = (this._path.value || '').replace(/\/$/, '');
    this.method_name = (this.method.value || '').toLowerCase();
    this.body_params = [];
    if (['post','put'].includes(this.method_name)) getReqBodyElems(this.body, this.body_params);
    let url = this.path.replace(/:([^\/]*)Id/g, '{$1}').replace(/:([^\/]*)/g, '{$1}');
    this.url = url;
    const tokens = url.split('/');
    const reduced = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === 'api') continue;
      if (i < tokens.length - 1 && tokens[i+1].startsWith('{')) continue;
      reduced.push(t.replace(/[{}]/g, ''));
    }
    this.reduced_function_name = reduced.join('_');
    schema.used = true;
  }
  set doc(doc) { this._rawDoc = doc; this._jsdoc = cleanupJsdocs(doc); this._doc = this.parseDoc(); }
  get doc() { return this._doc; }
  parseDoc() {
    if (!this._jsdoc) return {};
    const result = {};
    let currentTag = 'description';
    let current = '';
    const store = (tag, data) => {
      if (data == null) return; const s = (data + '').replace(/\s+$/,''); if (!s) return;
      if (tag === 'param') {
        result.params = result.params || {};
        let nameDesc = s.trim();
        let paramType = null;
        let name = nameDesc; let desc = '';
        const mType = nameDesc.match(/^\{([^}]+)\}\s*(.*)$/);
        if (mType) { paramType = mType[1]; nameDesc = mType[2]; }
        const sp = nameDesc.split(/\s+/, 2); name = sp[0]; desc = sp[1] || '';
        const optional = /^\[.*\]$/.test(name); if (optional) name = name.slice(1,-1);
        result.params[name] = [paramType, optional, desc];
        if (name.endsWith('Id')) { const base = name.slice(0,-2); if (!result.params[base]) result.params[base] = [paramType, optional, desc]; }
        return;
      }
      if (tag === 'tag') { (result.tag = result.tag || []).push(s); return; }
      if (tag === 'return_type') { result[tag] = loadReturnTypeJsdocJson(s); return; }
      result[tag] = s;
    };
    for (const lineRaw of this._jsdoc) {
      let line = lineRaw;
      if (/^@/.test(line.trim())) {
        const parts = line.trim().split(/\s+/, 2);
        const tag = parts[0]; const rest = parts[1] || '';
        if (['@operation','@summary','@description','@param','@return_type','@tag'].includes(tag)) {
          store(currentTag, current);
          currentTag = tag.slice(1); current = ''; line = rest;
        }
      }
      current += line + '\n';
    }
    store(currentTag, current);
    return result;
  }
  get summary() { return this._doc.summary ? this._doc.summary.replace(/\n/g,' ') : null; }
  docParam(name) { const p = (this._doc.params||{})[name]; return p ? p : [null,null,null]; }
  operationId() { return this._doc.operation || `${this.method_name}_${this.reduced_function_name}`; }
  description() { return this._doc.description || null; }
  returns() { return this._doc.return_type || null; }
  tags() { const tags = []; if (this.schema.fields) tags.push(this.schema.name); if (this._doc.tag) tags.push(...this._doc.tag); return tags; }
}

class SchemaProperty {
  constructor(statement, schema, context) {
    this.schema = schema;
    this.statement = statement;
    this.name = (statement.key.name || statement.key.value);
    this.type = 'object'; this.blackbox = false; this.required = true; this.elements = [];
    (statement.value.properties || []).forEach(p => {
      try {
        const key = p.key && (p.key.name || p.key.value);
        if (key === 'type') {
          if (p.value.type === 'Identifier') this.type = (p.value.name || '').toLowerCase();
          else if (p.value.type === 'ArrayExpression') { this.type = 'array'; this.elements = (p.value.elements||[]).map(e => (e.name||'object').toLowerCase()); }
        } else if (key === 'blackbox') { this.blackbox = true; }
        else if (key === 'optional' && p.value && p.value.value) { this.required = false; }
      } catch(e) { /* ignore minor parse errors */ }
    });
    this._doc = null; this._raw_doc = null;
  }
  set doc(jsdoc){ this._raw_doc = jsdoc; this._doc = cleanupJsdocs(jsdoc); }
  get doc(){ return this._doc; }
}

class Schemas {
  constructor(context, statement, jsdocs, name) {
    this.name = name || null; this._data = statement; this.fields = null; this.used = false;
    if (statement) {
      if (!this.name) this.name = statement.expression.callee.object.name;
      const content = statement.expression.arguments[0].arguments[0];
      this.fields = (content.properties || []).map(p => new SchemaProperty(p, this, context));
    }
    this._doc = null; this._raw_doc = null;
    if (jsdocs) this.processJsdocs(jsdocs);
  }
  get doc(){ return this._doc ? this._doc.join(' ') : null; }
  set doc(jsdoc){ this._raw_doc = jsdoc; this._doc = cleanupJsdocs(jsdoc); }
  processJsdocs(jsdocs){
    if (!this._data) return;
    const start = this._data.loc.start.line, end = this._data.loc.end.line;
    for (const doc of jsdocs){ if (doc.loc.end.line + 1 === start) { this.doc = doc; break; } }
    const inRange = jsdocs.filter(doc => doc.loc.start.line >= start && doc.loc.end.line <= end);
    for (const f of (this.fields||[]))
      for (let i=0;i<inRange.length;i++){ const doc=inRange[i]; if (f.statement && f.statement.loc && f.statement.loc.start && f.statement.loc.start.line === (f.statement.key && f.statement.key.loc && f.statement.key.loc.start.line)) { f.doc = doc; inRange.splice(i,1); break; } }
  }
}

function parseSchemas(schemasDir){
  const schemas = {}; const entryPoints = [];
  const walk = dir => {
    const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name));
    for (const it of items){
      const p = path.join(dir, it.name);
      if (it.isDirectory()) walk(p);
      else if (it.isFile()){
        const context = parseFile(p); if (!context) continue; const program = context.program;
        let currentSchema = null;
        const jsdocs = (program.comments||[]).filter(c => c.type === 'Block' && c.value.startsWith('*\n'));
        for (const statement of program.body){
          try {
            if (statement.type === 'ExpressionStatement' && statement.expression && statement.expression.callee && statement.expression.callee.property && statement.expression.callee.property.name === 'attachSchema' && statement.expression.arguments[0] && statement.expression.arguments[0].type === 'NewExpression' && statement.expression.arguments[0].callee.name === 'SimpleSchema'){
              const schema = new Schemas(context, statement, jsdocs);
              currentSchema = schema.name; schemas[currentSchema] = schema;
            } else if (statement.type === 'IfStatement' && statement.test && statement.test.type === 'MemberExpression' && statement.test.object && statement.test.object.name === 'Meteor' && statement.test.property && statement.test.property.name === 'isServer'){
              const conseq = statement.consequent && statement.consequent.body || [];
              const data = conseq.filter(s => s.type === 'ExpressionStatement' && s.expression && s.expression.type === 'CallExpression' && s.expression.callee && s.expression.callee.object && s.expression.callee.object.name === 'JsonRoutes').map(s => s.expression.arguments);
              if (data.length){
                if (!currentSchema){ currentSchema = path.basename(p); schemas[currentSchema] = new Schemas(context, null, null, currentSchema); }
                const eps = data.map(d => new EntryPoint(schemas[currentSchema], d)); entryPoints.push(...eps);
                let endOfPrev = -1;
                for (const ep of eps){
                  const op = ep.method; const prior = jsdocs.filter(j => j.loc.end.line + 1 <= op.loc.start.line && j.loc.start.line > endOfPrev);
                  if (prior.length) ep.doc = prior[prior.length - 1];
                  endOfPrev = op.loc.end.line;
                }
              }
            }
          } catch(e){ /* ignore parse hiccups per file */ }
        }
      }
    }
  };
  walk(schemasDir);
  return { schemas, entryPoints };
}

function printOpenapiReturn(obj, indent){
  const pad = ' '.repeat(indent);
  if (Array.isArray(obj)){
    console.log(`${pad}type: array`); console.log(`${pad}items:`); printOpenapiReturn(obj[0], indent+2); return;
  }
  if (obj && typeof obj === 'object'){
    console.log(`${pad}type: object`); console.log(`${pad}properties:`);
    for (const k of Object.keys(obj)){ console.log(`${pad}  ${k}:`); printOpenapiReturn(obj[k], indent+4); }
    return;
  }
  if (typeof obj === 'string') console.log(`${pad}type: ${obj}`);
}

function generateOpenapi(schemas, entryPoints, version){
  console.log(`swagger: '2.0'
info:
  title: Wekan REST API
  version: ${version}
  description: |
    The REST API allows you to control and extend Wekan with ease.
schemes:
  - http
securityDefinitions:
  UserSecurity:
    type: apiKey
    in: header
    name: Authorization
paths:
  /users/login:
    post:
      operationId: login
      summary: Login with REST API
      consumes:
        - application/json
        - application/x-www-form-urlencoded
      tags:
        - Login
      parameters:
        - name: loginRequest
          in: body
          required: true
          description: Login credentials
          schema:
            type: object
            required:
              - username
              - password
            properties:
              username:
                description: |
                  Your username
                type: string
              password:
                description: |
                  Your password
                type: string
                format: password
      responses:
        200:
          description: |-
            Successful authentication
          schema:
            type: object
            required:
              - id
              - token
              - tokenExpires
            properties:
              id:
                type: string
                description: User ID
              token:
                type: string
                description: |
                  Authentication token
              tokenExpires:
                type: string
                format: date-time
                description: |
                  Token expiration date
        400:
          description: |
            Error in authentication
          schema:
            type: object
            properties:
              error:
                type: string
              reason:
                type: string
        default:
          description: |
            Error in authentication`);

  const methods = {};
  for (const ep of entryPoints){ (methods[ep.path] = methods[ep.path] || []).push(ep); }
  const sorted = Object.keys(methods).sort();
  for (const pth of sorted){
    console.log(`  ${methods[pth][0].url}:`);
    for (const ep of methods[pth]){
      const parameters = pth.split('/').filter(t => t.startsWith(':')).map(t => t.endsWith('Id') ? t.slice(1,-2) : t.slice(1));
      console.log(`    ${ep.method_name}:`);
      console.log(`      operationId: ${ep.operationId()}`);
      const sum = ep.summary(); if (sum) console.log(`      summary: ${sum}`);
      const desc = ep.description(); if (desc){ console.log(`      description: |`); desc.split('\n').forEach(l => console.log(`        ${l.trim() ? l : ''}`)); }
      const tags = ep.tags(); if (tags.length){ console.log('      tags:'); tags.forEach(t => console.log(`        - ${t}`)); }
      if (['post','put'].includes(ep.method_name)) console.log(`      consumes:\n        - multipart/form-data\n        - application/json`);
      if (parameters.length || ['post','put'].includes(ep.method_name)) console.log('      parameters:');
      if (['post','put'].includes(ep.method_name)){
        for (const f of ep.body_params){
          console.log(`        - name: ${f}\n          in: formData`);
          const [ptype, optional, pdesc] = ep.docParam(f);
          if (pdesc) console.log(`          description: |\n            ${pdesc}`); else console.log(`          description: the ${f} value`);
          console.log(`          type: ${ptype || 'string'}`);
          console.log(`          ${optional ? 'required: false' : 'required: true'}`);
        }
      }
      for (const p of parameters){
        console.log(`        - name: ${p}\n          in: path`);
        const [ptype, optional, pdesc] = ep.docParam(p);
        if (pdesc) console.log(`          description: |\n            ${pdesc}`); else console.log(`          description: the ${p} value`);
        console.log(`          type: ${ptype || 'string'}`);
        console.log(`          ${optional ? 'required: false' : 'required: true'}`);
      }
      console.log(`      produces:\n        - application/json\n      security:\n          - UserSecurity: []\n      responses:\n        '200':\n          description: |-\n            200 response`);
      const ret = ep.returns();
      if (ret){ console.log('          schema:'); printOpenapiReturn(ret, 12); }
    }
  }
  console.log('definitions:');
  for (const schema of Object.values(schemas)){
    if (!schema.used || !schema.fields) continue;
    console.log(`  ${schema.name}:`);
    console.log('    type: object');
    if (schema.doc) console.log(`    description: ${schema.doc}`);
    console.log('    properties:');
    const props = schema.fields.filter(f => !f.name.includes('.'));
    const req = [];
    for (const prop of props){
      const name = prop.name; console.log(`      ${name}:`);
      if (prop.doc){ console.log('        description: |'); prop.doc.forEach(l => console.log(`          ${l.trim() ? l : ''}`)); }
      let ptype = prop.type; if (ptype === 'enum' || ptype === 'date') ptype = 'string';
      if (ptype !== 'object') console.log(`        type: ${ptype}`);
      if (prop.type === 'array'){
        console.log('        items:');
        for (const el of prop.elements){ if (el === 'object') console.log(`          $ref: "#/definitions/${schema.name + name.charAt(0).toUpperCase() + name.slice(1)}"`); else console.log(`          type: ${el}`); }
      } else if (prop.type === 'object'){
        if (prop.blackbox) console.log('        type: object');
        else console.log(`        $ref: "#/definitions/${schema.name + name.charAt(0).toUpperCase() + name.slice(1)}"`);
      }
      if (!prop.name.includes('.') && !prop.required) console.log('        x-nullable: true');
      if (prop.required) req.push(name);
    }
    if (req.length){ console.log('    required:'); req.forEach(f => console.log(`      - ${f}`)); }
  }
}

function main(){
  const argv = process.argv.slice(2);
  let version = 'git-master';
  let dir = path.resolve(__dirname, '../models');
  for (let i = 0; i < argv.length; i++){
    if (argv[i] === '--release' && argv[i+1]) { version = argv[i+1]; i++; continue; }
    if (!argv[i].startsWith('--')) { dir = path.resolve(argv[i]); }
  }
  const { schemas, entryPoints } = parseSchemas(dir);
  generateOpenapi(schemas, entryPoints, version);
}

if (require.main === module) main();


