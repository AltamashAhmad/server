const express = require('express');
const router = express.Router();
const { bookSeats, getAllSeats, resetAllSeats } = require('../controllers/bookingLogic');
const auth = require('../middleware/auth');

// Book seats
router.post('/book', auth, bookSeats);

// Get all seats
router.get('/seats', getAllSeats);

// Reset all seats - make sure auth middleware is working
router.post('/reset', auth, resetAllSeats);

module.exports = router; 