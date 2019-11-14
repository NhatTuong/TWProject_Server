/*
    ----------------------------------------------------------------
    SERVERLESS PRUNE PLUGIN -> DECREASE CODE STORAGE on LAMBDA AWS
    Link: https://github.com/claygregory/serverless-prune-plugin
    Run command at Terminal VSCode: serverless config credentials -o --provider aws --key <keyID> --secret <secretKeyID>
    Restful APIs: https://a8aeksd7j1.execute-api.us-east-2.amazonaws.com/dev/{+urlHere} (Write API into <urlHere>)
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

let moment = require('moment');
let service = require('./service/service');

/*
    ----------------------------------
    RESTFUL APIS
    ----------------------------------
*/

// Login
// Parameter: JSON List (String username, String password)
// Result: Success | Fail
app.options('/login', cors())
app.post('/login', cors(corsOptions), async (req, res) => {
    let username = req.body.username
    let password = req.body.password

    loginResult = await service.checkLogin(username, password)
    if (loginResult) {
        res.send(service.encapResponse(process.env.SC_OK, "Login successfully", '{"token": "' + loginResult + '"}'))
    }   
    else {
        res.send(service.encapResponse(process.env.SC_ERR_LOGIN_FAIL, "Login fail by wrong information", null))
    }
})

// Registering new account
// Parameter: JSON List (String username, String password)
// Result: Success | Fail
app.options('/register', cors())
app.post('/register', cors(corsOptions), async (req, res) => {
    let username = req.body.username
    let password = req.body.password
    
    if (await service.existedUsername(username)) {
        res.send(service.encapResponse(process.env.SC_ERR_REG_EXISTED_USERNAME, "Registering new account fail by existed username", null))
        return
    }

    await service.addNewAccount(username, password)
    res.send(service.encapResponse(process.env.SC_OK, "Registering new account successfully", null))
})

// Filling in detail information after registering
// Parameter: JSON List (String username, String name, String country, String city, Int age, String job, String gender, String salaryRange)
// Result: Success | Fail
app.options('/register/detail', cors())
app.post('/register/detail', cors(corsOptions), async (req, res) => {
    let username = req.body.username
    let name = req.body.name
    let country = req.body.country
    let city = req.body.city
    let age = req.body.age
    let job = req.body.job
    let gender = req.body.gender
    let salaryRange = req.body.salaryRange

    if (!(await service.existedUsername(username))) {
        res.send(service.encapResponse(process.env.SC_ERR_REG_INEXISTED_USERNAME, "Username is inexisted, so register detail information fail", null))
        return
    }

    await service.fillInDetailInfo(username, name, country, city, age, job, gender, salaryRange)
    res.send(service.encapResponse(process.env.SC_OK, "Filling in detail information after registering successfully", null))
})

// Logging information of user (Don't verify JWT)
// Parameter: JSON List (String username, String datetime, String log)
// Result: Success
app.options('/logging', cors())
app.post('/logging', cors(corsOptions), async (req, res) => {
    let username = req.body.username
    let datetime = req.body.datetime
    let log = req.body.log
    
    await service.writeLog(username, datetime, log)
    res.send(service.encapResponse(process.env.SC_OK, "Writing log successfully", null))
})

// Storing data of category concern of user
// Parameter: ?
// Result: Success | Fail
app.options('/concern/category', cors())
app.post('/concern/category', cors(corsOptions), async (req, res) => {
    










})

// Staring store
// Parameter: String token, String storeID, Int stars
// Result: Success | Fail
app.options('/store/review/stars', cors())
app.post('/store/review/stars', cors(corsOptions), async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let storeID = req.body.storeID
    let stars = req.body.stars
    let current_time = new moment().format("DD/MM/YYYY HH:mm:ss");

    if (await service.existedReview(username, storeID)) {
        // Update existed review
        await service.updateReviewStars(username, storeID, stars, current_time)
    }
    else {
        // Insert new review
        await service.addNewReview(username, storeID, stars, current_time, "", 0, 0, 0)
    }

    res.send(service.encapResponse(process.env.SC_OK, "Staring current store successfully", null))
})

// Reviewing store by comment
// Parameter: String token, String storeID, String comment
// Result: Success | Fail
app.options('/store/review/comment', cors())
app.post('/store/review/comment', cors(corsOptions), async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let storeID = req.body.storeID
    let comment = req.body.comment
    let current_time = new moment().format("DD/MM/YYYY HH:mm:ss");

    if (await service.existedReview(username, storeID)) {
        // Update existed review
        await service.updateReviewComment(username, storeID, comment, current_time)
    }
    else {
        // Insert new review
        await service.addNewReview(username, storeID, 0, current_time, comment, 0, 0, 0)
    }

    res.send(service.encapResponse(process.env.SC_OK, "Reviewing current store by comment successfully", null))
})

// Reacting to review of a specified user
// Parameter: String token, String username, String storeID, Int reactType
// Result: Success | Fail
app.options('/store/review/reaction', cors())
app.post('/store/review/reaction', cors(corsOptions), async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = req.body.username
    let storeID = req.body.storeID
    let reactType = req.body.reactType

    if (!await service.existedReview(username, storeID)) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_STOREID, "You can not react to a inexisted review and store", null))
        return
    }

    let result = await service.updateReviewReaction(username, storeID, reactType)
    if (!result) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_REACTION_TYPE, "Invalid reaction type", null))
        return
    }
    
    res.send(service.encapResponse(process.env.SC_OK, "Reacting to review of a specified user successfully", null))
})

// Getting all profile information 
// Parameter: String token
// Result: Success | Fail
app.options('/profile', cors())
app.get('/profile', cors(corsOptions), async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let data = await service.getProfileInfo(username)
    res.send(service.encapResponse(process.env.SC_OK, "Get all profile information successfully", JSON.stringify(data)))
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
    let author = req.headers.authorization
    if (author != "QTAB2-DW19S-SAU-QLENGMCRY-YO0OM-TROMAT-LEO") {
        res.send(service.encapResponse(process.env.SC_ERR_QUERYDB_WRONG_AUTHOR, "Authorization of querying mysql db is wrong", null))
        return
    }

    let sqlArr = req.body.sqlArr
    if (sqlArr.size == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_QUERYDB_SQLARRAY_SIZE, "Size of SQL Query Array mustn't be 0", null))
        return
    }

    sqlArr.forEach(element => {
        if (element.length < 10) {
            res.send(service.encapResponse(process.env.SC_ERR_QUERYDB_WRONG_SQL, "Querying SQL length must have at least 10 letters for MySQL", null))
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

// Checking client access to inexisted url
// Result: Always Fail
app.get('/*', (req, res) => {
    res.send(service.encapResponse(process.env.SC_ERR_WRONG_URL, "This URL doesn't exist, so nothing to show here", null))
})

module.exports.handler = serverless(app)