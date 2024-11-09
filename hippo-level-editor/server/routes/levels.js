const express = require('express');
const router = express.Router();
const Level = require('../models/Level');

// Get all levels
router.get('/', async (req, res) => {
  try {
    const levels = await Level.find();
    res.json(levels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one level
router.get('/:id', async (req, res) => {
  try {
    const level = await Level.findById(req.params.id);
    if (level) {
      res.json(level);
    } else {
      res.status(404).json({ message: 'Level not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create level
router.post('/', async (req, res) => {
  const level = new Level(req.body);
  try {
    const newLevel = await level.save();
    res.status(201).json(newLevel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update level
router.put('/:id', async (req, res) => {
  try {
    const updatedLevel = await Level.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedLevel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete level
router.delete('/:id', async (req, res) => {
  try {
    await Level.findByIdAndDelete(req.params.id);
    res.json({ message: 'Level deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 