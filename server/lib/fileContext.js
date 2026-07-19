'use strict';

// Resolve the full human-readable context of a stored file for the Admin Panel →
// Problems log: WHO originally uploaded it, WHEN, and WHERE (board › swimlane ›
// list › card), plus the board's organization(s) and team(s). Best-effort and
// server-only — any lookup that fails is simply omitted, never thrown.

const { ReactiveCache } = require('/imports/reactiveCache');

async function resolveFileContext(fileObj) {
  const meta = (fileObj && fileObj.meta) || {};
  const ctx = {
    fileName: fileObj && fileObj.name,
    uploaderUserId: fileObj && fileObj.userId,
    uploadedAt: (fileObj && (fileObj.uploadedAtOstrio || fileObj.updatedAt || fileObj.uploadedAt)) || null,
    boardId: meta.boardId,
    cardId: meta.cardId,
  };
  try {
    if (ctx.uploaderUserId) {
      const u = await ReactiveCache.getUser(ctx.uploaderUserId);
      ctx.uploaderName = (u && u.username) || ctx.uploaderUserId;
    }
    if (meta.boardId) {
      const b = await ReactiveCache.getBoard(meta.boardId);
      if (b) {
        ctx.boardTitle = b.title;
        ctx.orgNames = (b.orgs || []).map(o => o.orgDisplayName || o.orgId).filter(Boolean);
        ctx.teamNames = (b.teams || []).map(t => t.teamDisplayName || t.teamId).filter(Boolean);
      }
    }
    if (meta.swimlaneId) {
      const s = await ReactiveCache.getSwimlane(meta.swimlaneId);
      if (s) ctx.swimlaneTitle = s.title;
    }
    if (meta.listId) {
      const l = await ReactiveCache.getList(meta.listId);
      if (l) ctx.listTitle = l.title;
    }
    if (meta.cardId) {
      const c = await ReactiveCache.getCard(meta.cardId);
      if (c) ctx.cardTitle = c.title;
    }
  } catch (e) { /* best effort — omit whatever could not be resolved */ }
  return ctx;
}

// Format the resolved context as a compact one-line string for the log detail:
//   uploaded by alice on 2026-07-01 12:00:00 | board "Marketing" › swimlane "Q3" ›
//   list "Todo" › card "Launch" | org "Acme" | team "Web"
function formatFileContext(ctx) {
  if (!ctx) return '';
  const parts = [];
  if (ctx.uploaderName) parts.push(`uploaded by ${ctx.uploaderName}`);
  if (ctx.uploadedAt) {
    try {
      parts.push(`on ${new Date(ctx.uploadedAt).toISOString().replace('T', ' ').slice(0, 19)}`);
    } catch (e) { /* ignore bad date */ }
  }
  const loc = [];
  if (ctx.boardTitle) loc.push(`board "${ctx.boardTitle}"`);
  if (ctx.swimlaneTitle) loc.push(`swimlane "${ctx.swimlaneTitle}"`);
  if (ctx.listTitle) loc.push(`list "${ctx.listTitle}"`);
  if (ctx.cardTitle) loc.push(`card "${ctx.cardTitle}"`);
  if (loc.length) parts.push(loc.join(' › '));
  if (ctx.orgNames && ctx.orgNames.length) parts.push('org ' + ctx.orgNames.map(n => `"${n}"`).join(', '));
  if (ctx.teamNames && ctx.teamNames.length) parts.push('team ' + ctx.teamNames.map(n => `"${n}"`).join(', '));
  return parts.join(' | ');
}

module.exports = { resolveFileContext, formatFileContext };
