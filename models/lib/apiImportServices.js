'use strict';

// Import from a service's API (decided 2026-10-14): Planka, Microsoft To Do,
// KanbanFlow, Basecamp, Google Tasks and Google Keep. The member types what
// the service needs; server/apiImport.js lists what can be imported and
// fetches the chosen one with those credentials - used for that request and
// never stored - and the import page then imports the fetched JSON like a
// pasted export, through the service's parser (models/lib/<key>ApiFormat.js)
// and the generalized importer, members step and all.
//
// Each service's client is models/lib/apiImport/<key>.js, plain Node:
//   list(credentials, request)       -> [{ id, name }] what can be imported
//   fetch(credentials, id, request)  -> the JSON its parser reads
// `request(url, { method, headers, body })` resolves to the parsed JSON body
// and rejects with an Error carrying `.status` on a non-2xx answer; the
// server passes one that goes through the SSRF guard
// (server/lib/apiImportRequest.js), tests a fake, and the live tests
// (releases/live-tests/<key>-import.mjs) plain fetch.
//
// fields: what the import page asks for, in order. `secret` fields are
// password inputs, cleared once sent. `url` is the service's address for a
// self-hosted one; a hosted service's address is fixed in its client.

const API_IMPORT_SERVICES = [
  { key: 'planka', name: 'Planka', fields: [
    { name: 'url', label: 'api-import-url', required: true },
    { name: 'username', label: 'api-import-username', required: true },
    { name: 'password', label: 'api-import-password', secret: true, required: true },
  ] },
  { key: 'mstodo', name: 'Microsoft To Do', fields: [
    { name: 'token', label: 'api-import-token', secret: true, required: true },
  ] },
  { key: 'kanbanflow', name: 'KanbanFlow', fields: [
    { name: 'token', label: 'api-import-token', secret: true, required: true },
  ] },
  { key: 'basecamp', name: 'Basecamp', fields: [
    { name: 'account', label: 'api-import-account', required: true },
    { name: 'token', label: 'api-import-token', secret: true, required: true },
  ] },
  { key: 'googletasks', name: 'Google Tasks', fields: [
    { name: 'token', label: 'api-import-token', secret: true, required: true },
  ] },
  { key: 'googlekeep', name: 'Google Keep', fields: [
    { name: 'token', label: 'api-import-token', secret: true, required: true },
  ] },
];

const MAX_FIELD_LENGTH = 4096;
const apiImportService = key => API_IMPORT_SERVICES.find(service => service.key === key) || null;

// The credentials a call may carry: the service's own fields, strings, each
// required one present. Throws on anything else, so a method never forwards
// an unexpected value to a client.
function cleanApiImportCredentials(key, input) {
  const service = apiImportService(key);
  if (!service) throw new Error('Unknown import service');
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Credentials are required');
  const allowed = new Set(service.fields.map(field => field.name));
  for (const name of Object.keys(input)) if (!allowed.has(name)) throw new Error(`Unexpected credential field ${name}`);
  const clean = {};
  for (const field of service.fields) {
    const value = input[field.name];
    if (value === undefined || value === null || value === '') {
      if (field.required) throw new Error(`${field.name} is required`);
      continue;
    }
    if (typeof value !== 'string' || value.length > MAX_FIELD_LENGTH) throw new Error(`${field.name} is not valid`);
    clean[field.name] = field.secret ? value : value.trim();
  }
  if (clean.url !== undefined) {
    let parsed;
    try { parsed = new URL(clean.url); } catch (error) { throw new Error('url is not valid'); }
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('url is not valid');
    clean.url = `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  }
  return clean;
}

module.exports = { API_IMPORT_SERVICES, MAX_FIELD_LENGTH, apiImportService, cleanApiImportCredentials };
