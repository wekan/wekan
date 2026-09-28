// ============================================================================
// The SMTP transport, when the certificate cannot be verified as it stands
// (#6551).
//
// "Error trying to send email: Hostname/IP doesn't match certificate's altnames"
// is a mail server whose certificate does not match the name it is reached by - a
// wildcard that covers one level fewer than the host has, an internal CA, a
// self-signed certificate. Meteor builds its transport from MAIL_URL and offers
// no way to say anything about it, so such a server could not be used at all.
//
// The first answer here was `rejectUnauthorized: false`, which accepts ANY
// certificate - including one a man in the middle presents - and is what the TLS
// handshake exists to prevent (CodeQL js/disabling-certificate-validation). It is
// gone. What is offered instead says exactly what is actually true about the
// server, and keeps verification ON:
//
//   MAIL_TLS_CA_CERT     the certificate (or CA) WeKan should TRUST for this
//                        server: the PEM itself, or a path to a file holding it.
//                        A self-signed certificate is its own issuer, so putting
//                        it here is what makes it valid.
//   MAIL_TLS_SERVERNAME  the name to verify the certificate AGAINST, when the
//                        host WeKan connects to is not the name on it - the
//                        wildcard-one-level-short case from the report.
//
// Both are opt-in and neither weakens anything for anyone who does not set them.
// smtpOptionsFromUrl is pure, so tests/mailTransportTls.test.cjs can check the
// parsing without an SMTP server. Local SMTP browser tests also exercise
// connection closure and queued retry after greeting and idle timeouts.
// ============================================================================
import fs from 'fs';
import { sendDeadlineSmtp, smtpTotalTimeout } from './smtpDeadline';
import { installNativeSmtpDeadline } from './nativeSmtpDeadline';
import { mailServiceStorageKey } from '/models/lib/mailServices';

// A certificate from an env var: the PEM itself, or a path to a file holding it.
// Never fatal - a bad path leaves the system trust store in place and says so,
// rather than stopping mail from being sent at all.
export function certificateFrom(value, { name = 'certificate', readFile = fs.readFileSync } = {}) {
  const text = String(value || '').trim();
  if (!text) return null;

  if (text.includes('-----BEGIN CERTIFICATE-----')) return text;

  try {
    return readFile(text, 'utf8');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `${name}: cannot read ${text} (${error.message}). The system trust store is ` +
      'used instead, so a server with a private certificate will still be refused.',
    );
    return null;
  }
}

// The nodemailer options for a MAIL_URL, as Meteor's own transport would build
// them - plus whatever the operator said about the certificate.
export function smtpOptionsFromUrl(mailUrl, { ca = null, servername = '' } = {}) {
  const url = new URL(mailUrl);

  if (url.protocol !== 'smtp:' && url.protocol !== 'smtps:') {
    throw new Error(`MAIL_URL protocol must be smtp: or smtps:, got ${url.protocol}`);
  }

  const secure = url.protocol === 'smtps:';
  const options = {
    host: url.hostname,
    // The ports SMTP actually uses: 465 is implicit TLS, 587 is STARTTLS.
    port: url.port ? Number(url.port) : (secure ? 465 : 587),
    secure,
    // Preserve the parsed option; the deadline adapter isolates each send.
    pool: true,
    // Verification stays ON. Only the inputs to it can be adjusted below.
    tls: { rejectUnauthorized: true },
  };

  if (ca) options.tls.ca = ca;
  if (servername) options.tls.servername = servername;

  if (url.username) {
    options.auth = {
      // A password with @ / : / % in it arrives percent-encoded in the URL.
      user: decodeURIComponent(url.username),
      pass: decodeURIComponent(url.password || ''),
    };
  }

  return options;
}

// Transport-owned timeouts close the connection instead of merely abandoning
// a Promise while SMTP continues in the background. These are phase/idle
// limits, not an absolute deadline against a peer that keeps sending bytes.
export function smtpTimeouts(env = process.env) {
  const defaults = { connectionTimeout: 30000, greetingTimeout: 30000,
    socketTimeout: 120000, dnsTimeout: 30000 };
  const names = { connectionTimeout: 'MAIL_CONNECTION_TIMEOUT_MS',
    greetingTimeout: 'MAIL_GREETING_TIMEOUT_MS', socketTimeout: 'MAIL_SOCKET_TIMEOUT_MS',
    dnsTimeout: 'MAIL_DNS_TIMEOUT_MS' };
  for (const [key, name] of Object.entries(names)) {
    if (env[name] === undefined || env[name] === '') continue;
    const value = Number(env[name]);
    if (!Number.isSafeInteger(value) || value < 1000 || value > 900000) {
      throw new Error(`${name} must be an integer from 1000 to 900000`);
    }
    defaults[key] = value;
  }
  return defaults;
}

// Preserve URL authentication, service and transport options while ensuring
// zero/negative URL values cannot disable the application's timeout policy.
export function boundedSmtpUrl(mailUrl, timeouts) {
  const url = new URL(mailUrl);
  for (const [name, value] of Object.entries(timeouts)) url.searchParams.set(name, String(value));
  if (!url.searchParams.has('pool')) url.searchParams.set('pool', 'true');
  return url.toString();
}

// True when the operator told WeKan something about the mail certificate.
export function hasTlsOverrides(env = process.env) {
  return Boolean((env.MAIL_TLS_CA_CERT || '').trim() || (env.MAIL_TLS_SERVERNAME || '').trim());
}

// Install SMTP limits for both standard MAIL_URL and certificate overrides.
// Returns what it did, so the caller can log it.
export function installMailTransport({ Email, EmailInternals, env = process.env } = {}) {
  if (!env.MAIL_URL) {
    // Meteor.settings.packages.email can select a native SMTP service without
    // MAIL_URL. Install its factory policy before the first send in that mode.
    const nodemailer = EmailInternals?.NpmModules?.nodemailer?.module;
    if (nodemailer) installNativeSmtpDeadline(nodemailer, {
      timeoutMs: smtpTotalTimeout(env), timeouts: smtpTimeouts(env),
    });
    return 'no-mail-url';
  }
  const customTls = hasTlsOverrides(env);
  if (!customTls && !/^smtps?:/i.test(env.MAIL_URL)) return 'default';
  if (!Email || !EmailInternals) return 'no-email-package';

  const nodemailer = EmailInternals?.NpmModules?.nodemailer?.module;
  if (!nodemailer) return 'no-nodemailer';

  const timeouts = smtpTimeouts(env);
  if (!customTls) {
    // Keep Meteor's native transport selection and stream plugins (including
    // encrypted/signed mail). Its cache follows the normalized URL.
    installNativeSmtpDeadline(nodemailer, { timeoutMs: smtpTotalTimeout(env), timeouts });
    const url = new URL(boundedSmtpUrl(env.MAIL_URL, timeouts));
    url.searchParams.set('wekanTotalTimeout', String(smtpTotalTimeout(env)));
    env.MAIL_URL = url.toString();
    return 'bounded-smtp';
  }
  const makeOptions = mailUrl => ({
    ...smtpOptionsFromUrl(mailUrl, {
      ca: certificateFrom(env.MAIL_TLS_CA_CERT, { name: 'MAIL_TLS_CA_CERT' }),
      servername: (env.MAIL_TLS_SERVERNAME || '').trim(),
    }), ...timeouts,
  });
  let configuredUrl = env.MAIL_URL;
  let options = makeOptions(configuredUrl);
  const timeoutMs = smtpTotalTimeout(env);

  // Meteor hands the message plus its own packageSettings; nodemailer takes the
  // message fields as they are and would choke on the extra key.
  Email.customTransport = ({ packageSettings, ...message }) => {
    // Meteor normally refreshes its cached transport when MAIL_URL changes.
    // Preserve that behavior for settings hooks such as Sandstorm's updater.
    if (env.MAIL_URL !== configuredUrl) {
      options = makeOptions(env.MAIL_URL);
      configuredUrl = env.MAIL_URL;
    }
    return sendDeadlineSmtp({ nodemailer, options, message, timeoutMs });
  };

  return 'custom-tls';
}

// Admin Panel mail settings deliberately use Nodemailer's bundled well-known
// SMTP profiles. They provide host/port/TLS defaults; authentication remains in
// WeKan's database and is never published to a browser.
export function installAdminMailTransport({ Email, EmailInternals, mailServer, env = process.env } = {}) {
  if (!Email || !EmailInternals || !mailServer?.enabled) return 'disabled';
  const nodemailer = EmailInternals?.NpmModules?.nodemailer?.module;
  if (!nodemailer) return 'no-nodemailer';

  const service = mailServer.service || 'SMTP';
  const storageKey = mailServiceStorageKey(service);
  const config = mailServer.configurations?.[storageKey] || {};
  const password = mailServer.passwords?.[storageKey] || '';
  let options;
  if (service === 'SMTP') {
    if (!config.host) throw new Error('SMTP host is required');
    options = {
      host: config.host,
      port: Number(config.port || (config.secure ? 465 : 587)),
      secure: config.secure === true,
      pool: true,
      tls: { rejectUnauthorized: true },
    };
  } else {
    options = { service, pool: true };
  }
  if (config.username) options.auth = { user: config.username, pass: password };

  options = { ...options, ...smtpTimeouts(env) };
  const timeoutMs = smtpTotalTimeout(env);
  Email.customTransport = ({ packageSettings, ...message }) =>
    sendDeadlineSmtp({ nodemailer, options, message, timeoutMs });
  return 'admin-settings';
}
