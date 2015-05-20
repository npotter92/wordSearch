"use strict";

var Horse = function (x, y, image) {

	this.animations = new createjs.Sprite(new createjs.SpriteSheet({
		"images": [image],
		"frames": {
			"width": 50,
			"height": 40,
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