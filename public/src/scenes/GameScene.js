import { createEnemies, createAnimations } from '../create.js';
import { collectDot, collectPowerPill, hitEnemy, initializePathfinding, update as updateGameState } from '../update.js';
import { createUI, updateScore, loseLife, updateLivesDisplay } from '../helpers.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load only the essential sprite sheets
        this.load.spritesheet('player', '/assets/hippo.png', {
            frameWidth: 59,
            frameHeight: 53
        });

        this.load.spritesheet('deadHippo', '/assets/deadHippo.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.spritesheet('bee', '/assets/bee.png', {
            frameWidth: 35,
            frameHeight: 30
        });

        this.load.spritesheet('gator', '/assets/gator.png', {
            frameWidth: 80,
            frameHeight: 72
        });

        this.load.spritesheet('lion', '/assets/lion.png', {
            frameWidth: 62,
            frameHeight: 72
        });

        // Load basic images
        this.load.image('wall', '/assets/bricks.png');
        this.load.image('energyDot', '/assets/alephdot.png');
        this.load.image('powerPill', '/assets/power-pill.png');
        this.load.image('particle', '/assets/particle.png');
        this.load.image('exit', '/assets/zoogate.png');
        this.load.image('water', '/assets/water.png');
        this.load.image('bolt', '/assets/bolt.png');

        // Create graphics for missing assets
        this.createPlaceholderGraphics();
    }

    createPlaceholderGraphics() {
        // Create power-up textures only
        const speedPowerUpGraphics = this.add.graphics();
        speedPowerUpGraphics.lineStyle(2, 0x00ff00);
        speedPowerUpGraphics.fillStyle(0x00ff00, 1);
        // Draw a star shape manually
        const centerX = 32;
        const centerY = 32;
        const points = [];
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? 20 : 10;
            const angle = (i * Math.PI * 2) / 10 - Math.PI / 2;
            points.push(centerX + radius * Math.cos(angle));
            points.push(centerY + radius * Math.sin(angle));
        }
        speedPowerUpGraphics.beginPath();
        speedPowerUpGraphics.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            speedPowerUpGraphics.lineTo(points[i], points[i + 1]);
        }
        speedPowerUpGraphics.closePath();
        speedPowerUpGraphics.fill();
        speedPowerUpGraphics.generateTexture('powerup_speed', 64, 64);
        speedPowerUpGraphics.destroy();

        const invincibilityPowerUpGraphics = this.add.graphics();
        invincibilityPowerUpGraphics.lineStyle(2, 0xff00ff);
        invincibilityPowerUpGraphics.fillStyle(0xff00ff, 1);
        // Draw a star shape manually for invincibility
        const points2 = [];
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? 20 : 10;
            const angle = (i * Math.PI * 2) / 10 - Math.PI / 2;
            points2.push(centerX + radius * Math.cos(angle));
            points2.push(centerY + radius * Math.sin(angle));
        }
        invincibilityPowerUpGraphics.beginPath();
        invincibilityPowerUpGraphics.moveTo(points2[0], points2[1]);
        for (let i = 2; i < points2.length; i += 2) {
            invincibilityPowerUpGraphics.lineTo(points2[i], points2[i + 1]);
        }
        invincibilityPowerUpGraphics.closePath();
        invincibilityPowerUpGraphics.fill();
        invincibilityPowerUpGraphics.generateTexture('powerup_invincibility', 64, 64);
        invincibilityPowerUpGraphics.destroy();
    }

    create() {
        // Get level data from registry
        const levelData = this.registry.get('currentLevel');
        console.log('GameScene starting with level data:', levelData);

        if (!levelData) {
            console.error('No level data found in registry!');
            return;
        }

        if (!levelData.maze || !Array.isArray(levelData.maze)) {
            console.error('Invalid maze data:', levelData.maze);
            return;
        }

        // Initialize ALL game state variables FIRST, before creating any objects
        this.score = 0;
        this.lives = 3;
        this.inDeathSequence = false;
        this.collisionsEnabled = true;
        
        // Add debug logging for power-up state
        console.log('Setting initial power-up state to false');
        Object.defineProperty(this, 'isPoweredUp', {
            value: false,
            writable: true,
            configurable: true,
            enumerable: true
        });
        console.log('Initial power-up state:', this.isPoweredUp);
        
        this.powerUpTimer = null;
        
        // Set world bounds to match level editor
        this.physics.world.setBounds(0, 0, 1000, 750);

        // Initialize game objects
        this.walls = this.physics.add.staticGroup();
        this.energyDots = this.physics.add.staticGroup();
        this.powerPills = this.physics.add.staticGroup();
        this.powerUps = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Create player with initial state
        this.player = this.physics.add.sprite(120, 120, 'player')
            .setDisplaySize(64, 64)
            .setCollideWorldBounds(true);

        // Adjust player collider and state
        this.player.body.setSize(45, 32);
        this.player.body.setOffset(10, 10);
        this.player.isInvincible = false;

        // Create animations
        createAnimations(this);
        this.player.play('move');

        // Initialize keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Initialize the level
        this.initializeLevel(levelData)
            .then(() => {
                // Set up physics collisions
                this.physics.add.collider(this.player, this.walls);
                this.physics.add.collider(this.enemies, this.walls);
                this.physics.add.collider(this.player, this.enemies, hitEnemy, null, this);
                this.physics.add.overlap(this.player, this.powerPills, collectPowerPill, null, this);
                this.physics.add.overlap(this.player, this.energyDots, collectDot, null, this);
                this.physics.add.overlap(this.player, this.powerUps, this.handlePowerUp, null, this);

                console.log('Level initialized from database.');
                console.log('Initial power-up state:', this.isPoweredUp);
                console.log('Initial player invincible state:', this.player.isInvincible);
            })
            .catch((error) => {
                console.error('Error initializing the level:', error);
            });

        // Create UI elements
        createUI(this);
        
        // Initialize pathfinding
        initializePathfinding(this);

        // Set the player's depth
        this.player.setDepth(10);
    }

    async initializeLevel(levelData) {
        try {
            // Store level data
            this.currentLevel = levelData;
            console.log('Initializing level with data:', levelData);

            console.log('Creating walls...');
            // Create walls from maze data
            if (levelData.maze && levelData.maze.length > 0) {
                levelData.maze.forEach((wall, index) => {
                    console.log(`Creating wall ${index}:`, wall);
                    const x = Math.round(wall[0] / 25) * 25;
                    const y = Math.round(wall[1] / 25) * 25;
                    const width = Math.round(wall[2] / 25) * 25;
                    const height = Math.round(wall[3] / 25) * 25;

                    // Create a TileSprite for the wall
                    const wallSprite = this.add.tileSprite(
                        x + width/2,
                        y + height/2,
                        width,
                        height,
                        'wall'
                    );

                    console.log(`Wall ${index} created at:`, {x: x + width/2, y: y + height/2, width, height});

                    // Add physics body
                    this.physics.add.existing(wallSprite, true);
                    
                    // Add to static group
                    this.walls.add(wallSprite);
                    
                    // Set physics properties
                    wallSprite.body.moves = false;
                });
            } else {
                console.log('No maze data found in level data');
            }

            // Create water/terrain with directional flow
            if (levelData.terrain) {
                levelData.terrain.forEach(terrain => {
                    if (terrain.type === 'water') {
                        const x = Math.round(terrain.x / 25) * 25;
                        const y = Math.round(terrain.y / 25) * 25;
                        const width = Math.round(terrain.width / 25) * 25;
                        const height = Math.round(terrain.height / 25) * 25;

                        // Create a TileSprite for the water
                        const waterSprite = this.add.tileSprite(
                            x + width/2,
                            y + height/2,
                            width,
                            height,
                            'water'
                        );

                        // Add physics body
                        this.physics.add.existing(waterSprite, true);
                        waterSprite.properties = terrain.properties;
                        waterSprite.body.moves = false;

                        // Set initial alpha
                        waterSprite.setAlpha(0.7);
                        
                        // Create shimmer animation
                        this.tweens.add({
                            targets: waterSprite,
                            alpha: { from: 0.5, to: 0.8 },
                            duration: 1500,
                            ease: 'Sine.easeInOut',
                            yoyo: true,
                            repeat: -1
                        });

                        // Add directional flow animation based on properties
                        const flowSpeed = terrain.properties?.flowSpeed || 100;
                        const flowDirection = terrain.properties?.flowDirection || 'right';
                        
                        // Calculate tween values based on direction
                        let tilePositionX = { from: 0, to: 0 };
                        let tilePositionY = { from: 0, to: 0 };
                        
                        switch(flowDirection) {
                            case 'right':
                                tilePositionX = { from: width, to: 0 };
                                break;
                            case 'left':
                                tilePositionX = { from: 0, to: width };
                                break;
                            case 'down':
                                tilePositionY = { from: height, to: 0 };
                                break;
                            case 'up':
                                tilePositionY = { from: 0, to: height };
                                break;
                        }

                        // Create flow animation
                        this.tweens.add({
                            targets: waterSprite,
                            tilePositionX: tilePositionX,
                            tilePositionY: tilePositionY,
                            duration: 5000 / (flowSpeed / 100),
                            ease: 'Linear',
                            repeat: -1
                        });
                    }
                });
            }

            // Create power pills from level data (using alephdot.png)
            if (levelData.powerPills) {
                levelData.powerPills.forEach(pill => {
                    const x = Math.round(pill.x / 25) * 25;
                    const y = Math.round(pill.y / 25) * 25;
                    
                    const powerPill = this.powerPills.create(x, y, 'energyDot');  // Changed to energyDot
                    powerPill.setDisplaySize(14, 14);  // Smaller size for regular dots
                    powerPill.setDepth(0);
                    powerPill.value = pill.value || 10;
                    powerPill.refreshBody();
                });
            }

            // Create power ups from level data
            if (levelData.powerUps) {
                levelData.powerUps.forEach(powerUp => {
                    const x = Math.round(powerUp.x / 25) * 25;
                    const y = Math.round(powerUp.y / 25) * 25;
                    
                    if (powerUp.type === 'speed') {
                        // Create speed power-up with bolt sprite
                        const pup = this.powerUps.create(x, y, 'bolt');
                        pup.setDisplaySize(16, 16);
                        pup.setDepth(0);
                        pup.type = powerUp.type;
                        pup.duration = powerUp.duration;
                        pup.multiplier = powerUp.multiplier;
                        pup.refreshBody();

                        // Create a pulsing glow effect
                        this.tweens.add({
                            targets: pup,
                            alpha: { from: 0.6, to: 1 },
                            scale: { from: .6, to: .8 },
                            duration: 800,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    } else {
                        // Create invincibility power-up with power-pill sprite
                        const pup = this.powerUps.create(x, y, 'powerPill');
                        pup.setDisplaySize(45, 45);
                        pup.setDepth(0);
                        pup.type = powerUp.type;
                        pup.duration = powerUp.duration;
                        pup.refreshBody();

                        // Create a spinning coin effect
                        this.tweens.add({
                            targets: pup,
                            scaleX: { from: 1, to: 0.2 },  // Squish horizontally to simulate y-axis rotation
                            duration: 1000,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });

                        // Add a slight bounce
                        this.tweens.add({
                            targets: pup,
                            y: y - 5,  // Move up slightly
                            duration: 1500,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                });
            }

            // Create exit if exists
            if (levelData.exit) {
                const x = Math.round(levelData.exit.x / 25) * 25;
                const y = Math.round(levelData.exit.y / 25) * 25;
                const width = Math.round(levelData.exit.width / 25) * 25;
                const height = Math.round(levelData.exit.height / 25) * 25;

                const exit = this.physics.add.sprite(
                    x + width/2,
                    y + height/2,
                    'exit'
                );
                exit.setDisplaySize(width, height);
                exit.setDepth(1);
                exit.refreshBody();
            }

            // Create enemies
            if (levelData.enemies) {
                console.log('Creating enemies from level data:', levelData.enemies);
                createEnemies(this);
            }

        } catch (error) {
            console.error('Error in initializeLevel:', error);
            throw error;
        }
    }

    // Update the handlePlayerDeath method
    handlePlayerDeath() {
        if (!this.inDeathSequence) {
            this.inDeathSequence = true;
            
            // Store current state of all enemies
            this.enemyStates = this.enemies.getChildren().map(enemy => ({
                x: enemy.x,
                y: enemy.y,
                velocityX: enemy.body.velocity.x,
                velocityY: enemy.body.velocity.y,
                type: enemy.texture.key,
                speed: enemy.speed
            }));
            
            // Pause physics but keep enemies visible
            this.physics.pause();
            
            // Pause enemy animations
            this.enemies.getChildren().forEach(enemy => {
                enemy.anims.pause();
            });

            // Reset player position
            this.player.setPosition(120, 120);
            this.player.setVelocity(0, 0);
            
            // Create overlay
            const overlay = this.add.rectangle(0, 0, 1000, 750, 0x000000, 0.5)
                .setOrigin(0, 0)
                .setDepth(100);
            
            // Show death sequence
            this.showDeathSequence(overlay);
        }
    }

    // Add new method to handle the death sequence
    showDeathSequence(overlay) {
        // Show OUCH text
        const ouchText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'OUCH!',
            {
                fontSize: '64px',
                fill: '#ff0000',
                stroke: '#ffffff',
                strokeThickness: 6
            }
        ).setOrigin(0.5)
         .setDepth(101);

        // Fade out OUCH text
        this.tweens.add({
            targets: ouchText,
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                ouchText.destroy();
                this.startDeathCountdown(overlay);
            }
        });
    }

    // Add new method for countdown
    startDeathCountdown(overlay) {
        let count = 3;
        const countdownText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            count.toString(),
            {
                fontSize: '64px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5)
         .setDepth(101);

        const countdown = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countdownText.setText(count.toString());
                } else {
                    countdownText.destroy();
                    overlay.destroy();
                    this.resumeFromDeath();
                }
            },
            repeat: 2
        });
    }

    // Update resumeFromDeath
    resumeFromDeath() {
        this.physics.resume();
        this.inDeathSequence = false;
        this.collisionsEnabled = true;

        // Restore enemy states
        if (this.enemyStates) {
            this.enemies.getChildren().forEach((enemy, index) => {
                const state = this.enemyStates[index];
                if (state) {
                    enemy.anims.resume();
                    enemy.body.velocity.x = state.velocityX;
                    enemy.body.velocity.y = state.velocityY;
                }
            });
            
            // Clear stored states
            delete this.enemyStates;
        }
    }

    // Update handlePowerUp for speed and invincibility power-ups only (not power pills)
    handlePowerUp(player, powerUp) {
        console.log('handlePowerUp called with type:', powerUp.type);
        const duration = powerUp.duration || 10000; // Default 10 seconds

        if (powerUp.type === 'speed') {
            // Speed boost effect
            this.tweens.add({
                targets: player,
                scale: 1.2,
                duration: 200,
                yoyo: true,
                repeat: 2
            });
        } else if (powerUp.type === 'invincibility') {
            player.isInvincible = true;
            // Invincibility effect
            this.tweens.add({
                targets: player,
                alpha: 0.7,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }

        // Remove the power-up
        powerUp.destroy();

        // Set timer to end power-up
        this.powerUpTimer = this.time.delayedCall(duration, () => {
            player.isInvincible = false;
            player.setScale(1);
            player.setAlpha(1);
            this.tweens.killTweensOf(player);
        }, null, this);
    }

    // Add this method to track enemy destruction
    destroyEnemy(enemy) {
        console.log('Enemy being destroyed:', enemy.debugId);
        console.trace(); // This will show us where the destruction is happening
    }

    update(time, delta) {
        if (this.inDeathSequence) {
            return;
        }

        // Add debug check at start of each update
        if (this.isPoweredUp) {
            console.log('Power-up state is true in update');
        }

        // Handle basic player movement
        if (this.player && this.cursors) {
            const speed = this.isPoweredUp ? 300 : 200;
            this.player.setVelocity(0);

            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-speed);
                this.player.setFlipX(false);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(speed);
                this.player.setFlipX(true);
            }

            if (this.cursors.up.isDown) {
                this.player.setVelocityY(-speed);
            } else if (this.cursors.down.isDown) {
                this.player.setVelocityY(speed);
            }
        }

        // Update game state (enemies, powerups, etc)
        if (!this.scene.isPaused()) {
            updateGameState.call(this, time, delta);
        }
    }

    // Add method to safely remove enemy
    removeEnemy(enemy) {
        // Do nothing - we want to keep enemies
    }

    // Add this method to preserve scene state
    preserveSceneState() {
        return {
            enemies: this.enemies.getChildren().map(enemy => ({
                type: enemy.texture.key,
                x: enemy.x,
                y: enemy.y,
                velocityX: enemy.body.velocity.x,
                velocityY: enemy.body.velocity.y,
                speed: enemy.speed
            }))
        };
    }

    // Add this method to restore scene state
    restoreSceneState(state) {
        if (state && state.enemies) {
            // Clear existing enemies
            this.enemies.clear(false, true); // false = don't remove from scene, true = don't destroy
            
            // Recreate enemies from saved state
            state.enemies.forEach(enemyData => {
                const enemy = this.physics.add.sprite(enemyData.x, enemyData.y, enemyData.type)
                    .setCollideWorldBounds(true);
                
                enemy.speed = enemyData.speed;
                enemy.body.velocity.x = enemyData.velocityX;
                enemy.body.velocity.y = enemyData.velocityY;
                enemy.play(`${enemyData.type}-move`);
                
                this.enemies.add(enemy);
            });
        }
    }
} 