const logs = require('./logger_node');
const jwt = require('jsonwebtoken');
const path = require("path");
require('dotenv').config();

const express = require('express');
const app = express();
//? or the below method of initialiaing app 
// const app  = require('express')();

// const public = './public';
// app.use('/website',express.static(path.join(__dirname,public)));
// app.use(express.static(path.join(__dirname,'public')));
// app.use((req,res)=>{
//     res.status(404).send('<h1>ERROR 404 : Resource not found</h1>');
// });

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

const PORT = 8080;
const { readFile } = require('fs').promises;

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
//! -----> API for Table creation---->
app.post('/app/post', async (req, res) => {
    const { TableName } = req.body;
    if (!TableName) {
        res.status(418).send({
            Message: "Missing element - please recheck of you sent the TableName",
        });
    } else {
        try {
            let result = await pool.query(`create table ${TableName}(
        Id serial primary key,
        Name varchar(20) not null,
        Email varchar(20) not null
        )`);
            if (result) {
                res.status(201).send({
                    Message: `Table => ${TableName} created successfully`,
                });
                logs.customerLogs.log('info', `Table : ${TableName} creation successfull`);
            } else {
                res.status(204).send({
                    Message: "No Table name given",
                });
            }

        } catch (err) {
            res.status(500).send({
                // TableName : `${TableName}`,
                // Name : `${Name}`,
                // Email : `${Email}`,
                Message: "Error occured while making a query to create a table",
                Error: err.message,

            });
            logs.customerLogs.log('error', `Error while creating table : ${TableName}`);
        }
    }
});
//! ------> API for insertion to table 
app.post('/app/insert/', async (req, res) => {
    const { TableName } = req.body;
    // const {Id} = req.params;
    const { Name, Email, Password } = req.body;
    // if (!Name || !Email || !Password) {
    //     return res.status(412).send({
    //         Message: "Please check if name and email is sent",
    //     });
    // } else {
    try {
        let result = await pool.query(`insert into ${TableName}(name,email,password)
            values('${Name}','${Email}','${Password}')
            `);
        if (result) {
            logs.customerLogs.log(`info','Successfully inserted values to ${TableName} table`);
            return res.status(200).send({
                Message: `Successully added values to the ${TableName} table`,
            });
        } else {
            return res.status(204).send({
                Message: "no data for insertion sent"
            });
        }
    } catch (err) {
        logs.customerLogs.log(`error','Error while inserting values to the ${TableName} table`);
        return res.status(418).send({
            Message: `Error while inserting data to the table ${TableName}`,
            // Error : err.message,
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
app.post('/app/drop', async (req, res) => {
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
        where id < 8
        order by id desc;                    
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
app.post('/app/alterTable', async (req, res) => {
    const { TableName } = req.body;
    const { columnName } = req.body;
    const result = await pool.query(`alter table ${TableName} add column ${columnName} varchar(20)`);
    if (!result) {
        return res.status(400).json({
            Message: `Error while adding column-${columnName}`
        });
    } else {
        return res.status(200).json({
            Message: `successfully added column ${columnName}`
        });
    }
});

//! -----> JWT test Demo for login api
app.post('/login', async (req, res) => {
    const { TableName, name } = req.body;
    try {
        // const result = await pool.query(`select * from ${TableName} 
        // where email = '${Email}'
        // `);
        const result = await pool.query(`select * from ${TableName} where name = '${name}'`);
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
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '15m' })//* creates accesstoken by serilizing accrodingly to the jwt structure(header.body.signature)
            res.json({
                AccessToken: accessToken,
            });
        }

    } catch (err) {
        res.status(418);
    }
});

//!middleware for jwt
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];//*Header comes with parameters mainly ' Bearer TOKEN '
    const token = authHeader && authHeader.split(' ')[1];
    //*check if token is present
    if (token == null)
        return res.status(401).send({
            Message: `please register to log in`
        });
    //*verify the token sent 
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
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
                    Message:"not a valid token"
                });

        }
        req.user = user;
        next();//* to move out of the middleware
    });
}

app.listen(PORT, () => {
    console.log(`App is running in ----------> http://localhost:${PORT}`);
});