const common = require('../../../lib/index.js');
let fs = require('fs-extra');
var prompt = require('prompt');
let xml2js = require('xml2js');
const path = require("path");

class ReactHelper {

    constructor() {
        this.appDir = "";
    }

    createApp({appDir, appID, appName}) {
        console.log("cordova createApp", appDir, appID, appName);
        
        this.appDir = appDir;
        common.callBashLine(`npx create-react-app --template typescript ${this.appDir}`)

    }

}

exports.ReactHelper = ReactHelper;