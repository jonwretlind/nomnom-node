const mongoose = require('mongoose');
const Level = require('../models/Level');
const fs = require('fs').promises;
const path = require('path');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/hippo-noms', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Read the levels.json file
    const levelsFile = await fs.readFile(path.join(__dirname, '../../public/levels.json'), 'utf8');
    const levelsData = JSON.parse(levelsFile);

    // Clear existing levels
    await Level.deleteMany({});

    // Insert the levels
    for (const level of levelsData.levels) {
      await Level.create(level);
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 