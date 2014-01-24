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
          data: '{"ticket": {"comment": {"public":false, "body": "'+comment+'"}}}'
        };
      },
      updateUser: function (params) {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', this.ticket().requester().id()),
          type: 'PUT',
          contentType: 'application/json',
          data: '{ "user": { ' + params + ' }}'
        };
    }
    },
    events: {
      'app.activated':'onAppActivated',
      'change #package_size': 'onSizeChanged',
      // 'change .user-info': function(){ this.userUpdated = true; },
      // 'click button.initialize': 'showForm',
      'click button.create': 'onFormSubmitted',
      'fetchUserFromZendesk.done': 'onUserFetched',
      'requestShipping.done': 'onRequestShippingDone'
    },

    onAppActivated: function(app) {
      // this.switchTo('button');
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
      console.log("show?", this.editableForm, this.setting('editable_form'));
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
      this.$('#uu_modal').modal(options);
    },
    onRequestShippingDone: function(data) {
      console.log("-------------->", data);

      var xmlResponse = data.documentElement;
      if ( xmlResponse.getElementsByTagName('PrimaryErrorCode').length > 0 ) {
        var error = xmlResponse.getElementsByTagName('Description')[0].childNodes[0].nodeValue;
        services.notify("Shipping error: "+ error + ". Please check your information and try again", "error");
      } else {
          var imageData = xmlResponse.getElementsByTagName('GraphicImage')[0].childNodes[0].nodeValue,
          comment = "![label_image](data:image;base64," + imageData.replace(' ', '') + ")",
          tracking_number = xmlResponse.getElementsByTagName('TrackingNumber')[0].childNodes[0].nodeValue;
          //this.comment().text(comment);
          if ( this.setting('tracking_field') ) {
            this.ticket().customField("custom_field_" + this.setting('tracking_field'), tracking_number );
          };
          this.ajax('updateTicketComment', comment);
          services.notify('Label has been sent to customer and attached to this ticket. Refresh to see updates to this ticket.');
          this.switchTo('button');
      }

    },
    onUserFetched: function(data) {
      this.userObj = data.user;
      var user = this.userObj;
      this.$('input[name=name]').val(user.name);
      this.$('input[name=email]').val(user.email);
      if (user.user_fields) {
        this.$('input[name=address]').val(user.user_fields[this.setting('user_address_field').toLowerCase().replace(' ', '_')]);
        this.$('input[name=city]').val(user.user_fields[this.setting('user_city_field').toLowerCase().replace(' ', '_')]);
        this.$('input[name=state]').val(user.user_fields[this.setting('user_state_field').toLowerCase().replace(' ', '_')]);
        this.$('input[name=country]').val(user.user_fields[this.setting('user_country_field').toLowerCase().replace(' ', '_')]);
        this.$('input[name=zip_code]').val(user.user_fields[this.setting('user_zip_field').toLowerCase().replace(' ', '_')]);
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
      console.log('params', params);
      // console.log("address field ", this.$('input[name=address'));
      // console.log("params", params);
      for (var key in params) {
        if (!params[key]) {
          services.notify('Please fill in the field for "' + key + '" before continuing.');
          return false;
        }
      }

      this.ajax('requestShipping',
                this.renderTemplate('envelope', {
                  params: params
                }));
      // if (!_.isEmpty(email)) { params.EmailAddress = email; }
      // if (!_.isEmpty(btmNumber)) { params.BTNumber = btmNumber; }
    }
  };

}());
