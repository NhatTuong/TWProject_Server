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
    if (review.length == 0) return null
    return review[0]
}

// Insert new review
// Parameter: String username, String storeID, Int stars, String datetime, String comment, Int useful, Int funny, Int cool
repoMySQL.addNewReview = async (username, storeID, stars, datetime, comment, useful, funny, cool) => {
    await myDB.transaction()
            .query('INSERT INTO review(username, store_id, stars, date, text, useful, funny, cool) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [username, storeID, stars, datetime, comment, useful, funny, cool])
            .query('UPDATE user SET review_count = review_count + 1 WHERE username = ?', [username])
            .query('SELECT * FROM store WHERE store_id = ? FOR UPDATE', [storeID])
            .query('UPDATE store SET stars = (stars * review_count + ?)/(review_count + 1), review_count = review_count + 1 WHERE store_id = ?', [stars, storeID])
            .rollback()
            .commit()
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

    await myDB.transaction()
            .query('SELECT * FROM review WHERE username = ? AND store_id = ? FOR UPDATE', [username, storeID])
            .query(sql, [username, storeID])
            .rollback()
            .commit()
    await myDB.end()

    return true
}

// Get raw concern list
// Result: JSON Array (Each JSON Object will have two keys: concern_id, label) | Null (DB doesn't have concern list)
repoMySQL.getRawConcernList = async () => {
    let result = await myDB.query('SELECT * FROM concern')
    await myDB.end()
    if (result.length == 0) return null
    return result
}

// Get my concern list
// Parameter: String username
// Result: SON Array (Each JSON Object will have two keys: concern_id, label) | Null (I don't have concern list now)
repoMySQL.getMyConcernList = async (username) => {
    let result = await myDB.query('SELECT co.concern_id, co.label FROM user_concern AS usco INNER JOIN concern AS co ON usco.concern_id = co.concern_id WHERE usco.username = ?', [username])
    await myDB.end()
    if (result.length == 0) return null
    return result
}

// Delete my concern list
// Parameter: String username
repoMySQL.deleteMyConcernList = async (username) => {
    await myDB.transaction()
            .query('SELECT * FROM user_concern WHERE username = ? FOR UPDATE', [username])
            .query('DELETE FROM user_concern WHERE username = ?', [username])
            .rollback()
            .commit()
    await myDB.end()
}

// Add my new concern
// Parameter: String username, String concernID
repoMySQL.addMyNewConcern = async (username, concernID) => {
    await myDB.query('INSERT INTO user_concern(username, concern_id) VALUES (?, ?)', [username, concernID])
    await myDB.end()
}

// Exist my favorite store or not
// Parameter: String username, String storeID
// Result: True (Existent) | False (Inexistent)
repoMySQL.existedMyFavStore = async (username, storeID) => {
    let result = await myDB.query('SELECT * FROM user_favorite WHERE username = ? AND store_id = ?', [username, storeID])
    await myDB.end()
    if (result.length == 0) return false
    return true
}

// Add new store to my favorite store list
// Parameter: String username, String storeID
repoMySQL.addMyNewFavStore = async (username, storeID) => {
    await myDB.query('INSERT INTO user_favorite(username, store_id) VALUES(?, ?)', [username, storeID])
    await myDB.end()
}

// Removing store from my favorite store list
// Parameter: String username, String storeID
repoMySQL.removeMyFavStore = async (username, storeID) => {
    await myDB.transaction()
            .query('SELECT * FROM user_favorite WHERE username = ? AND store_id = ? FOR UPDATE', [username, storeID])
            .query('DELETE FROM user_favorite WHERE username = ? AND store_id = ?', [username, storeID])
            .rollback()
            .commit()
    await myDB.end()
}

// Get my favorite store list
// Parameter: String username
// Result: JSON Array (Each JSON Object will have lots of keys: store_id, service_id,...) | Null (I don't have favorite store list now)
repoMySQL.getMyFavStoreList = async (username) => {
    let result = await myDB.query( 'SELECT st.*, ho.hour, cate.category\
                                    FROM\
                                        user_favorite AS usfa INNER JOIN store AS st ON usfa.store_id = st.store_id\
                                        INNER JOIN hour AS ho ON st.store_id = ho.store_id\
                                        INNER JOIN category AS cate ON st.store_id = cate.store_id\
                                    WHERE usfa.username = ?', [username])
    await myDB.end()
    if (result.length == 0) return null
    return result
}














// Special query for manipulating MYSQL database
// Parameter: String sql (for querying)
repoMySQL.queryMySQL = async (sql) => {
    let result = await myDB.query(sql)
    await myDB.end()
    return result
}

module.exports = repoMySQL;