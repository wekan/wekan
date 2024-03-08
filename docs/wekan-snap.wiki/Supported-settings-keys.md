Wekan supports settings key values:

```
$ snap set wekan <key name>='<key value>'

```
## List all possible settings
```
$ wekan.help | less
```

## List your current snap settings
```
sudo snap get wekan
```
## LDAP

- Settings can be seen with command `wekan.help` and [this config file](https://raw.githubusercontent.com/wekan/wekan/master/snap-src/bin/config).
- LDAP repo https://github.com/wekan/wekan-ldap
- Bugs and Feature Requests LDAP repo https://github.com/wekan/wekan-ldap/issues

Example from setting listed at [this config file](https://raw.githubusercontent.com/wekan/wekan/master/snap-src/bin/config):
```
sudo snap set wekan ldap-enable='true'

sudo snap set wekan default-authentication-method='ldap'

sudo snap set wekan ldap-fullname-field='CN'
```

## List of supported keys

```
mongodb-bind-unix-socket:   mongodb binding unix socket:
		 Default behaviour will preffer binding over unix socket, to
		 disable unix socket binding set value to 'nill' string
		 To bind to instance of mongodb provided through content
		 interface, set value to relative path to the socket inside
		 'shared' directory.
		 Default value: set to use unix socket binding
mongodb-bind-ip: mongodb binding ip address: eg 127.0.0.1 for localhost
	 	 If not defined default unix socket binding is used instead
		 Default value: ''
mongodb-port:    mongodb binding port: eg 27017 when using localhost
		 Default value: '27019'
mail-url:	 wekan mail binding
		 Example: 'smtps://user:pass@mailserver.examples.com:453/'
		 Default value: 'smtp://user:pass@mailserver.examples.com:25/'
mail-from:	 wekan's admin mail from name email address
		 For example: 'Boards Support <support@example.com>'
		 Default value: 'wekan-admin@example.com'
root-url:	 wekan's root url, eg http://127.0.0.1, https://example.com,
		 https://wekan.example.com, http://example.com/wekan
		 Default value: 'http://127.0.0.1'
port:		 port wekan is exposed at
		 Default value: '8080'
disable-mongodb: Disable mongodb service: use only if binding to
		 database outside of Wekan snap. Valid values: [true,false]
		 Default value: 'false'
caddy-enabled:   Enable caddy service (caddy - Every Site on HTTPS).
                 see https://caddyserver.com/products/licenses and
                 https://github.com/wekan/wekan-snap/issues/39 ,
                 use personal non-commercial license or
                 contact Wekan maintainer x@xet7.org about enabling
                 commercial license for Caddy.
                 Set to 'true' to enable caddy.
		 caddy settings are handled through
                 /var/snap/wekan/common/Caddyfile
		 Default value: 'false'
caddy-bind-port: Port on which caddy will expect proxy, same value
                 will be also set in Caddyfile
		 Default value: '3001'
with-api:        To enable the API of wekan. If API is disabled,
                 exporting board to JSON does not work.
                 Default value: 'true'
cors:            Set Access-Control-Allow-Origin header. Example:
                 snap set wekan cors='*'
                 Default value, disabled: ''
browser-policy-enabled: Enable browser policy and allow one
                 trusted URL that can have iframe that has
                 Wekan embedded inside.
                 Setting this to false is not recommended,
                 it also disables all other browser policy protections
                 and allows all iframing etc. See wekan/server/policy.js
                 Default value: 'true'
trusted-url:     When browser policy is enabled, HTML code at this URL
                 can have iframe that embeds Wekan inside.
                 Example: trusted-url='https://example.com'
                 Default value: ''
webhooks-attributes: What to send to Outgoing Webhook, or leave out.
                 Example, that includes all that are default: 
                 cardId,listId,oldListId,boardId,comment,user,card,commentId .
                 To enable the Webhooks Attributes of Wekan:
                 snap set wekan webhooks-attributes=cardId,listId,oldListId,boardId,comment,user,card,commentId
                 Disable the Webhooks Attributest of Wekan to send all default ones:
                 snap set wekan webhooks-attributes=''
```
## Rocket.Chat providing OAuth2 login to Wekan

Also, if you have Rocket.Chat using LDAP/SAML/Google/etc for logging into Rocket.Chat, then same users can login to Wekan when Rocket.Chat is providing OAuth2 login to Wekan.

[OAuth2 Login Docs](https://github.com/wekan/wekan/wiki/OAuth2)

## [Matomo web analytics](https://matomo.org) integration
Example:
```
sudo snap set wekan matomo-address='https://matomo.example.com/'
sudo snap set wekan matomo-site-id='25'
sudo snap set wekan matomo-with-username='true'
sudo snap set wekan matomo-do-not-track='false'
```
Matomo settings keys:
```
matomo-address:  The address of the server where matomo is hosted
                 No value set, using default value: ''
matomo-site-id:  The value of the site ID given in matomo server for wekan
                 No value set, using default value: ''
matomo-do-not-track: The option do not track which enables users to not be tracked by matomo
		 Current value set to: 'true', (default value: 'true')
matomo-with-username: The option that allows matomo to retrieve the username
		 Current value set to: 'false', (default value: 'false')
```


**When settings are changed, wekan/mongo/caddy services are automatically restarted for changes to take effect.**
