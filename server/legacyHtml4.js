import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import Settings from '/models/settings';
import { TAPi18n } from '/imports/i18n';
import { consumeLegacyHtml4Session, sessionFields } from '/server/lib/legacyHtml4Session';
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
  if (req.method === 'POST' && req.body?.legacySession) {
    session = await consumeLegacyHtml4Session(req, path);
    if (!session) {
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
  } else if (!isDocumentRequest(req)) return next();

  const setting = (await Settings.findOneAsync({})) || {};
  const language = requestLanguage(req);
  await TAPi18n.ensureLanguageLoaded(language);
  const translate = key => TAPi18n.__(key, {}, language);
  const user = session ? await Meteor.users.findOneAsync(session.userId, {
    fields: { username: 1 },
  }) : null;

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
    authenticated: Boolean(session),
    username: user?.username || '',
    sessionFields: session ? sessionFields(session, '/allboards') : null,
    language,
    translate,
  }));
});
