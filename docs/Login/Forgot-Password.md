## Snap

**a) Wekan Snap**
```
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan/current/lib/x86_64-linux-gnu
export PATH="$PATH:/snap/wekan/current/bin"
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
Then exit:
```
exit
```
Then login to Wekan and change any users passwords at `Admin Panel / People / People`.

**b) Wekan Gantt GPL Snap**
```
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/snap/wekan-gantt-gpl/current/lib/x86_64-linux-gnu
export PATH="$PATH:/snap/wekan-gantt-gpl/current/bin"
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
- https://github.com/wekan/wekan/wiki/Backup#dbgate-open-source-mongodb-gui
- https://github.com/wekan/wekan/wiki/Forgot-Password

## Set user as BoardAdmin on all boards user is member of

[Source](https://github.com/wekan/wekan/issues/2413#issuecomment-1239249563)

```
db.boards.updateMany(
{ members: { $elemMatch: { userId: “USER-ID-HERE”, isAdmin: false } } },
{
$set: { “members.$.isAdmin”: true },
}
);
```

## Docker 

1. Change to inside of wekan database Docker container:
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
- https://github.com/wekan/wekan/wiki/Backup
- https://github.com/wekan/wekan/wiki/Docker

***


## OLD INFO BELOW:

1) Download [Robo 3T](https://robomongo.org) on your Linux or Mac computer. Or, using ssh shell to server, [login to MongoDB database using mongo cli](Backup#mongodb-shell-on-wekan-snap)

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
3a. Empty database by dropping wekan database in Mongo 3T
3b. Empty database in [mongo cli](mongo cli](Backup#mongodb-shell-on-wekan-snap):
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
4. Start wekan:
```
sudo snap stop wekan.wekan
```
5. Register at /sign-up
6. Copy bcrypt hashed password to text editor
7. [Restore your backup](https://github.com/wekan/wekan-snap/wiki/Backup-and-restore)
8. Change to database your new bcrypt password.

## Don't have Admin Rights to board

1. In Robo 3T, find where your ID that your username has:
```
db.getCollection('users').find({username: "YOUR-USERNAME-HERE"})
```
2. Find board where you are not admin, using user ID you found above:
```
db.getCollection('boards').find({members: {$elemMatch: { userId: "YOUR-USER-ID-HERE", isAdmin: false} } })
```
And set yourself as admin.