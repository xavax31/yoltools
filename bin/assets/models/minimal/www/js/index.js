/*
 */
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {

        // location.href = "https://192.168.1.80:8080";

        setTimeout(function() {
            navigator.splashscreen.hide();
        }, 3000);

    },

};

app.initialize();
