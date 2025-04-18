const {
  validationResult
} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  jwtSecret
} = require('../config/index');
const randtoken = require('rand-token');
const User = require('../models/User');
const Token = require('../models/Token');
const Sms = require('../services/smsService');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed!');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const name = req.body.name;
    const last_name = req.body.last_name;
    const mobile = req.body.mobile;
    const email = req.body.email;
    const password = req.body.password;

    const hashedPwd = await bcrypt.hash(password, 12);

    const user = await new User({
      name,
      last_name,
      mobile,
      email,
      password: hashedPwd,
      verified: false
    });

    const otp = Sms.generateOtp();

    Sms.sendOtp("91" + user.mobile, "Thank you for registering with TripBazaar. You OTP is " + otp, otp, (data) => {
      if (data.type != "success") {
        throw new Error('Cannot send otp for successful registration');
      }
    });
    user.otp = otp;
    await user.save();

    res.json({
      'message': 'User created successfully.',
      'userId': user._id
    });
  } catch (error) {
    return next(error);
  }
}

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const mobile = req.body.mobile;
  const password = req.body.password;
  try {
    let user = await User.findOne({
      'mobile': mobile
    });
    if (!user) {
      const error = new Error('Mobile or Password incorrect');
      error.statusCode = 401;
      throw error;
    } else {
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        const error = new Error('Mobile or Password incorrect');
        error.statusCode = 401;
        throw error;
      } else {
        const token = jwt.sign({
            'userId': user._id,
            'mobile': user.mobile
          },
          jwtSecret, {
            // expiresIn: "1h" // expires in 1 hr
          });
        const refreshToken = randtoken.uid(256);

        await new Token({
          'refresh_token': refreshToken,
          'userId': user._id
        }).save();

        user = user.toObject();
        delete user.otp;
        delete user.password;
        delete user.password_reset_expiry;
        delete user.password_reset_token;

        res.json({
          'token': token,
          'refreshToken': refreshToken,
          'user': user
        });
      }
    }
  } catch (err) {
    next(err);
  }
}

exports.logout = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    const error = new Error('Please provide refresh token');
    error.statusCode = 404;
    return next(error);
  }
  let token;
  try {
    token = await Token.findOneAndDelete({
      'refresh_token': refreshToken,
      'userId': req.user._id
    });
  } catch (err) {
    console.log('Cannot delete refresh token');
    return next(err);
  }

  console.log(token);
  if (!token) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 404;
    return next(error);
  }

  return res.status(200).send({
    "message": 'success'
  })
}

exports.refreshToken = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const refreshToken = req.body.refreshToken;
  const userId = req.body.userId;

  try {
    const token = await Token.findOne({
      'refresh_token': refreshToken
    });
    if (!token) {
      const error = new Error('Invalid refresh token');
      error.statusCode = 404;
      throw error;
    }

    if (token.userId.toString() !== userId) {
      const error = new Error('Not Authorized!');
      error.statusCode = 403;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('Not Authorized');
      error.statusCode = 403;
      throw error;
    }

    const accessToken = jwt.sign({
      'userId': user._id,
      'mobile': user.mobile
    }, jwtSecret);

    res.status(200).json({
      'token': accessToken,
      'refreshToken': refreshToken
    });
  } catch (err) {
    next(err);
  }
}

exports.authUser = async (req, res, next) => {
  let user = await User.findById(req.user._id);

  if (!user) {
    const error = new Error('Not Authorized');
    error.statusCode = 403;
    return next(error);
  }
  user = user.toObject();
  delete user.password;
  delete user.otp;
  delete user.password_reset_expiry;
  delete user.password_reset_token;
  res.json(user);
}

// verify otp
exports.verifyOtp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const otp = req.body.otp;
  const userId = req.body.userId;

  let user = await User.findOne({
    "_id": userId
  })

  if (!otp || !user) {
    const error = new Error('Invalid req params');
    error.statusCode = 400;
    return next(error);
  }

  if (user.otp == otp) {
    user.verified = true;
    await user.save();
  } else {
    const error = new Error('Invalid otp.');
    error.statusCode = 400;
    return next(error);
  }
  user = user.toObject();
  delete user.password;
  delete user.otp;
  delete user.password_reset_expiry;

  return res.json({
    status: 200,
    data: user
  })
};

// forgot password
exports.forgotPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const mobile = req.body.mobile;

  let user = await User.findOne({
    'mobile': mobile
  });

  if (!user || !user.verified) {
    const error = new Error('Can not find user with mobile no.');
    error.statusCode = 404;
    return next(error);
  }

  const otp = await Sms.generateOtp();
  user.otp = otp;

  Sms.sendOtp("91" + mobile, "Your OTP is " + otp, otp, (data) => {
    if (data.type != "success") {
      const error = new Error(`Failed to send otp to ${mobile}.`);
      error.statusCode = 500;
      return next(error);
    }
  });

  const password_reset_token = randtoken.uid(25);
  // password_reset will be valid for 15 minutes, i.e 900000 ms
  const password_reset_expiry = Date.now() + 900000;

  user.password_reset_token = password_reset_token;
  user.password_reset_expiry = password_reset_expiry;
  await user.save();
  user = user.toObject();
  delete user.password;
  delete user.otp;
  delete user.password_reset_expiry;
  delete user.password_reset_token;
  // console.log(user);
  res.json({
    "status": 200,
    "data": user
  });
};

// verifyuser
exports.verifyUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    // return next(error);
    return next(error);
  }
  const otp = req.body.otp;
  const userId = req.body.userId;

  try {
    let user = await User.findOne({
      "_id": userId
    });

    if (!user) {
      const error = new Error('Cannot find user.');
      error.statusCode = 404;
      throw error;
    }

    if (user._id != req.user._id) {
      const error = new Error('Not Authorized');
      error.statusCode = 403;
      throw error;
    }

    // console.log(user);
    // console.log(otp, user.otp);

    if (user.otp == otp) {
      user.verified = true;
      await user.save();
      user = user.toObject();
      delete user.password;
      delete user.otp;
      delete user.password_reset_expiry;
      delete user.password_reset_token;
      return res.status(200).json({
        message: "Account verified successfuly"
      })
    } else {
      const error = new Error('Invalid otp.');
      error.statusCode = 400;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

// reset password
exports.resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  const userId = req.body.userId;
  const password = req.body.password;
  const password_reset_token = req.body.password_reset_token;

  let user = await User.findOne({
    "_id": userId
  });

  if (!user) {
    const error = new Error('Invalid user');
    error.statusCode = 404;
    return next(error);
  }

  if (user.password_reset_token === password_reset_token && Date.now() < user.password_reset_expiry) {
    const hashedPwd = await bcrypt.hash(password, 12);
    user.password = hashedPwd;
    await user.save();
  } else {
    const error = new Error('Not Authorized, Invalid password reset token');
    error.statusCode = 403;
    return next(error);
  }

  user = user.toObject();
  delete user.password;
  delete user.otp;

  return res.status(200).json({
    "status": 200,
    "message": "Password changed successfully"
  });
};

exports.updateUserProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  const userId = req.body.userId;
  const name = req.body.name;
  const lastName = req.body.last_name;
  const email = req.body.email;

  let user = await User.findOne({
    "_id": userId
  });

  if (!user) {
    const error = new Error('Can not find user with mobile no.');
    error.statusCode = 404;
    return next(error);
  }

  if (user._id != req.user._id) {
    const error = new Error('Not Authorized');
    error.statusCode = 403;
    return next(error);
  }

  user.name = name;
  user.last_name = lastName;
  user.email = email;

  await user.save();
  user = user.toObject();
  delete user.password;
  delete user.otp;
  delete user.password_reset_expiry;
  delete user.password_reset_token;

  return res.status(200).json({
    'user': user
  })
};

// password change
exports.updatePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  const userId = req.body.userId;
  const password = req.body.password;
  const newPassword = req.body.newPassword;

  let user = await User.findById({
    "_id": userId
  });

  if (user._id != req.user._id) {
    const error = new Error('Not Authorized');
    error.statusCode = 403;
    return next(error);
  }

  const isEqual = bcrypt.compare(password, user.password)

  if (!isEqual) {
    const error = new Error('Invalid password');
    error.statusCode = 401;
    return next(error);
  }

  const hashedPwd = await bcrypt.hash(newPassword, 12);
  user.password = hashedPwd;
  await user.save();
  user = user.toObject();
  delete user.password;
  delete user.otp;
  delete user.password_reset_expiry;
  delete user.password_reset_token;

  return res.status(200).json({
    message: "Password updated successfuly",
    user: user
  })
};

// Not completed
// @TODO Verify otp than update mobile
// @TODO Verify Password than update mobile
exports.updateMobile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed!');
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }

  const userId = req.body.id;
  const mobile = req.body.mobile;

  let user = await User.findOne({
    "_id": userId
  });

  if (!user) {
    const error = new Error('Invalid user.');
    error.statusCode = 403;
    return next(error);
  }

  if (user._id !== req.user._id) {
    const error = new Error('Not Authorized');
    error.statusCode = 403;
    return next(error);
  }

  const otp = await Sms.generateOtp();
  user.otp = otp;

  Sms.sendOtp("91" + mobile, "Your OTP is " + otp, otp, (data) => {
    if (data.type != "success") {
      const error = new Error('Failed to send otp.');
      error.statusCode = 500;
      return next(error);
    }
  });

  // user.mobile = mobile;
  await user.save();
  user = user.toObject();
  delete user.password;
  delete user.otp;
  delete user.password_reset_expiry;
  delete user.password_reset_token;

  return res.status(200).json({
    message: "Mobile no updated successfuly",
    user: user
  })
};