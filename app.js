(function() {
  return {
    sizes: {
      'small': {
        'height': '3',
        'weight': '5',
        'width': '5'
      },
      'medium': {
        'height': '6',
        'weight': '7',
        'width': '7'
      },
      'large': {
        'height': '12',
        'weight': '14',
        'width': '14'
      }
    },
    currentUserId: null,
    requests: {

      requestShipping: function (envelope) {
        return {
          url: 'https://wwwcie.ups.com/webservices/Ship',
          type: 'POST',
          dataType: 'xml',
          data: envelope,
          contentType: 'text/xml; charset=ansi'
        };
      }
    },
    events: {
      'app.activated':'onAppActivated',
      'requestShipping.done': 'onRequestShippingDone',

      'click button': 'onFormSubmitted',
      'change #package_size': 'onSizeChanged',
      'click a.back': 'onBackLinkClicked',
      'click a.contact': 'onContactClicked',
      'click .nav-tabs a': 'onNavTabClicked',
      'click a.link-record': 'onLinkRecordClicked'
    },

    onAppActivated: function(app) {
      this.switchTo('form');

      this.ajax('requestShipping',
                this.renderTemplate('envelope', {
                  params: JSON.stringify(params)
                }));
    },
    onRequestShippingDone: function(data) {
      console.log("-------------->", data);

      var xmlResponse = data.documentElement;
      if ( xmlResponse.getElementsByTagName('PrimaryErrorCode').length > 0 ) {
        var error = xmlResponse.getElementsByTagName('Description')[0].childNodes[0].nodeValue;
        services.notify("Shipping error: "+ error + ". Please check your information and try again", "error");
      } else {
          var imageData = xmlResponse.getElementsByTagName('GraphicImage')[0].childNodes[0].nodeValue,
          comment = "![label_image](data:image;base64," + imageData.replace(' ', '') + ")";
          this.comment().text(comment);
      }

    },
    onSizeChanged: function(event) {
      var sizeSelected = this.$(event.target).val();
      if (sizeSelected == 'custom') {
        this.$('.dimensions').show();
      } else {
        this.$('.dimensions').hide();
        this.$('input[name="weight"], input[name="height"], input[name="width"]').val('');
      }
    },

    onRequesterChanged: function() {
      if (this.ticket().requester() &&
          this.ticket().requester().id()) {
        this.currentUserId = this.ticket().requester().id();
        this.ajax('fetchUserFromZendesk');
      }
    },



    onNavTabClicked: function(event) {
      var target = this.$(event.target);

      target
        .parents('ul')
        .find('li')
        .removeClass('active');

      target
        .parents('li')
        .addClass('active');

      this.$('.tab-pane').hide();

      this.$(helpers.fmt('.tab-pane%@', target.data('toggle'))).show();
    },

    onBackLinkClicked: function(e) {
      this.switchTo('contacts', this.lastResults);
    },

    onFormSubmitted: function(e) {
      if (e) { e.preventDefault(); }

      var params = {},
          name = this.$('input[name=name]').val(),
          address = this.$('input[name=address').val(),
          city = this.$('input[name=city').val(),
          country = this.$('input[name=country').val(),
          state = this.$('input[name=state]').val(),
          email = this.$('input[name=email]').val();

      var size = this.sizes[this.$('select#package_size').val()];
      console.log("size", size);

      // if (!_.isEmpty(email)) { params.EmailAddress = email; }
      // if (!_.isEmpty(btmNumber)) { params.BTNumber = btmNumber; }

     // this.searchLta(params);
    },


    getJSONfromSOAPenvelope: function(soap) {
      var json = null;

      try {
        json = JSON.parse(this.$(soap).find('Contact_spcMatch_spcOutput').text());
        json = this.prettifyJSON(json);
      } catch(e) {}

      return json;
    },

    prettifyJSON: function(json) {
      var contacts = json["ListOfLTA Zendesk Contact External IO"].Contact;

      // Work only with an array, even for single result
      if (!_.isArray(contacts)) {
        contacts = [ contacts ];
      }

      _.each(contacts, function(contact) {
        // Compact the address to ease the display in the view
        contact.prettyAddress = _.compact([
          contact["Primary Address Street Address"],
          contact["Primary Address Street Address 2"],
          contact["Primary Address Street Address 3"],
          contact["Primary Address Street Address 4"],
          contact["Primary Address City"],
          contact["Primary Address Postcode"],
          contact["Primary Address County"],
          contact["Primary Address Country"]
        ]).join(', ');
      });

      return { contacts: contacts };
    }
  };
//   var params = {
//   "customer_name": "",
//   "shipto_address": "",
//   "shipto_city": "",
//   "shipto_state": "",
//   "shipto_zip": "",
//   "shipto_country": "",
//   "description": "",
//   "shipto_email": "",
//   "size": {
//     "weight": "",
//     "height": "",
//     "width": ""
//   }
// }

}());
