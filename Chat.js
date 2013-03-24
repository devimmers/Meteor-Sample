Messages = new Meteor.Collection('messages');

if(Meteor.isClient) {

  var subscr = Meteor.subscribe("messages");

  _(Template).extend({

    // Entry View
    entry: {

      events: {
        //Send message by enter or btn click
        'click #send-message, keyup, keydown #messageBox': function(e) {
          if (e.type === "keyup" || e.type === "keydown" && e.which !== 13)
            return;

          var ts  = new Date().toLocaleTimeString(),
              msg = $('#messageBox');
          
          if (msg.val() !== '') {        
            Meteor.call('add_msg', msg.val());
          }

          msg.val('');
        },
        //Clear msg btn
        'click #clear-messages': function() {
          if (confirm('Are you sure you want to remove all todo items from the current list? This action cannot be undone.')) {
             console.log("clear");
          }
        }
      }
    },

    //Chat View

    chat: {

      signed_in: function () {
        if(Meteor.userId() != null) {
          return false; 
        } 
        return true;
      },

      events: {
        'click #logout-btn': function(event) {
          Session.set('user_id', null);
          Session.set('verified', false);
          Template.register.signed_in;
        }
      }
    },

    //User list View  
    users_names: {

      events: {
      //Whisper Action
        'click #users a': function(event) {
          event.preventDefault();
          var message = document.getElementById('messageBox'),
              name    = event.currentTarget.getAttribute("href");

          message.value = name + ': ';
          message.focus();
          message.setSelectionRange(name.length+2,name.length+2);
        }
      }
    },
  
  //Users name list loaging
/*  Template.users_names.users = function () {
    var users = Users.find({name: { $exists: true }}, { sort: {name: 1} });
    return users;
  };
*/
  //Show all messages
    messages: messages = function () {
      return Messages.find({}, {sort:{time:-1}});
    }

  });



  //Checking for leaving users
  Meteor.setInterval(function () {
    var user_id = Session.get('user_id');
      if (user_id) {
        Meteor.call('keepalive', user_id);
      }
    }, 1000);
}





if (Meteor.is_server) {
  //Disable client db
  function disableClientMongo() {
    _.each(['messages'], function(collection) {
      _.each(['insert', 'update', 'remove'], function(method) {
        Meteor.default_server.method_handlers['/' + collection + '/' + method] = function() {};
      });
    });
  };

   Meteor.startup(function () {
        disableClientMongo();
        //Messages.remove({});
   });

  //Publish Messages and Users list 
  Meteor.publish("messages", function () {
    return Messages.find();
  });



  //Server Methods
  Meteor.methods({
    add_msg: function (msg) {
        Messages.insert({name: Meteor.user().emails[0].address, message: msg, time: new Date().toLocaleTimeString()});
    },
  });

}