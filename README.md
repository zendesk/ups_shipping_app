ups_shipping_app
==============

Create shipping labels from the ticket sidebar


***Things you need from UPS:
1. Username
2. Password
3. AccessLicenseNumber
4. ShipperNumber

Sign up at https://www.ups.com/one-to-one/register to obtain these.

***In-Zendesk Setup
Install the app and fill out all of the required fields in the app settings pane. Leave the "Use UPS Production API?" checkbox unchecked until you have tested your settings successfully. Checking this box will turn on UPS's production API and may result in your account incurring charges for shipping requests made.

After all settings are filled out, navigate to the a ticket view to see the app, make sure all user information is complete in the sidebar app, select a shipping method and package size, and click the 'Generate label' button.

This app is intended to handle return shipments being sent back from end-users