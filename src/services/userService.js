const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Sms = require('./smsService');

module.exports = {
  createUser: async (user) => {
    // Generate random string of 8 characters
    // adding two Math.random() will generate string with minimum length of 20.
    const randomStr = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);

    const hashedPwd = await bcrypt.hash(randomStr, 12);

    const name = user.name;
    const last_name = user.last_name;
    const mobile = user.mobile;
    const email = user.email;
    const password = hashedPwd;

    let newUser = await new User({
      name,
      last_name,
      mobile,
      email,
      // temporary password for anonymous user
      password,
      verified: true
    });

    Sms.send("91" + user.mobile, `Your TripBazaar account has been created. You can login to your account using your mobile No. and password: ${randomStr}`, (data) => {
      if (data.type != "success") {
        console.log(`Warning: Hotel prebook - failed to send temporary password to ${user.name}`);
      }
    });

    await newUser.save();
    console.log('user create successfully');
    newUser = newUser.toObject();
    delete newUser.password;

    return newUser;
  }
}