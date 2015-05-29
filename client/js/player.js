var ScoreMoment = function(secondsLeft, score) {
	this.secondsLeft = secondsLeft;
	this.score = score;
}

var Player = function (x, y, image) {
	
	this.currentWord = "";
	this.currentNum = 0;
	this.wordLength = 0;
	this.wordStarted = false;
	this.score = 0;
	this.foundWords = [];
	this.scoreMoments = [];
	this.userName = "";
	this.horse = new Horse(x, y, image);

	this.startFresh = function() {
		this.currentWord = "";
		this.currentNum = 0;
		this.wordLength = 0;
		this.wordStarted = false;
		this.score = 0;
		this.foundWords = [];
		this.scoreMoments = [];
	}

}