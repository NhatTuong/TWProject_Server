require('dotenv').config();
let repoMongo = require('../repository/repoMongo');
let repoMySQL = require('../repository/repoMySQL');
const tokenKey = "TKEteJHPgZldsuYkvYm0SREY-TWMOMO-2019"
let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs')
let service = {}

/* --------------------------------------------------------------
            ENCAPSULATE INFORMATION OF RESPONSE MESSAGE 
   -------------------------------------------------------------- */
// Encapsulate information of response
// Parameter: Int statusCode, String resMsg, String (JSON) data
// Result: JSON List response
service.encapResponse = (statusCode, resMsg, data) => {
    if (data == null) data = '{}'
    return JSON.parse('{"statusCode": ' + statusCode + ', "resMsg": "' + resMsg + '", "data": ' + data + '}')
}

/* --------------------------------------------------------------
                                JWT 
   -------------------------------------------------------------- */
// Generate JWT (Auto expires after 7 days)
// Parameter: JSON data
// Result: String Token
service.generateJWT = (data) => {
    return jwt.sign(data, tokenKey, {expiresIn: "7d"})
}

// Verify JWT
// Parameter: String token
// Result: JSON username | False
service.verifyJWT = (token) => {
    if (token.length == 0) return false
    return jwt.verify(token, tokenKey, function(err, decoded) {
        if (err) {
            console.log(err)
            return false
        } 
        return JSON.parse('{"username" : "' + decoded.username + '"}')
    });
}

/* --------------------------------------------------------------
                        NORMAL FUNCTIONS 
   -------------------------------------------------------------- */
// Compare hashPassword and rawPassword
// Parameter: String rawPass, String hashPass
// Result: True | False
service.comparePassword = (rawPass, hashPass) => {
    return bcrypt.compareSync(rawPass, hashPass);
}

// Bcrypt (hash) password
// Parameter: STRING raw password
// Result: String hashed password
service.hashPassword = (rawPass) => {
    let salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(rawPass, salt);
}

// Get distance between two latlong
// Parameter: String LatA, String LngA, String LatB, String LngB
// Result: distance in km
// Reference: https://www.geodatasource.com/developers/javascript
service.getDistanceTwoLatLng = (LatA, LngA, LatB, LngB) => {
    if ((LatA == LatB) && (LngA == LngB)) {
		return 0;
	}
    
    LatA = parseFloat(LatA)
    LatB = parseFloat(LatB)
    LngA = parseFloat(LngA)
    LngB = parseFloat(LngB)

    var radlatA = Math.PI * LatA/180;
    var radlatB = Math.PI * LatB/180;
    var theta = LngA - LngB;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlatA) * Math.sin(radlatB) + Math.cos(radlatA) * Math.cos(radlatB) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344; // Result will be in km

    return dist;
}

/* --------------------------------------------------------------
                        MONGODB FUNCTIONS
   -------------------------------------------------------------- */
// Logging information of user
// Parameter: String username, String datetime, String log
// Result: True
service.writeLog = async (username, datetime, log) => {
    return await repoMongo.writeLog(username, datetime, log)
}

/* --------------------------------------------------------------
                        MYSQL FUNCTIONS 
-------------------------------------------------------------- */
// Checking info when user login
// Parameter: String username, String password
// Result: String token | False
service.checkLogin = async (username, password) => {

    let userInfo = await repoMySQL.getProfileInfo(username)
    if (userInfo == null) return false

    let resultComparison = service.comparePassword(password, userInfo.password)
    if (!resultComparison) return false

    let jsonUsername = JSON.parse('{"username" : "' + username + '"}')
    let token = service.generateJWT(jsonUsername)
    return token
}

// Checking existence of username
// Parameter: String username
// Result: True (Existent) | False (Inexistent)
service.existedUsername = async (username) => {
    let userInfo = await repoMySQL.getProfileInfo(username)
    if (userInfo == null) return false
    return true
}

// Adding new account to database
// Parameter: String username, String password
service.addNewAccount = async (username, password) => { 
    let hashpass = service.hashPassword(password)
    await repoMySQL.addNewAccount(username, hashpass)
}

// Filling in detail information after registering
// Parameter: String username, String name, String country, String city, Int age, String job, String gender, String salaryRange
service.fillInDetailInfo = async (username, name, country, city, age, job, gender, salaryRange) => {
    await repoMySQL.fillInDetailInfo(username, name, country, city, age, job, gender, salaryRange)
}

// Getting all profile information 
// Parameter: String username
// Result: All information of user, except password
service.getProfileInfo = async (username) => {
    let result = await repoMySQL.getProfileInfo(username)
    if (result != null) delete result.password
    return result
}

// Checking existence of a review of that user and storeID
// Parameter: String username, String storeID
// Result: True (Existent) | False (Inexistent)
service.existedReview = async (username, storeID) => {
    let result = await repoMySQL.getReviewByUsernameAndStoreID(username, storeID)
    if (result == null) return false
    return true
}

// Insert new review
// Parameter: String username, String storeID, Int stars, String datetime, String comment, Int useful, Int funny, Int cool
service.addNewReview = async (username, storeID, stars, datetime, comment, useful, funny, cool) => {
    await repoMySQL.addNewReview(username, storeID, stars, datetime, comment, useful, funny, cool)
}

// Update reaction (useful or funny or cool) of review
// Parameter: String username, String storeID, Int reactType
// Result: Success (True) | Fail (False)
service.updateReviewReaction = async (username, storeID, reactType) => {
    if (reactType < 0 || reactType > 2) {
        return false
    }

    await repoMySQL.updateReviewReaction(username, storeID, reactType)
    return true
}

// Get raw concern list
// Result: JSON Array (Each JSON Object will have two keys: concern_id, label) | Null (DB doesn't have concern list)
service.getRawConcernList = async () => {
    return await repoMySQL.getRawConcernList()
}

// Get my concern list
// Parameter: String username
// Result: JSON Array (Each JSON Object will have two keys: concern_id, label) | Null (I don't have concern list now)
service.getMyConcernList = async (username) => {
    return await repoMySQL.getMyConcernList(username)
}

// Update my concern list
// Parameter: String username, Array (String) concernID
service.updateMyConcernList = async (username, concernIDList) => {
    await repoMySQL.deleteMyConcernList(username)

    for (let i = 0; i < concernIDList.length; ++i) {
        await repoMySQL.addMyNewConcern(username, concernIDList[i])
    }
}

// Exist my favorite store or not
// Parameter: String username, String storeID
// Result: True (Existent) | False (Inexistent)
service.existedMyFavStore = async (username, storeID) => {
    return await repoMySQL.existedMyFavStore(username, storeID)
}

// Add new store to my favorite store list
// Parameter: String username, String storeID
service.addMyNewFavStore = async (username, storeID) => {
    await repoMySQL.addMyNewFavStore(username, storeID)
}

// Removing store from my favorite store list
// Parameter: String username, String storeID
service.removeMyFavStore = async (username, storeID) => {
    await repoMySQL.removeMyFavStore(username, storeID)
}

// Get my favorite store list
// Parameter: String username
// Result: JSON Array (Each JSON Object will have lots of keys: store_id, service_id,...) | Null (I don't have favorite store list now)
service.getMyFavStoreList = async (username) => {
    return await repoMySQL.getMyFavStoreList(username)
}

// Get all food item of a store
// Parameter: String storeID
// Result: JSON Array (Each JSON Object will have lots of keys: food_id, name, description,...) | Null (This store doesn't have food list now)
service.getFoodListOfStore = async (storeID) => {
    return await repoMySQL.getFoodListOfStore(storeID)
}

// Get all review of a store
// Parameter: String storeID
// Result: JSON Array (Each JSON Object will have lots of keys: review_id, username, stars,...) | Null (This store doesn't have review list now)
service.getReviewListOfStore = async (storeID) => {
    return await repoMySQL.getReviewListOfStore(storeID)
}

// Get store info based on storeID
// Parameter: String storeID
// Result: JSON Object with entire info of store | Null
service.getStoreInfo = async (storeID) => {
    return await repoMySQL.getStoreInfo(storeID)
}

// Checking this storeID is in my favorite list or not
// Parameter: String token, String storeID
// Result: "1" (True) | "0" (False)
service.isFavStoreID = async (username, storeID) => {
    return await repoMySQL.isFavStoreID(username, storeID)
}

// Searching following by keyword and return any results
// Parameter: String keyword
// Result: Any results | Null
service.searching = async (keyword) => {
    return await repoMySQL.searching(keyword)
}

// Get all banner information
// Result: JSON Array (Each JSON Object is relavant to each banner info) | Null
service.getAllBannerInfo = async () => {
    return await repoMySQL.getAllBannerInfo()
}

// Get suggestive store list
// Parameter: String page
// Result: JSON Array | Null
service.getSuggestStoreList = async (page) => {
    return await repoMySQL.getSuggestStoreList(page)
}
















// -----------------------------------------------
// Special query for manipulating MYSQL database
// Parameter: String sql
service.queryMySQL = async (sql) => {
    return await repoMySQL.queryMySQL(sql)
}

module.exports = service;