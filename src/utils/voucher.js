const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const {
  parseFlightDuration
} = require('../utils/common');

const {
  parseDate,
  parseTime
} = require('../utils/common');

const generateVoucher = async (transaction) => {

  const {
    package: hotelPackage,
    guest,
    booking_id,
    confirmed_at,
    cancellation_policy
  } = transaction.book_response.data;

  const {
    originalName,
    location,
    imageDetails,
    policy
  } = transaction.hotel;

  const {
    checkInTime,
    checkOutTime,
    phone,
    email
  } = transaction.hotel.moreDetails;

  const {
    total_chargeable_amount,
    currency
  } = transaction.pricing;

  const rate_currency = currency === "INR" ? '&#8377' : currency;

  let cancellationPolicy = "";

  cancellation_policy.cancellation_policies.forEach((data) => {
    cancellationPolicy += `
    <tr>
        <td>${parseDate(data.date_from)}</td>
        <td>${parseDate(data.date_to)}</td>
        <td>${data.penalty_percentage}%</td>
    </tr> `;
  });

  const foodType = [
    "",
    "",
    ", Breakfast",
    ", Lunch",
    ", Dinner",
    ", Half Board: Could be any 2 meals (e.g.breakfast and lunch, lunch and dinner",
    ", Full Board: Breakfast, lunch and dinner",
    ", All Inclusive"
  ];

  const content = `
    <div style="margin:40px; font-family: Helvetica, sans-serif; line-height: 25px; color: #333">
        <style>
            .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #d8d8d8;
                padding-bottom: 10px;                
                margin:-40px 0 40px;
            }
            .header #logo {
                display: flex;
                text-align: center;
                align-items: center;
                font-weight: bold;
                font-size: 30px;
                color:#de3c31;
            }
            .header .right {
                text-align: right;
            }
            .hotel_details {
                display: flex;
                padding:40px 0;
            }
            .hotel_img {
                width: 40%;
            }
            .hotel_img img {
                width: 100%;
                height:175px;
                object-fit: cover;
            }
            .hotel_info {
                width: 60%;
                padding-left: 40px
            }
            .hotel_info p {
                margin-top: 0;
            }
            .hotel_name {
                font-weight: bold;
            }
            .other_info table {
                width: 100%;
            }
            .other_info table tr td {
                border-top: 1px solid #d8d8d8;
                padding: 12px 0;
            }
            .other_info table tr td p:first-child {
                font-weight: bold;
            }
            .other_info table tr td p:last-child, .room_details table tr td:last-child {
                color: #4a4a4a;
            }
            .room_details table tr td:first-child {
                width: 40%;
                font-weight: bold;
            }
            .room_details table tr td {
                border-top: 1px solid #d8d8d8;
                padding: 20px 0;
            }
            .cancellation_p tr td {
                font-weight: normal !important;
            }
            .cancellation_p tr th {
                text-align: left;
                padding-bottom: 20px;
            }
        </style>
        <div>
            <div class="header">
                <div id="logo">
                    <div>TripBazaar</div>
                </div>
                <div class="right">
                    <p><strong>Booking ID:</strong> <span>${transaction._id}</span></p>
                    <p><strong>Booked on:</strong> ${parseDate(confirmed_at)} ${parseTime(confirmed_at)}</p>
                </div>
            </div>
            <div class="main">
                <h1> Booking Confirmed</h1>
                <p><strong>Dear ${guest.first_name} ${guest.last_name}</strong></p>
                <p>Thank you for choosing tripbazaar</p>
                <p>Your hotel booking is confirmed. Your
                    eTicket is attached with the email sent to you.</p>
                <div class="hotel_details">
                    <div class="hotel_img"><img
                            src="${imageDetails? imageDetails.prefix: ""}0${imageDetails?imageDetails.suffix:""}" alt="hotelImg"></div>
                    <div class="hotel_info">
                        <p class="hotel_name">${originalName}</p>
                        <p class="hotel_address">${location.address}<br>
                           ${location.city} ${location.postalCode}, ${location.country?location.country:location.countryCode || ""}</p>
                        ${phone ? `<p class="hotel_phone"><strong>Phone:</strong> ${phone}</p>` : ``}
                        ${email ? `<p class="hotel_email"><strong>Email:</strong> ${email}</p>` : ``}
                    </div>
                </div>
            </div>
            <div class="other_info">
                <table>
                    <tr>
                        <td>
                            <p>Guest Name</p>
                            <p>${guest.first_name} ${guest.last_name}</p>
                        </td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>
                            <p>Check In</p>
                            <p>${parseDate(hotelPackage.check_in_date)} ${checkInTime}</p>
                        </td>
                        <td>
                            <p>Check Out</p>
                            <p>${parseDate(hotelPackage.check_out_date)} ${checkOutTime}</p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p>Hotel Booking Id</p>
                            <p>${booking_id}</p>
                        </td>
                        <td>
                            <p>Total Amount</p>
                            <p>${rate_currency} ${Math.ceil(total_chargeable_amount)}</p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p>Room Type: ${hotelPackage.room_details.description}</p>
                            <p></p>
                        </td>
                        <td>
                            ${hotelPackage.room_details.non_refundable === false ? "Refundable":"Non Refundable"}
                        </td>
                    </tr>
                </table>
            </div>
            <div class="room_details">
                <h2>Room Details</h2>
                <table>
                    <tr>
                        <td>Number of Guests</td>
                        <td>Room - ${hotelPackage.room_count} : Adults - ${hotelPackage.adult_count}, Child - ${hotelPackage.child_count}</td>
                    </tr>
                    <tr>
                        <td>Inclusions</td>
                        <td>Accommodation${foodType[hotelPackage.room_details.food]}</td>
                    </tr>
        
                    <tr>
                        <td>Cancellation Policy</td>
                        <td>
                            <table class="cancellation_p" width="100%">
                                <tr>
                                    <th>Date From</th>
                                    <th>Date To</th>
                                    <th>Penalty %</th>
                                </tr>
                                
                                ${cancellationPolicy}
                            </table>
                            <small>${cancellation_policy.remarks}</small>
                        </td>
                    </tr>
                    <tr>
                        <td>Hotel Policy</td>
                        <td>${policy}</td>
                    </tr>
                    <tr>
                        <td colspan="2">***NOTE***: Any increase in the price due to taxes will be borne by you and
                            payable at the hotel.</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>`;

  // convert voucher to pdf
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage' // Fixes issue when chrome need more than 64mb of storage. This will write shared memory files into /tmp instead of /dev/shm
    ],
    headless: true
  });

  const page = await browser.newPage()
  await page.setContent(content)
  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      left: '0px',
      top: '40px',
      right: '0px',
      bottom: '40px'
    }
  })
  await browser.close();
  return buffer;
}

const generateFlightVoucher = async (transaction) => {
  // console.log(transaction);

  let data;
  if (transaction.order_doc_issue_response && transaction.order_doc_issue_response.Response.TicketDocInfos) {
    data = transaction.order_doc_issue_response.Response;
  } else {
    data = transaction.order_create_response.Response;
  }

  let passengerRef = [];
  if (!Array.isArray(data.DataLists.PassengerList.Passenger)) {
    passengerRef[0] = data.DataLists.PassengerList.Passenger;
  } else {
    passengerRef = data.DataLists.PassengerList.Passenger;
  }

  let orderItems = [];
  if (!Array.isArray(data.Order.OrderItems.OrderItem)) {
    orderItems[0] = data.Order.OrderItems.OrderItem;
  } else {
    orderItems = data.Order.OrderItems.OrderItem;
  }

  let totalBaseAmount = 0;
  let totalTaxes = 0;

  orderItems.forEach((el) => {
    totalBaseAmount += el.FareDetail.Price.BaseAmount.content;
    totalTaxes += el.FareDetail.Price.TotalAmount.DetailCurrencyPrice.Taxes.Total.content;
  });

  const totalAmount = data.Order.TotalOrderPrice.DetailCurrencyPrice.Total.content;


  const segmentList = data.DataLists.FlightSegmentList.FlightSegment;

  let flightSegmentList = [];

  if (Array.isArray(segmentList)) {
    // if segmentList is array of segments
    flightSegmentList = segmentList;
  } else {
    // if segmentList is single object
    flightSegmentList[0] = segmentList;
  }

  const flightSegments = [];

  flightSegmentList.forEach((flightSegment) => {

    const flightSegmentsObj = {
      airlineName: flightSegment.MarketingCarrier.Name,
      airlineId: flightSegment.MarketingCarrier.AirlineID,
      flightNo: flightSegment.MarketingCarrier.FlightNumber,
      duration: parseFlightDuration(flightSegment.FlightDetail.FlightDuration.Value),
      arrival: {
        airportCode: flightSegment.Arrival.AirportCode,
        airportName: flightSegment.Arrival.AirportName,
        date: flightSegment.Arrival.Date,
        time: flightSegment.Arrival.Time
      },
      departure: {
        airportCode: flightSegment.Departure.AirportCode,
        airportName: flightSegment.Departure.AirportName,
        date: flightSegment.Departure.Date,
        time: flightSegment.Departure.Time
      }
    }

    flightSegments.push(flightSegmentsObj);
  });

  const PNR = data.Order.BookingReferences.BookingReference[0].ID;

  let ticketDocInfo = [];
  if (!Array.isArray(data.TicketDocInfos.TicketDocInfo)) {
    ticketDocInfo[0] = data.TicketDocInfos.TicketDocInfo;
  } else {
    ticketDocInfo = data.TicketDocInfos.TicketDocInfo;
  }

  const bookingDate = ticketDocInfo[0].TicketDocument.DateOfIssue;

  const formatedBookingDate = moment(bookingDate).format('Do MMMM YYYY, dddd');

  const passengers = [];

  passengerRef.forEach((el) => {
    const ticketDoc = ticketDocInfo.filter((doc) => doc.PassengerReference === el.PassengerID)[0];
    const ticketDocNbr = ticketDoc.TicketDocument.TicketDocNbr;
    const passenger = {
      'firstName': el.Individual.GivenName,
      'lastName': el.Individual.Surname,
      'ticketDocNbr': ticketDocNbr,
    }
    passengers.push(passenger);
  });

  const base64Img = fs.readFileSync(path.join(__dirname,
    '../../public/logo.png'), 'base64');
  // console.log(base64Img);

  const dataObj = {
    'bookingId': transaction._id,
    'passengers': passengers,
    'baseAmount': totalBaseAmount,
    'totalTaxes': totalTaxes,
    'totalAmount': totalAmount,
    'PNR': PNR,
    'flightSegments': flightSegments,
    'logoUrl': `data:image/png;base64,${base64Img}`,
    'bookingDate': formatedBookingDate
  }

  const file = fs.readFileSync(path.join(__dirname, '../views/flightVoucher.hbs'), 'utf-8');

  const template = handlebars.compile(file);

  const html = template(dataObj);


  // convert voucher to pdf
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage' // Fixes issue when chrome need more than 64mb of storage. This will write shared memory files into /tmp instead of /dev/shm
    ],
    headless: true
  });

  const page = await browser.newPage()

  await page.setContent(html);

  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      left: '0px',
      top: '40px',
      right: '0px',
      bottom: '40px'
    }
  })
  await browser.close();
  return buffer;
}

module.exports = {
  generateVoucher,
  generateFlightVoucher
}