//*---A Tropo integration for Wekan
//*---Created by Jeff Levensailor jeff@levensailor.com
//*---Change Tropo Token to your unique API key

const token = '<Tropo token goes here>';
const url = 'https://api.tropo.com/1.0/sessions';

//PM is the logged in user for now, in this case the conference initiator
//Perhaps one day this could be an assignable role
//Conference calls use URI = Email assumption, otherwise directory lookup would be needed, Cisco UDS API or other.

var sipuri;
var PM;
var pmUri;
var pmName;
var boardName;
var addGreet;
var pmGreet = "The conference is starting";
Meteor.methods({
  'tropo.conference'(cardId) {
    check(cardId, String);
    var members = Cards.findOne({_id: cardId}).members;
    var title = Cards.findOne({_id: cardId}).title;
    var boardId = Cards.findOne({_id: cardId}).boardId;
    var sparkId = Boards.findOne({_id: boardId}).sparkId;

    //make rest call for each member
    //first start the conference with the PM
    PM = Boards.findOne({sparkId: sparkId}).members[0].userId;
    pmName = Users.findOne({_id: PM}).username;
    pmUri = Users.findOne({_id: PM}).emails[0].address;

    var request = require('request');
    var options = { method: 'POST',
      url: url,
      headers:
       { 'cache-control': 'no-cache',
         'content-type': 'application/json' },
      body:
       { token: token,
         number: pmUri,
         project: pmGreet },
      json: true };//options

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
    });//request

    boardName = Boards.findOne({sparkId: sparkId}).title;
    addGreet = "Conference call started by " +pmName+" for board " +boardName;

    for (i=0; i<=members.length-1; i++){
    sipuri = Users.findOne({_id: members[i]}).emails;
    sipuri = sipuri[0].address;
    if (sipuri !== pmUri){
    console.log(sipuri);
    var request = require('request');
    var options = { method: 'POST',
      url: url,
      headers:
       { 'cache-control': 'no-cache',
         'content-type': 'application/json' },
      body:
       { token: token,
         number: sipuri,
         project: addGreet },
      json: true };//options

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      });//request
    }
    else{
      console.log("duplicate URI");
    }

  }//for
  }//tropo.conference
})//methods
