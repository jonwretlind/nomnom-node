// gameConfig.js
import MainMenuScene from './mainMenuScene.js';
import LevelIntroScene from './levelIntroScene.js';
import GameScene from './gameScene.js';
import PauseScene from './pauseScene.js';
import DeathSequenceScene from './deathSequenceScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1025,
    height: 775,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [MainMenuScene, LevelIntroScene, GameScene, PauseScene, DeathSequenceScene]
};

export default config;
