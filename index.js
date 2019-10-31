/*
    =================
    DECLARE VARIABLES
    =================
*/

const serverless = require('serverless-http')
const express = require('express')
const app = express()
const helmet = require('helmet')
app.use(helmet())
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// let service = require('./service/service');
// service.connectMongoDB()

/*
    ============
    RESTFUL APIs
    ============
*/

/*  Register new account
    Req: JSON List (username, password, email, phoneNumber)
    Res: Success or Fail
*/
app.get('/register', (req,res) => {
    res.send("ERROR")
})

app.get('/*', (req, res) => {
    // await service.connectMongoDB()
    res.send("Route not found!")
})







/*
    =========================
    EXPORT APP FOR SERVERLESS
    =========================
*/

module.exports.handler = serverless(app)