const mongoose = require('mongoose');

const LevelSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  name: { type: String, required: true },
  ppSpacing: { type: Number, default: 15 },
  terrain: [{
    type: { type: String },
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    properties: {
      flowDirection: String,
      flowSpeed: Number,
      playerSpeedMultiplier: Number
    }
  }],
  maze: [[Number]],
  powerPills: [{
    x: Number,
    y: Number,
    value: { type: Number, default: 10 }
  }],
  powerUps: [{
    type: { type: String },
    x: Number,
    y: Number,
    duration: Number,
    multiplier: Number
  }],
  enemies: [{
    type: { type: String },
    x: Number,
    y: Number,
    speed: Number,
    width: Number,
    height: Number,
    numberOf: Number,
    properties: {
      canCrossWater: Boolean,
      flightHeight: Number,
      attackPattern: String,
      waterSpeedBonus: Number,
      landSpeedPenalty: Number,
      roarRadius: Number,
      stunDuration: Number
    }
  }],
  exit: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  respawnPoints: [{
    x: Number,
    y: Number
  }]
});

module.exports = mongoose.model('Level', LevelSchema); 