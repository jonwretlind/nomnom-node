import React, { useState, useEffect } from 'react';
import { Box, Container, ThemeProvider, createTheme, CssBaseline, Snackbar, Alert } from '@mui/material';
import MenuBar from './components/MenuBar';
import ToolPanel from './components/ToolPanel';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import LevelPreview from './components/LevelPreview';
import LevelMetadataPanel from './components/LevelMetadataPanel';
import * as levelService from './services/levelService';
import { ENEMY_TYPES } from './constants/gridConfig';
import './App.css';

function App() {
  const [selectedTool, setSelectedTool] = useState('wall');
  const [selectedElement, setSelectedElement] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState(null);
  const [levelData, setLevelData] = useState({
    level: 1,
    name: "New Level",
    ppSpacing: 15,
    terrain: [],
    maze: [],
    powerUps: [],
    enemies: [],
    exit: null
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'info', 'warning'
  });

  // Load level 1 on app start
  useEffect(() => {
    const loadInitialLevel = async () => {
      try {
        const levels = await levelService.getLevels();
        const level1 = levels.find(level => level.level === 1);
        if (level1) {
          setLevelData(level1);
          setCurrentLevelId(level1._id);
        } else {
          console.log('Level 1 not found in database');
        }
      } catch (error) {
        console.error('Error loading initial level:', error);
      }
    };

    loadInitialLevel();
  }, []);

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    },
  });

  const handleSave = async () => {
    try {
      if (currentLevelId) {
        await levelService.updateLevel(currentLevelId, levelData);
        setNotification({
          open: true,
          message: `Level ${levelData.level} "${levelData.name}" updated successfully`,
          severity: 'success'
        });
      } else {
        const newLevel = await levelService.createLevel(levelData);
        setCurrentLevelId(newLevel._id);
        setNotification({
          open: true,
          message: `Level ${levelData.level} "${levelData.name}" created successfully`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error saving level:', error);
      setNotification({
        open: true,
        message: `Error saving level: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleLoad = async (levelId) => {
    try {
      const loadedLevel = await levelService.getLevel(levelId);
      setLevelData(loadedLevel);
      setCurrentLevelId(loadedLevel._id);
      setNotification({
        open: true,
        message: `Level ${loadedLevel.level} "${loadedLevel.name}" loaded successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error loading level:', error);
      setNotification({
        open: true,
        message: `Error loading level: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(levelData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `level-${levelData.level}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleElementDelete = (elementToDelete) => {
    setLevelData(prev => {
      const newData = { ...prev };
      switch (elementToDelete.type) {
        case 'wall':
          newData.maze = prev.maze.filter((_, i) => i !== elementToDelete.index);
          break;
        case 'water':
          newData.terrain = prev.terrain.filter((_, i) => i !== elementToDelete.index);
          break;
        case 'powerPill':
          newData.powerPills = prev.powerPills.filter((_, i) => i !== elementToDelete.index);
          break;
        case 'powerUp':
          newData.powerUps = prev.powerUps.filter((_, i) => i !== elementToDelete.index);
          break;
        case 'enemy':
          newData.enemies = prev.enemies.filter((_, i) => i !== elementToDelete.index);
          break;
        case 'exit':
          newData.exit = null;
          break;
        case 'respawn':
          newData.respawnPoints = prev.respawnPoints.filter((_, i) => i !== elementToDelete.index);
          break;
      }
      setSelectedElement(null);
      return newData;
    });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
        <MenuBar 
          onSave={handleSave}
          onLoad={handleLoad}
          onExport={handleExport}
          onPreview={handlePreview}
        />
        
        <Container maxWidth="xl" sx={{ mt: 2, display: 'flex', gap: 2, flex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: 240 }}>
            <LevelMetadataPanel 
              levelData={levelData}
              onUpdate={setLevelData}
            />
            <ToolPanel 
              selectedTool={selectedTool} 
              onToolSelect={setSelectedTool} 
            />
          </Box>
          
          <Canvas 
            levelData={levelData}
            setLevelData={setLevelData}
            selectedTool={selectedTool}
            onElementSelect={setSelectedElement}
          />
          
          <PropertiesPanel 
            selectedElement={selectedElement}
            onElementUpdate={(updatedElement) => {
              setLevelData(prev => {
                const newData = { ...prev };
                switch (updatedElement.type) {
                  case 'wall':
                    const wallArray = [
                      updatedElement.x,
                      updatedElement.y,
                      updatedElement.width,
                      updatedElement.height
                    ];
                    newData.maze[updatedElement.index] = wallArray;
                    break;
                  case 'water':
                    newData.terrain[updatedElement.index] = updatedElement;
                    break;
                  case 'powerPill':
                    newData.powerPills[updatedElement.index] = {
                      x: updatedElement.x,
                      y: updatedElement.y,
                      value: updatedElement.value
                    };
                    break;
                  case 'powerUp':
                    newData.powerUps[updatedElement.index] = {
                      type: updatedElement.type === 'powerUp' ? updatedElement.powerUpType : updatedElement.type,
                      x: updatedElement.x,
                      y: updatedElement.y,
                      duration: updatedElement.duration,
                      multiplier: updatedElement.multiplier
                    };
                    break;
                  case 'enemy':
                    newData.enemies[updatedElement.index] = {
                      type: updatedElement.enemyType || updatedElement.type,
                      x: updatedElement.x,
                      y: updatedElement.y,
                      speed: updatedElement.speed || 90,
                      width: ENEMY_TYPES[(updatedElement.enemyType || updatedElement.type).toUpperCase()]?.width,
                      height: ENEMY_TYPES[(updatedElement.enemyType || updatedElement.type).toUpperCase()]?.height,
                      properties: {
                        ...ENEMY_TYPES[(updatedElement.enemyType || updatedElement.type).toUpperCase()]?.defaultProperties,
                        ...updatedElement.properties
                      }
                    };
                    // Update the selected element to reflect changes
                    setSelectedElement({
                      ...updatedElement,
                      type: 'enemy',
                      enemyType: updatedElement.enemyType || updatedElement.type
                    });
                    break;
                  case 'exit':
                    newData.exit = {
                      x: updatedElement.x,
                      y: updatedElement.y,
                      width: updatedElement.width || 64,
                      height: updatedElement.height || 64
                    };
                    break;
                  case 'respawn':
                    newData.respawnPoints[updatedElement.index] = {
                      x: updatedElement.x,
                      y: updatedElement.y
                    };
                    // Update the selected element to reflect changes
                    setSelectedElement(updatedElement);
                    break;
                }
                // Update the selected element to reflect changes
                setSelectedElement(updatedElement);
                return newData;
              });
            }}
            onElementDelete={handleElementDelete}
          />
        </Container>

        <LevelPreview 
          open={showPreview}
          onClose={() => setShowPreview(false)}
          levelData={levelData}
        />

        <Snackbar 
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App; 