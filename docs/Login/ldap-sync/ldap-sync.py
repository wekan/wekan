#!/usr/bin/env python3

# ChangeLog
# ---------
# 2022-10-29:
#   LDAP sync script added, thanks to hpvb:
#   - syncs LDAP teams and avatars to WeKan MongoDB database
#   - removes or disables WeKan users that are also disabled at LDAP
#   TODO:
#   - There is hardcoded value of avatar URL example.com .
#     Try to change it to use existing environment variables.

import os

import environs
import ldap
import hashlib
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

env = environs.Env()

stats = {
  'created': 0,
  'updated': 0,
  'disabled': 0,
  'team_created': 0,
  'team_updated': 0,
  'team_disabled': 0,
  'team_membership_update': 0,
  'board_membership_update': 0
}

mongodb_client = MongoClient(env('MONGO_URL'))
mongodb_database = mongodb_client[env('MONGO_DBNAME')]

class LdapConnection:
    def __init__(self):
        self.url = env('LDAP_URL')
        self.binddn = env('LDAP_BINDDN', default='')
        self.bindpassword = env('LDAP_BINDPASSWORD', default='')

        self.basedn = env('LDAP_BASEDN')

        self.group_base = env('LDAP_GROUP_BASE')
        self.group_name_attribute = env('LDAP_GROUP_NAME_ATTRIBUTE')
        self.admin_group = env('LDAP_ADMIN_GROUP', default=None)

        self.user_base = env('LDAP_USER_BASE')
        self.user_group = env('LDAP_USER_GROUP', default=None)
        self.user_objectclass = env('LDAP_USER_OBJECTCLASS')
        self.user_username_attribute = env('LDAP_USER_USERNAME_ATTRIBUTE')
        self.user_fullname_attribute = env('LDAP_USER_FULLNAME_ATTRIBUTE')
        self.user_email_attribute = env('LDAP_USER_EMAIL_ATTRIBUTE')
        self.user_photo_attribute = env('LDAP_USER_PHOTO_ATTRIBUTE', default=None)

        self.user_attributes = [ "memberOf", "entryUUID", "initials", self.user_username_attribute, self.user_fullname_attribute, self.user_email_attribute ]
        if self.user_photo_attribute:
             self.user_attributes.append(self.user_photo_attribute)

        self.con = ldap.initialize(self.url)
        self.con.simple_bind_s(self.binddn, self.bindpassword)

    def get_groups(self):
        search_base = f"{self.group_base},{self.basedn}"
        search_filter=f"(objectClass=groupOfNames)"

        res = self.con.search(search_base, ldap.SCOPE_SUBTREE, search_filter, ['cn', 'description', 'o', 'entryUUID'])
        result_set = {}
        while True:
            result_type, result_data = self.con.result(res, 0)
            if (result_data == []):
                break
            else:
                if result_type == ldap.RES_SEARCH_ENTRY:
                    ldap_data = {}
                    data = {}
                    for attribute in result_data[0][1]:
                        ldap_data[attribute] = [ val.decode() for val in result_data[0][1][attribute] ]

                    try:
                        data['dn'] = result_data[0][0]
                        data['name'] = ldap_data['cn'][0]
                        data['uuid'] = ldap_data['entryUUID'][0]
                        try:
                            data['description'] = ldap_data['description'][0]
                        except KeyError:
                            data['description'] = data['name']

                        result_set[data['name']] = data
                    except KeyError as e:
                        print(f"Skipping Ldap object {result_data[0][0]}, missing attribute {e}.")
        return result_set

    def get_group_name(self, dn):
        res = self.con.search(dn, ldap.SCOPE_BASE, None, [self.group_name_attribute])
        result_type, result_data = self.con.result(res, 0)
        if result_type == ldap.RES_SEARCH_ENTRY:
            return result_data[0][1][self.group_name_attribute][0].decode()

    def get_users(self):
        search_base = f"{self.user_base},{self.basedn}"
        search_filter = ""
        
        if self.user_group:
            search_filter=f"(&(objectClass={self.user_objectclass})(memberof={self.user_group},{self.basedn}))"
        else:
            search_filter=f"(objectClass={self.user_objectclass})"
          
        ldap_groups = self.get_groups()
        res = self.con.search(search_base, ldap.SCOPE_SUBTREE, search_filter, self.user_attributes)
        result_set = {}
        while True:
            result_type, result_data = self.con.result(res, 0)
            if (result_data == []):
                break
            else:
                if result_type == ldap.RES_SEARCH_ENTRY:
                    ldap_data = {}
                    data = {}
                    for attribute in result_data[0][1]:
                        if attribute == self.user_photo_attribute:
                            ldap_data[attribute] = result_data[0][1][attribute]
                        else:
                            ldap_data[attribute] = [ val.decode() for val in result_data[0][1][attribute] ]

                    try:
                        data['dn'] = result_data[0][0]
                        data['username'] = ldap_data[self.user_username_attribute][0]
                        data['full_name'] = ldap_data[self.user_fullname_attribute][0]
                        data['email'] = ldap_data[self.user_email_attribute][0]
                        data['uuid'] = ldap_data['entryUUID'][0]
                        try:
                            data['initials'] = ldap_data['initials'][0]
                        except KeyError:
                            data['initials'] = ''
                        try:
                            data['photo'] = ldap_data[self.user_photo_attribute][0]
                            data['photo_hash'] = hashlib.md5(data['photo']).digest()
                        except KeyError:
                            data['photo'] = None
                        data['is_superuser'] = f"{self.admin_group},{self.basedn}" in ldap_data['memberOf']
                        data['groups'] = []

                        for group in ldap_data['memberOf']:
                            if group.endswith(f"{self.group_base},{self.basedn}"):
                                data['groups'].append(ldap_groups[self.get_group_name(group)])
                        result_set[data['username']] = data
                    except KeyError as e:
                        print(f"Skipping Ldap object {result_data[0][0]}, missing attribute {e}.")
        return result_set

def create_wekan_user(ldap_user):
    user = { "_id": ldap_user['uuid'],
            "username": ldap_user['username'],
            "emails": [ { "address": ldap_user['email'], "verified": True } ],
            "isAdmin": ldap_user['is_superuser'],
            "loginDisabled": False,
            "authenticationMethod": 'oauth2',
            "sessionData": {},
            "importUsernames": [ None ],
            "teams": [],
            "orgs": [],
            "profile": {
                "fullname": ldap_user['full_name'],
                "avatarUrl": f"https://example.com/user/profile_picture/{ldap_user['username']}",
                "initials": ldap_user['initials'],
                "boardView": "board-view-swimlanes",
                "listSortBy": "-modifiedAt",
            },
            "services": {
                "oidc": {
                    "id": ldap_user['username'],
                    "username": ldap_user['username'],
                    "fullname": ldap_user['full_name'],
                    "email": ldap_user['email'],
                    "groups": [],
                },
            },
    }

    try:
        mongodb_database["users"].insert_one(user)
        print(f"Creating new Wekan user {ldap_user['username']}")
        stats['created'] += 1
    except DuplicateKeyError:
        print(f"Wekan user {ldap_user['username']} already exists.")
        update_wekan_user(ldap_user)

def update_wekan_user(ldap_user):
    updated = False
    user = mongodb_database["users"].find_one({"username": ldap_user['username']})

    if user["emails"][0]["address"] != ldap_user['email']:
        updated = True
        user["emails"][0]["address"] = ldap_user['email']

    if user["emails"][0]["verified"] != True:
        updated = True
        user["emails"][0]["verified"] = True

    if user["isAdmin"] != ldap_user['is_superuser']:
        updated = True
        user["isAdmin"] = ldap_user['is_superuser']

    try:
        if user["loginDisabled"] != False:
            updated = True
            user["loginDisabled"] = False
    except KeyError:
        updated = True
        user["loginDisabled"] = False

    if user["profile"]["fullname"] != ldap_user['full_name']:
        updated = True
        user["profile"]["fullname"] = ldap_user['full_name']

    if user["profile"]["avatarUrl"] != f"https://example.com/user/profile_picture/{ldap_user['username']}":
        updated = True
        user["profile"]["avatarUrl"] = f"https://example.com/user/profile_picture/{ldap_user['username']}"

    if user["profile"]["initials"] != ldap_user['initials']:
        updated = True
        user["profile"]["initials"] = ldap_user['initials']

    if user["services"]["oidc"]["fullname"] != ldap_user['full_name']:
        updated = True
        user["services"]["oidc"]["fullname"] = ldap_user['full_name']

    if user["services"]["oidc"]["email"] != ldap_user['email']:
        updated = True
        user["services"]["oidc"]["email"] = ldap_user['email']

    if updated:
        print(f"Updated Wekan user {ldap_user['username']}")
        stats['updated'] += 1
        mongodb_database["users"].update_one({"username": ldap_user['username']}, {"$set": user})

def disable_wekan_user(username):
    print(f"Disabling Wekan user {username}")
    stats['disabled'] += 1
    mongodb_database["users"].update_one({"username": username}, {"$set": {"loginDisabled": True}})

def create_wekan_team(ldap_group):
    print(f"Creating new Wekan team {ldap_group['name']}")
    stats['team_created'] += 1
    
    team = { "_id": ldap_group['uuid'],
            "teamShortName": ldap_group["name"],
            "teamDisplayName": ldap_group["name"],
            "teamDesc": ldap_group["description"],
            "teamWebsite": "http://localhost",
            "teamIsActive": True
    }
    mongodb_database["team"].insert_one(team)

def update_wekan_team(ldap_group):
    updated = False
    team = mongodb_database["team"].find_one({"_id": ldap_group['uuid']})

    team_tmp = { "_id": ldap_group['uuid'],
            "teamShortName": ldap_group["name"],
            "teamDisplayName": ldap_group["name"],
            "teamDesc": ldap_group["description"],
            "teamWebsite": "http://localhost",
            "teamIsActive": True
    }

    for key, value in team_tmp.items():
        try:
            if team[key] != value:
                updated = True
                break
        except KeyError:
            updated = True

    if updated:
        print(f"Updated Wekan team {ldap_group['name']}")
        stats['team_updated'] += 1
        mongodb_database["team"].update_one({"_id": ldap_group['uuid']}, {"$set": team_tmp})

def disable_wekan_team(teamname):
    print(f"Disabling Wekan team {teamname}")
    stats['team_disabled'] += 1
    mongodb_database["team"].update_one({"teamShortName": teamname}, {"$set": {"teamIsActive": False}})

def update_wekan_team_memberships(ldap_user):
    updated = False
    user = mongodb_database["users"].find_one({"username": ldap_user['username']})
    teams = user["teams"]
    teams_tmp = []

    for group in ldap_user["groups"]:
        teams_tmp.append({
            'teamId': group['uuid'],
            'teamDisplayName': group['name'],
    })

    for team in teams_tmp:
        if team not in teams:
            updated = True
            break

    if len(teams) != len(teams_tmp):
        updated = True

    if updated:
        print(f"Updated Wekan team memberships for {ldap_user['username']}")
        stats['team_membership_update'] += 1
        mongodb_database["users"].update_one({"username": ldap_user['username']}, {"$set": { "teams" : teams_tmp }})

def update_wekan_board_memberships(ldap_users):
    for board in mongodb_database["boards"].find():
        try:
            if board['type'] != 'board':
                continue
        except KeyError:
            continue

        if not "teams" in board.keys():
            continue

        members = []
        if "members" in board.keys():
            members = board["members"]

        members_tmp = []
        for team in board["teams"]:
            for username, user in ldap_users.items():
                for group in user["groups"]:
                    if group['uuid'] == team['teamId']:
                        user_tmp = {
                            'userId': user['uuid'],
                            'isAdmin': user['is_superuser'],
                            'isActive': True,
                            'isNoComments': False,
                            'isCommentOnly': False,
                            'isWorker': False
                        }

                        if user_tmp not in members_tmp:
                            members_tmp.append(user_tmp.copy())

        board_users = []
        for card in mongodb_database["cards"].find({"boardId": board['_id']}):
            if card['userId'] not in board_users:
                board_users.append(card['userId'])

        inactive_board_users = board_users.copy()
        for member in members_tmp:
            if member['userId'] in board_users:
                inactive_board_users.remove(member['userId'])

        for inactive_board_user in inactive_board_users:
            user_tmp = {
                'userId': inactive_board_user,
                'isAdmin': False,
                'isActive': False,
                'isNoComments': False,
                'isCommentOnly': False,
                'isWorker': False
            }

            if user_tmp not in members_tmp:
                members_tmp.append(user_tmp.copy())

        if members != members_tmp:
            print(f"Updated Wekan board membership for {board['title']}")
            stats['board_membership_update'] += 1
            mongodb_database["boards"].update_one({"_id": board["_id"]}, {"$set": { "members" : members_tmp }})
    
def ldap_sync():
    print("Fetching users from LDAP")
    ldap = LdapConnection()
    ldap_users = ldap.get_users()
    ldap_username_list = ldap_users.keys()

    print("Fetching users from Wekan")
    wekan_username_list = []
    for user in mongodb_database["users"].find():
        if not user['loginDisabled']:
            wekan_username_list.append(user['username'])

    print("Sorting users")
    not_in_ldap = []
    not_in_wekan = []
    in_wekan = []
    for ldap_username in ldap_username_list:
        if ldap_username in wekan_username_list:
           in_wekan.append(ldap_username)
        else:
           not_in_wekan.append(ldap_username)

    for wekan_username in wekan_username_list:
        if wekan_username not in ldap_username_list:
            not_in_ldap.append(wekan_username)

    print("Fetching groups from LDAP")
    ldap_groups = ldap.get_groups()
    ldap_groupname_list = ldap_groups.keys()

    print("Fetching teams from Wekan")
    wekan_teamname_list = []
    for team in mongodb_database["team"].find():
        if team['teamIsActive']:
            wekan_teamname_list.append(team['teamShortName'])

    print("Sorting groups")
    group_not_in_ldap = []
    group_not_in_wekan = []
    group_in_wekan = []
    for ldap_groupname in ldap_groupname_list:
        if ldap_groupname in wekan_teamname_list:
           group_in_wekan.append(ldap_groupname)
        else:
           group_not_in_wekan.append(ldap_groupname)

    for wekan_teamname in wekan_teamname_list:
        if wekan_teamname not in ldap_groupname_list:
            group_not_in_ldap.append(wekan_teamname)

    print("Processing users")
    for user in not_in_wekan:
        create_wekan_user(ldap_users[user])

    for user in in_wekan:
        update_wekan_user(ldap_users[user])

    for user in not_in_ldap:
        disable_wekan_user(user)

    print("Processing groups")
    for group in group_not_in_wekan:
        create_wekan_team(ldap_groups[group])

    for group in group_in_wekan:
        update_wekan_team(ldap_groups[group])

    for team in group_not_in_ldap:
        disable_wekan_team(team)

    for username, user in ldap_users.items():
        update_wekan_team_memberships(user)

    print("Updating board memberships")
    update_wekan_board_memberships(ldap_users)

    print()
    print(f"Total users considered: {len(ldap_username_list)}")
    print(f"Total groups considered: {len(ldap_groups)}")
    print(f"Users created {stats['created']}")
    print(f"Users updated {stats['updated']}")
    print(f"Users disabled {stats['disabled']}")
    print(f"Teams created {stats['team_created']}")
    print(f"Teams updated {stats['team_updated']}")
    print(f"Teams disabled {stats['team_disabled']}")
    print(f"Team memberships updated: {stats['team_membership_update']}")
    print(f"Board memberships updated: {stats['board_membership_update']}")

if __name__ == "__main__":
    ldap_sync()
