// Reference of SERVERLESS-MYSQL: 
// Link: https://github.com/jeremydaly/serverless-mysql

require('dotenv').config();
let repoMySQL = {}
const myDB = require('serverless-mysql')({
    config: {
        host     : process.env.RDS_MYSQL_HOSTNAME,
        port     : process.env.RDS_MYSQL_PORT,
        database : process.env.RDS_MYSQL_DB_NAME,
        user     : process.env.RDS_MYSQL_USER,
        password : process.env.RDS_MYSQL_PASSWORD,
        charset  : process.env.RDS_MYSQL_CHARSET,
    }
})

// Adding new account
// Parameter: username, password
repoMySQL.addNewAccount = async (username, password) => {
    await myDB.query('INSERT INTO user(username, password) VALUES (?, ?)', [username, password])
    await myDB.end()
}

// Filling in detail information after registering
// Parameter: String username, String name, String country, String city, Int age, String job, String gender, String salaryRange
repoMySQL.fillInDetailInfo = async (username, name, country, city, age, job, gender, salaryRange) => {
    await myDB.query('UPDATE user SET name = ?, country = ?, city = ?, age = ?, job = ?, gender = ?, salary_range = ? WHERE username = ?', [name, country, city, age, job, gender, salaryRange, username])
    await myDB.end()
}

// Getting all profile information 
// Parameter: String username
// Result: All information of user, except password
repoMySQL.getProfileInfo = async (username) => {
    let result = await myDB.query('SELECT * FROM user WHERE username = ?', [username])
    await myDB.end()
    if (result.length == 0) return null
    return result[0]
}

// Getting review by username and storeID
// Parameter: username, storeID
// Result: Review | Null
repoMySQL.getReviewByUsernameAndStoreID = async (username, storeID) => {
    let review = await myDB.query('SELECT * FROM review WHERE username = ? AND store_id = ?', [username, storeID])
    await myDB.end()
    if (review.length==0) return null
    return review[0]
}

// Insert new review
// Parameter: String username, String storeID, Int stars, String datetime, String comment, Int useful, Int funny, Int cool
repoMySQL.addNewReview = async (username, storeID, stars, datetime, comment, useful, funny, cool) => {
    await myDB.transaction()
            .query('INSERT INTO review(username, store_id, stars, date, text, useful, funny, cool) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [username, storeID, stars, datetime, comment, useful, funny, cool])
            .query('UPDATE user SET review_count = review_count + 1 WHERE username = ?', [username])
            .query('UPDATE store SET review_count = review_count + 1 WHERE store_id = ?', [storeID])
            .rollback()
            .commit()
    await myDB.end()
}

// Update stars of review
// Parameter: String username, String storeID, Int stars, String datetime
repoMySQL.updateReviewStars = async (username, storeID, stars, datetime) => {
    await myDB.query('UPDATE review SET stars = ?, date = ? WHERE username = ? AND store_id = ?', [stars, datetime, username, storeID])
    await myDB.end()
}

// Update comment of review
// Parameter: String username, String storeID, String comment, String datetime
repoMySQL.updateReviewComment = async (username, storeID, comment, datetime) => {
    await myDB.query('UPDATE review SET comment = ?, date = ? WHERE username = ? AND store_id = ?', [comment, datetime, username, storeID])
    await myDB.end()
}

// Update reaction (useful or funny or cool) of review
// Parameter: String username, String storeID, Int reactType
// Result: Success (True) | Fail (False)
repoMySQL.updateReviewReaction = async (username, storeID, reactType) => {
    let sql = null

    switch (reactType) {
        case 0: // Useful
            sql = 'UPDATE review SET useful = useful + 1 WHERE username = ? AND store_id = ?'
            break;
        case 1: // Funny
            sql = 'UPDATE review SET funny = funny + 1 WHERE username = ? AND store_id = ?'
            break;
        case 2: // Cool
            sql = 'UPDATE review SET cool = cool + 1 WHERE username = ? AND store_id = ?'
            break;
    }

    if (sql == null) return false

    await myDB.query(sql, [username, storeID])
    await myDB.end()
    return true
}




















// Special query for manipulating MYSQL database
// Parameter: String sql (for querying)
repoMySQL.queryMySQL = async (sql) => {
    let result = await myDB.query(sql)
    await myDB.end()
    return result
}

module.exports = repoMySQL;