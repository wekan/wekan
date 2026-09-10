// Injects standard Open Graph <meta> tags into a public card page's <head>
// so pasting a WeKan card URL elsewhere (Discourse, Slack, Discord, ...)
// renders an inline link preview - see https://github.com/wekan/wekan/issues/3456.
//
// Meteor apps are normally served as a single SPA shell (Meteor's own
// boilerplate); WebApp supports per-request head injection via
// `request.dynamicHead`, which its boilerplate generator appends into
// <head> (see webapp.js's getBoilerplateAsync -> dynamicHead). This
// middleware sets that field for a card URL request, before Meteor's normal
// SPA boilerplate handler serves the page, exactly like the existing
// server/routes/customHeadAssets.js precedent injects other head content.
//
// Privacy: the preview is only ever built for a card whose board is PUBLIC
// (board.isPublic()) - see server/lib/cardOgTags.js. A private board's card
// serves the normal, unmodified page: no metadata leak, no behavior change.
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import { generateUniversalAttachmentUrl } from '/models/lib/universalUrlGenerator';
import {
  buildCardOpenGraphTags,
  renderOpenGraphTagsHtml,
} from '/server/lib/cardOgTags';

// Matches the 'card' FlowRouter route '/b/:boardId/:slug/:cardId'
// (config/router.js). boardId/cardId are Meteor Random.id()-style tokens;
// slug is free-form and not needed to look the card up.
const CARD_URL_RE = /^\/b\/([^/]+)\/[^/]+\/([^/]+)\/?$/;

function getRootUrl() {
  return (process.env.ROOT_URL || '').replace(/\/+$/, '');
}

async function loadCardOpenGraphHtml(boardId, cardId, requestUrl) {
  const card = await ReactiveCache.getCard(cardId);
  if (!card || card.boardId !== boardId) return '';

  const board = await ReactiveCache.getBoard(boardId);
  if (!board) return '';

  const cover = typeof card.cover === 'function' ? card.cover() : null;
  const coverUrl = cover && cover._id
    ? `${getRootUrl()}${generateUniversalAttachmentUrl(cover._id)}`
    : null;

  const cardUrl = `${getRootUrl()}${requestUrl}`;

  const result = buildCardOpenGraphTags({
    card: {
      title: card.title,
      description: card.description,
      coverUrl,
    },
    board,
    cardUrl,
  });

  if (!result) return '';
  return renderOpenGraphTagsHtml(result.tags);
}

WebApp.handlers.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const pathname = (req.url || '').split('?')[0];
  const match = pathname.match(CARD_URL_RE);
  if (!match) return next();

  const [, boardId, cardId] = match;

  try {
    const html = await loadCardOpenGraphHtml(boardId, cardId, pathname);
    if (html) {
      // Merge with anything already set, in case another handler runs first.
      req.dynamicHead = req.dynamicHead ? `${req.dynamicHead}\n${html}` : html;
    }
  } catch (e) {
    // A failed lookup must never break the page - fall through to the
    // normal, unmodified SPA shell.
    console.error('cardOgTags: failed to build Open Graph tags', e);
  }

  return next();
});
