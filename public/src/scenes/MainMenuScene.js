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

        // Fetch first level data before creating buttons
        fetch('http://localhost:3002/api/levels/number/1', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        })
        .then(response => {
            console.log('Response from server:', response);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(levelData => {
            console.log('Successfully loaded level data:', levelData);
            // Store level data in registry
            this.registry.set('currentLevel', levelData);
            // Create menu buttons
            this.createButtons();
        })
        .catch(error => {
            console.error('Error loading level data:', error);
            // Create buttons anyway, but they'll start without level data
            this.createButtons();
        });
    }

    createButtons() {
        // Define button texts and callbacks
        const buttons = [
            { 
                text: 'Start Game', 
                callback: () => {
                    console.log('Start Game clicked');
                    const levelData = this.registry.get('currentLevel');
                    if (levelData) {
                        console.log('Starting game with level data:', levelData);
                        this.scene.start('LevelIntroScene', { levelData });
                    } else {
                        console.error('No level data available');
                    }
                }
            },
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
            const width = tempText.width + 60;
            tempText.destroy();
            return width;
        })));

        // Create buttons
        buttons.forEach((button, index) => {
            this.createButton(
                this.cameras.main.centerX + 275, 
                300 + index * 75, 
                button.text, 
                button.callback, 
                maxWidth
            );
        });
    }

    createButton(x, y, text, callback, width) {
        const height = 60;
        const padding = 20;

        const button = this.add.image(x, y, 'button')
            .setDisplaySize(width, height)
            .setInteractive();

        const buttonText = this.add.text(x, y, text, { 
            fontFamily: 'LuckiestGuy, Arial, sans-serif',
            fontSize: '24px',
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

        buttonText.y = y - buttonText.height / 2 + height / 1.9;

        button.on('pointerdown', callback);
        button.on('pointerover', () => {
            button.setTint(0xdddddd);
            buttonText.setStyle({ 
                fill: '#F2EFA3',
                stroke: '#062859',
                shadowColor: '#F2EFA3',
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