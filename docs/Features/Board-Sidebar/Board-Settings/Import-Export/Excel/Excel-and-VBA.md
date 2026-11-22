# Excel, VBA and the REST API

## What it is

WeKan reads and writes boards as Excel `.xlsx` workbooks, and Excel's VBA can
work with WeKan through its REST API: log in, read a board as JSON, change a
card. This page covers importing an Excel board, using the REST API from VBA,
and an earlier note on CSV and TSV.

## Read more

- [Wikipedia: Visual Basic for Applications](https://en.wikipedia.org/wiki/Visual_Basic_for_Applications)
- [Wikipedia: Microsoft Excel](https://en.wikipedia.org/wiki/Microsoft_Excel)
- [Excel](Excel.md): the Excel import and export in full
- [REST API](../../../../../API/REST-API.md)

## How to use it

### Importing an Excel (.xlsx) board

WeKan can import a board directly from an Excel `.xlsx` spreadsheet:

1. **All Boards → Add Board → Import → Import board → Excel**.
2. Choose a WeKan-style `.xlsx` file (the same columns the **Excel export** produces:
   Title, Description, Status/List, Members, Labels, dates, custom fields). The first
   row is the header.

The spreadsheet is parsed on the server and imported through the same engine as the
CSV/TSV import. Member columns are not auto-mapped for Excel import (map members
afterwards); see also [CSV/TSV import](../CSV/CSV.md).

This complements the existing **Excel export** (Board Settings → Export → Excel), so
boards can round-trip through `.xlsx`.

### Excel VBA and the REST API

Related projects:
* [VBA-Web](https://github.com/VBA-tools/VBA-Web) - using REST APIs with VBA
* [VBA-JSON](https://github.com/VBA-tools/VBA-JSON)
* [VBA to Javascript translator](https://github.com/mha105/VBA-to-JavaScript-Translator)
* [Tcl and Excel](http://www.xet7.org/tcl)

For accessing Wekan with Excel VBA, you can use Wekan REST API:

[REST API](../../../../../API/REST-API.md)

For example, with using curl, you first login with admin credentials,
by sending username and password to url.
Change your server url etc details to below:

Login with as JSON [REST API](../../../../../API/REST-API.md#example-call---as-json)
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
[REST API](../../../../../API/REST-API.md)

Wekan boards also have export JSON, where also attachments are included in JSON as
base64 encoded files. To convert them back to files, you first get whole one board exported
after authentication like this:

```
curl https://Bearer:APIKEY@ip-address/api/boards/BOARD-ID/export?authToken=#APIKEY > wekanboard.json
```

Then you read that JSON file with VBA, and get that part where in JSON is the base64 text
of the file. Then you use VBA base64 function to convert it to binary, and write content to file.

### CSV/TSV Import/Export

WeKan imports and exports CSV and TSV now: see [CSV/TSV](../CSV/CSV.md). The
rest of this section is the earlier note, from before that was built.

There is [CSV/TSV pull request](https://github.com/wekan/wekan/pull/413), but it has been made
a long time ago, it would need some work to add all the new tables, columns etc from
MongoDB database, so that it would export everything correctly.

Options are:

a) Some developer could do that work and contribute that code to Wekan as
new pull request to Wekan devel branch.

b) Use [Commercial Support](https://wekan.fi) and pay for the time to get it implemented.

## How the numbers are calculated

See [Excel](Excel.md) for the Excel import's and export's limits (the column
mapping reads at most 10,000 header cells and shows 3 sample rows; a list name
may be at most 255 characters). The REST API's login token expires at the time
it answers (`tokenExpires`).

## How it works in WeKan

An `.xlsx` import is read on the server and goes through the same engine as
the CSV/TSV import ([models/csvCreator.js](../../../../../../models/csvCreator.js));
the Excel export is
[models/server/ExporterExcelBoard.js](../../../../../../models/server/ExporterExcelBoard.js).
The REST API's login is `POST /users/login`, and a card is changed with
`PUT /api/boards/:boardId/lists/:listId/cards/:cardId`
([server/models/cards.js](../../../../../../server/models/cards.js)).

## Commits
 - [Import a board from an Excel .xlsx workbook (in a batch of import, export and rules features)](https://github.com/wekan/wekan/commit/f0bce67a3bf301c21ded3eb97e84a3be0010290f)
 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
