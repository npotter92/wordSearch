var express = require("express"),
	http = require("http"),
    fs = require("fs"),
    mongoose = require('mongoose'),

	app;

// Create our Express-powered HTTP server.
// and have it listen on port 3000
app = express();
http.createServer(app).listen(3000);

// set up a static file directory to use for default routing 
app.use(express.static(__dirname + "/client"));

// tell Express to parse incoming JSON objects 
app.use(express.urlencoded());



// for mongoose connection 

mongoose.connect('mongodb://localhost/wordSearchDB');

mongoose.connection.on('connected', function () {
     console.log('Mongoose connected');
});

mongoose.connection.on('error',function (err) {
     console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
     console.log('Mongoose disconnected');
});


// create users collection

var UserSchema = mongoose.Schema({ user: String,
                                   password: String,
                                   history: [Date] // TODO what else should be included
                                 });

var User = mongoose.model("User", UserSchema);



// routes

app.get("/dictionary", function (req, res) {
	var dictionary = new Array();
	var text = fs.readFileSync("res/dictionary.txt", "utf-8");
	var words = text.split("\n");
	for(var i=0; i < words.length; i++) {
	    dictionary[i] = words[i].substring(0, words[i].length - 1);
	}
	result = {"dict": dictionary}	
	res.json(result);

});

app.get("/readBoard", function (req, res) {
	var boardsObj = JSON.parse(fs.readFileSync("res/boards.txt"));
	var boardNum = Math.floor(Math.random() * 2);
	var boards = boardsObj.boards;
	res.json({"boards":boards, "boardNum":boardNum});
})

app.post("/register.json", function (req, res) {
	var the_body = req.body;
	mongoCheckCredentialExistence(the_body, function (answer){
		if (answer.user === true) { 
			res.json({"status": false, "comment": "Username has been taken!"});
		} else {
			var u1 = new User({"user": the_body.user, "password": the_body.password});
			u1.save(function (err, data) {
				if (err != null) {
					res.json({"status": false, "comment": "Database error!"});
				} else {
				  	console.log("saved successfully! savd id: ", data._id);
					res.json({"status": true});
				}
			});
		}
	});
});

app.post("/login.json", function (req, res) {
	var the_body = req.body;
	mongoCheckCredentialExistence(the_body, function (answer){
		if (answer.user && answer.password) { 
			res.json({"status": true});
		} else {
			res.json({"status": false, "comment": "Login failed!"});
		}
	});
});

function mongoCheckCredentialExistence (credential, callback) {
	var user = credential.user;
	var password = credential.password;

	User.findOne({"user": user}, function(err, result){
		if(err) { // err indicates error; it does not indicate no result found
			callback({"err": err});
			return;
		}

		if (result) { // found the user
			if (result.password === password) {
				callback({"user": true, "password": true});
			} else {
				callback({"user": true, "password": false});
			}
		} else { // user is not found
			callback({"user": false, "password": false});
		}

	});

}
