const axios = require('axios').default;
// default for tying and autocomplete

const logger = require('../config/logger');

const {
  apiUrlHotel,
  apiAuthHotel,
  apiUrlFlight
} = require('../config/index');

const hotelsApi = axios.create({
  baseURL: apiUrlHotel
});

const flightsApi = axios.create({
  baseURL: apiUrlFlight
});
// console.log(apiAuthHotel);
const hotels = {
  post: async (url, params) => {
    const updatedParams = Object.assign({}, params, {
      "authentication": {
        "authorization_key": apiAuthHotel
      }
    });
    // console.log(JSON.stringify(updatedParams));
    try {
      const response = await hotelsApi.post(url, updatedParams);
      const data = response.data;
      // logger.verbose(data);
      return data;

    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `Partner API connection error: ${error.message}`);
      throw new Error("Issue with delonix hotels api server, please try again");
    }
  }
}

const flights = {
  post: async (url, params) => {
    // const updatedParams = Object.assign({}, params, {
    //   "authentication": {
    //     "authorization_key": apiAuthFlight
    //   }
    // });
    // console.log(JSON.stringify(updatedParams));
    try {
      const response = await flightsApi.post(url, params);
      const data = response.data;
      return data;

    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', `Partner API connection error: ${error.message}`);
      throw new Error("Issue with delonix flights api server, please try again");
    }
  }
}

const post = async (url, params) => {

  try {
    // console.log(url)
    // console.log(params)
    const response = await axios.post(url, params);
    const data = response.data;
    return data;

  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', `API connection error: ${error.message}`);
    throw new Error("Issue with partner api server, please try again");
  }
}

module.exports = {
  hotels,
  flights,
  post
}