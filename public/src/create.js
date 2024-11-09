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
    console.log('Physics system:', this.physics);

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

// Export the functions we need
export function createAnimations(scene) {
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

export function createEnemies(scene) {
    if (!scene.currentLevel || !scene.currentLevel.enemies) {
        console.error('No enemy data found for the current level');
        return;
    }

    console.log('Creating enemies:', scene.currentLevel.enemies);

    // Don't recreate if we already have enemies
    if (scene.enemies.getChildren().length > 0) {
        console.log('Enemies already exist, skipping creation');
        return;
    }

    scene.currentLevel.enemies.forEach(enemyData => {
        const x = Math.round(enemyData.x / 25) * 25;
        const y = Math.round(enemyData.y / 25) * 25;

        console.log(`Creating enemy of type ${enemyData.type} at position:`, x, y);

        const enemy = scene.physics.add.sprite(x, y, enemyData.type)
            .setCollideWorldBounds(true);

        // Set enemy properties
        enemy.play(`${enemyData.type}-move`);
        enemy.speed = enemyData.speed || 100;
        
        // Explicitly initialize enemy state to not vulnerable
        enemy.vulnerable = false;
        enemy.setTint(0xffffff);  // Reset tint to normal
        
        // Set size based on enemy type
        switch(enemyData.type) {
            case 'bee':
                enemy.setDisplaySize(35, 30);
                enemy.body.setSize(28, 24);
                enemy.body.setOffset(3, 3);
                break;
            case 'gator':
                enemy.setDisplaySize(80, 72);
                enemy.body.setSize(64, 58);
                enemy.body.setOffset(8, 7);
                break;
            case 'lion':
                enemy.setDisplaySize(62, 72);
                enemy.body.setSize(50, 58);
                enemy.body.setOffset(6, 7);
                break;
        }

        // Store initial positions
        enemy.startX = x;
        enemy.startY = y;
        
        // Set initial velocity using physics body
        enemy.body.velocity.x = Phaser.Math.Between(-enemy.speed, enemy.speed);
        enemy.body.velocity.y = Phaser.Math.Between(-enemy.speed, enemy.speed);

        // Add to physics group
        scene.enemies.add(enemy);

        console.log(`Created enemy: ${enemyData.type} at (${x}, ${y}) with vulnerable state:`, enemy.vulnerable);
    });
}
