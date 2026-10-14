'use strict';

// The GitHub organization import (server/githubOrgImport.js): every
// repository of an organization - or of a user - as its own board, viewed in
// Board View / Version Control. Pure: tests/githubOrgImport.test.cjs.
//
//   issues    the issues with their comments, labels, milestones and files,
//             through the ordinary GitHub importer (one board per repository)
//   releases  a card per release in the board's Releases list: the tag and
//             name as the title, the notes as the description, the date as
//             received, and - only when chosen - the release files attached
//   actions   each .github/workflows file as Rules
//             (models/lib/githubActionsRules.js)
//   wiki      each wiki page as a card in the Wiki list (models/lib/githubWiki.js)

const PARTS = ['issues', 'releases', 'releaseFiles', 'actions', 'wiki'];
const DEFAULT_PARTS = ['issues', 'releases', 'actions', 'wiki'];
const RELEASES_LIST_TITLE = 'Releases';
const MAX_REPOS = 1000;

// GitHub's own rules: a login is 1-39 letters, digits and hyphens; a
// repository name 1-100 letters, digits, '.', '_' and '-'.
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO = /^[A-Za-z0-9._-]{1,100}$/;

/** The owner of `https://github.com/wekan`, `github.com/wekan/` or `wekan`. */
function ownerFrom(input) {
  const text = String(input || '').trim().replace(/\/+$/, '');
  const m = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#]+)$/i.exec(text);
  const owner = m ? m[1] : text;
  return OWNER.test(owner) ? owner : null;
}

/** The import's options, cleaned, or throws with an i18n key. */
function cleanOrgImport(input) {
  const owner = ownerFrom(input && input.owner);
  if (!owner) throw new Error('github-org-import-owner-invalid');
  const parts = Array.isArray(input.parts) ? [...new Set(input.parts.filter(p => PARTS.includes(p)))] : DEFAULT_PARTS.slice();
  if (!parts.includes('issues')) parts.unshift('issues');
  const repos = Array.isArray(input.repos) ? [...new Set(input.repos.map(String).filter(r => REPO.test(r)))] : null;
  if (repos && !repos.length) throw new Error('github-org-import-no-repos');
  return { owner, parts, repos, includeForks: input.includeForks === true, includeArchived: input.includeArchived !== false };
}

/** The repositories to import, in name order, from the API's repository list. */
function selectRepos(list, { owner, repos, includeForks, includeArchived }) {
  const wanted = repos ? new Set(repos.map(r => r.toLowerCase())) : null;
  return (Array.isArray(list) ? list : [])
    .filter(r => r && typeof r.name === 'string' && REPO.test(r.name))
    .filter(r => !r.owner || !r.owner.login || r.owner.login.toLowerCase() === owner.toLowerCase())
    .filter(r => (wanted ? wanted.has(r.name.toLowerCase()) : (includeForks || !r.fork) && (includeArchived || !r.archived)))
    .map(r => ({ name: r.name, description: r.description || '', archived: !!r.archived, fork: !!r.fork,
      hasIssues: r.has_issues !== false, hasWiki: r.has_wiki !== false, private: !!r.private, url: r.html_url || '' }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, MAX_REPOS);
}

/** A release as a card: [{ title, description, receivedAt, assets }]. */
function releaseCards(releases) {
  return (Array.isArray(releases) ? releases : [])
    .filter(r => r && (r.tag_name || r.name))
    .map((r) => {
      const tag = String(r.tag_name || '').trim();
      const name = String(r.name || '').trim();
      const title = name && name !== tag ? `${tag} ${name}`.trim() : (tag || name);
      const flags = [r.draft ? 'draft' : null, r.prerelease ? 'pre-release' : null].filter(Boolean);
      return {
        title: flags.length ? `${title} (${flags.join(', ')})` : title,
        description: [String(r.body || '').trim(), r.html_url ? `Source: ${r.html_url}` : ''].filter(Boolean).join('\n\n'),
        receivedAt: r.published_at || r.created_at || null,
        assets: (Array.isArray(r.assets) ? r.assets : [])
          .filter(a => a && typeof a.browser_download_url === 'string' && /^https:\/\//.test(a.browser_download_url))
          .map(a => ({ name: String(a.name || 'asset'), url: a.browser_download_url, size: Number(a.size) || 0 })),
      };
    });
}

module.exports = { PARTS, DEFAULT_PARTS, RELEASES_LIST_TITLE, MAX_REPOS, ownerFrom, cleanOrgImport, selectRepos, releaseCards };
