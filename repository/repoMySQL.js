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

// Test
repoMySQL.selectTest = async (res) => {   
    await myDB.query('CREATE TABLE IF NOT EXISTS test (id INT AUTO_INCREMENT PRIMARY KEY, name NVARCHAR(255))')
    let result = await myDB.query('INSERT INTO test (name) VALUES ("Trần Kiến Quốc - Đẹp Trai :D")')
    let result02 = await myDB.query('INSERT INTO test (name) VALUES ("Team TW-MoMo Blều Blều")')
    await myDB.end()
    res.send("DONE")
}

module.exports = repoMySQL;