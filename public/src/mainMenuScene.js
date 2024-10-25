export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        console.log('MainMenuScene constructor called');
    }

    init() {
        console.log('MainMenuScene init');
    }

    preload() {
        console.log('MainMenuScene: preload');
        this.load.image('background', 'assets/opening-background.png');
        this.load.image('button', 'assets/button.png');
    }

    create() {
        console.log('MainMenuScene: create');
        
        // Add a colored rectangle as a fallback background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0);

        // Add and scale background image
        const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'background');
        bg.setScale(Math.max(this.cameras.main.width / bg.width, this.cameras.main.height / bg.height));
        console.log('Background image added and scaled:', bg);

        // Define button texts and callbacks
        const buttons = [
            { text: 'Start Game', callback: () => {
                console.log('Start Game clicked');
                this.scene.start('LevelIntroScene', { levelNumber: 1 });
            }},
            { text: 'Load Game', callback: () => this.loadGame() },
            { text: 'How to Play', callback: () => this.showHowToPlay() }
        ];

        // Calculate the maximum width needed for buttons
        const maxWidth = Math.min(300, Math.max(...buttons.map(button => {
            const tempText = this.add.text(0, 0, button.text, { 
                fontFamily: 'LuckiestGuy, Arial, sans-serif', 
                fontSize: '24px',
                fill: '#ffffff',
            });
            const width = tempText.width + 60; // Added extra padding
            tempText.destroy(); // Remove the temporary text
            return width;
        })));

        // Create buttons
        buttons.forEach((button, index) => {
            this.createButton(this.cameras.main.centerX + 275, 300 + index * 75, button.text, button.callback, maxWidth);
        });
    }

    createButton(x, y, text, callback, width) {
        const height = 60; // Fixed height for all buttons
        const padding = 20; // Padding for text inside the button

        // Create button background
        const button = this.add.image(x, y, 'button')
            .setDisplaySize(width, height)
            .setInteractive();

        // Create button text with white color and shadow
        const buttonText = this.add.text(x, y, text, { 
            fontFamily: 'LuckiestGuy, Arial, sans-serif',
            fontSize: '24px', // Reduced font size
            fill: '#ffffff',
            stroke: '#062859',
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#062859',
                blur: 2,
                stroke: true,
                fill: true
            },
            padding: {
                left: padding,
                right: padding,
                top: padding / 2,
                bottom: padding
            }
        }).setOrigin(0.5);

        // Center the text vertically
        buttonText.y = y - buttonText.height / 2 + height / 1.9;

        // Set up button interactivity
        button.on('pointerdown', callback);
        button.on('pointerover', () => {
            button.setTint(0xdddddd);
            buttonText.setStyle({ 
                fill: '#F2EFA3',  // Lighter yellow glow
                stroke: '#062859',  // Keep the original stroke color
                shadowColor: '#F2EFA3',  // Lighter yellow shadow
                shadowBlur: 8,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            });
        });
        button.on('pointerout', () => {
            button.clearTint();
            buttonText.setStyle({ 
                fill: '#ffffff',
                stroke: '#062859',
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#062859',
                    blur: 2,
                    stroke: true,
                    fill: true
                }
            });
        });

        console.log(`Button created: ${text}`);
        return { button, buttonText };
    }

    loadGame() {
        console.log('Load game clicked');
    }

    showHowToPlay() {
        console.log('How to play clicked');
    }
}
