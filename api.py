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
    python3 api.py boards USERID        # Boards of USERID
    python3 api.py swimlanes BOARDID    # Swimlanes of BOARDID
    python3 api.py lists BOARDID        # Lists of BOARDID
    python3 api.py list BOARDID LISTID  # Info of LISTID
    python3 api.py createlist BOARDID LISTTITLE # Create list
    python3 api.py addcard AUTHORID BOARDID SWIMLANEID LISTID CARDTITLE CARDDESCRIPTION
    python3 api.py editcard BOARDID LISTID CARDID NEWCARDTITLE NEWCARDDESCRIPTION
    python3 api.py customfields BOARDID # Custom Fields of BOARDID
    python3 api.py customfield BOARDID CUSTOMFIELDID # Info of CUSTOMFIELDID
    python3 api.py addcustomfieldtoboard AUTHORID BOARDID NAME TYPE SETTINGS SHOWONCARD AUTOMATICALLYONCARD SHOWLABELONMINICARD SHOWSUMATTOPOFLIST # Add Custom Field to Board
    python3 api.py editcustomfield BOARDID LISTID CARDID CUSTOMFIELDID NEWCUSTOMFIELDVALUE # Edit Custom Field
    python3 api.py listattachments BOARDID # List attachments
    python3 api.py cardsbyswimlane SWIMLANEID LISTID # Retrieve cards list on a swimlane
    python3 api.py getcard BOARDID LISTID CARDID # Get card info
    python3 api.py addlabel BOARDID LISTID CARDID LABELID # Add label to a card
    python3 api.py addcardwithlabel AUTHORID BOARDID SWIMLANEID LISTID CARDTITLE CARDDESCRIPTION LABELIDS # Add a card and a label
    python3 api.py editboardtitle BOARDID NEWBOARDTITLE # Edit board title
    python3 api.py copyboard BOARDID NEWBOARDTITLE # Copy a board
    python3 api.py createlabel BOARDID LABELCOLOR LABELNAME (Color available: `white`, `green`, `yellow`, `orange`, `red`, `purple`, `blue`, `sky`, `lime`, `pink`, `black`, `silver`, `peachpuff`, `crimson`, `plum`, `darkgreen`, `slateblue`, `magenta`, `gold`, `navy`, `gray`, `saddlebrown`, `paleturquoise`, `mistyrose`, `indigo`) # Create a new label
    python3 api.py editcardcolor BOARDID LISTID CARDID COLOR (Color available: `white`, `green`, `yellow`, `orange`, `red`, `purple`, `blue`, `sky`, `lime`, `pink`, `black`, `silver`, `peachpuff`, `crimson`, `plum`, `darkgreen`, `slateblue`, `magenta`, `gold`, `navy`, `gray`, `saddlebrown`, `paleturquoise`, `mistyrose`, `indigo`) # Edit card color
    python3 api.py addchecklist BOARDID CARDID TITLE ITEM1 ITEM2 ITEM3 ITEM4 (You can add multiple items or just one, or also without any item, just TITLE works as well. * If items or Title contains spaces, you should add ' between them.) # Add checklist + item on a card
    python3 api.py deleteallcards BOARDID SWIMLANEID ( * Be careful will delete ALL CARDS INSIDE the swimlanes automatically in every list * ) # Delete all cards on a swimlane
    python3 api.py checklistid BOARDID CARDID # Retrieve Checklist ID attached to a card
    python3 api.py checklistinfo BOARDID CARDID CHECKLISTID # Get checklist info
    python3 api.py get_list_cards_count BOARDID LISTID # Retrieve how many cards in a list
    python3 api.py get_board_cards_count BOARDID # Retrieve how many cards in a board

    
  Admin API:
    python3 api.py users                # All users
    python3 api.py boards               # All Public Boards
    python3 api.py newuser USERNAME EMAIL PASSWORD
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

    if sys.argv[1] == 'user':
        # ------- LIST OF ALL USERS START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print(user)
        print("=== USER ===\n")
        body = requests.get(user, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF ALL USERS END -----------

    if sys.argv[1] == 'boards':

        # ------- LIST OF PUBLIC BOARDS START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        print("=== PUBLIC BOARDS ===\n")
        listpublicboards = wekanurl + apiboards
        body = requests.get(listpublicboards, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF PUBLIC BOARDS END -----------
