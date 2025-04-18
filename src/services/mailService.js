const sgMail = require('@sendgrid/mail');
const {
    apiKey
} = require('../config/sendgrid');

module.exports = {
    send: async (mailObj) => {

        sgMail.setApiKey(apiKey);
        mailObj.from = 'tripbazaar.co@gmail.com';
        try {
            if (mailObj.to) {
                await sgMail.send(mailObj);
            }
        } catch (err) {
            throw new Error("Failed to send email");
        }
    }
}