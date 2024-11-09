import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  Box
} from '@mui/material';

const LevelMetadataPanel = ({ levelData, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({
      ...levelData,
      [field]: value
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Level Information
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Level Number"
          type="number"
          value={levelData.level}
          onChange={(e) => handleChange('level', parseInt(e.target.value, 10))}
          fullWidth
        />
        <TextField
          label="Level Name"
          value={levelData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          fullWidth
        />
        <TextField
          label="Path Point Spacing"
          type="number"
          value={levelData.ppSpacing}
          onChange={(e) => handleChange('ppSpacing', parseInt(e.target.value, 10))}
          fullWidth
          helperText="Space between pathfinding points"
        />
      </Box>
    </Paper>
  );
};

export default LevelMetadataPanel; 