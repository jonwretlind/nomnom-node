import { 
    initializeFirstLevel, 
    saveOriginalState, 
    createUI,
    updateScore,
    loseLife,
    createLivesDisplay,
    updateLivesDisplay
} from './helpers.js';
import { collectDot, collectPowerPill, hitEnemy, initializePathfinding } from './update.js';

export let lives = 3;
export let gameOver = false;

export function create() {
    console.log('Create function called', this);
    if (!this.physics || !this.physics.add) {
        console.error('Physics system is not properly initialized!');
        return;
    }
    console.log('Physics system:', this.physics); // This should not be undefined

    // Initialize UI elements
    createUI(this);

    // Initialize game object groups
    this.walls = this.physics.add.staticGroup();
    this.energyDots = this.physics.add.staticGroup();
    this.powerPills = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();

    // Create and animate the player sprite
    this.player = this.physics.add.sprite(120, 120, 'player')
        .setDisplaySize(64, 64)
        .setCollideWorldBounds(true);

    // Adjust the size of the player's collider
    this.player.body.setSize(45, 32);
    this.player.body.setOffset(10, 10);

    // Create animations
    createAnimations(this);

    this.player.play('move');

    // Initialize keyboard input for movement
    this.cursors = this.input.keyboard.createCursorKeys();

    // Initialize the score and lives
    this.score = 0;
    this.lives = lives;

    // Initialize lives display
    createLivesDisplay(this);

    // Initialize the first level
    initializeFirstLevel(this)
        .then(() => {
            console.log('First level initialized.');
            saveOriginalState(this);
            createDots(this);
            createEnemies(this);
        })
        .catch((error) => {
            console.error('Error initializing the first level:', error);
        });

    // Set up physics interactions
    this.physics.add.overlap(this.player, this.energyDots, collectDot, null, this);
    this.physics.add.overlap(this.player, this.powerPills, collectPowerPill, null, this);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.player, this.enemies, hitEnemy, null, this);

    // Initialize score and lives displays
    updateScore(this);
    updateLivesDisplay(this);

    // Create particle manager for disintegration effect
    this.particles = this.add.particles('particle');

    initializePathfinding(this);

    console.log('Game scene created.');
}

function createAnimations(scene) {
    // Player animations
    scene.anims.create({
        key: 'move',
        frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'death',
        frames: scene.anims.generateFrameNumbers('deadHippo', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    // Enemy animations
    scene.anims.create({
        key: 'bee-move',
        frames: scene.anims.generateFrameNumbers('bee', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'gator-move',
        frames: scene.anims.generateFrameNumbers('gator', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    scene.anims.create({
        key: 'lion-move',
        frames: scene.anims.generateFrameNumbers('lion', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });
}

function createDots(scene) {
    const dotSpacingX = 76;
    const dotSpacingY = 78;
    const dotSize = 14;
    const powerPillSize = 45;
    let dotCounter = 0;

    const { width, height } = scene.scale;

    for (let x = 50; x < width - 50; x += dotSpacingX) {
        for (let y = 50; y < height - 50; y += dotSpacingY) {
            if (!isOverlappingWall(scene, x, y, scene.walls, dotSize)) {
                dotCounter++;

                if (dotCounter % scene.ppSpacing === 0) {
                    const powerPill = scene.powerPills.create(x, y, 'powerPill');
                    powerPill.setDisplaySize(powerPillSize, powerPillSize);
                    powerPill.setDepth(0);
                    powerPill.refreshBody();
                } else {
                    const dot = scene.energyDots.create(x, y, 'energyDot');
                    dot.setDisplaySize(dotSize, dotSize);
                    dot.setDepth(0);
                    dot.refreshBody();
                }
            }
        }
    }
}

function isOverlappingWall(scene, x, y, walls, dotSize) {
    const dotRect = new Phaser.Geom.Rectangle(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
    return walls.getChildren().some(wall => {
        return Phaser.Geom.Intersects.RectangleToRectangle(dotRect, wall.getBounds());
    });
}

function createEnemies(scene) {
    if (!scene.currentLevel || !scene.currentLevel.enemies) {
        console.error('No enemy data found for the current level');
        return;
    }

    console.log('Creating enemies:', scene.currentLevel.enemies);

    scene.currentLevel.enemies.forEach(enemyData => {
        for (let i = 0; i < enemyData.numberOf; i++) {
            const randomOffsetX = Phaser.Math.Between(-50, 50);
            const randomOffsetY = Phaser.Math.Between(-50, 50);
            const x = enemyData.x + randomOffsetX;
            const y = enemyData.y + randomOffsetY;

            const enemy = scene.enemies.create(x, y, enemyData.type)
                .setCollideWorldBounds(true);

            enemy.play(`${enemyData.type}-move`);
            enemy.speed = enemyData.speed;
            enemy.setDisplaySize(enemyData.width, enemyData.height);

            enemy.body.setSize(enemyData.width * 0.8, enemyData.height * 0.8);
            enemy.body.setOffset(enemyData.width * 0.1, enemyData.height * 0.1);

            // Store initial positions
            enemy.startX = x;
            enemy.startY = y;

            console.log(`Created enemy: ${enemyData.type} at (${x}, ${y})`);
        }
    });
}
