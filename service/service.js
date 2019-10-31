/*
    =================
    DECLARE VARIABLES
    =================
*/

let repoMongo = require('../repository/repoMongo');
let service = {}

/*
    =========
    FUNCTIONS
    =========
*/

// Connect to repository of MongoDB
service.connectMongoDB = async () => {
    await repoMongo.connectMongoDB()
}


module.exports = service;