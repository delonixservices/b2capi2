const http = require('http');
const {
  authKey,
  senderId
} = require('../config/sms');

const Sms = {
  generateOtp: () => {
    let digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  },

  sendOtp: async (to, msg, otp) => {
    try {
      let request = `/api/sendotp.php?authkey=${authKey}&message=${encodeURIComponent(msg)}&sender=${senderId}&mobile=${to}&otp=${otp}`;
      const options = {
        "method": "POST",
        "hostname": "control.msg91.com",
        "port": null,
        "path": request,
        "headers": {}
      };

      let req = await http.request(options, (res) => {
        let chunks = [];

        res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        res.on("end", function () {
          let body = Buffer.concat(chunks);
          let parsedBody;
          try {
            parsedBody = JSON.parse(body.toString());
          } catch (err) {
            throw err;
          }
          console.log(parsedBody);
        });
      });

      req.end();

    } catch (error) {
      console.log(error);
      throw new Error("Issue with SMS provider");
    }
  },

  send: async (to, msg) => {

    let request = `/api/sendhttp.php?country=91&sender=${senderId}&route=4&mobiles=${to}&authkey=${authKey}&message=${encodeURIComponent(msg)}`;

    let options = {
      "method": "GET",
      "hostname": "api.msg91.com",
      "port": null,
      "path": request,
      "headers": {}
    };

    let req = http.request(options, function (res) {
      let chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        let body = Buffer.concat(chunks);
        try {
          console.log('Sms sent successfully.');
          return JSON.parse(body.toString());
        } catch (error) {
          return {};
        }
      });
    });

    req.end();
  }
}

module.exports = Sms;