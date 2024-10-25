export default class LevelIntroScene extends Phaser.Scene {
    constructor() {
        super('LevelIntroScene');
    }

    init(data) {
        this.levelNumber = data.levelNumber || 1;
    }

    create() {
        // Add background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0);

        // Add level text
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, `Level ${this.levelNumber}`, {
            fontFamily: 'LuckiestGuy, Arial, sans-serif',
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add countdown text
        this.countdownText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, '5', {
            fontFamily: 'LuckiestGuy, Arial, sans-serif',
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Start countdown
        this.countdown = 5;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateCountdown,
            callbackScope: this,
            repeat: 4
        });
    }

    updateCountdown() {
        this.countdown--;
        this.countdownText.setText(this.countdown.toString());

        if (this.countdown <= 0) {
            this.scene.start('GameScene', { levelNumber: this.levelNumber });
        }
    }
}
