var express = require("express"),
	 http = require("http"),
     fs = require("fs"),
	 app;

// Create our Express-powered HTTP server
// and have it listen on port 3000
app = express();
http.createServer(app).listen(3000);

// set up a static file directory to use for default routing 
app.use(express.static(__dirname + "/client"));

// tell Express to parse incoming JSON objects 
app.use(express.urlencoded());

// routes

app.get("/dictionary", function (req, res) {
	var dictionary = new Array();
	var text = fs.readFileSync("dictionary.txt", "utf-8");
	var words = text.split("\n");
	for(var i=0; i < words.length; i++) {
	    dictionary[i] = words[i].substring(0, words[i].length - 1);
	}
	result = {"dict": dictionary}	
	res.json(result);

});

app.get("/readBoard", function (req, res) {
	var boardsObj = JSON.parse(fs.readFileSync("boards.txt"));
	var boardNum = Math.floor(Math.random() * 2);
	var boards = boardsObj.boards;
	res.json({"boards":boards, "boardNum":boardNum});
})