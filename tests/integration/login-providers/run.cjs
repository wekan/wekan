'use strict';
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn, execFileSync } = require('node:child_process');
const { startProvider } = require('./provider.cjs');
const { smtpSink } = require('../../playwright/helpers/smtpSink');
const root = path.resolve(__dirname, '../../..');
const bundle = path.resolve(process.argv[2] || '.build/bundle');
const sandstorm = process.argv.includes('--sandstorm');
const browser = process.env.WEKAN_PLAYWRIGHT_PROJECT || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(browser)) throw Error('Unsupported WEKAN_PLAYWRIGHT_PROJECT');
async function port() { const server = net.createServer(); await new Promise(r => server.listen(0, '127.0.0.1', r)); const n = server.address().port; await new Promise(r => server.close(r)); return n; }
(async () => {
  if (!fs.existsSync(path.join(bundle, 'start-wekan.sh'))) throw Error('Pass a prepared local bundle with start-wekan.sh and FerretDB');
  fs.mkdirSync(path.join(root, '.tools/tmp/login-providers'), { recursive: true });
  const work = fs.mkdtempSync(path.join(root, '.tools/tmp/login-providers/run-'));
  process.env.TMPDIR = work;
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', work + '/key.pem', '-out', work + '/cert.pem', '-days', '2', '-subj', '/CN=WeKan-test-only'], { stdio: 'ignore' });
  const certificate = fs.readFileSync(work + '/cert.pem', 'utf8');
  const provider = await startProvider({ certificate, privateKey: fs.readFileSync(work + '/key.pem', 'utf8') });
  const smtpPort = await port();
  const smtp = await smtpSink(smtpPort); provider.state.messages = smtp.messages;
  const appPort = await port(), dbPort = await port();
  const base = `http://127.0.0.1:${appPort}`;
  const cas = { loginUrl: provider.url + '/cas/login', validateUrl: 'https://cas.identity.invalid/serviceValidate', popup: true, serviceParam: 'service', attributes: {} };
  // Do not inherit deployment credentials or MONGO_URL into this test instance.
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, LANG: process.env.LANG, TZ: process.env.TZ, TMPDIR: work, DO_NOT_TRACK: '1', BIND_IP: '127.0.0.1',
    HEADER_LOGIN_ID: 'x-fixture-user', HEADER_LOGIN_EMAIL: 'x-fixture-email', HEADER_LOGIN_FIRSTNAME: 'x-fixture-firstname', HEADER_LOGIN_LASTNAME: 'x-fixture-lastname', HEADER_LOGIN_TRUSTED_PROXIES: '127.0.0.1', HEADER_LOGIN_TRUSTED_IPS: '192.0.2.10',
    PORT: String(appPort), ROOT_URL: base, PASSWORDLESS_ENABLED: 'true', MAIL_URL: `smtp://127.0.0.1:${smtpPort}`, MAIL_FROM: 'test@example.invalid', WEKAN_DB: 'ferretdb', FERRETDB_LISTEN_ADDR: `127.0.0.1:${dbPort}`, FERRETDB_DEBUG_ADDR: '-', FERRETDB_STATE_DIR: work + '/state', WRITABLE_PATH: work + '/data',
    WEKAN_TEST_IDENTITY_URL: provider.url, NODE_OPTIONS: `--require=${__dirname}/transport.cjs`,
    LDAP_ENABLE: 'true', LDAP_HOST: '127.0.0.1', LDAP_PORT: String(provider.ldapPort), LDAP_ENCRYPTION: 'false', LDAP_BASEDN: 'dc=example,dc=invalid',
    LDAP_AUTHENTIFICATION: 'true', LDAP_AUTHENTIFICATION_USERDN: 'cn=reader,dc=example,dc=invalid', LDAP_AUTHENTIFICATION_PASSWORD: 'reader-test-password',
    LDAP_USER_SEARCH_FIELD: 'uid', LDAP_USER_SEARCH_FILTER: '(objectClass=inetOrgPerson)', LDAP_USER_SEARCH_SCOPE: 'sub', LDAP_USERNAME_FIELD: 'uid', LDAP_FULLNAME_FIELD: 'cn', LDAP_EMAIL_FIELD: 'mail', LDAP_UNIQUE_IDENTIFIER_FIELD: 'entryUUID', LDAP_LOGIN_FALLBACK: 'false', LDAP_BACKGROUND_SYNC: 'false', LDAP_SYNC_USER_DATA: 'true', LDAP_USER_AUTHENTICATION: 'false', LDAP_GROUP_FILTER_ENABLE: 'false',
    OAUTH2_ENABLED: 'true', OAUTH2_CLIENT_ID: 'fixture-client', OAUTH2_SECRET: 'fixture-secret', OAUTH2_SERVER_URL: provider.url, OAUTH2_AUTH_ENDPOINT: '/authorize', OAUTH2_TOKEN_ENDPOINT: '/token', OAUTH2_USERINFO_ENDPOINT: '/userinfo', OAUTH2_ID_MAP: 'sub', OAUTH2_USERNAME_MAP: 'username', OAUTH2_FULLNAME_MAP: 'name', OAUTH2_EMAIL_MAP: 'email', OAUTH2_REQUEST_PERMISSIONS: 'openid profile email',
    SAML_ENABLED: 'true', SAML_PROVIDER: 'fixture', SAML_ENTRYPOINT: provider.url + '/saml', SAML_ISSUER: base, SAML_CERT: certificate,
    CAS_ENABLED: 'true', CAS_LOGIN_URL: cas.loginUrl, CAS_BASE_URL: provider.url, CASE_VALIDATE_URL: cas.validateUrl,
    METEOR_SETTINGS: JSON.stringify({ cas, public: { cas, SAML_PROVIDER: 'fixture' } }),
  };
  for (const [prefix, key] of [['GOOGLE','CLIENT_ID'],['GITHUB','CLIENT_ID'],['FACEBOOK','APP_ID'],['TWITTER','CONSUMER_KEY'],['METEOR_DEVELOPER','CLIENT_ID'],['WEIBO','CLIENT_ID'],['MEETUP','CLIENT_ID']]) {
    env[`OAUTH_${prefix}_ENABLED`] = 'true'; env[`OAUTH_${prefix}_${key}`] = 'fixture-client'; env[`OAUTH_${prefix}_SECRET`] = 'fixture-secret';
  }
  if (sandstorm) { env.SANDSTORM = '1'; env.METEOR_SETTINGS = JSON.stringify({ public: { sandstorm: true } }); }
  const log = fs.openSync(work + '/app.log', 'w');
  const app = spawn(path.join(bundle, 'start-wekan.sh'), [], { env, cwd: root, stdio: ['ignore', log, log], detached: true });
  console.log(`Identity test artifacts: ${work}`);
  try {
    let ready = false;
    for (let n = 0; n < 180; n++) {
      if (app.exitCode !== null) throw Error('Application exited; see app.log');
      try { const response = await fetch(base); if (response.ok) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!ready) throw Error('Application startup timeout');
    const child = spawn(process.execPath, [root + '/tests/playwright/node_modules/@playwright/test/cli.js', 'test', '--config', root + '/tests/playwright/playwright.config.js', sandstorm ? 'identity-sandstorm.e2e.js' : 'identity-providers.e2e.js', '--project=' + browser, '--workers=1', '--retries=0', '--reporter=line', '--output=' + work + '/results', ...(process.env.IDENTITY_GREP ? ['--grep', process.env.IDENTITY_GREP] : [])], {
      cwd: root, stdio: 'inherit', env: { ...process.env, TMPDIR: work, WEKAN_BASE_URL: base, WEKAN_MONGO_URL: `mongodb://127.0.0.1:${dbPort}/wekan`, WEKAN_TEST_IDENTITY_URL: provider.url,
        WEKAN_TEST_SAML_CERT: certificate, WEKAN_TEST_SANDSTORM: sandstorm ? '1' : '0', WEKAN_PLAYWRIGHT_PROBE: '0', PLAYWRIGHT_BROWSERS_PATH: root + '/.tools/ms-playwright' },
    });
    process.exitCode = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', (code, signal) => resolve(signal ? 1 : code ?? 1)); });
    fs.writeFileSync(work + '/provider-events.json', JSON.stringify(provider.state.events, null, 2));
  } finally {
    const stopped = new Promise(resolve => app.once('exit', resolve));
    try { process.kill(-app.pid, 'SIGTERM'); } catch {}
    if (app.exitCode === null && app.signalCode === null) {
      let timeout;
      await Promise.race([stopped, new Promise(resolve => { timeout = setTimeout(() => { try { process.kill(-app.pid, 'SIGKILL'); } catch {} resolve(); }, 5000); })]);
      clearTimeout(timeout);
    }
    await provider.close(); await smtp.close(); fs.closeSync(log);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
