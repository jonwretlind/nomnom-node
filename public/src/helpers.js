// js/helpers.js

let levelsData = [];  // Store loaded levels globally

// Load levels from the JSON file asynchronously
export async function loadLevels() {
    try {
        const response = await fetch('/json/levels.json');  // Ensure correct path
        if (!response.ok) {
            throw new Error('Failed to load levels.json');
        }

        const data = await response.json();

        if (!data || !data.levels || !Array.isArray(data.levels) || data.levels.length === 0) {
            throw new Error('Invalid or empty levels data');
        }

        console.log('Levels loaded successfully:', data.levels);  // Log loaded levels
        levelsData = data.levels;  // Store levels in the global variable
        return levelsData;
    } catch (error) {
        console.error('Error loading levels:', error);
        return [];  // Return an empty array to prevent crashes
    }
}

// Ensure levels are fully loaded before continuing
export async function ensureLevelsLoaded() {
    if (levelsData.length === 0) {
        console.log('Levels not loaded yet. Loading now...');
        await loadLevels();
    }
    console.log('Levels available:', levelsData);
    return levelsData;
}

// Initialize the game to the first level on startup
export async function initializeFirstLevel(scene) {
    console.log('Initializing the first level...');
    scene.currentLevelIndex = 0;  // Start at the first level

    try {
        const levels = await ensureLevelsLoaded();  // Ensure levels are loaded

        if (levels.length === 0) {
            throw new Error('No levels available to load.');
        }

        await loadCurrentLevel(scene);  // Load the first level
        console.log('First level loaded successfully.');
    } catch (error) {
        console.error('Error initializing the first level:', error);
    }
}

// Save the original state of energy dots and power pills
export function saveOriginalState(scene) {
    scene.originalDots = scene.energyDots.getChildren().map(dot => ({
        x: dot.x,
        y: dot.y
    }));
    scene.originalPowerPills = scene.powerPills.getChildren().map(pill => ({
        x: pill.x,
        y: pill.y
    }));
}

// Load the current level from the levels array
export async function loadCurrentLevel(scene) {
    console.log(`Loading current level with index: ${scene.currentLevelIndex}`);

    const levels = await ensureLevelsLoaded();

    if (!levels || levels.length === 0) {
        console.error('Levels data is empty or undefined.');
        return;
    }

    if (scene.currentLevelIndex < 0 || scene.currentLevelIndex >= levels.length) {
        console.error(`Invalid level index: ${scene.currentLevelIndex}`);
        return;
    }

    const level = levels[scene.currentLevelIndex];

    if (!level || typeof level !== 'object' || !Array.isArray(level.maze) || level.maze.length === 0) {
        console.error('Level or maze data is missing or invalid:', level);
        return;
    }

    console.log(`Loading level ${scene.currentLevelIndex + 1}:`, level);

    // Clear only non-enemy objects
    clearWalls(scene);
    clearDots(scene);
    clearPowerPills(scene);
    clearPowerUps(scene);

    // Create walls from the maze data
    level.maze.forEach(([x, y, width, height]) => {
        createWall(scene, x, y, width, height);
    });

    scene.ppSpacing = level.ppSpacing || 15;
    scene.currentLevel = level;

    console.log(`Level ${scene.currentLevelIndex + 1} loaded successfully.`);
    console.log('Enemy data:', level.enemies);
}

// Create walls from the maze data
function createWall(scene, x, y, width, height) {
    const brickSize = 25;

    for (let i = 0; i < Math.ceil(width / brickSize); i++) {
        for (let j = 0; j < Math.ceil(height / brickSize); j++) {
            const brick = scene.walls.create(
                x + i * brickSize + brickSize / 2,
                y + j * brickSize + brickSize / 2,
                'brick'
            );
            brick.setDisplaySize(brickSize, brickSize).setOrigin(0.5).refreshBody();
        }
    }
}

// Restart the game from the first level
export async function restartGame(scene) {
    console.log('Restarting game...');
    scene.lives = 3;
    scene.score = 0;
    scene.currentLevelIndex = 0;  // Reset to the first level

    updateScore(scene, 0);
    updateLivesDisplay(scene);

    scene.gameOverText.setVisible(false);
    scene.restartButton.setVisible(false);

    await loadCurrentLevel(scene);  // Reload the first level
    scene.physics.resume();
}

// Function to handle scoring updates
export function updateScore(scene) {
    if (scene.scoreText) {
        scene.scoreText.setText('Score: ' + (scene.score || 0));
    } else {
        console.error('scoreText is not defined');
    }
}

// Function to handle player losing a life
export function loseLife(scene) {
    scene.lives--;
    updateLivesDisplay(scene);

    if (scene.lives > 0) {
        // Don't clear game objects or pause physics - that's handled in GameScene
        return;
    } else {
        endGame(scene);
    }
}

// Function to update the lives display
export function updateLivesDisplay(scene) {
    scene.livesIcons.forEach((icon, index) => {
        icon.setVisible(index < scene.lives);
    });
}

// Function to create the lives display at the top of the screen
export function createLivesDisplay(scene) {
    scene.livesIcons = [];
    const iconSize = 30;
    const padding = 10;
    const startX = padding;
    const startY = iconSize / 2 + padding;

    for (let i = 0; i < scene.lives; i++) {
        const lifeIcon = scene.add.image(startX + i * (iconSize + padding), startY, 'player')
            .setDisplaySize(iconSize, iconSize)
            .setOrigin(0, 0.5);
        scene.livesIcons.push(lifeIcon);
    }
}

// Function to handle end of the game
export function endGame(scene) {
    scene.gameOver = true;
    scene.physics.pause();
    
    // Pause animations instead of destroying objects
    scene.player.anims.pause();
    scene.enemies.getChildren().forEach(enemy => enemy.anims.pause());

    // Dim the screen for Game Over
    const dimOverlay = scene.add.rectangle(0, 0, scene.sys.game.config.width, scene.sys.game.config.height, 0x000000, 0.7);
    dimOverlay.setOrigin(0, 0);
    dimOverlay.setDepth(998);

    // Display Game Over text
    scene.gameOverText.setDepth(999);
    scene.gameOverText.setVisible(true);

    // Display Restart button
    scene.restartButton.setDepth(999);
    scene.restartButton.setVisible(true);
}

// Function to pause the game with a blinking effect
export function pauseGameWithBlink(scene) {
    scene.isPaused = true;
    scene.physics.pause();
    scene.player.anims.pause();
    scene.enemies.getChildren().forEach(enemy => enemy.anims.pause());

    let blinkCount = 0;
    const blinkDuration = 300; // Duration of each blink in milliseconds
    const totalBlinks = 6; // Total number of blinks (3 seconds)

    function doBlink() {
        if (blinkCount < totalBlinks) {
            scene.cameras.main.setBackgroundColor(blinkCount % 2 === 0 ? '#ff0000' : '#000000');
            blinkCount++;

            scene.time.delayedCall(blinkDuration, doBlink, null, scene);
        } else {
            scene.cameras.main.setBackgroundColor('#000000');
            scene.player.setPosition(120, 120);
            
            // Reset player size here as well
            scene.player.setDisplaySize(64, 64);
            scene.player.setScale(1);
            scene.player.body.setSize(45, 32);
            scene.player.body.setOffset(10, 10);
            
            respawnAllEnemies(scene);
            resumeGame(scene);
        }
    }

    doBlink();
}

// Function to resume the game after a pause
export function resumeGame(scene) {
    scene.isPaused = false;
    scene.physics.resume();
    scene.player.anims.play('move');
    
    // Reset player size to original dimensions
    scene.player.setDisplaySize(64, 64);  // Assuming 64x64 is the original size
    scene.player.setScale(1);  // Reset scale to 1
    
    // Reset player's body size and offset
    scene.player.body.setSize(45, 32);
    scene.player.body.setOffset(10, 10);

    scene.enemies.getChildren().forEach(enemy => enemy.anims.resume());
}

// Function to respawn all enemies at their initial positions
export function respawnAllEnemies(scene) {
    scene.enemies.clear(true, true);
    
    if (scene.currentLevel && scene.currentLevel.enemies) {
        scene.currentLevel.enemies.forEach(enemyData => {
            for (let i = 0; i < enemyData.numberOf; i++) {
                respawnEnemy(scene, enemyData.type, enemyData.speed);
            }
        });
    } else {
        console.error('No enemy data found for the current level');
    }
}

// Function to spawn enemies of a specific type
function spawnEnemies(scene, type, count, speed) {
    const centerX = scene.scale.width / 2;
    const centerY = scene.scale.height / 2;

    for (let i = 0; i < count; i++) {
        const enemy = scene.enemies.create(
            centerX + Phaser.Math.Between(-100, 100),
            centerY + Phaser.Math.Between(-100, 100),
            type
        );

        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(
            Phaser.Math.Between(-speed, speed),
            Phaser.Math.Between(-speed, speed)
        );
        enemy.setBounce(1);
        enemy.setDisplaySize(72, 72);
        enemy.setDepth(1);
        enemy.speed = speed;

        // Adjust collider and animation based on enemy type
        if (type === 'bee') {
            enemy.body.setSize(35, 30);
            enemy.body.setOffset((enemy.width - 35) / 2, (enemy.height - 30) / 2);
            enemy.play('buzz');
        } else if (type === 'gator') {
            enemy.body.setSize(80, 72);
            enemy.body.setOffset((enemy.width - 80) / 2, (enemy.height - 72) / 2);
            enemy.play('snap');
        } else if (type === 'lion') {
            enemy.body.setSize(62, 72);
            enemy.body.setOffset((enemy.width - 62) / 2, (enemy.height - 72) / 2);
            enemy.play('roar');
        }
    }
}

// Advance to the next level or end the game if no more levels
export function advanceToNextLevel(scene) {
    scene.currentLevelIndex++;
    if (scene.currentLevelIndex < levelsData.length) {
        loadCurrentLevel(scene);
    } else {
        endGame(scene);
    }
}

export let score = 0;

// Function to handle collision with an enemy
export function hitEnemy(player, enemy) {
    if (player.scene.isPoweredUp) {
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

        updateScore(player.scene, points);

        // Show floating points at the position of the enemy
        showFloatingPoints(player.scene, enemy.x, enemy.y, points);

        // Play disintegration effect before destroying the enemy
        playDisintegrationEffect(player.scene, enemy);

        const enemyType = enemy.texture.key;
        const enemySpeed = enemy.speed;
        enemy.destroy();

        player.scene.time.delayedCall(10000, () => respawnEnemy(player.scene, enemyType, enemySpeed), [], player.scene);
    } else {
        loseLife(player.scene);
    }
}

// Function to show floating points
export function showFloatingPoints(scene, x, y, points) {
    const pointsText = scene.add.text(x, y, `+${points}`, {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
    });

    scene.tweens.add({
        targets: pointsText,
        y: y - 50,
        alpha: 0,
        duration: 500,
        ease: 'Power1',
        onComplete: () => {
            pointsText.destroy();
        }
    });
}

// Function to play the disintegration effect
export function playDisintegrationEffect(scene, enemy) {
    const particles = scene.add.particles(enemy.x, enemy.y, 'particle', {
        speed: { min: 10, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 2000,
        frequency: 50,
        quantity: 5,
        blendMode: 'ADD'
    });

    scene.time.delayedCall(500, () => {
        particles.destroy();
    });
}

// Function to create the game UI, including the score display
export function createUI(scene) {
    createLivesDisplay(scene);

    // Create the score text
    scene.scoreText = scene.add.text(scene.scale.width - 25, 10, 'Score: 0', {
        fontSize: '24px',
        fill: '#ffffff',
        align: 'right'
    }).setOrigin(1, 0); // Align the text to the right edge

    scene.gameOverText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, 'Game Over', {
        fontSize: '48px',
        fill: '#ff0000'
    }).setOrigin(0.5);
    scene.gameOverText.setVisible(false);

    scene.restartButton = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 60, 'Restart', {
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    scene.restartButton.setInteractive();
    scene.restartButton.on('pointerdown', () => restartGame(scene));
    scene.restartButton.setVisible(false);
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

// Add these new clear functions for specific object types
function clearWalls(scene) {
    if (scene.walls) scene.walls.clear(true, true);
}

function clearDots(scene) {
    if (scene.energyDots) scene.energyDots.clear(true, true);
}

function clearPowerPills(scene) {
    if (scene.powerPills) scene.powerPills.clear(true, true);
}

function clearPowerUps(scene) {
    if (scene.powerUps) scene.powerUps.clear(true, true);
}

