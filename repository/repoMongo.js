require('dotenv').config();
const mongo = require('mongodb').MongoClient
const { promisify } = require('util');
ObjectID = require('mongodb').ObjectID
let repoMongo = {}
let myDB = null

// Connecting to MongoDB & get database
function connectMongoDB() {
    if (myDB) {
        return Promise.resolve(myDB)
    }

    return mongo.connect(process.env.MONGODB_CONN_URL, { useNewUrlParser: true, useUnifiedTopology: true })
            .then((client) => {
                myDB = client.db(process.env.MONGODB_DB_NAME)
                return myDB
            })
}

// Logging information of user
// Parameter: String username, String datetime, String log
repoMongo.writeLog = async (username, datetime, log) => {
    return connectMongoDB()
    .then((db) => {
        appLogCol = db.collection(process.env.MONGODB_COL_APPLOG)
        getAsync = promisify(colltest.insertOne).bind(appLogCol)
        return getAsync({username: username, datetime: datetime, log: log}).then((res) => {
            return true
        })
    })
}

module.exports = repoMongo;