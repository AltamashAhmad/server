const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://train-booking-lyart.vercel.app',
        'https://train-booking-git-main-altamashahmads-projects.vercel.app',
        'https://train-booking-5vyyh3sq9-altamashahmads-projects.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'success',
            message: 'Database connected',
            time: result.rows[0]
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Test users table
app.get('/test-users', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        res.json({
            status: 'success',
            message: 'Users table accessible',
            count: result.rows[0].count
        });
    } catch (error) {
        console.error('Users table test error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/booking', require('./routes/booking'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
}); 