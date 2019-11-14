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
// Result: True (Existed) | False (Inexistent)
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
    delete result.password
    return result
}

// Checking existence of a review of that user and storeID
// Parameter: String username, String storeID
// Result: True (Existed) | False (Inexistent)
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

// Update stars of review
// Parameter: String username, String storeID, Int stars, String datetime
service.updateReviewStars = async (username, storeID, stars, datetime) => {
    await repoMySQL.updateReviewStars(username, storeID, stars, datetime)
}

// Update comment of review
// Parameter: String username, String storeID, String comment, String datetime
service.updateReviewComment = async (username, storeID, comment, datetime) => {
    await repoMySQL.updateReviewComment(username, storeID, comment, datetime)
}

// Update reaction (useful or funny or cool) of review
// Parameter: String username, String storeID, Int reactType
// Result: Success (True) | Fail (False)
service.updateReviewReaction = async (username, storeID, reactType) => {
    if (reactType < 0 || reactType > 2) {
        return false
    }

    let result = await repoMySQL.updateReviewReaction(username, storeID, reactType)
    return result
}


























// Special query for manipulating MYSQL database
// Parameter: String sql
service.queryMySQL = async (sql) => {
    return await repoMySQL.queryMySQL(sql)
}

module.exports = service;