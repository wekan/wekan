//*---holler.js is the bot backend
//*---A Spark integration Framework using Meteor.JS
//*---Created by Jeff Levensailor jeff@levensailor.com
//Parses all text after @botname and calls actions

var botName="<Cisco Spark Bot Name>";
var helpText = "**My Available Commands are:**\n - **@"+botName+" list** : displays a list of all currently assigned tasks\n - **@"+botName+ " add [Task Name]** : adds a task for tracking\n - **@"+botName+" status [Task #]** : displays all notes for a task\n - **@"+botName+" update [Task #]** : updates a note for a task";
var listText;
var cardComments;
var boardId;
Meteor.methods({
  //METHOD TO INPUT TEXT AND PARSE TO ACTION
  'holler.atMe'(toParse, personEmail, roomId) {
    check(toParse, String);
    check(personEmail, String);
    check(roomId, String);
    //retrieve boardid from roomId
    boardId = Boards.findOne({sparkId: roomId})._id;
    console.log("holler.atMe boardId: " +boardId);

  //first word [0] is for "help" "list" "update" and other functions forthcoming
  //second word [1] is for the object to act upon
  //third and subsequent words are for comments
  var Args = new Array();
  Args = toParse.split(",");

  var Updates="";
  for (i=2; i<=Args.length-1; i++){
     Updates = Updates+ " " +Args[i];
  }
  var taskName="";
  for (i=1; i<=Args.length-1; i++){
    taskName = taskName+ " " +Args[i];
  }
console.log(taskName);

  switch(Args[0]){
    case "help": {
      Meteor.call(
      'holler.help',
      roomId,
      function(err, res) {
        if(err) {
          console.log(err);
        } else {
            }
          }
      );//holler.help call
      break;
    }
    case "list": {
      Meteor.call(
      'holler.list',
      roomId,
      personEmail,
        function(err, res) {
          if(err) {
            console.log(err);
          } else {
              }
            }
    );//holler.list call
      break;
    }
    case "status":{
      var cardName = Args[1];
      Meteor.call(
      'holler.status',
      roomId,
      personEmail,
      cardName,
      boardId,
        function(err, res) {
          if(err) {
            console.log(err);
          } else {

              }
            }
    );//call to msgRoom
      break;
    }
    case "update":{
      var cardName = Args[1];
      var comment = Args[2];
      Meteor.call(
      'holler.update',
      roomId,
      personEmail,
      cardName,
      boardId,
      Updates,
        function(err, res) {
          if(err) {
            console.log(err);
          } else {

              }
            }
    );//call to msgRoom
      break;
    }
    case "add":{
      Meteor.call(
      'holler.add',
      roomId,
      personEmail,
      taskName,
      boardId,
        function(err, res) {
          if(err) {
            console.log(err);
          } else {

              }
            }
    );//call to msgRoom
      break;
    }
}//switch

  },
  'holler.help'(roomId) {
    check(roomId, String);
    Meteor.call(
    'spark.msgRoom',
    roomId,
    helpText,
       function(err, res) {
         if(err) {
           console.log(err);
         } else {
           }
        }
    );//call to msgRoom
  },//holler.help
  'holler.list'(roomId, personEmail) {
    check(roomId, String);
    check(personEmail, String);
    var userID = Users.findOne({emails: {$elemMatch: {address: personEmail}}})._id;
    var cardCount=0;
    var cardStatus;
    var friendly;
    var listText;
    console.log("holler.list boardId: " +boardId);
    var yourAssigned = "**Hey** <@personEmail:" + personEmail +"> **, You've been assigned the following tasks:**";
    var cards = Cards.find({members: userID, boardId: boardId}).fetch();
    cards.forEach(function (card){
        cardStatus = Lists.findOne({_id: card.listId}).title;
        friendly = card.friendlyId;
      if (typeof cardStatus !== "undefined" && cardCount==0){//initial line
        listText =  yourAssigned + "\n- "+"[**" +friendly+ "**]: " +card.title+ " - " + "`"+cardStatus+"`";
        cardCount++;
      }
        else if(typeof cardStatus !== "undefined"){//append subsequent lines
        listText = listText + "\n- "+"[**" +friendly+ "**]: " +card.title+ " - " + "`"+cardStatus+"` ";
        cardCount++;
        }
//        i++;
    });//cards.forEach
    //if no cards match, still output a message
    if (cardCount === 0){
      listText = "You are not currently assigned any tasks.. Good Job!";
    }
    Meteor.call(
    'spark.msgRoom',
    roomId,
    listText,
       function(err, res) {
         if(err) {
           console.log("msgroom" + err);
         } else {
           }
        }//function
      );//call to msgRoom
  },//holler.list
  'holler.status'(roomId, personEmail, taskid, boardId) {
    check(roomId, String);
    check(personEmail, String);
    check(taskid, String);
    check(boardId, String);
    var whichCard = Cards.findOne({friendlyId: taskid})._id;
    var title = Cards.findOne({_id: whichCard}).title;
    var userID = Users.findOne({emails: {$elemMatch: {address: personEmail}}})._id;
    var cards = Cards.find({members: userID, boardId: boardId}).fetch();
    var introNote = "Hmm.. here are the last few notes for: **" + title + "**";
    var latestNote;
    var i = 0;
    cards.forEach(function (card){
    if (typeof card.friendlyId !== "undefined" && card.friendlyId !== taskid){
    }
      else {
        //now we have the right card, we need to get all the messages
        var cardComments = CardComments.find({cardId: whichCard}).fetch().reverse();
        cardComments.forEach(function (cardComments){
          if (i==0){
            latestNote = introNote;
          }
          else{
          }
          latestNote = latestNote + "\n - " + cardComments.text;
            i++;
        })//foreach

        if (typeof latestNote == "undefined"){
          latestNote = "Hmm.. I don't have any notes for that task yet, add some with **@"+botName+" update** `<taskId>`";
        }
        else {
        }

        Meteor.call(
        'spark.msgRoom',
        roomId,
        latestNote,
           function(err, res) {
             if(err) {
               console.log(err);
             } else {
               }
            }//function
          );//call to msgRoom

        }//else
      })//foreach
  },//holler.status
  'holler.update'(roomId, personEmail, taskid, boardId, comment) {
    check(roomId, String);
    check(personEmail, String);
    check(taskid, String);
    check(boardId, String);
    check(comment, String);
    var text = comment;
    var cardId = Cards.findOne({friendlyId: taskid})._id;
    var title = Cards.findOne({_id: cardId}).title;
    var userId = Users.findOne({emails: {$elemMatch: {address: personEmail}}})._id;
    var confirmNote = "Your comment has been added to: **" +title+"**";
    //add code to remove label if exists
    CardComments.insert({
      boardId,
      cardId,
      text,
      userId,
    });
        Meteor.call(
        'spark.msgRoom',
        roomId,
        confirmNote,
           function(err, res) {
             if(err) {
               console.log(err);
             } else {
               }
            }//function
          );//call to msgRoom
  },//holler.update
  'holler.add'(roomId, personEmail, taskName, boardId){
    check(roomId, String);
    check(personEmail, String);
    check(taskName, String);
    check(boardId, String);
    console.log(boardId);
    var userId = Users.findOne({emails: {$elemMatch: {address: personEmail}}})._id;
    var title = "Engineer Additions";
    var index = Cards.find().fetch().length;
    index++;
    var cardId;
    var listId;
    var listExist;
    var newNote;
    //list.find if title engineer updates exist, if not continue
    listExist = Lists.findOne({title: title, boardId: boardId})
    if (typeof listExist !== 'undefined' ){
      listId = Lists.findOne({title: title})._id;
      cardId = Cards.insert({title: taskName, listId: listId, boardId: boardId, friendlyId: index, sort: "0", userId: userId});
      Cards.update({_id: cardId}, {$push: {members: userId}});
    }
    else{
      listId = Lists.insert({title: title, boardId: boardId});
      cardId = Cards.insert({title: taskName, listId: listId, boardId: boardId, friendlyId: index, sort: "0", userId: userId});
      Cards.update({_id: cardId}, {$push: {members: userId}});
    }
    newNote = "Your task, " + taskName + " has been added. Consider adding some notes with **@"+botName+" update "+index+"** `<notes>`";
    Meteor.call(
    'spark.msgRoom',
    roomId,
    newNote,
       function(err, res) {
         if(err) {
           console.log(err);
         } else {
           }
        }//function
      );//call to msgRoom
    //card.insert title=taskName, listid = callback from list.insert, boardid, userid, friendlyid=index

    //spark.msgroom your task has been added, consider adding notes by doing holler update <friendlyid> your update
  }//holler.add
})//methods
