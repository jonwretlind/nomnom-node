export const GRID_CONFIG = {
  CELL_SIZE: 25,          // Base grid size of 25px
  CANVAS_WIDTH: 1000,     // 40 cells wide
  CANVAS_HEIGHT: 750,     // 30 cells high (changed from 800)
  GRID_COLOR: 'rgba(255, 255, 255, 0.2)', // Single grid color
  COORDINATE_COLOR: 'rgba(255, 255, 255, 0.5)',
  SNAP_THRESHOLD: 12.5    // Half of CELL_SIZE for snapping
};

export const ELEMENT_TYPES = {
  WALL: 'wall',
  WATER: 'water',
  POWER_PILL: 'powerPill',
  POWER_UP: 'powerUp',
  ENEMY: 'enemy',
  RESPAWN: 'respawn',
  EXIT: 'exit',
  ERASE: 'erase',
  MOVE: 'move'
};

export const POWER_UP_TYPES = {
  SPEED: {
    type: 'speed',
    duration: 5000,
    multiplier: 1.5
  },
  INVINCIBILITY: {
    type: 'invincibility',
    duration: 3000
  }
};

export const ENEMY_TYPES = {
  BEE: {
    width: 35,
    height: 30,
    defaultProperties: {
      canCrossWater: true,
      flightHeight: 2,
      attackPattern: 'zigzag'
    }
  },
  GATOR: {
    width: 80,
    height: 72,
    defaultProperties: {
      canCrossWater: true,
      waterSpeedBonus: 2.0,
      landSpeedPenalty: 0.5
    }
  },
  LION: {
    width: 62,
    height: 72,
    defaultProperties: {
      canCrossWater: false,
      roarRadius: 200,
      stunDuration: 1000
    }
  }
}; 