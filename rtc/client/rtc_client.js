// Function for getting URL parameters
function gup(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if(results == null) {
        return "";
    }
    else {
        return unescape(results[1]);
    }
}

Peers = new Meteor.Stream('peers');
Audio = new Meteor.Collection("audio");
$(document).ready(function () {
  Meteor.subscribe("audio", gup("session"), function () {
    console.log ("Looking for: " + gup("workerId") + " in labor pool");
    console.log (Audio.find({workerId: gup("workerId"), session: gup("session")}).fetch());
    me = Audio.findOne({workerId: gup("workerId"), session: gup("session")});
    //console.log(me);
    if (!me) { 
     Audio.insert({workerId: gup("workerId"), session: gup("session"), role: gup("role"), time: Date.now()});
    }
    else {
      Audio.update(me._id, {$set: {time: Date.now()}});
    }

  });
});

Audio.allow({
      update: function(userId, doc, fieldNames, modifier) { return true; },
      insert: function (userId, doc) { return true; }
    });

//currentSubscriptions = new Meteor.Collection(null);
  
currentSubscriptions = {};

window.SignalingChannel = function(userName) {

  var self = this;
  self.user = userName;


  self.send = function(signal) {
    message = JSON.parse(signal);
    message.user = gup("workerId");
    signal = JSON.stringify(message);
    Peers.emit(self.user + "-" + gup("session"), signal);
    console.log("SENDING to: " + self.user);
    console.log(message);
    //console.log(signal);
  };

  
};

//var signalingChannel 

window.SignaledConnection = function (fromName, toName) {
  var self = this;
  var configuration = {
    'iceServers': [{
      'url': 'stun:stun.example.org'
    }]
  };
  self.pc = null;
  self.fromName = fromName;
  self.toName = toName;
  self.closeCallback = null;
  self.signalingChannel = new SignalingChannel(toName);

  //self.Peers = p;
  // call start() to initiate

  self.close = function () {
    /*if (self.pc) {
      self.pc.close();
      self.pc = null;
    }*/
    remoteView = document.getElementById("audio-dev-" + self.toName);
    if (remoteView)
      remoteView.pause();
    div = document.getElementById("audio-" + self.toName);
    if (div) {
      div.parentNode.removeChild(div);

    }
    
  }

  self.start = function () {
    console.log ("signaledConnection(" + self.toName + ").start");
    if (self.pc) {
      self.close();
      //self.pc.close();
    }
    else 
      self.pc = new webkitRTCPeerConnection(configuration);

    console.log(self.pc);
    
    // send any ice candidates to the other peer
    self.pc.onicecandidate = function (evt) {
      if (evt.candidate)
        self.signalingChannel.send(JSON.stringify({
          'candidate': evt.candidate
        }));
    };
/*
    self.pc.oniceconnectionstatechange = function() {
      console.log ("CHANGE");
      
      console.log (self.pc.iceConnectionState);
      
          //self.closeCallback();
        //currentSubscriptions.remove({workerId: self.toName});
        //self.pc.getRemoteStreams()[0].stop();
      }
    };*/
    // let the 'negotiationneeded' event trigger offer generation
    self.pc.onnegotiationneeded = function () {
      console.log("signaledConnection(" + self.toName + ").onnegiationneeded");
      self.pc.createOffer(localDescCreated, logonnegitaionneededError);
    };

    // once remote stream arrives, show it in the remote video element
    self.pc.onaddstream = function (evt) {
      
      div = document.createElement('div');
      span = document.createElement('span');
      console.log("STREAM");
      console.log(evt);
      span.innerHTML = "<b>" + self.toName + ": </b>";
      remoteView = document.createElement('audio');
      remoteView.id = "audio-dev-" + self.toName;
      remoteView.src = URL.createObjectURL(evt.stream);

      // $(document).ready(function () {
          document.getElementById("audio_div").appendChild(div);
          console.log("SETTING UP CONTROLS!!");
          //remoteView.autoplay = true; //!!session.remote;
          div.id = "audio-" + self.toName;
          /*if (Audio.findOne({workerId: self.toName}).role == "worker") {
            remoteView.controls = false;
            remoteView.muted = true;
            div.style.visibility = "hidden";
          }*/
       // });
      div.appendChild(span);
      div.appendChild(remoteView);
      remoteView.controls = true;
      remoteView.autoplay = true;
      //remoteView.src = URL.createObjectURL(stream);
      
    };

    // get a local stream, show it in a self-view and add it to be sent
    //console.log(self.fromName + " > " + self.toName);
    navigator.webkitGetUserMedia({
        'audio': true,
        'video': false
      }, function (stream) {
        console.log("< webkitGetUserMedia callback >");
        self.pc.addStream(stream);
      }, logGetUserMediaError);
  };


  self.signalingChannel.onmessage = function (evt) {
      
      //console.log ("ONMESSAGE");
      //console.log(self);
      if (!self.pc) { 
        console.log ("making new pc");
        self.start();
      }

      var message = JSON.parse(evt.data);
      
      //console.log(message);
      if (message.sdp) {
        //console.log ("We have an offer!")
        //document.sdp = message.sdp;
        //console.log("sdp:");
        //console.log(message.sdp);
        self.pc.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {

          //console.log ("type: " + self.pc.remoteDescription.type)
          // if we received an offer, we need to answer
          if (self.pc.remoteDescription.type == 'offer') {
            //console.log("creating answer!!")
            self.pc.createAnswer(localDescCreated, logonmessageError);
          }
        }, nutterError);
      }
      else {
        try {
          self.pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
        catch (err) {
          document.the_err = err;
          console.log(err.message);
        }
      }
  };

  function localDescCreated(desc) {
    self.pc.setLocalDescription(desc, function () {
      self.signalingChannel.send(JSON.stringify({
        'sdp': self.pc.localDescription
      }));
    }, loglocaldescCreatedError);
  } 

 function loglocaldescCreatedError(error) {
    console.log("Error sending local description to remote:" );
    console.log(error);
  }

  function logonmessageError(error) {
    console.log(error.name );
    console.log(error);
  }
  function logGetUserMediaError(error) {
    console.log(error.name );
    console.log(error);
  }

  

  function logonnegitaionneededError(error) {
    console.log(error.name );
    console.log(error);
  }

  function nutterError(error) {
    console.log("NUTTER ERROR! ");
    console.log(error);
  }

};

peersReceiver = function (message) {
  var  mess = JSON.parse(message);
  if (mess.user != gup("workerId"))  {
    Meteor.subscribe("audio", gup("session"), function () {
      
      console.log("RECEIVING message from: " +  mess.user);
      console.log(mess);
      au = Audio.findOne({workerId: mess.user, session: gup("session")});
      if (!(mess.user in currentSubscriptions)) {
        console.log("< first message from " + mess.user + " >");
        currentSubscriptions[mess.user] =  {audioId: au._id, time: au.time, signaledChannel: new SignaledConnection(gup("workerId"), mess.user)};
      }
      user = currentSubscriptions[mess.user]
      //user = currentSubscriptions.findOne({workerId: mess.user, session: gup("session")});
      //console.log ("< comparing time differences: > " +  currentSubscriptions[mess.user].time  + ' ' + au.time);
      //console.log ("Here is the signaled channel.")
      //console.log (user.signaledChannel);
      if (user.time != au.time) {
        console.log("REGISTERING TIME DIFF!")
        user.signaledChannel.close();
        user.signaledChannel.pc.close();
        user.signaledChannel = new SignaledConnection(gup("workerId"), mess.user);
      
        //user.signaledChannel.start();
        user.time =  au.time;
      }
      
      
      var evt = new CustomEvent('message');
      evt.data = message;
      user.signaledChannel.signalingChannel.onmessage(evt);   
  
   });
  }
};


  //var unconnected = 
 
Peers.on(gup("workerId") + "-" + gup("session"), peersReceiver);


if (gup("role") == "user") {

      
 $(document).ready(function () {
      Audio.find({session: gup("session")}).observeChanges({
        added: function(id, user) {
          console.log("ADDED participant: " + user.workerId + ", logged in at: " + user.time);
          //console.log(currentSubscriptions);
          //console.log(!user.workerId in currentSubscriptions);
          if (!(user.workerId in currentSubscriptions) && (user.role == "worker" || user.workerId < gup("workerId"))) {
            console.log("Adding new signaled connection.")
            sc = new SignaledConnection(gup("workerId"), user.workerId);
            currentSubscriptions[user.workerId] = {audioId: id, session: gup("session"), time: user.time, signaledChannel: sc};
            //Peers.on(user.workerId, peersReceiver);
            sc.start();
            
          } 
          // else wait to be contacted
          
        },
        
        changed: function (id, fields) {
          
          //console.log(fields);
          newer = Audio.findOne(id);
          //console.log("UPDATED: " + newer.workerId + ", ");
          if (newer.role == "worker" || newer.workerId < gup("workerId")) {
            
            console.log("UPDATED participant: " + newer.workerId + ", logged in at: " + newer.time);
          
            curr = currentSubscriptions[newer.workerId];
            //if (curr) { 
              
              curr.signaledChannel.close();
              user.signaledChannel.pc.close();
              user.signaledChannel = new SignaledConnection(gup("workerId"), newer.workerId);
      
              
              curr.time = fields.time;
            //}
            
            //console.log(newer.workerId + " < " + gup("workerId"));
            console.log ("RESTARTING Connection");
            curr.signaledChannel.start();
            
          
          }
        }
      });
  });
    
}
