module.exports = {
  addGroups: function (user, groups){
  teamArray=[]
  teams = user.teams
  if (!teams)
  {
    for (group of groups){
      team = Team.findOne({"teamDisplayName": group});
      if (team)
    {
      team_hash = {'teamId': team._id, 'teamDisplayName': group}
      teamArray.push(team_hash);
    }
  }
    teams = {'teams': teamArray}
    users.update({ _id: user._id }, { $set:  teams});
    return;
  }
  else{

    for (group of groups){
      team = Team.findOne({"teamDisplayName": group})
      team_contained= false;
      if (team)
      {
        team_hash = {'teamId': team._id, 'teamDisplayName': group}
        for (const [count,teams_hash] of Object.entries(teams))
        {
          if (teams_hash["teamId"] === team._id)
          {
          team_contained=true;
          break;
        }
      }
      if (team_contained)
      {
        continue;
      }
      else
      {
        console.log("TEAM to be added:", team);
        teams.push({'teamId': Team.findOne({'teamDisplayName': group})._id, 'teamDisplayName': group});
      }
    }
  }
  console.log("XXXXXXXXXXX Team Array: ", teams);
  teams = {'teams': teams}
  users.update({ _id: user._id }, { $set:  teams});
  }
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
    console.log(user_email);
    users.update({ _id: user._id }, { $set:  user_email});
  }
}
}
