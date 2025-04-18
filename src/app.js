// should be at the top
require('dotenv').config();

const expressLoader = require('./loaders/express');
const mongooseLoader = require('./loaders/mongoose');

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors())
async function startServer() {
    try {
        await expressLoader(app);
        await mongooseLoader();
    } catch (err) {
        console.log("\x1b[31m%s\x1b[0m", 'Uncaught exception!');
        console.log('The error was: ', err);
    }
}

startServer();

process.on('uncaughtException', (error) => {
    console.log('Uncaught exception!!!');
    console.log('The error was: ', error);
});

module.exports = app;