// gameConfig.js
import MainMenuScene from '../scenes/MainMenuScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { LevelSelectScene } from '../scenes/LevelSelectScene.js';
import LevelIntroScene from '../scenes/LevelIntroScene.js';
import { DeathSequenceScene } from '../scenes/deathSequenceScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 750,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        MainMenuScene, 
        GameScene,
        LevelSelectScene,
        LevelIntroScene,
        DeathSequenceScene
    ]
};

export default config;
