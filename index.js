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
// app.options('/login', cors())
// cors(corsOptions),
app.post('/login',  async (req, res) => {
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
// app.options('/register', cors())
// cors(corsOptions),
app.post('/register', async (req, res) => {
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
// app.options('/register/detail', cors())
// cors(corsOptions),
app.post('/register/detail', async (req, res) => {
    let username = req.body.username
    let name = req.body.name
    let country = req.body.country
    let city = req.body.city
    let age = req.body.age
    let job = req.body.job
    let gender = req.body.gender
    let salaryRange = req.body.salaryRange

    if (!(await service.existedUsername(username))) {
        res.send(service.encapResponse(process.env.SC_ERR_INEXISTED_USERNAME, "Username is inexisted, so register detail information fail", null))
        return
    }

    await service.fillInDetailInfo(username, name, country, city, age, job, gender, salaryRange)
    res.send(service.encapResponse(process.env.SC_OK, "Filling in detail information after registering successfully", null))
})

// Logging information of user (Don't verify JWT)
// Parameter: JSON List (String username, String datetime, String log)
// app.options('/logging', cors())
// cors(corsOptions),
app.post('/logging', async (req, res) => {
    let username = req.body.username
    let datetime = req.body.datetime
    let log = req.body.log
    
    await service.writeLog(username, datetime, log)
    res.send(service.encapResponse(process.env.SC_OK, "Writing log successfully", null))
})

// Getting all profile information 
// Parameter: String token
// app.options('/profile', cors())
// cors(corsOptions),
app.get('/profile', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let data = await service.getProfileInfo(username)
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_INEXISTED_USERNAME, "Username is inexisted, so get profile info fail", null))
        return
    }

    res.send(service.encapResponse(process.env.SC_OK, "Get all profile information successfully", JSON.stringify(data)))
})

// Get raw concern list
// Parameter: String token
// app.options('/concern/rawlist', cors())
// cors(corsOptions),
app.get('/concern/rawlist', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    data = await service.getRawConcernList()
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_RAW_CONCERN_LIST, "Raw concern list is empty", null))
        return
    }

    res.send(service.encapResponse(process.env.SC_OK, "Getting raw concern list successfully", JSON.stringify(data)))
})

// Get my concern list
// Parameter: String token
// app.options('/concern/mylist', cors())
// cors(corsOptions),
app.get('/concern/mylist', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username

    data = await service.getMyConcernList(username)
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_MY_CONCERN_LIST, "My concern list is empty", null))
        return
    }

    res.send(service.encapResponse(process.env.SC_OK, "Getting my concern list successfully", JSON.stringify(data)))
})

// Update my concern list
// Parameter: String token, Array (String) concernID
// app.options('/concern/mylist', cors())
// cors(corsOptions),
app.post('/concern/mylist', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let concernIDList = req.body.concernIDList

    await service.updateMyConcernList(username, concernIDList)
    res.send(service.encapResponse(process.env.SC_OK, "Updating my concern list successfully", null))
})

// Review store
// Parameter: String token, String storeID, String comment, Int stars
// app.options('/store/review/rating', cors())
// cors(corsOptions),
app.post('/store/review/rating', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let storeID = req.body.storeID
    let comment = req.body.comment
    let stars = req.body.stars
    let current_time = new moment().format("YYYY/MM/DD HH:mm:ss");

    if (await service.existedReview(username, storeID)) {
        res.send(service.encapResponse(process.env.SC_ERR_EXISTED_REVIEW, "You've reviewed this store before, so you couldn't review again", null))
        return
    }
    
    await service.addNewReview(username, storeID, stars, current_time, comment, 0, 0, 0)
    res.send(service.encapResponse(process.env.SC_OK, "Reviewing this store successfully", null))
})

// Reacting to review of a specified user
// Parameter: String token, String username, String storeID, Int reactType
// app.options('/store/review/reaction', cors())
// cors(corsOptions),
app.post('/store/review/reaction', async (req, res) => {
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
        res.send(service.encapResponse(process.env.SC_ERR_INEXISTED_REVIEW, "You can not react to an inexisted review for this store", null))
        return
    }

    let result = await service.updateReviewReaction(username, storeID, reactType)
    if (!result) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_REACTION_TYPE, "Invalid reaction type", null))
        return
    }
    
    res.send(service.encapResponse(process.env.SC_OK, "Reacting to review of a specified user successfully", null))
})

// Add new store to my favorite store list
// Parameter: String token, String storeID
// app.options('/store/favorite', cors())
// cors(corsOptions),
app.post('/store/favorite', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let storeID = req.body.storeID

    if (await service.existedMyFavStore(username, storeID)) {
        res.send(service.encapResponse(process.env.SC_ERR_EXISTED_FAV_STORE, "This favorite store existed in your favorite store list, so cann't add to list anymore", null))
        return
    }

    await service.addMyNewFavStore(username, storeID)
    res.send(service.encapResponse(process.env.SC_OK, "Adding this store to my favorite store list successfully", null))
})

// Removing store from my favorite store list
// Parameter: String token, String storeID
// app.options('/store/favorite', cors())
// cors(corsOptions),
app.delete('/store/favorite', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let storeID = req.body.storeID

    await service.removeMyFavStore(username, storeID)
    res.send(service.encapResponse(process.env.SC_OK, "Removing this store from favorite store list successfully", null))
})

// Get my favorite store list
// Parameter: String token
// app.options('/store/favorite', cors())
// cors(corsOptions),
app.get('/store/favorite', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username

    let data = await service.getMyFavStoreList(username)
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_MY_FAV_STORE_LIST, "My favorite store list is empty", null))
        return
    }
    res.send(service.encapResponse(process.env.SC_OK, "Getting all information from favorite store list successfully", JSON.stringify(data)))
})

// Get all food item of a store
// Parameter: String token, String storeID
// app.options('/store/food', cors())
// cors(corsOptions),
app.get('/store/food', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let storeID = req.query.storeID
    if (storeID == null || storeID.length == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <storeID> mustn't be null", null))
        return
    }

    let data = await service.getFoodListOfStore(storeID)
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_FOOD_LIST, "Food list of this store is empty", null))
        return
    }
    res.send(service.encapResponse(process.env.SC_OK, "Getting food information of this store successfully", JSON.stringify(data)))

})

// Get all review of a store
// Parameter: String token, String storeID
// app.options('/store/review', cors())
// cors(corsOptions),
app.get('/store/review', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let storeID = req.query.storeID
    if (storeID == null || storeID.length == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <storeID> mustn't be null", null))
        return
    }

    let data = await service.getReviewListOfStore(storeID)
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_REVIEW_LIST, "Review list of this store is empty", null))
        return
    }
    res.send(service.encapResponse(process.env.SC_OK, "Getting review information of this store successfully", JSON.stringify(data)))
})

// Get store info based on storeID
// Parameter: String token, String storeID
// app.options('/store', cors())
// cors(corsOptions),
app.get('/store', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let storeID = req.query.storeID
    if (storeID == null || storeID.length == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <storeID> mustn't be null", null))
        return
    }

    let data = await service.getStoreInfo(storeID)
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_STORE_INFO, "This store information is empty", null))
        return
    }
    res.send(service.encapResponse(process.env.SC_OK, "Getting this store information successfully", JSON.stringify(data)))
})

// Checking this storeID is in my favorite list or not
// Parameter: String token, String storeID
// Result: "1" (True) | "0" (False)
// app.options('/store/favorite/check', cors())
// cors(corsOptions),
app.get('/store/favorite/check', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    let storeID = req.query.storeID
    if (storeID == null || storeID.length == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <storeID> mustn't be null", null))
        return
    }

    let data = await service.isFavStoreID(username, storeID)
    res.send(service.encapResponse(process.env.SC_OK, "Checking this store is my favorite or not successfully", JSON.stringify(data)))
})

// Searching following by keyword and return any results
// Parameter: String token
// Query: String type, String keyword, String lat, String lng, String page
// app.options('/search', cors())
// cors(corsOptions),
app.get('/search', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username

    let type = req.query.type
    if (type == null || type.length == 0 || (type != "store" && type != "food")) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <type> mustn't be null or equal 'store' or 'food'", null))
        return
    }

    let keyword = req.query.keyword
    if (keyword == null || keyword.length == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <keyword> mustn't be null", null))
        return
    }

    let lat = req.query.lat
    let lng = req.query.lng
    if (lat == null || lng == null || lat.length == 0 || lng.length == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <lat, lng> mustn't be null", null))
        return
    }

    let page = req.query.page
    if (page == null || page.length == 0 || page < 1) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <page> mustn't be null or smaller than 1", null))
        return
    }
    
    let data = await service.searching(type, username, lat, lng, keyword, page)
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_SEARCH_RESULT, "Nothing found", null))
        return
    }
    res.send(service.encapResponse(process.env.SC_OK, "Searching completely", JSON.stringify(data)))
})

// Get all banner information
// Parameter: String token
// app.options('/banner', cors())
// cors(corsOptions),
app.get('/banner', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }
    
    let data = await service.getAllBannerInfo()
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_BANNER, "Banner information is empty", null))
        return
    }
    res.send(service.encapResponse(process.env.SC_OK, "Getting all banner information successfully", JSON.stringify(data)))
})

// Get suggestive list
// Parameter: String token
// Query: String type, String page, String lat, String lng
// app.options('/suggest', cors())
// cors(corsOptions),
app.get('/suggest', async (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }

    let username = verifyToken.username
    
    let type = req.query.type
    if (type == null || type.length == 0 || (type != "store" && type != "food")) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <type> mustn't be null or equal 'store' or 'food'", null))
        return
    }

    let page = req.query.page
    if (page == null || page.length == 0 || page < 1) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <page> mustn't be null or smaller than 1", null))
        return
    }

    let lat = req.query.lat
    let lng = req.query.lng
    if (lat == null || lng == null || lat.length == 0 || lng.length == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <lat, lng> mustn't be null", null))
        return
    }

    let data = await service.getSuggestList(type, username, page, lat, lng)
    if (data == null) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_SUGGEST_LIST, "Appropriate suggestion list not found", null))
        return
    }
    res.send(service.encapResponse(process.env.SC_OK, "Getting suggestive list successfully", JSON.stringify(data)))
})

// Get two points and compute distance (km) between them
// Parameter: String token
// app.options('/distance', cors())
// cors(corsOptions),
app.get('/distance', (req, res) => {
    let token = req.headers.authorization

    let verifyToken = service.verifyJWT(token)
    if (!verifyToken) {
        res.send(service.encapResponse(process.env.SC_ERR_INVALID_JWT, "Invalid JWT", null))
        return
    }
    
    let latA = req.query.latA
    let lngA = req.query.lngA
    let latB = req.query.latB
    let lngB = req.query.lngB

    if (latA == null || lngA == null || latB == null || lngB == null ||
        latA.length == 0 || lngA.length == 0 || latB.length == 0 || lngB.length == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <latA, lngA, latB, lngB> mustn't be null", null))
        return
    }

    if (latA == 0 || lngA == 0 || latB == 0 || lngB == 0) {
        res.send(service.encapResponse(process.env.SC_ERR_EMPTY_QUERY_URL, "Query on URL with <latA, lngA, latB, lngB> mustn't have value 0", null))
        return
    }

    let distance = service.getDistanceTwoLatLng(latA, lngA, latB, lngB)
    res.send(service.encapResponse(process.env.SC_OK, "Computing distance (km) between two points successfully", '{"distance": ' + distance + '}'))
})

// -------------------------------------------------------------------------------------------------------------------------------
// Special query for manipulating MYSQL database
// Parameter: String authorization (Header) | Array String sqlArr (Body)
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
// ------------------------------------------------------------------------------------------------------------------------------------------------

// Checking client access to inexisted url
app.get('/*', (req, res) => {
    res.send(service.encapResponse(process.env.SC_ERR_WRONG_URL, "This URL doesn't exist, so nothing to show here", null))
})

module.exports.handler = serverless(app)