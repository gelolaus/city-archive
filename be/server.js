const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import Database Connections
const connectMongo = require('./config/db-mongo');
const mysqlPool = require('./config/db-mysql'); 

const app = express();

// Middleware
app.use(cors()); // Permits future React frontend (in /fe) to communicate with this API
app.use(express.json()); // Parses incoming JSON request bodies

// Initialize MongoDB Connection
connectMongo();

// Health Check Route (Crucial for Vercel/Docker deployment checks)
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'Active', 
        message: 'City Archive API is running.',
        timestamp: new Date().toISOString()
    });
});

// Start the Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 City Archive Backend operational on port ${PORT}`);
});