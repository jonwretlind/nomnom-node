import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Stage, Layer, Rect, Circle } from 'react-konva';

const LevelPreview = ({ open, onClose, levelData }) => {
  const PREVIEW_WIDTH = 800;
  const PREVIEW_HEIGHT = 600;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <DialogTitle>
        Level Preview
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stage width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT}>
          <Layer>
            {/* Walls */}
            {levelData.maze.map((wall, i) => (
              <Rect
                key={`wall-${i}`}
                x={wall[0]}
                y={wall[1]}
                width={wall[2]}
                height={wall[3]}
                fill="#666"
              />
            ))}
            
            {/* Water */}
            {levelData.terrain.map((terrain, i) => (
              <Rect
                key={`terrain-${i}`}
                x={terrain.x}
                y={terrain.y}
                width={terrain.width}
                height={terrain.height}
                fill={terrain.type === 'water' ? '#4444ff66' : '#666'}
              />
            ))}
            
            {/* Power-ups */}
            {levelData.powerUps.map((powerUp, i) => (
              <Circle
                key={`powerup-${i}`}
                x={powerUp.x}
                y={powerUp.y}
                radius={10}
                fill={powerUp.type === 'speed' ? '#ffff00' : '#ff00ff'}
              />
            ))}
            
            {/* Exit */}
            {levelData.exit && (
              <Rect
                x={levelData.exit.x}
                y={levelData.exit.y}
                width={levelData.exit.width}
                height={levelData.exit.height}
                fill="#00ff00"
              />
            )}
            
            {/* Enemies */}
            {levelData.enemies.map((enemy, i) => (
              <Rect
                key={`enemy-${i}`}
                x={enemy.x}
                y={enemy.y}
                width={enemy.width}
                height={enemy.height}
                fill="#ff0000"
              />
            ))}
          </Layer>
        </Stage>
      </DialogContent>
    </Dialog>
  );
};

export default LevelPreview; 