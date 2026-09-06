import { WebApp } from 'meteor/webapp';
import Settings from '/models/settings';
import { TAPi18n } from '/imports/i18n';
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
  if (!isDocumentRequest(req)) return next();

  const setting = (await Settings.findOneAsync({})) || {};
  const language = requestLanguage(req);
  await TAPi18n.ensureLanguageLoaded(language);
  const translate = key => TAPi18n.__(key, {}, language);

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
    language,
    translate,
  }));
});
