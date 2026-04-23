#! /usr/bin/env python3
# -*- coding: utf-8 -*-
# vi:ts=4:et

# Trello API Python CLI
# License: MIT / WeKan Team

try:
    # python 3
    from urllib.parse import urlencode
    from urllib.request import urlretrieve
except ImportError:
    # python 2
    from urllib import urlencode

import json
import requests
import sys

# ------- TODO START -------------
#
# - Check nested resources about how to recursively get all reactins etc:
#   https://developer.atlassian.com/cloud/trello/guides/rest-api/nested-resources/
# - Add checking status codes and stop/delay if errors in API.
#   If board is big, instead get small amount of board with paging of Trello REST API,
#   then have small delay, and then get more of that big amount of data, so that
#   there would not be timeouts with too much data
#   https://developer.atlassian.com/cloud/trello/guides/rest-api/status-codes/
# - Add batch requests, to get enough data at once:
#   https://developer.atlassian.com/cloud/trello/rest/api-group-batch/#api-batch-get
# - Add rate limits with delays:
#   https://developer.atlassian.com/cloud/trello/guides/rest-api/rate-limits/
# - Use webhooks to receive data from Trello to WeKan, so that there would not be
#   need to repeatedly get same data again (no polling data), but instead get
#   changes pushed to WeKan with webhooks when they happen
#   https://developer.atlassian.com/cloud/trello/guides/rest-api/webhooks/
#   https://developer.atlassian.com/cloud/trello/rest/api-group-webhooks/#api-webhooks-post
#
# ------- TODO END -------------



# ------- TRELLO SETTINGS START -------------
#
# READ ABOVE TODO FIRST, BE CAREFUL WITH RATE LIMITS ETC.
#
# Keys and tokens:
# - See API introduction:
#   https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/
# - Get developer API key and create token at top of https://trello.com/app-key
#
key = 'TRELLO-API-KEY-HERE'
token = 'TRELLO-API-TOKEN-HERE'
#
# ------- TRELLO SETTINGS END -------------


arguments = len(sys.argv) - 1

if arguments == 0:
    print("=== Trello API Python CLI ===")
    print("License: MIT / WeKan Team")
    print("See settings in this api.py script for api key and token.")
    print("If *nix:  chmod +x api.py => ./api.py users")
    print("Syntax:")
    print("  python3 api.py emoji                  # List all available emoji")
    print("  python3 api.py boards                 # List All Boards")
    print("  python3 api.py board BOARDID          # Info of BOARDID")
    print("  python3 api.py card CARDID            # Info of CARDID")
    print("  python3 api.py actions BOARDID        # Actions of BOARDID")
    print("  python3 api.py reactions ACTIONID     # Reactions of ACTIONID")
    print("  python3 api.py attachments CARDID     # List attachments of CARDID")
    print("  python3 api.py download ATTACHMENTURL # Download file from attachment URL like https://.../image.png with streaming and minimal RAM usage")
    exit

if arguments == 2:

    if sys.argv[1] == 'board':

        # ------- BOARD START -----------
        #headers = {'Accept': 'application/json', 'Authorization': 'Bearer {}'.format(apikey)}
        headers = {'Accept': 'application/json'}
        boardid = sys.argv[2]
        print("=== ONE BOARD ===\n")
        listboard = 'https://api.trello.com/1/boards/' + boardid + '?key=' + key + '&token=' + token
        body = requests.get(listboard, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- BOARD END -----------

    if sys.argv[1] == 'card':

        # ------- CARD START -----------
        headers = {'Accept': 'application/json'}
        cardid = sys.argv[2]
        print("=== ONE CARD ===\n")
        listcard = 'https://api.trello.com/1/cards/' + cardid + '?fields=all&key=' + key + '&token=' + token
        body = requests.get(listcard, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- BOARD END -----------

    if sys.argv[1] == 'actions':

        # ------- BOARD ACTIONS START -----------
        headers = {'Accept': 'application/json'}
        boardid = sys.argv[2]
        print("=== ONE BOARD ACTIONS ===\n")
        listboardactions = 'https://api.trello.com/1/boards/' + boardid + '/actions?key=' + key + '&token=' + token
        body = requests.get(listboardactions, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- BOARD ACTIONS END -----------

    if sys.argv[1] == 'reactions':

        # ------- REACTIONS OF ACTIONID START -----------
        headers = {'Accept': 'application/json'}
        actionid = sys.argv[2]
        print("=== REACTIONS OF ACTIONID ===\n")
        listreactions = 'https://api.trello.com/1/actions/' + actionid + '/reactionsSummary?key=' + key + '&token=' + token
        body = requests.get(listreactions, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- REACTIONS OF ACTIONID END -----------

    if sys.argv[1] == 'attachments':

        # ------- LIST CARD ATTACHMENTS START -----------
        headers = {'Accept': 'application/json'}
        cardid = sys.argv[2]
        print("=== LIST CARD ATTACHMENTS ===\n")
        listcardattachments = 'https://api.trello.com/1/cards/' + cardid + '/attachments?key=' + key + '&token=' + token
        body = requests.get(listcardattachments, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST CARD ATTACHMENTS END -----------

    if sys.argv[1] == 'download':

        # ------- DOWNLOAD BOARD ATTACHMENT START -----------
        headers = {'Accept': 'application/json', 'Authorization': 'OAuth oauth_consumer_key="' + key + '", oauth_token="' + token + '"'}
        url = sys.argv[2]
        print("=== DOWNLOAD BOARD ATTACHMENT ===\n")
        local_filename = url.split('/')[-1]
        # NOTE the stream=True parameter below. Does streaming download with minimal RAM usage.
        with requests.get(url, stream=True, headers=headers) as r:
            r.raise_for_status()
            with open(local_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    # If you have chunk encoded response uncomment if
                    # and set chunk_size parameter to None.
                    #if chunk:
                    f.write(chunk)
        print("filename: " + local_filename + "\n")
        # ------- DOWNLOAD BOARD ATTACHMENT END -----------

if arguments == 1:

    if sys.argv[1] == 'boards':

        # ------- LIST OF BOARDS START -----------
        headers = {'Accept': 'application/json'}
        print("=== BOARDS ===\n")
        listboards = 'https://api.trello.com/1/members/me/boards?key=' + key + '&token=' + token
        body = requests.get(listboards, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF BOARDS END -----------

    if sys.argv[1] == 'emoji':

        # ------- LIST OF EMOJI START -----------
        headers = {'Accept': 'application/json'}
        print("=== LIST OF ALL EMOJI ===\n")
        listemoji = 'https://api.trello.com/1/emoji?key=' + key + '&token=' + token
        body = requests.get(listemoji, headers=headers)
        data2 = body.text.replace('}',"}\n")
        print(data2)
        # ------- LIST OF EMOJI END -----------
