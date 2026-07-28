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
// parsing without an SMTP server; the wiring below needs one and is not exercised
// by the test suite.
// ============================================================================
import fs from 'fs';

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
    // Meteor defaults the connection pool on; keep the same behaviour.
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

// True when the operator told WeKan something about the mail certificate.
export function hasTlsOverrides(env = process.env) {
  return Boolean((env.MAIL_TLS_CA_CERT || '').trim() || (env.MAIL_TLS_SERVERNAME || '').trim());
}

// Install the custom transport when there is something to say, and only then.
// Returns what it did, so the caller can log it.
export function installMailTransport({ Email, EmailInternals, env = process.env } = {}) {
  if (!hasTlsOverrides(env)) return 'default';
  if (!env.MAIL_URL) return 'no-mail-url';
  if (!Email || !EmailInternals) return 'no-email-package';

  const nodemailer = EmailInternals?.NpmModules?.nodemailer?.module;
  if (!nodemailer) return 'no-nodemailer';

  const transport = nodemailer.createTransport(
    smtpOptionsFromUrl(env.MAIL_URL, {
      ca: certificateFrom(env.MAIL_TLS_CA_CERT, { name: 'MAIL_TLS_CA_CERT' }),
      servername: (env.MAIL_TLS_SERVERNAME || '').trim(),
    }),
  );

  // Meteor hands the message plus its own packageSettings; nodemailer takes the
  // message fields as they are and would choke on the extra key.
  Email.customTransport = ({ packageSettings, ...message }) => transport.sendMail(message);

  return 'custom-tls';
}
