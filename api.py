#! /usr/bin/env python3
# -*- coding: utf-8 -*-
# vi:ts=4:et

# Wekan API Python CLI, originally from here, where is more details:
# https://github.com/wekan/wekan/wiki/New-card-with-Python3-and-REST-API

# TODO:
#   addcustomfieldtoboard: There is error: Settings must be object. So adding does not work yet.

try:
    # python 3
    from urllib.parse import urlencode
except ImportError:
    # python 2
    from urllib import urlencode

import json
import requests
import sys

arguments = len(sys.argv) - 1

if arguments == 0:
    print("=== Wekan API Python CLI: Shows IDs for addcard ===")
    print("AUTHORID is USERID that writes card.")
    print("If *nix:  chmod +x api.py => ./api.py users")
    print("Syntax:")
    print("  python3 api.py users                # All users")
    print("  python3 api.py boards               # All Public Boards")
    print("  python3 api.py boards USERID        # Boards of USERID")
    print("  python3 api.py board BOARDID        # Info of BOARDID")
    print("  python3 api.py customfields BOARDID # Custom Fields of BOARDID")
    print("  python3 api.py customfield BOARDID CUSTOMFIELDID # Info of CUSTOMFIELDID")
    print("  python3 api.py addcustomfieldtoboard AUTHORID BOARDID NAME TYPE SETTINGS SHOWONCARD AUTOMATICALLYONCARD SHOWLABELONMINICARD SHOWSUMATTOPOFLIST # Add Custom Field to Board")
    print("  python3 api.py swimlanes BOARDID    # Swimlanes of BOARDID")
    print("  python3 api.py lists BOARDID        # Lists of BOARDID")
    print("  python3 api.py list BOARDID LISTID  # Info of LISTID")
    print("  python3 api.py createlist BOARDID LISTTITLE # Create list")
    print("  python3 api.py addcard AUTHORID BOARDID SWIMLANEID LISTID CARDTITLE CARDDESCRIPTION")
    print("  python3 api.py editcard BOARDID LISTID CARDID NEWCARDTITLE NEWCARDDESCRIPTION")
    print("  python3 api.py listattachments BOARDID # List attachments")
    print("  python3 api.py newuser USERNAME EMAIL PASSWORD")
# TODO:
#   print("  python3 api.py attachmentjson BOARDID ATTACHMENTID # One attachment as JSON base64")
#   print("  python3 api.py attachmentbinary BOARDID ATTACHMENTID # One attachment as binary file")
#   print("  python3 api.py attachmentdownload BOARDID ATTACHMENTID # One attachment as file")
#   print("  python3 api.py attachmentsdownload BOARDID # All attachments as files")
    exit

# ------- SETTINGS START -------------

# Username is your Wekan username or email address.
# OIDC/OAuth2 etc uses email address as username.

username = 'testtest'

password = 'testtest'

wekanurl = 'http://localhost:4000/'

# ------- SETTINGS END -------------

"""
EXAMPLE:

python3 api.py

OR:
chmod +x api.py
./api.py

=== Wekan API Python CLI: Shows IDs for addcard ===
AUTHORID is USERID that writes card.
Syntax:
  python3 api.py users                # All users
  python3 api.py boards USERID        # Boards of USERID
  python3 api.py board BOARDID        # Info of BOARDID
  python3 api.py customfields BOARDID # Custom Fields of BOARDID
  python3 api.py customfield BOARDID CUSTOMFIELDID # Info of CUSTOMFIELDID
  python3 api.py addcustomfieldtoboard AUTHORID BOARDID NAME TYPE SETTINGS SHOWONCARD AUTOMATICALLYONCARD SHOWLABELONMINICARD SHOWSUMATTOPOFLIST # Add Custom Field to Board
  python3 api.py swimlanes BOARDID    # Swimlanes of BOARDID
  python3 api.py lists BOARDID        # Lists of BOARDID
  python3 api.py list BOARDID LISTID  # Info of LISTID
  python3 api.py createlist BOARDID LISTTITLE # Create list
  python3 api.py addcard AUTHORID BOARDID SWIMLANEID LISTID CARDTITLE CARDDESCRIPTION
  python3 api.py editcard BOARDID LISTID CARDID NEWCARDTITLE NEWCARDDESCRIPTION
  python3 api.py listattachments BOARDID # List attachments
  python3 api.py attachmentjson BOARDID ATTACHMENTID # One attachment as JSON base64
  python3 api.py attachmentbinary BOARDID ATTACHMENTID # One attachment as binary file

=== ADD CUSTOM FIELD TO BOARD ===

Type: text, number, date, dropdown, checkbox, currency, stringtemplate.

python3 api.py addcustomfieldtoboard cmx3gmHLKwAXLqjxz LcDW4QdooAx8hsZh8 "SomeField" "date" "" true true true true 


=== USERS ===

python3 api.py users

=> abcd1234

=== BOARDS ===

python3 api.py boards abcd1234


=== SWIMLANES ===

python3 api.py swimlanes dYZ

[{"_id":"Jiv","title":"Default"}
]

=== LISTS ===

python3 api.py lists dYZ

[]

There is no lists, so create a list:

=== CREATE LIST ===

python3 api.py createlist dYZ 'Test'

{"_id":"7Kp"}

#  python3 api.py addcard AUTHORID BOARDID SWIMLANEID LISTID CARDTITLE CARDDESCRIPTION

python3 api.py addcard ppg dYZ Jiv 7Kp 'Test card' 'Test description'

=== LIST ATTACHMENTS WITH DOWNLOAD URLs ====

python3 api.py listattachments BOARDID

"""

# ------- API URL GENERATION START -----------

loginurl = 'users/login'
wekanloginurl = wekanurl + loginurl
apiboards = 'api/boards/'
apiattachments = 'api/attachments/'
apiusers = 'api/users'
e = 'export'
s = '/'
l = 'lists'
sw = 'swimlane'
sws = 'swimlanes'
cs = 'cards'
cf = 'custom-fields'
bs = 'boards'
atl = 'attachmentslist'
at = 'attachment'
ats = 'attachments'
users = wekanurl + apiusers

# ------- API URL GENERATION END -----------

# ------- LOGIN TOKEN START -----------

data = {"username": username, "password": password}
body = requests.post(wekanloginurl, json=data)
d = body.json()
apikey = d['token']

# ------- LOGIN TOKEN END -----------

if arguments == 10:

    if sys.argv[1] == 'addcustomfieldtoboard':
        # ------- ADD CUSTOM FIELD TO BOARD START -----------
        authorid = sys.argv[2]
        boardid = sys.argv[3]
        name = sys.argv[4]
        type1 = sys.argv[5]
        settings = str(json.loads(sys.argv[6]))
        #  There is error: Settings must be object. So this does not work yet.
        #settings = {'currencyCode': 'EUR'}
        print(type(settings))
        showoncard = sys.argv[7]
        automaticallyoncard = sys.argv[8]
        showlabelonminicard = sys.argv[9]
        showsumattopoflist = sys.argv[10]
        customfieldtoboard = wekanurl + apiboards + boardid + s + cf
        # Add Custom Field to Board
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'authorId': '{}'.format(authorid), 'name': '{}'.format(name), 'type': '{}'.format(type1), 'settings': '{}'.format(settings), 'showoncard': '{}'.format(showoncard), 'automaticallyoncard': '{}'.format(automaticallyoncard), 'showlabelonminicard': '{}'.format(showlabelonminicard), 'showsumattopoflist': '{}'.format(showsumattopoflist)}
        body = requests.post(customfieldtoboard, data=post_data, headers=headers)
        print(body.text)
        # ------- ADD CUSTOM FIELD TO BOARD END -----------

if arguments == 7:

    if sys.argv[1] == 'addcard':
        # ------- ADD CARD START -----------
        authorid = sys.argv[2]
        boardid = sys.argv[3]
        swimlaneid = sys.argv[4]
        listid = sys.argv[5]
        cardtitle = sys.argv[6]
        carddescription = sys.argv[7]
        cardtolist = wekanurl + apiboards + boardid + s + l + s + listid + s + cs
        # Add card
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'authorId': '{}'.format(authorid), 'title': '{}'.format(cardtitle), 'description': '{}'.format(carddescription), 'swimlaneId': '{}'.format(swimlaneid)}
        body = requests.post(cardtolist, data=post_data, headers=headers)
        print(body.text)
        # ------- ADD CARD END -----------

if arguments == 6:

    if sys.argv[1] == 'editcard':

        # ------- EDIT CARD START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        newcardtitle = sys.argv[5]
        newcarddescription = sys.argv[6]
        edcard = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
        print(edcard)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        put_data = {'title': '{}'.format(newcardtitle), 'description': '{}'.format(newcarddescription)}
        body = requests.put(edcard, data=put_data, headers=headers)
        print("=== EDIT CARD ===\n")
        body = requests.get(edcard, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- EDIT CARD END -----------

if arguments == 4:

    if sys.argv[1] == 'newuser':

        # ------- CREATE NEW USER START -----------
        username = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'username': '{}'.format(username),'email': '{}'.format(email),'password': '{}'.format(password)}
        body = requests.post(users, data=post_data, headers=headers)
        print("=== CREATE NEW USER ===\n")
        print(body.text)
        # ------- CREATE NEW USER END -----------

if arguments == 3:

    if sys.argv[1] == 'createlist':

        # ------- CREATE LIST START -----------
        boardid = sys.argv[2]
        listtitle = sys.argv[3]
        list = wekanurl + apiboards + boardid + s + l
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'title': '{}'.format(listtitle)}
        body = requests.post(list, data=post_data, headers=headers)
        print("=== CREATE LIST ===\n")
        print(body.text)
        # ------- CREATE LIST END -----------

    if sys.argv[1] == 'list':

        # ------- LIST OF BOARD START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]
        listone = wekanurl + apiboards + boardid + s + l + s + listid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== INFO OF ONE LIST ===\n")
        body = requests.get(listone, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LISTS OF BOARD END -----------

    if sys.argv[1] == 'customfield':

        # ------- INFO OF CUSTOM FIELD START -----------
        boardid = sys.argv[2]
        customfieldid = sys.argv[3]
        customfieldone = wekanurl + apiboards + boardid + s + cf + s + customfieldid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== INFO OF ONE CUSTOM FIELD ===\n")
        body = requests.get(customfieldone, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- INFO OF CUSTOM FIELD END -----------

if arguments == 2:

    # ------- BOARDS LIST START -----------
    userid = sys.argv[2]
    boards = users + s + userid + s + bs
    if sys.argv[1] == 'boards':
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        #post_data = {'userId': '{}'.format(userid)}
        body = requests.get(boards, headers=headers)
        print("=== BOARDS ===\n")
        data2 = body.text.replace('}',"}\n")
        print(data2)
    # ------- BOARDS LIST END -----------

    if sys.argv[1] == 'board':
        # ------- BOARD INFO START -----------
        boardid = sys.argv[2]
        board = wekanurl + apiboards + boardid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.get(board, headers=headers)
        print("=== BOARD ===\n")
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- BOARD INFO END -----------

    if sys.argv[1] == 'customfields':
        # ------- CUSTOM FIELDS OF BOARD START -----------
        boardid = sys.argv[2]
        boardcustomfields = wekanurl + apiboards + boardid + s + cf
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.get(boardcustomfields, headers=headers)
        print("=== CUSTOM FIELDS OF BOARD ===\n")
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- CUSTOM FIELDS OF BOARD END -----------

    if sys.argv[1] == 'swimlanes':
        boardid = sys.argv[2]
        swimlanes = wekanurl + apiboards + boardid + s + sws
        # ------- SWIMLANES OF BOARD START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== SWIMLANES ===\n")
        body = requests.get(swimlanes, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- SWIMLANES OF BOARD END -----------

    if sys.argv[1] == 'lists':

        # ------- LISTS OF BOARD START -----------
        boardid = sys.argv[2]
        lists = wekanurl + apiboards + boardid + s + l
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== LISTS ===\n")
        body = requests.get(lists, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LISTS OF BOARD END -----------

    if sys.argv[1] == 'listattachments':

        # ------- LISTS OF ATTACHMENTS START -----------
        boardid = sys.argv[2]
        listattachments = wekanurl + apiboards + boardid + s + ats
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== LIST OF ATTACHMENTS ===\n")
        body = requests.get(listattachments, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LISTS OF ATTACHMENTS END -----------

if arguments == 1:

    if sys.argv[1] == 'users':

        # ------- LIST OF USERS START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print(users)
        print("=== USERS ===\n")
        body = requests.get(users, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF USERS END -----------

    if sys.argv[1] == 'boards':

        # ------- LIST OF PUBLIC BOARDS START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== PUBLIC BOARDS ===\n")
        listpublicboards = wekanurl + apiboards
        body = requests.get(listpublicboards, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF PUBLIC BOARDS END -----------
