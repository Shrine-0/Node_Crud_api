const jwt = require('jsonwebtoken');
const {customerLogs} = require('../../logs/logger_node');
const privateKeyPath = './keys/privateKey.pem';
const publicKeyPath = './keys/publicKey.pem';
const fs = require('fs');
const { pool } = require('../../DB-connector/post_connector');
const privateKey = fs.readFileSync(privateKeyPath,'utf-8');
const publicKey = fs.readFileSync(publicKeyPath,'utf-8');

const createTable = async (req,res) =>{
    const {tableName,columnName1,columnType1,columnName2,columnType2,columnName3,columnType3} = req.body;
    const query = `create table ${tableName}(
        ${columnName1} ${columnType1},
        ${columnName2} ${columnType2},
        ${columnName3} ${columnType3},
        date timestamp default current_timestamp
    )`;
    try{
        let result = await pool.query(query); 
        if (result){
            customerLogs.info(`created table ${tableName} successfully`);
            return res.status(200).json({
                message:`created table ${tableName} successfully`,
            });
        }
        else{
            customerLogs.error(`couldnt create table - ${tableName}`);
            return res.status(418).json({
                message:`couldnt create table - ${tableName}`,
            });
        }
    }catch(err){
        customerLogs.error(err.message);
        return res.status(418).json({
            catchMessage:err.message,
        });
    }
}

module.exports = {createTable};