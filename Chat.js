Messages = new Meteor.Collection('messages');
Users = new Meteor.Collection("users");

if(Meteor.isClient) {
  
  Meteor.subscribe("messages");
  Meteor.subscribe("users");

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

  //Login check
  Template.register.signed_in = Template.chat.signed_in = function () {
    var user_id = Session.get("user_id"),
    verified = Session.get("verified");

    if (verified) {
      return true;
    }

    if (user_id) {
      if (Users.findOne(user_id)) {
        Session.set("verified", true);
        return true;
      }
    }

    return false;
  };

  //New User registration  
  Template.register.events = {
    'submit form': function (event) {
      var registerbox = $('#register'),
          username = registerbox.val(),
          now = (new Date()).getTime();

      Meteor.call('add_user', username, function (error, result) {
        if (error) {
          alert(error);
        } else {
          if (result.warning) {
            Session.set("warning", result.warning);
            Template.register.warning(result.warning);
          } else {
            Session.set("user_id", result.user_id);
          }
        }
      });

      event.preventDefault();
      event.stopPropagation();
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
  Template.users_names.users = function () {
    var users = Users.find({name: { $exists: true }}, { sort: {name: 1} });
    return users;
  };

  //Warnings action
  Template.register.warning = function (warning) {
      $('#warning').text(warning);
  };

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
    _.each(['messages', 'users'], function(collection) {
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

  Meteor.publish("users", function () {
    return Users.find();
  });

  //Remove old users
  Meteor.setInterval(function () {
    var now = (new Date()).getTime();

    Users.find({last_seen: {$lt: (now - 60 * 1000)}}).forEach(function (user) {
      Users.remove(user._id)
    });
  });

  //Server Methods
  Meteor.methods({
    keepalive: function (user_id) { 
      if (user_id == null) {
          return;
      }

      var now = (new Date()).getTime();

      if (Users.findOne(user_id)) {
        Users.update(user_id, {$set: {last_seen: now}});
      }
    },
    add_user: function(username) {
     var now = (new Date()).getTime(),
          user_id = null,
          warning = null;
      
      if (username === "") {
        warning = 'Please enter a valid username.';
      } else if (username === undefined) {
        warning = 'An error occurred. Please try again.';
      } else if (Users.findOne({name: username})) {
        warning = 'Username is already taken. Please choose another.';
      } else {
        user_id = Users.insert({name: username, last_seen: now});
      }

      return {user_id: user_id, warning: warning};
    },
    add_msg: function (user_id, msg) {
      if (user = Users.findOne(user_id)) {
        Messages.insert({name: user.name, message: msg, time: new Date().toLocaleTimeString()});
      }
    }
  });

}