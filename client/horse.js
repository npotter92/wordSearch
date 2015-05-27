"use strict";

var Horse = function (x, y, image) {

	this.animations = new createjs.Sprite(new createjs.SpriteSheet({
		"images": [image],
		"frames": {
			"width": 50,
			"height": 42,
			"count": 4
		},
		"animations": {
			'stand': [0],
			'run': [0, 3, 'run', 0.25]
		}
	}), 'stand');

	this.animations.x = x;
	this.animations.y = y;

	this.scorePosition = x;

	gameStage.addChild(this.animations);

	this.changeY = function(ghostRacer) {
		if (ghostRacer == true) {
			this.animations.y = 20;
		} else {
			this.animations.y = 50;
		}
	}

	this.run = function() {
		this.animations.gotoAndPlay('run');
	}

	this.stand = function() {
		this.animations.gotoAndPlay('stand');
	}

	this.hide = function() {
		this.animations.visible = false;
	}

	this.show = function() {
		this.animations.visible = true;
	}

	this.updatePosition = function() {

		if (this.animations.x < this.scorePosition) {
			this.animations.x++;
		} else {
			// The horse has finished moving, return to the standing animation
			this.animations.gotoAndPlay('stand');
		}


	}

	this.resetPosition = function() {
		this.animations.x = 10;
		this.scorePosition = 10;
	}

}