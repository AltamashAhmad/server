const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body); // Log request body

        const { name, email, password } = req.body;

        // Validation
        if (!email || !password || !name) {
            console.log('Missing fields:', { email: !!email, password: !!password, name: !!name });
            return res.status(400).json({ 
                error: 'Please provide all required fields' 
            });
        }

        try {
            // Check if user exists
            console.log('Checking if user exists...');
            const userExists = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            if (userExists.rows.length > 0) {
                console.log('User already exists');
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            console.log('Hashing password...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            console.log('Creating new user...');
            const newUser = await pool.query(
                'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
                [name, email, hashedPassword]
            );

            console.log('User created successfully');

            // Create token
            const token = jwt.sign(
                { id: newUser.rows[0].user_id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            console.log('Token created successfully');
            res.json({ token });

        } catch (dbError) {
            console.error('Database operation failed:', dbError);
            throw dbError; // Re-throw to be caught by outer catch
        }

    } catch (error) {
        console.error('Registration error:', {
            message: error.message,
            stack: error.stack,
            code: error.code // PostgreSQL error code if available
        });
        
        res.status(500).json({ 
            error: 'Server error during registration',
            details: error.message,
            code: error.code
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(
            password,
            user.rows[0].password
        );

        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user.rows[0].user_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 