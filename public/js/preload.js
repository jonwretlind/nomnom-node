// js/preload.js
export function preload() {
    this.load.image('brick', 'img/bricks.png');
    this.load.image('energyDot', 'img/alephdot.png');
    this.load.image('powerPill', 'img/power-pill.png');
    this.load.spritesheet('player', 'img/hippo.png', { frameWidth: 59, frameHeight: 53 });
    this.load.spritesheet('deadHippo', 'img/deadHippo.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('bee', 'img/bee.png', { frameWidth: 35, frameHeight: 30 });
    this.load.spritesheet('gator', 'img/gator.png', { frameWidth: 80, frameHeight: 72 });
    this.load.spritesheet('lion', 'img/lion.png', { frameWidth: 62, frameHeight: 72 });
}
