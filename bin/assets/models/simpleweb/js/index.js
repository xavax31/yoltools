/**
 */

class MainApp {

    constructor() {
        $("body").append(`<div class="text-center" >Hello !</div`)
    }

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


$(document).ready(() => {
    let app = new MainApp();
})