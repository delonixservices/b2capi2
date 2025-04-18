const app = require('./src/app');
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3334;

app.listen(port, host, (err) => {
    if (err)
        console.log(err);
    else
        console.log(`serving app on http://${host}:${port}`);
});

// process.on('unhandledRejection', (error, promise) => {
//     console.log('Forgot to handle a promise rejection here: ', promise);
//     console.log('The error was: ', error);
// });