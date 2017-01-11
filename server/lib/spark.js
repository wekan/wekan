//*---A Spark integration for Wekan
//*---Created by Jeff Levensailor jeff@levensailor.com
//*---Change sparkToken to your unique API key

const sparkToken = '<Cisco Spark token goes here>';
const botName = "wekan";
const sparkAPI = 'https://api.ciscospark.com/v1/';
const welcomeText1 = "Welcome to the Wekan Board, ";
const welcomeText2 = "I'll be your new personal assistant and organizer friend!<br> For a list of what I can help with, just **@"+botName+" help**";
var lastmsgId;

Meteor.methods({
  //Each Board is a Spark Room - this initializes the room
  'spark.attachRoom'(boardId) {
    check(boardId, String);
    //Boards and Users should have all the info we need, cut down on db calls
    var title = Boards.findOne({_id: boardId}).title;
    var userId = Boards.findOne({_id: boardId}).members[0].userId;
    var userEmail = Users.findOne({_id: userId}).emails[0].address;
    var userName = Users.findOne({_id: userId}).username;
    var welcomeText = (welcomeText1 + "**"+userName+"**<br>" + welcomeText2);
    var request = require('request');
    var req = {
    auth: { bearer: sparkToken },
    url: sparkAPI + 'rooms',
    json: true,
    body: { 'title': title }
    };

    request.post(req, Meteor.bindEnvironment(function(err, res) {
    if(err) {
    console.log(err.message);
    } else {
      var callBack = res.body.id;
      //add sparkID to Boards DB
      Boards.update({_id: boardId}, {$set: {sparkId: callBack}});

    //  -- add preconfigured labels for use with actions later ???
    //  -- really wanted to do something with emojis
    //  Boards.update({_id: boardId, "labels.name": ''}, {$set: {"labels.0.name": "Webex Meeting 💬"}});
    //  Boards.update({_id: boardId, "labels.name": ''}, {$set: {"labels.1.name": "Update Requested"}});
    //  Boards.update({_id: boardId, "labels.name": ''}, {$set: {"labels.2.name": "Conference Now 📞"}});
    //  Boards.update({_id: boardId, "labels.name": ''}, {$set: {"labels.3.name": "Send an Email 📩"}});
    //  Boards.update({_id: boardId, "labels.name": ''}, {$set: {"labels.4.name": "Deadline Soon 📅"}});
    //  Boards.update({_id: boardId, "labels.name": ''}, {$set: {"labels.5.name": "Update Requested"}});

      Meteor.call(
	       'spark.addUser',
	        callBack,
          userEmail,
	         function(err, res) {
             if(err) {
               console.log(err);
             } else {
	            }
            }
          );//call to addUser

      Meteor.call(
         'spark.msgRoom',
          callBack,
          welcomeText,
           function(err, res) {
             if(err) {
               console.log(err);
             } else {
                  }
                }
              );//call to msgRoom
      }
    }));//original rest call
  },//spark.attachRoom

  //METHOD FOR ADDING USERS TO SPARK ROOM
  'spark.addUser'(roomId, personEmail) {
    check(roomId, String);
    check(personEmail, String);
    var request = require('request');
    var req = {
    auth: { bearer: sparkToken },
    url: sparkAPI + 'memberships',
    json: true,
    body: {
      'roomId': roomId,
      'personEmail': personEmail
     }
    };//end setup

    request.post(req, function(err, res) {
    if(err) {
    console.log(err);
    } else {
      }
    });//rest call
  },//spark.addUser

  //METHOD FOR SENDING MESSAGES WITH NEW LINES (text)
  'spark.msgRoomPG'(roomId, message) {
    check(roomId, String);
    check(message, String);
    var request = require('request');
    var req = {
    auth: { bearer: sparkToken },
    url: sparkAPI + 'messages',
    json: true,
    body: {
      'roomId': roomId,
      'text': message
     }
    };//end setup

    request.post(req, function(err, res) {
    if(err) {
    console.log(err);
    } else {

      }
    });//rest call
  },//spark.msgRoom

  //METHOD FOR SENDING MESSAGES TO SPARK ROOM (markdown)
  'spark.msgRoom'(roomId, message) {
    check(roomId, String);
    check(message, String);
    var request = require('request');
    var req = {
    auth: { bearer: sparkToken },
    url: sparkAPI + 'messages',
    json: true,
    body: {
      'roomId': roomId,
      'markdown': message
     }
    };//end setup

    request.post(req, function(err, res) {
    if(err) {
    console.log(err);
    } else {
      }
    });//rest call
  },//spark.msgRoom

  //METHOD FOR RETRIEVING MESSAGE FROM WEBHOOK
  'spark.getMsg'(msgId, personEmail) {
    check(msgId, String);
    check(personEmail, String);
    var text;
    var personEmail;
    var roomId;
    var userId = Users.findOne({emails: {$elemMatch: {address: personEmail}}})._id;
    var request = require('request');
    var req = {
    auth: { bearer: sparkToken },
    url: sparkAPI + 'messages/' + msgId,
    json: true,
    };//end setup

    //http get
    request.get(req, Meteor.bindEnvironment(function(err, res) {
    text = res.body.text;
    personEmail = res.body.personEmail;
    roomId = res.body.roomId;

      //fixes issue where Spark sends multiple requests per webhook trigger and only answers to one unique msgId
      var stack = Users.findOne({_id: userId}).lastmsg;
      if (stack.indexOf(msgId) > -1){
        console.log("duplicate");
      }
      else {
        Users.update({_id: userId}, {$push: {lastmsg: msgId}});
        //trim the bot name
        var toParse = (text.replace(botName, ""));
        toParse = toParse.trim().replace(/ /g , ",");

        Meteor.call(
          'holler.atMe',
          toParse,
          personEmail,
          roomId,
          function(err, res) {
            if(err) {
              console.log(err);
            } else {
              console.log(">>holler.atMe");
              }
            }
        );//hollerCall
        }//else
      }));//rest call
  },//spark.getMsg
  'spark.getAvatar'(personEmail) {
    check(personEmail, String);
    console.log("personEmail: " +personEmail);
    var request = require('request');
    var req = {
    auth: { bearer: sparkToken },
    url: sparkAPI + 'people' + '?email=' +personEmail,
    json: true,
    };//end setup
    request.get(req, Meteor.bindEnvironment(function(err, res) {
    if(err) {
    } else {
      console.log(res.body);
      var sparkAvatar = res.body.items[0].avatar;
      var userId = Users.findOne({emails: {$elemMatch: {address: personEmail}}})._id;
    if (typeof sparkAvatar !== "undefined"){
      Users.update({_id: userId}, {$set: {'profile.avatarUrl': sparkAvatar}});
    }//if
      }
    }));//rest call
  },//spark.listPeople
})//methods
