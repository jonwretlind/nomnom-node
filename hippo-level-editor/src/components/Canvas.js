import React, { useState } from 'react';
import { Stage, Layer, Rect, Line, Group, Text, Circle, Star } from 'react-konva';
import { GRID_CONFIG, ELEMENT_TYPES, ENEMY_TYPES } from '../constants/gridConfig';

const Canvas = ({ levelData, setLevelData, selectedTool, onElementSelect }) => {
  const [movingElement, setMovingElement] = useState(null);
  
  const drawGrid = () => {
    const gridLines = [];
    const coordinates = [];
    
    // Draw vertical lines every 25 pixels
    for (let i = 0; i <= GRID_CONFIG.CANVAS_WIDTH; i += GRID_CONFIG.CELL_SIZE) {
      gridLines.push(
        <Line
          key={`v${i}`}
          points={[i, 0, i, GRID_CONFIG.CANVAS_HEIGHT]}
          stroke={GRID_CONFIG.GRID_COLOR}
          strokeWidth={1}
        />
      );
      
      // Coordinate number (every 100 pixels)
      if (i % 100 === 0) {
        coordinates.push(
          <Text
            key={`cx${i}`}
            x={i + 2}
            y={2}
            text={`${i}`}
            fontSize={10}
            fill={GRID_CONFIG.COORDINATE_COLOR}
          />
        );
      }
    }
    
    // Draw horizontal lines every 25 pixels
    for (let i = 0; i <= GRID_CONFIG.CANVAS_HEIGHT; i += GRID_CONFIG.CELL_SIZE) {
      gridLines.push(
        <Line
          key={`h${i}`}
          points={[0, i, GRID_CONFIG.CANVAS_WIDTH, i]}
          stroke={GRID_CONFIG.GRID_COLOR}
          strokeWidth={1}
        />
      );
      
      // Coordinate number (every 100 pixels)
      if (i % 100 === 0) {
        coordinates.push(
          <Text
            key={`cy${i}`}
            x={2}
            y={i + 2}
            text={`${i}`}
            fontSize={10}
            fill={GRID_CONFIG.COORDINATE_COLOR}
          />
        );
      }
    }

    // Draw canvas border
    const border = (
      <Rect
        key="border"
        x={0}
        y={0}
        width={GRID_CONFIG.CANVAS_WIDTH}
        height={GRID_CONFIG.CANVAS_HEIGHT}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={2}
      />
    );
    
    return (
      <Group>
        {gridLines}
        {coordinates}
        {border}
      </Group>
    );
  };

  const snapToGrid = (pos) => {
    // Snap to nearest 25px increment
    const snapped = Math.round(pos / GRID_CONFIG.CELL_SIZE) * GRID_CONFIG.CELL_SIZE;
    return Math.max(0, Math.min(snapped, GRID_CONFIG.CANVAS_WIDTH - GRID_CONFIG.CELL_SIZE));
  };

  const constrainSize = (size, maxSize) => {
    return Math.min(Math.max(GRID_CONFIG.CELL_SIZE, size), maxSize);
  };

  const handleElementClick = (e, element, type, index) => {
    // Stop event from bubbling to stage
    e.cancelBubble = true;

    if (selectedTool === ELEMENT_TYPES.ERASE) {
      setLevelData(prev => {
        const newData = { ...prev };
        switch (type) {
          case 'wall':
            newData.maze = prev.maze.filter((_, i) => i !== index);
            break;
          case 'water':
            newData.terrain = prev.terrain.filter((_, i) => i !== index);
            break;
          case 'powerPill':
            newData.powerPills = prev.powerPills.filter((_, i) => i !== index);
            break;
          case 'powerUp':
            newData.powerUps = prev.powerUps.filter((_, i) => i !== index);
            break;
          case 'enemy':
            newData.enemies = prev.enemies.filter((_, i) => i !== index);
            break;
          case 'respawn':
            newData.respawnPoints = prev.respawnPoints.filter((_, i) => i !== index);
            break;
        }
        return newData;
      });
    } else {
      // When selecting an enemy, pass all its properties
      if (type === 'enemy') {
        const enemy = levelData.enemies[index];
        onElementSelect({
          ...enemy,
          index,
          type: 'enemy',
          enemyType: enemy.type,
          properties: enemy.properties || {},
          speed: enemy.speed || 90,
          width: ENEMY_TYPES[enemy.type.toUpperCase()]?.width,
          height: ENEMY_TYPES[enemy.type.toUpperCase()]?.height
        });
      } else {
        onElementSelect({ ...element, type, index });
      }
    }
  };

  const handleStageMouseMove = (e) => {
    if (!movingElement) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const x = snapToGrid(pos.x);
    const y = snapToGrid(pos.y);

    // Update element position
    setLevelData(prev => {
      const newData = { ...prev };
      if (movingElement.type === 'wall') {
        const wall = [...prev.maze[movingElement.index]];
        wall[0] = x;
        wall[1] = y;
        newData.maze[movingElement.index] = wall;
      } else if (movingElement.type === 'water') {
        newData.terrain[movingElement.index] = {
          ...prev.terrain[movingElement.index],
          x,
          y
        };
      }
      return newData;
    });
  };

  const handleStageMouseUp = () => {
    setMovingElement(null);
  };

  const handleDragEnd = (e, type, index) => {
    // Snap the final position to grid
    const x = snapToGrid(e.target.x());
    const y = snapToGrid(e.target.y());

    setLevelData(prev => {
      const newData = { ...prev };
      if (type === 'wall') {
        const wall = [...prev.maze[index]];
        wall[0] = x;
        wall[1] = y;
        newData.maze[index] = wall;
      } else if (type === 'water') {
        newData.terrain[index] = {
          ...prev.terrain[index],
          x,
          y
        };
      } else if (type === 'respawn') {
        newData.respawnPoints[index] = {
          x,
          y
        };
      }
      return newData;
    });
  };

  const getEnemyColor = (enemyType) => {
    switch (enemyType) {
      case 'bee':
        return '#FFA500'; // Orange
      case 'lion':
        return '#8B4513'; // Brown
      case 'gator':
        return '#006400'; // Dark green
      default:
        return '#ff0000';
    }
  };

  const renderWalls = () => {
    return levelData.maze.map((wall, index) => (
      <Rect
        key={`wall-${index}`}
        x={wall[0]}
        y={wall[1]}
        width={wall[2]}
        height={wall[3]}
        fill="#555"
        stroke={selectedTool === ELEMENT_TYPES.ERASE ? "#ff4444" : "#666"}
        strokeWidth={selectedTool === ELEMENT_TYPES.ERASE ? 2 : 1}
        onClick={(e) => handleElementClick(e, { 
          x: wall[0],
          y: wall[1],
          width: wall[2],
          height: wall[3]
        }, 'wall', index)}
        draggable={selectedTool === ELEMENT_TYPES.MOVE}
        onDragEnd={(e) => {
          const pos = e.target.position();
          handleDragEnd(pos, 'wall', index);
        }}
        onDragMove={(e) => {
          const pos = e.target.position();
          e.target.position({
            x: snapToGrid(pos.x),
            y: snapToGrid(pos.y)
          });
        }}
      />
    ));
  };

  const renderTerrain = () => {
    return levelData.terrain.map((terrain, index) => (
      <Rect
        key={`terrain-${index}`}
        x={terrain.x}
        y={terrain.y}
        width={terrain.width}
        height={terrain.height}
        fill="rgba(0, 100, 255, 0.5)"
        stroke={selectedTool === ELEMENT_TYPES.ERASE ? "#ff4444" : "#0066cc"}
        strokeWidth={selectedTool === ELEMENT_TYPES.ERASE ? 2 : 1}
        onClick={(e) => handleElementClick(e, terrain, 'water', index)}
        draggable={selectedTool === ELEMENT_TYPES.MOVE}
        onDragEnd={(e) => {
          const pos = e.target.position();
          handleDragEnd(pos, 'water', index);
        }}
        onDragMove={(e) => {
          const pos = e.target.position();
          e.target.position({
            x: snapToGrid(pos.x),
            y: snapToGrid(pos.y)
          });
        }}
      />
    ));
  };

  const renderPowerPills = () => {
    return levelData.powerPills?.map((pill, index) => (
      <Circle
        key={`pill-${index}`}
        x={pill.x}
        y={pill.y}
        radius={10}
        fill="#FFD700"
        stroke={selectedTool === ELEMENT_TYPES.ERASE ? "#ff4444" : "#FFA500"}
        strokeWidth={selectedTool === ELEMENT_TYPES.ERASE ? 2 : 1}
        onClick={(e) => handleElementClick(e, { ...pill, type: 'powerPill' }, 'powerPill', index)}
        draggable={selectedTool === ELEMENT_TYPES.MOVE}
        onDragEnd={(e) => handleDragEnd(e, 'powerPill', index)}
        onDragMove={(e) => {
          const pos = e.target.position();
          e.target.position({
            x: snapToGrid(pos.x),
            y: snapToGrid(pos.y)
          });
        }}
      />
    ));
  };

  const renderPowerUps = () => {
    return levelData.powerUps?.map((powerUp, index) => (
      <Star
        key={`powerup-${index}`}
        x={powerUp.x}
        y={powerUp.y}
        numPoints={5}
        innerRadius={10}
        outerRadius={20}
        fill={powerUp.type === 'speed' ? '#00FF00' : '#FF00FF'}
        stroke={selectedTool === ELEMENT_TYPES.ERASE ? "#ff4444" : "#666"}
        strokeWidth={selectedTool === ELEMENT_TYPES.ERASE ? 2 : 1}
        onClick={(e) => handleElementClick(e, powerUp, 'powerUp', index)}
        draggable={selectedTool === ELEMENT_TYPES.MOVE}
        onDragEnd={(e) => handleDragEnd(e, 'powerUp', index)}
        onDragMove={(e) => {
          const pos = e.target.position();
          e.target.position({
            x: snapToGrid(pos.x),
            y: snapToGrid(pos.y)
          });
        }}
      />
    ));
  };

  const renderEnemies = () => {
    return levelData.enemies?.map((enemy, index) => (
      <Rect
        key={`enemy-${index}`}
        x={enemy.x}
        y={enemy.y}
        width={enemy.width || ENEMY_TYPES[enemy.type.toUpperCase()]?.width || 62}
        height={enemy.height || ENEMY_TYPES[enemy.type.toUpperCase()]?.height || 72}
        fill={getEnemyColor(enemy.type)}
        stroke={selectedTool === ELEMENT_TYPES.ERASE ? "#ff4444" : "#666"}
        strokeWidth={selectedTool === ELEMENT_TYPES.ERASE ? 2 : 1}
        onClick={(e) => handleElementClick(e, enemy, 'enemy', index)}
        draggable={selectedTool === ELEMENT_TYPES.MOVE}
        onDragEnd={(e) => {
          const pos = e.target.position();
          handleDragEnd(pos, 'enemy', index);
        }}
        onDragMove={(e) => {
          const pos = e.target.position();
          e.target.position({
            x: snapToGrid(pos.x),
            y: snapToGrid(pos.y)
          });
        }}
      />
    ));
  };

  const renderExit = () => {
    if (levelData.exit) {
      return (
        <Rect
          x={levelData.exit.x}
          y={levelData.exit.y}
          width={levelData.exit.width || 64}
          height={levelData.exit.height || 64}
          fill="#00ff00"
          stroke={selectedTool === ELEMENT_TYPES.ERASE ? "#ff4444" : "#00cc00"}
          strokeWidth={selectedTool === ELEMENT_TYPES.ERASE ? 2 : 1}
          onClick={(e) => handleElementClick(e, { ...levelData.exit, type: 'exit' }, 'exit', 0)}
          draggable={selectedTool === ELEMENT_TYPES.MOVE}
          onDragEnd={(e) => {
            const pos = e.target.position();
            handleDragEnd(pos, 'exit', 0);
          }}
          onDragMove={(e) => {
            const pos = e.target.position();
            e.target.position({
              x: snapToGrid(pos.x),
              y: snapToGrid(pos.y)
            });
          }}
        />
      );
    }
    return null;
  };

  const renderRespawnPoints = () => {
    return levelData.respawnPoints?.map((point, index) => (
      <Group
        key={`respawn-${index}`}
        x={point.x}
        y={point.y}
        onClick={(e) => handleElementClick(e, point, 'respawn', index)}
        draggable={selectedTool === ELEMENT_TYPES.MOVE}
        onDragEnd={(e) => {
          const pos = e.target.position();
          handleDragEnd(pos, 'respawn', index);
        }}
        onDragMove={(e) => {
          const pos = e.target.position();
          e.target.position({
            x: snapToGrid(pos.x),
            y: snapToGrid(pos.y)
          });
        }}
      >
        <Circle
          radius={15}
          fill="rgba(255, 165, 0, 0.3)"
          stroke={selectedTool === ELEMENT_TYPES.ERASE ? "#ff4444" : "#ff8c00"}
          strokeWidth={selectedTool === ELEMENT_TYPES.ERASE ? 2 : 1}
        />
        <Line
          points={[-10, 0, 10, 0]}
          stroke="#ff8c00"
          strokeWidth={2}
        />
        <Line
          points={[0, -10, 0, 10]}
          stroke="#ff8c00"
          strokeWidth={2}
        />
      </Group>
    ));
  };

  const handleStageClick = (e) => {
    if (!selectedTool) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const x = snapToGrid(pos.x);
    const y = snapToGrid(pos.y);

    switch (selectedTool) {
      case ELEMENT_TYPES.WALL:
        // Default wall size matching the game's typical wall dimensions
        const wallWidth = GRID_CONFIG.CELL_SIZE * 4;  // 100px
        const wallHeight = GRID_CONFIG.CELL_SIZE;     // 25px
        
        if (x + wallWidth <= GRID_CONFIG.CANVAS_WIDTH && 
            y + wallHeight <= GRID_CONFIG.CANVAS_HEIGHT) {
          setLevelData(prev => ({
            ...prev,
            maze: [...prev.maze, [x, y, wallWidth, wallHeight]]
          }));
        }
        break;

      case ELEMENT_TYPES.WATER:
        // Default water size matching the game's typical water dimensions
        const waterWidth = GRID_CONFIG.CELL_SIZE * 8;   // 200px
        const waterHeight = GRID_CONFIG.CELL_SIZE * 4;  // 100px
        
        if (x + waterWidth <= GRID_CONFIG.CANVAS_WIDTH && 
            y + waterHeight <= GRID_CONFIG.CANVAS_HEIGHT) {
          const newTerrain = {
            type: 'water',
            x,
            y,
            width: waterWidth,
            height: waterHeight,
            properties: {
              flowDirection: 'right',
              flowSpeed: 100,
              playerSpeedMultiplier: 1.5
            }
          };
          setLevelData(prev => ({
            ...prev,
            terrain: [...prev.terrain, newTerrain]
          }));
        }
        break;

      case ELEMENT_TYPES.POWER_PILL:
        setLevelData(prev => ({
          ...prev,
          powerPills: [...(prev.powerPills || []), {
            x,
            y,
            value: 10
          }]
        }));
        break;

      case ELEMENT_TYPES.POWER_UP:
        const newPowerUp = {
          type: 'powerUp',
          powerUpType: 'speed',
          x,
          y,
          duration: 5000,
          multiplier: 1.5
        };
        setLevelData(prev => ({
          ...prev,
          powerUps: [...(prev.powerUps || []), newPowerUp]
        }));
        break;

      case ELEMENT_TYPES.EXIT:
        setLevelData(prev => ({
          ...prev,
          exit: {
            x,
            y,
            width: 64,
            height: 64
          }
        }));
        break;

      case ELEMENT_TYPES.ENEMY:
        const newEnemy = {
          type: 'lion', // Changed from 'enemy' to 'lion' as default
          x,
          y,
          speed: 90,
          width: ENEMY_TYPES.LION.width,
          height: ENEMY_TYPES.LION.height,
          properties: {
            ...ENEMY_TYPES.LION.defaultProperties
          }
        };
        setLevelData(prev => ({
          ...prev,
          enemies: [...(prev.enemies || []), newEnemy]
        }));
        break;

      case ELEMENT_TYPES.RESPAWN:
        setLevelData(prev => ({
          ...prev,
          respawnPoints: [...(prev.respawnPoints || []), {
            x,
            y
          }]
        }));
        break;
    }
  };

  return (
    <div className="canvas-container">
      <Stage
        width={GRID_CONFIG.CANVAS_WIDTH}
        height={GRID_CONFIG.CANVAS_HEIGHT}
        onClick={handleStageClick}
      >
        <Layer>
          {drawGrid()}
          {renderWalls()}
          {renderTerrain()}
          {renderPowerPills()}
          {renderPowerUps()}
          {renderEnemies()}
          {renderRespawnPoints()}
          {renderExit()}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;