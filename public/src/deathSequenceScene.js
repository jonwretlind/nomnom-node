export default class DeathSequenceScene extends Phaser.Scene {
    constructor() {
        super('DeathSequenceScene');
    }

    init(data) {
        this.lives = data.lives;
        this.gameScene = this.scene.get('GameScene');
    }

    create() {
        // Immediately stop the player's movement
        this.gameScene.player.setVelocity(0, 0);

        // Flash the screen red
        this.cameras.main.flash(500, 255, 0, 0);

        // Play death animation
        this.gameScene.player.anims.play('death');

        // Wait for the death animation to complete
        this.time.delayedCall(this.gameScene.player.anims.currentAnim.duration, () => {
            // Add semi-transparent black overlay
            this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
                .setOrigin(0);

            // Add "OUCH!" text
            this.ouchText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'OUCH!', {
                fontFamily: 'LuckiestGuy, Arial, sans-serif',
                fontSize: '64px',
                fill: '#ffffff'
            }).setOrigin(0.5);

            // Wait for 2 seconds, then start countdown
            this.time.delayedCall(2000, () => {
                this.ouchText.destroy();
                this.startCountdown();
            });
        });
    }

    startCountdown() {
        let count = 5;
        const countdownText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, count.toString(), {
            fontFamily: 'LuckiestGuy, Arial, sans-serif',
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const countdownInterval = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                countdownText.setText(count.toString());
                if (count <= 0) {
                    countdownInterval.remove();
                    countdownText.destroy();
                    this.scene.resume('GameScene');
                    this.events.emit('deathSequenceComplete');
                    this.scene.stop();
                }
            },
            repeat: 4
        });
    }
}
