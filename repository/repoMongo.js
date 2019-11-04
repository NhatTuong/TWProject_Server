require('dotenv').config();
const mongo = require('mongodb').MongoClient
const { promisify } = require('util');
ObjectID = require('mongodb').ObjectID
let repoMongo = {}
let myDB = null

// Connect to MongoDB & get database
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

// Test
repoMongo.insertTest = async (variable) => {
    return connectMongoDB()
    .then((db) => {
        colltest = db.collection(process.env.MONGODB_COL_TEST)
        getAsync = promisify(colltest.insertOne).bind(colltest)
        return getAsync({hello: variable}).then((res) => {
            return res
        })
    })
}

module.exports = repoMongo;