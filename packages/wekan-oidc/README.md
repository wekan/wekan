# salleman:oidc package

A Meteor implementation of OpenID Connect Login flow

## Usage and Documentation

Look at the `salleman:accounts-oidc` package for the documentation about using OpenID Connect with Meteor.

## Usage with e.g. authentik for updating users via oidc

To use the following features set:
'export PROPAGATE_OIDC_DATA=true'

SIMPLE: If user is assigned to 'group in authentik' it will be automatically assigned to corresponding team in wekan if exists

ADVANCED: Users can be assigned to teams or organisations via oidc on login. Teams and organisations that do not exist in wekan, yet, will be created, when specified. Admin privileges for wekan through a specific group can be set via Oidc.
See example below:


  1. Specify scope in authentik for what will be delivered via userinfo["wekanGroups"]

    Possible configuration for *yourScope*:
    '
    groupsDict = {"wekanGroups": []}
    for group in request.user.ak_groups.all():
      groupDict = {"displayName": group.name}
      groupAdmin = {"isAdmin": group.isAdmin}
      groupAttributes = group.attributes
      tmp_dict= groupDict | groupAttributes | groupAdmin

      groupsDict["wekanGroups"].append(tmp_dict)
    return groupsDict
    '
  2. Tell provider to include *yourScope* and set
    OAUTH2_REQUEST_PERMISSIONS="openid profile email *yourScope*"

  3. In your group settings in authentik add attributes:
    desc: groupDesc           // default group.name
    isAdmin:  true            // default false
    website: groupWebsite     // default group.name
    isActive: true            // default false
    shortName: groupShortname // default group.name
    forceCreate:  true       // default false
    isOrganisation: true    // default false

  4. On next login user will be added to either newly created group/organization or to already existing

  NOTE: orgs & teams won't be updated if they already exist.

  5. Manages admin rights as well. If user is in Group which has isAdmin: set to true, user will get admin 
     privileges in Wekan as well. 
     If no adjustments (e.g. 1-3) are made on oidc provider's side, user will receive his/her admin rights from before.
