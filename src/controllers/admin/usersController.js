const Admin = require('../../models/Admin');
const User = require('../../models/User');
// const Token = require('../../models/Token');

const {
  validationResult
} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  jwtSecret
} = require('../../config/index');

// const randtoken = require('rand-token');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed!');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const email = req.body.email;
    const mobile = +req.body.mobile;
    const password = req.body.password;

    const hashedPwd = await bcrypt.hash(password, 12);

    const admin = await new Admin({
      email,
      mobile,
      password: hashedPwd
    });

    await admin.save();

    res.json({
      'message': 'Admin created successfully.',
      'adminId': admin._id
    });
  } catch (error) {
    next(error);
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
  const email = req.body.email;
  const password = req.body.password;
  try {
    let admin = await Admin.findOne({
      'email': email
    });
    if (!admin) {
      const error = new Error('Email or password incorrect');
      error.statusCode = 401;
      throw error;
    } else {
      const isEqual = await bcrypt.compare(password, admin.password);
      if (!isEqual) {
        const error = new Error('Email or password incorrect');
        error.statusCode = 401;
        throw error;
      } else {
        const token = jwt.sign({
            'adminId': admin._id,
            'email': admin.email
          },
          jwtSecret, {
            // expiresIn: "1h" // expires in 1 hr
          });
        // const refreshToken = randtoken.uid(256);

        // await new Token({
        // 	'refresh_token': refreshToken,
        // 	'adminId': admin._id
        // }).save();

        admin = admin.toObject();
        delete admin.password;
        res.json({
          'status': 200,
          'data': {
            'token': token,
            // 'refreshToken': refreshToken,
            'admin': admin
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  // 	const error = new Error('Validation Failed!');
  // 	error.statusCode = 422;
  // 	error.data = errors.array();
  // 	return next(error);
  // }
  // const refreshToken = req.body.refreshToken;
  // if (!refreshToken) {
  // 	const error = new Error('Please provide refresh token');
  // 	error.statusCode = 404;
  // 	return next(error);
  // }
  // let token;
  // try {
  // 	token = await Token.findOneAndDelete({
  // 		'refresh_token': refreshToken,
  // 		'adminId': req.admin._id
  // 	});
  // } catch (err) {
  // 	console.log('Cannot delete refresh token');
  // 	return next(err);
  // }

  // console.log(token);
  // if (!token) {
  // 	const error = new Error('Invalid refresh token');
  // 	error.statusCode = 404;
  // 	return next(error);
  // }

  return res.json({
    "status": 200,
    "message": 'success'
  });
};

// exports.refresh = async (req,res,next)=>{

// }

exports.allUsers = async (req, res, next) => {
  const users = await User.find({}, {
    '_id': 1,
    'name': 1,
    'last_name': 1,
    'email': 1,
    'mobile': 1,
    'created_at': 1,
    'verified': 1
  });

  res.json({
    "status": 200,
    "data": users
  });
};

exports.updateUser = async (req, res, next) => {
  const userId = req.body._id;
  const name = req.body.name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const mobile = req.body.mobile;
  // const password = req.body.password;
  // const newPassword = req.body.newPassword;

  try {
    let user = await User.findById(userId);

    user.name = name;
    user.last_name = last_name;
    user.email = email;
    user.mobile = mobile;

    // const isEqual = bcrypt.compare(password, user.password)

    // if (!isEqual) {
    // 	const error = new Error('Invalid password');
    // 	error.statusCode = 401;
    // 	return next(error);
    // }

    // const hashedPwd = await bcrypt.hash(newPassword, 12);
    // user.password = hashedPwd;

    await user.save();
    user = user.toObject();
    delete user.password;
    res.json({
      "status": 200,
      "data": user
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      "message": "User failed to update"
    })
    // return next(err);
  }
};