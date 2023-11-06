const logs = require('./logger_node');
const express = require('express');
const app = express();
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
    const { Name } = req.body;
    const { Email } = req.body;
    if (!Name || !Email) {
        res.status(412).send({
            Message: "Please check if name and email is sent",
        });
    } else {
        try {
            let result = await pool.query(`insert into ${TableName}(name,email)
            values('${Name}','${Email}')
            `);
            if (result) {
                res.status(200).send({
                    Message: `Successully added values to the ${TableName} table`,
                });
                logs.customerLogs.log(`info','Successfully inserted values to ${TableName} table`);
            }
        } catch (err) {
            res.status(418).send({
                Message: `Error while inserting data to the table ${TableName}`,
                // Error : err.message,
            });
            logs.customerLogs.log(`error','Error while inserting values to the ${TableName} table`);
        }
    }
});

//!-------> API for select based on ID propvided
app.get('/app/select/:id', async (req, res) => {
    const { Id } = req.params;
    const { TableName } = req.body;
    try {
        const result = await pool.query(`select * from ${TableName}
        where id = ${Id}
        order by id desc;
        `);
        if (result) {
            res.status(201).send({
                Message: "data pulled from the table successfully",
            });
            logs.customerLogs.log('info',`Succesfully pulled  data of Id - ${Id} from the s${TableName} table`);
        }
    } catch (err) {
        res.status(418).send({
            Message: "Error while pulling from table customers",
            Error: err.message,
        });
        logs.customerLogs.log('error', `Error while pulling data of Id - ${Id} from ${TableName} table`);
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
    const {TableName} = req.body;
    try {
        const result = await pool.query(`select * from ${TableName} 
        where id < 8
        order by id desc;                    
        `);
        res.json(result.rows);
        if (result){
            logs.customerLogs.log('info',`Successfully pulled data from the table ${TableName}`);
        }
    } catch (err) {
        res.status(418).send({
            Message: "Error while viewing data",
            Error: err.message
        });
        logs.customerLogs.log('error', `Error while pulling data from the ${TableName} table`);
    }
});

app.listen(PORT, () => {
    console.log(`App is running in ----------> http://localhost:${PORT} `);
});