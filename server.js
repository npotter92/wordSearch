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
                                   scoreMoments: String,
                                   boardNum: Number,
                                   highScore: Number // TODO what else should be included
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
	var boardNum = Math.floor(Math.random() * 8);
	var boards = boardsObj.boards;
	res.json({"boards":boards, "boardNum":boardNum});
})

app.post("/register", function (req, res) {
	var the_body = req.body;
	mongoCheckCredentialExistence(the_body, function (answer){
		if (answer.user === true) { 
			res.json({"status": false, "comment": "Username has been taken!"});
		} else {
			var u1 = new User({"user": the_body.user, "password": the_body.password, "highScore": 0});
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

app.post("/login", function (req, res) {
	var the_body = req.body;
	mongoCheckCredentialExistence(the_body, function (answer){
		if (answer.user && answer.password) { 
			res.json({"status": true});
		} else {
			res.json({"status": false, "comment": "Login failed!"});
		}
	});
});

app.post("/getPlayerList", function (req, res) {
	User.find({}).exec(
		function (err, documents){
			if(err) { 
				res.json({"status": false, "comment": ("Database error: " + err)});
				return;
			}

			// adding all users that have played at least once
			var userList = [];
			for(var i=0;i<documents.length;i++){
				if (documents[i].scoreMoments) {
					userList.push(documents[i].user);
				}
			}
			res.json({"status": true, "userList": JSON.stringify(userList)});
		}
	)
});

app.post("/selectOpponent", function (req, res) {
	var user = req.body.user;

	User.findOne({"user": user}, 
		function(err, result) {
			if(err) { 
				res.json({"status": false, "comment": ("Database error: " + err)});
				return;
			}

			if (result) {
				if (result.scoreMoments) {
					res.json({"status": true, "opponentScoreMoments": result.scoreMoments, "boardNum": result.boardNum});
				} else {
					res.json({"status": false, "comment": "The user has no game data."});
				}
			} else { // unlikely to happen
				res.json({"status": false, "comment": "Can not find the user."});
			}
		}
	);
});

app.post("/saveScoreMoments", function (req, res) {
	var the_body = req.body;
	var user = the_body.user;
	var newScoreMoments = JSON.parse(the_body.scoreMoments); // an array of score moments
	var newBoardNum = JSON.parse(the_body.boardNum);
	var score = JSON.parse(the_body.totalScore);

	User.findOne({"user": user}, function(err, result) {
		if(err) { 
			res.json({"status": false, "comment": ("Database error: " + err)});
			return;
		}

		if (result) {
			console.log(score, result.highScore);
			if (score > result.highScore) {
				result.update(
					{"scoreMoments": the_body.scoreMoments, "boardNum": the_body.boardNum, "highScore": score},
					function (err, id) {
						if (err) {
							res.json({"status": false, "comment": ("Database error: " + err)});
						}
					}
				);
				res.json({"status": true, "newHighScore": true});
			} else {
				res.json({"status": true, "newHighScore": false});
			}

		} else {
			res.json({"status": false, "comment": "current user's information is not in the database!"});
		}
	})

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
