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

// Getting user by username
// Parameter: username
// Result: UserInfo | Null
repoMySQL.getUserByUsername = async (username) => {
    userInfo = await myDB.query('SELECT * FROM usertable WHERE username=?', [username])
    if (userInfo.length==0) return null
    await myDB.end()
    return userInfo[0]
}

// Adding new account
// Parameter: username, password
repoMySQL.addNewAccount = async (username, password) => {
    await myDB.query('INSERT INTO usertable(username, password) VALUES (?, ?)', [username, password])
    await myDB.end()
}








// Special query for manipulating MYSQL database
// Parameter: String sql (for querying)
repoMySQL.queryMySQL = async (sql) => {
    result = await myDB.query(sql)
    await myDB.end()
    return result
}

module.exports = repoMySQL;