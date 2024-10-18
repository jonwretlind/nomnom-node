// helpers.js

export async function loadLevels() {
    const response = await fetch('json/levels.json');
    const data = await response.json();
    return data.levels;
}

export function updateScore(scene, points) {
    scene.score += points;
    scene.scoreText.setText('Score: ' + scene.score);
}

export function loseLife(scene) {
    scene.lives--;
    updateLivesDisplay(scene);

    if (scene.lives <= 0) {
        endGame(scene);
    } else {
        pauseGameWithBlink(scene);
    }
}

export function endGame(scene) {
    scene.gameOver = true;
    scene.gameOverText.setVisible(true);
    scene.physics.pause();
    scene.player.anims.pause();
    scene.restartButton.setVisible(true);
}

export function restartGame(scene) {
    scene.lives = 3;
    scene.score = 0;
    updateScore(scene, 0);
    updateLivesDisplay(scene);

    scene.gameOverText.setVisible(false);
    scene.restartButton.setVisible(false);

    loadCurrentLevel(scene);
    scene.physics.resume();
    scene.player.anims.play('move');
    scene.gameOver = false;
}

export function createUI(scene) {
    scene.scoreText = scene.add.text(900, 10, 'Score: 0', { fontSize: '24px', fill: '#fff' });
    createLivesDisplay(scene);

    scene.gameOverText = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY, 'Game Over', {
        fontSize: '48px',
        fill: '#ff0000'
    }).setOrigin(0.5).setVisible(false);

    scene.restartButton = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY + 60, 'Restart', {
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setVisible(false);

    scene.restartButton.on('pointerdown', () => restartGame(scene));
}

export function createLivesDisplay(scene) {
    scene.livesIcons = [];
    for (let i = 0; i < scene.lives; i++) {
        const lifeIcon = scene.add.image(75 + i * 40, 30, 'player').setDisplaySize(30, 30);
        scene.livesIcons.push(lifeIcon);
    }
}

export function updateLivesDisplay(scene) {
    scene.livesIcons.forEach((icon, index) => {
        icon.setVisible(index < scene.lives);
    });
}

export function clearGameObjects(scene) {
    scene.walls.clear(true, true);
    scene.energyDots.clear(true, true);
    scene.powerPills.clear(true, true);
    scene.enemies.clear(true, true);
}

export function loadCurrentLevel(scene) {
    clearGameObjects(scene);
    const level = scene.levels[scene.currentLevelIndex];

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

export function advanceToNextLevel(scene) {
    scene.currentLevelIndex++;
    if (scene.currentLevelIndex < scene.levels.length) {
        loadCurrentLevel(scene);
    } else {
        endGame(scene);
    }
}
