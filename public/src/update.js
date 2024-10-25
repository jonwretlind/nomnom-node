// update.js

import { updateScore, loseLife, updateLivesDisplay } from './helpers.js';
import { lives, gameOver } from './create.js';

// Constants
const CHASE_RANGE = 300;
const FLEE_RANGE = 150;
const WANDER_RADIUS = 200;
const ENEMY_TURN_SPEED = 0.01;

// Initialize pathfinding grid
let pfGrid;
let finder;
let pathfindingInitialized = false;

export function initializePathfinding(scene) {
    if (typeof PF === 'undefined') {
        return false;
    }

    const gridWidth = Math.ceil(scene.scale.width / 25);
    const gridHeight = Math.ceil(scene.scale.height / 25);
    pfGrid = new PF.Grid(gridWidth, gridHeight);

    // Mark walls as obstacles
    scene.walls.getChildren().forEach(wall => {
        const gridX = Math.floor(wall.x / 25);
        const gridY = Math.floor(wall.y / 25);
        pfGrid.setWalkableAt(gridX, gridY, false);
    });

    finder = new PF.AStarFinder({
        allowDiagonal: true,
        dontCrossCorners: true
    });

    pathfindingInitialized = true;
    console.log('Pathfinding initialized successfully');
    return true;
}

export function update(time, delta) {
    if (this.inDeathSequence) {
        return;  // Don't update anything if we're in the death sequence
    }

    if (this.scene.isPaused() || this.inDeathSequence) {
        return;  // Don't update anything if the scene is paused or we're in the death sequence
    }

    // Add this check at the beginning of the update function
    if (this.scene.isPaused()) {
        return;
    }

    if (!pathfindingInitialized) {
        if (!initializePathfinding(this)) {
            // If pathfinding initialization fails, continue with the rest of the update
        }
    }

    if (this.gameOver) {
        return;
    }

    // Player movement logic
    if (this.player) {
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

        // Update player appearance based on power-up state
        if (this.isPoweredUp) {
            this.player.setScale(1.5);
            adjustHueTween(this.player, this.powerUpTimer.getRemaining());
        } else {
            this.player.setScale(1);
            this.player.clearTint();
        }
    } else {
        console.error('Player object is undefined');
    }

    // Enemy movement logic
    if (this.enemies && this.enemies.getChildren) {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy && this.player) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, enemy.x, enemy.y
                );

                if (this.isPoweredUp) {
                    // Run away from the player
                    steerAwayFrom(enemy, this.player, enemy.speed);
                } else {
                    // Normal chase behavior
                    if (distance < CHASE_RANGE) {
                        steerTowards(enemy, this.player, enemy.speed);
                    } else {
                        wander(enemy);
                    }
                }

                // Update enemy facing direction based on horizontal movement
                if (enemy.body.velocity.x < 0) {
                    enemy.setFlipX(false); // Face left
                } else if (enemy.body.velocity.x > 0) {
                    enemy.setFlipX(true); // Face right
                }
            }
        });
    } else {
        console.error('Enemies object is undefined or does not have getChildren method');
    }

    // Use pathfinding if initialized
    if (pathfindingInitialized && this.enemies && this.enemies.getChildren && this.enemies.getChildren().length > 0) {
        const startX = Math.floor(this.player.x / 25);
        const startY = Math.floor(this.player.y / 25);
        const endX = Math.floor(this.enemies.getChildren()[0].x / 25);
        const endY = Math.floor(this.enemies.getChildren()[0].y / 25);

        const path = finder.findPath(startX, startY, endX, endY, pfGrid.clone());
        console.log('Path found:', path);
    }

    // Update game objects
    // this.player.update(delta);
    // this.enemies.forEach(enemy => enemy.update(delta));
}

export function collectDot(player, dot) {
    dot.disableBody(true, true);
    this.score = Number(this.score || 0) + 10;
    updateScore(this);

    if (this.energyDots.countActive(true) === 0) {
        console.log("All dots collected!");
        // Handle level completion here
    }
}

export function collectPowerPill(player, powerPill) {
    powerPill.disableBody(true, true);
    this.score = Number(this.score || 0) + 50;
    updateScore(this);

    // Activate power-up state
    this.isPoweredUp = true;

    // Make enemies vulnerable, blink more slowly, fade more, and add a blue tint
    this.enemies.getChildren().forEach(enemy => {
        enemy.vulnerable = true;
        enemy.setTint(0x8080FF);  // Slight blue tint
        this.tweens.add({
            targets: enemy,
            alpha: 0.4, // More fading
            yoyo: true,
            repeat: -1,
            duration: 250, // Slower blinking
            ease: 'Linear'
        });
    });

    // Reset power-up state after 10 seconds
    if (this.powerUpTimer) {
        this.powerUpTimer.remove();
    }
    this.powerUpTimer = this.time.delayedCall(10000, () => {
        endPowerUp(this);
    }, [], this);

    // Start the color transition for the player
    startPlayerColorTransition(this, player);
}

function adjustHueTween(player, duration) {
    player.scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration: duration,
        onUpdate: (tween) => {
            const value = tween.getValue();
            const red = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 0, g: 224, b: 224 },
                { r: 255, g: 255, b: 255 },
                100,
                value
            );
            const color = Phaser.Display.Color.GetColor(red.r, red.g, red.b);
            player.setTint(color);
        }
    });
}

function endPowerUp(scene) {
    scene.isPoweredUp = false;
    scene.player.setScale(1);
    scene.player.clearTint();
    scene.tweens.killTweensOf(scene.player);
    scene.player.setAlpha(1);

    scene.enemies.getChildren().forEach((enemy) => {
        scene.tweens.killTweensOf(enemy);
        enemy.setAlpha(1);
        enemy.clearTint();
        enemy.vulnerable = false;
    });
}

function steerTowards(enemy, target, speed) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    enemy.body.velocity.x = Math.cos(angle) * speed;
    enemy.body.velocity.y = Math.sin(angle) * speed;
}

function steerAwayFrom(enemy, target, speed) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y) + Math.PI;
    enemy.body.velocity.x = Math.cos(angle) * speed;
    enemy.body.velocity.y = Math.sin(angle) * speed;
}

function wander(enemy) {
    if (!enemy.wanderDirection || Phaser.Math.Between(0, 100) < 2) {
        const randomAngle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
        enemy.wanderDirection = {
            x: Math.cos(randomAngle),
            y: Math.sin(randomAngle)
        };
    }

    const currentVelocity = new Phaser.Math.Vector2(enemy.body.velocity.x, enemy.body.velocity.y);
    const targetVelocity = new Phaser.Math.Vector2(
        enemy.wanderDirection.x * WANDER_RADIUS,
        enemy.wanderDirection.y * WANDER_RADIUS
    );

    const lerpedVelocity = currentVelocity.lerp(targetVelocity, ENEMY_TURN_SPEED);
    enemy.body.velocity.x = lerpedVelocity.x;
    enemy.body.velocity.y = lerpedVelocity.y;
}

export function hitEnemy(player, enemy) {
    if (this.isPoweredUp) {
        // Player eats the enemy
        enemy.disableBody(true, true);
        
        // Determine points based on enemy type
        let points = 0;
        switch (enemy.texture.key) {
            case 'gator':
                points = 200;
                break;
            case 'lion':
                points = 250;
                break;
            case 'bee':
                points = 300;
                break;
            default:
                points = 100;
        }

        // Add points to score
        this.score = Number(this.score || 0) + points;
        updateScore(this);

        // Display floating points
        showFloatingPoints(this, enemy.x, enemy.y, points);

        // Play disintegration effect
        playDisintegrationEffect(this, enemy);

        // Respawn the enemy after a delay
        this.time.delayedCall(10000, () => {
            respawnEnemy(this, enemy.texture.key, enemy.speed);
        });
    } else if (!enemy.vulnerable && !this.inDeathSequence) {
        this.inDeathSequence = true;
        loseLife(this);

        if (this.lives <= 0) {
            this.physics.pause();
            player.setTint(0xff0000);
            player.anims.play('death');
            this.gameOver = true;
            
            // Dim the screen for Game Over
            const dimOverlay = this.add.rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height, 0x000000, 0.7);
            dimOverlay.setOrigin(0, 0);
            dimOverlay.setDepth(998);

            // Display Game Over text
            const gameOverText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Game Over', {
                fontSize: '48px',
                fill: '#ffffff'
            }).setOrigin(0.5);
            gameOverText.setDepth(999);
        } else {
            // Store current enemy positions
            const enemyData = this.enemies.getChildren().map(e => ({
                enemy: e,
                x: e.startX,
                y: e.startY
            }));

            // Pause physics
            this.physics.pause();

            // Launch the DeathSequenceScene
            this.scene.launch('DeathSequenceScene', { lives: this.lives });

            // Listen for the death sequence to complete
            this.scene.get('DeathSequenceScene').events.once('deathSequenceComplete', () => {
                // Reset player position and velocity
                player.setPosition(120, 120);
                player.setVelocity(0, 0);
                player.body.reset(120, 120);

                // Reset enemy positions
                enemyData.forEach(data => {
                    if (data.enemy && data.enemy.body) {
                        data.enemy.setPosition(data.x, data.y);
                        data.enemy.body.reset(data.x, data.y);
                    }
                });

                // Clear the red tint and resume the game
                player.clearTint();
                player.anims.play('move');
                this.physics.resume();
                this.inDeathSequence = false;
                updateLivesDisplay(this);
            });
        }
    }
}

function playDisintegrationEffect(scene, enemy) {
    const emitter = scene.particles.createEmitter({
        x: enemy.x,
        y: enemy.y,
        speed: { min: 10, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 2000,
        frequency: 50,
        quantity: 5,
        blendMode: 'ADD'
    });

    scene.time.delayedCall(500, () => {
        emitter.stop();
    });
}

function respawnEnemy(scene, type, speed) {
    const enemyData = {
        'bee': { width: 35, height: 30 },
        'gator': { width: 80, height: 72 },
        'lion': { width: 62, height: 72 }
    };

    const { width, height } = enemyData[type] || { width: 72, height: 72 };  // Default size if type is unknown

    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;

    const enemy = scene.enemies.create(
        centerX + Phaser.Math.Between(-100, 100),
        centerY + Phaser.Math.Between(-100, 100),
        type
    );

    enemy.setCollideWorldBounds(true)
        .setDisplaySize(width, height)
        .setVelocity(
            Phaser.Math.Between(-speed, speed),
            Phaser.Math.Between(-speed, speed)
        )
        .setBounce(1)
        .setDepth(1);

    enemy.speed = speed;

    // Set the collision body size
    enemy.body.setSize(width * 0.8, height * 0.8);
    enemy.body.setOffset(width * 0.1, height * 0.1);

    // Play the correct animation
    enemy.play(`${type}-move`);
}

function startPlayerColorTransition(scene, player) {
    const startColor = Phaser.Display.Color.ValueToColor(0x40C0FF); // Light blue
    const endColor = Phaser.Display.Color.ValueToColor(0xFF4040); // Red

    scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration: 10000, // Full duration of power-up
        onUpdate: function (tween) {
            const value = tween.getValue();
            const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
                startColor,
                endColor,
                100,
                value
            );
            const color = Phaser.Display.Color.GetColor(
                colorObject.r,
                colorObject.g,
                colorObject.b
            );
            player.setTint(color);
        }
    });

    // Start more obvious blinking during the last 3 seconds of the power-up time
    scene.time.delayedCall(7000, () => {
        startEndingPowerUpEffect(scene, player);
    });
}

function startEndingPowerUpEffect(scene, player) {
    // More obvious blinking
    scene.tweens.add({
        targets: player,
        alpha: 0.2,
        yoyo: true,
        repeat: 5, // 6 blinks in total
        duration: 250, // Faster blinking
        ease: 'Linear'
    });
}

function flashScreen(scene, color, duration) {
    const flash = scene.add.rectangle(0, 0, scene.sys.game.config.width, scene.sys.game.config.height, color);
    flash.setOrigin(0);
    flash.setDepth(999);
    flash.alpha = 0;

    scene.tweens.add({
        targets: flash,
        alpha: 1,
        duration: duration / 2,
        yoyo: true,
        onComplete: () => {
            flash.destroy();
        }
    });
}

// Add this new function to display floating points
function showFloatingPoints(scene, x, y, points) {
    const pointsText = scene.add.text(x, y, `+${points}`, {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
    });

    scene.tweens.add({
        targets: pointsText,
        y: y - 50,
        alpha: 0,
        duration: 1000,
        ease: 'Power1',
        onComplete: () => {
            pointsText.destroy();
        }
    });
}

