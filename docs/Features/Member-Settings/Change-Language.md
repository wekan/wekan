## Change language for all users

Using MongoDB Shell with WeKan Snap Candidate, to change English date format to `DD/MM/YY`.

MongoDB Shell Download: https://www.mongodb.com/try/download/shell

language.sh:
```
mongosh --quiet \
--host 127.0.0.1 \
--port 27019 \
--eval 'use wekan' \
--eval 'db.users.updateMany({}, { $set: {"profile.language": "en-GB" }});'
```
Set script as executeable:
```
chmod +x language.sh
```
Running script, when 5 new users of total 20 users did not have language set correctly yet:
```
$ ./language.sh 
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 20,
  modifiedCount: 5,
  upsertedCount: 0
}
```
## Language browser settings

https://github.com/wekan/wekan/issues/4518#issuecomment-1133763518