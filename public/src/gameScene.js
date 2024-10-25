import { preload } from './preload.js';
import { create } from './create.js';
import { update, initializePathfinding } from './update.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.pathfindingInitialized = false;
    }

    init(data) {
        this.levelNumber = data.levelNumber || 1;
    }

    preload() {
        preload.call(this);
    }

    create() {
        if (!this.sys.game.config.physics) {
            console.error('Physics configuration is missing!');
            return;
        }
        console.log('Physics system:', this.physics);
        create.call(this);

        console.log(`Starting Level ${this.levelNumber}`);
        
        // Use this.levelNumber to load the appropriate level data
        // You might need to modify your level loading logic to use this.levelNumber

        // Delay pathfinding initialization
        this.time.delayedCall(1000, this.initPathfinding, [], this);

        // Add pause key
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.pauseKey.on('down', this.togglePause, this);
    }

    initPathfinding() {
        if (typeof PF !== 'undefined') {
            console.log('Initializing pathfinding...');
            initializePathfinding(this);
            this.pathfindingInitialized = true;
        } else {
            this.time.delayedCall(1000, this.initPathfinding, [], this);
        }
    }

    update(time, delta) {
        try {
            update.call(this, time, delta);
        } catch (error) {
            console.error('Error in update:', error);
        }
    }

    togglePause() {
        if (this.scene.isPaused('GameScene')) {
            this.scene.resume('GameScene');
            this.scene.stop('PauseScene');
        } else {
            this.scene.pause('GameScene');
            this.scene.launch('PauseScene');
        }
    }
}
