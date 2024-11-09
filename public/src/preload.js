// js/preload.js
export function preload() {
 // Load the wall bricks
 this.load.image('brick', '/assets/bricks.png');
    
 // dots are alephium logos
 // Load the energy dot image
 this.load.image('energyDot', '/assets/alephdot.png');
 // Load the special power pill image
 this.load.image('powerPill', '/assets/power-pill.png');

 // Load the player sprite sheet with correct frame sizes
 this.load.spritesheet('player', '/assets/hippo.png', {
     frameWidth: 59,  // Correct width of a single frame
     frameHeight: 53  // Correct height of a single frame
 });

 // Load the dead hippo sprite sheet
 this.load.spritesheet('deadHippo', '/assets/deadHippo.png', {
     frameWidth: 64,  // Adjust the width based on the sprite sheet
     frameHeight: 64  // Adjust the height based on the sprite sheet
 });

 // enemies
 this.load.spritesheet('bee', '/assets/bee.png', {
     frameWidth: 35,
     frameHeight: 30
 });    
 this.load.spritesheet('gator', '/assets/gator.png', {
     frameWidth: 80,
     frameHeight: 72
 });
 this.load.spritesheet('lion', '/assets/lion.png', {
     frameWidth: 62,
     frameHeight: 72
 }); 

  // Load the particle texture
  this.load.image('particle', '/assets/particle.png');  // Updated path

  // Load power up sprites
  this.load.image('powerup_speed', 'assets/powerup_speed.png');
  this.load.image('powerup_invincibility', 'assets/powerup_invincibility.png');

      
}
