(function(){ //encapsulation
    // ======================================
    // GLOBALS
    // ======================================
    const config = {
        type: Phaser.AUTO,
        width: 1025,
        height: 775,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false,  // Enable debug mode to visualize physics bodies
                debugShowBody: true,  // Show body outlines
                debugShowStaticBody: true,  // Show static bodies like walls
                debugBodyColor: 0x00ff00  // Optional: Set the debug body color (e.g., green)
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    const game = new Phaser.Game(config);
    let player;
    let cursors;
    let enemies;
    let walls;
    let energyDots;
    let powerPills;
    let levelData;
    const enemySpeed = 100;
    const brickSize = 25;
    let gameOver = false;
    let isPoweredUp = false;
    let powerUpTimer;
    let lives = 3;
    let score = 0;
    let scoreText;
    let livesIcons = [];
    let gameOverText;
    let restartButton;
    let originalDots;
    let originalPowerPills;
    let isPaused = false;
    
    
    // configurable values
    const CHASE_RANGE = 300; // Range within which enemies will chase the player
    const FLEE_RANGE = 150;  // Range within which enemies will flee from the player during power-up
    const WANDER_RADIUS = 200; // Random movement radius when not chasing or fleeing
    const ENEMY_TURN_SPEED = 0.01; // Speed at which enemies change direction
    
    // Define different enemy types with unique speeds and textures
    const enemyTypes = [
        { key: 'gator', speed: 100 },   // Slow enemy
        { key: 'lion', speed: 200 },    // Medium-speed enemy
        { key: 'bee', speed: 300 }, // Fast enemy
    ];
    
    
    // ======================================
    // PRELOADING ASSETS
    // ======================================
    function preload() {
        
        // Load the wall bricks
        this.load.image('brick', '../img/bricks.png');
    
        // dots are alephium logos
        // Load the energy dot image
        this.load.image('energyDot', '../img/alephdot.png');
        // Load the special power pill image
        this.load.image('powerPill', '../img/power-pill.png');
    
        // Load the player sprite sheet with correct frame sizes
        this.load.spritesheet('player', '../img/hippo.png', {
            frameWidth: 59,  // Correct width of a single frame
            frameHeight: 53  // Correct height of a single frame
        });
    
        // Load the dead hippo sprite sheet
        this.load.spritesheet('deadHippo', '../img/deadHippo.png', {
            frameWidth: 64,  // Adjust the width based on the sprite sheet
            frameHeight: 64  // Adjust the height based on the sprite sheet
        });
    
        // enemies
        this.load.spritesheet('bee', '../img/bee.png', {
            frameWidth: 35,
            frameHeight: 30
        });    
        this.load.spritesheet('gator', '../img/gator.png', {
            frameWidth: 80,
            frameHeight: 72
        });
        this.load.spritesheet('lion', '../img/lion.png', {
            frameWidth: 62,
            frameHeight: 72
        }); 
    
         // Load a particle texture for the disintegration effect
         this.load.image('particle', '../img/particle.png');  // Replace with the actual path to your particle image
    }
    
    // ======================================
    // CREATE / INIT
    // ======================================
    function create() {
        

        // read a file
            function readFile(file, callback) {
                console.log('readFile...');
                var rawFile = new XMLHttpRequest();
                rawFile.overrideMimeType("application/json");
                rawFile.open("GET", file, true);
                rawFile.onreadystatechange = function() {
                    if (rawFile.readyState === 4 && rawFile.status == "200") {
                        console.log('file loaded...');
                        callback(rawFile.responseText);
                    }
                }
                rawFile.send(null);
            };
    
    
        // ----------------------------
        // PLAYFIELD
        // ----------------------------    
        // Create maze walls and dots using static physics group
        walls = this.physics.add.staticGroup();
        energyDots = this.physics.add.staticGroup();
    
        // Example maze layout (you can customize this)
        // Each 'wall' is represented as [x, y, width, height]
        let mazeLayout;
        readFile('./js/levels.json', function( data ) {
            this.levelData = JSON.parse(data);
            mazeLayout = this.levelData.maze;
            // Draw walls as tiled bricks
            mazeLayout.forEach(([x, y, width, height]) => {
                createTiledWall(this, walls, x, y, width, height);
            });
            // Once the walls are added, add energy dots
            addEnergyDots(this, walls);
        });
    
        
    
        function createTiledWall(scene, wallGroup, startX, startY, width, height) {
            const bricksHorizontal = Math.ceil(width / brickSize);  // Number of bricks horizontally
            const bricksVertical = Math.ceil(height / brickSize);   // Number of bricks vertically
        
            // Create each brick tile
            for (let i = 0; i < bricksHorizontal; i++) {
                for (let j = 0; j < bricksVertical; j++) {
                    const brickX = startX + i * brickSize;
                    const brickY = startY + j * brickSize;
                    const brick = wallGroup.create(brickX + brickSize / 2, brickY + brickSize / 2, 'brick');
                    brick.setDisplaySize(brickSize, brickSize);  // Ensure the brick is correctly sized
                    brick.setOrigin(0.5);  // Center the brick
                    brick.refreshBody();   // Refresh physics body to account for its new size
                }
            }
        }
    
    
        // ----------------------------
        // ENERGYDOTS
        // ----------------------------    
        
            // Create energy dots group
            energyDots = this.physics.add.staticGroup();
            powerPills = this.physics.add.staticGroup();
    
            // Dot Creation: update the loop to place a power pill every 10th dot. 
            function addEnergyDots(scene, walls) {
        
            // Define the size of the grid and spacing between dots
            const dotSpacing = 77;  // Distance between each dot
            const dotSize = 15;     // Size of each regular dot
            const powerPillSize = 45;  // Size of each special power pill
        
            // Counter to place a power pill every 10th dot
            let dotCounter = 0;
        
            // Create a grid of energy dots
            for (let x = 50; x < config.width - 50; x += dotSpacing) {
                for (let y = 50; y < config.height - 50; y += dotSpacing) {
                    // Only place the dot if it's not overlapping with any wall
                    if (!isOverlappingWall(scene, x, y, walls, dotSize)) {
                        dotCounter++;
                        let pp = this.levelData.ppSpacing;
                        // Every 10th dot is a special power pill
                        if (dotCounter % pp === 0) {
                            const powerPill = powerPills.create(x, y, 'powerPill');
                            powerPill.setDisplaySize(powerPillSize, powerPillSize);
                            powerPill.setDepth(0);  // Ensure power pills are behind other game objects
                            powerPill.refreshBody();
                        } else {
                            const dot = energyDots.create(x, y, 'energyDot');
                            dot.setDisplaySize(dotSize, dotSize);
                            dot.setDepth(0);  // Ensure power pills are behind other game objects
                            dot.refreshBody();
                        }
                    }
                }
            }
        
        }

        
        
// ======================================
// collectDot function to handle eating dots
// ======================================
function collectDot(player, dot) {
    dot.destroy();  // Remove the dot when collected
    updateScore(10); // Award 1 point for each dot
}

    
// ======================================
// collectPowerPill
// ======================================
function collectPowerPill(player, powerPill) {
    powerPill.destroy();  // Remove the power pill when collected

    const points = 100;
    updateScore(points);

    // Show floating points at the position of the power pill
    showFloatingPoints(player.scene, powerPill.x, powerPill.y, points);

    // Define the additional time to add
    const additionalTime = 5000; // 5000 milliseconds = 5 seconds

    if (isPoweredUp) {
        // If already powered up, extend the current timer instead of resetting it
        const remainingTime = powerUpTimer.getRemaining();
        powerUpTimer.remove(false); // Stop the current timer without triggering its callback
        powerUpTimer = player.scene.time.delayedCall(
            remainingTime + additionalTime,
            () => endPowerUp(player),
            null,
            this
        );

        // Adjust the remaining time for the tint transition
        adjustHueTween(player, remainingTime + additionalTime);
    } else {
        // Set the powered-up state for the first time
        isPoweredUp = true;

        // Increase player size
        player.setScale(1.5);  // increase the size temporarily

        // Start the hue shift from red to blue over the power-up duration
        adjustHueTween(player, additionalTime);

        // Make enemies flicker and adjust behavior
        enemies.getChildren().forEach((enemy) => {
            player.scene.tweens.add({
                targets: enemy,
                alpha: 0,
                yoyo: true,
                repeat: -1,  // Repeat infinitely 
                duration: 200  // Adjust duration for flickering speed
            });
        });

        // Start the power-up timer with the additional time
        powerUpTimer = player.scene.time.delayedCall(
            additionalTime,
            () => endPowerUp(player),
            null,
            this
        );

        // Start blinking the player during the last 2 seconds of the power-up time
        player.scene.time.delayedCall(
            additionalTime - 2000,  // Start blinking 2 seconds before the end
            () => {
                player.scene.tweens.add({
                    targets: player,
                    alpha: 0,
                    yoyo: true,
                    repeat: -1,
                    duration: 200  // Adjust the blink speed
                });
            }
        );
    }
}
    
    // ======================================
    // Function to smoothly adjust hue from red to blue
    // ======================================
    function adjustHueTween(player, duration) {
        player.scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: duration,
            onUpdate: (tween) => {
                // Calculate the blend between red and blue
                const value = tween.getValue();
                const red = Phaser.Display.Color.Interpolate.ColorWithColor(
                    { r: 0, g: 224, b: 224 }, // Start with tint
                    { r: 255, g: 255, b: 255 }, // End with white
                    100, // Maximum value range for interpolation
                    value // Current tween value
                );
    
                // Convert the interpolated RGB values back to a hex color
                const color = Phaser.Display.Color.GetColor(red.r, red.g, red.b);
                player.setTint(color);
            }
        });
    }
    
    // ======================================
    // Function to end the power-up state after the timer runs out
    // ======================================
    function endPowerUp(player) {
        isPoweredUp = false;
    
        // Reset player size
        player.setScale(1);
    
        // Clear any tint applied during the power-up
        player.clearTint();
    
        // Stop any active player blinking
        player.scene.tweens.killTweensOf(player);
        player.setAlpha(1);  // Ensure the player is fully visible
    
        // Stop enemies from flickering
        enemies.getChildren().forEach((enemy) => {
            player.scene.tweens.killTweensOf(enemy);  // Stop the flickering effect
            enemy.setAlpha(1);  // Ensure enemies are fully visible after flickering stops
        });
    }
    
    
    
    
        // ======================================
        // Helper function to check if a position overlaps with any walls using rectangle bounds
        // ======================================
        function isOverlappingWall(scene, x, y, walls, dotSize) {
            // Create a temporary rectangle to represent the dot's area
            const dotRect = new Phaser.Geom.Rectangle(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
    
            // Check for overlap with any walls using their bounds
            let overlapping = false;
            walls.getChildren().forEach(wall => {
                const wallRect = wall.getBounds();  // Get the bounds of the wall
    
                // Check if the dot's rectangle overlaps with the wall's rectangle
                if (Phaser.Geom.Intersects.RectangleToRectangle(dotRect, wallRect)) {
                    overlapping = true;
                }
            });
    
            return overlapping;
        }
    
    
    
    
        // ----------------------------
        // PLAYER / SPRITE ANIMATIONS
        // ----------------------------
        // PLAYER ...
        // Verify the sprite sheet is loaded
        if (!this.textures.exists('player')) {
            console.error('Player sprite sheet failed to load.');
            return;
        }
        // Create animations from the sprite sheet for the player
        this.anims.create({
            key: 'move',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1 // Loop the animation
        });
        // Create the death animation from the "deadHippo" sprite sheet
        this.anims.create({
            key: 'death',
            frames: this.anims.generateFrameNumbers('deadHippo', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 2,  // Play the animation 3 times (0-based index, repeat twice)
            hideOnComplete: false  // Do not hide after completion
        });
        // Create the player using the sprite sheet
        player = this.physics.add.sprite(120, 120, 'player');
        player.setDisplaySize(64, 64);  // Set the display size of the player
        player.setDepth(1);  // Ensure the player is in front of the dots and power pills
        player.setCollideWorldBounds(true);
    
        // Adjust the size of the player's collider
        player.body.setSize(45, 32);  // Set the size of the collider (width, height)
        player.body.setOffset(10, 10);  // Adjust the offset to center the collider within the sprite
    
        // Play the player animation if it exists
        if (this.anims.exists('move')) {
            player.play('move');  // Play the animation
        } else {
            console.error('Move animation failed to load.');
        }
    
    
        // --------------------------------
        // ENEMIES ...
    
        if ( !this.textures.exists('bee') || !this.textures.exists('gator') || !this.textures.exists('lion') ) {
            console.error('Enemy sprite sheet failed to load.');
            return;
        }
    
        // Create animations from the sprite sheet for the enemies
        this.anims.create({
            key: 'buzz',
            frames: this.anims.generateFrameNumbers('bee', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1 // Loop the animation
        });
        this.anims.create({
            key: 'snap',
            frames: this.anims.generateFrameNumbers('gator', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1 // Loop the animation
        });
        this.anims.create({
            key: 'roar',
            frames: this.anims.generateFrameNumbers('lion', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1 // Loop the animation
        });
    
    
        // Create enemy group
        enemies = this.physics.add.group();
    
        // Spawn enemies from a central area
        spawnEnemies('gator', 2, 50);
        spawnEnemies('lion', 2, 150);
        spawnEnemies('bee', 1, 200);
    
        
        // ----------------------------
        // PARTICLES
        // ----------------------------
        // Create a particle manager for the disintegration effect
        this.particles = this.add.particles('particle');
    
    
        // ----------------------------
        // GAME CONTROL LISTENERS
        // ----------------------------
        // Set up cursor keys (for arrow keys and numpad keys)
        cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            numPadUp: Phaser.Input.Keyboard.KeyCodes.NUMPAD_EIGHT,
            numPadDown: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
            numPadLeft: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
            numPadRight: Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX
        });
    
    
        // ----------------------------
        // SET UP COLLISION DETECTION 
        // COLLIDER OBJECTS
        // ----------------------------
        // Handle collision between player and energy dots
        this.physics.add.overlap(player, energyDots, collectDot, null, this);
        
        // Handle collision between player and power pills
        this.physics.add.overlap(player, powerPills, collectPowerPill, null, this);
    
        // Handle collision between player and enemies
        this.physics.add.collider(player, enemies, hitEnemy, null, this);
    
        // Handle collision between player and maze walls
        this.physics.add.collider(player, walls);
    
        // Handle enemies bouncing off walls
        this.physics.add.collider(enemies, walls);

        
        createUI(this); // user interface
        saveOriginalState(this); // Save the initial state of dots and power pills
    
    } // end create()
    
    
    
    // ======================================
    // UPDATE 
    // ======================================
    function update() {
        if (gameOver || isPaused) return;
    
        // Player movement logic...
        player.setVelocity(0);
        const offsetXLeft = 0;
        const offsetXRight = 55;
    
        if (cursors.left.isDown || cursors.numPadLeft.isDown) {
            player.setVelocityX(-200);
            isPoweredUp ? player.scaleX = 1.5 : player.scaleX = 1;
            player.body.setOffset(offsetXLeft, 10);
        } else if (cursors.right.isDown || cursors.numPadRight.isDown) {
            player.setVelocityX(200);
            isPoweredUp ? player.scaleX = -1.5 : player.scaleX = -1;
            player.body.setOffset(offsetXRight, 10);
        }
    
        if (cursors.up.isDown || cursors.numPadUp.isDown) {
            player.setVelocityY(-200);
        } else if (cursors.down.isDown || cursors.numPadDown.isDown) {
            player.setVelocityY(200);
        }
    
        // Smarter movement for enemies
        enemies.getChildren().forEach((enemy) => {
            const distance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    
            if (isPoweredUp && distance < FLEE_RANGE) {
                // Flee behavior when the player is powered up and close
                steerAwayFrom(enemy, player, enemy.speed);
            } else if (distance < CHASE_RANGE) {
                // Chase behavior when within a certain range
                steerTowards(enemy, player, enemy.speed);
            } else {
                // Wander around randomly when far from the player
                wander(enemy);
            }
    
            // Adjust enemy sprite direction and keep collider centered
            if (enemy.body.velocity.x < 0) {
                enemy.scaleX = 1;
                enemy.body.setOffset(
                    (enemy.width - enemy.body.width) / 2,
                    0
                );
            } else if (enemy.body.velocity.x > 0) {
                enemy.scaleX = -1;
                enemy.body.setOffset(
                    (enemy.width + enemy.body.width) / 2,
                    0
                );
            }
        });
    }
    
    // ======================================
    // Helper Functions for Steering Behaviors
    // ======================================
    function steerTowards(enemy, target, speed) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        enemy.body.velocity.x = Math.cos(angle) * speed;
        enemy.body.velocity.y = Math.sin(angle) * speed;
    }
    
    function steerAwayFrom(enemy, target, speed) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y) + Math.PI; // Add 180 degrees to reverse direction
        enemy.body.velocity.x = Math.cos(angle) * speed;
        enemy.body.velocity.y = Math.sin(angle) * speed;
    }
    
    function wander(enemy) {
        // Generate a random direction to move towards
        if (!enemy.wanderDirection || Phaser.Math.Between(0, 100) < 2) {
            const randomAngle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
            enemy.wanderDirection = {
                x: Math.cos(randomAngle),
                y: Math.sin(randomAngle)
            };
        }
    
        // Smoothly transition to the new direction
        const currentVelocity = new Phaser.Math.Vector2(enemy.body.velocity.x, enemy.body.velocity.y);
        const targetVelocity = new Phaser.Math.Vector2(
            enemy.wanderDirection.x * WANDER_RADIUS,
            enemy.wanderDirection.y * WANDER_RADIUS
        );
    
        // Lerp towards the target velocity for smooth movement
        const lerpedVelocity = currentVelocity.lerp(targetVelocity, ENEMY_TURN_SPEED);
        enemy.body.velocity.x = lerpedVelocity.x;
        enemy.body.velocity.y = lerpedVelocity.y;
    }

// ======================================
// Function to show floating points
// ======================================
function showFloatingPoints(scene, x, y, points) {
    // Create a text object at the given position
    const pointsText = scene.add.text(x, y, `+${points}`, {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
    });

    // Create a tween to move the text upward and fade it out
    scene.tweens.add({
        targets: pointsText,
        y: y - 50, // Move the text 50 pixels up
        alpha: 0, // Fade out the text
        duration: 500, // Duration of the animation (0.5 seconds)
        ease: 'Power1',
        onComplete: () => {
            pointsText.destroy(); // Remove the text after the animation
        }
    });
}

    
// ======================================
// hitEnemy function to handle attack mode
// ======================================
function hitEnemy(player, enemy) {
    if (isPoweredUp) {
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
        }

        updateScore(points);

        // Show floating points at the position of the enemy
        showFloatingPoints(player.scene, enemy.x, enemy.y, points);

        // Play disintegration effect before destroying the enemy
        playDisintegrationEffect(player.scene, enemy);

        const enemyType = enemy.texture.key;
        const enemySpeed = enemy.speed;
        enemy.destroy();

        player.scene.time.delayedCall(10000, respawnEnemy, [enemyType, enemySpeed], this);
    } else {
        loseLife();
    }
}
    
    // ======================================
    // Function to play the disintegration effect
    // ======================================
    function playDisintegrationEffect(scene, enemy) {
        // Create a particle emitter at the enemy's position
        const emitter = scene.particles.createEmitter({
            x: enemy.x,
            y: enemy.y,
            speed: { min: 10, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 2000,  // Particles will disappear after 500ms
            frequency: 50,  // Lower frequency for a more gradual particle emission
            quantity: 5,  // Emit a few particles at a time for a more sustained effect
            blendMode: 'ADD'  // Use additive blend mode for a glow-like effect
        });
    
        // Stop the emitter after 500ms to avoid continuous particle emission
        scene.time.delayedCall(500, () => {
            emitter.stop();
        });
    }
    
    // ======================================
    // Function to respawn an enemy in the center of the screen
    // ======================================
    function respawnEnemy(enemyType, speed) {
        const enemy = enemies.create(config.width / 2, config.height / 2, enemyType);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(
            Phaser.Math.Between(-speed, speed),
            Phaser.Math.Between(-speed, speed)
        );
        enemy.setBounce(1);
        enemy.setDisplaySize(72, 72);
        enemy.setDepth(1);
        enemy.speed = speed;
    
        // Play the corresponding animation for each enemy type
        if (enemyType === 'bee') {
            enemy.play('buzz');
        } else if (enemyType === 'gator') {
            enemy.play('snap');
        } else if (enemyType === 'lion') {
            enemy.play('roar');
        }
    }
    
    

// ======================================
// Function to handle scoring updates
// ======================================
function updateScore(points) {
    score += points;
    scoreText.setText('Score: ' + score);
}


// ======================================
// Function to handle player losing a life
// ======================================
function loseLife() {
    lives--;
    updateLivesDisplay();

    if (lives > 0) {
        // Blink the background red during a 3-second pause
        pauseGameWithBlink();
    } else {
        endGame();
    }
}

// ======================================
// Function to pause the game, flash the screen red, and reset positions
// ======================================
function pauseGameWithBlink() {
    isPaused = true;
    player.scene.physics.pause(); // Pause all physics (including enemy movement)
    player.anims.pause(); // Pause the player's animation
    enemies.getChildren().forEach((enemy) => enemy.anims.pause()); // Pause enemy animations

    let blinkCount = 0;
    const blinkDuration = 300; // Duration of each blink in milliseconds
    const totalBlinks = 6; // Total number of blinks (3 seconds)

    // Function to handle each blink manually
    function doBlink() {
        if (blinkCount < totalBlinks) {
            // Toggle background color between red and black
            player.scene.cameras.main.setBackgroundColor(blinkCount % 2 === 0 ? '#ff0000' : '#000000');
            blinkCount++;

            // Schedule the next blink
            player.scene.time.delayedCall(blinkDuration, doBlink, null, this);
        } else {
            // Reset background color to black after the last blink
            player.scene.cameras.main.setBackgroundColor('#000000');

            // Reset player position and respawn enemies after blinking
            player.setPosition(120, 120);
            respawnAllEnemies();

            // Resume the game after resetting positions
            resumeGame();
        }
    }

    // Start the first blink
    doBlink();
}

// ======================================
// Function to resume the game after a pause
// ======================================
function resumeGame() {
    console.log("ResumeGame");
    isPaused = false;
    player.scene.physics.resume(); // Resume all physics
    player.anims.resume(); // Resume player's animation
    enemies.getChildren().forEach((enemy) => enemy.anims.resume()); // Resume enemy animations
}

// ======================================
// Function to respawn all enemies at their initial positions
// ======================================
function respawnAllEnemies() {
    console.log("respawn enemies");
    enemies.clear(true, true);

    // Respawn enemies with their initial types and speeds
    spawnEnemies('gator', 2, 50);
    spawnEnemies('lion', 2, 150);
    spawnEnemies('bee', 1, 200);
}

// Function to spawn enemies of a specific type
function spawnEnemies(type, count, speed) {
    const centerX = config.width / 2;
    const centerY = config.height / 2;

    for (let i = 0; i < count; i++) {
        const enemy = enemies.create(
            centerX + Phaser.Math.Between(-100, 100), // Spawn within a small range of the center
            centerY + Phaser.Math.Between(-100, 100),
            type
        );

        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(
            Phaser.Math.Between(-speed, speed),
            Phaser.Math.Between(-speed, speed)
        );
        enemy.setBounce(1);
        enemy.setDisplaySize(72, 72);  // Scale to 72x72 pixels
        enemy.setDepth(1);  // Ensure enemies are in front of the dots and power pills
        enemy.speed = speed;

        // Adjust the collider for each enemy type and play the animation
        if (type === 'bee') {
            enemy.body.setSize(35, 30);  // Set a smaller collider size for better alignment
            enemy.body.setOffset((enemy.width - 35) / 2, (enemy.height - 30) / 2);  // Center the collider vertically and horizontally
            enemy.play('buzz');
        } else if (type === 'gator') {
            enemy.body.setSize(80, 72);  // Adjust size for gator if needed
            enemy.body.setOffset((enemy.width - 80) / 2, (enemy.height - 72) / 2);  // Center the collider
            enemy.play('snap');
        } else if (type === 'lion') {
            enemy.body.setSize(62, 72);  // Adjust size for lion if needed
            enemy.body.setOffset((enemy.width - 62) / 2, (enemy.height - 72) / 2);  // Center the collider
            enemy.play('roar');
        }
    }

}

// ======================================
// Function to create the lives display at the top of the screen
// ======================================
function createLivesDisplay(scene) {
    for (let i = 0; i < lives; i++) {
        const lifeIcon = scene.add.image(75 + i * 40, 30, 'player');
        lifeIcon.setDisplaySize(30, 30);
        livesIcons.push(lifeIcon);
    }
}

    // ======================================
    // Function to update the lives display
    // ======================================
    function updateLivesDisplay() {
        livesIcons.forEach((icon, index) => {
            icon.setVisible(index < lives);
        });
    }

     // ======================================
    // Function to handle end of game
    // ======================================
    function endGame() {
        gameOver = true;
        gameOverText.setVisible(true);
        player.scene.physics.pause();
        player.anims.pause();
        restartButton.setVisible(true);
    }

    

    // ======================================
    // Function to restart the game
    // ======================================
    function restartGame() {
        lives = 3;
        score = 0;
        updateScore(0);
        updateLivesDisplay();

        gameOverText.setVisible(false);
        restartButton.setVisible(false);

        // Restore the game board to its initial state
        restoreOriginalState(player.scene);

        // Reset player position and resume gameplay
        player.scene.physics.resume();
        player.anims.play('move');
        player.setPosition(120, 120);
        gameOver = false;
    }

    // ======================================
    // Function to save the original state of dots and power pills
    // ======================================
    function saveOriginalState(scene) {
        if (energyDots && powerPills) {
            originalDots = energyDots.getChildren().map(dot => ({ x: dot.x, y: dot.y }));
            originalPowerPills = powerPills.getChildren().map(pill => ({ x: pill.x, y: pill.y }));
        } else {
            console.error('Energy dots or power pills are not initialized properly.');
        }
    }

    // ======================================
    // Function to restore the original state of the game board
    // ======================================
    function restoreOriginalState(scene) {
        energyDots.clear(true, true);
        powerPills.clear(true, true);

        originalDots.forEach(pos => {
            const dot = energyDots.create(pos.x, pos.y, 'energyDot');
            dot.setDisplaySize(15, 15);
            dot.refreshBody();
        });

        originalPowerPills.forEach(pos => {
            const pill = powerPills.create(pos.x, pos.y, 'powerPill');
            pill.setDisplaySize(45, 45);
            pill.refreshBody();
        });
    }

// ======================================
// Function to create the game UI, including the score display
// ======================================
function createUI(scene) {
    scoreText = scene.add.text(900, 10, 'Score: 0', {
        fontSize: '24px',
        fill: '#ffffff',
        align: 'right'
    });
    scoreText.setOrigin(1, 0); // Align the text to the right edge

    createLivesDisplay(scene);

    gameOverText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, 'Game Over', {
        fontSize: '48px',
        fill: '#ff0000'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setVisible(false);

    restartButton = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 60, 'Restart', {
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    });
    restartButton.setOrigin(0.5);
    restartButton.setInteractive();
    restartButton.on('pointerdown', restartGame);
    restartButton.setVisible(false);
}

})();

