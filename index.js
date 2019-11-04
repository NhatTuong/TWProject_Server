/*
    ----------------------------------------------------------------
    SERVERLESS PRUNE PLUGIN -> DECREASE CODE STORAGE on LAMBDA AWS
    Link: https://github.com/claygregory/serverless-prune-plugin
    ----------------------------------------------------------------
*/

/*
    ----------------------------------
    DECLARE GLOBAL VARIABLES
    ----------------------------------
*/
require('dotenv').config();

const serverless = require('serverless-http')

const express = require('express')
const app = express()

const helmet = require('helmet')
app.use(helmet())

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const cors = require('cors')
var whitelist = ['http://localhost:8081', 'http://localhost:19002']
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } 
        else {
            callback("statusCode: " + process.env.SC_ERR_WRONG_CORS + " | errorMsg: Unsuitable CORS, you are not allowed to access our server")
        }
    }
}

let service = require('./service/service');

/*
    ----------------------------------
    RESTFUL APIS
    ----------------------------------
*/

// Login
// Parameter: JSON List (username, password)
// Result: Success | Fail
app.options('/login', cors())
app.post('/login', cors(corsOptions), async (req, res) => {
    username = req.body.username
    password = req.body.password

    loginResult = await service.checkLogin(username, password)
    if (loginResult) {
        res.send(service.encapResponse(process.env.SC_OK, "Login successfully", '{"token": "' + loginResult + '"}'))
    }   
    else {
        res.send(service.encapResponse(process.env.SC_ERR_LOGIN_FAIL, "Login fail by wrong information", null))
    }
})

// Register new account
// Parameter: JSON List (username, password)
// Result: Success | Fail
app.options('/register', cors())
app.post('/register', cors(corsOptions), async (req, res) => {
    username = req.body.username
    password = req.body.password
    
    if (await service.existedUsername(username)) {
        res.send(service.encapResponse(process.env.SC_ERR_REG_EXISTED_USERNAME, "Register new account fail by existed username", null))
        return
    }

    await service.addNewAccount(username, password)
    res.send(service.encapResponse(process.env.SC_OK, "Register new account successfully", null))
})



























// Check client access to inexisted url
// Result: Always Fail
app.get('/test', (req, res) => {
    res.send(service.encapResponse(process.env.SC_ERR_WRONG_URL, "This URL doesn't exist, so nothing to show here", null))
})

module.exports.handler = serverless(app)