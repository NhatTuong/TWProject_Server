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

// Register new account
// Req: JSON List (username, password, email, phoneNumber)
// Res: Success or Fail
app.options('/register', cors())
app.get('/register', cors(corsOptions), (req, res) => {
    res.status(process.env.SC_OK).send(JSON.parse('{"okMsg": "Hello World"}'))
})

app.get('/*', async (req, res) => {
    // await service.inserttest()
    val = await service.selecttestMySQL(res)
    res.send(val)
})

module.exports.handler = serverless(app)