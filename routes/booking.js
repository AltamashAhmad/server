const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all seats
router.get('/seats', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM seats ORDER BY seat_number'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching seats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Initialize seats if not exists
const initializeSeats = async () => {
    try {
        // Create seats table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seats (
                seat_id SERIAL PRIMARY KEY,
                seat_number INTEGER NOT NULL,
                row_number INTEGER NOT NULL,
                is_booked BOOLEAN DEFAULT FALSE
            )
        `);

        // Check if seats exist
        const seatCount = await pool.query('SELECT COUNT(*) FROM seats');
        if (seatCount.rows[0].count === '0') {
            // Insert 80 seats
            for (let i = 1; i <= 80; i++) {
                await pool.query(
                    'INSERT INTO seats (seat_number, row_number, is_booked) VALUES ($1, $2, $3)',
                    [i, Math.ceil(i / 7), false]
                );
            }
        }
    } catch (error) {
        console.error('Error initializing seats:', error);
    }
};

// Initialize seats when module loads
initializeSeats();

// Book seats
router.post('/book', async (req, res) => {
    try {
        const { seatIds } = req.body;
        
        // Start transaction
        await pool.query('BEGIN');

        // Update seats
        await pool.query(
            'UPDATE seats SET is_booked = TRUE WHERE seat_id = ANY($1)',
            [seatIds]
        );

        await pool.query('COMMIT');
        res.json({ message: 'Seats booked successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error booking seats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reset all seats
router.post('/reset', async (req, res) => {
    try {
        await pool.query('UPDATE seats SET is_booked = FALSE');
        res.json({ message: 'All seats reset successfully' });
    } catch (error) {
        console.error('Error resetting seats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 