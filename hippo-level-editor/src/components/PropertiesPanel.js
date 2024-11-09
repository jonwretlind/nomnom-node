import React from 'react';
import { 
  Paper, 
  Typography, 
  TextField, 
  Box,
  Button,
  Divider,
  MenuItem
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { GRID_CONFIG, ENEMY_TYPES } from '../constants/gridConfig';

const PropertiesPanel = ({ selectedElement, onElementUpdate, onElementDelete }) => {
  if (!selectedElement) {
    return (
      <Paper sx={{ width: 300, p: 2 }}>
        <Typography>No element selected</Typography>
      </Paper>
    );
  }

  const handleChange = (field, rawValue) => {
    if (selectedElement.type === 'enemy') {
      const value = field === 'type' || field.includes('attackPattern') ? rawValue : parseFloat(rawValue);
      
      let updatedElement = { ...selectedElement };
      
      if (field.includes('properties.')) {
        const propertyName = field.split('.')[1];
        updatedElement.properties = {
          ...updatedElement.properties,
          [propertyName]: value
        };
      } else if (field === 'type') {
        const enemyDefaults = ENEMY_TYPES[value.toUpperCase()];
        updatedElement = {
          ...updatedElement,
          type: value,
          width: enemyDefaults.width,
          height: enemyDefaults.height,
          properties: {
            ...enemyDefaults.defaultProperties
          }
        };
      } else {
        updatedElement[field] = value;
      }
      
      onElementUpdate(updatedElement);
    } else if (selectedElement.type === 'respawn') {
      const value = parseFloat(rawValue);
      if (isNaN(value)) return;

      const updatedElement = {
        ...selectedElement,
        [field]: value
      };
      onElementUpdate(updatedElement);
    } else {
      const value = field === 'powerUpType' ? rawValue : parseFloat(rawValue);
      if (field !== 'powerUpType' && isNaN(value)) return;

      if (selectedElement.type === 'powerUp') {
        const updatedElement = {
          ...selectedElement,
          [field]: value
        };
        // Reset multiplier when changing from speed to invincibility
        if (field === 'powerUpType' && value === 'invincibility') {
          delete updatedElement.multiplier;
        }
        onElementUpdate(updatedElement);
      } else if (selectedElement.type === 'exit') {
        const updatedElement = {
          ...selectedElement,
          [field]: value
        };
        onElementUpdate(updatedElement);
      } else {
        if (selectedElement.type === 'wall') {
          // For walls, we need to update the array format [x, y, width, height]
          const wallData = {
            ...selectedElement,
            [field]: value
          };

          onElementUpdate({
            type: 'wall',
            index: selectedElement.index,
            x: field === 'x' ? value : selectedElement.x,
            y: field === 'y' ? value : selectedElement.y,
            width: field === 'width' ? value : selectedElement.width,
            height: field === 'height' ? value : selectedElement.height
          });
        } else if (selectedElement.type === 'water') {
          if (field.startsWith('properties.')) {
            const propertyName = field.split('.')[1];
            onElementUpdate({
              ...selectedElement,
              properties: {
                ...selectedElement.properties,
                [propertyName]: value
              }
            });
          } else {
            onElementUpdate({
              ...selectedElement,
              [field]: value
            });
          }
        }
      }
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentValue = parseFloat(e.target.value) || 0;
      const step = e.shiftKey ? 25 : 5;
      const delta = e.key === 'ArrowUp' ? step : -step;
      const newValue = currentValue + delta;
      
      // Ensure the value is within bounds
      const maxValue = field.includes('width') ? GRID_CONFIG.CANVAS_WIDTH : 
                      field.includes('height') ? GRID_CONFIG.CANVAS_HEIGHT : 
                      field.includes('x') ? GRID_CONFIG.CANVAS_WIDTH : 
                      GRID_CONFIG.CANVAS_HEIGHT;
      
      const boundedValue = Math.max(0, Math.min(newValue, maxValue));
      handleChange(field, boundedValue);
    }
  };

  const renderSpecificProperties = () => {
    switch (selectedElement.type) {
      case 'water':
        return (
          <>
            <Divider />
            <TextField
              select
              label="Flow Direction"
              value={selectedElement.properties?.flowDirection || 'right'}
              onChange={(e) => handleChange('properties.flowDirection', e.target.value)}
              fullWidth
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="right">Right</MenuItem>
              <MenuItem value="up">Up</MenuItem>
              <MenuItem value="down">Down</MenuItem>
            </TextField>
            <TextField
              label="Flow Speed"
              type="number"
              value={selectedElement.properties?.flowSpeed || 100}
              onChange={(e) => handleChange('properties.flowSpeed', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'properties.flowSpeed')}
              fullWidth
              inputProps={{ 
                step: 10,
                min: 0,
                max: 1000
              }}
            />
          </>
        );

      case 'powerPill':
        return (
          <>
            <Divider />
            <TextField
              label="Value"
              type="number"
              value={selectedElement.value || 10}
              onChange={(e) => handleChange('value', e.target.value)}
              fullWidth
              inputProps={{ 
                step: 5,
                min: 5,
                max: 100
              }}
            />
          </>
        );

      case 'powerUp':
        return (
          <>
            <Divider />
            <TextField
              select
              label="Power-Up Type"
              value={selectedElement.powerUpType || selectedElement.type || 'speed'}
              onChange={(e) => {
                const updatedElement = {
                  ...selectedElement,
                  powerUpType: e.target.value,
                  type: 'powerUp',
                  // Reset multiplier if changing to invincibility
                  multiplier: e.target.value === 'invincibility' ? undefined : selectedElement.multiplier
                };
                onElementUpdate(updatedElement);
              }}
              fullWidth
            >
              <MenuItem value="speed">Speed Boost</MenuItem>
              <MenuItem value="invincibility">Invincibility</MenuItem>
            </TextField>
            <TextField
              label="Duration (ms)"
              type="number"
              value={selectedElement.duration || 5000}
              onChange={(e) => handleChange('duration', e.target.value)}
              fullWidth
              inputProps={{ 
                step: 500,
                min: 1000,
                max: 10000
              }}
            />
            {(selectedElement.powerUpType === 'speed' || selectedElement.type === 'speed') && (
              <TextField
                label="Speed Multiplier"
                type="number"
                value={selectedElement.multiplier || 1.5}
                onChange={(e) => handleChange('multiplier', e.target.value)}
                fullWidth
                inputProps={{ 
                  step: 0.1,
                  min: 1.1,
                  max: 3.0
                }}
              />
            )}
          </>
        );

      case 'exit':
        return (
          <>
            <Divider />
            <TextField
              label="Width"
              type="number"
              value={selectedElement.width || 64}
              onChange={(e) => handleChange('width', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'width')}
              fullWidth
              inputProps={{ 
                step: 25,
                min: 25,
                max: GRID_CONFIG.CANVAS_WIDTH
              }}
            />
            <TextField
              label="Height"
              type="number"
              value={selectedElement.height || 64}
              onChange={(e) => handleChange('height', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'height')}
              fullWidth
              inputProps={{ 
                step: 25,
                min: 25,
                max: GRID_CONFIG.CANVAS_HEIGHT
              }}
            />
          </>
        );

      case 'enemy':
        return (
          <>
            <Divider />
            <TextField
              select
              label="Enemy Type"
              value={selectedElement.enemyType || selectedElement.type}
              onChange={(e) => {
                const enemyType = e.target.value;
                const enemyDefaults = ENEMY_TYPES[enemyType.toUpperCase()];
                const updatedElement = {
                  ...selectedElement,
                  type: 'enemy',
                  enemyType: enemyType,
                  width: enemyDefaults.width,
                  height: enemyDefaults.height,
                  properties: {
                    ...enemyDefaults.defaultProperties
                  }
                };
                onElementUpdate(updatedElement);
              }}
              fullWidth
            >
              <MenuItem value="bee">Bee</MenuItem>
              <MenuItem value="lion">Lion</MenuItem>
              <MenuItem value="gator">Gator</MenuItem>
            </TextField>
            <TextField
              label="Speed"
              type="number"
              value={selectedElement.speed || 90}
              onChange={(e) => handleChange('speed', e.target.value)}
              fullWidth
              inputProps={{ 
                step: 10,
                min: 50,
                max: 200
              }}
            />
            {selectedElement.type === 'bee' && (
              <>
                <TextField
                  label="Flight Height"
                  type="number"
                  value={selectedElement.properties?.flightHeight || 2}
                  onChange={(e) => handleChange('properties.flightHeight', e.target.value)}
                  fullWidth
                  inputProps={{ step: 1, min: 1, max: 5 }}
                />
                <TextField
                  select
                  label="Attack Pattern"
                  value={selectedElement.properties?.attackPattern || 'zigzag'}
                  onChange={(e) => handleChange('properties.attackPattern', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="zigzag">Zigzag</MenuItem>
                  <MenuItem value="circle">Circle</MenuItem>
                  <MenuItem value="chase">Chase</MenuItem>
                </TextField>
              </>
            )}
            {selectedElement.type === 'gator' && (
              <>
                <TextField
                  label="Water Speed Bonus"
                  type="number"
                  value={selectedElement.properties?.waterSpeedBonus || 2.0}
                  onChange={(e) => handleChange('properties.waterSpeedBonus', e.target.value)}
                  fullWidth
                  inputProps={{ step: 0.1, min: 1.0, max: 3.0 }}
                />
                <TextField
                  label="Land Speed Penalty"
                  type="number"
                  value={selectedElement.properties?.landSpeedPenalty || 0.5}
                  onChange={(e) => handleChange('properties.landSpeedPenalty', e.target.value)}
                  fullWidth
                  inputProps={{ step: 0.1, min: 0.1, max: 1.0 }}
                />
              </>
            )}
            {selectedElement.type === 'lion' && (
              <>
                <TextField
                  label="Roar Radius"
                  type="number"
                  value={selectedElement.properties?.roarRadius || 200}
                  onChange={(e) => handleChange('properties.roarRadius', e.target.value)}
                  fullWidth
                  inputProps={{ step: 25, min: 100, max: 300 }}
                />
                <TextField
                  label="Stun Duration (ms)"
                  type="number"
                  value={selectedElement.properties?.stunDuration || 1000}
                  onChange={(e) => handleChange('properties.stunDuration', e.target.value)}
                  fullWidth
                  inputProps={{ step: 100, min: 500, max: 2000 }}
                />
              </>
            )}
          </>
        );

      case 'respawn':
        return (
          <>
            <Divider />
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Enemy respawn location
            </Typography>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ width: 300, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <TextField
          label="X Position"
          type="number"
          value={selectedElement.x}
          onChange={(e) => handleChange('x', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'x')}
          fullWidth
          inputProps={{ 
            step: 25,
            min: 0,
            max: GRID_CONFIG.CANVAS_WIDTH
          }}
        />
        <TextField
          label="Y Position"
          type="number"
          value={selectedElement.y}
          onChange={(e) => handleChange('y', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'y')}
          fullWidth
          inputProps={{ 
            step: 25,
            min: 0,
            max: GRID_CONFIG.CANVAS_HEIGHT
          }}
        />
        {(selectedElement.type === 'wall' || selectedElement.type === 'water') && (
          <>
            <TextField
              label="Width"
              type="number"
              value={selectedElement.width}
              onChange={(e) => handleChange('width', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'width')}
              fullWidth
              inputProps={{ 
                step: 25,
                min: 25,
                max: GRID_CONFIG.CANVAS_WIDTH
              }}
            />
            <TextField
              label="Height"
              type="number"
              value={selectedElement.height}
              onChange={(e) => handleChange('height', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'height')}
              fullWidth
              inputProps={{ 
                step: 25,
                min: 25,
                max: GRID_CONFIG.CANVAS_HEIGHT
              }}
            />
          </>
        )}
        
        {renderSpecificProperties()}
      </Box>

      <Button
        variant="contained"
        color="error"
        startIcon={<Delete />}
        onClick={() => onElementDelete(selectedElement)}
        fullWidth
      >
        Delete Element
      </Button>
    </Paper>
  );
};

export default PropertiesPanel;