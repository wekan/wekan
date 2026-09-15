#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logDirectory from '../../tools/log-directory.cjs';
import { api, readConfig, localLanguages, readToken } from './sync-transifex-languages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
// PR #6695 brought these files from human Transifex work. Whole-file target
// uploads could replace newer remote human strings with local direct fills.
const HUMAN_OWNED_FILES = new Set(Object.keys(JSON.parse(fs.readFileSync(
  path.join(root, 'releases/translations/pr6695-superseded-translations.json'), 'utf8'))));

export function retryingRequest(request, { sleep = wait, log = console.log, maxAttempts = 6 } = {}) {
  return async (method, url, body) => {
    for (let attempt = 1; ; attempt++) {
      try { return await request(method, url, body); }
      catch (error) {
        const transientRead = method === 'GET' && (
          [408, 500, 502, 503, 504].includes(error.status) ||
          error instanceof TypeError || ['AbortError', 'TimeoutError'].includes(error.name));
        // A 429 explicitly refuses the request; other failed writes may already
        // have created a job, so do not blindly resubmit them.
        if (attempt >= maxAttempts || !(transientRead || error.status === 429)) throw error;
        let remaining = Math.max(error.retryAfterMs || 0,
          error.status === 429 ? 60000 : Math.min(32000, 2000 * 2 ** (attempt - 1)));
        log(`[tx] ${method} ${url}: ${error.status || error.name}; retry ${attempt + 1}/${maxAttempts} after ${Math.ceil(remaining / 1000)}s`);
        while (remaining > 0) {
          const chunk = Math.min(30000, remaining);
          await sleep(chunk);
          remaining -= chunk;
          if (remaining > 0) log(`[tx] retry wait: ${Math.ceil(remaining / 1000)}s remaining`);
        }
      }
    }
  };
}

export function validateTranslation(content, source) {
  const data = JSON.parse(content);
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Expected a JSON object');
  const tokens = value => [...value.matchAll(/__[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*__|%(?:\d+\$)?[A-Za-z]/g)].map(x => x[0]).sort().join('\n');
  const expected = Object.keys(source).sort();
  if (Object.keys(data).sort().join('\n') !== expected.join('\n')) throw new Error('Translation keys differ from the source');
  for (const key of expected) {
    if (typeof data[key] !== 'string' || (!data[key].trim() && source[key].trim())) throw new Error(`Empty or non-string value: ${key}`);
    if (tokens(data[key]) !== tokens(source[key])) throw new Error(`Broken source placeholders: ${key}`);
  }
  return data;
}

export async function uploadFile({ request, resource, language, content, source = false, sleep = wait, log = console.log, maxPolls = 300 }) {
  const type = source ? 'resource_strings_async_uploads' : 'resource_translations_async_uploads';
  const relationships = { resource: { data: { type: 'resources', id: resource } } };
  if (!source) relationships.language = { data: { type: 'languages', id: `l:${language}` } };
  // A full upload unconditionally replaces local keys' remote values, without
  // the CLI's timestamp skip. Source-editor edits must also yield to the file.
  const attributes = { content, content_encoding: 'text', ...(source
    ? { replace_edited_strings: true, keep_translations: true }
    : { file_type: 'default' }) };
  let job = await request('POST', `/${type}`, { data: { type, attributes, relationships } });
  log(`[tx] upload accepted: ${source ? 'source' : language}; checking job status`);
  const pollURL = job?.data?.links?.self || (job?.data?.id && `/${type}/${encodeURIComponent(job.data.id)}`);
  for (let poll = 0; poll < maxPolls; poll++) {
    const state = job?.data?.attributes;
    if (state?.status === 'succeeded') return state.details || {};
    if (state?.status === 'failed' || state?.errors?.length) {
      throw new Error(state?.errors?.map(error => error.detail || error.code).join('; ') || 'Upload failed');
    }
    if (!pollURL) throw new Error('Upload response has no job ID or status link');
    if (state?.status !== 'pending' && state?.status !== 'processing') throw new Error(`Unknown upload status: ${state?.status}`);
    if (poll % 15 === 0) log(`[tx] ${source ? 'source' : language}: ${state.status} (status check ${poll + 1}/${maxPolls})`);
    await sleep(2000);
    job = await request('GET', pollURL);
  }
  throw new Error('Upload did not finish within the polling limit');
}

export async function pushTranslations({ config, languages, request, readContent, log = console.log, sleep = wait }) {
  const resource = `o:${config.org}:p:${config.project}:r:${config.resource}`;
  const project = `o:${config.org}:p:${config.project}`;
  const failures = [], succeeded = [], skipped = [];
  let source;
  // English is the source upload; all regional English files are target uploads.
  try {
    const content = readContent(config.sourceFile);
    source = JSON.parse(content);
    validateTranslation(content, source);
    log(`[tx] uploading source ${config.sourceLanguage}`);
    await uploadFile({ request, resource, content, source: true, sleep, log });
    succeeded.push({ file: config.sourceFile, code: config.sourceLanguage, source: true });
    log(`[tx] uploaded source ${config.sourceLanguage}`);
  } catch (error) {
    log(`[tx] FAILED source ${config.sourceLanguage}: ${error.message}; target uploads cannot proceed`);
    failures.push({ file: config.sourceFile, code: config.sourceLanguage, reason: error.message });
    for (const language of languages) failures.push({ ...language, reason: 'Not uploaded because the source upload failed' });
    return { succeeded, failures };
  }
  // Refresh on every invocation; prior failure reports never suppress retries.
  const existing = new Set();
  try {
    let url = `/projects/${project}/languages`;
    const visited = new Set();
    while (url) {
      if (visited.has(url)) throw new Error('Repeated project-language pagination link');
      visited.add(url);
      const page = await request('GET', url);
      for (const item of page.data || []) existing.add(item.attributes?.code || item.id?.replace(/^l:/, ''));
      url = page.links?.next || null;
    }
  } catch (error) {
    // Still try every language individually. Relationship POSTs are additive,
    // and a failed global listing must not silently omit the local files.
    log(`[tx] could not list project languages: ${error.message}; trying each language`);
  }
  for (const language of languages) {
    if (HUMAN_OWNED_FILES.has(language.file)) {
      skipped.push({ ...language, reason: 'Human translations from PR #6695; target upload skipped' });
      log(`[tx] skipping ${language.code} (${language.file}.i18n.json): preserving remote human translations`);
      continue;
    }
    try {
      const file = `imports/i18n/data/${language.file}.i18n.json`;
      const content = readContent(file);
      validateTranslation(content, source);
      if (!existing.has(language.code)) {
        log(`[tx] adding project language ${language.code} (${language.file}.i18n.json)`);
        try {
          await request('POST', `/projects/${project}/relationships/languages`, {
            data: [{ type: 'languages', id: `l:${language.code}` }],
          });
        } catch (error) {
          // A concurrent addition may return conflict. Confirm it rather than
          // treating an unsupported catalogue code as successfully added.
          if (error.status !== 409) throw new Error(`Could not add language: ${error.message}`);
          let url = `/projects/${project}/languages`;
          let found = false;
          const visited = new Set();
          while (url) {
            if (visited.has(url)) throw new Error('Repeated project-language pagination link');
            visited.add(url);
            const page = await request('GET', url);
            found ||= page.data?.some(item => (item.attributes?.code || item.id?.replace(/^l:/, '')) === language.code);
            url = page.links?.next || null;
          }
          if (!found) throw error;
        }
        existing.add(language.code);
      }
      log(`[tx] uploading ${language.code} (${language.file}.i18n.json)`);
      await uploadFile({ request, resource, language: language.code, content, sleep, log });
      succeeded.push(language);
      log(`[tx] uploaded ${language.code} (${language.file}.i18n.json)`);
    } catch (error) {
      failures.push({ ...language, reason: error.message });
      log(`[tx] FAILED ${language.code} (${language.file}.i18n.json): ${error.message}`);
    }
  }
  return { succeeded, failures, skipped };
}

export async function languageSupportReport({ request, languages, result }) {
  const catalogue = new Map();
  const visited = new Set();
  try {
    let url = '/languages';
    while (url) {
      if (visited.has(url)) throw new Error('Repeated catalogue pagination link');
      visited.add(url);
      const page = await request('GET', url);
      if (!Array.isArray(page.data)) throw new Error('Invalid language catalogue response');
      for (const item of page.data) {
        const code = item.attributes?.code || item.id?.replace(/^l:/, '');
        if (!code) throw new Error('Catalogue language has no code');
        catalogue.set(code, { code, name: item.attributes?.name || code });
      }
      url = page.links?.next || null;
    }
  } catch (error) {
    return { catalogueError: error.message, supportedFailures: [], unsupported: [], additional: [] };
  }
  const localCodes = new Set([...languages.map(item => item.code), ...result.succeeded.map(item => item.code)]);
  return {
    catalogueError: null,
    supportedFailures: result.failures.filter(item => catalogue.has(item.code)),
    unsupported: languages.filter(item => !catalogue.has(item.code) && !result.succeeded.some(done => done.code === item.code)),
    additional: [...catalogue.values()].filter(item => !localCodes.has(item.code)).sort((a, b) => a.code.localeCompare(b.code)),
  };
}

export function printUploadSummary(result, log = console.log) {
  const section = (title, rows, format) => {
    log(`[tx] ${title}:`);
    if (!rows.length) log('  None');
    for (const row of rows) log(`  ${format(row)}`);
  };
  log(`\n[tx] ${result.succeeded.length} uploaded; ${result.failures.length} failed`);
  section('Languages successfully pushed', result.succeeded, row => `${row.code}\t${row.file}${row.source ? '\t(source)' : ''}`);
  section('Human-owned languages protected from whole-file upload', result.skipped || [], row => `${row.code}\t${row.file}\t${row.reason}`);
  section('Languages whose uploads did not work', result.failures, row => `${row.code}\t${row.file}\t${row.reason}`);
  const support = result.languageSupport;
  if (support.catalogueError) log(`[tx] Language support could not be verified: ${support.catalogueError}; no languages classified as unsupported`);
  else {
    section('Supported languages whose uploads can be retried after fixing the reported error', support.supportedFailures, row => `${row.code}\t${row.file}\t${row.reason}`);
    section('Local languages absent from the Transifex catalogue', support.unsupported, row => `${row.code}\t${row.file}\tCatalogue support must be requested`);
    section('Additional supported targets; local translations and locale mappings must be prepared before upload', support.additional, row => `${row.code}\t${row.name}`);
  }
  log('[tx] Missing supported project languages are added automatically. The tx CLI cannot create unsupported global catalogue languages.');
  log('[tx] Request catalogue support with the language name, ISO/BCP47 code, aliases and authoritative Unicode plural rules: https://help.transifex.com/en/articles/6208588-how-do-i-add-a-new-language');
}

async function main() {
  const logDir = logDirectory.reserve(path.join(root, '.tools/log'), 'translations-push');
  const timestamp = path.basename(logDir);
  const statusFile = path.join(root, '.tools/log', `push-all-translations_${timestamp}.txt`);
  fs.mkdirSync(path.dirname(statusFile), { recursive: true });
  // Append so simultaneous invocations cannot truncate another run's status.
  fs.appendFileSync(statusFile, '');
  for (const stream of [process.stdout, process.stderr]) {
    const write = stream.write.bind(stream);
    stream.write = (chunk, encoding, callback) => {
      fs.appendFileSync(statusFile, chunk, typeof encoding === 'string' ? encoding : undefined);
      return write(chunk, encoding, callback);
    };
  }
  console.log(`[tx] status log: ${statusFile}`);
  const args = process.argv.slice(2);
  if (args.some(arg => !['--dry-run', '--help'].includes(arg))) throw new Error('Usage: push-all-translations.sh [--dry-run]');
  if (args.includes('--help')) {
    console.log('Usage: releases/translations/push-all-translations.sh [--dry-run]\nForce-upload source and local translations except human-owned PR #6695 files; add missing project languages.\nCredentials: TX_TOKEN or ~/.transifexrc. NODE_BIN selects the Node executable.');
    return;
  }
  process.chdir(root);
  const config = readConfig();
  if (!config.sourceFile) throw new Error('Missing source_file in .tx/config');
  const languages = localLanguages(config);
  for (const language of languages) {
    for (const alias of language.aliases || []) {
      console.log(`[tx] alias ${alias}.i18n.json -> ${language.code}; using mapped ${language.file}.i18n.json`);
    }
  }
  const source = JSON.parse(fs.readFileSync(config.sourceFile, 'utf8'));
  if (args.includes('--dry-run')) {
    const failures = [];
    for (const language of languages) {
      try { validateTranslation(fs.readFileSync(`imports/i18n/data/${language.file}.i18n.json`, 'utf8'), source); }
      catch (error) { failures.push({ ...language, reason: error.message }); }
      console.log(`${language.file}.i18n.json -> ${language.code}`);
      if (HUMAN_OWNED_FILES.has(language.file)) console.log(`  protected human translations: target upload skipped`);
    }
    console.log(`[tx] dry run: ${languages.length} targets and source ${config.sourceLanguage}; no network requests`);
    for (const failure of failures) console.error(`[tx] invalid ${failure.file}.i18n.json: ${failure.reason}`);
    if (failures.length) process.exitCode = 1;
    return;
  }
  const token = readToken();
  if (!token) throw new Error('Set TX_TOKEN or configure ~/.transifexrc before uploading');
  const request = retryingRequest(async (method, url, body) => {
      try { return await api(token, method, url, body); }
      catch (error) { error.message = error.message.replaceAll(token, '[redacted]'); throw error; }
    });
  const result = await pushTranslations({ config, languages, request,
    readContent: filename => fs.readFileSync(filename, 'utf8'),
  });
  result.languageSupport = await languageSupportReport({ request, languages, result });
  const safeResult = JSON.parse(JSON.stringify(result).replaceAll(token, '[redacted]'));
  fs.writeFileSync(path.join(logDir, 'report.json'), `${JSON.stringify(safeResult, null, 2)}\n`);
  printUploadSummary(safeResult);
  console.log(`[tx] report: ${logDir}/report.json`);
  if (result.failures.length) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`[tx] ${error.message}`); process.exitCode = 1; });
}
