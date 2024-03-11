# Also see Snap Developer Docs

[Snap Developer Docs](https://github.com/wekan/wekan-snap/wiki/Snap-Developer-Docs)

# When adding settings to code you or somebody else wrote

Add all necessary settings that you find on code.

After doing all changes, [fix lint errors](Developer-Documentation#preventing-travis-ci-lint-errors-before-submitting-pull-requests) and if possible warnings too. You can silence errors if you really can't find solution.

Submit pull request to Wekan edge branch https://github.com/wekan/wekan/tree/edge

# Changes to server code

To use environment variables in your serverside code, use:
```
process.env.YOURSETTING
```
Example: [wekan/server/policy.js](https://github.com/wekan/wekan/blob/edge/server/policy.js)

# Changes to [config](https://github.com/wekan/wekan/blob/edge/snap-src/bin/config)

## 1) Add to beginning

At beginning there is this line:
```
# list of supported keys
keys="MONGODB_BIND_UNIX_SOCKET MONGODB_BIND_IP ..."
```
To the end of it, add name of new setting. For example:
```
keys="... AWESOME_FEATURE_ENABLED"
```

## 2) Add to bottom

Example 1: Set features not enabled as default.
```
DESCRIPTION_LDAP_ENABLED="LDAP enabled. Default: false"
DEFAULT_LDAP_ENABLED="false"
KEY_LDAP_ENABLED="ldap-enabled"
```
Example 2: If setting is different for every server, leave it empty.
```
DESCRIPTION_OAUTH2_TOKEN_ENDPOINT="OAuth2 token endpoint. Example: /oauth/token"
DEFAULT_OAUTH2_TOKEN_ENDPOINT=""
KEY_OAUTH2_TOKEN_ENDPOINT="oauth2-token-endpoint"
```
Example 3: If there is same for every server, set it to general setting.
```
DESCRIPTION_LDAP_SEARCH_FILTER="LDAP search filter. Default: (&(objectCategory=person)(objectClass=user)(!(cn=andy)))"
DEFAULT_LDAP_SEARCH_FILTER="(&(objectCategory=person)(objectClass=user)(!(cn=andy)))"
KEY_LDAP_ENABLED="ldap-enabled"
```
Example 4: If you don't know example, leave it without example.
```
DESCRIPTION_TURBO_FILTER="Turbo filter. Default: ''"
DEFAULT_TURBO_FILTER=""
KEY_TURBO_FILTER="turbo-filter"
```

# Changes to [Snap help](https://github.com/wekan/wekan/blob/edge/snap-src/bin/wekan-help)

## 1) How to quote examples

Snap settings need to be lowercase, and inside single quotes. For example:
```
snap set wekan ldap-user-search-filter='(&(objectCategory=person)(objectClass=user)(!(cn=andy)))'
```
The setting inside single quotes is the actual setting.

Actual settings can include double quotes, spaces, etc, but not single quotes. For example:
```
snap set wekan ldap-user-search-filter='"(&(objectCategory=person)(objectClass=user)(!(cn=andy)))"'
```

## 2) What to add as setting to Wekan help

Example 1:
```
echo -e "OAuth2 Token Endpoint. Example: /oauth/token"
echo -e "To enable the OAuth2 Token Endpoint of Wekan:"
echo -e "\t$ snap set $SNAP_NAME OAUTH2_TOKEN_ENDPOINT='/oauth/token'"
echo -e "\t-Disable the OAuth2 Token Endpoint of Wekan:"
echo -e "\t$ snap set $SNAP_NAME OAUTH2_TOKEN_ENDPOINT=''"
echo -e "\n"
```
So all you add need to be above of this line:
```
# parse config file for supported settings keys
```