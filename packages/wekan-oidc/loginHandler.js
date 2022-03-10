// creates Object if not present in collection
// initArr = [displayName, shortName, website, isActive]
// objString = ["Org","Team"] for method mapping
function createObject(initArr, objString)
{
  functionName = objString === "Org" ? 'setCreateOrgFromOidc' : 'setCreateTeamFromOidc';
  creationString = 'setCreate'+ objString + 'FromOidc';
  return Meteor.call(functionName,
    initArr[0],//displayName
    initArr[1],//desc
    initArr[2],//shortName
    initArr[3],//website
    initArr[4]//xxxisActive
    );
}
function updateObject(initArr, objString)
{
  functionName = objString === "Org" ? 'setOrgAllFieldsFromOidc' : 'setTeamAllFieldsFromOidc';
  return Meteor.call(functionName,
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
  id = collection+'Id';

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
module.exports = {

// This function adds groups as organizations or teams to users and
// creates them if not already existing
// DEFAULT after creation orgIsActive & teamIsActive: true
// PODC provider needs to send group data within "wekanGroup" scope
// PARAMS to be set for groups within your Oidc provider:
//  isAdmin: [true, false] -> admin group becomes admin in wekan
//  isOrganization: [true, false] -> creates org and adds to user
//  displayName: "string"
addGroupsWithAttributes: function (user, groups){
  teamArray=[];
  orgArray=[];
  isAdmin = [];
  teams = user.teams;
  orgs = user.orgs;
  for (group of groups)
  {
    initAttributes = [
      group.displayName,
      group.desc || group.displayName,
      group.shortName ||group.displayName,
      group.website || group.displayName, group.isActive || false];

    isOrg = group.isOrganisation || false;
    forceCreate = group.forceCreate|| false;
    isAdmin.push(group.isAdmin || false);
    if (isOrg)
    {
      org = Org.findOne({"orgDisplayName": group.displayName});
      if(org)
      {
        if(contains(orgs, org, "org"))
        {
          initAttributes.unshift(org);
          updateObject(initAttributes, "Org");
          continue;
        }
      }
      else if(forceCreate)
      {
        createObject(initAttributes, "Org");
        org = Org.findOne({'orgDisplayName': group.displayName});
      }
      else
      {
        continue;
      }
      orgHash = {'orgId': org._id, 'orgDisplayName': group.displayName};
      orgArray.push(orgHash);
    }

    else
    {
      //start team routine
      team = Team.findOne({"teamDisplayName": group.displayName});
      if (team)
      {
        if(contains(teams, team, "team"))
        {
          initAttributes.unshift(team);
          updateObject(initAttributes, "Team");
          continue;
        }
      }
      else if(forceCreate)
      {
        createObject(initAttributes, "Team");
        team = Team.findOne({'teamDisplayName': group.displayName});
      }
      else
      {
        continue;
      }
      teamHash = {'teamId': team._id, 'teamDisplayName': group.displayName};
      teamArray.push(teamHash);
    }
  }
  // user is assigned to team/org which has set isAdmin: true in oidc data
  // hence user will get admin privileges in wekan
  // E.g. Admin rights will be withdrawn if no group in oidc provider has isAdmin set to true

  users.update({ _id: user._id }, { $set:  {isAdmin: isAdmin.some(i => (i === true))}});
  teams = {'teams': {'$each': teamArray}};
  orgs = {'orgs': {'$each': orgArray}};
  users.update({ _id: user._id }, { $push:  teams});
  users.update({ _id: user._id }, { $push:  orgs});
  // remove temporary oidc data from user collection
  users.update({ _id: user._id }, { $unset:  {"services.oidc.groups": []}});

  return;
},

changeUsername: function(user, name)
{
  username = {'username': name};
  if (user.username != username) users.update({ _id: user._id }, { $set:  username});
},
changeFullname: function(user, name)
{
  username = {'profile.fullname': name};
  if (user.username != username) users.update({ _id: user._id }, { $set:  username});
},
addEmail: function(user, email)
{
  user_email = user.emails || [];
  var contained = false;
  position = 0;
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
    user_email = {'emails': user_email};
    users.update({ _id: user._id }, { $set:  user_email});
  }
}
}
