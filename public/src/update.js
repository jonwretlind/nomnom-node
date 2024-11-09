// update.js

import { updateScore, loseLife, updateLivesDisplay } from './helpers.js';
import { lives, gameOver } from './create.js';

// Constants
const CHASE_RANGE = 300;
const FLEE_RANGE = 150;
const WANDER_RADIUS = 200;
const ENEMY_TURN_SPEED = 0.01;

// Constants for power-up state
const POWER_UP_DURATION = 10000; // 10 seconds

// Initialize pathfinding grid
let pfGrid;
let finder;
let pathfindingInitialized = false;

export function initializePathfinding(scene) {
    if (typeof PF !== 'undefined') {
        scene.pathfindingInitialized = true;
    }
}

export function update(time, delta) {
    if (this.scene.isPaused() || this.inDeathSequence) {
        return;  // Don't update anything if the scene is paused or we're in the death sequence
    }

    if (!pathfindingInitialized) {
        if (!initializePathfinding(this)) {
            // If pathfinding initialization fails, continue with the rest of the update
        }
    }

    if (this.gameOver) {
        return;
    }

    // Player movement is now handled in GameScene's update method

    // Enemy movement logic
    if (this.enemies && this.enemies.getChildren) {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy && this.player) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, enemy.x, enemy.y
                );

                // Check explicit vulnerable state
                if (this.isPoweredUp && enemy.vulnerable === true) {
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

    // Add check at start of update to ensure enemies are in correct state
    if (this.enemies && this.enemies.getChildren) {
        this.enemies.getChildren().forEach(enemy => {
            if (!this.isPoweredUp && enemy.vulnerable) {
                enemy.vulnerable = false;
                enemy.clearTint();
            }
        });
    }
}

export function collectDot(player, dot) {
    dot.destroy();
    this.score += 10;
    updateScore(this);
}

export function collectPowerPill(player, pill) {
    // Only proceed if the scene exists
    if (!player || !player.scene) return;
    
    const scene = player.scene;
    
    pill.destroy();
    scene.score += pill.value || 10;
    updateScore(scene);
}

export function hitEnemy(player, enemy) {
    if (!player || !player.scene) return;
    
    const scene = player.scene;
    
    // Only eat enemy if powered up AND enemy is vulnerable
    if (scene.isPoweredUp && enemy.vulnerable === true) {
        eatEnemy(scene, enemy);
    } else if (!player.isInvincible && !scene.inDeathSequence) {
        loseLife(scene);
        scene.handlePlayerDeath();
    }
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

export function handlePowerUp(player, powerUp) {
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
        // Make player invincible and enemies vulnerable
        this.isPoweredUp = true;
        player.isInvincible = true;
        
        // Make enemies vulnerable
        this.enemies.getChildren().forEach(enemy => {
            if (enemy) {
                enemy.vulnerable = true;
                enemy.setTint(0x4444ff);
            }
        });

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
    if (this.powerUpTimer) {
        this.powerUpTimer.remove();
    }

    this.powerUpTimer = this.time.delayedCall(duration, () => {
        this.isPoweredUp = false;
        player.isInvincible = false;
        player.setScale(1);
        player.setAlpha(1);
        this.tweens.killTweensOf(player);

        // Reset enemy vulnerability
        this.enemies.getChildren().forEach(enemy => {
            if (enemy) {
                enemy.vulnerable = false;
                enemy.clearTint();
            }
        });
    }, null, this);
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

function respawnEnemy(scene, enemy) {
    enemy.setPosition(enemy.startX, enemy.startY);
    enemy.setVisible(true);
    enemy.body.enable = true;
    enemy.clearTint();
    enemy.vulnerable = false;  // Ensure enemy is not vulnerable when respawning
    
    // Reset velocity
    enemy.body.velocity.x = Phaser.Math.Between(-enemy.speed, enemy.speed);
    enemy.body.velocity.y = Phaser.Math.Between(-enemy.speed, enemy.speed);
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

function eatEnemy(scene, enemy) {
    // Only proceed if enemy is actually vulnerable
    if (!enemy.vulnerable) return;

    // Create particle effect
    const particles = scene.add.particles('particle');
    const emitter = particles.createEmitter({
        x: enemy.x,
        y: enemy.y,
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 1000,
        quantity: 20,
        blendMode: 'ADD'
    });

    // Add score
    scene.score += 200;
    updateScore(scene);

    // Hide enemy
    enemy.setVisible(false);
    enemy.body.enable = false;

    // Schedule enemy respawn
    scene.time.delayedCall(5000, () => {
        respawnEnemy(scene, enemy);
    });

    // Stop particle effect after animation
    scene.time.delayedCall(1000, () => {
        particles.destroy();
    });
}

