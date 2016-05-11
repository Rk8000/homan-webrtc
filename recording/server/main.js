import { Meteor } from 'meteor/meteor';

//runs when meteor starts
Meteor.startup(() => {
  // code to run on server at startup
  var audiodetails = new Meteor.Collection("audio_details");  
    //'fs' variable to write the file
    var fs = Npm.require('fs');
 Meteor.methods({
	  getCurrentTime: function () {
		console.log('on server, getCurrentTime called');
		return new Date();
	  },

    //data from the server is parsed in this function
	  Data: function (name) {
//		console.log('on server, welcome called with name: ', name);
		// if(name==undefined || name.length<=0) {
	 //      throw new Meteor.Error(404, "Please enter your name");
		// }
        //parsed data is saved in the files   
        var files = JSON.parse(name);  
        var file = files.audio;
          console.log("WorkerId: "+ files.workerId);
          console.log("Role: "+ files.role);
          console.log("Session: "+ files.session);
   
        //takes the file name, current directory and gives the path of the file where the audio is stored
        var fileRootName = file.name.split('.').shift(),
        fileExtension = file.name.split('.').pop(),
        filePathBase = process.env.PWD + '/uploads' + '/',
        fileRootNameWithBase = filePathBase + fileRootName,
        filePath = fileRootNameWithBase + '.' + fileExtension,
        fileID = 2,
        fileBuffer;
          console.log(filePath);
    //to check if the file exists or not, if it does not then it is incremented by 1
    while (fs.existsSync(filePath)) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }

    file.contents = file.contents.split(',').pop();

    //converts the file.contents to base64
    fileBuffer = new Buffer(file.contents, "base64");

    //writes the fileBuffer i.e. the audio file
    fs.writeFileSync(filePath, fileBuffer);
          var data = {};
          //4 parameters in data
          data.workerId = files.workerId;
          data.role = files.role;
          data.session = files.session;
          data.audiofile = filePath;
          
          //this inserts the data into mongodb
          audiodetails.insert(data);
          console.log("WorkerId: "+ files.workerId+", Role: "+ files.role+", Session: "+ files.session+", audiofile: "+filePath);
          
          console.log('Done');
          
	    return "Recording saved";
	  }
	});
});
