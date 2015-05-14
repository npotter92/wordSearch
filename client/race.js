"use strict";

var gameStage = new createjs.Stage("raceCanvas");
var rect = gameStage.canvas.getBoundingClientRect();

var Ball = function (x, y) {

	this.animations = new createjs.Sprite(new createjs.SpriteSheet({
		"images": ["./ball.png"],
		"frames": {
			"width": 20,
			"height": 20,
			"count": 1
		},
		"animations": {
			"ball": {
				"frames": [0],
			}
		}
	}), "ball");

	this.animations.x = x;
	this.animations.y = y;

	gameStage.addChild(this.animations);

}

var playerBall = new Ball(10, 20);

function movePlayer(step) {
	playerBall.animations.x += step * 10;
}

function resetBalls() {
	playerBall.animations.x = 10;
}

var frameTick = function () {
	gameStage.update();
};

$(document).ready(loadDictionary());
createjs.Ticker.addEventListener("tick", frameTick);
createjs.Ticker.setFPS(60);