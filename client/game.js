var dictionary, adj, lastId, gameBoard;
var currentWord = "";
var currentNum = 0;
var wordLength = 0;
var playerScore = 0;
var foundWords = [];
var scoreMoments = [];
var opponentScoreMoments = [];
var playerUserName = ""; 
var secondsLeft = 61;
var wordStarted = false;
var playingGame = false;

var gameStage = new createjs.Stage("raceCanvas");
var rect = gameStage.canvas.getBoundingClientRect();

var playerHorse = new Horse(10, 20, "./playerHorse.png");

var ScoreMoment = function(secondsLeft, score) {
	this.secondsLeft = secondsLeft;
	this.score = score;
}

function showGameOver() {
	$('.gameOverDiv').show();
	$('.selectOpponentDiv').hide();
	$('.gameplayDiv').hide();
	$('.loginDiv').hide();
}

function showGameplay() {
	$('.gameplayDiv').show();
	$('.gameOverDiv').hide();
	$('.loginDiv').hide();
	$('.selectOpponentDiv').hide();
}

function showLogin() {
	$('.loginDiv').show();
	$('.gameplayDiv').hide();
	$('.gameOverDiv').hide();
	$('.selectOpponentDiv').hide();
}

function showSelectOpponent() {
	$('.selectOpponentDiv').show();
	$('.loginDiv').hide();
	$('.gameplayDiv').hide();
	$('.gameOverDiv').hide();

	$.post("getPlayerList", {},
		   function (resp_body) {
		   		if (resp_body.status) {
		   			var userList = JSON.parse(resp_body.userList);
		   			for (var i = 0; i < userList.length; i++) {
		   				var user = userList[i];
		   				var $option = $("<option>").text(user).val(user);
		   				$(".ghostPlayerSelect").append($option);
		   			}
		   		} else {
		   			alert("Unable to retrieve ghost players! Server response: " + resp_body.comment);
		   		}
		   }
	);
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
	if ($("#username").val().trim().length === 0 || 
		$("#password").val().trim().length === 0) {
		return;
	}

	if ($("#username").val() === "none") { // set the option
		alert("Invalid username. Please choose another");
		return;
	}

	$.post( "register",
		    {"user": $("#username").val(), "password": $("#password").val()},
		    function (resp_body) {
				if( resp_body.status) {
					playerUserName = $("#username").val();
					showSelectOpponent(); //redirect to select user page
				} else {
					alert(resp_body.comment);
				}
			}
	);

}

function loginPlayer() {
	if ($("#username").val().trim().length === 0 || 
		$("#password").val().trim().length === 0) {
		return;
	}
	$.post( "login",
		    {"user": $("#username").val(), "password": $("#password").val()},
		    function (resp_body) {
				if( resp_body.status) {
					playerUserName = $("#username").val();
					showSelectOpponent(); //redirect to select user page
				} else {
					alert(resp_body.comment);
				}
			}
	);
}

function selectGhostPlayer() {
    opponentScoreMoments = []; // empty the array

	var playerName = $('.ghostPlayerSelect').find(":selected").val();
	if (playerName !== "none") { // not playing against any player
		$.post("selectOpponent", 
			   {"user": playerName},
			   function (resp_body) {
			   		console.log(resp_body);
					if( resp_body.status) {
						opponentScoreMoments = JSON.parse(resp_body.opponentScoreMoments);
					} else {
						alert(resp_body.comment+
							  "\nGhost player is not available at this point.");
					}
			   }
		);
	}

	$('.ghostPlayerSelect').empty()
    .append('<option selected value="none">I don\'t want to play against anyone.</option>');

	start();
}


function timerInterval() {
	// Handle the game timer
    $('.timerText').html(--secondsLeft);

    // Handle the clean-up task after a game is over
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
        $("#gameResult").html("You found " + currentNum + " words for a score of " + playerScore + "!");
        playerHorse.resetPosition();
		playerScore = 0;
        showGameOver();

        // send the array to server
        $.post("saveScoreMoments", 
        	   {"user": playerUserName, "scoreMoments": JSON.stringify(scoreMoments)},
        	   	function (resp_body) {
					if(!resp_body.status) {
						alert(resp_body.comment);
					}
				}
		);

    } else {
		setTimeout(timerInterval, 1000);
    }

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

		$(".alertText").html("");
		currentNum++;
		playerScore += wordLength * 10;
		$(".gameText").html("Score: " + playerScore);
		// add the word to the list of found words
		foundWords.push(currentWord);
		// move the player's horse forward
		playerHorse.scorePosition = playerScore;
		// call the horse's running animation
		playerHorse.run();
		// save the time and progress
		scoreMoments.push(new ScoreMoment(secondsLeft, playerHorse.scorePosition));

	} else {
		// the sequence of letters isn't in the dictionary
		$(".alertText").html("Try again!");
	}

	eraseSelections();

}

var frameTick = function () {
	playerHorse.updatePosition();
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