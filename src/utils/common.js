const moment = require('moment-timezone');

const parseDate = (date) => {
  // convert timezone to IST and return date
  const d = moment.utc(date).tz('Asia/Kolkata');
  return d.format('ll');
}

const parseTime = (date) => {
  // convert timezone to IST and return time
  const d = moment.utc(date).tz('Asia/Kolkata');
  return d.format('LT');
}

const dateCompare = (d, start, end) => {
  // Checks if date in d is between dates in start and end.
  // Returns a boolean or NaN:
  //    true  : if d is between start and end (inclusive)
  //    false : if d is before start or after end
  //    NaN   : if one or more of the dates is illegal.
  // NOTE: The code inside isFinite does an assignment (=).
  return (
    isFinite(d = convert(d).valueOf()) &&
    isFinite(start = convert(start).valueOf()) &&
    isFinite(end = convert(end).valueOf()) ?
    start <= d && d <= end :
    NaN
  );
}

const convert = (d) => {
  // Converts the date in d to a date-object. The input can be:
  //   a date object: returned without modification
  //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
  //   a number     : Interpreted as number of milliseconds
  //                  since 1 Jan 1970 (a timestamp) 
  //   a string     : Any format supported by the javascript engine, like
  //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
  //  an object     : Interpreted as an object with year, month and date
  //                  attributes.  **NOTE** month is 0-11.
  return (
    d.constructor === Date ? d :
    d.constructor === Array ? new Date(d[0], d[1], d[2]) :
    d.constructor === Number ? new Date(d) :
    d.constructor === String ? new Date(d) :
    typeof d === "object" ? new Date(d.year, d.month, d.date) :
    NaN
  );
}

const getStatus = (index) => {
  const statusList = ["pending", "success", "cancelled", "payment_pending", "payment_success", "booking_failed", "payment_failed", "booking_hold"];

  return statusList[index];
}

const parseFlightDuration = (t) => {
  const hrs = t.replace('PT', '').replace(/H.*$/, '');
  const mins = t.replace('PT', '').replace(/^(.*H)/, '').replace(/M.*$/, '');
  // console.log(`${hrs}hrs ${mins}mins`);
  return `${hrs}hrs ${mins}mins`;
}

module.exports = {
  parseDate,
  parseTime,
  dateCompare,
  convert,
  parseFlightDuration,
  getStatus
}