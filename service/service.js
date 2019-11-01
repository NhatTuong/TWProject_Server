require('dotenv').config();
let repoMongo = require('../repository/repoMongo');
let repoMySQL = require('../repository/repoMySQL');
let service = {}

// Test
service.inserttest = async () => {
    return await repoMongo.insertTest('hello world')
}

// Test
service.selecttestMySQL = async (res) => {
    return await repoMySQL.selectTest(res)
}


module.exports = service;