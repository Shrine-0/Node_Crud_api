const logs = require('./logger_node');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const express = require('express');
const app = express();
//? or the below method of initialiaing app 
// const app  = require('express')();

//!middleware usage---->
app.use(express.json())//* will now convert the body to json for handler usage
//!<--------
const { Pool } = require('pg');
const pool = new Pool({
    user: 'nischal',
    host: '127.0.0.1',
    password: '1234',
    database: 'node_db',
    port: 5431
});


const PORT = 3000;
const { readFile } = require('fs').promises;


app.post('/tokenGenerator', async (req, res) => {
    const { refreshToken } = req.body;
    let result = null;
    try {
        result = await pool.query(`select * from token where refreshtoken = '${refreshToken}'`);
    } catch (err) {
        return res.status(418).send({
            Message: "cannot access token in the DB",
            Error: err.message
        });
    }
    if (refreshToken == null)
        return res.sendStatus(401);
    if (!result.rowCount > 0)
        return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
        if (err)
            return sendStatus(403);
        const accessToken = generateAccessToken({ user: user.name });
        res.json({
            user: user.name,
            accessTokem: accessToken
        });
    });
});

app.delete('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    const sql = `delete from token where refreshtoken = \$1`;
    const values = [refreshToken];
    try {
       const result= await pool.query(sql, values);
        if (result){
            res.sendStatus(200);
        }
    } catch (err) {
        if (err)
            return res.status(418).send({
                Message: "cant delete from the token table",
                Error: err.message
            });
    }
});

app.post('/login', async (req, res) => {
    const {TableName,email,password } = req.body;
    try {
        // const result = await pool.query(`select * from ${TableName} 
        // where email = '${Email}'
        // `);
        const sql = `select * from ${TableName} where email = \$1 and password = \$2`;
        const values =[email,password];
        const result = await pool.query(sql,values);
        // const result =  pool.query('SELECT * FROM \$1 WHERE name = \$2', [TableName, name]);
        if (!result.rows.length)
            return res.json({
                Message: "not a valid user",
            });
        else {
            const user = {
                name: result.rows[0].name,
                password: result.rows[0].password
            };
            const accessToken = generateAccessToken(user);//* creates accesstoken by serilizing accrodingly to the jwt structure(header.body.signature)
            const refreshToken = generateRefreshToken(user);
            res.json({
                user: user.name,
                AccessToken: accessToken,
                RefreshToken: refreshToken,
            });
        }

    } catch (err) {
        return res.status(418);
    }
});

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '15m' });

}
function generateRefreshToken(user) {

    let token = jwt.sign(user, process.env.REFRESH_TOKEN);
    refreshToDb(token,user);
    return token;
}

async function refreshToDb(token,user) {
    const sql = `insert into token (refreshToken,name) values (\$1,\$2)`;
    const values = [token,user.name];
    try {
        await pool.query(sql, values);
    } catch (err) {
        return res.status(418).send({
            Message: "Error while adding refresh token to the DB"
        });
    }
}

app.listen(PORT, () => {
    console.log(`App is running in ----------> http://localhost:${PORT}`);
});