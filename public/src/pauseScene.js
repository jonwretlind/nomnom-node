export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        // Add semi-transparent black overlay
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
            .setOrigin(0);

        // Add "PAUSED" text
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'PAUSED', {
            fontFamily: 'LuckiestGuy, Arial, sans-serif',
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add instruction text
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 70, 'Press P to resume', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Listen for P key to unpause
        this.input.keyboard.on('keydown-P', () => {
            this.scene.resume('GameScene');
            this.scene.stop();
        });
    }
}
