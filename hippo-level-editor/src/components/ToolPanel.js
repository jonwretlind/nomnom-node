import React from 'react';
import { 
  Paper, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';
import {
  Wallpaper,
  Waves,
  Pets,
  Stars,
  ExitToApp,
  Circle,
  AutoAwesome,
  Place
} from '@mui/icons-material';
import { ELEMENT_TYPES } from '../constants/gridConfig';

const tools = [
  { id: ELEMENT_TYPES.WALL, name: 'Wall', icon: <Wallpaper /> },
  { id: ELEMENT_TYPES.WATER, name: 'Water', icon: <Waves /> },
  { id: ELEMENT_TYPES.POWER_PILL, name: 'Power Pill', icon: <Circle /> },
  { id: ELEMENT_TYPES.POWER_UP, name: 'Power-Up', icon: <AutoAwesome /> },
  { id: ELEMENT_TYPES.ENEMY, name: 'Enemy', icon: <Pets /> },
  { id: ELEMENT_TYPES.RESPAWN, name: 'Enemy Respawn', icon: <Place /> },
  { id: ELEMENT_TYPES.EXIT, name: 'Exit Gate', icon: <ExitToApp /> }
];

const ToolPanel = ({ selectedTool, onToolSelect }) => {
  return (
    <Paper sx={{ width: 240, overflow: 'auto' }}>
      <List>
        {tools.map((tool) => (
          <ListItem key={tool.id} disablePadding>
            <ListItemButton
              selected={selectedTool === tool.id}
              onClick={() => onToolSelect(tool.id)}
            >
              <ListItemIcon>{tool.icon}</ListItemIcon>
              <ListItemText primary={tool.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ToolPanel; 