/*
 */
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {

        // location.href = "https://www.dev.mugconnect.com/test-cordova";

        setTimeout(function() {
            navigator.splashscreen.hide();
        }, 3000);

    },

};

app.initialize();
