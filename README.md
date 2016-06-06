⚠️ Use of this software is subject to important terms and conditions as set forth in the License file ⚠️

# UPS Shipping App

## Description:

Create shipping labels from the ticket sidebar

This app is intended to handle return shipments being sent back from end-users

## Outcome:

From the ticket sidebar, Agents are able to generate shipping labels for return shipments being sent back from customers.

## Workflow
 - Open a ticket
 - Make sure all user info is complete in the sidebar app
 - Select Package Size
 - Select Shipping Method
 - Click "Generate Shipping Label"

Screenshot: http://screencast.com/t/laWRzj8S

App will automatically pull customer's address from custom user-fields (or they can be manually entered). Once "Generate Shipping Label" is clicked, the customer's address will be the "From Address" and the business address will be the "To Address", and a shipping label will be generated using the UPS API and your UPS account credentials.

## Setup:

1) Create UPS Account and request access key
- Register at: https://www.ups.com/upsdeveloperkit
- Click Request an access key

2) Gather the following UPS info:
 - Username
 - Password
 - Access License Number
 - Shipper Number

3) Create a custom text ticket field for "UPS Tracking Number"
 - Save ticket field ID: http://screencast.com/t/CYt09QOQOZ5

4) Create custom text user fields for the following and save the "Field keys":
 - Address
 - City
 - State
 - Zip
 - Country

5) Install App
 - Settings > Apps > Manage > Upload App (Screenshot: http://screencast.com/t/nCYYYrFo)
 - App Name: UPS
 - App File: Upload https://github.com/zendesklabs/ups_shipping_app
 - Click "Upload"
 - Fill in information
 - Keep "Use UPS Production API?" unchecked until you're ready to make real shipment requests since charges may occur.

## Screenshot(s):
![screenshot-1](http://cl.ly/3J0W141b1v2s/Image%202016-06-06%20at%2011.18.00%20AM.png)
