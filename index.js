//!! todo  -- fix the alterTable api 

const logs = require('./logs/logger_node');
const jwt = require('jsonwebtoken');
const path = require("path");
require('dotenv').config();

const express = require('express');
const app = express();
const privateKeyPath = './keys/privateKey.pem';
const publicKeyPath = './keys/publicKey.pem';
const fs = require('fs');
const privateKey = fs.readFileSync(privateKeyPath,"utf-8");
const publicKey = fs.readFileSync(publicKeyPath,"utf-8");
//? or the below method of initialiaing app 
// const app  = require('express')();

//!middleware usage---->
app.use(express.json())//* will now convert the body to json for handler usage
//!<--------

//! Connector to node_db--->
const { Pool } = require('pg');
const pool = new Pool({
    user: 'nischal',
    host: 'host.docker.internal',
    password: '1234',
    database: 'node_db',
    port: 5431
});
//!   <---------------------
const routeDb = require('./routes/route');
const PORT = 8080;
const { readFile } = require('fs').promises;

app.use('/',routeDb);
//! ---- GET request API --------
app.get('/app', (req, res) => {
    res.status(200).send({
        Sender: "Nischal Thapa",
        Message: "Eat it"
    })//* the send here sends the javascript object in javascript object notation (JSON)
});
//! ---- POST request API ---------
app.post('/app/logo/:id', (req, res) => {
    const { id } = req.params;//*comes from the request itself technically URL parameters
    const { logo } = req.body;//*comes from the request itself techincallu the URL body 

    if (!logo) { // logical not if something is  false it makes it the opposite here its true
        res.status(418).send({
            Message: "logo not sent"
        });
    }
    else
        res.send({
            app: `📱 with my ${logo} and ${id}`,
            id_value: `${id}`,
        });

});

//! ------> API for insertion to table 
app.post('/app/insert/', authenticateToken,async (req, res) => {
    const { TableName } = req.body;
    // const {Id} = req.params;
    const { Name, Email, Password } = req.body;
    // if (!Name || !Email || !Password) {
    //     return res.status(412).send({
    //         Message: "Please check if name and email is sent",
    //     });
    // } else {
    const sql = `insert into ${TableName}(name,email,password) values (\$1, \$2, \$3)`;
    const values = [Name, Email, Password];
    try {
        // const result = await pool.query(`insert into ${TableName}(name,email,password)
        //     values('${Name}','${Email}','${Password}')
        //     `);
        const result = await pool.query(sql, values);
        if (result && result.rowCount > 0) {
            logs.customerLogs.log('info', `Successfully inserted values to ${TableName} table`);
            return res.status(200).send({
                Message: `Successully added values to the ${TableName} table`,
            });
        } else {
            return res.status(204).send({
                Message: "no data for insertion sent",
            });
        }
    } catch (err) {
        logs.customerLogs.log('error', `Error while inserting values to the ${TableName} table`);
        res.status(418).send({
            Message: `Error while inserting data to the table ${TableName}`,
            Error: err.message,
        });
    }
    // }
});

//!-------> API for select based on ID propvided
app.get('/app/select/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { TableName } = req.body;
    // const id = parseInt(Id);
    try {
        const result = await pool.query(`select * from ${TableName}
        where id = ${id}
        `);
        if (result.rowCount > 0) {
            res.status(201);
            // .send({
            //     Message: "data pulled from the table successfully",
            // });
            res.json(result.rows);
            logs.customerLogs.log('info', `Succesfully pulled  data of Id - ${id} from the s${TableName} table`);
        } else {
            res.status(418).send({
                Message: `No data present at id : ${id}`,
            });

        }
    } catch (err) {
        res.status(418).send({
            Message: `Error while pulling from table ${TableName} fro ${id}`,
            Error: err.message,
        });
        logs.customerLogs.log('error', `Error while pulling data of Id - ${id} from ${TableName} table`);
    }
});

//!-------> API for Dropping a table 
app.post('/app/drop',authenticateToken, async (req, res) => {
    const { TableName } = req.body;
    try {
        const result = await pool.query(`drop table ${TableName}`);
        if (result) {
            res.status(200).send({
                Message: `Table - ${TableName} dropped`,
            });
            logs.customerLogs.log('info', `Successfully Dropped the ${TableName} table`);
        }
    } catch (err) {
        res.status(400).send({
            Message: "Error while dropping table",
            Error: err.message,
        });
        logs.customerLogs.log('error', `Error while dropping the ${TableName} table`);
    }
});

//! -----> API for selecting data and viewing
app.get('/app/select', async (req, res) => {
    const { TableName } = req.body;
    try {
        const result = await pool.query(`select * from ${TableName} 
                           
        `);
        if (result) {
            logs.customerLogs.log('info', `Successfully pulled data from the table ${TableName}`);
            return res.json(result.rows);
        } else {
            return res.status(204).send({ Error: `no data to be pulled` });
        }
    } catch (err) {
        return res.status(418).json({
            Message: "Error while viewing data",
            Error: err.message
        });
        logs.customerLogs.log('error', `Error while pulling data from the ${TableName} table`);
    }
});
//! -----> Alter table api
app.post('/app/alterTable',authenticateToken, async (req, res) => {
    const { TableName } = req.body;
    const { columnName, columnType } = req.body;
    const result = await pool.query(`alter table ${TableName} add column ${columnName} ${columnType}`);
    if (!result) {
        return res.status(400).send({
            Message: `Error while adding column-${columnName}`
        });
    } else {
        return res.status(200).send({
            Message: `successfully added column ${columnName}`
        });
    }
});

//! -----> JWT test Demo for login api
app.post('/login', async (req, res) => {
const { TableName, email, password } = req.body;
    try {
        // const result = await pool.query(`select * from ${TableName} 
        // where email = '${Email}'
        // `);
        const result = await pool.query(`select * from ${TableName} where email = '${email}' and password = '${password}'`);
        // const result =  pool.query('SELECT * FROM \$1 WHERE name = \$2', [TableName, name]);
        if (!result.rows.length)
            return res.json({
                Message: "not a valid user",
            });
        else {
            // logs.info(`name:${result.rows[0].name} email : ${result.rows[0].email}`);
            const user = {
                name: result.rows[0].name,
                email: result.rows[0].email,
            };
            try{
            const accessToken = jwt.sign(user,privateKey,{ algorithm:'RS256',expiresIn:'25m'});//* creates accesstoken by serilizing accrodingly to the jwt structure(header.body.signature)
            return res.json({
                AccessToken: accessToken,
            });
            }catch{
                logs.error(err.message);
                return res.json({
                    message:err.message
                })
            }
            // return res.json({
            //     message:"this is the else block",
            //     // name: result.rows[0].name
            // })
        }

    } catch (err) {
        res.status(418);
    }
});

//!middleware for jwt
function authenticateToken(req, res, next) {
    // const authHeader = req.headers['authorization'];
    const {authorization} = req.headers; //*Header comes with parameters mainly ' Bearer TOKEN '
    const token = authorization && authorization.split(' ')[1];
    //*check if token is present
    if (token == null)
        return res.status(401).send({
            Message: `please register to log in`,
        });
    //*verify the token sent 
    jwt.verify(token, publicKey, (err, user) => {
        if (err) {
            if (err.name === 'JsonWebTokenError')
                return res.status(401).send({
                    Message: "not a valid token"
                });
            else if (err.name === 'TokenExpiredError')
                return res.status(401).send({
                    Message: "Token has expired"
                });
            else
                return res.status(401).send({
                    Message: "not a valid token"
                });
        }
        req.user = user;
        next();//* to move out of the middleware
    });
}

app.listen(PORT, () => {
    console.log(`App is running in http://localhost:${PORT}`);
});