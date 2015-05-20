"use strict";

var Horse = function (x, y) {

	this.animations = new createjs.Sprite(new createjs.SpriteSheet({
		"images": ["./ball.png"],
		"frames": {
			"width": 20,
			"height": 20,
			"count": 1
		},
		"animations": {
			"horse": {
				"frames": [0],
			}
		}
	}), "horse");

	this.animations.x = x;
	this.animations.y = y;

	this.scorePosition = x;

	gameStage.addChild(this.animations);

	this.updatePosition = function() {

		if (this.animations.x < this.scorePosition) {
			this.animations.x++
		}

		//this.animations.x += step * 10;
	}

	this.resetPosition = function() {
		this.animations.x = 10;
	}

}