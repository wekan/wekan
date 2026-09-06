import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import Settings from '/models/settings';
import { TAPi18n } from '/imports/i18n';
import { consumeLegacyHtml4Session, sessionFields } from '/server/lib/legacyHtml4Session';
import { legacyHtml4Page } from '/server/lib/legacyHtml4Pages';
import {
  importLegacyHtml4File,
  importLegacyHtml4Text,
} from '/server/lib/legacyHtml4Imports';
import {
  isLegacyHtml4Multipart,
  receiveLegacyHtml4Multipart,
  removeLegacyHtml4Upload,
} from '/server/lib/legacyHtml4Multipart';
import {
  createAccessibleCard,
  moveAccessibleCard,
  setAccessibleCardArchived,
  updateAccessibleCardContent,
} from '/server/lib/accessibleCardOperations';
import {
  CAPABILITY_SCRIPT_PATH,
  capabilityScript,
  isDocumentRequest,
  renderLegacyHtml4Page,
} from '/imports/lib/legacyHtml4';

// Progressive enhancement starts with a usable document. A capable browser
// requests the normal Meteor document using a request header after the small
// external probe succeeds. No browser name, cookie or URL mode flag is used.
WebApp.handlers.get(CAPABILITY_SCRIPT_PATH, (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(capabilityScript);
});

function requestLanguage(req) {
  const header = String(req.headers?.['accept-language'] || 'en');
  for (const part of header.split(',')) {
    const requested = part.split(';')[0].trim();
    const exact = TAPi18n.resolveTag(requested);
    const base = TAPi18n.resolveTag(requested.split('-')[0]);
    if (exact || base) return exact || base;
  }
  return 'en';
}

WebApp.handlers.use(async (req, res, next) => {
  const path = new URL(req.url, 'http://wekan.invalid').pathname;
  let session = null;
  let multipartUpload = null;
  if (isLegacyHtml4Multipart(req, path)) {
    try {
      const multipart = await receiveLegacyHtml4Multipart(req);
      req.body = multipart.fields;
      multipartUpload = multipart.upload;
    } catch (_) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Invalid or oversized import upload.');
      return;
    }
  }
  if (req.method === 'POST' && req.body?.legacySession) {
    session = await consumeLegacyHtml4Session(req, path);
    if (!session) {
      await removeLegacyHtml4Upload(multipartUpload);
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-session', {
          req,
          detail: `refused invalid, expired or replayed HTML4 action for ${path}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      res.statusCode = 303;
      res.setHeader('Location', path);
      res.end();
      return;
    }
  } else if (!isDocumentRequest(req)) {
    await removeLegacyHtml4Upload(multipartUpload);
    return next();
  }

  const setting = (await Settings.findOneAsync({})) || {};
  const language = requestLanguage(req);
  await TAPi18n.ensureLanguageLoaded(language);
  const translate = (key, argumentsObject = {}) => TAPi18n.__(key, argumentsObject, language);
  const user = session ? await Meteor.users.findOneAsync(session.userId, {
    fields: { username: 1 },
  }) : null;
  const query = new URL(req.url, 'http://wekan.invalid').searchParams;
  const requestFields = { ...(req.body || {}) };
  const cardOperations = [
    'create-card', 'move-card-up', 'move-card-down', 'edit-card-title',
    'edit-card-description', 'archive-card', 'restore-card',
  ];
  if (session && /^\/b\/[^/]+/.test(path)
    && cardOperations.includes(requestFields.legacyOperation)) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      const result = await DDP._CurrentMethodInvocation.withValue(invocation, async () => {
        if (requestFields.legacyOperation === 'create-card') {
          return createAccessibleCard(session.userId, {
            boardId: requestFields.boardId, listId: requestFields.listId,
            swimlaneId: requestFields.swimlaneId, title: requestFields.cardTitle,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'move-card-up'
          || requestFields.legacyOperation === 'move-card-down') {
          return moveAccessibleCard(session.userId, requestFields.cardId,
            requestFields.legacyOperation === 'move-card-up' ? 'up' : 'down');
        }
        if (requestFields.legacyOperation === 'edit-card-title'
          || requestFields.legacyOperation === 'edit-card-description') {
          return updateAccessibleCardContent(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.legacyOperation === 'edit-card-title' ? 'title' : 'description',
            value: requestFields.legacyOperation === 'edit-card-title'
              ? requestFields.cardTitle : requestFields.cardDescription,
          });
        }
        return setAccessibleCardArchived(session.userId, {
          cardId: requestFields.cardId, boardId: requestFields.boardId,
          archived: requestFields.legacyOperation === 'archive-card',
        });
      });
      requestFields.legacyCardResult = { ok: true, result };
    } catch (error) {
      const errorKey = typeof error?.error === 'string' && /^[a-z0-9_-]{1,100}$/i.test(error.error)
        ? error.error : 'operation-failed';
      requestFields.legacyCardResult = { ok: false, errorKey };
    }
  }
  if (session && requestFields.legacyOperation === 'import-board-text') {
    const source = /^\/import\/([^/]+)$/.exec(path)?.[1] || '';
    requestFields.legacyImportResult = await importLegacyHtml4Text({
      userId: session.userId,
      source,
      text: requestFields.importText,
      fields: requestFields.importFields,
      clientAddress: session.address,
    });
  }
  if (session && multipartUpload && requestFields.legacyOperation === 'import-board-file') {
    const source = /^\/import\/([^/]+)$/.exec(path)?.[1] || '';
    requestFields.legacyImportResult = await importLegacyHtml4File({
      userId: session.userId,
      source,
      upload: multipartUpload,
      fields: requestFields.importFields,
      clientAddress: session.address,
    });
  }
  await removeLegacyHtml4Upload(multipartUpload);
  if (query.has('q')) requestFields.q = query.get('q');
  const page = await legacyHtml4Page(path, session?.userId || null, requestFields, translate);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'X-Wekan-Progressive-Client, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(renderLegacyHtml4Page(req.url, {
    productName: setting.productName || 'WeKan',
    hideLogo: setting.hideLogo === true,
    customLoginLogoLinkUrl: setting.customLoginLogoLinkUrl || '',
    textBelowCustomLoginLogo: setting.textBelowCustomLoginLogo || '',
    legalNotice: setting.legalNotice || '',
    disableRegistration: setting.disableRegistration === true,
    disableForgotPassword: setting.disableForgotPassword === true,
    loginFailed: new URL(req.url, 'http://wekan.invalid').searchParams.get('login') === 'failed',
    registrationFailed: new URL(req.url, 'http://wekan.invalid').searchParams.get('registration') === 'failed',
    authenticated: Boolean(session),
    username: user?.username || '',
    sessionFields: session ? sessionFields(session, '/allboards') : null,
    actionFields: action => session ? sessionFields(session, action) : null,
    page,
    language,
    translate,
  }));
});
