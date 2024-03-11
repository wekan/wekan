Related projects:
* [VBA-Web](https://github.com/VBA-tools/VBA-Web) - using REST APIs with VBA
* [VBA-JSON](https://github.com/VBA-tools/VBA-JSON)
* [VBA to Javascript translator](https://github.com/mha105/VBA-to-JavaScript-Translator)
* [Tcl and Excel](http://www.xet7.org/tcl)

For accessing Wekan with Excel VBA, you can use Wekan REST API:

https://github.com/wekan/wekan/wiki/REST-API

For example, with using curl, you first login with admin credentials,
by sending username and password to url.
Change your server url etc details to below:

Login with as JSON https://github.com/wekan/wekan/wiki/REST-API#example-call---as-json
```
curl -H "Content-type:application/json" \
      http://localhost:3000/users/login \
      -d '{ "email": "my@email.com", "password": "mypassword" }'
```
=>
```
{
 "id": "ABCDEFG123456",
 "token": "AUTH-TOKEN",
 "tokenExpires": "2018-07-15T14:23:18.313Z"
}
```
Then you update card content by sending to card URL the new content:

```
curl -H "Authorization: Bearer AUTH-TOKEN" \
   -H "Content-type:application/json" \
   -X PUT \
http://localhost:3000/api/boards/ABCDEFG123456/lists/ABCDEFG123456/cards/ABCDEFG123456 \
-d '{ "title": "Card new title", "listId": "ABCDEFG123456", "description": "Card new description" }'
```

When using VBA, you can optionally:
* Use direct VBA commands to send and receive from URLs
* Download curl for Windows, and in VBA call curl.exe with those parameters, and get the result.

You can also google search how you can use JSON format files in VBA,
converting them to other formats etc. There could be something similar that
exists in PHP, that JSON file can be converted to PHP array, and array items accessed
individually, and array converted back to JSON.

Current Wekan REST API does not yet cover access to all data that is in MongoDB.
If you need that, REST API page also has link to Restheart, that adds REST API
to MongoDB, so you can use all of MongoDB data directly with REST API.
https://github.com/wekan/wekan/wiki/REST-API

Wekan boards also have export JSON, where also attachments are included in JSON as
base64 encoded files. To convert them back to files, you first get whole one board exported
after authentication like this:

```
curl https://Bearer:APIKEY@ip-address/api/boards/BOARD-ID/export?authToken=#APIKEY > wekanboard.json
```

Then you read that JSON file with VBA, and get that part where in JSON is the base64 text
of the file. Then you use VBA base64 function to convert it to binary, and write content to file.

# CSV/TSC Import/Export

There is [CSV/TSV pull request](https://github.com/wekan/wekan/pull/413), but it has been made
a long time ago, it would need some work to add all the new tables, columns etc from
MongoDB database, so that it would export everything correctly.

Options are:

a) Some developer could do that work and contribute that code to Wekan as
new pull request to Wekan devel branch.

b) Use [Commercial Support](https://wekan.team) and pay for the time to get it implemented.