"use strict";

// set up globals
var dictionary, adj, lastId, gameBoard, currentOpponent, currentScore;
var secondsLeft = 61;
var playingGame = false;
var playingGhost = false;
var currentBoardNum = 0;

var gameStage = new createjs.Stage("raceCanvas");
var rect = gameStage.canvas.getBoundingClientRect();

var player = new Player(10, 20, "images/playerHorse.png");
var ghost = new Player(10, 80, "images/ghostHorse.png");

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

	player.startFresh();

	secondsLeft = 61;
	playingGame = true;

	showGameplay();
    $('.gameText').html("");

	$.get("readBoard", {}, function (response) {
		var boards = response.boards;
		if (playingGhost) {
			currentBoardNum = currentOpponent.boardNum;
		} else {
			currentBoardNum = response.boardNum;
		}
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
					player.userName = $("#username").val();
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
					player.userName = $("#username").val();
					showSelectOpponent(); //redirect to select user page
				} else {
					alert(resp_body.comment);
				}
			}
	);
}

function selectGhostPlayer() {
    ghost.scoreMoments = []; // empty the array

	ghost.userName = $('.ghostPlayerSelect').find(":selected").val();
	if (ghost.userName !== "none") { // not playing against any player
		$.post("selectOpponent", 
			   {"user": ghost.userName},
			   function (resp_body) {
					if( resp_body.status) {
						ghost.scoreMoments = JSON.parse(resp_body.opponentScoreMoments);
						currentOpponent = resp_body;
					} else {
						alert(resp_body.comment+
							  "\nGhost player is not available at this point.");
					}
			   }
		);
		playingGhost = true;
		ghost.horse.show();
	} else {
		playingGhost = false;
		ghost.horse.hide();
	}

	// position the player's horse based on wether or not a ghost race is happening
	player.horse.changeY(playingGhost);

	$('.ghostPlayerSelect').empty()
    .append('<option selected value="none">I don\'t want to play against anyone.</option>');

	start();
}

function replay() {
	if (playingGhost) {
		ghost.scoreMoments = [];
		$.post("selectOpponent", 
			   {"user": ghost.userName},
			   function (resp_body) {
					if( resp_body.status) {
						ghost.scoreMoments = JSON.parse(resp_body.opponentScoreMoments);
					} else {
						alert(resp_body.comment+
							  "\nGhost player is not available at this point.");
					}
			   }
		);
	}

	start();
}

function logout() {
	$('#username').val("");
	$('#password').val("");
	$('.ghostPlayerSelect').empty().append('<option selected value="none">I don\'t want to play against anyone.</option>');
	showLogin();
}


function timerInterval() {
	// Handle the game timer
    $('.timerText').html(--secondsLeft);

    // move the ghost
    for (var i=0; i<ghost.scoreMoments.length; i++) {
    	if (secondsLeft == ghost.scoreMoments[i].secondsLeft) {
    		ghost.score += ghost.scoreMoments[i].score;
    		ghost.horse.scorePosition = ghost.score;
    		ghost.horse.run();
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
        if (player.score > ghost.score) {
        	raceResult = "won";
        } else if (player.score < ghost.score) {
        	raceResult = "lost";
        } else {
        	raceResult = "tied";
        }

        if (!playingGhost) {
        	if (player.currentNum != 1) $("#gameResult").html("You found " + player.currentNum + " words for a score of " + player.score + "!");
        	else $("#gameResult").html("You found " + player.currentNum + " word for a score of " + player.score + "!");
        } else {
        	if (player.currentNum != 1) {
        		$("#gameResult").html("<p>You found " + player.currentNum + " words for a score of " + player.score + "!</p>" +
        						  	  "<p>You " + raceResult + " against " + ghost.userName + "!");
        	} else {
        		$("#gameResult").html("<p>You found " + player.currentNum + " word for a score of " + player.score + "!</p>" +
        						  	  "<p>You " + raceResult + " against " + ghost.userName + "!");
        	}
        }

        // send the array to server
        $.post("saveScoreMoments", 
        	   {"user": player.userName, "scoreMoments": JSON.stringify(player.scoreMoments), "boardNum": currentBoardNum, "totalScore": player.score},
        	   	function (resp_body) {
					if(!resp_body.status) {
						alert(resp_body.comment);
					}
					if (resp_body.newHighScore) {
						$('#gameResult').append("<p>You set a new personal high score!</p>");
					}
				}
		);

		ghost.horse.resetPosition();
        player.horse.resetPosition();
		player.score = 0;
		ghost.score = 0;
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
	player.currentWord = "";
	$(".currentWord").html(player.currentWord);
	player.wordStarted = false;
	player.wordLength = 0;
}

function enterWord() {
	// Check to see if the currently selected sequence of letters is a word
	if ($.inArray(player.currentWord, player.foundWords) > -1) {
		// the word has already been found
		$(".alertText").html("Already entered '" + player.currentWord + "'!");
	} else if ($.inArray(player.currentWord, dictionary) > -1) {
		
		// a new word has been found!

		$(".alertText").html("");
		currentScore = player.wordLength * 10;
		player.currentNum++;
		player.score += currentScore;
		$(".gameText").html("Score: " + player.score);
		// add the word to the list of found words
		player.foundWords.push(player.currentWord);
		// move the player's horse forward
		player.horse.scorePosition = player.score;
		// call the horse's running animation
		player.horse.run();
		// save the time and progress
		player.scoreMoments.push(new ScoreMoment(secondsLeft, currentScore));

	} else {
		// the sequence of letters isn't in the dictionary
		$(".alertText").html("Try again!");
	}

	eraseSelections();

}

var frameTick = function () {
	player.horse.updatePosition();
	ghost.horse.updatePosition();
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

			if ((((! $gameSpace.hasClass("clicked")) && ($.inArray(lastId, adj) > -1)) || (player.wordStarted == false)) && playingGame) {
				$(".gameTable tr td a span").removeClass("lastClicked");
				$gameSpace.addClass("lastClicked")
				$gameSpace.addClass("clicked");
				player.currentWord += $letter;
				player.wordLength++;
				$(".currentWord").html(player.currentWord);
				if (player.wordStarted == false) {
					player.wordStarted = true;
					$(".alertText").html("");
				}
			}

		});

	});

}

$(document).ready(loadDictionary());
createjs.Ticker.addEventListener("tick", frameTick);
createjs.Ticker.setFPS(60);