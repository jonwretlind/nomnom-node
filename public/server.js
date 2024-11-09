const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const isDev = process.env.NODE_ENV === 'development';

// Enable CORS
app.use(cors());

// Serve static files from the public directory with proper MIME types
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, file) => {
        // Set correct MIME type for JavaScript modules
        if (file.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Serve the appropriate index file
app.get('/', (req, res) => {
    // Check if dev mode is requested in URL
    const useDevMode = req.query.dev === 'true' || isDev;
    
    if (useDevMode) {
        res.sendFile(path.join(__dirname, 'index-dev.html'));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Set environment variables in response headers
app.use((req, res, next) => {
    // Set NODE_ENV based on URL parameter or environment variable
    const useDevMode = req.query.dev === 'true' || isDev;
    res.header('NODE_ENV', useDevMode ? 'development' : 'production');
    next();
});

// Handle module imports explicitly
app.get('*.js', (req, res, next) => {
    res.type('application/javascript');
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Game server running on port ${PORT} in ${isDev ? 'development' : 'production'} mode`);
    console.log(`Access dev mode at: http://localhost:${PORT}/?dev=true`);
}); 