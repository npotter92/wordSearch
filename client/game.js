var dictionary, adj, lastId, gameBoard;
var currentWord = "";
var currentNum = 0;
var wordLength = 0;
var foundWords = [];
var secondsLeft = 61;
var wordStarted = false;
var playingGame = false;

var gameStage = new createjs.Stage("raceCanvas");
var rect = gameStage.canvas.getBoundingClientRect();

var playerHorse = new Horse(10, 20);


function showGameOver() {
	$('.gameOverDiv').show();
	$('.gameplayDiv').hide();
	$('.loginDiv').hide();
}

function showGameplay() {
	$('.gameplayDiv').show();
	$('.gameOverDiv').hide();
	$('.loginDiv').hide();
}

function showLogin() {
	$('.loginDiv').show();
	$('.gameplayDiv').hide();
	$('.gameOverDiv').hide();
}

function loadDictionary() {
	// Load in the dictionary file and call main once complete
	$.get("dictionary", {}, function (response) {
    	dictionary = response.dict;
    	main();
	});

}

function start() {
	// Reset everything and start a new game

	currentWord = "";
	currentNum = 0;
	foundWords = [];
	secondsLeft = 61;
	wordStarted = false;
	playingGame = true;

	showGameplay();
    $('.gameText').html("");

	$.get("readBoard", {}, function (response) {
		var boards = response.boards;
		var boardNum = response.boardNum;
		gameBoard = boards[boardNum];
		// TODO FILL IN BOARD
		for (var i=0; i<16; i++) {
			$(".gameTable tr td a span").toArray().forEach(function (element) {
				var $gameSpace = $(element);
				if (parseInt($gameSpace.attr('id')) == i) {
					$gameSpace.html(gameBoard[i]);
				}
			});
		}
    	timerInterval();
    	eraseSelections();
	});
}

function createPlayer() {
	$.post( "register.json",
		    {"user": $("#username").val(), "password": $("#password").val()},
		    function registrationHandler(resp_body) {
				if( resp_body.status) {
					start(); //redirect to main app page
				} else {
					alert(resp_body.comment);
				}
			}
	);

}

function loginPlayer() {
	$.post( "login.json",
		    {"user": $("#username").val(), "password": $("#password").val()},
		    function registrationHandler(resp_body) {
				if( resp_body.status) {
					start(); //redirect to main app page
				} else {
					alert(resp_body.comment);
				}
			}
	);
}

function timerInterval() {
	// Handle the game timer
    $('.timerText').html(--secondsLeft);
    if (secondsLeft <= 0) {
    	playingGame = false;
    	$(".gameTable tr td a span").toArray().forEach(function (element) {
			var $gameSpace = $(element);
			$gameSpace.removeClass("clicked");
		});
        $('.timerText').html("");
        $('.gameText').html("");
        $('.alertText').html("");
        $(".currentWord").html("");
        $("#gameResult").html("You found " + currentNum + " words!");
        playerHorse.resetPosition();
        showGameOver();

        clearInterval(interval);
    }

    setTimeout(timerInterval, 1000)
}

function eraseSelections() {
	// Erase the currently selected letters and start a new word
	$(".gameTable tr td a span").toArray().forEach(function (element) {
		var $gameSpace = $(element);
		$gameSpace.removeClass("clicked");
	});
	currentWord = "";
	$(".currentWord").html(currentWord);
	wordStarted = false;
	wordLength = 0;
}

function enterWord() {
	// Check to see if the currently selected sequence of letters is a word
	if ($.inArray(currentWord, foundWords) > -1) {
		// the word has already been found
		$(".alertText").html("Already entered '" + currentWord + "'!");
	} else if ($.inArray(currentWord, dictionary) > -1) {
		// a new word has been found!
		if (currentNum == 0) {
			currentNum++;
			$(".gameText").html("1 word found!");
		} else {
			currentNum++;
			$(".gameText").html(currentNum + " words found!");
		}
		$(".alertText").html("");

		// add the word to the list of found words
		foundWords.push(currentWord);
		// move the player's ball forward
		playerHorse.updatePosition(wordLength);

	} else {
		// the sequence of letters isn't in the dictionary
		$(".alertText").html("Try again!");
	}

	eraseSelections();

}

var frameTick = function () {
	gameStage.update();
};

function main() {
	// Event handling
	var clicked = [];

	$(".gameTable tr td a span").toArray().forEach(function (element) {

		var $gameSpace = $(element);

		$gameSpace.on("click", function() {

			var $letter = $gameSpace.html().toLowerCase();

			adj = $gameSpace.data('adj');
			lastId = parseInt($(".lastClicked").attr("id"));

			if ((((! $gameSpace.hasClass("clicked")) && ($.inArray(lastId, adj) > -1)) || (wordStarted == false)) && playingGame) {
				$(".gameTable tr td a span").removeClass("lastClicked");
				$gameSpace.addClass("lastClicked")
				$gameSpace.addClass("clicked");
				currentWord += $letter;
				wordLength++;
				$(".currentWord").html(currentWord);
				if (wordStarted == false) {
					wordStarted = true;
					$(".alertText").html("");
				}
			}

		});

	});

}

$(document).ready(loadDictionary());
createjs.Ticker.addEventListener("tick", frameTick);
createjs.Ticker.setFPS(60);