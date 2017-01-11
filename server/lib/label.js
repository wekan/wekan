//*---A Spark integration Framework using Meteor.JS
//*---Created by Jeff Levensailor jeff@levensailor.com
//*---Labels are actions

Meteor.methods({
  'label.which'(label, sparkId, members, title, friendlyId, labelId, cardId) {
    check(label, String);
    check(sparkId, String);
    check(members, Array);
    check(title, String);
    check(friendlyId, String);
    check(labelId, String);
    check(cardId, String);
    switch(label){
      case "Update Requested": {
        Meteor.call(
        'label.update',
        sparkId,
        friendlyId,
        title,
        members,
        function(err, res) {
          if(err) {
//            console.log("label.which error");
          } else {
              }
            }
        );//label.update
        break;
      }
      case "Conference Now 📞": {
        Meteor.call(
        'tropo.conference',
        members,
        title,
        sparkId,
          function(err, res) {
            if(err) {
             console.log(err);
            } else {
              console.log("cardId: " +cardId);
              console.log("labelId " +labelId);
              Cards.update({_id: cardId}, {$unset: {'labelIds': labelId}});
                }
              }
      );//tropo.call
        break;
      }
      case "Webex Meeting 💬": {
        var labeluser="";
        var message;
        var initiator = Users.findOne({_id: members[0]}).username;
//        console.log(initiator);
        for (i=0; i<members.length; i++){
              if(typeof members[i] !== "undefined" && labeluser !== ""){
              labeluser = labeluser + ", " +Users.findOne({_id: members[i]}).username;
              }//if
              else{
                labeluser = Users.findOne({_id: members[i]}).username;
              }
        }//for
        message = "Hey **"+labeluser+"** a meeting has been requested to discuss **"+title+"**, please join @ https://presidio.webex.com/meet/"+initiator+"presidio.com";
        console.log(cardId);
        Meteor.call(
          'cards.removeLabel',
          cardId,
          function(err,res){
            if(err) {
            }
              else {
              }
            }
        );//meteor call

        Meteor.call(
        'spark.msgRoom',
        sparkId,
        message,
          function(err, res) {
            if(err) {
             console.log(err);
           } else {
                }
              }
      );//spark call
        break;
  }//case
  }//switch
},//label.which
      'label.update'(sparkId, friendlyId, title, members) {
      check(sparkId, String);
      check(friendlyId, String);
      check(title, String);
      check(members, Array);
      var labeluser="";
      for (i=0; i<members.length; i++){
            console.log(members[i]);
            if(typeof members[i] !== "undefined" && labeluser !== ""){
            labeluser = labeluser + ", " +Users.findOne({_id: members[i]}).username;
          }//if
          else{
            labeluser = Users.findOne({_id: members[i]}).username;
          }
      }
      var listText2="To stop this message from repeating, please **@holler update** **"+friendlyId+"** `<notes>`";
      Meteor.call(
      'spark.msgRoom',
      sparkId,
      listText,
         function(err, res) {
           if(err) {
           } else {
             }
          }//function
        );//call to msgRoom
        var listText="Hey **"+labeluser+"** an update is required for task: **"+title+"**";
        Meteor.call(
        'spark.msgRoom',
        sparkId,
        listText2,
           function(err, res) {
             if(err) {
             } else {
               }
            }//function
          );//call to msgRoom
      }//label.update
})//methods
