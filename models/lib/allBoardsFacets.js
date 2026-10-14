'use strict';

// #4791: All Boards organized automatically - boards grouped and counted by
// the first character of their names, by the member's own board labels, and
// by the organizations and teams (subgroups) they are shared with. A facet
// bar above All Boards shows each group with its count; clicking one shows
// only that group's boards.
//
// Board labels are the member's own (profile.boardLabels: { label: [boardId] })
// - a way to file boards, not something other members see - and "apply label
// X to every board whose name includes Y" files many at once.
// Pure: tests/allBoardsFacets.test.cjs.

// The first character as a reader sees it: one whole emoji or letter, upper
// case, so "apple" and "Apple" are one group.
function firstCharacter(title) {
  const t = String(title || '').trim();
  if (!t) return '';
  const first = Array.from(t)[0];
  return first.toLocaleUpperCase();
}

function countBy(items, keyOf) {
  const counts = new Map();
  for (const item of items) {
    for (const key of [].concat(keyOf(item) || [])) {
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

function boardFacets(boards, { orgNames = {}, teamNames = {}, boardLabels = {} } = {}) {
  const list = Array.isArray(boards) ? boards : [];
  const chars = [...countBy(list, b => firstCharacter(b.title))]
    .map(([key, count]) => ({ key, count })).sort((a, b) => a.key.localeCompare(b.key));
  const activeIds = (arr, k) => (Array.isArray(arr) ? arr : []).filter(x => x && x.isActive !== false).map(x => x[k]);
  const orgs = [...countBy(list, b => activeIds(b.orgs, 'orgId'))]
    .map(([key, count]) => ({ key, name: orgNames[key] || key, count })).sort((a, b) => a.name.localeCompare(b.name));
  const teams = [...countBy(list, b => activeIds(b.teams, 'teamId'))]
    .map(([key, count]) => ({ key, name: teamNames[key] || key, count })).sort((a, b) => a.name.localeCompare(b.name));
  const ids = new Set(list.map(b => b._id));
  const labels = Object.entries(boardLabels && typeof boardLabels === 'object' ? boardLabels : {})
    .map(([key, boardIds]) => ({ key, count: (Array.isArray(boardIds) ? boardIds : []).filter(id => ids.has(id)).length }))
    .filter(l => l.count > 0).sort((a, b) => a.key.localeCompare(b.key));
  return { chars, orgs, teams, labels };
}

// The selector part that keeps one facet's boards; null for none.
function facetSelector(facet, boardLabels = {}) {
  if (!facet || typeof facet !== 'object' || typeof facet.value !== 'string' || !facet.value) return null;
  switch (facet.type) {
    case 'char': {
      const c = Array.from(facet.value)[0];
      const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return { title: { $regex: `^\\s*(${esc(c.toLocaleUpperCase())}|${esc(c.toLocaleLowerCase())})` } };
    }
    case 'org': return { orgs: { $elemMatch: { orgId: facet.value, isActive: { $ne: false } } } };
    case 'team': return { teams: { $elemMatch: { teamId: facet.value, isActive: { $ne: false } } } };
    case 'label': {
      const ids = boardLabels && Array.isArray(boardLabels[facet.value]) ? boardLabels[facet.value] : [];
      return { _id: { $in: ids } };
    }
    default: return null;
  }
}

const MAX_LABEL = 40;
function cleanLabel(label) {
  return typeof label === 'string' ? label.replace(/[\u0000-\u001f\u007f.$]/g, '').trim().slice(0, MAX_LABEL) : '';
}

// Labels after applying `label` to the boards whose titles include `text`.
function applyBoardLabel(boardLabels, label, boards, text) {
  const name = cleanLabel(label);
  const needle = String(text || '').trim().toLocaleLowerCase();
  const out = { ...(boardLabels && typeof boardLabels === 'object' ? boardLabels : {}) };
  if (!name || !needle) return { labels: out, added: 0 };
  const current = new Set(Array.isArray(out[name]) ? out[name] : []);
  const before = current.size;
  for (const b of Array.isArray(boards) ? boards : []) {
    if (b && String(b.title || '').toLocaleLowerCase().includes(needle)) current.add(b._id);
  }
  out[name] = [...current].slice(0, 5000);
  return { labels: out, added: current.size - before };
}

module.exports = { firstCharacter, boardFacets, facetSelector, cleanLabel, applyBoardLabel, MAX_LABEL };
