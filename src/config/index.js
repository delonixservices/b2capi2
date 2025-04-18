module.exports = {
  apiUrlHotel: process.env.HOTEL_APIURL,
  apiAuthHotel: process.env.HOTEL_APIAUTH,

  apiUrlFlight: process.env.FLIGHT_APIURL,
  // appKey: process.env.APP_KEY,
  // nginx redirecting port /api on port 80 to /api on port 3334
  baseUrl: `${process.env.PROTOCOL}://${process.env.APP_HOST}`,
  // baseUrl: `${process.env.PROTOCOL}://${process.env.APP_HOST}:${process.env.PORT}`,
  jwtSecret: process.env.JWT_SECRET,
  authKey: process.env.AUTHAPI,
  // client will auto detect the port
  clientUrl: `${process.env.PROTOCOL}://${process.env.CLIENT_HOST}`,
  // clientUrl: `${process.env.PROTOCOL}://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`,
}