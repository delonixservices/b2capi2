const puppeteer = require('puppeteer');
const {
  parseDate,
  parseTime
} = require('../utils/common');

const generateInvoice = async (transaction) => {

  const {
    package: hotelPackage,
    guest,
    // booking_id,
    confirmed_at,
  } = transaction.book_response.data;

  const {
    originalName,
    // location
  } = transaction.hotel;

  const {
    base_amount_discount_excluded,
    coupon_discount,
    client_discount,
    service_charges,
    processing_fee,
    gst,
    total_chargeable_amount,
    currency
  } = transaction.pricing;

  const rate_currency = currency === "INR" ? '&#8377' : currency;

  const content = `
	<style>
	.invoice-box {
		max-width: 800px;
		margin: auto;
		padding: 30px;
		font-size: 16px;
		line-height: 24px;
		font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
		color: #333;
	}
	.invoice-box table {
		width: 100%;
		line-height: inherit;
		text-align: left;
	}
	.invoice-box table td {
		padding: 5px;
		vertical-align: top;
	}
	.invoice-box table tr td:nth-child(2) {
		text-align: right;
	}
	.invoice-box table tr.top table td {
		padding-bottom: 20px;
	}
	.invoice-box table tr.top table td.title {
		font-size: 30px;
		line-height: 45px;
		font-weight:bold;
		color: #de3c31;
	}
	.invoice-box table tr.information table td {
		padding-bottom: 40px;
	}
	.invoice-box table tr.hoteldetails table td:nth-child(2) {
		text-align: left;
	}

	.invoice-box table tr.hoteldetails table {
		padding-bottom: 40px;
	}
	.invoice-box table tr.heading td {
		background: #eee;
		border-bottom: 1px solid #ddd;
		font-weight: bold;
	}
	.invoice-box table tr.details td {
		padding-bottom: 20px;
	}

	.invoice-box table tr.item td{
		border-bottom: 1px solid #eee;
	}
	.invoice-box table tr.item.last td {
		border-bottom: none;
	}
	.invoice-box table tr.total td:nth-child(2) {
		border-top: 2px solid #eee;
		font-weight: bold;
	}
	.rtl {
		direction: rtl;
		font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
	}
	.rtl table {
		text-align: right;
	}
	.rtl table tr td:nth-child(2) {
		text-align: left;
	}
	.footer {
		margin-top: 40px;
	}
	</style>

	<div class="invoice-box">
		<table cellpadding="0" cellspacing="0">
			<tr class="top">
				<td colspan="2">
					<table>
						<tr>
							<td class="title">
								TripBazaar
							</td>

							<td>
								Booking ID: ${transaction._id} <br>
								Confirmed: ${parseDate(confirmed_at)} ${parseTime(confirmed_at)}
							</td>
						</tr>
					</table>
				</td>
			</tr>

			<tr class="information">
				<td colspan="2">
					<table>
						<tr>
						<td>
							${guest.first_name} ${guest.last_name}<br>
							${guest.contact_no}<br>
							${guest.email}
						</td>
						</tr>
					</table>
				</td>
			</tr>
			
			<tr class="hoteldetails">
				<td colspan="2">
					<table>
						<tr>
							<td>Hotel Name:</td>
							<td>${originalName}</td> 
						</tr>
						<tr>
							<td>CHECK-IN:</td>
							<td>${parseDate(hotelPackage.check_in_date)}</td> 
						</tr>
						<tr>
							<td>CHECK-OUT:</td>
							<td>${parseDate(hotelPackage.check_out_date)}</td> 
						</tr>
						<tr>
							<td>No. of Rooms:</td>
							<td>${hotelPackage.room_count}</td> 
						</tr>
						<tr>
							<td>Room Type:</td>
							<td>${hotelPackage.room_details.description}</td> 
						</tr>
						<tr>
							<td>Payment Method</td>
							<td>${transaction.payment_response.payment_mode}</td>
						</tr>
					</table>
				</td>
			</tr>
			<tr>
			<td></td>
			<td></td>
			</tr>
			<tr class="heading">
				<td>Description</td>

				<td>Amount</td>
			</tr>

			<tr class="item">
				<td>
				Base Amount 
				</td>
				<td>
				${rate_currency} ${Math.ceil(base_amount_discount_excluded)}
				</td>
			</tr>

			<tr class="item">
				<td>
				Discount
				</td>
				<td>
				- ${rate_currency} ${-Math.ceil(client_discount)}
				</td>
			</tr>

			<tr class="item">
				<td>
				Coupon Amount
				</td>
				<td>
				- ${rate_currency} ${Math.ceil(coupon_discount)}
				</td>
			</tr>

			<tr class="item">
				<td>
				Service Charges
				</td>
				<td>
				+ ${rate_currency} ${Math.ceil(service_charges)}
				</td>
			</tr>

			<tr class="item">
				<td>
				Processing Fee
				</td>
				<td>
				+ ${rate_currency} ${Math.ceil(processing_fee) || 0}
				</td>
			</tr>

			<tr class="item last">
				<td>
			GST @ 18%(including HR-SGST & CGST) 
				</td>
				<td>
				+ ${rate_currency} ${Math.ceil(gst) || 0}
				</td>
			</tr>

			<tr class="total">
				<td>GRAND TOTAL </td>
				<td>
				${rate_currency} ${Math.ceil(total_chargeable_amount)}
				</td>
			</tr>
		</table>
		<div class="footer">
			<p>Total has been rounded off to next rupee value</p>
			<p> TripBazaar</p>
			Registered Office: Dehradun 248001
		<div>
	</div>`;

  // Conver invoice to pdf
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  })
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

module.exports = {
  generateInvoice
};