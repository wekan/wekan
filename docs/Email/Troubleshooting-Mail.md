[Azure Email Communication Service](https://github.com/wekan/wekan/issues/5453)

[Uberspace Email](https://github.com/wekan/wekan/issues/2009#issuecomment-1017630758)

## Newest Wekan

In [Wekan v5.02](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v502-2021-03-02-wekan-release) is fix for STMP settings [that works with very happy feedback](https://github.com/wekan/wekan/issues/3529#issuecomment-789085999). It requires:
- **There is no email settings at Admin Panel anymore**
- Email settings are made only with snap commands like `sudo snap set wekan mail-url....` or similar in Docker/Source etc `MAIL_URL=...`, more details below.
- For any errors like SSLv3 and STARTTLS, check [newest AWS SES info](#example-aws-ses) and use similar settings, other SSLv3/STARTTLS info could be outdated.

## Gmail

[Source](https://github.com/wekan/wekan-snap/issues/151)

This maybe requires setting per-application password in Google Account settings for Gmail.

```
sudo snap set wekan mail-url='smtp://user@gmail.com:password@smtp.gmail.com:587'
```

## OAuth2 proxy

- Google will disable all but OAuth for IMAP, SMTP and POP starting Sept. 30 2024 https://workspaceupdates.googleblog.com/2023/09/winding-down-google-sync-and-less-secure-apps-support.html
- https://news.ycombinator.com/item?id=39052196 , where is this: "If you can’t switch to OAuth, you can use my proxy to allow any IMAP (or POP/SMTP) client to be used with a “modern” email provider, regardless of whether the client supports OAuth 2.0 natively: https://github.com/simonrob/email-oauth2-proxy . No need for your client to know about OAuth at all." https://news.ycombinator.com/item?id=39052409

## ProtonMail Bridge

[Source](https://github.com/wekan/wekan/issues/4887)

```
sudo snap set wekan mail-url='smtp://USER%40DOMAIN:PASSWORD@127.0.0.1:1025?ignoreTLS=true&tls={rejectUnauthorized:false}&secure=false'
```

## Some more test code

```
let htmlText = Assets.getText("emailTemplate.html");
let modifiedText = htmlText.replace(new RegExp("{{variable}}", 'g'), variable);
Email.send({
            from: "nobody@example.com",
            to: email,
            subject: `subject`,
            html: modifiedText,
        });
```

## Debugging your SMTP mail server

If you can't get your email server working with smtp/stmps or MAIL_SERVICE, look is there more config options for your email server at https://nodemailer.com docs, and add new issue about your email server to https://github.com/wekan/wekan/issues or [pull request](Emoji#how-you-could-add-another-plugin).

For example, for https://nodemailer.com/smtp/ 

1) Install node.js 12.x
2) Add to top of code example: `var nodemailer = require('nodemailer');`
3) Install nodemailer: `npm install nodemailer`
4) send email: `node email.js`

For example, this kind of code uses similar like MAIL_SERVICE in Wekan:

```
var nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  service: "Outlook365",
  auth: {
    user: 'firstname.lastname@hotmail.com',
    pass: 'TopSecret'
  },
})

let info = transporter.sendMail({
  from: 'Firstname Lastname <firstname.lastname@hotmail.com>',
  to: 'somebody@example.com',
  subject: 'Hi',
  text: 'Hi. Reminder: Meeting tomorrow.',
  html: '<h1>Hi. Reminder: Meeting tomorrow.</h1>'
})
```


If with some code example sending email works, xet7 can add it to wekan, like in [Wekan v5.52](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v552-2021-08-26-wekan-release) xet7 added direct nodemailer usage for MAIL_SERVICE.

## MAIL_SERVICE (not currently in use)

a) If you use smtps or smtp, please do not add any MAIL_SERVICE settings. For example, AWS SES and Postfix works with only MAIL_URL and MAIL_FROM.

b) If smtps or smtp does not work, in Wekan v5.52 and newer, you can try these additional MAIL_SERVICE settings. This may still also require MAIL_URL to be valid, while it only uses MAIL_SERVICE settings of [Well Known email services](https://nodemailer.com/smtp/well-known/) that are these:

126, 163, 1und1, AOL, DebugMail, DynectEmail, FastMail, GandiMail, Gmail, Godaddy, GodaddyAsia, GodaddyEurope, hot.ee, Hotmail, iCloud, mail.ee, Mail.ru, Maildev, Mailgun, Mailjet, Mailosaur, Mandrill, Naver, OpenMailBox, Outlook365, Postmark, QQ, QQex, SendCloud, SendGrid, SendinBlue, SendPulse, SES, SES-US-EAST-1, SES-US-WEST-2, SES-EU-WEST-1, Sparkpost, Yahoo, Yandex, Zoho, qiye.aliyun

Wekan Snap:
```
sudo snap set wekan mail-service='Outlook365'
sudo snap set wekan mail-service-user='firstname.lastname@hotmail.com'
sudo snap set wekan mail-service-password='SecretPassword'
```
Wekan Gantt GPL Snap:
```
sudo snap set wekan-gantt-gpl mail-service='Outlook365'
sudo snap set wekan-gantt-gpl mail-service-user='firstname.lastname@hotmail.com'
sudo snap set wekan-gantt-gpl mail-service-password='SecretPassword'
```
docker-compose.yml of https://github.com/wekan/wekan:
```
- MAIL_SERVICE=Outlook365
- MAIL_SERVICE_USER=firstname.lastname@hotmail.com
- MAIL_SERVICE_PASSWORD=SecretPassword
```
start-wekan.bat of https://github.com/wekan/wekan:
```
SET MAIL_SERVICE=Outlook365
SET MAIL_SERVICE_USER=firstname.lastname@hotmail.com
SET MAIL_SERVICE_PASSWORD=SecretPassword      
```
start-wekan.sh of https://github.com/wekan/wekan:
```
export MAIL_SERVICE=Outlook365
export MAIL_SERVICE_USER=firstname.lastname@hotmail.com
export MAIL_SERVICE_PASSWORD=SecretPassword      
```

## Special Characters

**If you have special characters in username or password**, sometimes you need to urlencode them. Not for AWS SES.
You can convert special characters of your password at https://www.url-encode-decode.com
and copy converted characters to your password.

## Example: Microsoft Office 365

```
sudo snap set wekan mail-url='smtp://user:password@smtp.office365.com:587?ignoreTLS=false&tls={rejectUnauthorized:false}&secure=true'
sudo snap set wekan mail-from='Wekan Team Boards <info@example.com>'
```

Converting special characters:
```
sudo snap set wekan mail-url='smtp://support%40example.com:password@mail.example.com:587/?ignoreTLS=true&tls={rejectUnauthorized:false}&secure=false'

sudo snap set wekan mail-from='Wekan Team Boards <info@example.com>'
```
## Example: AWS SES

Related https://github.com/wekan/wekan/discussions/5518

NOTE: At AWS SES settings, you don't need to convert special characters.

1) At AWS SES, add verified sender email address, verified domain, verified DKIM etc.

2) For your example.com domain for SPF purposes, add TXT record like this, where ip4:123.123.123.123 is your Wekan server IP address:

```
@ TXT

v=spf1 ip4:123.123.123.123 include:amazonses.com ~all
```

If you have other email services like Protonmail, Google Workplace, Outlook, SendGrid, and some other servers, it could look like this, please check your email provider to enable all settings:

```
v=spf1 include:_spf.protonmail.ch ip4:123.123.123.123 ip4:123.100.123.100 include:_spf.google.com include:spf.protection.outlook.com include:sendgrid.net include:amazonses.com ~all
```

3) At AWS SES, create new SMTP credentials for username like "AKIA..." and password, that you add directly to below. Do not modify or escape special characters.

With AWS SMTP credentials:

a) Wekan Snap
```
sudo snap set wekan mail-from='Wekan Boards <boards@example.com>'
sudo snap set wekan mail-url='smtp://username:password@email-smtp.eu-west-1.amazonaws.com:587?tls={ciphers:"SSLv3"}&secureConnection=false'
```
You see settings with:
```
sudo snap get wekan
```
b) Wekan Gantt GPLv2 Snap:
```
sudo snap set wekan-gantt-gpl mail-from='Wekan Boards <boards@example.com>'
sudo snap set wekan-gantt-gpl mail-url='smtp://username:password@email-smtp.eu-west-1.amazonaws.com:587?tls={ciphers:"SSLv3"}&secureConnection=false'
```
You see settings with:
```
sudo snap get wekan-gantt-gpl
```
c) Docker, Source, etc
```
MAIL_FROM='Wekan Boards <boards@example.com>'
MAIL_URL='smtp://username:password@email-smtp.eu-west-1.amazonaws.com:587?tls={ciphers:"SSLv3"}&secureConnection=false'
```

## Example: AWS SES sending email with command line

[Source](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-smtp-client-command-line.html)

This can be used for debugging on bash shell, does AWS SES work at all. Other shells work too, on Windows it requires installing openssl command.

1) `password-to-base64.sh` - converts AWS SES STMP credentials to base64 to be used at input.txt email content:
```
echo -n "AKIA...." | openssl enc -base64
echo -n "password-here...." | openssl enc -base64
```

2) `input.txt` - change all to your domains, password, etc where is text `-here` below. NOTE: only at `From:` there is more detailed sender name, not elsewhere like `MAIL FROM:` etc.

```
EHLO example.com-here
AUTH LOGIN
base64-username-here
base64-password-here
MAIL FROM: boards@example.com-here
RCPT TO: you@example.com-here
DATA
From: Wekan Boards-here <boards@example.com-here>
To: you@example.com-here
Subject: Amazon SES SMTP Test

This message was sent using the Amazon SES SMTP interface.
.
QUIT
```
3a) `ses-send-email.sh` , with STARTTLS:
```
openssl s_client -crlf -quiet -starttls smtp -connect email-smtp.eu-west-1.amazonaws.com:587 < input.txt
```
3b) `ses-send-email.sh`, with SSL:
```
openssl s_client -crlf -quiet -connect email-smtp.eu-west-1.amazonaws.com:465 < input.txt
```
4) Changing above `.sh` scripts to executeable:
```
chmod +x *.sh
```
Then you can run them like this:
```
./password-to-base64.sh
```

## Example: Gmail
[Source](https://github.com/wekan/wekan/issues/3529#issuecomment-792724239)
```
sudo snap set wekan mail-url='smtps://username@domain.com:password@smtp.gmail.com:465'
sudo snap set wekan mail-from='Wekan Team Boards <info@example.com>'
```
Convert password via this service https://www.url-encode-decode.com and everything will work.

### If you get SSLv3 protocol error

Do instead this `smtp://` and ignoreTLS etc, and at click your right top username / Admin Panel / Email, with TLS support NOT enabled:
```
sudo snap set wekan mail-url='smtp://username:password@email-smtp.eu-west-1.amazonaws.com:587?ignoreTLS=true&tls={rejectUnauthorized:false}&secure=false'
sudo snap set wekan mail-from='Wekan Team Boards <info@example.com>'
```
### If you use some other snap like wekan-gantt-gpl

Change part `sudo snap set wekan` to `sudo snap set wekan-gantt-gpl`

## Example: UCS

### In admin panel (within admin account on Wekan app itself)
- SMTP Host: `smtp.example.com:25/?ignoreTLS=true&tls={rejectUnauthorized:false}&secure=false`
- SMTP Port: `25`
- Username: `webadmin%40example.com`
- [_] TLS Support UNCHECKED
- From: `Wekan Admin <webadmin@example.com>`
 
### Settings in Wekan App settings in UCS dashboard
- URL settings: `https://www.example.com/wekan`
- LDAP Settings: `(&(objectClass=person)(mailPrimaryAddress=*)(!(shadowExpire=*))(sambaBadPasswordTime=0)(wekanActivated=TRUE)(uid=<some_user_name>))`
- Mail URL: `smtp://webadmin%40example.com:password@example.com:25/?ignoreTLS=true&tls={rejectUnauthorized:false}&secure=false`
- Mail From: `Wekan Notifications <webadmin@example.com>`

## Example: username contains @

Below `@` is urlencoded to `%40`

```
sudo snap set wekan mail-url='smtps://user%40provider.com:xxxxxx@smtp.provider.com:587'
sudo snap set wekan mail-from='Boards Support <user@provider.com>'
```

If settings happends to disappear, it's possible set cron job to run those at morning, see: https://crontab.guru
```
sudo su
export EDITOR=nano
crontab -e
```
There at bottom add these. Optional is to add to end of snap command `2>&1` to disable output,if there is any.
```
06 00 * * * sudo snap set wekan mail-url='smtps://user%40provider.com:xxxxxx@smtp.provider.com:587'
06 01 * * * sudo snap set wekan mail-from='Boards Support <user@provider.com>'
```

## Check is username and password required

If your email server does not require authentication like username and password, [don't include them in MAIL_URL](https://github.com/wekan/wekan/issues/2106). For example, IBM Notes does not require username and password.

## Config

Mail configuration if done by settings of `MAIL_URL` & `MAIL_FROM` environment parameters. Way of setting is due your instalation method e.g. [snap](https://github.com/wekan/wekan-snap/wiki/Install#6-email-and-other-settings), in docker-compose.yml file etc.

## No mail server

You can choose to _NOT_ configure a mail server, by not providing the `MAIL_URL` & `MAIL_FROM` environment parameters. Instead the mail message will be send to the terminal output. See [FAQ](FAQ#show-mails-with-a-docker-image-without-mail-configuration) for more info.

## Email servers: SMTP or Exchange

Standalone Wekan uses SMTP server for sending email invitations etc.

For Exchange, you can use [DavMail](http://davmail.sourceforge.net), Wekan SMTP => Davmail => Exchange.

Another way is to [Configure Postfix to relay to Exchange with NTLM authentication](https://www.linuxquestions.org/questions/linux-newbie-8/configure-postfix-to-relay-to-exchange-server-with-ntlm-authentication-4175410961/#post4712832)

There are Thunderbird Exchange Calendar extensions for [Exchange 2007/2010/2013/others? Open Source](https://github.com/ExchangeCalendar/exchangecalendar/releases), [Exchange 2007-2015 paid](https://exquilla.zendesk.com/hc/en-us) and [Exhange 2016 paid](http://www.beonex.com/owl/) and [other extensions](https://addons.thunderbird.net/en-US/thunderbird/search/?q=exchange&appver=&platform=), info how to use it is at [article at threenine.co.uk](https://threenine.co.uk/setup-office365-calendar-with-thunderbird/). Wekan has [Calendar feature](https://github.com/wekan/wekan/issues/808).

Wekan Email settings are required in both MAIL_URL and Admin Panel.

If you want to receive Email to Wekan, use [Huginn](https://github.com/wekan/wekan/issues/1160) to get E-mail from mailserver and have Huginn to use Wekan REST API to add card to Wekan board.

## Postfix

If you want to configure a mail server, you could use a mail server out-side of your machine (like the example  above). Or you could start another Docker container which runs Postfix (try the [`marvambass/versatile-postfix`](https://hub.docker.com/r/marvambass/versatile-postfix/) Docker image).

If you already got a Postfix service running on your host machine, you can add the local IP address to the docker-compose.yml file and use the hostname in the `MAIL_URL`:
```
environment:
  [...]
 - MAIL_URL=smtp://mailserver
 - MAIL_FROM=noreply@domain.com
extra_hosts:
 - "mailserver:192.168.1.20"
```
**Note:** `192.168.1.20` needs to be changed to your local server IP address.

And finally add the Docker IP range (172.17.x.x) to the Postfix trusted networks list in `/etc/postfix/main.cf`:
```
mynetworks = 127.0.0.0/8 172.17.0.0/16 [::ffff:127.0.0.0]/104 [::1]/128  
```

## Troubleshooting

Email is quite important in Wekan, as without it you can't send password reset links nor can you verify your e-mail address. Here are some ways to figure out what is wrong with your mail server settings in WeKan.

## Log Files
Firstly, make sure you're logged into your server and following your log files.

    @:~$ tail -f path/to/wekan.log

If you're using the Docker container through docker-compose, you can follow the log file like this:

    @:~$ docker-compose logs -f wekan

If you're using a snap package, you'll get the logs with

    @:~$ journalctl -u snap.wekan.wekan

## Error Messages
Once you've got the log files in front of you, go to the WeKan frontend and send a password reset link, or try to register. This will try to send an e-mail, and you should see any error messages in the log file.

### Wrong Port
If you see an error message like the following one, your port number is wrong. If you're using plain old SMTP or STARTTLS, your port should be 25. If you're using TLS, you may need to change your port to 465. Some mail servers may use port 587 instead of the two above.

```
wekan_1      | Exception while invoking method 'forgotPassword' Error: connect ECONNREFUSED 64.22.103.211:587
wekan_1      |     at Object.Future.wait (/build/programs/server/node_modules/fibers/future.js:449:15)
wekan_1      |     at Mail._syncSendMail (packages/meteor.js:213:24)
wekan_1      |     at smtpSend (packages/email.js:110:13)
wekan_1      |     at Object.Email.send (packages/email.js:168:5)
wekan_1      |     at AccountsServer.Accounts.sendResetPasswordEmail (packages/accounts-password/password_server.js:614:9)
wekan_1      |     at [object Object].Meteor.methods.forgotPassword (packages/accounts-password/password_server.js:546:12)
wekan_1      |     at packages/check.js:130:16
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at Object.exports.Match._failIfArgumentsAreNotAllChecked (packages/check.js:129:41)
wekan_1      |     at maybeAuditArgumentChecks (packages/ddp-server/livedata_server.js:1734:18)
wekan_1      |     at packages/ddp-server/livedata_server.js:719:19
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at packages/ddp-server/livedata_server.js:717:40
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at packages/ddp-server/livedata_server.js:715:46
wekan_1      |     at [object Object]._.extend.protocol_handlers.method (packages/ddp-server/livedata_server.js:689:23)
wekan_1      |     - - - - -
wekan_1      |     at Object.exports._errnoException (util.js:907:11)
wekan_1      |     at exports._exceptionWithHostPort (util.js:930:20)
wekan_1      |     at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1081:14)
```

### Wrong Protocol
If you have the "Enable TLS support for SMTP server", but your does not directly support TLS (it may use STARTTLS instead), then you'll get the following error. Just uncheck the checkbox in the Admin Panel.

```
wekan_1      | Exception while invoking method 'forgotPassword' Error: 139872240588608:error:140770FC:SSL routines:SSL23_GET_SERVER_HELLO:unknown protocol:../deps/openssl/openssl/ssl/s23_clnt.c:794:
wekan_1      |     at Object.Future.wait (/build/programs/server/node_modules/fibers/future.js:449:15)
wekan_1      |     at Mail._syncSendMail (packages/meteor.js:213:24)
wekan_1      |     at smtpSend (packages/email.js:110:13)
wekan_1      |     at Object.Email.send (packages/email.js:168:5)
wekan_1      |     at AccountsServer.Accounts.sendResetPasswordEmail (packages/accounts-password/password_server.js:614:9)
wekan_1      |     at [object Object].Meteor.methods.forgotPassword (packages/accounts-password/password_server.js:546:12)
wekan_1      |     at packages/check.js:130:16
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at Object.exports.Match._failIfArgumentsAreNotAllChecked (packages/check.js:129:41)
wekan_1      |     at maybeAuditArgumentChecks (packages/ddp-server/livedata_server.js:1734:18)
wekan_1      |     at packages/ddp-server/livedata_server.js:719:19
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at packages/ddp-server/livedata_server.js:717:40
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at packages/ddp-server/livedata_server.js:715:46
wekan_1      |     at [object Object]._.extend.protocol_handlers.method (packages/ddp-server/livedata_server.js:689:23)
wekan_1      |     - - - - -
wekan_1      | 
wekan_1      |     at Error (native)
```

### STARTTLS Sending test email failed

```
Sending email failed
Error trying to send email: 139625961224000:error:140770FC:SSL routines:SSL23_GET_SERVER_HELLO:unknown protocol:../deps/openssl/openssl/ssl/s23_clnt.c:827:
```
To fix it, in snap/docker/source environment variable settings, with username and password urlencoded:
```
snap set wekan mail-from='Boards Support <boards@example.com>'

snap set wekan mail-url='smtp://support%40example.com:password@mail.example.com:587/?ignoreTLS=true&tls={rejectUnauthorized:false}&secure=false'
```
Admin Panel:
```
SMTP Host:
mail.example.com:587/?ignoreTLS=true&tls={rejectUnauthorized:false}&secure=false

SMTP Port:
587

Username:
support%40example.com

Password:
password

TLS support:
[_] <== not checked

From: 
Boards Support <boards@example.com>

DNS settings, with server IP address in ipv4 section:
TXT: mail.example.com & & TXT: example.com
v=spf1 a mx ipv4:123.123.123.123/32 include:_spf.google.com include:example.com include:mail.example.com include:_spf.google.com ~all
```

### Self-signed Certificate
Unfortunately at this stage, WeKan does not support self-signed certificates. You will see the following error if your SMTP server is using a self-signed certificate. Ways to remedy to this are (by order of preference):
* disable TLS on your SMTP server. For postfix juste add "smtpd_user_tls = no" to main.cf. !!! Unless doing this, wekan will try to connect with STARTTLS !!!
* to get a certificate from a CA, or
* to add "?tls={rejectUnauthorized:false}" to the end of the [MAIL_URL environment variable](https://nodemailer.com/smtp/), or
* to add "?ignoreTLS=true" to the end of the [MAIL_URL environment variable](https://nodemailer.com/smtp/), or
* to remove the TLS certificate completely.

```
wekan_1      | Exception while invoking method 'forgotPassword' Error: 139872240588608:error:140770FC:SSL routines:SSL23_GET_SERVER_HELLO:unknown protocol:../deps/openssl/openssl/ssl/s23_clnt.c:794:
wekan_1      |     at Object.Future.wait (/build/programs/server/node_modules/fibers/future.js:449:15)
wekan_1      |     at Mail._syncSendMail (packages/meteor.js:213:24)
wekan_1      |     at smtpSend (packages/email.js:110:13)
wekan_1      |     at Object.Email.send (packages/email.js:168:5)
wekan_1      |     at AccountsServer.Accounts.sendResetPasswordEmail (packages/accounts-password/password_server.js:614:9)
wekan_1      |     at [object Object].Meteor.methods.forgotPassword (packages/accounts-password/password_server.js:546:12)
wekan_1      |     at packages/check.js:130:16
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at Object.exports.Match._failIfArgumentsAreNotAllChecked (packages/check.js:129:41)
wekan_1      |     at maybeAuditArgumentChecks (packages/ddp-server/livedata_server.js:1734:18)
wekan_1      |     at packages/ddp-server/livedata_server.js:719:19
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at packages/ddp-server/livedata_server.js:717:40
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at packages/ddp-server/livedata_server.js:715:46
wekan_1      |     at [object Object]._.extend.protocol_handlers.method (packages/ddp-server/livedata_server.js:689:23)
wekan_1      |     - - - - -
wekan_1      | 
wekan_1      |     at Error (native)
```

### Incorrect TLS Certificate
Lastly, if you see the following error message it is because the certificate has not been correctly installed on the SMTP server.

```
wekan_1      | Exception while invoking method 'forgotPassword' Error: unable to verify the first certificate
wekan_1      |     at Object.Future.wait (/build/programs/server/node_modules/fibers/future.js:449:15)
wekan_1      |     at Mail._syncSendMail (packages/meteor.js:213:24)
wekan_1      |     at smtpSend (packages/email.js:110:13)
wekan_1      |     at Object.Email.send (packages/email.js:168:5)
wekan_1      |     at AccountsServer.Accounts.sendResetPasswordEmail (packages/accounts-password/password_server.js:614:9)
wekan_1      |     at [object Object].Meteor.methods.forgotPassword (packages/accounts-password/password_server.js:546:12)
wekan_1      |     at packages/check.js:130:16
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at Object.exports.Match._failIfArgumentsAreNotAllChecked (packages/check.js:129:41)
wekan_1      |     at maybeAuditArgumentChecks (packages/ddp-server/livedata_server.js:1734:18)
wekan_1      |     at packages/ddp-server/livedata_server.js:719:19
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at packages/ddp-server/livedata_server.js:717:40
wekan_1      |     at [object Object]._.extend.withValue (packages/meteor.js:1122:17)
wekan_1      |     at packages/ddp-server/livedata_server.js:715:46
wekan_1      |     at [object Object]._.extend.protocol_handlers.method (packages/ddp-server/livedata_server.js:689:23)
wekan_1      |     - - - - -
wekan_1      |     at Error (native)
wekan_1      |     at TLSSocket.<anonymous> (_tls_wrap.js:1063:38)
wekan_1      |     at emitNone (events.js:67:13)
wekan_1      |     at TLSSocket.emit (events.js:166:7)
wekan_1      |     at TLSSocket._init.ssl.onclienthello.ssl.oncertcb.TLSSocket._finishInit (_tls_wrap.js:621:8)
wekan_1      |     at TLSWrap.ssl.onclienthello.ssl.oncertcb.ssl.onnewsession.ssl.onhandshakedone (_tls_wrap.js:453:38)
```

## No News Is Good News
Of course, if you don't see any of these errors in your WeKan log file, then the problem is not in WeKan. Check your SMTP server's mail logs (if you can) to get a better idea of what might be going wrong.


***

## BELOW IS NOT TESTED YET DOCS

They are moved here from https://github.com/wekan/wekan/issues/961

### Configure Wekan

Sample:
### Wekan with TLS/SSL
To run Wekan secured with TLS/SSL do the following steps:
1. Setup a Web-Server/-Proxy with TLS/SSL support that maps requests to wekan. [Link](url)
2. Set protocol to http**s**. 
`export ROOT_URL='https://example.com/'`
3. Set Wekan to an internal port. 
`export PORT=54321`
4. Restart and run Wekan. 

### Wekan at subpath
To run Wekan to appear at a subpath of your domain:
1. Setup a Web-Server/-Proxy that maps requests to wekan. [Link](url)
2. Append subpath to domain, without trailing slash. 
`export ROOT_URL='http://example.com/mywekan'`
3. Set Wekan to an internal port. 
`export PORT=54321`
4. Restart and run Wekan. 

### SMTP with TLS/SSL
To enable Wekan sending Mail from a mail server with TLS/SSL:
1. Set Wekan to the specified port (465 / 587). 
`export MAIL_URL='smtp://user:password@example.com:587/'`
2. Restart and run Wekan. 

### Mail Sender
To define a sender name for the mails automatically sent by Wekan. 
1. ...`export MAIL_FROM='Thomas Anderson <neo@matrix.org>'`

## Using mail service from zoho
If you have your personal mail on zoho for your domain example.com, then follow these steps to add MAIL_URL.
Let's assume following username
username=user1@example.com
password=12@3424dsfsf

Step 1: encode the username and password

encoded username: user1%40example.com
encoded password: 12%403424dsfsf

Step 2: form MAIL_URL

MAIL_URL=smtps://user1%40example.com:12%403424dsfsf@smtp.zoho.com:465/

By default zoho uses port number 465 with TLS enabled.

Step 3: form MAIL_FROM

MAIL_FROM=Wekan Notifications <user1@example.com>