// ============================================================================
// The SMTP transport, when the certificate cannot be verified (#6551).
//
// "Error trying to send email: Hostname/IP doesn't match certificate's altnames"
// is a mail server whose certificate does not match the name it is reached by -
// a wildcard that covers one level fewer than the host has, an internal CA, a
// self-signed certificate. Meteor builds its transport from MAIL_URL and offers
// no way to say "connect anyway", so such a server could not be used at all.
//
// MAIL_TLS_REJECT_UNAUTHORIZED=false says it. It is OFF by default and it is
// per-install: WeKan never sets NODE_TLS_REJECT_UNAUTHORIZED, which would drop
// certificate checking for every connection the server makes, not just this one.
// The rest of TLS is unchanged - the connection is still encrypted; what is given
// up is the proof of who is on the other end, which is the operator's decision to
// make for their own mail server.
//
// smtpOptionsFromUrl is pure, so tests/mailTransport.test.cjs can check the
// parsing (ports, smtps, credentials with special characters) without an SMTP
// server. The wiring below needs one, and is not exercised by the test suite.
// ============================================================================

// The nodemailer options for a MAIL_URL, as Meteor's own transport would build
// them - plus the TLS decision.
export function smtpOptionsFromUrl(mailUrl, { rejectUnauthorized = true } = {}) {
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
    tls: { rejectUnauthorized },
  };

  if (url.username) {
    options.auth = {
      // A password with @ / : / % in it arrives percent-encoded in the URL.
      user: decodeURIComponent(url.username),
      pass: decodeURIComponent(url.password || ''),
    };
  }

  return options;
}

// True when the operator asked for the certificate check to be skipped.
export function tlsVerificationDisabled(env = process.env) {
  return String(env.MAIL_TLS_REJECT_UNAUTHORIZED).toLowerCase() === 'false';
}

// Install the custom transport when it is asked for, and only then. Returns what
// it did, so the caller can log it.
export function installMailTransport({ Email, EmailInternals, env = process.env } = {}) {
  if (!tlsVerificationDisabled(env)) return 'default';
  if (!env.MAIL_URL) return 'no-mail-url';
  if (!Email || !EmailInternals) return 'no-email-package';

  const nodemailer = EmailInternals?.NpmModules?.nodemailer?.module;
  if (!nodemailer) return 'no-nodemailer';

  const transport = nodemailer.createTransport(
    smtpOptionsFromUrl(env.MAIL_URL, { rejectUnauthorized: false }),
  );

  // Meteor hands the message plus its own packageSettings; nodemailer takes the
  // message fields as they are and would choke on the extra key.
  Email.customTransport = ({ packageSettings, ...message }) => transport.sendMail(message);

  return 'insecure-tls';
}
