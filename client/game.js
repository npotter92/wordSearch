var dictionary, adj, lastId, gameBoard;
var currentWord = "";
var currentNum = 0;
var wordLength = 0;
var playerScore = 0;
var opponentScore = 0;
var foundWords = [];
var scoreMoments = [];
var opponentScoreMoments = [];
var playerUserName = ""; 
var opponentName = "";
var secondsLeft = 61;
var wordStarted = false;
var playingGame = false;
var playingGhost = false;
var currentBoardNum = 0;
var currentOpponent;

var gameStage = new createjs.Stage("raceCanvas");
var rect = gameStage.canvas.getBoundingClientRect();

var playerHorse = new Horse(10, 20, "./playerHorse.png");
var ghostHorse = new Horse(10, 80, "./ghostHorse.png");

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
	playerHorse.resetPosition();
	playerScore = 0;
	ghostHorse.resetPosition();
	scoreMoments = [];

	showGameplay();
    $('.gameText').html("");

	$.get("readBoard", {}, function (response) {
		var boards = response.boards;
		if (playingGhost) {
			console.log("Playing on ghost's last board");
			currentBoardNum = currentOpponent.boardNum;
		} else {
			console.log("Playing on random board");
			currentBoardNum = response.boardNum;
		}
		console.log(currentBoardNum);
		gameBoard = boards[currentBoardNum];
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

	opponentName = $('.ghostPlayerSelect').find(":selected").val();
	if (opponentName !== "none") { // not playing against any player
		$.post("selectOpponent", 
			   {"user": opponentName},
			   function (resp_body) {
					if( resp_body.status) {
						opponentScoreMoments = JSON.parse(resp_body.opponentScoreMoments);
						currentOpponent = resp_body;
					} else {
						alert(resp_body.comment+
							  "\nGhost player is not available at this point.");
					}
			   }
		);
		playingGhost = true;
		ghostHorse.show();
	} else {
		playingGhost = false;
		ghostHorse.hide();
	}

	// position the player's horse based on wether or not a ghost race is happening
	playerHorse.changeY(playingGhost);

	$('.ghostPlayerSelect').empty()
    .append('<option selected value="none">I don\'t want to play against anyone.</option>');

	start();
}

function replay() {
	if (playingGhost) {
		opponentScoreMoments = [];
		$.post("selectOpponent", 
			   {"user": opponentName},
			   function (resp_body) {
					if( resp_body.status) {
						opponentScoreMoments = JSON.parse(resp_body.opponentScoreMoments);
					} else {
						alert(resp_body.comment+
							  "\nGhost player is not available at this point.");
					}
			   }
		);
	}

	start();
}


function timerInterval() {
	// Handle the game timer
    $('.timerText').html(--secondsLeft);

    // move the ghost
    for (var i=0; i<opponentScoreMoments.length; i++) {
    	if (secondsLeft == opponentScoreMoments[i].secondsLeft) {
    		opponentScore += opponentScoreMoments[i].score;
    		ghostHorse.scorePosition = opponentScore;
    		ghostHorse.run();
    	}
    }

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

        var raceResult;
        if (playerScore > opponentScore) {
        	raceResult = "won";
        } else if (playerScore < opponentScore) {
        	raceResult = "lost";
        } else {
        	raceResult = "tied";
        }

        if (!playingGhost) {
        	$("#gameResult").html("You found " + currentNum + " words for a score of " + playerScore + "!");
        } else {
        	$("#gameResult").html("<p>You found " + currentNum + " words for a score of " + playerScore + "!</p>" +
        						  "<p>You " + raceResult + " against your ghost racer!");
        }

        // send the array to server
        $.post("saveScoreMoments", 
        	   {"user": playerUserName, "scoreMoments": JSON.stringify(scoreMoments), "boardNum": currentBoardNum, "totalScore": playerScore},
        	   	function (resp_body) {
					if(!resp_body.status) {
						alert(resp_body.comment);
					}
				}
		);

		ghostHorse.resetPosition();
        playerHorse.resetPosition();
		playerScore = 0;
		opponentScore = 0;
        showGameOver();

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
		currentScore = wordLength * 10;
		currentNum++;
		playerScore += currentScore;
		$(".gameText").html("Score: " + playerScore);
		// add the word to the list of found words
		foundWords.push(currentWord);
		// move the player's horse forward
		playerHorse.scorePosition = playerScore;
		// call the horse's running animation
		playerHorse.run();
		// save the time and progress
		scoreMoments.push(new ScoreMoment(secondsLeft, currentScore));

	} else {
		// the sequence of letters isn't in the dictionary
		$(".alertText").html("Try again!");
	}

	eraseSelections();

}

var frameTick = function () {
	playerHorse.updatePosition();
	ghostHorse.updatePosition();
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