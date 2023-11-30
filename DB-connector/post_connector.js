require('dotenv').config();
const {Pool}  = require('pg');
const pool = new Pool({
    user:process.env.POSTGRE_DB_USER,
    host:process.env.POSTGRE_DB_HOST,
    password:process.env.POSTGRE_DB_PASSWORD,
    database:process.env.POSTGRE_DB,
    port:process.env.POSTGRE_DB_PORT
});

module.exports = {pool};