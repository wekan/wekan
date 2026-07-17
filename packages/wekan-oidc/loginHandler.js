// creates Object if not present in collection
// initArr = [displayName, shortName, website, isActive]
// objString = ["Org","Team"] for method mapping
async function createObject(initArr, objString)
{
  const functionName = objString === "Org" ? 'setCreateOrgFromOidc' : 'setCreateTeamFromOidc';
  return await Meteor.callAsync(functionName,
    initArr[0],//displayName
    initArr[1],//desc
    initArr[2],//shortName
    initArr[3],//website
    initArr[4]//xxxisActive
    );
}
async function updateObject(initArr, objString)
{
  const functionName = objString === "Org" ? 'setOrgAllFieldsFromOidc' : 'setTeamAllFieldsFromOidc';
  return await Meteor.callAsync(functionName,
    initArr[0],//team || org Object
    initArr[1],//displayName
    initArr[2],//desc
    initArr[3],//shortName
    initArr[4],//website
    initArr[5]//xxxisActive
    );
}
//checks whether obj is in collection of userObjs
//params
//e.g. userObjs = user.teams
//e.g. obj = Team.findOne...
//e.g. collection = "team"
function contains(userObjs, obj, collection)
{
  const id = collection+'Id';

  if(typeof userObjs == "undefined" || !userObjs.length)
  {
    return false;
  }
  for (const [count, hash] of Object.entries(userObjs))
  {
    if (hash[id] === obj._id)
    {
      return true;
    }
  }
  return false;
}
// #5876: optional OAuth2/OIDC admin groups (mirrors LDAP_SYNC_ADMIN_GROUPS).
// Parse OAUTH2_ADMIN_GROUPS (comma- and/or whitespace-separated) into a list of
// trimmed, non-empty group names. Returns [] when the env var is empty/unset,
// which the callers use as the signal to leave isAdmin untouched (default off).
function getOauth2AdminGroups()
{
  return (process.env.OAUTH2_ADMIN_GROUPS || '')
    .split(/[\s,]+/)
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

// Extract a group name from a single OIDC group entry. The OIDC `groups` claim
// may arrive as an array of plain strings OR an array of objects carrying a
// displayName (see oidc_server.js), so handle both forms.
function oauth2GroupName(group)
{
  if (typeof group === 'string') return group;
  if (group && typeof group === 'object') return group.displayName || group.name || '';
  return '';
}

module.exports = {

getOauth2AdminGroups: getOauth2AdminGroups,

// #5876: returns { manage, isAdmin }. When OAUTH2_ADMIN_GROUPS is empty/unset,
// manage is false and the caller MUST NOT change the user's isAdmin (default
// off, behavior unchanged). When it is set, manage is true and isAdmin reflects
// whether the user's OIDC group names intersect the configured admin groups.
oauth2AdminStatusFromGroups: function (groups)
{
  const adminGroups = getOauth2AdminGroups();
  if (!adminGroups.length) {
    return { manage: false, isAdmin: false };
  }
  const userGroupNames = (Array.isArray(groups) ? groups : [])
    .map(oauth2GroupName)
    .filter(name => name.length > 0);
  const isAdmin = userGroupNames.some(name => adminGroups.includes(name));
  return { manage: true, isAdmin: isAdmin };
},

// This function adds groups as organizations or teams to users and
// creates them if not already existing
// DEFAULT after creation orgIsActive & teamIsActive: true
// PODC provider needs to send group data within "wekanGroup" scope
// PARAMS to be set for groups within your Oidc provider:
//  isAdmin: [true, false] -> admin group becomes admin in wekan
//  isOrganization: [true, false] -> creates org and adds to user
//  displayName: "string"
// #4897: every variable in here used to be an implicit GLOBAL (teamArray,
// orgArray, isAdmin, teams, orgs, group, org, team, ...) shared by all
// concurrent OIDC logins. This function awaits inside its loop, so two logins
// interleaved and pushed each other's teams/orgs/admin flags onto the same
// arrays before writing them to the wrong user document. All state is local
// now, and the collection is addressed as Meteor.users instead of relying on
// a `users` global leaked by the caller.
addGroupsWithAttributes: async function (user, groups){
  const teamArray=[];
  const orgArray=[];
  const isAdmin = [];
  const teams = user.teams;
  const orgs = user.orgs;
  for (const group of groups)
  {
    const initAttributes = [
      group.displayName,
      group.desc || group.displayName,
      group.shortName ||group.displayName,
      group.website || group.displayName, group.isActive || false];

    const isOrg = group.isOrganisation || false;
    const forceCreate = group.forceCreate|| false;
    isAdmin.push(group.isAdmin || false);
    if (isOrg)
    {
      let org = await Org.findOneAsync({"orgDisplayName": group.displayName});
      if(org)
      {
        if(contains(orgs, org, "org"))
        {
          initAttributes.unshift(org);
          await updateObject(initAttributes, "Org");
          continue;
        }
      }
      else if(forceCreate)
      {
        await createObject(initAttributes, "Org");
        org = await Org.findOneAsync({'orgDisplayName': group.displayName});
      }
      else
      {
        continue;
      }
      const orgHash = {'orgId': org._id, 'orgDisplayName': group.displayName};
      orgArray.push(orgHash);
    }

    else
    {
      //start team routine
      let team = await Team.findOneAsync({"teamDisplayName": group.displayName});
      if (team)
      {
        if(contains(teams, team, "team"))
        {
          initAttributes.unshift(team);
          await updateObject(initAttributes, "Team");
          continue;
        }
      }
      else if(forceCreate)
      {
        await createObject(initAttributes, "Team");
        team = await Team.findOneAsync({'teamDisplayName': group.displayName});
      }
      else
      {
        continue;
      }
      const teamHash = {'teamId': team._id, 'teamDisplayName': group.displayName};
      teamArray.push(teamHash);
    }
  }
  // user is assigned to team/org which has set isAdmin: true in oidc data
  // hence user will get admin privileges in wekan
  // E.g. Admin rights will be withdrawn if no group in oidc provider has isAdmin set to true

  await Meteor.users.updateAsync({ _id: user._id }, { $set:  {isAdmin: isAdmin.some(i => (i === true))}});
  await Meteor.users.updateAsync({ _id: user._id }, { $push:  {'teams': {'$each': teamArray}}});
  await Meteor.users.updateAsync({ _id: user._id }, { $push:  {'orgs': {'$each': orgArray}}});
  // remove temporary oidc data from user collection
  await Meteor.users.updateAsync({ _id: user._id }, { $unset:  {"services.oidc.groups": []}});

  return;
},

changeUsername: async function(user, name)
{
  // #4897: `username` was an implicit global; use a local and update via
  // Meteor.users so this no longer depends on a leaked `users` global.
  if (user.username !== name) await Meteor.users.updateAsync({ _id: user._id }, { $set:  {'username': name}});
},
changeFullname: async function(user, name)
{
  if ((user.profile || {}).fullname !== name) await Meteor.users.updateAsync({ _id: user._id }, { $set:  {'profile.fullname': name}});
},
addEmail: async function(user, email)
{
  // #4897: `user_email` and `position` were implicit globals shared between
  // concurrent logins — one login's email list could be spliced/unshifted by
  // another login before being $set on this user's document.
  let user_email = user.emails || [];
  let contained = false;
  let position = 0;
  for (const [count, mail_hash] of Object.entries(user_email))
  {
    if (mail_hash['address'] === email)
    {
      contained = true;
      position = count;
      break;
    }
  }
  if(contained && position != 0)
  {
    user_email.splice(position,1);
    contained = false;
  }
  if(!contained)
  {
    user_email.unshift({'address': email, 'verified': true});
    await Meteor.users.updateAsync({ _id: user._id }, { $set:  {'emails': user_email}});
  }
}
}
