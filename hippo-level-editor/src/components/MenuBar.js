import React, { useRef, useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Typography, 
  Box,
  Menu,
  MenuItem 
} from '@mui/material';
import { 
  Save, 
  FolderOpen, 
  Preview, 
  Download,
  Add
} from '@mui/icons-material';
import * as levelService from '../services/levelService';

const MenuBar = ({ onSave, onLoad, onExport, onPreview }) => {
  const [levels, setLevels] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadLevelsList();
  }, []);

  const loadLevelsList = async () => {
    try {
      const levelsList = await levelService.getLevels();
      setLevels(levelsList);
    } catch (error) {
      console.error('Error loading levels list:', error);
    }
  };

  const handleLoadClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLoadClose = () => {
    setAnchorEl(null);
  };

  const handleLevelSelect = async (levelId) => {
    handleLoadClose();
    onLoad(levelId);
  };

  const handleNewLevel = () => {
    onLoad({
      level: levels.length + 1,
      name: `Level ${levels.length + 1}`,
      ppSpacing: 15,
      terrain: [],
      maze: [],
      powerUps: [],
      enemies: [],
      exit: null
    });
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 0, mr: 4 }}>
          Hippo Level Editor
        </Typography>
        
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button 
            startIcon={<Save />} 
            onClick={onSave}
            variant="contained"
          >
            Save
          </Button>
          
          <Button 
            startIcon={<FolderOpen />} 
            onClick={handleLoadClick}
            variant="contained"
          >
            Load Level
          </Button>

          <Button
            startIcon={<Add />}
            onClick={handleNewLevel}
            variant="contained"
            color="success"
          >
            New Level
          </Button>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleLoadClose}
          >
            {levels.map((level) => (
              <MenuItem 
                key={level._id} 
                onClick={() => handleLevelSelect(level._id)}
              >
                {level.name} (Level {level.level})
              </MenuItem>
            ))}
          </Menu>
          
          <Button 
            startIcon={<Download />} 
            onClick={onExport}
            variant="contained"
          >
            Export JSON
          </Button>
          
          <Button 
            startIcon={<Preview />} 
            onClick={onPreview}
            variant="contained"
            color="secondary"
          >
            Preview Level
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default MenuBar; 