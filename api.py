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

syntax = """=== Wekan API Python CLI: Shows IDs for addcard ===
# AUTHORID is USERID that writes card or custom field.
If *nix:  chmod +x api.py => ./api.py users
  Syntax:
        User API:
    python3 api.py user                 # Current user and list of current user boards
        python3 api.py users                # All users
        python3 api.py boards               # All Public Boards
    python3 api.py boards USERID        # Boards of USERID
        python3 api.py board BOARDID        # Info of BOARDID

        Board/List/Card API:
    python3 api.py swimlanes BOARDID    # Swimlanes of BOARDID
    python3 api.py lists BOARDID        # Lists of BOARDID
    python3 api.py list BOARDID LISTID  # Info of LISTID
    python3 api.py createlist BOARDID LISTTITLE # Create list
    python3 api.py editlist BOARDID LISTID NEWLISTTITLE # Edit list title
    python3 api.py editlistcolor BOARDID LISTID COLOR (Color available: `white`, `green`, `yellow`, `orange`, `red`, `purple`, `blue`, `sky`, `lime`, `pink`, `black`, `silver`, `peachpuff`, `crimson`, `plum`, `darkgreen`, `slateblue`, `magenta`, `gold`, `navy`, `gray`, `saddlebrown`, `paleturquoise`, `mistyrose`, `indigo`) # Edit list color
    python3 api.py addcard AUTHORID BOARDID SWIMLANEID LISTID CARDTITLE CARDDESCRIPTION
    python3 api.py editcard BOARDID LISTID CARDID NEWCARDTITLE NEWCARDDESCRIPTION
        python3 api.py getcard BOARDID LISTID CARDID # Get card info
        python3 api.py cardsbyswimlane BOARDID SWIMLANEID # Retrieve cards list on a swimlane
        python3 api.py deleteallcards BOARDID SWIMLANEID ( * Be careful will delete ALL CARDS INSIDE the swimlanes automatically in every list * ) # Delete all cards on a swimlane
        python3 api.py get_list_cards_count BOARDID LISTID # Retrieve how many cards in a list
        python3 api.py get_board_cards_count BOARDID # Retrieve how many cards in a board
        python3 api.py editboardtitle BOARDID NEWBOARDTITLE # Edit board title
        python3 api.py copyboard BOARDID NEWBOARDTITLE # Copy a board

        Custom Fields / Labels API:
    python3 api.py customfields BOARDID # Custom Fields of BOARDID
    python3 api.py customfield BOARDID CUSTOMFIELDID # Info of CUSTOMFIELDID
    python3 api.py addcustomfieldtoboard AUTHORID BOARDID NAME TYPE SETTINGS SHOWONCARD AUTOMATICALLYONCARD SHOWLABELONMINICARD SHOWSUMATTOPOFLIST # Add Custom Field to Board
    python3 api.py editcustomfield BOARDID LISTID CARDID CUSTOMFIELDID NEWCUSTOMFIELDVALUE # Edit Custom Field
        python3 api.py createlabel BOARDID LABELCOLOR LABELNAME (Color available: `white`, `green`, `yellow`, `orange`, `red`, `purple`, `blue`, `sky`, `lime`, `pink`, `black`, `silver`, `peachpuff`, `crimson`, `plum`, `darkgreen`, `slateblue`, `magenta`, `gold`, `navy`, `gray`, `saddlebrown`, `paleturquoise`, `mistyrose`, `indigo`) # Create a new label
        python3 api.py addlabel BOARDID LISTID CARDID LABELID # Add label to a card
        python3 api.py addcardwithlabel AUTHORID BOARDID SWIMLANEID LISTID CARDTITLE CARDDESCRIPTION LABELIDS # Add a card and a label
        python3 api.py editcardcolor BOARDID LISTID CARDID COLOR (Color available: `white`, `green`, `yellow`, `orange`, `red`, `purple`, `blue`, `sky`, `lime`, `pink`, `black`, `silver`, `peachpuff`, `crimson`, `plum`, `darkgreen`, `slateblue`, `magenta`, `gold`, `navy`, `gray`, `saddlebrown`, `paleturquoise`, `mistyrose`, `indigo`) # Edit card color

        Checklist API:
        python3 api.py addchecklist BOARDID CARDID TITLE ITEM1 ITEM2 ITEM3 ITEM4 (You can add multiple items or just one, or also without any item, just TITLE works as well. * If items or Title contains spaces, you should add ' between them.) # Add checklist + item on a card
        python3 api.py checklistid BOARDID CARDID # Retrieve Checklist ID attached to a card
        python3 api.py checklistinfo BOARDID CARDID CHECKLISTID # Get checklist info

        Attachment API:
    python3 api.py listattachments BOARDID # List attachments
    python3 api.py uploadattachment BOARDID SWIMLANEID LISTID CARDID FILEPATH [STORAGE_BACKEND] # Upload attachment to card
    python3 api.py downloadattachment ATTACHMENTID OUTPUTPATH # Download attachment to local file
    python3 api.py attachmentinfo ATTACHMENTID # Get attachment information
    python3 api.py listcardattachments BOARDID SWIMLANEID LISTID CARDID # List attachments for specific card
    python3 api.py copymoveattachment ATTACHMENTID TARGETBOARDID TARGETSWIMLANEID TARGETLISTID TARGETCARDID [copy|move] # Copy or move attachment
    python3 api.py deleteattachment ATTACHMENTID # Delete attachment
    python3 api.py uploadbackground BOARDID FILEPATH # Upload a board background image (uses Admin Panel default storage)
    python3 api.py downloadbackground BOARDID OUTPUTPATH # Download the board's current background image
    python3 api.py importboard EXPORT.json # Import a whole board (with rules/workflows) from a WeKan export
    python3 api.py migratefromwekan REMOTE_URL REMOTE_USER REMOTE_PASS # Import ALL boards+workflows+rules from another WeKan
    python3 api.py exportboardpdf BOARDID OUTPUT.pdf # Export a whole board to PDF
    python3 api.py importboardfrom SOURCE EXPORT.json # Import from trello/wekan/csv/jira/kanboard/excel/deck/openproject/github/gitlab/gitea/forgejo/asana/zenkit
    python3 api.py exportboardformat BOARDID FORMAT OUTPUT.json # Export to kanboard/trello/jira/deck/openproject/github/gitlab/gitea/forgejo/asana/zenkit
    python3 api.py importics BOARDID SWIMLANEID LISTID CALENDAR.ics # Import an iCalendar (.ics) file into a board as cards (one card per VEVENT)

        Board Member API (Issue #5998):
    python3 api.py addboardmember BOARDID USERID ROLE # Add/activate board member. ROLE: admin, normal, comment, readonly, worker, normalassignedonly, commentassignedonly, readassignedonly, nocomments
    python3 api.py removeboardmember BOARDID USERID # Remove (deactivate) board member
    python3 api.py setboardmemberrole BOARDID USERID ROLE # Change permission/role of existing board member

        Board Domain Sharing API (Issue #5850):
    python3 api.py boarddomains BOARDID # List the email domains a board is shared with
    python3 api.py addboarddomain BOARDID DOMAIN # Share board with an email domain, e.g. example.com
    python3 api.py removeboarddomain BOARDID DOMAIN # Stop sharing board with an email domain

        Card Member / Assignee API (board member -> card member/assignee):
    python3 api.py setcardmembers BOARDID LISTID CARDID MEMBERIDS # Set card members. MEMBERIDS = comma-separated userIds, or '' to clear
    python3 api.py setcardassignees BOARDID LISTID CARDID ASSIGNEEIDS # Set card assignees. ASSIGNEEIDS = comma-separated userIds, or '' to clear

        Card Dates API (Issue #5846):
    python3 api.py setcarddate BOARDID LISTID CARDID DATETYPE [DATEVALUE] # DATETYPE: received, start, due, end. DATEVALUE: ISO 8601, e.g. 2026-06-07T12:00:00.000Z. Omit DATEVALUE (or pass '') to clear the date.

        Card Labels API (Issue #5819):
    python3 api.py setcardlabels BOARDID LISTID CARDID LABELIDS # Set (replace) card labels. LABELIDS = comma-separated labelIds, or '' to clear

        Card Copy/Move API:
    python3 api.py movecard BOARDID LISTID CARDID NEWBOARDID NEWSWIMLANEID NEWLISTID # Move card to another board/swimlane/list

        Bulk Card API (Issue #4743, #5819):
    python3 api.py bulkaddcards BOARDID LISTID AUTHORID SWIMLANEID CARDSJSONFILE # Create many cards in one request. CARDSJSONFILE = JSON file with a list of titles, or a list of card objects {title,description,members,assignees,...}
    python3 api.py bulkdeletecards BOARDID CARDIDS # Delete many cards in one request. CARDIDS = comma-separated cardIds
    python3 api.py bulkcardlabels BOARDID CARDIDS ADDLABELIDS REMOVELABELIDS # Merge-add/remove labels across many cards. CARDIDS/ADDLABELIDS/REMOVELABELIDS = comma-separated, or '' for none

        Linked Card API (Issue #5897):
    python3 api.py linkcard BOARDID LISTID SWIMLANEID AUTHORID LINKEDCARDID # Create a linked card in BOARDID/LISTID that references LINKEDCARDID (may be on another board)

        Card Member/Assignee Merge API (Issue #5998):
    python3 api.py addcardmember BOARDID LISTID CARDID MEMBERID # Add one board member to a card (validated)
    python3 api.py removecardmember BOARDID LISTID CARDID MEMBERID # Remove one member from a card
    python3 api.py addcardassignee BOARDID LISTID CARDID ASSIGNEEID # Add one assignee to a card (validated)
    python3 api.py removecardassignee BOARDID LISTID CARDID ASSIGNEEID # Remove one assignee from a card

        Copy/Move Swimlane/List/Card API (position = 0-based index from top-left):
    python3 api.py copycard BOARDID LISTID CARDID TOSWIMLANEID [TOBOARDID] [TOLISTID] [POSITION] # Copy a card (deep copy)
    python3 api.py copyswimlane BOARDID SWIMLANEID [TOBOARDID] [POSITION] # Copy a swimlane (deep copy)
    python3 api.py moveswimlane BOARDID SWIMLANEID [TOBOARDID] [POSITION] # Move a swimlane
    python3 api.py copylist BOARDID LISTID TOSWIMLANEID [TOBOARDID] [POSITION] # Copy a list (deep copy)
    python3 api.py movelist BOARDID LISTID [TOSWIMLANEID] [TOBOARDID] [POSITION] # Move a list

        My Cards / Due Cards API (Issue #4815):
    python3 api.py mycards [due] [FROM] [TO] # Current user's cards. 'due' = only cards with a due date; FROM/TO = ISO 8601 due-date range

        Card Settings API (Issue #3062):
    python3 api.py getcardsettings BOARDID # Get board-level card settings (allows* toggles, cardAging, cardAgingDays1/2/3)
    python3 api.py setcardsetting BOARDID KEY VALUE # Set one board card setting, e.g. allowsDueDate true, cardAging true, cardAgingDays1 5

        Board Automation Rules API (IFTTT, Issue #2674):
    python3 api.py listrules BOARDID # List automation rules of a board
    python3 api.py getrule BOARDID RULEID # Get one rule with its trigger and action
    python3 api.py addrule BOARDID TITLE TRIGGER_JSON ACTION_JSON # Add rule. Missing trigger matching fields default to the '*' wildcard
    python3 api.py editrule BOARDID RULEID PATCH_JSON # Edit rule: {"title":..,"trigger":{..},"action":{..}}
    python3 api.py removerule BOARDID RULEID # Remove rule (and its trigger + action)
    # Example (Issue #2674) - add member when card moved TO list, remove member when moved AWAY FROM list:
    #   python3 api.py addrule BOARDID 'Add on move to Doing' '{"activityType":"moveCard","listName":"Doing"}' '{"actionType":"addMember","username":"someuser"}'
    #   python3 api.py addrule BOARDID 'Remove on move from Doing' '{"activityType":"moveCard","oldListName":"Doing"}' '{"actionType":"removeMember","username":"someuser"}'

  Admin API:
    python3 api.py newuser USERNAME EMAIL PASSWORD

        GlobalAdmin REST API (admin token required):
    python3 api.py getsettings # Get the global Admin Panel settings
    python3 api.py editsettings FIELD VALUE # Set one global settings field, e.g. productName "My WeKan", disableRegistration true
    python3 api.py admindomains # List email domains with user counts (#5850)
    python3 api.py attachmentsettings # Get attachment storage / upload-block settings (secrets masked)
    python3 api.py editattachmentsetting DOTTED.FIELD VALUE # Set one attachment setting, e.g. limitSettings.avatarsUploadBlocked true (#4740)
    python3 api.py adminorgs # List organizations with feature toggles (#4737)
    python3 api.py editorgfeature ORGID FIELD true|false # Set one org feature: orgSharedTemplates, orgPropagateMembersToBoards, orgSyncMembersFromAuth
    python3 api.py editallorgfeature FIELD true|false # Set one org feature on ALL orgs
    python3 api.py adminteams # List teams with feature toggles (#4737)
    python3 api.py editteamfeature TEAMID FIELD true|false # Set one team feature: teamSharedTemplates, teamPropagateMembersToBoards, teamSyncMembersFromAuth
    python3 api.py editallteamfeature FIELD true|false # Set one team feature on ALL teams
"""

if arguments == 0:
    print(syntax)
    exit

# TODO:
#   print("  python3 api.py attachmentjson BOARDID ATTACHMENTID # One attachment as JSON base64")
#   print("  python3 api.py attachmentbinary BOARDID ATTACHMENTID # One attachment as binary file")
#   print("  python3 api.py attachmentdownload BOARDID ATTACHMENTID # One attachment as file")
#   print("  python3 api.py attachmentsdownload BOARDID # All attachments as files")

# ------- SETTINGS START -------------

# Username is your Wekan username or email address.
# OIDC/OAuth2 etc uses email address as username.

username = 'testtest'

password = 'testtest'

wekanurl = 'http://localhost:4000/'

# ------- SETTINGS END -------------

"""
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
apiuser = 'api/user'
apiallusers = 'api/allusers'
e = 'export'
s = '/'
l = 'lists'
sw = 'swimlane'
sws = 'swimlanes'
cs = 'cards'
cf = 'custom-fields'
bs = 'boards'
apbs = 'allpublicboards'
atl = 'attachmentslist'
at = 'attachment'
ats = 'attachments'
users = wekanurl + apiusers
user = wekanurl + apiuser
allusers = wekanurl + apiallusers
settings = wekanurl + 'api/settings'

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
        settings_arg = sys.argv[6]
        # settings is optional; an empty arg -> {} (avoids json.loads('') crashing).
        settings = json.loads(settings_arg) if settings_arg.strip() else {}
        showoncard = sys.argv[7]
        automaticallyoncard = sys.argv[8]
        showlabelonminicard = sys.argv[9]
        showsumattopoflist = sys.argv[10]
        customfieldtoboard = wekanurl + apiboards + boardid + s + cf
        # Add Custom Field to Board
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'authorId': '{}'.format(authorid), 'name': '{}'.format(name), 'type': '{}'.format(type1), 'settings': json.dumps(settings), 'showoncard': '{}'.format(showoncard), 'automaticallyoncard': '{}'.format(automaticallyoncard), 'showlabelonminicard': '{}'.format(showlabelonminicard), 'showsumattopoflist': '{}'.format(showsumattopoflist)}
        body = requests.post(customfieldtoboard, data=post_data, headers=headers)
        print(body.text)
        # ------- ADD CUSTOM FIELD TO BOARD END -----------

if arguments == 8:

    if sys.argv[1] == 'addcardwithlabel':
        # ------- ADD CARD WITH LABEL START -----------
        authorid = sys.argv[2]
        boardid = sys.argv[3]
        swimlaneid = sys.argv[4]
        listid = sys.argv[5]
        cardtitle = sys.argv[6]
        carddescription = sys.argv[7]
        labelIds = sys.argv[8]  # Aggiunto labelIds

        cardtolist = wekanurl + apiboards + boardid + s + l + s + listid + s + cs
        # Add card
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {
            'authorId': '{}'.format(authorid),
            'title': '{}'.format(cardtitle),
            'description': '{}'.format(carddescription),
            'swimlaneId': '{}'.format(swimlaneid),
            'labelIds': labelIds
        }

        body = requests.post(cardtolist, data=post_data, headers=headers)
        print(body.text)

        # If ok id card
        if body.status_code == 200:
            card_data = body.json()
            new_card_id = card_data.get('_id')

            # Updating card
            if new_card_id:
                edcard = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + new_card_id
                put_data = {'labelIds': labelIds}
                body = requests.put(edcard, data=put_data, headers=headers)
                print("=== EDIT CARD ===\n")
                body = requests.get(edcard, headers=headers)
                data2 = body.text.replace('}', "}\n")
                print(data2)
            else:
                print("Error obraining ID.")
        else:
            print("Error adding card.")
        # ------- ADD CARD WITH LABEL END -----------

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

    if sys.argv[1] == 'editcustomfield':

        # ------- EDIT CUSTOMFIELD START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        customfieldid = sys.argv[5]
        newcustomfieldvalue = sys.argv[6]
        edfield = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid + s + 'customFields' + s + customfieldid
        #print(edfield)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'_id': '{}'.format(customfieldid), 'value': '{}'.format(newcustomfieldvalue)}
        #print(post_data)
        body = requests.post(edfield, data=post_data, headers=headers)
        print("=== EDIT CUSTOMFIELD ===\n")
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- EDIT CUSTOMFIELD END -----------

if arguments == 5:

    if sys.argv[1] == 'addlabel':

        # ------- EDIT CARD ADD LABEL START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        labelIds = sys.argv[5]
        edcard = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
        print(edcard)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        put_data = {'labelIds': labelIds}
        body = requests.put(edcard, data=put_data, headers=headers)
        print("=== ADD LABEL ===\n")
        body = requests.get(edcard, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- EDIT CARD ADD LABEL END -----------

    if sys.argv[1] == 'editcardcolor':
        # ------- EDIT CARD COLOR START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        newcolor = sys.argv[5]  

        valid_colors = ['white', 'green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black',
                    'silver', 'peachpuff', 'crimson', 'plum', 'darkgreen', 'slateblue', 'magenta', 'gold', 'navy',
                    'gray', 'saddlebrown', 'paleturquoise', 'mistyrose', 'indigo']

        if newcolor not in valid_colors:
            print("Invalid color. Choose a color from the list.")
            sys.exit(1)

        edcard = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
        print(edcard)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        put_data = {'color': '{}'.format(newcolor)}  
        body = requests.put(edcard, data=put_data, headers=headers)
        print("=== EDIT CARD COLOR ===\n")
        body = requests.get(edcard, headers=headers)
        data2 = body.text.replace('}', "}\n")
        print(data2)
        # ------- EDIT CARD COLOR END -----------

if arguments >= 4:

    if sys.argv[1] == 'editlist':

        # ------- EDIT LIST START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]
        newlisttitle = sys.argv[4]
        edlist = wekanurl + apiboards + boardid + s + l + s + listid
        print(edlist)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        put_data = {'title': '{}'.format(newlisttitle)}
        body = requests.put(edlist, data=put_data, headers=headers)
        print("=== EDIT LIST ===\n")
        body = requests.get(edlist, headers=headers)
        data2 = body.text.replace('}', "}\n")
        print(data2)
        # ------- EDIT LIST END -----------

    if sys.argv[1] == 'editlistcolor':

        # ------- EDIT LIST COLOR START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]
        newcolor = sys.argv[4]

        valid_colors = ['white', 'green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black',
                    'silver', 'peachpuff', 'crimson', 'plum', 'darkgreen', 'slateblue', 'magenta', 'gold', 'navy',
                    'gray', 'saddlebrown', 'paleturquoise', 'mistyrose', 'indigo']

        if newcolor not in valid_colors:
            print("Invalid color. Choose a color from the list.")
            sys.exit(1)

        edlist = wekanurl + apiboards + boardid + s + l + s + listid
        print(edlist)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        put_data = {'color': '{}'.format(newcolor)}
        body = requests.put(edlist, data=put_data, headers=headers)
        print("=== EDIT LIST COLOR ===\n")
        body = requests.get(edlist, headers=headers)
        data2 = body.text.replace('}', "}\n")
        print(data2)
        # ------- EDIT LIST COLOR END -----------

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
        
    if sys.argv[1] == 'getcard':

        # ------- LIST OF CARD START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        listone = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== INFO OF ONE LIST ===\n")
        print("URL:", listone)  # Stampa l'URL per debug
        try:
            response = requests.get(listone, headers=headers)
            print("=== RESPONSE ===\n")
            print("Status Code:", response.status_code)  # Stampa il codice di stato per debug

            if response.status_code == 200:
                data2 = response.text.replace('}', "}\n")
                print(data2)
            else:
                print(f"Error: {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"Error in the GET request: {e}")
        # ------- LISTS OF CARD END -----------

    if sys.argv[1] == 'createlabel':

        # ------- CREATE LABEL START -----------
        boardid = sys.argv[2]
        labelcolor = sys.argv[3]
        labelname = sys.argv[4]
        label_url = wekanurl + apiboards + boardid + s + 'labels'
        print(label_url)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        # Object to send
        put_data = {'label': {'color': labelcolor, 'name': labelname}}
        print("URL:", label_url)
        print("Headers:", headers)
        print("Data:", put_data)
        try:
          response = requests.put(label_url, json=put_data, headers=headers)
          print("=== CREATE LABELS ===\n")
          print("Response Status Code:", response.status_code)
          print("Response Text:", response.text)
        except Exception as e:
          print("Error:", e)
        # ------- CREATE LABEL END -----------

    if sys.argv[1] == 'addchecklist':

        # ------- ADD CHECKLIST START -----------
        board_id = sys.argv[2]
        card_id = sys.argv[3]
        checklist_title = sys.argv[4]

        # Aggiungi la checklist
        checklist_url = wekanurl + apiboards + board_id + s + cs + s + card_id + '/checklists'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        data = {'title': checklist_title}

        response = requests.post(checklist_url, data=data, headers=headers)
        response.raise_for_status()

        result = json.loads(response.text)
        checklist_id = result.get('_id')

        print(f"Checklist '{checklist_title}' created. ID: {checklist_id}")

        # Aggiungi gli items alla checklist
        items_to_add = sys.argv[5:]  
        for item_title in items_to_add:
            checklist_item_url = wekanurl + apiboards + board_id + s + cs + s + card_id + s + 'checklists' + s + checklist_id + '/items'
            item_data = {'title': item_title}

            item_response = requests.post(checklist_item_url, data=item_data, headers=headers)
            item_response.raise_for_status()

            item_result = json.loads(item_response.text)
            checklist_item_id = item_result.get('_id')

            print(f"Item '{item_title}' added. ID: {checklist_item_id}")

    if sys.argv[1] == 'checklistinfo':

        # ------- ADD CHECKLIST START -----------
        board_id = sys.argv[2]
        card_id = sys.argv[3]
        checklist_id = sys.argv[4]
        checklist_url = wekanurl + apiboards + board_id + s + cs + s + card_id + '/checklists' + s + checklist_id
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        response = requests.get(checklist_url, headers=headers)

        response.raise_for_status()

        checklist_info = response.json()
        print("Checklist Info:")
        print(checklist_info)

if arguments == 3:

    if sys.argv[1] == 'editboardtitle':

        # ------- EDIT BOARD TITLE START -----------
        boardid = sys.argv[2]
        boardtitle = sys.argv[3]
        edboardtitle = wekanurl + apiboards + boardid + s + 'title'
        print(edboardtitle)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}

        post_data = {'title': boardtitle}

        body = requests.put(edboardtitle, json=post_data, headers=headers)
        print("=== EDIT BOARD TITLE ===\n")
        #body = requests.get(edboardtitle, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        if body.status_code == 200:
            print("Succesfull!")
        else:
            print(f"Error: {body.status_code}")
            print(body.text)

        # ------- EDIT BOARD TITLE END -----------

    if sys.argv[1] == 'copyboard':

        # ------- COPY BOARD START -----------
        boardid = sys.argv[2]
        boardtitle = sys.argv[3]
        edboardcopy = wekanurl + apiboards + boardid + s + 'copy'
        print(edboardcopy)
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}

        post_data = {'title': boardtitle}

        body = requests.post(edboardcopy, json=post_data, headers=headers)
        print("=== COPY BOARD ===\n")
        #body = requests.get(edboardcopy, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        if body.status_code == 200:
            print("Succesfull!")
        else:
            print(f"Error: {body.status_code}")
            print(body.text)

        # ------- COPY BOARD END -----------

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

    if sys.argv[1] == 'cardsbyswimlane':
    # ------- RETRIEVE CARDS BY SWIMLANE ID START -----------
        boardid = sys.argv[2]
        swimlaneid = sys.argv[3]
        cardsbyswimlane = wekanurl + apiboards + boardid + s + sws + s + swimlaneid + s + cs
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== CARDS BY SWIMLANE ID ===\n")
        print("URL:", cardsbyswimlane)  # Debug
        try:
            body = requests.get(cardsbyswimlane, headers=headers)
            print("Status Code:", body.status_code)  # Debug
            data = body.text.replace('}', "}\n")
            print("Data:", data)
        except Exception as e:
            print("Error GET:", e)
    # ------- RETRIEVE CARDS BY SWIMLANE ID END -----------

    if sys.argv[1] == 'deleteallcards':
        boardid = sys.argv[2]
        swimlaneid = sys.argv[3]

        # ------- GET SWIMLANE CARDS START -----------
        get_swimlane_cards_url = wekanurl + apiboards + boardid + s + "swimlanes" + s + swimlaneid + s + "cards"
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}

        try:
            response = requests.get(get_swimlane_cards_url, headers=headers)
            response.raise_for_status()
            cards_data = response.json()

            # Print the details of each card
            for card in cards_data:
                # ------- DELETE CARD START -----------
                delete_card_url = wekanurl + apiboards + boardid + s + "lists" + s + card['listId'] + s + "cards" + s + card['_id']
                try:
                    response = requests.delete(delete_card_url, headers=headers)
                    if response.status_code == 404:
                        print(f"Card not found: {card['_id']}")
                    else:
                        response.raise_for_status()
                        deleted_card_data = response.json()
                        print(f"Card Deleted Successfully. Card ID: {deleted_card_data['_id']}")
                except requests.exceptions.RequestException as e:
                    print(f"Error deleting card: {e}")
                # ------- DELETE CARD END -----------

        except requests.exceptions.RequestException as e:
            print(f"Error getting swimlane cards: {e}")
            sys.exit(1)
        # ------- GET SWIMLANE CARDS END -----------

    if sys.argv[1] == 'get_list_cards_count':
        # ------- GET LIST CARDS COUNT START -----------
        boardid = sys.argv[2]
        listid = sys.argv[3]

        get_list_cards_count_url = wekanurl + apiboards + boardid +  s + l + s + listid + s + "cards_count"
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}

        try:
            response = requests.get(get_list_cards_count_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            print(f"List Cards Count: {data['list_cards_count']}")
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
        # ------- GET LIST CARDS COUNT END -----------

    if sys.argv[1] == 'checklistid':

        # ------- ADD CHECKLIST START -----------
        board_id = sys.argv[2]
        card_id = sys.argv[3]

        checklist_url = wekanurl + apiboards + board_id + s + cs + s + card_id + '/checklists'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        response = requests.get(checklist_url, headers=headers)

        response.raise_for_status()
        checklists = response.json()
        print("Checklists:")
        for checklist in checklists:
          print(checklist)

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

    if sys.argv[1] == 'get_board_cards_count':
        # ------- GET BOARD CARDS COUNT START -----------
        boardid = sys.argv[2]

        get_board_cards_count_url = wekanurl + apiboards + boardid + s + "cards_count"
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}

        try:
            response = requests.get(get_board_cards_count_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            print(f"Board Cards Count: {data['board_cards_count']}")
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
        # ------- GET BOARD CARDS COUNT END -----------

if arguments >= 1:

    if arguments == 1 and sys.argv[1] == 'users':

        # ------- LIST OF USERS START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print(users)
        print("=== USERS ===\n")
        body = requests.get(users, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF USERS END -----------

    if arguments == 1 and sys.argv[1] == 'getsettings':
        # ------- GET GLOBAL ADMIN SETTINGS START -----------
        # GlobalAdmin REST API: read the Admin Panel global settings.
        # Requires an admin API token. Mail-server credentials are never returned.
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print(settings)
        print("=== GLOBAL ADMIN SETTINGS ===\n")
        body = requests.get(settings, headers=headers)
        print(body.text)
        # ------- GET GLOBAL ADMIN SETTINGS END -----------

    if arguments >= 3 and sys.argv[1] == 'editsettings':
        # ------- EDIT GLOBAL ADMIN SETTINGS START -----------
        # GlobalAdmin REST API: set one Admin Panel global settings field.
        # Usage: python3 api.py editsettings <field> <value>
        #   e.g. python3 api.py editsettings productName "My WeKan"
        #        python3 api.py editsettings disableRegistration true
        headers = {'Accept': 'application/json', 'Content-type': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        field = sys.argv[2]
        raw = sys.argv[3]
        # Convert true/false to booleans; leave everything else as a string.
        if raw in ('true', 'false'):
            value = (raw == 'true')
        else:
            value = raw
        body = requests.put(settings, json={field: value}, headers=headers)
        print(body.text)
        # ------- EDIT GLOBAL ADMIN SETTINGS END -----------

    if arguments == 1 and sys.argv[1] == 'admindomains':
        # ------- LIST ADMIN DOMAINS START -----------
        # GlobalAdmin REST API: email domains with user counts (#5850).
        admindomainsurl = wekanurl + 'api/admin/domains'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== ADMIN DOMAINS ===\n")
        body = requests.get(admindomainsurl, headers=headers)
        print(body.text)
        # ------- LIST ADMIN DOMAINS END -----------

    if arguments == 1 and sys.argv[1] == 'attachmentsettings':
        # ------- GET ATTACHMENT SETTINGS START -----------
        # GlobalAdmin REST API: attachment storage / upload-block settings.
        # Secrets (S3/Azure/GCS) are masked; a <field>Set marker shows existence.
        attachmentsettingsurl = wekanurl + 'api/admin/attachment-settings'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== ATTACHMENT SETTINGS ===\n")
        body = requests.get(attachmentsettingsurl, headers=headers)
        print(body.text)
        # ------- GET ATTACHMENT SETTINGS END -----------

    if arguments >= 3 and sys.argv[1] == 'editattachmentsetting':
        # ------- EDIT ATTACHMENT SETTING START -----------
        # GlobalAdmin REST API: set one attachment setting by dotted path.
        # Usage: python3 api.py editattachmentsetting <dotted.field> <value>
        #   e.g. python3 api.py editattachmentsetting limitSettings.avatarsUploadBlocked true
        attachmentsettingsurl = wekanurl + 'api/admin/attachment-settings'
        headers = {'Accept': 'application/json', 'Content-type': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        field = sys.argv[2]
        raw = sys.argv[3]
        # Convert true/false to booleans; leave everything else as a string.
        if raw in ('true', 'false'):
            value = (raw == 'true')
        else:
            value = raw
        # Expand a dotted path (e.g. limitSettings.avatarsUploadBlocked) into
        # the nested object the partial-update endpoint expects.
        body_obj = {}
        cursor = body_obj
        parts = field.split('.')
        for part in parts[:-1]:
            cursor[part] = {}
            cursor = cursor[part]
        cursor[parts[-1]] = value
        body = requests.put(attachmentsettingsurl, json=body_obj, headers=headers)
        print(body.text)
        # ------- EDIT ATTACHMENT SETTING END -----------

    if arguments == 1 and sys.argv[1] == 'adminorgs':
        # ------- LIST ADMIN ORGS START -----------
        # GlobalAdmin REST API: orgs with feature toggles (#4737).
        adminorgsurl = wekanurl + 'api/admin/orgs'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== ADMIN ORGS ===\n")
        body = requests.get(adminorgsurl, headers=headers)
        print(body.text)
        # ------- LIST ADMIN ORGS END -----------

    if arguments >= 3 and sys.argv[1] == 'editorgfeature':
        # ------- EDIT ORG FEATURE START -----------
        # Usage: python3 api.py editorgfeature <orgId> <field> <true|false>
        #   field: orgSharedTemplates, orgPropagateMembersToBoards, orgSyncMembersFromAuth
        orgid = sys.argv[2]
        field = sys.argv[3]
        raw = sys.argv[4]
        value = (raw == 'true')
        editorgfeatureurl = wekanurl + 'api/admin/orgs/' + orgid + '/features'
        headers = {'Accept': 'application/json', 'Content-type': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.put(editorgfeatureurl, json={field: value}, headers=headers)
        print(body.text)
        # ------- EDIT ORG FEATURE END -----------

    if arguments >= 2 and sys.argv[1] == 'editallorgfeature':
        # ------- EDIT ALL ORG FEATURE START -----------
        # Usage: python3 api.py editallorgfeature <field> <true|false>
        field = sys.argv[2]
        raw = sys.argv[3]
        value = (raw == 'true')
        editallorgfeatureurl = wekanurl + 'api/admin/orgs/features'
        headers = {'Accept': 'application/json', 'Content-type': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.put(editallorgfeatureurl, json={'field': field, 'value': value}, headers=headers)
        print(body.text)
        # ------- EDIT ALL ORG FEATURE END -----------

    if arguments == 1 and sys.argv[1] == 'adminteams':
        # ------- LIST ADMIN TEAMS START -----------
        # GlobalAdmin REST API: teams with feature toggles (#4737).
        adminteamsurl = wekanurl + 'api/admin/teams'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== ADMIN TEAMS ===\n")
        body = requests.get(adminteamsurl, headers=headers)
        print(body.text)
        # ------- LIST ADMIN TEAMS END -----------

    if arguments >= 3 and sys.argv[1] == 'editteamfeature':
        # ------- EDIT TEAM FEATURE START -----------
        # Usage: python3 api.py editteamfeature <teamId> <field> <true|false>
        #   field: teamSharedTemplates, teamPropagateMembersToBoards, teamSyncMembersFromAuth
        teamid = sys.argv[2]
        field = sys.argv[3]
        raw = sys.argv[4]
        value = (raw == 'true')
        editteamfeatureurl = wekanurl + 'api/admin/teams/' + teamid + '/features'
        headers = {'Accept': 'application/json', 'Content-type': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.put(editteamfeatureurl, json={field: value}, headers=headers)
        print(body.text)
        # ------- EDIT TEAM FEATURE END -----------

    if arguments >= 2 and sys.argv[1] == 'editallteamfeature':
        # ------- EDIT ALL TEAM FEATURE START -----------
        # Usage: python3 api.py editallteamfeature <field> <true|false>
        field = sys.argv[2]
        raw = sys.argv[3]
        value = (raw == 'true')
        editallteamfeatureurl = wekanurl + 'api/admin/teams/features'
        headers = {'Accept': 'application/json', 'Content-type': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.put(editallteamfeatureurl, json={'field': field, 'value': value}, headers=headers)
        print(body.text)
        # ------- EDIT ALL TEAM FEATURE END -----------

    if arguments == 1 and sys.argv[1] == 'user':
        # ------- LIST OF ALL USERS START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print(user)
        print("=== USER ===\n")
        body = requests.get(user, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF ALL USERS END -----------

    if arguments == 1 and sys.argv[1] == 'boards':

        # ------- LIST OF PUBLIC BOARDS START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== PUBLIC BOARDS ===\n")
        listpublicboards = wekanurl + apiboards
        body = requests.get(listpublicboards, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF PUBLIC BOARDS END -----------

# ------- NEW ATTACHMENT API ENDPOINTS START -----------

    if sys.argv[1] == 'uploadattachment':
        # ------- UPLOAD ATTACHMENT START -----------
        if arguments < 6:
            print("Usage: python3 api.py uploadattachment BOARDID SWIMLANEID LISTID CARDID FILEPATH [STORAGE_BACKEND]")
            print("Storage backends: fs, gridfs, s3")
            exit(1)
        
        boardid = sys.argv[2]
        swimlaneid = sys.argv[3]
        listid = sys.argv[4]
        cardid = sys.argv[5]
        filepath = sys.argv[6]
        storage_backend = sys.argv[7] if arguments > 6 else None
        
        # Read file and convert to base64
        try:
            with open(filepath, 'rb') as f:
                file_data = f.read()
                import base64
                base64_data = base64.b64encode(file_data).decode('utf-8')
        except FileNotFoundError:
            print(f"Error: File '{filepath}' not found")
            exit(1)
        except Exception as e:
            print(f"Error reading file: {e}")
            exit(1)
        
        # Get file info
        import os
        filename = os.path.basename(filepath)
        import mimetypes
        file_type = mimetypes.guess_type(filepath)[0] or 'application/octet-stream'
        
        # Prepare request data
        upload_data = {
            'boardId': boardid,
            'swimlaneId': swimlaneid,
            'listId': listid,
            'cardId': cardid,
            'fileData': base64_data,
            'fileName': filename,
            'fileType': file_type
        }
        
        if storage_backend:
            upload_data['storageBackend'] = storage_backend
        
        # Make API call
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        upload_url = wekanurl + 'api/attachment/upload'
        
        try:
            response = requests.post(upload_url, headers=headers, json=upload_data)
            response.raise_for_status()
            result = response.json()
            print(f"Upload successful!")
            print(f"Attachment ID: {result.get('attachmentId')}")
            print(f"File: {result.get('fileName')}")
            print(f"Size: {result.get('fileSize')} bytes")
            print(f"Storage: {result.get('storageBackend')}")
        except requests.exceptions.RequestException as e:
            print(f"Upload failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
        # ------- UPLOAD ATTACHMENT END -----------

    if sys.argv[1] == 'downloadattachment':
        # ------- DOWNLOAD ATTACHMENT START -----------
        if arguments < 3:
            print("Usage: python3 api.py downloadattachment ATTACHMENTID OUTPUTPATH")
            exit(1)
        
        attachmentid = sys.argv[2]
        outputpath = sys.argv[3]
        
        # Make API call
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        download_url = wekanurl + f'api/attachment/download/{attachmentid}'
        
        try:
            response = requests.get(download_url, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                # Decode base64 data and save to file
                import base64
                file_data = base64.b64decode(result.get('base64Data'))
                
                with open(outputpath, 'wb') as f:
                    f.write(file_data)
                
                print(f"Download successful!")
                print(f"File saved to: {outputpath}")
                print(f"Original filename: {result.get('fileName')}")
                print(f"Size: {result.get('fileSize')} bytes")
                print(f"Storage: {result.get('storageBackend')}")
            else:
                print(f"Download failed: {result.get('message', 'Unknown error')}")
        except requests.exceptions.RequestException as e:
            print(f"Download failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
        # ------- DOWNLOAD ATTACHMENT END -----------

    if sys.argv[1] == 'attachmentinfo':
        # ------- ATTACHMENT INFO START -----------
        if arguments < 2:
            print("Usage: python3 api.py attachmentinfo ATTACHMENTID")
            exit(1)
        
        attachmentid = sys.argv[2]
        
        # Make API call
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        info_url = wekanurl + f'api/attachment/info/{attachmentid}'
        
        try:
            response = requests.get(info_url, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                print("=== ATTACHMENT INFO ===")
                print(f"Attachment ID: {result.get('attachmentId')}")
                print(f"File Name: {result.get('fileName')}")
                print(f"File Size: {result.get('fileSize')} bytes")
                print(f"File Type: {result.get('fileType')}")
                print(f"Storage Backend: {result.get('storageBackend')}")
                print(f"Board ID: {result.get('boardId')}")
                print(f"Swimlane ID: {result.get('swimlaneId')}")
                print(f"List ID: {result.get('listId')}")
                print(f"Card ID: {result.get('cardId')}")
                print(f"Created At: {result.get('createdAt')}")
                print(f"Is Image: {result.get('isImage')}")
                print(f"Versions: {len(result.get('versions', []))}")
            else:
                print(f"Failed to get attachment info: {result.get('message', 'Unknown error')}")
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
        # ------- ATTACHMENT INFO END -----------

    if sys.argv[1] == 'listcardattachments':
        # ------- LIST CARD ATTACHMENTS START -----------
        if arguments < 5:
            print("Usage: python3 api.py listcardattachments BOARDID SWIMLANEID LISTID CARDID")
            exit(1)
        
        boardid = sys.argv[2]
        swimlaneid = sys.argv[3]
        listid = sys.argv[4]
        cardid = sys.argv[5]
        
        # Make API call
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        list_url = wekanurl + f'api/attachment/list/{boardid}/{swimlaneid}/{listid}/{cardid}'
        
        try:
            response = requests.get(list_url, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                attachments = result.get('attachments', [])
                print(f"=== CARD ATTACHMENTS ({len(attachments)}) ===")
                for attachment in attachments:
                    print(f"ID: {attachment.get('attachmentId')}")
                    print(f"Name: {attachment.get('fileName')}")
                    print(f"Size: {attachment.get('fileSize')} bytes")
                    print(f"Type: {attachment.get('fileType')}")
                    print(f"Storage: {attachment.get('storageBackend')}")
                    print(f"Created: {attachment.get('createdAt')}")
                    print("---")
            else:
                print(f"Failed to list attachments: {result.get('message', 'Unknown error')}")
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
        # ------- LIST CARD ATTACHMENTS END -----------

    if sys.argv[1] == 'copymoveattachment':
        # ------- COPY/MOVE ATTACHMENT START -----------
        if arguments < 6:
            print("Usage: python3 api.py copymoveattachment ATTACHMENTID TARGETBOARDID TARGETSWIMLANEID TARGETLISTID TARGETCARDID [copy|move]")
            exit(1)
        
        attachmentid = sys.argv[2]
        targetboardid = sys.argv[3]
        targetswimlaneid = sys.argv[4]
        targetlistid = sys.argv[5]
        targetcardid = sys.argv[6]
        operation = sys.argv[7] if arguments > 6 else 'copy'
        
        if operation not in ['copy', 'move']:
            print("Operation must be 'copy' or 'move'")
            exit(1)
        
        # Prepare request data
        request_data = {
            'attachmentId': attachmentid,
            'targetBoardId': targetboardid,
            'targetSwimlaneId': targetswimlaneid,
            'targetListId': targetlistid,
            'targetCardId': targetcardid
        }
        
        # Make API call
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        api_url = wekanurl + f'api/attachment/{operation}'
        
        try:
            response = requests.post(api_url, headers=headers, json=request_data)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                print(f"{operation.capitalize()} successful!")
                if operation == 'copy':
                    print(f"Source Attachment ID: {result.get('sourceAttachmentId')}")
                    print(f"New Attachment ID: {result.get('newAttachmentId')}")
                else:
                    print(f"Attachment ID: {result.get('attachmentId')}")
                    print(f"Source Board: {result.get('sourceBoardId')}")
                    print(f"Target Board: {result.get('targetBoardId')}")
                print(f"File: {result.get('fileName')}")
                print(f"Size: {result.get('fileSize')} bytes")
            else:
                print(f"{operation.capitalize()} failed: {result.get('message', 'Unknown error')}")
        except requests.exceptions.RequestException as e:
            print(f"{operation.capitalize()} failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
        # ------- COPY/MOVE ATTACHMENT END -----------

    if sys.argv[1] == 'deleteattachment':
        # ------- DELETE ATTACHMENT START -----------
        if arguments < 2:
            print("Usage: python3 api.py deleteattachment ATTACHMENTID")
            exit(1)
        
        attachmentid = sys.argv[2]
        
        # Make API call
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        delete_url = wekanurl + f'api/attachment/delete/{attachmentid}'
        
        try:
            response = requests.delete(delete_url, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                print("Delete successful!")
                print(f"Attachment ID: {result.get('attachmentId')}")
                print(f"File: {result.get('fileName')}")
            else:
                print(f"Delete failed: {result.get('message', 'Unknown error')}")
        except requests.exceptions.RequestException as e:
            print(f"Delete failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
        # ------- DELETE ATTACHMENT END -----------

# ------- NEW ATTACHMENT API ENDPOINTS END -----------

# ------- BOARD MEMBER / CARD FIELD API ENDPOINTS START -----------
# These commands wrap REST endpoints that already exist in Wekan.
# See CHANGELOG.md "Upcoming" section for related issues and design notes.

    # Map a human readable ROLE to the board member permission boolean flags
    # used by /api/boards/:boardId/members/:userId/add and .../members/:memberId
    def board_role_flags(role):
        flags = {
            'isAdmin': 'false',
            'isNoComments': 'false',
            'isCommentOnly': 'false',
            'isWorker': 'false',
            'isNormalAssignedOnly': 'false',
            'isCommentAssignedOnly': 'false',
            'isReadOnly': 'false',
            'isReadAssignedOnly': 'false',
        }
        role = (role or 'normal').lower()
        rolemap = {
            'admin': 'isAdmin',
            'nocomments': 'isNoComments',
            'comment': 'isCommentOnly',
            'commentonly': 'isCommentOnly',
            'worker': 'isWorker',
            'normalassignedonly': 'isNormalAssignedOnly',
            'commentassignedonly': 'isCommentAssignedOnly',
            'readonly': 'isReadOnly',
            'readassignedonly': 'isReadAssignedOnly',
        }
        if role in ('normal', 'member'):
            return flags  # all false == Normal board member
        if role in rolemap:
            flags[rolemap[role]] = 'true'
            return flags
        print("Invalid ROLE. Valid: admin, normal, comment, readonly, worker, "
              "normalassignedonly, commentassignedonly, readassignedonly, nocomments")
        sys.exit(1)

    if sys.argv[1] == 'addboardmember':
        # ------- ADD BOARD MEMBER START -----------
        if arguments < 3:
            print("Usage: python3 api.py addboardmember BOARDID USERID ROLE")
            exit(1)
        boardid = sys.argv[2]
        userid = sys.argv[3]
        role = sys.argv[4] if arguments > 3 else 'normal'
        add_member_url = wekanurl + apiboards + boardid + s + 'members' + s + userid + s + 'add'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'action': 'add'}
        post_data.update(board_role_flags(role))
        body = requests.post(add_member_url, data=post_data, headers=headers)
        print("=== ADD BOARD MEMBER ===\n")
        print(body.text)
        # ------- ADD BOARD MEMBER END -----------

    if sys.argv[1] == 'removeboardmember':
        # ------- REMOVE BOARD MEMBER START -----------
        if arguments < 3:
            print("Usage: python3 api.py removeboardmember BOARDID USERID")
            exit(1)
        boardid = sys.argv[2]
        userid = sys.argv[3]
        remove_member_url = wekanurl + apiboards + boardid + s + 'members' + s + userid + s + 'remove'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'action': 'remove'}
        body = requests.post(remove_member_url, data=post_data, headers=headers)
        print("=== REMOVE BOARD MEMBER ===\n")
        print(body.text)
        # ------- REMOVE BOARD MEMBER END -----------

    if sys.argv[1] == 'setboardmemberrole':
        # ------- SET BOARD MEMBER ROLE START -----------
        if arguments < 4:
            print("Usage: python3 api.py setboardmemberrole BOARDID USERID ROLE")
            exit(1)
        boardid = sys.argv[2]
        userid = sys.argv[3]
        role = sys.argv[4]
        set_role_url = wekanurl + apiboards + boardid + s + 'members' + s + userid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = board_role_flags(role)
        body = requests.post(set_role_url, data=post_data, headers=headers)
        print("=== SET BOARD MEMBER ROLE ===\n")
        print(body.text)
        # ------- SET BOARD MEMBER ROLE END -----------

    if sys.argv[1] == 'boarddomains':
        # ------- LIST BOARD DOMAINS START -----------
        if arguments < 2:
            print("Usage: python3 api.py boarddomains BOARDID")
            exit(1)
        boardid = sys.argv[2]
        domains_url = wekanurl + apiboards + boardid + s + 'domains'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.get(domains_url, headers=headers)
        print("=== BOARD DOMAINS ===\n")
        print(body.text)
        # ------- LIST BOARD DOMAINS END -----------

    if sys.argv[1] == 'addboarddomain':
        # ------- ADD BOARD DOMAIN START -----------
        if arguments < 3:
            print("Usage: python3 api.py addboarddomain BOARDID DOMAIN")
            exit(1)
        boardid = sys.argv[2]
        domain = sys.argv[3]
        add_domain_url = wekanurl + apiboards + boardid + s + 'domains'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'domain': '{}'.format(domain)}
        body = requests.post(add_domain_url, data=post_data, headers=headers)
        print("=== ADD BOARD DOMAIN ===\n")
        print(body.text)
        # ------- ADD BOARD DOMAIN END -----------

    if sys.argv[1] == 'removeboarddomain':
        # ------- REMOVE BOARD DOMAIN START -----------
        if arguments < 3:
            print("Usage: python3 api.py removeboarddomain BOARDID DOMAIN")
            exit(1)
        boardid = sys.argv[2]
        domain = sys.argv[3]
        remove_domain_url = wekanurl + apiboards + boardid + s + 'domains' + s + domain
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.delete(remove_domain_url, headers=headers)
        print("=== REMOVE BOARD DOMAIN ===\n")
        print(body.text)
        # ------- REMOVE BOARD DOMAIN END -----------

    if sys.argv[1] in ('setcardmembers', 'setcardassignees'):
        # ------- SET CARD MEMBERS / ASSIGNEES START -----------
        if arguments < 4:
            print("Usage: python3 api.py {} BOARDID LISTID CARDID IDS".format(sys.argv[1]))
            print("IDS = comma-separated userIds, or '' to clear")
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        ids_raw = sys.argv[5] if arguments > 4 else ''
        ids = [x for x in ids_raw.split(',') if x] if ids_raw else []
        field = 'members' if sys.argv[1] == 'setcardmembers' else 'assignees'
        edcard = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        # Empty array clears the field; send as JSON so the array type is preserved.
        put_data = {field: ids if ids else []}
        body = requests.put(edcard, json=put_data, headers=headers)
        print("=== SET CARD {} ===\n".format(field.upper()))
        print(body.text)
        # ------- SET CARD MEMBERS / ASSIGNEES END -----------

    if sys.argv[1] == 'setcarddate':
        # ------- SET CARD DATE START -----------
        if arguments < 5:
            print("Usage: python3 api.py setcarddate BOARDID LISTID CARDID DATETYPE DATEVALUE")
            print("DATETYPE: received, start, due, end")
            print("DATEVALUE: ISO 8601, e.g. 2026-06-07T12:00:00.000Z")
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        datetype = sys.argv[5].lower()
        datevalue = sys.argv[6] if arguments > 5 else ''
        datemap = {
            'received': 'receivedAt',
            'start': 'startAt',
            'due': 'dueAt',
            'end': 'endAt',
        }
        if datetype not in datemap:
            print("Invalid DATETYPE. Valid: received, start, due, end")
            sys.exit(1)
        edcard = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        put_data = {datemap[datetype]: datevalue}
        body = requests.put(edcard, data=put_data, headers=headers)
        print("=== SET CARD DATE {} ===\n".format(datetype.upper()))
        print(body.text)
        # ------- SET CARD DATE END -----------

    if sys.argv[1] == 'setcardlabels':
        # ------- SET CARD LABELS START -----------
        if arguments < 4:
            print("Usage: python3 api.py setcardlabels BOARDID LISTID CARDID LABELIDS")
            print("LABELIDS = comma-separated labelIds, or '' to clear")
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        labelids_raw = sys.argv[5] if arguments > 4 else ''
        labelids = [x for x in labelids_raw.split(',') if x] if labelids_raw else []
        edcard = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        # NOTE: this REPLACES the card's labels. Bulk add/remove (merge) is not yet
        # implemented server-side, see Issue #5819 in CHANGELOG.md "Upcoming".
        put_data = {'labelIds': labelids if labelids else []}
        body = requests.put(edcard, json=put_data, headers=headers)
        print("=== SET CARD LABELS ===\n")
        print(body.text)
        # ------- SET CARD LABELS END -----------

    if sys.argv[1] == 'movecard':
        # ------- MOVE CARD START -----------
        if arguments < 7:
            print("Usage: python3 api.py movecard BOARDID LISTID CARDID NEWBOARDID NEWSWIMLANEID NEWLISTID")
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        newboardid = sys.argv[5]
        newswimlaneid = sys.argv[6]
        newlistid = sys.argv[7]
        edcard = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        put_data = {
            'newBoardId': newboardid,
            'newSwimlaneId': newswimlaneid,
            'newListId': newlistid,
        }
        body = requests.put(edcard, data=put_data, headers=headers)
        print("=== MOVE CARD ===\n")
        print(body.text)
        # ------- MOVE CARD END -----------

    if sys.argv[1] == 'bulkaddcards':
        # ------- BULK ADD CARDS START -----------
        if arguments < 5:
            print("Usage: python3 api.py bulkaddcards BOARDID LISTID AUTHORID SWIMLANEID CARDSJSONFILE")
            print("CARDSJSONFILE = JSON file with a list of titles, e.g. [\"Card A\", \"Card B\"],")
            print("                or a list of card objects [{\"title\": \"Card A\", \"description\": \"...\"}, ...]")
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        authorid = sys.argv[4]
        swimlaneid = sys.argv[5]
        cardsjsonfile = sys.argv[6] if arguments > 5 else None
        if not cardsjsonfile:
            print("CARDSJSONFILE is required")
            exit(1)
        try:
            with open(cardsjsonfile, 'r') as f:
                raw_cards = json.load(f)
        except Exception as e:
            print("Error reading CARDSJSONFILE: {}".format(e))
            exit(1)
        if not isinstance(raw_cards, list) or len(raw_cards) == 0:
            print("CARDSJSONFILE must contain a non-empty JSON list")
            exit(1)
        cards = []
        for item in raw_cards:
            if isinstance(item, str):
                cards.append({'title': item})
            elif isinstance(item, dict):
                cards.append(item)
            else:
                print("Each card must be a string (title) or an object")
                exit(1)
        bulk_url = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + 'bulk'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        post_data = {'authorId': authorid, 'swimlaneId': swimlaneid, 'cards': cards}
        body = requests.post(bulk_url, json=post_data, headers=headers)
        print("=== BULK ADD CARDS ===\n")
        print(body.text)
        # ------- BULK ADD CARDS END -----------

    if sys.argv[1] == 'bulkdeletecards':
        # ------- BULK DELETE CARDS START -----------
        if arguments < 3:
            print("Usage: python3 api.py bulkdeletecards BOARDID CARDIDS")
            print("CARDIDS = comma-separated cardIds")
            exit(1)
        boardid = sys.argv[2]
        cardids_raw = sys.argv[3]
        cardids = [x for x in cardids_raw.split(',') if x]
        bulk_url = wekanurl + apiboards + boardid + s + cs + s + 'bulk'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        # requests sends a body with DELETE via the json= parameter.
        body = requests.delete(bulk_url, json={'cardIds': cardids}, headers=headers)
        print("=== BULK DELETE CARDS ===\n")
        print(body.text)
        # ------- BULK DELETE CARDS END -----------

    if sys.argv[1] == 'bulkcardlabels':
        # ------- BULK CARD LABELS START -----------
        if arguments < 5:
            print("Usage: python3 api.py bulkcardlabels BOARDID CARDIDS ADDLABELIDS REMOVELABELIDS")
            print("CARDIDS / ADDLABELIDS / REMOVELABELIDS = comma-separated, or '' for none")
            exit(1)
        boardid = sys.argv[2]
        cardids = [x for x in sys.argv[3].split(',') if x]
        add_labelids = [x for x in sys.argv[4].split(',') if x]
        remove_labelids = [x for x in sys.argv[5].split(',') if x]
        bulk_url = wekanurl + apiboards + boardid + s + cs + s + 'labels'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        post_data = {'cardIds': cardids, 'addLabelIds': add_labelids, 'removeLabelIds': remove_labelids}
        body = requests.post(bulk_url, json=post_data, headers=headers)
        print("=== BULK CARD LABELS ===\n")
        print(body.text)
        # ------- BULK CARD LABELS END -----------

    if sys.argv[1] == 'linkcard':
        # ------- CREATE LINKED CARD START -----------
        if arguments < 6:
            print("Usage: python3 api.py linkcard BOARDID LISTID SWIMLANEID AUTHORID LINKEDCARDID")
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        swimlaneid = sys.argv[4]
        authorid = sys.argv[5]
        linkedcardid = sys.argv[6]
        link_url = wekanurl + apiboards + boardid + s + l + s + listid + s + cs
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        post_data = {'authorId': authorid, 'swimlaneId': swimlaneid, 'linkedId': linkedcardid}
        body = requests.post(link_url, data=post_data, headers=headers)
        print("=== CREATE LINKED CARD ===\n")
        print(body.text)
        # ------- CREATE LINKED CARD END -----------

    if sys.argv[1] in ('addcardmember', 'removecardmember', 'addcardassignee', 'removecardassignee'):
        # ------- ADD/REMOVE CARD MEMBER / ASSIGNEE START -----------
        if arguments < 5:
            print("Usage: python3 api.py {} BOARDID LISTID CARDID USERID".format(sys.argv[1]))
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        userid = sys.argv[5]
        field = 'members' if 'member' in sys.argv[1] else 'assignees'
        url = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid + s + field + s + userid
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        if sys.argv[1].startswith('add'):
            body = requests.post(url, headers=headers)
        else:
            body = requests.delete(url, headers=headers)
        print("=== {} ===\n".format(sys.argv[1].upper()))
        print(body.text)
        # ------- ADD/REMOVE CARD MEMBER / ASSIGNEE END -----------

    if sys.argv[1] == 'copycard':
        # ------- COPY CARD START -----------
        if arguments < 4:
            print("Usage: python3 api.py copycard BOARDID LISTID CARDID TOSWIMLANEID [TOBOARDID] [TOLISTID] [POSITION]")
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        cardid = sys.argv[4]
        toswimlaneid = sys.argv[5] if arguments > 4 else None
        if not toswimlaneid:
            print("TOSWIMLANEID is required")
            exit(1)
        toboardid = sys.argv[6] if arguments > 5 else boardid
        tolistid = sys.argv[7] if arguments > 6 else listid
        url = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid + s + 'copy'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        post_data = {'toBoardId': toboardid, 'toSwimlaneId': toswimlaneid, 'toListId': tolistid}
        if arguments > 7:
            post_data['position'] = int(sys.argv[8])
        body = requests.post(url, json=post_data, headers=headers)
        print("=== COPY CARD ===\n")
        print(body.text)
        # ------- COPY CARD END -----------

    if sys.argv[1] in ('copyswimlane', 'moveswimlane'):
        # ------- COPY/MOVE SWIMLANE START -----------
        if arguments < 3:
            print("Usage: python3 api.py {} BOARDID SWIMLANEID [TOBOARDID] [POSITION]".format(sys.argv[1]))
            exit(1)
        boardid = sys.argv[2]
        swimlaneid = sys.argv[3]
        toboardid = sys.argv[4] if arguments > 3 else boardid
        action = 'copy' if sys.argv[1] == 'copyswimlane' else 'move'
        url = wekanurl + apiboards + boardid + s + sws + s + swimlaneid + s + action
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        post_data = {'toBoardId': toboardid}
        if arguments > 4:
            post_data['position'] = int(sys.argv[5])
        body = requests.post(url, json=post_data, headers=headers)
        print("=== {} ===\n".format(sys.argv[1].upper()))
        print(body.text)
        # ------- COPY/MOVE SWIMLANE END -----------

    if sys.argv[1] in ('copylist', 'movelist'):
        # ------- COPY/MOVE LIST START -----------
        if arguments < 3:
            print("Usage: python3 api.py {} BOARDID LISTID [TOSWIMLANEID] [TOBOARDID] [POSITION]".format(sys.argv[1]))
            exit(1)
        boardid = sys.argv[2]
        listid = sys.argv[3]
        toswimlaneid = sys.argv[4] if arguments > 3 else None
        toboardid = sys.argv[5] if arguments > 4 else boardid
        action = 'copy' if sys.argv[1] == 'copylist' else 'move'
        url = wekanurl + apiboards + boardid + s + l + s + listid + s + action
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        post_data = {'toBoardId': toboardid}
        if toswimlaneid:
            post_data['toSwimlaneId'] = toswimlaneid
        if arguments > 5:
            post_data['position'] = int(sys.argv[6])
        body = requests.post(url, json=post_data, headers=headers)
        print("=== {} ===\n".format(sys.argv[1].upper()))
        print(body.text)
        # ------- COPY/MOVE LIST END -----------

    if sys.argv[1] == 'mycards':
        # ------- MY CARDS / DUE CARDS START -----------
        params = {}
        if arguments >= 2 and sys.argv[2].lower() == 'due':
            params['due'] = 'true'
        if arguments >= 3:
            params['from'] = sys.argv[3]
        if arguments >= 4:
            params['to'] = sys.argv[4]
        url = wekanurl + 'api/user/cards'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.get(url, headers=headers, params=params)
        print("=== MY CARDS ===\n")
        data2 = body.text.replace('}', "}\n")
        print(data2)
        # ------- MY CARDS / DUE CARDS END -----------

    if sys.argv[1] == 'getcardsettings':
        # ------- GET CARD SETTINGS START -----------
        if arguments < 2:
            print("Usage: python3 api.py getcardsettings BOARDID")
            exit(1)
        boardid = sys.argv[2]
        url = wekanurl + apiboards + boardid + s + 'cardSettings'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        body = requests.get(url, headers=headers)
        print("=== CARD SETTINGS ===\n")
        data2 = body.text.replace(',', ",\n")
        print(data2)
        # ------- GET CARD SETTINGS END -----------

    if sys.argv[1] == 'setcardsetting':
        # ------- SET CARD SETTING START -----------
        if arguments < 4:
            print("Usage: python3 api.py setcardsetting BOARDID KEY VALUE")
            print("e.g. python3 api.py setcardsetting BOARDID allowsDueDate true")
            exit(1)
        boardid = sys.argv[2]
        key = sys.argv[3]
        value = sys.argv[4]
        url = wekanurl + apiboards + boardid + s + 'cardSettings'
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
        body = requests.put(url, json={key: value}, headers=headers)
        print("=== SET CARD SETTING ===\n")
        print(body.text)
        # ------- SET CARD SETTING END -----------

# ------- BOARD MEMBER / CARD FIELD API ENDPOINTS END -----------

# ------- RULES API ENDPOINTS START -----------
#
# Board automation Rules: add / edit / remove / list via REST.
# A rule links a trigger (event or schedule) to an action. The API embeds the
# full trigger and action inline so a rule is self-contained.
#
#   python3 api.py listrules BOARDID
#   python3 api.py getrule BOARDID RULEID
#   python3 api.py addrule BOARDID 'TITLE' 'TRIGGER_JSON' 'ACTION_JSON'
#   python3 api.py editrule BOARDID RULEID 'PATCH_JSON'   # {"title":..,"trigger":{..},"action":{..}}
#   python3 api.py removerule BOARDID RULEID
#
# Example (move a card to the top of its list whenever it is created):
#   python3 api.py addrule BOARDID 'On create -> top' \
#     '{"activityType":"createCard","listName":"*","swimlaneName":"*","cardTitle":"*","userId":"*"}' \
#     '{"actionType":"moveCardToTop","listName":"*","swimlaneName":"*"}'
#
# Example (archive cards that have sat in "Completed" for 90 days; the scheduled
# scan runs this daily):
#   python3 api.py addrule BOARDID 'Archive after 90 days' \
#     '{"activityType":"scheduledTrigger","scheduleKind":"aging","listName":"Completed","days":90,"atTime":"03:00"}' \
#     '{"actionType":"archive"}'
#
# Example (Issue #2674 - add a user to the card when it is moved TO a list, and
# remove the user again when the card is moved AWAY FROM that list). Trigger
# matching fields that are omitted (userId, swimlaneName, cardTitle, and the
# unused one of listName/oldListName) are stored as the '*' wildcard by the
# server, so the rules fire for any user/swimlane/card title:
#   python3 api.py addrule BOARDID 'Add member on move to Doing' \
#     '{"activityType":"moveCard","listName":"Doing"}' \
#     '{"actionType":"addMember","username":"someuser"}'
#   python3 api.py addrule BOARDID 'Remove member on move from Doing' \
#     '{"activityType":"moveCard","oldListName":"Doing"}' \
#     '{"actionType":"removeMember","username":"someuser"}'

if arguments >= 2 and sys.argv[1] == 'listrules':
    boardid = sys.argv[2]
    url = wekanurl + apiboards + boardid + s + 'rules'
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
    body = requests.get(url, headers=headers)
    print(body.text)

if arguments >= 3 and sys.argv[1] == 'getrule':
    boardid = sys.argv[2]
    ruleid = sys.argv[3]
    url = wekanurl + apiboards + boardid + s + 'rules' + s + ruleid
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
    body = requests.get(url, headers=headers)
    print(body.text)

if arguments >= 3 and sys.argv[1] == 'removerule':
    boardid = sys.argv[2]
    ruleid = sys.argv[3]
    url = wekanurl + apiboards + boardid + s + 'rules' + s + ruleid
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
    body = requests.delete(url, headers=headers)
    print(body.text)

if arguments >= 5 and sys.argv[1] == 'addrule':
    boardid = sys.argv[2]
    title = sys.argv[3]
    trigger = json.loads(sys.argv[4])
    action = json.loads(sys.argv[5])
    url = wekanurl + apiboards + boardid + s + 'rules'
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    body = requests.post(url, json={'title': title, 'trigger': trigger, 'action': action}, headers=headers)
    print(body.text)

if arguments >= 4 and sys.argv[1] == 'editrule':
    boardid = sys.argv[2]
    ruleid = sys.argv[3]
    patch = json.loads(sys.argv[4])
    url = wekanurl + apiboards + boardid + s + 'rules' + s + ruleid
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    body = requests.put(url, json=patch, headers=headers)
    print(body.text)

# ------- RULES API ENDPOINTS END -----------

# ------- CARD DEPENDENCIES ("RED STRINGS") API START -----------
#
# Typed card-to-card dependencies, visualized on the board as colored connection
# lines (SAFe PI-planning "Red Strings"). Each line has:
#   type  : related-to | blocks | is-blocked-by | fixes | is-fixed-by
#   color : any CSS color, e.g. "#eb144c"
#   icon  : a FontAwesome 4.7 icon name without the "fa-" prefix, e.g. "link"
#
#   python3 api.py listdependencies BOARDID
#   python3 api.py listcarddependencies BOARDID CARDID
#   python3 api.py adddependency BOARDID CARDID TARGETCARDID [TYPE] [COLOR] [ICON]
#   python3 api.py editdependency BOARDID CARDID TARGETCARDID 'PATCH_JSON'  # {"type":..,"color":..,"icon":..}
#   python3 api.py removedependency BOARDID CARDID TARGETCARDID
#
# Example (card A "blocks" card B, drawn as a thick blue arrow):
#   python3 api.py adddependency BOARDID CARDA CARDB blocks '#2196f3' lock

if arguments >= 2 and sys.argv[1] == 'listdependencies':
    boardid = sys.argv[2]
    url = wekanurl + apiboards + boardid + s + 'dependencies'
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
    body = requests.get(url, headers=headers)
    print(body.text)

if arguments >= 3 and sys.argv[1] == 'listcarddependencies':
    boardid = sys.argv[2]
    cardid = sys.argv[3]
    url = wekanurl + apiboards + boardid + s + 'cards' + s + cardid + s + 'dependencies'
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
    body = requests.get(url, headers=headers)
    print(body.text)

if arguments >= 4 and sys.argv[1] == 'adddependency':
    boardid = sys.argv[2]
    cardid = sys.argv[3]
    targetcardid = sys.argv[4]
    payload = {'cardId': targetcardid}
    if arguments >= 5:
        payload['type'] = sys.argv[5]
    if arguments >= 6:
        payload['color'] = sys.argv[6]
    if arguments >= 7:
        payload['icon'] = sys.argv[7]
    url = wekanurl + apiboards + boardid + s + 'cards' + s + cardid + s + 'dependencies'
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    body = requests.post(url, json=payload, headers=headers)
    print(body.text)

if arguments >= 5 and sys.argv[1] == 'editdependency':
    boardid = sys.argv[2]
    cardid = sys.argv[3]
    targetcardid = sys.argv[4]
    patch = json.loads(sys.argv[5])
    url = wekanurl + apiboards + boardid + s + 'cards' + s + cardid + s + 'dependencies' + s + targetcardid
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    body = requests.put(url, json=patch, headers=headers)
    print(body.text)

if arguments >= 4 and sys.argv[1] == 'removedependency':
    boardid = sys.argv[2]
    cardid = sys.argv[3]
    targetcardid = sys.argv[4]
    url = wekanurl + apiboards + boardid + s + 'cards' + s + cardid + s + 'dependencies' + s + targetcardid
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
    body = requests.delete(url, headers=headers)
    print(body.text)

# ------- CARD DEPENDENCIES ("RED STRINGS") API END -----------

# ------- CARD STICKERS / LOCATIONS / COMPLETE START -----------
#
# These card fields are set through the card edit endpoint
# (PUT /api/boards/:boardId/lists/:listId/cards/:cardId):
#
#   python3 api.py setcardcomplete BOARDID LISTID CARDID true
#   python3 api.py setcardstickers BOARDID LISTID CARDID '[{"icon":"taco-cool"}]'
#   python3 api.py setcardlocations BOARDID LISTID CARDID \
#     '[{"name":"HQ","address":"Helsinki","latitude":60.17,"longitude":24.94}]'

if arguments >= 5 and sys.argv[1] == 'setcardcomplete':
    boardid = sys.argv[2]
    listid = sys.argv[3]
    cardid = sys.argv[4]
    dueComplete = sys.argv[5]
    url = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    body = requests.put(url, json={'dueComplete': dueComplete}, headers=headers)
    print(body.text)

if arguments >= 5 and sys.argv[1] == 'setcardstickers':
    boardid = sys.argv[2]
    listid = sys.argv[3]
    cardid = sys.argv[4]
    stickers = json.loads(sys.argv[5])
    url = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    body = requests.put(url, json={'stickers': stickers}, headers=headers)
    print(body.text)

if arguments >= 5 and sys.argv[1] == 'setcardlocations':
    boardid = sys.argv[2]
    listid = sys.argv[3]
    cardid = sys.argv[4]
    locations = json.loads(sys.argv[5])
    url = wekanurl + apiboards + boardid + s + l + s + listid + s + cs + s + cardid
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    body = requests.put(url, json={'locations': locations}, headers=headers)
    print(body.text)

# ------- CARD STICKERS / LOCATIONS / COMPLETE END -----------

# ------- BOARD BACKGROUND IMAGE UPLOAD / DOWNLOAD START -----------
#
# Upload/download a board background image. This is the background counterpart
# of the "upload attachment to board" API; the upload stores a board-level
# attachment using the current Admin Panel / Attachments / Default Storage and
# sets it as the board's active background (board admin required).
#
#   python3 api.py uploadbackground BOARDID FILEPATH
#   python3 api.py downloadbackground BOARDID OUTPUTPATH

if arguments >= 3 and sys.argv[1] == 'uploadbackground':
    boardid = sys.argv[2]
    filepath = sys.argv[3]
    import base64, os, mimetypes
    try:
        with open(filepath, 'rb') as f:
            base64_data = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        print(f"Error reading file: {e}")
        exit(1)
    upload_data = {
        'boardId': boardid,
        'fileData': base64_data,
        'fileName': os.path.basename(filepath),
        'fileType': mimetypes.guess_type(filepath)[0] or 'image/png',
    }
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    url = wekanurl + 'api/attachment/upload-background'
    response = requests.post(url, headers=headers, json=upload_data)
    print(response.text)

if arguments >= 3 and sys.argv[1] == 'downloadbackground':
    boardid = sys.argv[2]
    outputpath = sys.argv[3]
    import base64
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
    url = wekanurl + f'api/attachment/download-background/{boardid}'
    response = requests.get(url, headers=headers)
    result = response.json()
    if result.get('success'):
        with open(outputpath, 'wb') as f:
            f.write(base64.b64decode(result.get('base64Data')))
        print(f"Background saved to: {outputpath}")
        print(f"Original filename: {result.get('fileName')}")
        print(f"Storage: {result.get('storageBackend')}")
    else:
        print(f"Download failed: {result}")

# ------- BOARD BACKGROUND IMAGE UPLOAD / DOWNLOAD END -----------

# ------- IMPORT BOARD / MIGRATE FROM ANOTHER WEKAN START -----------
#
# Import a whole board WITH its workflows (rules/triggers/actions) and other data
# from a WeKan board export, or migrate ALL boards from another WeKan instance
# over the REST API.
#
#   python3 api.py importboard EXPORT.json        # import one exported board (with rules)
#   python3 api.py migratefromwekan REMOTE_URL REMOTE_USER REMOTE_PASS  # import all boards+workflows+rules

if arguments >= 2 and sys.argv[1] == 'importboard':
    filepath = sys.argv[2]
    with open(filepath) as f:
        board = json.load(f)
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    response = requests.post(wekanurl + 'api/boards/import', headers=headers, json={'board': board})
    print(response.text)

if arguments >= 4 and sys.argv[1] == 'migratefromwekan':
    remote = sys.argv[2].rstrip('/') + '/'
    remote_user = sys.argv[3]
    remote_pass = sys.argv[4]
    # 1) Log in to the remote WeKan to get its token + user id.
    rlogin = requests.post(remote + 'users/login', json={'username': remote_user, 'password': remote_pass}).json()
    rtoken = rlogin['token']
    ruid = rlogin['id']
    rheaders = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(rtoken)}
    lheaders = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    # 2) List the remote user's boards.
    boards = requests.get(remote + 'api/users/{}/boards'.format(ruid), headers=rheaders).json()
    print('Found {} board(s) on remote WeKan.'.format(len(boards)))
    # 3) Export each remote board (full JSON incl. rules/workflows) and import locally.
    for b in boards:
        bid = b.get('_id') or b.get('id')
        if not bid:
            continue
        export = requests.get(remote + 'api/boards/{}/export'.format(bid), headers=rheaders).json()
        resp = requests.post(wekanurl + 'api/boards/import', headers=lheaders, json={'board': export})
        print('{}: HTTP {} {}'.format(b.get('title', bid), resp.status_code, resp.text[:160]))

# ------- IMPORT BOARD / MIGRATE FROM ANOTHER WEKAN END -----------

# ------- EXPORT BOARD TO PDF START -----------
#
#   python3 api.py exportboardpdf BOARDID OUTPUT.pdf

if arguments >= 3 and sys.argv[1] == 'exportboardpdf':
    boardid = sys.argv[2]
    outputpath = sys.argv[3]
    headers = {'Authorization': 'Bearer {}'.format(apikey)}
    url = wekanurl + apiboards + boardid + s + 'exportPDF'
    response = requests.get(url, headers=headers)
    with open(outputpath, 'wb') as f:
        f.write(response.content)
    print('Board PDF saved to: {}'.format(outputpath))

# ------- EXPORT BOARD TO PDF END -----------

# ------- IMPORT/EXPORT TO OTHER TOOLS START -----------
#
# Generalized import from another tool's export, and export to another tool's
# JSON shape. Sources/formats: trello, wekan, csv, jira, kanboard, excel, deck,
# openproject, github, gitlab, gitea, forgejo.
#
#   python3 api.py importboardfrom SOURCE EXPORT.json   # e.g. github issues.json  (SOURCE = deck/openproject/github/gitlab/gitea/forgejo/asana/zenkit/trello/jira/kanboard/csv/excel/wekan)
#   python3 api.py exportboardformat BOARDID FORMAT OUTPUT.json  # FORMAT = trello/jira/deck/openproject/github/gitlab/gitea/forgejo/asana/zenkit/kanboard

if arguments >= 3 and sys.argv[1] == 'importboardfrom':
    source = sys.argv[2]
    filepath = sys.argv[3]
    with open(filepath) as f:
        board = json.load(f)
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    url = wekanurl + apiboards + 'import/' + source
    response = requests.post(url, headers=headers, json={'board': board})
    print(response.text)

if arguments >= 4 and sys.argv[1] == 'exportboardformat':
    boardid = sys.argv[2]
    fmt = sys.argv[3]
    outputpath = sys.argv[4]
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
    url = wekanurl + apiboards + boardid + s + 'export' + s + fmt
    response = requests.get(url, headers=headers)
    with open(outputpath, 'w') as f:
        f.write(response.text)
    print('Board exported ({}) to: {}'.format(fmt, outputpath))

if arguments >= 5 and sys.argv[1] == 'importics':
    # Usage: python3 api.py importics BOARDID SWIMLANEID LISTID CALENDAR.ics
    # Imports an iCalendar (.ics) file into the board: one card is created per
    # VEVENT, with startAt (DTSTART) and dueAt (DTEND, or DTSTART when there is
    # no DTEND), so the events appear on the Calendar / Gantt views (issue #6323).
    boardid = sys.argv[2]
    swimlaneid = sys.argv[3]
    listid = sys.argv[4]
    icspath = sys.argv[5]
    with open(icspath) as f:
        ics_text = f.read()
    headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey), 'Content-Type': 'application/json'}
    url = wekanurl + apiboards + boardid + s + 'swimlanes' + s + swimlaneid + s + l + s + listid + s + 'ics'
    response = requests.post(url, headers=headers, json={'ics': ics_text})
    # Response: { "created": <n>, "cardIds": [ ... ] }
    print(response.text)

# ------- IMPORT/EXPORT TO OTHER TOOLS END -----------
