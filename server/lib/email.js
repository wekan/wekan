//*---A Spark integration Framework using Meteor.JS
//*---Created by Jeff Levensailor jeff@levensailor.com



Meteor.methods({
  //Each Board is a Spark Room - this initializes the room
  'email.form'(boardId) {
    check(boardId, String);
    var boardMembers = Boards.findOne({_id: boardId}).members;
    var boardUser;
    var boardUserId;
    var mailto;
    var email;
    var subject = Boards.findOne({_id: boardId}).title;
    var body="";


     for (i=0; i<=boardMembers.length-1; i++){
        boardUserId = boardMembers[i].userId;
        boardUser = Users.findOne({_id: boardUserId}).emails[0].address;
        if (i===0){
          mailto=boardUser;
        }
        else{
          mailto = mailto+","+boardUser;
        }
}

  var lists = Lists.find({boardId: boardId}).fetch();

  lists.forEach(function (list){
    body = body+"%0D%0A"+list.title+":%0D%0A";
    var cards = Cards.find({listId: list._id}).fetch();
    cards.forEach(function(card){
      body = body+"%0D%0A"+card.title+"%0D%0A";
      var cardComments = CardComments.find({cardId: card._id}).fetch();
      cardComments.forEach(function(cardcomment){
        var userName = Users.findOne({_id: cardcomment.userId}).username;
        var date = cardcomment.createdAt.toUTCString();
        body = body+"-"+cardcomment.text+" - "+userName+" @ "+date+"%0D%0A";
      })//cardcomments
    })//cards
})//lists

//fetch all lists that match boardId, return title and listId
//fetch all cards that match listId, return title and cardId
//fetch all comments that match cardId, return text


    email = "mailto:"+mailto+"?subject=Status Update: "+subject+"&body="+body;
    return email;
  }//email.status
})//methods
