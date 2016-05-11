import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';
var options;
Template.startrecord.onCreated(function helloOnCreated() {
  // counter starts at 0
//  this.counter = new ReactiveVar(0);
    //URL
    options = decodeURIComponent(window.location.search.slice(1))
                      .split('&').reduce(function _reduce (/*Object*/ a, /*String*/ b) {
                        b = b.split('=');
                        a[b[0]] = b[1];
                        return a;
                      }, {});;
});


//Template.hello.helpers({
//  counter() {
//    return Template.instance().counter.get();
//  },
//});

var mediaStream = null;
//function captureUserMedia(success_callback) {
//    var session = {
//        audio: true
//    };
//    navigator.getUserMedia = (   navigator.getUserMedia
//                       || navigator.webkitGetUserMedia 
//                       || navigator.mozGetUserMedia 
//                       || navigator.msGetUserMedia);
//    
//    navigator.getUserMedia(session, success_callback, function(error) {
//        alert(JSON.stringify(error));
//    });
//}

//Captures Users audio and video (asks the user for access of the camera and microphone)
function captureUserMedia(success_callback) {
        var session = {
            audio: true,
            video: true
        };

        navigator.getUserMedia(session, success_callback, function(error) {
            alert(JSON.stringify(error));
        });
    }

//start button event (click button) and recording is initiated
Template.startrecord.events({
  'click button'(event, instance) {
      console.log("Start button clicked");
      //checks for all three parameters
      if (options.workerId && options.role && options.session){
          console.log(options);
          document.getElementById("start").disabled = true;
      captureUserMedia(function(stream) {
            mediaStream = stream;
            var audioConfig = {};
            audioRecorder = RecordRTC(stream, audioConfig);
            audioRecorder.startRecording();
            console.log("Recording started");
            // enable stop-recording button
            document.getElementById("stop").disabled = false;
          
        });
   //    Meteor.call('getCurrentTime',function(err, response) {
			// console.log(response);
   //    });
      } 
      //if all the 3 parameters are not provided
      else {
          alert("Please provide all 3 parameters (workerId, session and role)");
        document.getElementById("start").disabled = true;
        }
      console.log("Start button finished");
  },
});

//stop function
function onStopRecording() {
    audioRecorder.getDataURL(function(audioDataURL) {
        //takes the audio data
        var audio = {
            blob: audioRecorder.getBlob(),
            dataURL: audioDataURL
        }; 
         var fileName = options.workerId;
        // this object is used to allow submitting multiple recorded blobs
        var files = {};
        // recorded audio blob
        files.audio = {
            name: fileName + '.' + audio.blob.type.split('/')[1],
            type: audio.blob.type,
            contents: audio.dataURL
        };
        files.workerId = options.workerId;
            files.session = options.session;
        files.role = options.role;
        // console.log("Data:");
        // console.log(JSON.stringify(files));
        //promt from the server that the recording is saved
        Meteor.call('Data',JSON.stringify(files),function(err, response) {
			console.log(response);
      });
        if (mediaStream) mediaStream.stop();
        });
}

//stop button event
Template.stoprecord.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
//    instance.counter.set(instance.counter.get() + 1);
      console.log("Stop button clicked");
      document.getElementById("stop").disabled = true;
      //call goes to stop recording and is for stopping the recording
      audioRecorder.stopRecording(onStopRecording);
        console.log("Recording stoped");
            //enables start button
            document.getElementById("start").disabled = false;
          console.log("Stop button finished");
    // Meteor.call('getCurrentTime',function(err, response) {
			// console.log(response);
   //    });
  },
});