const pool = require('./config/db');

const initDatabase = async () => {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('Users table created successfully');

        // Create seats table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seats (
                seat_id SERIAL PRIMARY KEY,
                seat_number INTEGER NOT NULL,
                is_booked BOOLEAN DEFAULT FALSE,
                row_number INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('Seats table created successfully');

        // Initialize seats if empty
        const seatCount = await pool.query('SELECT COUNT(*) FROM seats');
        if (seatCount.rows[0].count === '0') {
            // Insert 80 seats (7 seats per row, last row with 3)
            for (let i = 1; i <= 80; i++) {
                await pool.query(
                    'INSERT INTO seats (seat_number, row_number) VALUES ($1, $2)',
                    [
                        i,
                        i <= 77 ? Math.ceil(i / 7) : 12
                    ]
                );
            }
            console.log('Seats initialized successfully');
        }

    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
};

// Run initialization
initDatabase()
    .then(() => {
        console.log('Database initialized successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }); 