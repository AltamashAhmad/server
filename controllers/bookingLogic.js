const pool = require('../config/db');

const bookSeats = async (req, res) => {
    const { seatIds } = req.body;
    const numOfSeats = seatIds.length;

    try {
        // 1. Input Validation
        if (numOfSeats > 7) {
            return res.status(400).json({ 
                message: 'Cannot book more than 7 seats at a time' 
            });
        }

        await pool.query('BEGIN');

        // 2. Fetch Available Seats
        const { rows: availableSeats } = await pool.query(
            'SELECT * FROM seats WHERE is_booked = false ORDER BY row_number, seat_number'
        );

        // 3. Check Seat Availability
        if (availableSeats.length < numOfSeats) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'Not enough seats available' 
            });
        }

        // 4. Group seats by row
        const seatsByRow = {};
        for (let i = 1; i <= 12; i++) {
            seatsByRow[i] = availableSeats.filter(seat => seat.row_number === i);
        }

        let seatsToBook = [];

        // Try booking in same row
        for (let row = 1; row <= 12; row++) {
            const rowSeats = seatsByRow[row];
            if (rowSeats.length >= numOfSeats) {
                // Check for consecutive seats
                for (let i = 0; i <= rowSeats.length - numOfSeats; i++) {
                    const consecutive = rowSeats.slice(i, i + numOfSeats);
                    if (consecutive.length === numOfSeats && 
                        consecutive.every((seat, index) => 
                            index === 0 || consecutive[index - 1].seat_number === seat.seat_number - 1
                        )) {
                        seatsToBook = consecutive;
                        break;
                    }
                }
                if (seatsToBook.length > 0) break;
            }
        }

        // 5. If no seats in same row, try nearby rows
        if (seatsToBook.length === 0) {
            let availableByRow = [];
            for (let row = 1; row <= 12; row++) {
                availableByRow.push({
                    row,
                    seats: seatsByRow[row],
                    count: seatsByRow[row].length
                });
            }

            // Find best consecutive rows
            let bestRows = [];
            let minRowSpan = 12;

            for (let start = 0; start < 12; start++) {
                let count = 0;
                let end = start;
                while (end < 12 && count < numOfSeats) {
                    count += availableByRow[end].count;
                    end++;
                }
                if (count >= numOfSeats && (end - start) < minRowSpan) {
                    minRowSpan = end - start;
                    bestRows = availableByRow.slice(start, end);
                }
            }

            if (bestRows.length > 0) {
                seatsToBook = bestRows.flatMap(row => row.seats)
                    .slice(0, numOfSeats);
            }
        }

        // 6. Check if we found seats to book
        if (seatsToBook.length < numOfSeats) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'Could not find suitable seats' 
            });
        }

        // Book the seats
        const seatIdsToBook = seatsToBook.map(seat => seat.seat_id);
        await pool.query(
            'UPDATE seats SET is_booked = true WHERE seat_id = ANY($1)',
            [seatIdsToBook]
        );

        await pool.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'Seats booked successfully',
            seats: seatsToBook
        });

    } catch (error) {
        // 7. Error Handling
        await pool.query('ROLLBACK');
        console.error('Booking error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

const getAllSeats = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM seats ORDER BY row_number, seat_number'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching seats:', error);
        res.status(500).json({ error: 'Failed to fetch seats' });
    }
};

const resetAllSeats = async (req, res) => {
    try {
        await pool.query('BEGIN');
        await pool.query('UPDATE seats SET is_booked = false');
        const { rows } = await pool.query('SELECT * FROM seats ORDER BY row_number, seat_number');
        await pool.query('COMMIT');
        return res.status(200).json({
            success: true,
            message: 'All seats reset successfully',
            seats: rows
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Reset error:', error);
        return res.status(500).json({ success: false, error: 'Failed to reset seats' });
    }
};

module.exports = { bookSeats, getAllSeats, resetAllSeats };