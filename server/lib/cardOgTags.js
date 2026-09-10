'use strict';

// Pure logic for injecting Open Graph <meta> tags into a card page's <head>
// so pasting a WeKan card URL into Discourse, Slack, Discord etc. renders an
// inline preview ("onebox") without any site-specific integration - see
// https://github.com/wekan/wekan/issues/3456. Discourse's generic-page-preview
// oneboxer (and every other og:-aware unfurler) needs nothing beyond standard
// og:title/og:description/og:url/og:image meta tags in the served HTML <head>.
//
// This module is deliberately Meteor-free (no `meteor/...` imports) so it can
// be required directly from a plain Node test, matching the pattern already
// used by server/lib/authRateLimitDecision.js.

const DESCRIPTION_MAX_LENGTH = 300;

function escapeHtmlAttribute(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(text, maxLength) {
  if (!text) return '';
  const trimmed = String(text).trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Decide whether a card's Open Graph tags may be exposed to an anonymous
 * (unauthenticated) request, and build them if so.
 *
 * The preview must only ever be built for a card that belongs to a PUBLIC
 * board - a private board's card must never leak its title/description to an
 * anonymous page-preview fetch, since Discourse's unfurl request carries no
 * auth. `board` is expected to already be resolved (or null/undefined when
 * the board could not be found, or the card could not be found at all).
 *
 * @param {object} params
 * @param {object|null} params.card - { title, description, coverUrl }
 * @param {object|null} params.board - must expose isPublic(): boolean
 * @param {string} params.cardUrl - absolute URL of the card page
 * @returns {{tags: Array<{property: string, content: string}>}|null} null
 *   when nothing should be injected (private board, or card/board missing).
 */
function buildCardOpenGraphTags({ card, board, cardUrl }) {
  if (!card || !board) return null;
  if (typeof board.isPublic !== 'function' || !board.isPublic()) return null;
  if (!cardUrl) return null;

  const tags = [
    { property: 'og:title', content: truncate(card.title, 200) || 'WeKan Card' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: cardUrl },
  ];

  const description = truncate(card.description, DESCRIPTION_MAX_LENGTH);
  if (description) {
    tags.push({ property: 'og:description', content: description });
  }

  if (card.coverUrl) {
    tags.push({ property: 'og:image', content: card.coverUrl });
  }

  return { tags };
}

/**
 * Render the tags built by buildCardOpenGraphTags() into an HTML fragment
 * suitable for Meteor WebApp's request.dynamicHead injection point.
 */
function renderOpenGraphTagsHtml(tags) {
  if (!tags || !tags.length) return '';
  return tags
    .map(
      ({ property, content }) =>
        `<meta property="${escapeHtmlAttribute(property)}" content="${escapeHtmlAttribute(content)}">`,
    )
    .join('\n');
}

module.exports = {
  buildCardOpenGraphTags,
  renderOpenGraphTagsHtml,
  escapeHtmlAttribute,
  truncate,
  DESCRIPTION_MAX_LENGTH,
};
