Messages = new Meteor.Collection('messages');

if (Meteor.isClient) {
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

  //Send message function
  function sendMessage(text) {
      var nameEntry = document.getElementById('name');
      if (nameEntry.value) {
          var ts = Date.now() / 1000;
          Messages.insert({name:nameEntry.value, message:text, time: ts});
      }
  }

    //Send Action
  Template.entry.events['click #clear-messages'] = function() {
    if (confirm('Are you sure you want to remove all todo items from the current list? This action cannot be undone.')) {
       console.log("clear");
      Messages.remove();
      Template.messages.messages = function() {
        return null;
      }
    }
  };


  //Show all messages
  Template.messages.messages = function () {
    return Messages.find({}, {sort:{time:-1}});
  }
};




if (Meteor.isServer) {
  Meteor.startup(function () {
  });
}
