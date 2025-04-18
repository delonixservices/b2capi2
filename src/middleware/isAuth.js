const jwt = require('jsonwebtoken');
const {
  jwtSecret
} = require('../config/index');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  // console.log(authHeader)
  if (!authHeader) {
    const error = new Error('Not Authenticated!!');
    error.statusCode = 401;
    throw error;
  }
  // Get token string after Bearer
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, jwtSecret);
  } catch (err) {
    err.statusCode = 403;
    throw (err);
  }
  if (!decodedToken) {
    const error = new Error('Not Authenticated');
    error.statusCode = 401;
    throw error;
  }
  req.user = {
    _id: decodedToken.userId,
    mobile: decodedToken.mobile
  }

  next();
}