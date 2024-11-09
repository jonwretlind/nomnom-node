export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 800;
export const GRID_SIZE = 25;

export const ELEMENT_TYPES = {
  WALL: 'wall',
  WATER: 'water',
  ENEMY: 'enemy',
  POWER_UP: 'powerUp',
  EXIT: 'exit'
};

export const ENEMY_TYPES = [
  { id: 'bee', name: 'Bee', defaultWidth: 35, defaultHeight: 30 },
  { id: 'gator', name: 'Gator', defaultWidth: 80, defaultHeight: 72 },
  { id: 'lion', name: 'Lion', defaultWidth: 62, defaultHeight: 72 }
];

export const POWER_UP_TYPES = [
  { id: 'speed', name: 'Speed Boost' },
  { id: 'invincibility', name: 'Invincibility' }
]; 