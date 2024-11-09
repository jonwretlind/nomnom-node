import { getLevels } from '../services/levelService.js';

export class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene', active: false });
    }

    init() {
        console.log('LevelSelectScene initialized');
    }

    async create() {
        console.log('LevelSelectScene created');
        
        // Add loading text
        const loadingText = this.add.text(500, 375, 'Loading levels...', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        try {
            // Fetch levels from database
            console.log('Fetching levels from database...');
            const levels = await getLevels();
            console.log('Received levels:', levels);

            if (!levels || levels.length === 0) {
                throw new Error('No levels found in database');
            }

            // Remove loading text
            loadingText.destroy();

            // Add background
            this.add.rectangle(0, 0, 1000, 750, 0x000000).setOrigin(0, 0).setAlpha(0.8);
            
            this.add.text(500, 50, 'SELECT LEVEL', {
                fontSize: '32px',
                fill: '#fff'
            }).setOrigin(0.5);

            // Create level selection buttons
            const startY = 150;
            const spacing = 60;
            
            levels.forEach((level, index) => {
                const y = startY + (spacing * index);
                
                // Create button background
                const button = this.add.rectangle(500, y, 300, 50, 0x444444)
                    .setInteractive()
                    .on('pointerover', () => button.setFillStyle(0x666666))
                    .on('pointerout', () => button.setFillStyle(0x444444))
                    .on('pointerdown', () => this.startLevel(level));

                // Add level text
                this.add.text(500, y, `Level ${level.level}: ${level.name}`, {
                    fontSize: '20px',
                    fill: '#fff'
                }).setOrigin(0.5);
            });

        } catch (error) {
            console.error('Error loading levels:', error);
            loadingText.setText('Error loading levels\n' + error.message);
        }
    }

    startLevel(levelData, devMode = false) {
        console.log('Starting level with data:', levelData);
        console.log('Level maze:', levelData.maze);
        console.log('Level enemies:', levelData.enemies);
        
        // Store level data in game registry for access in GameScene
        this.registry.set('currentLevel', levelData);
        this.registry.set('devMode', devMode);
        
        // Start the GameScene
        this.scene.start('GameScene');
    }
} 