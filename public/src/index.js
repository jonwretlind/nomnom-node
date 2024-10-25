// index.js
import GameScene from './gameScene.js';
import config from './gameConfig.js';

window.onload = () => {
    const game = new Phaser.Game(config);
    console.log('Game instance created:', game);
    
    // Manually start the MainMenuScene after a short delay
    setTimeout(() => {
        game.scene.start('MainMenuScene');
        console.log('MainMenuScene started manually');
    }, 100);
};
