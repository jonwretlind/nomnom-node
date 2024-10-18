// gameConfig.js
const config = {
    type: Phaser.AUTO,
    width: 1025,
    height: 775,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload, create, update }
};

export default config;
