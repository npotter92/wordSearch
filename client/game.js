var dictionary, adj, lastId, gameBoard;
var currentWord = "";
var currentNum = 0;
var foundWords = [];
var secondsLeft = 61;
var wordStarted = false;
var playingGame = false;

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
	start();
}

function loginPlayer() {
	start();
}

function timerInterval() {
	// Handle the game timer
    $('.timerText').html(--secondsLeft);
    console.log(secondsLeft);
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
}

function enterWord() {
	// Check to see if the currently selected sequence of letters is a word
	if ($.inArray(currentWord, foundWords) > -1) {
		$(".alertText").html("Already entered '" + currentWord + "'!");
	} else if ($.inArray(currentWord, dictionary) > -1) {
		if (currentNum == 0) {
			currentNum++;
			$(".gameText").html("1 word found!");
		} else {
			currentNum++;
			$(".gameText").html(currentNum + " words found!");
		}
		$(".alertText").html("");
		foundWords.push(currentWord);
	} else {
		$(".alertText").html("Try again!");
	}

	eraseSelections();

}

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