import config from './config/gameConfig.js';

// Create the game instance
const game = new Phaser.Game(config);

// Export game instance
window.game = game;

console.log('Game instance created:', game);