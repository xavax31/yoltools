var myLibrary = require('./index.js');

class CordovaHelper {
    addPlugin(pluginID) {
        myLibrary.say("hello")
    }
}

exports.CordovaHelper = new CordovaHelper();