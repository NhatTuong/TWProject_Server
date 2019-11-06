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
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(rawPass, salt);
}














/* --------------------------------------------------------------
                        MONGODB FUNCTIONS
            asd
   -------------------------------------------------------------- */
// Test
service.inserttest = async () => {
    return await repoMongo.insertTest('hello world')
}










/* --------------------------------------------------------------
                        MYSQL FUNCTIONS 
-------------------------------------------------------------- */
// Check info when user login
// Parameter: String username, String password
// Result: String token | False
service.checkLogin = async (username, password) => {

    userInfo = await repoMySQL.getUserByUsername(username)
    if (userInfo == null) return false

    resultComparison = service.comparePassword(password, userInfo.password)
    if (!resultComparison) return false

    jsonUsername = JSON.parse('{"username" : "' + username + '"}')
    token = service.generateJWT(jsonUsername)
    return token
}

// Check existence of username
// Parameter: String username
// Result: True (Existed) | False (Inexistent)
service.existedUsername = async (username) => {
    userInfo = await repoMySQL.getUserByUsername(username)
    if (userInfo == null) return false
    return true
}

// Add new account to database
// Parameter: String username, String password
service.addNewAccount = async (username, password) => { 
    hashpass = service.hashPassword(password)
    await repoMySQL.addNewAccount(username, hashpass)
}












// Special query for manipulating MYSQL database
// Parameter: String sql
service.queryMySQL = async (sql) => {
    return await repoMySQL.queryMySQL(sql)
}

module.exports = service;