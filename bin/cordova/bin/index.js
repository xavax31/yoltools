const common = require('../../../lib/index.js');
let fs = require('fs-extra');
var prompt = require('prompt');
let xml2js = require('xml2js');
const path = require("path");

class CordovaHelper {

    constructor() {
        this.appDir = "";
    }

    createApp({appDir, appID, appName}) {
        console.log("cordova createApp", appDir, appID, appName);
        
        this.appDir = appDir;
        common.callBash("cordova", ["create", appDir, appID, appName]);

    }


    addPlatform(platformID) {
        common.callBash("cordova", ["platform", "add", platformID], {cwd: this.appDir});
    }
    
    
    addPlugin(pluginID) {
        common.callBash("cordova", ["plugin", "add", pluginID], {cwd: this.appDir});
    }


    async setPreference({platform, name, value}) {
        let configObj = await this.getConfigXMLToJSON();
        let platformObj = this.getPlatformObj(platform, configObj);
        platformObj.preference = platformObj.preference || [];
        let preferenceObj = null;
    
        for (let i = 0; i < platformObj.preference.length; i++) {
            if (platformObj.preference[i]["$"].name == name) {
                preferenceObj = platformObj.preference[i];
                break;
            }
        }
    
        if (!preferenceObj) {
            preferenceObj = {
                "$": {name, value}
            }
            platformObj.preference.push(preferenceObj);
        }
        else {
            preferenceObj["$"].value = value;
        }
    
        this.saveConfigJSONToXML(configObj);
    }


    async setAllowIntent({href}) {
        let configObj = await this.getConfigXMLToJSON();
        let configArr = configObj.widget['allow-intent'] = configObj.widget['allow-intent'] || [];
        let paramObj = null;
    
        for (let i = 0; i < configArr.length; i++) {
            if (configArr[i]["$"].href == href) {
                paramObj = configArr[i];
                break;
            }
        }
    
        if (!paramObj) {
            paramObj = {
                "$": {href}
            }
            configArr.push(paramObj);
        }
        else {
            paramObj["$"].href = href;
        }
        this.saveConfigJSONToXML(configObj);
    }
    
    
    async setAllowNavigation({href}) {
        let configObj = await this.getConfigXMLToJSON();
        let configArr = configObj.widget['allow-navigation'] = configObj.widget['allow-navigation'] || [];
        let paramObj = null;
    
        for (let i = 0; i < configArr.length; i++) {
            if (configArr[i]["$"].href == href) {
                paramObj = configArr[i];
                break;
            }
        }
    
        if (!paramObj) {
            paramObj = {
                "$": {href}
            }
            configArr.push(paramObj);
        }
        else {
            paramObj["$"].href = href;
        }
        this.saveConfigJSONToXML(configObj);
    }
    
    
    async setEditConfigIOS({name, value, mode="merge"}) {
        let configObj = await this.getConfigXMLToJSON();
        let platformObj = this.getPlatformObj("ios", configObj);
        let configArr = platformObj["edit-config"] = platformObj["edit-config"] || [];
        
        let paramObj = null;
    
        for (let i = 0; i < configArr.length; i++) {
            if (configArr[i]["$"].target == name) {
                paramObj = configArr[i];
                break;
            }
        }
        if (!paramObj) {
            paramObj = {
                "$": {file: "*-Info.plist", mode, target: name},
                string: value
            }
            configArr.push(paramObj);
            // console.log(paramObj)
            // console.log(configArr)
    
        }
        else {
            paramObj["string"] = value;
        }
        this.saveConfigJSONToXML(configObj);
    }
    
    
    async setEditConfigApplicationAttributeAndroid({name, value}) {
        let configObj = await this.getConfigXMLToJSON();
        let platformObj = this.getPlatformObj("android", configObj);
        let configArr = platformObj["edit-config"] = platformObj["edit-config"] || [];
    
        let existingElement;
        for (let i = 0; i < configArr.length; i++) {
            const element = configArr[i];
            
            if (element.application && element.application[0] && element.application[0]["$"]["android:" + name] != undefined) {
                existingElement = element;
                break;
            }
        }
    
        if (!existingElement) {
            existingElement = {
                '$': {
                    'xmlns:android': 'http://schemas.android.com/apk/res/android',
                    file: 'app/src/main/AndroidManifest.xml',
                    mode: 'merge',
                    target: '/manifest/application'
                },
                application: [ {
                    '$': {
                    }
                } ]
            }
            configArr.push(existingElement);
        }
    
        existingElement["application"][0]["$"][`android:${name}`] =  `${value}`;
        this.saveConfigJSONToXML(configObj);
    }
    
    
    async setFeature({platform, name, paramName, paramValue}) {
        let configObj = await this.getConfigXMLToJSON();
        let platformObj = this.getPlatformObj(platform, configObj);
        let configArr = platformObj["feature"] = platformObj["feature"] || [];
        
        let paramObj = null;
    
        for (let i = 0; i < configArr.length; i++) {
            if (configArr[i]["$"].name == name) {
                paramObj = configArr[i];
                break;
            }
        }
        if (!paramObj) {
            paramObj = {
                "$": {name},
                param: {
                    "$": {name:paramName, paramValue}
                }
            }
            configArr.push(paramObj);
        }
        else {
            paramObj["param"] = {
                "$": {name:paramName, value: paramValue}
            };
        }
        this.saveConfigJSONToXML(configObj);
    }

    async setIcon({platform, src, density}) {
        console.log("setIcon", src);
        
        let configObj = await this.getConfigXMLToJSON();
        let platformObj = this.getPlatformObj(platform, configObj);
        platformObj.icon = platformObj.icon || [];
        let iconObj = null;
    
        for (let i = 0; i < platformObj.icon.length; i++) {
            if (platformObj.icon[i]["$"].src == src) {
                iconObj = platformObj.icon[i];
                break;
            }
        }
    
        if (!iconObj) {
            iconObj = {
                "$": {src, density}
            }
            platformObj.icon.push(iconObj);
        }
        else {
            iconObj["$"].density = density;
        }
        this.saveConfigJSONToXML(configObj);
    
    }


    async createIconAndSplash() {
        common.callBash("cp", ["sources/assets/icon.png", path.normalize(this.appDir+"/icon.png")]);
        common.callBash("cp", ["sources/assets/splash.png", path.normalize(this.appDir+"/splash.png")]);
        common.callBash("cordova-icon", [], {cwd: this.appDir});
        common.callBash("cordova-splash", [], {cwd: this.appDir});
    
    
        // now needed for android
        common.copyDir(this.appDir + "/platforms/android/app/src/main/res", this.appDir + "/res");
        await this.setPreference({platform: "android", name: "SplashMaintainAspectRatio", value: true});
        
        
        await this.setIcon({platform:"android", src: "res/mipmap-ldpi/icon.png", density:"ldpi"})
        console.log("seticonmdpi");
        await this.setIcon({platform:"android", src: "res/mipmap-mdpi/icon.png", density:"mdpi"})
        console.log("seticonhdpi");
        await this.setIcon({platform:"android", src: "res/mipmap-hdpi/icon.png", density:"hdpi"})
        console.log("seticonxhdpi");
        await this.setIcon({platform:"android", src: "res/mipmap-xhdpi/icon.png", density:"xhdpi"})
        console.log("seticonxxhdpi");
        await this.setIcon({platform:"android", src: "res/mipmap-xxhdpi/icon.png", density:"xxhdpi"})
        console.log("seticonxxxhdpi");
        await this.setIcon({platform:"android", src: "res/mipmap-xxxhdpi/icon.png", density:"xxxhdpi"})
    }

    

async incVersion() {
    let configObj = await this.getConfigXMLToJSON();

    return new Promise(resolve=>{

        let currentVersion = configObj.widget["$"].version;
    
        var schema = {
            properties: {
              version: {
                description: `Version number (current: ${currentVersion}) type same, major, minor or patch`,
                default: 'same', 
                pattern: /^(same|major|minor|patch)$/,
                message: 'type same, major, minor or patch',
                required: true
              }
            }
        };

        prompt.start();

        prompt.get(schema,  (err, result) => {
            // console.log('Command-line input received:', result);
            let matches = currentVersion.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/);
            
            switch (result.version) {
                case "major":
                    matches[1] = Number(matches[1]) + 1; 
                    break;
                case "minor":
                    matches[2] = Number(matches[2]) + 1; 
                    break;
                case "patch":
                    matches[3] = Number(matches[3]) + 1; 
                    break;
            
                default:
                    break;
            }
    
            let newVersion = `${matches[1]}.${matches[2]}.${matches[3]}`;
            console.log(newVersion);
            configObj.widget["$"].version = newVersion;
    
            this.saveConfigJSONToXML(configObj)
            resolve(newVersion);
        });
    })
}


    getConfigXMLToJSON() {
        return new Promise((resolve, reject)=>{
            var parser = new xml2js.Parser();
    
            fs.readFile(this.appDir + "/config.xml", function(err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    parser.parseString(data, function (err, result) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(result);
                        }
                    });
                }
    
            });
        })
    
     }



    saveConfigJSONToXML(json) {
        var builder = new xml2js.Builder({renderOpts: { 'pretty': true, 'indent': '    ', 'newline': '\n' }});
        var xml = builder.buildObject(json);
        fs.writeFileSync(this.appDir + "/config.xml", xml)
    }


     getPlatformObj(platformID, xmlJson) {
        let platformsArr = xmlJson.widget.platform;
    
        for (let i = 0; i < platformsArr.length; i++) {
            if (platformsArr[i]["$"].name == platformID) {
                return platformsArr[i];
            }
        }
    }
    
    
}

exports.CordovaHelper = CordovaHelper;