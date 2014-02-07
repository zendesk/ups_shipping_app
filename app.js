(function() {
  return {
    sizes: {
      'small': {
        'height': '3',
        'weight': '5',
        'width': '5',
        'length': '5'
      },
      'medium': {
        'height': '6',
        'weight': '7',
        'width': '7',
        'length': '7'
      },
      'large': {
        'height': '12',
        'weight': '14',
        'width': '14',
        'length': '14'
      }
    },
    requesterId: null,
    requesterAddress: null,
    requesterCity: null,
    requesterState: null,
    requesterZip: null,
    requesterCountry: null,
    editableForm: null,
    userObj: null,
    userNewParams: null,
    confirmed: true,
    requests: {
      fetchUserFromZendesk: function () {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', this.requesterId)
        };
      },
      requestShipping: function (envelope) {
        return {
          url: 'https://wwwcie.ups.com/webservices/Ship',
          type: 'POST',
          dataType: 'xml',
          data: envelope,
          contentType: 'text/xml; charset=ansi'
        };
      },
      updateTicketComment: function (comment) {
        return {
          url: helpers.fmt('/api/v2/tickets/%@.json', this.ticket().id()),
          type: 'PUT',
          contentType: 'application/json',
          data: helpers.fmt('{"ticket": {"comment": {"public":false, "body": "%@" }}}', comment )
        };
      },
      updateUser: function () {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', this.requesterId),
          type: 'PUT',
          contentType: 'application/json',
          data: helpers.fmt( '{ "user": { "user_fields": %@ }}', JSON.stringify(this.userNewParams) )
        };
    },
    updateNameOnly: function (name) {
      console.log("trying");
      return {
        url: helpers.fmt('/api/v2/users/%@.json', this.requesterId),
        type: 'PUT',
        contentType: 'application/json',
        data: helpers.fmt('{ "user": { "name": "%@" }}', name )
      };
    }
    },
    events: {
      'app.activated':'onAppActivated',
      'change #package_size': 'onSizeChanged',
      'change .user-info': 'onUserUpdated',
      'click button.initialize': 'showForm',
      'click .update-decline': function(){ this.$('.update-confirm').fadeOut(); this.userNewParams = null; this.onFormSubmitted(); },
      'click .update-user': function(){ this.ajax('updateUser'); this.$('#update-confirm').fadeOut(); this.userNewParams = null; this.onFormSubmitted(); },
      'click button.create': 'onFormSubmitted',
      'fetchUserFromZendesk.done': 'onUserFetched',
      'requestShipping.done': 'onRequestShippingDone'
    },

    onAppActivated: function(app) {
      if (this.setting('editable_form') === true) {
        this.editableForm = true;
      }
      
      this.requesterId = this.ticket().requester().id();
      this.setUpSizes();
      this.showForm();
    },
    setUpSizes: function(){
      this.sizes = {
        'small': {
          'height': this.setting('small_size_height'),
          'weight': this.setting('small_size_weight'),
          'width': this.setting('small_size_width'),
          'length': this.setting('small_size_length')
        },
        'medium': {
          'height': this.setting('medium_size_height'),
          'weight': this.setting('medium_size_weight'),
          'width': this.setting('medium_size_width'),
          'length': this.setting('medium_size_length')
        },
        'large': {
          'height': this.setting('large_size_height'),
          'weight': this.setting('large_size_weight'),
          'width': this.setting('large_size_width'),
          'length': this.setting('large_size_length')
        }
      };
    },
    showForm: function() {
      //console.log("show?", this.editableForm, this.setting('editable_form'));
      this.switchTo('form', {"hide": this.editableForm});
      this.ajax('fetchUserFromZendesk');
      this.setUpShipToForm();
    },
    setUpShipToForm: function() {
      this.$('input[name=shipto_name]').val(this.setting("company_name"));
      this.$('input[name=shipto_address]').val(this.setting("business_address"));
      this.$('input[name=shipto_city]').val(this.setting("city"));
      this.$('input[name=shipto_state]').val(this.setting("state"));
      this.$('input[name=shipto_zip_code]').val(this.setting("zip_code"));
      this.$('input[name=shipto_country]').val(this.setting("country_code"));
    },
    showUpdateUserOption: function() {
      this.$('.update-confirm').fadeIn();
    },
    onRequestShippingDone: function(data) {
      console.log("-------------->", data);

      var xmlResponse = data.documentElement;
      if ( xmlResponse.getElementsByTagName('PrimaryErrorCode').length > 0 ) {
        var error = xmlResponse.getElementsByTagName('Description')[0].childNodes[0].nodeValue;
        services.notify("Shipping error: "+ error + ". Please check your information and try again", "error");
        console.log("error:", error);
      } else if ( xmlResponse.getElementsByTagName('GraphicImage').length > 0 ){
          var imageData = xmlResponse.getElementsByTagName('GraphicImage')[0].childNodes[0].nodeValue,
          comment = "![label_image](data:image;base64," + imageData.replace(' ', '') + ")",
          tracking_number = xmlResponse.getElementsByTagName('TrackingNumber')[0].childNodes[0].nodeValue;
          //this.comment().text(comment);
          if ( this.setting('tracking_field') ) {
            this.ticket().customField("custom_field_" + this.setting('tracking_field'), tracking_number );
          }
          this.ajax('updateTicketComment', comment);
          services.notify('Label has been sent to customer and attached to this ticket. Refresh to see updates to this ticket.');
          this.switchTo('button');
      } else if ( xmlResponse.getElementsByTagName('TrackingNumber').length > 0 ) {
      //if ( xmlResponse.getElementsByTagName('Alert').length > 0 ) {
        var lookup = xmlResponse.getElementsByTagName('TrackingNumber')[0].childNodes[0].nodeValue;
        services.notify('Your shipment needs additional preparation. TrackingNumber: ',  lookup);
      }

    },
    onUserFetched: function(data) {
      this.userObj = data.user;
      var user = this.userObj;
      this.$('input[name=name]').val(user.name);
      this.$('input[name=email]').val(user.email);
      if (user.user_fields) {
        this.$('input[name=address]').val(user.user_fields[this.fmtd(this.setting('user_address_field'))]);
        this.$('input[name=city]').val(user.user_fields[this.fmtd(this.setting('user_city_field'))]);
        this.$('input[name=state]').val(user.user_fields[this.fmtd(this.setting('user_state_field'))]);
        this.$('input[name=country]').val(user.user_fields[this.fmtd(this.setting('user_country_field'))]);
        this.$('input[name=zip_code]').val(user.user_fields[this.fmtd(this.setting('user_zip_field'))]);
      }
    },
    onSizeChanged: function(event) {
      var sizeSelected = this.$(event.target).val();
      if (sizeSelected == 'custom') {
        this.$('.dimensions').show();
      } else {
        this.$('.dimensions').hide();
        this.$('input[name="weight"], input[name="height"], input[name="width"], input[name="length"]').val('');
      }
    },

    onRequesterChanged: function() {
      if (this.ticket().requester() &&
          this.ticket().requester().id()) {
        this.currentUserId = this.ticket().requester().id();
        this.ajax('fetchUserFromZendesk');
      }
    },

    onFormSubmitted: function(e) {
      if (e) { e.preventDefault(); }
      if (this.userNewParams) {
        this.showUpdateUserOption();
        this.confirmed = false;
        return false;
      }
      var params = {};
          params.name = this.$('input[name=name]').val();
          params.address = this.$('input[name=address]').val();
          params.city = this.$('input[name=city]').val();
          params.country = this.$('input[name=country]').val();
          params.state = this.$('input[name=state]').val();
          params.zip = this.$('input[name=zip_code]').val();
          params.email = this.$('input[name=email]').val();
          params.shipto_name = this.$('input[name=shipto_name]').val() || this.setting('company_name');
          params.shipto_address = this.$('input[name=shipto_address]').val() || this.setting('business_address');
          params.shipto_city = this.$('input[name=shipto_city]').val() || this.setting('city');
          params.shipto_state = this.$('input[name=shipto_state]').val() || this.setting('state');
          params.shipto_country = this.$('input[name=shipto_country]').val() || this.setting('country_code');
          params.shipto_zip_code = this.$('input[name=shipto_zip_code]').val() || this.setting('zip_code');
          params.ship_type = this.$('#ship_type').val();

      params.size = this.sizes[this.$('select#package_size').val()];

      for (var key in params) {
        if (!params[key]) {
          services.notify('Please fill in the field for "' + key + '" before continuing.');
          return false;
        }
      }
      params.intl = params.ship_type === "12";
      //console.log(params);

        this.ajax('requestShipping',
          this.renderTemplate('envelope', {
          params: params
        }));

    },
    onUserUpdated: function(e) {
       var self = this,
          newVal = this.$(e.target).val();
      if (!this.userNewParams) { this.userNewParams = {}; }
      switch( this.$(e.target).attr('name')) {
        case 'name':
          this.ajax('updateNameOnly', newVal );
          break;
        case 'address':
          self.userNewParams[self.fmtd(self.setting('user_address_field'))] = newVal;
          break;
        case 'city':
          self.userNewParams[self.fmtd(self.setting('user_city_field'))] = newVal;
          break;
        case 'state':
          self.userNewParams[self.fmtd(self.setting('user_state_field'))] = newVal;
          break;
        case  'country':
          self.userNewParams[self.fmtd(self.setting('user_country_field'))] = newVal;
          break;
        case 'zip_code':
          self.userNewParams[self.fmtd(self.setting('user_zip_field'))] = newVal;
          break;
      }
      console.log('user params: ', this.userNewParams);
    },

    fmtd: function(str) {
      return str.toLowerCase().replace(' ', '_');
    }
  };

}());
