Messages = new Meteor.Collection('messages');
OnlineUsersCollection = new Meteor.Collection('OnlineUsersCollection');
OnlineUsersName = new Meteor.Collection('OnlineUsersName');

if(Meteor.isClient) {

   Meteor.subscribe("messages");
   Meteor.subscribe('users');

  _(Template).extend({

    // Entry View
    entry: {

      events: {
        //Send message by enter or btn click
        'click #send-message, keyup, keydown #messageBox': function(e) {
          if (e.type === "keyup" || e.type === "keydown" && e.which !== 13)
            return;

          var msg = $('#messageBox');
          
          if (msg.val() !== '') {        
            Meteor.call('add_msg', msg.val());
          }

          msg.val('');
        },
        //Clear msg btn
        'click #clear-messages': function() {
          if (confirm('Are you sure you want to remove all todo items from the current list? This action cannot be undone.')) {
             console.log("clear");
              
              OnlineUsersCollection.find().forEach(function(user) {
                // var userID = user.userID; 
              
              var user = Meteor.users.findOne({_id:user.userID});
              if(user != undefined) {
                var name = user.emails[0].address;
                OnlineUsersName.insert({name:name});
              }               

              });

          }
        }
      }
    },

    //Chat View

    chat: {
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
      },
      
      users: function () {
        if(OnlineUsersCollection.find() != undefined) {
            OnlineUsersCollection.find().forEach(function(user) {
             // var userID = user.userID; 
              var user = Meteor.users.find({_id:user.userID});
              if(user.emails != undefined) {
                var name = user.emails[0].address;
              }
              OnlineUsersName.insert({name:name});
            });
          return OnlineUsersName;
        }
        return 'Well well well...';
      }
      
    },


  //Show all messages
    messages: messages = function () {
      return Messages.find({}, {sort:{time:-1}});
    }
  });

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

    Meteor.publish("users", function() {
        return OnlineUsersCollection.find({});
    });

    // Online users (from https://github.com/murilopolese/howmanypeoplearelooking)
    OnlineUsersCollection.remove({});
    Meteor.default_server.stream_server.register( Meteor.bindEnvironment( function(socket) {
        var intervalID = Meteor.setInterval(function() {
            if (socket.meteor_session) {

                var connection = {
                    connectionID: socket.meteor_session.id,
                    connectionAddress: socket.address,
                    userID: socket.meteor_session.userId
                };

                socket.id = socket.meteor_session.id;

                OnlineUsersCollection.insert(connection);

                Meteor.clearInterval(intervalID);
            }
        }, 1000);

        socket.on('close', Meteor.bindEnvironment(function () {
            OnlineUsersCollection.remove({
                connectionID: socket.id
            });
        }, function(e) {
            Meteor._debug("Exception from connection close callback:", e);
        }));
    }, function(e) {
        Meteor._debug("Exception from connection registration callback:", e);
    }));



}