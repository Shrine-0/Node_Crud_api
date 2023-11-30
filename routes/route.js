const express = require('express');
const router =  express.Router();

const createTable = require('../controllers/_database/v1/create_table');
router.post('/create_table',createTable.createTable);

module.exports = router;