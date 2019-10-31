/*
    =================
    DECLARE VARIABLES
    =================
*/

const mongo = require('mongodb').MongoClient
const url = 'mongodb+srv://admin:admin@cluster0-67h4m.mongodb.net/test?retryWrites=true&w=majority'
const { promisify } = require('util');
ObjectID = require('mongodb').ObjectID
let repoMongo = {}
let colltest

/*
    =========
    FUNCTIONS
    =========
*/

// Connect to MongoDB & get database with name "TWMOMO"
repoMongo.connectMongoDB = async () => {
    await mongo.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((client) => {
        let myDB = client.db('TWMOMO')
        collectionUsers = myDB.collection('test')
        console.log("MongoDB connected")
    })
    .catch((err) => {
        console.log(err)
    })
}

module.exports = repoMongo;