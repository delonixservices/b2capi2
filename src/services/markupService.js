const Config = require('../models/Config');
const logger = require('../config/logger');

module.exports = {
  // addMarkup will modify the hotelPackage data with latest markup
  addMarkup: async (hotelPackage) => {

    if (!hotelPackage) {
      const err = 'No hotel package found to apply markup at markupService.js';
      logger.error(err);
      throw new Error(err);
    }

    let serviceCharge = 0;
    let processingFee = 0;
    let baseAmount = hotelPackage.chargeable_rate;


    let config = await Config.findOne({});

    if (!config || !config.markup) {
      logger.info('Cannot find any document in the config collection. at markupService.js');
      // throw new Error('Cannot find any document in the config collection. at markupService.js');
    } else {
      if (baseAmount < 0 || config.markup.value <= 0) {
        console.log('markup not applied! at markupService.js');
      } else {
        if (config.markup.type === 'percentage') {
          let markup = (config.markup.value / 100) * baseAmount;
          // Adding 18% gst to the markup
          markup = markup + (18 / 100 * markup);
          baseAmount = baseAmount + markup;

        } else if (config.markup.type === 'fixed') {
          // Adding 18% gst to the markup
          let markup = config.markup.value + (18 / 100 * config.markup.value);
          baseAmount = baseAmount + markup;
        }
      }

      // Add service charges

      if (config.service_charge.value <= 0) {
        console.log('service charges not applied');

      } else if (config.service_charge.type === 'percentage') {
        let charge = (config.service_charge.value / 100) * baseAmount;
        serviceCharge = charge;

      } else if (config.service_charge.type === 'fixed') {
        serviceCharge = config.service_charge.value;
      }

      if (config.processing_fee <= 0) {
        console.log('Processing fee not applied');

      } else {
        processingFee = config.processing_fee;
      }
    }

    // 18% gst on service charge and processing fee
    const gst = 18 / 100 * (serviceCharge + processingFee);

    const totalChargeableAmount = baseAmount + serviceCharge + processingFee + gst;

    hotelPackage.base_amount = baseAmount;
    // convert string returned from toFixed() to number by prepending +
    hotelPackage.chargeable_rate = +totalChargeableAmount.toFixed(2);
    hotelPackage.service_charge = +serviceCharge.toFixed(2);
    hotelPackage.processing_fee = +processingFee.toFixed(2);
    hotelPackage.gst = +gst.toFixed(2);
  },
  getMarkup: async () => {
    const config = await Config.findOne({});

    if (!config || !config.markup) {
      throw new Error('Cannot find any document in the config collection. at markupService.js');
    }

    return config.markup;
  }
}