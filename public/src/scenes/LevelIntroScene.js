export default class LevelIntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelIntroScene' });
    }

    init(data) {
        this.levelData = data.levelData;
    }

    create() {
        // Add dark semi-transparent background
        this.add.rectangle(0, 0, 1000, 750, 0x000000, 0.7)
            .setOrigin(0);

        // Add level text
        const levelText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            `Level ${this.levelData.level}`,
            {
                fontSize: '64px',
                fill: '#fff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Add level name
        const nameText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 20,
            this.levelData.name,
            {
                fontSize: '32px',
                fill: '#fff'
            }
        ).setOrigin(0.5);

        // Add countdown
        let count = 3;
        const countdownText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            count.toString(),
            {
                fontSize: '48px',
                fill: '#fff'
            }
        ).setOrigin(0.5);

        // Countdown timer
        const countdown = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                countdownText.setText(count.toString());
                if (count <= 0) {
                    this.scene.start('GameScene');
                }
            },
            repeat: 2
        });
    }
}
