export class DeathSequenceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathSequenceScene' });
    }

    create() {
        // Make this scene transparent so we can see the game scene below
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0)');
        
        // Create a semi-transparent black overlay
        const overlay = this.add.rectangle(0, 0, 1000, 750, 0x000000, 0.5)
            .setOrigin(0, 0)
            .setDepth(100);

        // Get reference to game scene
        const gameScene = this.scene.get('GameScene');
        
        // Show OUCH text
        this.showOuchText().then(() => {
            this.startCountdown();
        });

        // Set this scene to be above the game scene
        this.scene.bringToTop();
    }

    showOuchText() {
        return new Promise(resolve => {
            const ouchText = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                'OUCH!',
                {
                    fontSize: '64px',
                    fill: '#ff0000',
                    stroke: '#ffffff',
                    strokeThickness: 6
                }
            ).setOrigin(0.5)
             .setDepth(101);

            this.tweens.add({
                targets: ouchText,
                alpha: { from: 1, to: 0 },
                duration: 1000,
                ease: 'Power2',
                onComplete: () => {
                    ouchText.destroy();
                    resolve();
                }
            });
        });
    }

    startCountdown() {
        let count = 3;
        const countdownText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            count.toString(),
            {
                fontSize: '64px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5)
         .setDepth(101);

        const countdown = this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countdownText.setText(count.toString());
                } else {
                    countdownText.destroy();
                    this.resumeGame();
                }
            },
            repeat: 2
        });
    }

    resumeGame() {
        const gameScene = this.scene.get('GameScene');
        // Don't stop the scene, just make it invisible
        this.cameras.main.setAlpha(0);
        gameScene.resumeFromDeath();
        // Destroy this scene after a short delay
        this.time.delayedCall(100, () => {
            this.scene.stop();
        });
    }
}
