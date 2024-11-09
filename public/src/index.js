// index.js
import './game.js';

// Set up any global configurations or event listeners
window.addEventListener('load', () => {
    console.log('Game loaded');
});

// Handle any errors
window.addEventListener('error', (e) => {
    console.error('Game error:', e.error);
});

// Export any necessary globals
window.GAME_VERSION = '1.0.0';
