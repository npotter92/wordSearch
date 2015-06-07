var express = require("express"),
	http = require("http"),
    fs = require("fs"),
    
    // for ne database
    Nedb = require('nedb'),
	users = new Nedb({ filename: './nedb.txt', autoload: true }),

	app;

// Create our Express-powered HTTP server.
// and have it listen on port 3000
app = express();
http.createServer(app).listen(3000);

// set up a static file directory to use for default routing 
app.use(express.static(__dirname + "/client"));

// tell Express to parse incoming JSON objects 
app.use(express.urlencoded());

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
	checkCredentialExistence(the_body, function (answer){
		if (answer.user === true) { 
			res.json({"status": false, "comment": "Username has been taken!"});
		} else {
			users.insert(
				{"user": the_body.user, "password": the_body.password, "highScore": 0}, 
				function (err, data) {
					if (err != null) {
						res.json({"status": false, "comment": "Database error!"});
					} else {
					  	console.log("saved successfully! savd id: ", data._id);
						res.json({"status": true});
					}
				}
			);
		}
	});
});

app.post("/login", function (req, res) {
	var the_body = req.body;
	checkCredentialExistence(the_body, function (answer){
		if (answer.user && answer.password) { 
			res.json({"status": true});
		} else {
			res.json({"status": false, "comment": "Login failed!"});
		}
	});
});

app.post("/getPlayerList", function (req, res) {
	users.find({}).exec(
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

app.post("/getTopPlayers", function (req, res) {
	users.find({}).sort({ highScore: -1 }).limit(10).exec(
		function (err, documents){
			if(err) { 
				res.json({"status": false, "comment": ("Database error: " + err)});
				return;
			}

			var numberOfTopPlayers= documents.length < 10 ? documents.length : 10;
			var topPlayerInformation = [];
			for (var i = 0; i < numberOfTopPlayers; i++) {
				topPlayerInformation.push(documents[i].user);
				topPlayerInformation.push(documents[i].highScore);
			}
			res.json({"status": true, "topPlayers": JSON.stringify(topPlayerInformation)});
		}
	);
});

app.post("/selectOpponent", function (req, res) {
	var user = req.body.user;

	users.findOne({"user": user}, 
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

	users.findOne({"user": user}, function(err, result) {
		if(err) { 
			res.json({"status": false, "comment": ("Database error: " + err)});
			return;
		}

		if (result) {
			if (score > result.highScore) {
				users.update({"_id": result._id}, 
					{$set: {"scoreMoments": the_body.scoreMoments, "boardNum": the_body.boardNum, "highScore": score} },
					{upsert: true},
					function (err, numReplaced) {
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


function checkCredentialExistence (credential, callback) {
	var user = credential.user;
	var password = credential.password;

	users.findOne({"user": user}, function(err, result){
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

