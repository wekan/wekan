# Local login protocol fixtures

Run `node tests/integration/login-providers/run.cjs /path/to/prepared/bundle`
and repeat with `--sandstorm`. The runner requires a POSIX host, OpenSSL,
installed repository/Playwright dependencies, Chromium and a native prepared
WeKan/FerretDB bundle. It uses a new database for each run.

See [login testing](../../../docs/Features/Login/Testing.md) for the coverage
matrix, dummy values, network isolation, artifacts and limitations.

`ldap.cjs` implements the limited LDAPv3 wire operations the scenarios use.
`provider.cjs` supplies authorization, token/profile, CAS, SAML and SMTP-message
inspection endpoints. `transport.cjs` is loaded only by the test application's
Node process and redirects the installed social adapters to loopback.
`run.cjs` starts/stops the local stack and invokes the two Playwright specs.
Never load this transport or run these example providers in a deployment.
