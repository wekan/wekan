'use strict';

import { adfPlainText } from './externalParsers.js';

// What a Jira Cloud REST v3 issue carries beyond the fields JiraCreator has
// always mapped (summary, ADF description, status, labels, assignee, reporter,
// dates, time tracking, estimates, issue type and links), decided without a
// database so it can be tested in plain Node.
//
//   tags          priority, components and fix versions, as board labels
//   comments      fields.comment.comments, ADF bodies as plain text
//   parentKey     fields.parent.key, linked when that issue is imported too
//   subtasks      fields.subtasks that are NOT imported: a checklist instead
//   custom_fields customfield_NNNNN values, named from the search response's
//                 `names` map (expand=names) when present
//   unsupported   attachments (metadata only) and a parent outside the import

function jiraName(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    const parts = value.map(jiraName).filter(v => v !== undefined && v !== '');
    return parts.length ? parts : undefined;
  }
  if (typeof value === 'object') {
    if (value.type === 'doc') return adfPlainText(value) || undefined;
    const named = value.value ?? value.name ?? value.displayName ?? value.key;
    if (named !== undefined && named !== null && typeof named !== 'object') return named;
    if (value.child) return jiraName(value.child);
  }
  return undefined;
}

export function jiraIssueExtras(issue, { names = {}, importedKeys = new Set(), skipFields = [] } = {}) {
  const fields = (issue && issue.fields) || {};
  const at = `/issues/${issue && issue.key ? issue.key : '?'}`;
  const tags = [];
  const priority = fields.priority && jiraName(fields.priority);
  if (priority) tags.push(`priority:${priority}`);
  (Array.isArray(fields.components) ? fields.components : []).forEach(c => { const n = jiraName(c); if (n) tags.push(String(n)); });
  (Array.isArray(fields.fixVersions) ? fields.fixVersions : []).forEach(v => { const n = jiraName(v); if (n) tags.push(`version:${n}`); });

  const comments = ((fields.comment && Array.isArray(fields.comment.comments)) ? fields.comment.comments : [])
    .filter(Boolean)
    .map(c => ({
      text: adfPlainText(c.body),
      author: c.author && (c.author.accountId || c.author.name || c.author.emailAddress),
      authorName: c.author && (c.author.displayName || c.author.name),
      date: c.created,
    }));

  const unsupported = [];
  const parentKey = fields.parent && fields.parent.key;
  if (parentKey && !importedKeys.has(parentKey)) {
    unsupported.push({ path: `${at}/parent`, reason: `parent ${parentKey} is not part of this import` });
  }
  const subtasks = (Array.isArray(fields.subtasks) ? fields.subtasks : [])
    .filter(sub => sub && !(sub.key && importedKeys.has(sub.key)))
    .map(sub => {
      const f = sub.fields || {};
      const title = [sub.key ? `[${sub.key}]` : null, f.summary].filter(Boolean).join(' ');
      const category = f.status && f.status.statusCategory && f.status.statusCategory.key;
      return { title, done: category === 'done' };
    })
    .filter(sub => sub.title);

  const custom = {};
  const skip = new Set(skipFields);
  Object.keys(fields).filter(key => /^customfield_\d+$/.test(key) && !skip.has(key)).forEach(key => {
    const value = jiraName(fields[key]);
    if (value === undefined || value === '') return;
    custom[typeof names[key] === 'string' && names[key] ? names[key] : key] = value;
  });

  const attachments = Array.isArray(fields.attachment) ? fields.attachment.length : 0;
  if (attachments) {
    unsupported.push({ path: `${at}/attachment`, reason: `${attachments} attachment(s): the search API carries metadata, not file contents` });
  }
  return {
    tags,
    comments,
    parentKey: parentKey && importedKeys.has(parentKey) ? parentKey : undefined,
    checklists: subtasks.length ? [{ title: 'Sub-tasks', items: subtasks }] : [],
    custom_fields: custom,
    unsupported,
  };
}

// A search response is one page. Enhanced search (/search/jql) ends with
// isLast; the classic one reports startAt/total. Say when pages are missing.
export function jiraPageWarnings(data) {
  if (!data || Array.isArray(data)) return [];
  const issues = Array.isArray(data.issues) ? data.issues.length : 0;
  if (data.isLast === false || (typeof data.nextPageToken === 'string' && data.nextPageToken && data.isLast !== true)) {
    return [{ path: '/nextPageToken', reason: 'more result pages exist; only the pages in this file were imported' }];
  }
  const total = Number(data.total);
  const startAt = Number(data.startAt) || 0;
  if (Number.isFinite(total) && total > startAt + issues) {
    return [{ path: '/total', reason: `${total - startAt - issues} issue(s) are on other result pages; only this file was imported` }];
  }
  return [];
}
