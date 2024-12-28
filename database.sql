-- Drop existing tables if they exist
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create seats table
CREATE TABLE seats (
    seat_id SERIAL PRIMARY KEY,
    seat_number INTEGER NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    row_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing seat data and insert fresh data
DELETE FROM seats;

-- Insert initial seat data (80 seats, 7 per row except last row with 3)
DO $$
BEGIN
    FOR i IN 1..80 LOOP
        INSERT INTO seats (seat_number, row_number)
        VALUES (
            i,
            CASE
                WHEN i <= 77 THEN CEIL(i::float / 7)
                ELSE 12
            END
        );
    END LOOP;
END $$; 