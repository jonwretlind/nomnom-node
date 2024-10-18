// index.js
import Phaser from 'phaser';
import config from './gameConfig.js';
import { preload } from './preload.js';
import { create } from './create.js';
import { update } from './update.js';

config.scene = { preload, create, update };
new Phaser.Game(config);
