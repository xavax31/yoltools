/**
 */

var appTest = {
    onDeviceReady: function() {
        if (navigator.userAgent.includes("Cofondateur")) {
            $button = $('<button type="button" class="btn btn-primary">Send</button>');
            $button.on("click", ()=>{
                this.sendToServer();
            })
            $("body").append($button)
        }
    },

    sendToServer() {
        var formData = new FormData();
        formData.append('message', "hello");

        $.ajax({
            url: "server_api.php", 
            type: "POST", 
            cache: false,
            contentType: false,
            processData: false,
            data: formData
        })
        .done(function(e){
            alert('done! ' + e);
        });
    }
};


/* include cordova & plugins js files */
if (navigator.userAgent.includes("Cofondateur")) {
    var head = document.getElementsByTagName('head')[0];
    var js = document.createElement("script");
    js.type = "text/javascript";
    if (navigator.userAgent.includes("ios")) {
        js.src = "cordova/ios/cordova.js";
    }
    else if (navigator.userAgent.includes("android")) {
        js.src = "cordova/android/cordova.js";
    }
    head.appendChild(js);
}


$(document).ready(() => {
    document.addEventListener('deviceready', ()=>{
        appTest.onDeviceReady();
    }, false);
})