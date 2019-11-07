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




















// Special query for manipulating MONGODB database
// Parameter: String authorization (Header) | String sql (Body)
// Result: Success | Fail
// app.post('/twmomo/mongodb/query', async (req, res) => {
//     author = req.headers.authorization
//     if (author != "GATBB2-DW1AU9S-QNGMCRY-DOO0OONE-TROM-MAT-LEO") {
//         res.send(service.encapResponse(process.env.SC_ERR_QUERYDB_WRONG_AUTHOR, "Authorization of querying mongodb db is wrong", null))
//         return
//     }

//     // More
// })

// Special query for manipulating MYSQL database
// Parameter: String authorization (Header) | Array String sqlArr (Body)
// Result: Success | Fail
app.post('/twmomo/mysql/query', async (req, res) => {
    author = req.headers.authorization
    if (author != "QTAB2-DW19S-SAU-QLENGMCRY-YO0OM-TROMAT-LEO") {
        res.send(service.encapResponse(process.env.SC_ERR_QUERYDB_WRONG_AUTHOR, "Authorization of querying mysql db is wrong", null))
        return
    }

    sqlArr = req.body.sqlArr
    if (sqlArr.size == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_QUERYDB_SQLARRAY_SIZE, "Size of SQL Query Array mustn't be 0", null))
        return
    }

    sqlArr.forEach(element => {
        if (element.length < 10) {
            res.send(service.encapResponse(process.env.SC_ERR_QUERYDB_WRONG_SQL, "Query SQL length must have at least 10 letters for MySQL", null))
            return
        }
    });

    for (let i=0; i<sqlArr.size; ++i) {
        let element = sqlArr[i]
        if (element[element.length - 1] == ';') {
            sqlArr[i] = sqlArr[i].substring(0, str.length - 1);
        }
    }

    await Promise.all(sqlArr.map(element => {
        return service.queryMySQL(element)
    })).then((result) => {
        jsonString = JSON.stringify({ ...result })
        res.send(service.encapResponse(process.env.SC_OK, "SQL Query Array finishs executing", '{"result": ' + jsonString + '}'))
    })
})

// Check client access to inexisted url
// Result: Always Fail
app.get('/test', (req, res) => {
    res.send(service.encapResponse(process.env.SC_ERR_WRONG_URL, "This URL doesn't exist, so nothing to show here", null))
})

module.exports.handler = serverless(app)