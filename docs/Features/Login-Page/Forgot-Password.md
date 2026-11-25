# Forgot password

## What it is

When somebody forgets their password, the **Forgot password** link on the
sign-in page mails them a link for setting a new one. That needs working
email. When email does not work, or the administrator's own password is lost,
the password and admin rights can be repaired directly in the database, which
is what most of this page is about: making a user admin again, removing
brute-force login locks, and making yourself BoardAdmin of boards.

## Read more

- [Password reset on Wikipedia](https://en.wikipedia.org/wiki/Password_reset)
  and [Self-service password reset on Wikipedia](https://en.wikipedia.org/wiki/Self-service_password_reset)
- [MongoDB Shell (mongosh) documentation](https://www.mongodb.com/docs/mongodb-shell/)
- WeKan: [Backup](../../Backup/Backup.md),
  [Brute force protection](Accounts-Lockout.md),
  [Admin Panel / People / Login](../Admin-Panel/People/Login.md),
  [Admin Panel / People / People](../Admin-Panel/People/README.md),
  [Troubleshooting Email](../Email/Troubleshooting-Mail.md)

## How to use it

**With working email: the Forgot password link**

1. On the sign-in page, click **Forgot password**.
2. Write your email address and send the form.
3. Open the email and follow its link; set the new password.

The link is shown only while **Forgot password** is ticked under
**Login: Allow** in **Admin Panel / People / Login**. An administrator can
also set anybody's password: **Admin Panel / People / People**, the user's
**Edit** link, field **Password**.

**Without email: repair it in the database**

> Newer WeKan Snaps no longer bundle a MongoDB shell (`mongo` or `mongosh`).
> The default `docker-compose.yml` runs the database as FerretDB in the
> container `wekan-ferretdb` (published on `127.0.0.1:27017`), and since
> FerretDB v1.116.0 its `ferretdb` binary is also `mongosh`, written in Go:
> `docker exec -it wekan-ferretdb mongosh wekan` opens the `wekan` database
> of that same FerretDB, with no address needed. It has the common `db`,
> collection and cursor methods, `show` and `use`, but no Node.js modules
> (`require`). On Snap, or with an older FerretDB image, connect with a
> `mongosh` installed on the host, or with DBGate: on Snap
> `mongodb://127.0.0.1:27019/wekan`, on the default Docker
> `mongodb://127.0.0.1:27017/wekan`. The commands below are the same once you
> are connected. In `mongosh`, `update` is deprecated; `updateOne` does the
> same here.

**a) Wekan Snap**
```
S=/snap; [ -d /snap/wekan ] || S=/var/lib/snapd/snap
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH-}:$S/wekan/current/lib/$(uname -m)-linux-gnu"
export PATH="$PATH:$S/wekan/current/bin"
mongo --port 27019
```
If you have disabled new user registration at Admin Panel, you can enable it, and create new user your https://wekan.example.com/sign-up :
```
db.settings.update({},{$set: {"disableRegistration":false}})
```
Find what users there are:
```
db.users.find()
```
Set some user as admin:
```
db.users.update({username:'admin-username-here'},{$set:{isAdmin:true}})
```
Check are there any failed logins with wrong password, that brute force login prevention has denied login:
```
db.AccountsLockout.Connections.find()
```
If there are, delete all those login preventions:
```
db.AccountsLockout.Connections.deleteMany({})
```
`AccountsLockout.Connections` holds the locks of addresses that tried
usernames that do not exist. A lock on an existing account is stored in that
user's document; remove it too:
```
db.users.updateMany({'services.accounts-lockout': {$exists: true}}, {$unset: {'services.accounts-lockout': 1}})
```
Then exit:
```
exit
```
Then login to Wekan and change any users passwords at `Admin Panel / People / People`.

**b) Wekan Gantt GPL Snap**
```
S=/snap; [ -d /snap/wekan-gantt-gpl ] || S=/var/lib/snapd/snap
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH-}:$S/wekan-gantt-gpl/current/lib/$(uname -m)-linux-gnu"
export PATH="$PATH:$S/wekan-gantt-gpl/current/bin"
mongo --port 27019
```
If you have disabled new user registration at Admin Panel, you can enable it, and create new user your https://wekan.example.com/sign-up :
```
db.settings.update({},{$set: {"disableRegistration":false}})
```
Find what users there are:
```
db.users.find()
```
Set some user as admin:
```
db.users.updateOne({username:'admin-username-here'},{$set:{isAdmin:true}})
```
Check are there any failed logins with wrong password, that brute force login prevention has denied login:
```
db.AccountsLockout.Connections.find()
```
If there are, delete all those login preventions:
```
db.AccountsLockout.Connections.deleteMany({})
```
Then exit:
```
exit
```

Then login to Wekan and change any users passwords at `Admin Panel / People / People`.

**c) Use DBGate or Nosqlbooster** to edit wekan database users table to have admin true:
- [Backup](../../Backup/Backup.md#dbgate-open-source-mongodb-gui)
- [Forgot Password](./Forgot-Password.md)

**Docker**

For the default FerretDB container, the one step
`docker exec -it wekan-ferretdb mongosh wekan` replaces steps 1, 2 and 4.

1. Change to inside of wekan database Docker container (a MongoDB container):
```
docker exec -it wekan-db bash
```
2. Start MongoDB Shell
```
/bin/mongosh
```
3. List databases
```
show dbs
```
4. Change to wekan database
```
use wekan
```
5. Show collections/tables
```
show collections
```
6. Count users
```
db.users.count()
```
7. If you have disabled new user registration at Admin Panel, you can enable it, and create new user your https://wekan.example.com/sign-up :
```
db.settings.update({},{$set: {"disableRegistration":false}})
```
8. Find what users there are:
```
db.users.find()
```
9. Set some user as admin:
```
db.users.update({username:'admin-username-here'},{$set:{isAdmin:true}})
```
10. Check are there any failed logins with wrong password, that brute force login prevention has denied login:
```
db.AccountsLockout.Connections.find()
```
11. If there are, delete all those login preventions:
```
db.AccountsLockout.Connections.deleteMany({})
```
12. Then exit:
```
exit
```
13. Then login to Wekan and change any users passwords at `Admin Panel / People / People`.

More info:
- [Backup](../../Backup/Backup.md)
- [Docker](../../Platforms/FOSS/Container/Docker)

**Set user as BoardAdmin on all boards user is member of**

[Source](https://github.com/wekan/wekan/issues/2413#issuecomment-1239249563).
The quotes are plain `"` here; the curly quotes of the original comment do
not work in a shell.

```
db.boards.updateMany(
{ members: { $elemMatch: { userId: "USER-ID-HERE", isAdmin: false } } },
{
$set: { "members.$.isAdmin": true },
}
);
```

**Don't have Admin Rights to board**

1. In Robo 3T, find where your ID that your username has:
```
db.getCollection('users').find({username: "YOUR-USERNAME-HERE"})
```
2. Find board where you are not admin, using user ID you found above:
```
db.getCollection('boards').find({members: {$elemMatch: { userId: "YOUR-USER-ID-HERE", isAdmin: false} } })
```
And set yourself as admin.

## How the numbers are calculated

- Rate limits per client address
  ([server/models/users.js](../../../server/models/users.js), `DDPRateLimiter`
  rules): `forgotPassword` 5 calls and `resetPassword` 5 calls per 60 seconds,
  `verifyEmail` 10 per 60 seconds. A refused call is recorded in Admin Panel /
  Problems.
- The reset link's lifetime is Meteor's default
  (`passwordResetTokenExpirationInDays`, 3 days); WeKan does not change it.
- `db.users.count()` above is simply the number of documents in `users`.

## How it works in WeKan

- [config/accounts.js](../../../config/accounts.js) configures the
  `forgotPwd` and `resetPwd` routes only while forgot-password is allowed,
  and passes `showForgotPasswordLink` to the useraccounts form.
- `disableForgotPassword` in the `settings` collection is the checkbox, stored
  inverted ([client/components/settings/settingBody.jade](../../../client/components/settings/settingBody.jade)).
  [client/components/main/layouts.js](../../../client/components/main/layouts.js)
  asks `isDisableForgotPassword` and adds the `forgotpwd-disabled` class to
  `<body>`, so the link stays hidden after the form re-renders (#4394).
- [server/lib/resetPasswordEmail.js](../../../server/lib/resetPasswordEmail.js)
  builds the reset, verify and enroll emails without ever throwing, and turns
  a failing SMTP send into a clean error instead of an HTTP 500 (#5706).
- Locks: see [Brute force protection](Accounts-Lockout.md).
- Tests: [tests/unit/resetPasswordEmail.test.js](../../../tests/unit/resetPasswordEmail.test.js),
  [tests/emailTemplatesCustomization.test.cjs](../../../tests/emailTemplatesCustomization.test.cjs),
  [tests/passwordChangeSessions.test.cjs](../../../tests/passwordChangeSessions.test.cjs).

### OLD INFO BELOW

1) Download [Robo 3T](https://robomongo.org) on your Linux or Mac computer. Or, using ssh shell to server, [login to MongoDB database using mongo cli](../../Backup/Backup.md#mongodb-shell-on-wekan-snap)

2) Make SSH tunnel to your server, from your local port 9000 (or any other) to server MongoDB port 27019:
```
ssh -L 9000:localhost:27019 user@example.com
```
3) Open Robo 3T, create new connection: Name, address: localhost : 9000 

a) If you don't have self-registration disabled, register new account at /sign-up, and make yourself admin in MongoDB database:

1) Use database that has wekan data, for example:
```
use wekan
```
2) Add Admin rights to some Wekan username:
```
db.users.update({username:'admin-username-here'},{$set:{isAdmin:true}})
```

b) If someone else remembers their password, and his/her login works, copy their bcrypt hashed password to your password using Robo 3T.

c) Install Wekan elsewhere, create new user, copy bcrypt hashed password to your password.

d) Backup, New install, Create User, Copy Password, Restore:

1. [Backup Snap](https://github.com/wekan/wekan-snap/wiki/Backup-and-restore)
2. stop wekan `sudo snap stop wekan.wekan`
3. Empty the database:
   - a) by dropping wekan database in Mongo 3T, or
   - b) in [mongo cli](../../Backup/Backup.md#mongodb-shell-on-wekan-snap):
```
mongo --port 27019
```
Look what databases there are:
```
show dbs
```
Probably database is called wekan, so use it:
```
use wekan
```
Delete database:
```
db.dropDatabase()
```
4. Start wekan (the old text said `sudo snap stop wekan.wekan` here, which
   stops it):
```
sudo snap start wekan.wekan
```
5. Register at /sign-up
6. Copy bcrypt hashed password to text editor
7. [Restore your backup](https://github.com/wekan/wekan-snap/wiki/Backup-and-restore)
8. Change to database your new bcrypt password.

## Commits

 - [Rate-limit forgot-password, reset-password and verify-email per address](https://github.com/wekan/wekan/commit/12f2fddc2c179bcc53fa8f31bfcb43a320b9fdff)
 - [Admin Panel / People / Login: the checkboxes threw instead of saving](https://github.com/wekan/wekan/commit/8593e9411efea968c67b210a523b44b97a52169c)
 - [Admin Panel / People / Login: one "Login: Allow" group of checkboxes](https://github.com/wekan/wekan/commit/40c1c1e7173edfd0f74f44b0414081c2b6f86ef6)
 - [Login and E-mail move from Admin Panel / Settings to People](https://github.com/wekan/wekan/commit/47b03ef89404c446dbaf0fc94c7271abaf82e5ef)
 - [Register / Forgot Password links stay hidden after a failed login](https://github.com/wekan/wekan/commit/e014d5c8169053805da407facdee98531c6c7d14)
 - [Forgot-password no longer answers 500: the reset email is built and sent gracefully](https://github.com/wekan/wekan/commit/f456a1b8f5966b7a7d2add134fbeab2aadd951b2)
 - [Try to fix Disable Registration and Disable Forgot Password](https://github.com/wekan/wekan/commit/0775e2a3e5c5d98e4d8c1954a15beb0688c73075)
 - [Added Disable Forgot Password to the Admin Panel](https://github.com/wekan/wekan/commit/b85db43c4755cf54e550f664311cd95097d68ae1)
