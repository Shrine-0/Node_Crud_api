require('dotenv').config();
const jwt = require('jsonwebtoken');
const logs = require('./logs/logger'); //**logger import
const PORT = process.env.PORT;
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');//* to make http requests and handle them accordingly
const FormData = require('form-data');
const app = express();
app.use(express.json());//middleware for json conversion
const fs = require('fs');

const privateKeyPath = './keys/privateKey.key';
const publicKeyPath = './keys/publicKey.key';
const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');//* use readFile for increases performance?
const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');

app.get('/me', async (req, res) => {
    const {authorization} = req.headers;
    try {
        const decoded = jwt.verify(authorization.split(' ')[1],privateKey); 
        return res.json({
            message:decoded
        });
    } catch (err) {
        if(err.name === "TokenExpiredError")
            return res.status(418).json({message : "expired token"});
        else if (err.name=== "JsonWebTokenError")
            return res.status(418).json({message : "Tampered token or invalid token"});
        else 
            return res.status(418).json({message: err.message});
    }
});

app.post('/authenticate', async (req, res) => {
    debugger;
    const { Username, Password, DeviceId } = req.body;
    const validateUrl = process.env.VALIDATE_URL;
    const authenticateUrl = process.env.AUTHENTICATE_URL;

    // // ! call deviceId and username validation api
    // // ! call exchange authentication api
    // // ! call smscast api for extra claims

    const smscast = claims(Username);

    try {
        let formDataValidate = new FormData();
        formDataValidate.append('username', Username);
        formDataValidate.append('deviceId', DeviceId);
        const responseValidate = await axios({
            method: "post",
            url: validateUrl,
            data: formDataValidate,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        // console.log(responseValidate);
        if (responseValidate.data == "found") {
            // return res.json({
            //     message:"device found"
            // });

            //*Authenticate-Try-Block below
            try {
                const claimsData = await smscast;
                const [{ region_id, branch_id, designation, ebill_branch_id, ownership, photo_link }] = claimsData.response;
                // console.log(region_id, branch_id, designation, ebill_branch_id, ownership, photo_link);
                let formDataAuthenticate = new FormData();
                formDataAuthenticate.append('username', Username);
                formDataAuthenticate.append('password', Password);
                const responseAuthenticate = await axios({
                    method: 'post',
                    url: authenticateUrl,
                    headers: {
                        'Authorization': 'Basic ZGEzOWEzZWU1ZTZiNGIwZDMyNTViZmVmOTU2MDE4OTBhZmQ4MDcwOTp4',
                        ...formDataAuthenticate.getHeaders()
                    },
                    data: formDataAuthenticate
                });
                //   console.log(Username ,Password);
                //   console.log(response.data);
                if (responseAuthenticate.data.status_code == 200) {
                    const user = {
                        sub: Username,
                        region_id: region_id,
                        DeviceId: DeviceId,
                        Designation: designation,
                        Ebill_branch_id: ebill_branch_id,
                        Ownership: ownership,
                        Branch_id: branch_id,
                        Photo_link: photo_link
                    };
                    logs.userLogs.log('info', `Authenticated user : ${Username} and ${DeviceId} successfully added`);
                    const accessToken = generateAccessToken(user);
                    // const refreshToken = generateRefreshToken(user);
                    return res.status(200).send({
                        message: accessToken,
                        // RefreshToken:refreshToken
                    });
                } else {
                    logs.userLogs.log('error', `Couldnt authenticate the User :${Username} with ${DeviceId}`);
                    res.status(400).send({
                        message: `Couldnt authenticate the User :${Username} with ${DeviceId}`
                    });
                }
            } catch (err) {
                // console.log("Block-Authenticate-Error : " + err.message);
                return res.status(418).send({
                    Block: "Authenticate",
                    message: err.message
                });
            }
        }
        return res.sendStatus(200);
    } catch (err) {
        // console.log("Error on Validate " + err.message);
        return res.status(418).send({
            Message: err.message
        });
    }
});


app.listen(PORT, () => {
    console.log("app is runnig at http://localhost:8080");
});

function generateAccessToken(user) {
    let token = jwt.sign(user, privateKey, { algorithm: 'RS256', expiresIn: '1440m' });
    return token;
}

// function generateRefreshToken(user){
//     let token  = jwt.sign(user,process.env.REFRESH_TOKEN);
//     return token;
// }

async function claims(username) {
    const url = process.env.SMSCAST_URL + `${username}` + process.env.SMSCAST_PARAMS;
    try {
        const response = await axios({
            method: "get",
            url: url
        });
        // console.log(response.data);
        const data = response.data;
        return data;
    } catch (err) {
        // console.log("error : " + err.message);
        return err.message;
    }
}