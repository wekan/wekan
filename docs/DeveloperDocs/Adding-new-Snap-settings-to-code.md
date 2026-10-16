# Adding a new Snap setting to code

A WeKan setting is an environment variable. The snap turns `snap set wekan
<key>='<value>'` into that variable, so a new setting needs the server code,
the snap's `config` and `wekan-help`, and the other platforms' settings files.

Also see [Snap Developer Docs](https://github.com/wekan/wekan-snap/wiki/Snap-Developer-Docs).

## 1) Server code

A plain setting is read from the environment:

```js
process.env.YOURSETTING
```

Example: [server/policy.js](https://github.com/wekan/wekan/blob/main/server/policy.js).

A **login** setting (LDAP, OAuth2, CAS, SAML, the OAuth providers, header
login) can be overridden in Admin Panel / People, so it is not read from
`process.env` directly. List it in `models/lib/authConfigCatalog.js` and read it
with `authEnv('YOURSETTING')` from `server/lib/authConfig.js`, which takes the
Admin Panel value first and the environment second.
`tests/authConfigCatalog.test.cjs` fails when code reads a login variable the
catalog does not list, or reads a catalog variable straight from `process.env`.

## 2) [snap-src/bin/config](https://github.com/wekan/wekan/blob/main/snap-src/bin/config)

Add the variable's name to the end of the `keys="..."` line near the top:

```
keys="... YOURSETTING"
```

Then add its three lines at the bottom. The `KEY_` value is the lowercase,
dash-separated name used with `snap set`.

Example 1: a feature that is off by default.

```
DESCRIPTION_LDAP_ENABLE="Enable or not the connection by the LDAP"
DEFAULT_LDAP_ENABLE="false"
KEY_LDAP_ENABLE="ldap-enable"
```

Example 2: a value that is different for every server stays empty.

```
DESCRIPTION_OAUTH2_TOKEN_ENDPOINT="OAuth2 token endpoint. Example: /oauth/token"
DEFAULT_OAUTH2_TOKEN_ENDPOINT=""
KEY_OAUTH2_TOKEN_ENDPOINT="oauth2-token-endpoint"
```

Example 3: a value that is the same for most servers gets it as the default.

```
DESCRIPTION_WAIT_SPINNER="Default wait spinner to use"
DEFAULT_WAIT_SPINNER="Bounce"
KEY_WAIT_SPINNER="wait-spinner"
```

## 3) [snap-src/bin/wekan-help](https://github.com/wekan/wekan/blob/main/snap-src/bin/wekan-help)

Add how to set and unset it, above the line
`# parse config file for supported settings keys`:

```
echo -e "OAuth2 Token Endpoint."
echo -e "To enable the OAuth2 Token Endpoint of Wekan:"
echo -e "\t$ snap set $SNAP_INSTANCE_NAME oauth2-token-endpoint='/oauth/token'"
echo -e "\t-Disable the OAuth2 Token Endpoint of Wekan:"
echo -e "\t$ snap unset $SNAP_INSTANCE_NAME oauth2-token-endpoint"
echo -e "\n"
```

Use the lowercase `KEY_` name, and put the value inside single quotes. The
value may contain double quotes and spaces, but not single quotes:

```
snap set wekan ldap-user-search-filter='(&(objectCategory=person)(objectClass=user)(!(cn=andy)))'
```

## 4) The other platforms

Add the variable, commented out with an example, where the other platforms
take their settings from: `Dockerfile`, `docker-compose.yml` (and the other
`docker-compose-*.yml` files), `start-wekan.sh` and `start-wekan.bat`. For a
login setting, `tests/authConfigCatalog.test.cjs` checks that every one of them
lists it.

## 5) Check

Run the node suites (`node tests/run-node-suites.cjs`, or
the node-suite option of `./build.sh`) before committing. A contributor opens a
pull request against the `main` branch of
[wekan/wekan](https://github.com/wekan/wekan).
