require('dotenv').config();
const express  = require('express');
const app = express();
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = new Sequelize('postgresql://nischal:1234@127.0.0.1:5431/node_db');
const PORT = process.env.PORT_ORM;

class User extends Model { }
User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    }
},
    {
        sequelize,//to add the connection to the database,
        modelName: 'User',
        tableName: 'users' //**  optional section id , if this is not proivided the modelName is automaticaly taken as the tableName
    });

//!! syncing the model with the database
(async () => {
    await sequelize.sync({ force: true }).then(() => {
        console.log('Model synchronized with database');
    });
    const user1 = User.build({
        Name:"Nischal",
        Address : "Kapan",
        Email : "nischalthapa10@hotmail.com" 
    });
    user1.save();
});

console.log(User === sequelize.models.User);

app.get('/orm/select',async (req,res)=>{
    const {TableName} = req.body;
    const sql  = `insert into ${TableName} (Name,Address,Email) values (\$1,\$2,\$3)`;
    const values =[Name,Address,Email];
    try{
        const result = await Pool.query(sql,values);
    }catch(err){

    }
});
app.listen(PORT,()=>{
console.log(`port open at ${PORT}`);
});