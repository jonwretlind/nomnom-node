// update.js

import { updateScore, advanceToNextLevel, loseLife } from './helpers.js';

export function update() {
    if (this.gameOver) return;

    this.player.setVelocity(0);
    if (this.cursors.left.isDown) this.player.setVelocityX(-200);
    if (this.cursors.right.isDown) this.player.setVelocityX(200);
    if (this.cursors.up.isDown) this.player.setVelocityY(-200);
    if (this.cursors.down.isDown) this.player.setVelocityY(200);

    this.enemies.getChildren().forEach(enemy => {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (this.player.isPoweredUp && distance < 150) {
            steerAwayFrom(enemy, this.player);
        } else if (distance < 300) {
            steerTowards(enemy, this.player);
        } else {
            wander(enemy);
        }
    });
}

export function collectDot(player, dot) {
    dot.destroy();
    updateScore(player.scene, 10);

    if (player.scene.energyDots.countActive() === 0) {
        advanceToNextLevel(player.scene);
    }
}

export function collectPowerPill(player, pill) {
    pill.destroy();
    updateScore(player.scene, 100);
    player.scene.player.isPoweredUp = true;

    player.scene.time.delayedCall(5000, () => {
        player.scene.player.isPoweredUp = false;
    });
}

export function hitEnemy(player, enemy) {
    if (player.isPoweredUp) {
        enemy.destroy();
        updateScore(player.scene, 200);
    } else {
        loseLife(player.scene);
    }
}

function steerTowards(enemy, target) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
}

function steerAwayFrom(enemy, target) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y) + Math.PI;
    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
}

function wander(enemy) {
    if (!enemy.wanderDirection || Phaser.Math.Between(0, 100) < 2) {
        const randomAngle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
        enemy.wanderDirection = { x: Math.cos(randomAngle), y: Math.sin(randomAngle) };
    }

    const targetVelocity = new Phaser.Math.Vector2(
        enemy.wanderDirection.x * enemy.speed,
        enemy.wanderDirection.y * enemy.speed
    );

    enemy.setVelocity(targetVelocity.x, targetVelocity.y);
}
