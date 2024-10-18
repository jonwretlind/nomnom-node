// create.js
import { loadLevels, createUI, saveOriginalState, clearGameObjects } from './helpers.js';
import { collectDot, collectPowerPill, hitEnemy } from './update.js';

export let player, walls, energyDots, powerPills, enemies, cursors;
export let score = 0, lives = 3, gameOver = false;
export let currentLevelIndex = 0;
let levels;

export async function create() {
    createUI(this);

    walls = this.physics.add.staticGroup();
    energyDots = this.physics.add.staticGroup();
    powerPills = this.physics.add.staticGroup();
    enemies = this.physics.add.group();

    player = this.physics.add.sprite(120, 120, 'player').setDisplaySize(64, 64).setCollideWorldBounds(true);
    cursors = this.input.keyboard.createCursorKeys();

    levels = await loadLevels();
    loadCurrentLevel(this);

    this.physics.add.overlap(player, energyDots, collectDot, null, this);
    this.physics.add.overlap(player, powerPills, collectPowerPill, null, this);
    this.physics.add.collider(player, enemies, hitEnemy, null, this);

    saveOriginalState(this);
}

function loadCurrentLevel(scene) {
    clearGameObjects();
    const level = levels[currentLevelIndex];

    level.maze.forEach(([x, y, width, height]) => {
        createWall(scene, x, y, width, height);
    });

    scene.ppSpacing = level.ppSpacing;
}

function createWall(scene, x, y, width, height) {
    const brickSize = 25;
    for (let i = 0; i < Math.ceil(width / brickSize); i++) {
        for (let j = 0; j < Math.ceil(height / brickSize); j++) {
            const brick = scene.walls.create(x + i * brickSize + brickSize / 2, y + j * brickSize + brickSize / 2, 'brick');
            brick.setDisplaySize(brickSize, brickSize).setOrigin(0.5).refreshBody();
        }
    }
}
