# RFID tags with WeKan's REST API

[#1126](https://github.com/wekan/wekan/issues/1126). WeKan has no RFID support
of its own, and needs none. A reader next to a door, a workbench or a shelf,
and a short script, can use the [REST API](REST-API.md) to move a card when a
tagged thing is scanned. Examples: a tool going out moves its card to *In
use*, a parcel arriving moves to *Received*, a person checking in adds a
comment.

## What you need

- WeKan with the REST API on (`WITH_API=true`) and a WeKan user for the
  reader, member of the board with write access. That user's rights are all
  the script has.
- An RFID reader. Most USB readers type the tag's number like a keyboard and
  press Enter, so a script reads it from standard input. Serial readers (e.g.
  RC522 or PN532 on a Raspberry Pi) are read with their own library; only
  the line `tag = ...` below changes.
- On the board, a [custom field](../Features/Cards/CustomFields) called
  *RFID*, holding each card's tag number.

## Find a card by its tag, move it

`GET /api/boards/{board}/cardsByCustomField/{field}/{value}` finds the cards
whose *RFID* field holds the tag, and `PUT
/api/boards/{board}/lists/{list}/cards/{card}` with `{ "listId": ... }` moves
one to another list of the board.

```python
#!/usr/bin/env python3
# Moves the card whose RFID custom field holds the scanned tag to TARGET_LIST.
import json, sys, urllib.request

WEKAN = "https://wekan.example.com"
USER, PASSWORD = "rfid-reader", "a long password"
BOARD, RFID_FIELD, TARGET_LIST = "<board id>", "<RFID custom field id>", "<list id>"

def call(method, path, body=None, token=None):
    req = urllib.request.Request(WEKAN + path, method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={"Content-Type": "application/json",
                 **({"Authorization": "Bearer " + token} if token else {})})
    with urllib.request.urlopen(req) as res:
        return json.load(res)

token = call("POST", "/users/login", {"username": USER, "password": PASSWORD})["token"]
for line in sys.stdin:                     # a USB reader types the tag + Enter
    tag = line.strip()
    if not tag:
        continue
    cards = call("GET", f"/api/boards/{BOARD}/cardsByCustomField/{RFID_FIELD}/{tag}", token=token)
    for card in cards:
        call("PUT", f"/api/boards/{BOARD}/lists/{card['listId']}/cards/{card['_id']}",
             {"listId": TARGET_LIST}, token=token)
        print(f"{tag}: moved {card['title']}")
    if not cards:
        print(f"{tag}: no card has this tag")
```

The ids are in the board's URL and in `GET /api/boards/{board}/lists` and
`GET /api/boards/{board}/custom-fields`.

## Other actions

- Add a comment instead: `POST /api/boards/{board}/cards/{card}/comments`
  with `{ "comment": "Checked in at the workshop" }`.
- Create a card for an unknown tag: `POST
  /api/boards/{board}/lists/{list}/cards` with `{ "title": tag, "swimlaneId":
  ... }`, then set its *RFID* field.
- Let a [Rule](../Features/Automation/Rules/Rules.md) do the rest: "when a card
  is moved to *In use*, set the due date to 7 days later".

Keep the reader's WeKan password out of the script in shared places, for
example in an environment variable, and give that user only the boards it
needs.
