Messages = new Meteor.Collection('messages');

if(Meteor.isClient) {

  var subscr = Meteor.subscribe("messages");

  ////////// Helpers for in-place editing //////////
  // Returns an event_map key for attaching "ok/cancel" events to
  // a text input (given by selector)
  var okcancel_events = function (selector) {
    return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
  };

  // Creates an event handler for interpreting "escape", "return", and "blur"
  // on a text field and calling "ok" or "cancel" callbacks.
  var make_okcancel_handler = function (options) {
    var ok = options.ok || function () {};
    var cancel = options.cancel || function () {};

    return function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);
      } else if (evt.type === "keyup" && evt.which === 13) {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };
  };

  //Send message function
  function sendMessage(text) {
      var ts = new Date().toLocaleTimeString();    
      
      if (text !== '') {        
        Meteor.call('add_msg', Session.get("user_id"), text);
      }

      $('#messageBox').val('');
      event.preventDefault();
      event.stopPropagation();
  }

  //Events Area
  Template.entry.events = {};

  //Enter Send Action
  Template.entry.events[okcancel_events('#messageBox')] = make_okcancel_handler({
    ok: function(text, event ) {
        sendMessage(text);
        event.target.value = "";
    }
  });

  //Send Action
  Template.entry.events['click #send-message'] = function() {
      var message = document.getElementById('messageBox');
      sendMessage(message.value);
  };

  //Send Action
  Template.entry.events['click #clear-messages'] = function() {
    if (confirm('Are you sure you want to remove all todo items from the current list? This action cannot be undone.')) {
       console.log("clear");
       
    }
  };


  Template.chat.events = {
    'click #logout-btn': function(event) {
      Session.set('user_id', null);
      Session.set('verified', false);
      Template.register.signed_in;
    }
  };

  //Whisper Action
  Template.users_names.events = {
    'click #users a': function(event) {
      event.preventDefault();
      var message = document.getElementById('messageBox'),
          name    = event.currentTarget.getAttribute("href");
      message.value = name + ': ';
      message.focus();
      message.setSelectionRange(name.length+2,name.length+2);
    }
  };

  //Users name list loaging
/*  Template.users_names.users = function () {
    var users = Users.find({name: { $exists: true }}, { sort: {name: 1} });
    return users;
  };
*/
  //Show all messages
  Template.messages.messages = function () {
    return Messages.find({}, {sort:{time:-1}});
  }

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
   });

  //Publish Messages and Users list 
  Meteor.publish("messages", function () {
    return Messages.find();
  });



  //Server Methods
  Meteor.methods({
    add_msg: function (user_id, msg) {
        Messages.insert({name: user.name, message: msg, time: new Date().toLocaleTimeString()});
    },
  });

}