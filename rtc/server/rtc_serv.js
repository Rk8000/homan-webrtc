Peers = new Meteor.Stream('peers');
Audio = new Meteor.Collection('audio');

  Meteor.startup(function () {
    
    // code to run on server at startup
    Audio.remove({});

    
  });

 


Meteor.publish("audio", function(sess) {
  //var self = this;
  return Audio.find({session: sess});
});

Audio.allow({
      update: function(userId, doc, fieldNames, modifier) { return true; },
      insert: function (userId, doc) { return true; }
    });

