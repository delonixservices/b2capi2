const Api = require("../../services/apiService");
const Mail = require("../../services/mailService");
const Sms = require('../../services/smsService');

const ccavanue = require('../../utils/ccavanue');
const jtfd = require("json-to-form-data");

const {
  payment_url,
  merchant_id,
  accessCode,
  workingKey,
} = require('../../config/payment');

const {
  baseUrl,
  clientUrl
} = require('../../config/index');

const FlightTransaction = require('../../models/FlightTransaction');

const url = require('url');

// const logger = require('../../config/logger');

const voucher = require('../../utils/voucher');

exports.processPayment = async (req, res, next) => {

  console.log(req.params.id);

  if (!req.params.id) {
    const error = new Error('Booking Id is required');
    error.statusCode = 400;
    return next(error);
  }

  let data;
  try {
    data = await FlightTransaction.findById(req.params.id);
  } catch (err) {
    return next(err);
  }

  if (!data) {
    const error = new Error('Sorry invalid Booking ID, try another id');
    error.statusCode = 404;
    return next(error);
  }

  if (!data.order_create_response) {
    const error = new Error('Transaction is not complete. Please try again.');
    error.statusCode = 500;
    return next(error);
  }

  // TODO: handle session expiry
  // const createdAt = new Date(data.created_at).getTime();
  // // check if booking session is expired
  // // booking session will be expired after 20 (20*60*1000 milliseconds) minutes of prebook
  // const expiry = createdAt + 20 * 60 * 1000;
  // const isExpired = Date.now() > expiry;

  // // console.log(isExpired, createdAt, Date.now())

  // if (isExpired) {
  //   console.log("Booking session expired. Cannot process payment.");
  //   const error = new Error('Booking session expired. Please try again.');
  //   error.statusCode = 422;
  //   return next(error);
  // }

  if (data.payment_response && data.payment_response.order_status === "Success") {
    console.log("Payment is already done");
    const error = new Error('Booking session expired. Please try again!');
    error.statusCode = 422;
    return next(error);
  }

  // update transaction status
  data.status = 3; // payment pending

  const billingUser = {
    'name': data.search.travelers[0].name,
    'last_name': data.search.travelers[0].surname,
    'mobile': data.search.travelers[0].phone,
    'email': data.search.travelers[0].email
  }

  console.log(billingUser);

  // TODO: handle create data.pricing for hadling markup, order price, etc., in createOrder of flight transaction

  const orderRef = data.order_create_response.Response.Order;

  let orders = [];

  if (Array.isArray(orderRef)) {
    orders = orderRef;
  } else {
    orders[0] = orderRef;
  }

  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.TotalOrderPrice.DetailCurrencyPrice.Total.content;
  });

  // const amount = data.flight_price_response.PricedOffer.TotalPrice.DetailCurrencyPrice.Total.content;

  const payload = {
    merchant_id: merchant_id,
    order_id: data._id,
    currency: 'INR',
    billing_name: billingUser.name,
    billing_email: billingUser.email,
    billing_tel: billingUser.mobile,
    // amount: data.pricing.total_chargeable_amount,
    amount: totalAmount,
    redirect_url: `${baseUrl}/api/flights/payment-response-handler`,
    cancel_url: `${baseUrl}/api/flights/payment-response-handler`,
    language: 'EN'
  };

  console.log(payload);

  const formDataString = jtfd(payload);

  const encRequest = ccavanue.encrypt(formDataString, workingKey);

  const formbody = '<form id="nonseamless" method="post" name="redirect" action="' + payment_url + '"/> <input type="hidden" id="encRequest" name="encRequest" value="' + encRequest + '"><input type="hidden" name="access_code" id="access_code" value="' + accessCode + '"><script language="javascript">document.redirect.submit();</script></form>';

  res.send(formbody);

  await data.save();
};

exports.paymentResponseHandler = async (req, res, next) => {
  console.log('Payment response...');
  console.log(req.body);
  try {
    const orderNo = req.body.orderNo;
    const encResp = req.body.encResp;

    if (!orderNo) {
      const error = new Error('OrderNo missing from payment_response from ccavanue.');
      error.statusCode = 500;
      return next(error);
    }

    // console.log('Booking ID: ' + orderNo);
    const transaction = await FlightTransaction.findById(orderNo);
    // console.log(transaction);
    if (!transaction) {
      const error = new Error('Sorry invalid OrderNo, cannot find any transaction with this order no');
      error.statusCode = 500;
      return next(error);
    }

    const paymentData = ccavanue.decrypt(encResp, workingKey);
    const queryStrings = url.parse("/?" + paymentData, true).query;
    //storing payment response
    transaction.payment_response = queryStrings;

    if (queryStrings.order_status === "Success") {
      // redirect to success
      console.log('Payment success');

      try {
        transaction.status = 4; // payment success
        await transaction.save();


        // doing the actual booking
        // @FIXME: Paymnet methods should not be send from B2C end. temporarily sending dummy data in payment method until Delonix flightApi implementation is changed.
        // order doc issue 

        // @FIXME: Response.Order is an array when there are multiple orders

        const order = transaction.order_create_response.Response.Order;

        const passengerList = transaction.order_create_response.Response.DataLists.PassengerList.Passenger;

        const reqBody = {
          "contactContactInformation": transaction.search.contactContactInformation,
          "ticketDocInfo": {
            "bookingRef": {
              "airLineId": order.BookingReferences.BookingReference[1].AirlineID.content,
              "id": order.BookingReferences.BookingReference[0].ID
            },
            // "cashPayment": {
            //   "amount": "string",
            //   "contactInfoRefs": "CID1",
            //   "orderId": "string",
            //   "orderItemId": "string",
            //   "owner": "string",
            //   "type": "string"
            // },
            "orderRef": {
              "orderId": order.OrderID,
              "owner": order.Owner
            },
            "passengerRef": passengerList.PassengerID
          },
          "ticketDocQuantity": 1,
          "travelAgency": {
            "agencyID": "string",
            "email": "string",
            "iata_Number": "string",
            "name": "string",
            "pseudoCity": "string"
          },
          "travelers": transaction.search.travelers
        }

        console.log(reqBody);

        let data;
        try {

          data = await Api.flights.post('/Api/orderDocIssue', reqBody);

          console.log('Order Doc Issue executed...');
          console.log(data);

          if (!data || !data.OrderViewRS) {
            throw new Error("Unable to create order. No response received from supplier");
          }

          if (!data.OrderViewRS.Response) {
            throw new Error(data.OrderViewRS.Errors.ErrorMessage);
          }

        } catch (err) {
          transaction.status = 5; // booking failed
        }

        transaction.order_doc_issue_response = data.OrderViewRS;

        transaction.status = 1; // booking success


        // // createOrder api
        // // @FIXME: Currently generating PNR and eticket is done with single api, i.e. createOrder.
        // // make changes accordingly when delonix b2b implementation is changed

        // let data;
        // try {
        //   data = await Api.flights.post('/Api/createOrder', transaction.search);

        //   if (!data || !data.OrderViewRS) {
        //     throw new Error("Unable to create order. No response received from supplier");
        //   }

        //   if (!data.OrderViewRS.Response) {
        //     throw new Error(data.OrderViewRS.Errors.ErrorMessage);
        //   }

        //   transaction.order_create_response = data.OrderViewRS;
        //   transaction.status = 1; // booking success

        // } catch (err) {
        //   console.log(err);
        //   await transaction.save();
        //   return next(err);
        // }

        // console.log(transaction);

        // data._id = transaction._id;

        // console.log(data);

        const {
          name,
          surname,
          phone,
          email
        } = transaction.search.travelers[0];

        const PNR = order.BookingReferences.BookingReference[0].ID;

        const smsGuest = `Dear ${name}, Your Flight with PNR ${PNR} has been booked and the bookingId is ${transaction._id}. Thank you !`;

        const smsAdmin = `Hello Admin, new booking received. bookingId: ${transaction._id}, Lead passenger name: ${name} ${surname} and Flight PNR: ${PNR}`;

        try {
          const guestRes = Sms.send(phone, smsGuest);
          const adminRes = Sms.send("917678105666", smsAdmin);

          Promise.all([guestRes, adminRes])
            .then((data) => {
              console.log(data);
              console.log("sms sent successfully");
            })
            .catch((err) => {
              throw err;
            })

          // if (guestRes.type != "success") {
          //   throw new Error('Failed to send the sms');
          // }

          // if (adminRes.type != "success") {
          //   throw new Error('Failed to send the sms');
          // }

          // if (admin2Res.type != "success") {
          //   throw new Error('');
          // }

        } catch (err) {
          console.log("Failed to send the sms", err);
        }

        let voucherBuffer = await voucher.generateFlightVoucher(transaction);
        voucherBuffer = voucherBuffer.toString('base64');

        const msg = {
          to: email,
          subject: 'TripBazaar Confim Ticket',
          html: `Dear ${name}, Your Flight with PNR ${PNR} has been booked and the bookingId is ${transaction._id}. Thank you !`,
          attachments: [{
            filename: 'Voucher.pdf',
            content: voucherBuffer,
            type: 'application/pdf',
            disposition: 'attachment',
            contentId: 'myId'
          }]
        };

        const msgAdmin = {
          to: 'ankit.phondani@delonixtravel.com',
          subject: 'TripBazaar Confim Ticket',
          html: `Hello Admin, new booking received. bookingId: ${transaction._id}, Lead passenger name: ${name} ${surname} and Flight PNR: ${PNR}`,
          attachments: [{
            filename: 'Voucher.pdf',
            content: voucherBuffer,
            type: 'application/pdf',
            disposition: 'attachment',
            contentId: 'myId2'
          }]
        };
        try {
          Mail.send(msg);
          Mail.send(msgAdmin);
        } catch (err) {
          console.log("Failed to send mail", err);
        }
        // res.redirect(`${clientUrl}/hotels/hotelvoucher?id=${transaction._id}`);

        res.redirect(`${clientUrl}/account/manage-flight-booking?status=success&id=${transaction._id}`);

        await transaction.save();
        console.log("transaction saved...");
      } catch (err) {
        console.log(err);
        await transaction.save();
        throw err;
      }
    } else {
      // redirect to failed page
      transaction.status = 6; // payment failed 
      res.redirect(`${clientUrl}/account/manage-flight-booking?status=success&id=${transaction._id}`);
      await transaction.save();
    }
  } catch (err) {
    console.log(err);
    return res.redirect(`${clientUrl}/account/manage-flight-booking?status=booking_failed`);
  }
};