const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        require: true
    }
});

// Simplified error handling
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

console.log('Attempting to connect to database...');
console.log('Connection string:', process.env.DATABASE_URL);

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
        return;
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            console.error('Error executing query', err.stack);
            return;
        }
        console.log('Database connected successfully at:', result.rows[0].now);
    });
});

module.exports = pool; 