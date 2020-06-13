#!/usr/bin/env node

'use strict';

var myLibrary = require('../lib/index.js');
let fs = require('fs-extra');
var prompt = require('prompt');
let xml2js = require('xml2js');
const path = require("path");
var passwordGenerator = require('generate-password');

let cwd = "app-mobile";
let yolConfigPathSource = path.normalize(__dirname + "/assets/yolconfig.json");
let yolConfigPathDest = path.normalize("etc/yolconfig.json");
let mainPackageJSON = path.normalize("package.json");

const [,, ...args] = process.argv;  

if (args.length === 0) {
    help();
}
else {
    eval(args[0])();
}


function help() {
    console.log(`
    Launch first 'yoltools create' to copy config files to project (etc/yoptools.json).
    Adapt these config files with correct values then launch twice 'yoltools create' to continue the project creation.
    `);
}

async function testPromise(value) {
    setTimeout(() => {

        if (value) {
            return value;
        }
        else {
            return value;
        }
    }, 1000);
}

 function resolveAfter2Seconds(value) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
          if (value) {
            console.log('resolved')

            resolve(value);

          }
          else {
            console.log('reject')

            reject(value);

          }
      }, 2000);
    });
  }
  

  function rejectAfter2Seconds() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
          console.log('reject')
        reject('reject');
      }, 2000);
    });
  }
  
  async function asyncCall() {
    console.log('calling');
    const result = await resolveAfter2Seconds();
    console.log(result);
    // expected output: 'resolved'
  }
  
  async function fonctionAsynchroneOk() {
    // équivaut à :
    // return Promise.resolve('résultat');
    return 'résultat';
   }

   async function fonctionAsynchroneKo() {
    // équivaut à :
    // return Promise.reject(new Error('erreur'));
    throw new Error('erreur');
   }







function create() {
    fs.pathExists(yolConfigPathDest)
    .then(exists => {
        if (!exists) {
            _createFirst();
        }
        else {
            _createSecond();
        }
    })
}


function _createFirst() {
 
    copyFile(yolConfigPathSource, yolConfigPathDest);

    copyDir(__dirname + "/sources", "sources");

    console.log(`
    - Adapt etc/yolconfig.json.
    - Replace icon.png(1024x1024) and splash.png(2208x2208 (interieur 1000x1000 max)) in sources/assets dir.
    - First read: https://docs.google.com/document/d/1Tn4Y0V4vCHiTy282tn_H2R7-7hRo0UBzvJ4Vyxcq8eU/edit
    - Créer les certificats Apple sur https://developer.apple.com
    - Si notifications, faire la procédure et remplacer les fichiers dans sources/notifications (cf https://docs.google.com/document/d/1TYnx1EpdwC5bFZxDEjsY5GN3TH9FgEnlOkuR8bZv_iY/edit#)

    Now re-run 'yoltools create' to continue install
    `);
}


async function _createSecond() {
    let json = JSON.parse(fs.readFileSync(yolConfigPathDest));

    myLibrary.callBash("cordova", ["create", cwd, json.appID, json.appName]);

    addPlatform("android@" + json.android.version);
    addPlatform("ios@" + json.ios.version);

    addPlugin("cordova-plugin-android-permissions@^1.0.0");
    addPlugin("cordova-plugin-screen-orientation@^3.0.1");
    addPlugin("cordova-plugin-splashscreen@^5.0.2");
    addPlugin("cordova-plugin-statusbar@^2.4.2");
    addPlugin("es6-promise-plugin@^4.2.2");
    addPlugin("cordova-plugin-device");
    addPlugin("cordova-plugin-inappbrowser");

    copyTemplateWWW();

    let configObj = await getConfigXMLToJSON();

    // wkwebview
    addPlugin("cordova-plugin-wkwebview-engine");
    setPreference({configObj, platform: "ios", name: "WKWebViewOnly", value: "true"})
    setPreference({configObj, platform: "ios", name: "CordovaWebViewEngine", value: "CDVWKWebViewEngine"})
    setFeature({platform: "ios", configObj, name: "CDVWKWebViewEngine", paramName: "ios-package", paramValue: "CDVWKWebViewEngine"}) 

    if (json.features.notifications.active) {
        copyFile("sources/notifications/google-services.json", cwd+"/google-services.json");
        copyFile("sources/notifications/google-services.json", cwd+"/platforms/android/app/google-services.json");
        copyFile("sources/notifications/GoogleService-Info.plist", cwd+"/GoogleService-Info.plist");

        addPlugin("cordova-plugin-fcm");
        addPlugin("cordova-android-support-gradle-release@^3.0.0");
        addPlugin("cordova-android-firebase-gradle-release@^3.0.0");

        copyFile(__dirname + "/assets/fcm_config_files_process.js", cwd+"/plugins/cordova-plugin-fcm/scripts/fcm_config_files_process.js");
    }

    if (json.features.camera.active) {
        addPlugin("cordova-plugin-camera@^4.0.3");
        addPlugin("cordova-plugin-camera-preview@^0.10.0");
        setEditConfigIOS({configObj, name: "NSCameraUsageDescription", value: json.features.camera.text})
    }

    if (json.features.geolocalisation.active) {
        addPlugin("cordova-plugin-geolocation");
        setEditConfigIOS({configObj, name: "NSLocationWhenInUseUsageDescription", value: json.features.geolocalisation.text});
        setEditConfigIOS({configObj, name: "NSLocationAlwaysUsageDescription", value: json.features.geolocalisation.text});
    }

    if (json.features.photos.active) {
        setEditConfigIOS({configObj, name: "NSPhotoLibraryUsageDescription", value: json.features.photos.text});
        setEditConfigIOS({configObj, name: "NSPhotoLibraryAddUsageDescription", value: json.features.photos.text});
    }
    
    createKeystoreAndroid();

    createIconAndSplash({configObj});

    for (let i = 0; i < json.allowIntentURLs.length; i++) {
        setAllowIntent({configObj, href:json.allowIntentURLs[i]})
    }

    for (let i = 0; i < json.allowNavigationURLs.length; i++) {
        setAllowNavigation({configObj, href:json.allowNavigationURLs[i]})
    }

    // user agent
    setPreference({configObj, platform: "android", name: "OverrideUserAgent", value: "Mozilla/5.0 Google Mobile Cofondateur android"})
    setPreference({configObj, platform: "ios", name: "OverrideUserAgent", value: "Mozilla/5.0 Google Mobile Cofondateur ios"})

    // android specific
    setEditConfigApplicationAttributeAndroid({configObj, name: "usesCleartextTraffic", value: true});

    // ios specific
    setPreference({configObj, platform: "ios", name: "DisallowOverscroll", value: "false"})

    saveConfigJSONToXML(configObj)

    createAllGits();

    addScriptsToPackageJSON();

    console.log("FINISHED");
    console.log(`
    Now you must create the gitlab repository '${getStringLowerCaseWithoutAcentsOrSymbols(json.appName)}' (https://gitlab.com/xavier.boisnon/${getStringLowerCaseWithoutAcentsOrSymbols(json.appName)}-mobile.git). Go to https://gitlab.com.
    Then add remote via terminal in ${cwd} directory:
    git remote add origin https://gitlab.com/xavier.boisnon/${getStringLowerCaseWithoutAcentsOrSymbols(json.appName)}-mobile.git
    
    Then open SourceTree and create a new Repository group named ${json.appName}
    Then drag in the main folder of the project and the sub-folder ${cwd}
    
    Open the ${cwd} project in Sourcetree and push master

    That's all for project installation.

    Now you can compile android & ios projects
    `)

}


function getConfigXMLToJSON() {
    return new Promise((resolve, reject)=>{
        var parser = new xml2js.Parser();

        fs.readFile('app-mobile/config.xml', function(err, data) {
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


function addPlatform(platformID) {
    myLibrary.callBash("cordova", ["platform", "add", platformID], {cwd});
}


function addPlugin(pluginID) {
    myLibrary.callBash("cordova", ["plugin", "add", pluginID], {cwd});
}
 

function copyTemplateWWW() {
    fs.removeSync(path.normalize(cwd+"/www"));
    fs.copySync(path.normalize(__dirname + "/assets/models/minimal/www"), path.normalize(cwd+"/www"));
}


function createIconAndSplash({configObj}) {
    myLibrary.callBash("cp", ["sources/assets/icon.png", path.normalize(cwd+"/icon.png")]);
    myLibrary.callBash("cp", ["sources/assets/splash.png", path.normalize(cwd+"/splash.png")]);
    myLibrary.callBash("cordova-icon", [], {cwd});
    myLibrary.callBash("cordova-splash", [], {cwd});


    // now needed for android
    copyDir(cwd + "/platforms/android/app/src/main/res", cwd + "/res");
    setIcon({configObj, platform:"android", src: "res/mipmap-ldpi/icon.png", density:"ldpi"})
    setIcon({configObj, platform:"android", src: "res/mipmap-mdpi/icon.png", density:"mdpi"})
    setIcon({configObj, platform:"android", src: "res/mipmap-hdpi/icon.png", density:"hdpi"})
    setIcon({configObj, platform:"android", src: "res/mipmap-xhdpi/icon.png", density:"xhdpi"})
    setIcon({configObj, platform:"android", src: "res/mipmap-xxhdpi/icon.png", density:"xxhdpi"})
    setIcon({configObj, platform:"android", src: "res/mipmap-xxxhdpi/icon.png", density:"xxxhdpi"})
}


function createKeystoreAndroid(json=null) {
    json = json || JSON.parse(fs.readFileSync(yolConfigPathDest));

    let infos = json.android.keystore;
    fs.ensureDirSync(path.normalize(cwd + "/keys"));

    let password = passwordGenerator.generate({
        length: 16,
        numbers: true,
        lowercase: true,
        uppercase: true,
        strict: true
    });

    infos.password = password;

    fs.writeFileSync(yolConfigPathDest, JSON.stringify(json, null, 4));

    myLibrary.execBash(`keytool -genkeypair -keystore ${path.normalize(cwd + "/keys/" + infos.name + ".keystore")} -storepass ${infos.password} -dname "${infos.dname}" -alias ${infos.alias} -keypass ${infos.password} -keyalg RSA -keysize 2048 -validity 20000`, (error, stdout, stderr)=>{
        console.log(error, stdout, stderr);
    });

    let buildJSON = {
        "android": {
            "debug": {
                "keystore": `./keys/${infos.name}.keystore`,
                "storePassword": `${infos.password}`,
                "alias": `${infos.alias}`,
                "password" : `${infos.password}`,
                "keystoreType": ""
            },
            "release": {
                "keystore": `./keys/${infos.name}.keystore`,
                "storePassword": `${infos.password}`,
                "alias": `${infos.alias}`,
                "password" : `${infos.password}`,
                "keystoreType": ""
            }
        }
    };

    fs.writeFileSync(path.normalize(cwd + "/build.json"), JSON.stringify(buildJSON, null, 4));
}


function setAllowIntent({configObj, href}) {
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
}


function setAllowNavigation({configObj, href}) {
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
}


function setPreference({configObj, platform, name, value}) {
    let platformObj = getPlatformObj(platform, configObj);
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
}


function setIcon({configObj, platform, src, density}) {
    let platformObj = getPlatformObj(platform, configObj);
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
}


function setEditConfigIOS({configObj, name, value, mode="merge"}) {
    let platformObj = getPlatformObj("ios", configObj);
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
        console.log(paramObj)
        console.log(configArr)

    }
    else {
        paramObj["string"] = value;
    }
}


function setEditConfigApplicationAttributeAndroid({configObj, name, value}) {
    let platformObj = getPlatformObj("android", configObj);
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
}


function setFeature({platform, configObj, name, paramName, paramValue}) {
    let platformObj = getPlatformObj(platform, configObj);
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
}


function createAllGits() {
    let yolConfig = JSON.parse(fs.readFileSync(yolConfigPathSource));

    let gitModule = `
    [submodule "${cwd}"]
    path = ${cwd}
    url = https://gitlab.com/xavier.boisnon/${getStringLowerCaseWithoutAcentsOrSymbols(yolConfig.appName)}-mobile.git
    `;

    let gitIgnore = `
    app-site
    ${cwd}
    /out
    `;

    fs.writeFileSync(".gitmodules", gitModule);
    fs.writeFileSync(".gitignore", gitIgnore);

    createGit();
    createGit({directory: cwd});
}


function createGit({directory="./"}={}) {
    myLibrary.callBash("npm", ["init", "--yes"], {cwd: directory});
    myLibrary.callBash("git", ["init"], {cwd: directory});
    myLibrary.callBash("git", ["add", "*"], {cwd: directory});
    myLibrary.callBash("git", ["commit", "-m base"], {cwd: directory});
}


function addScriptsToPackageJSON() {
    let json = JSON.parse(fs.readFileSync(mainPackageJSON));
    json.scripts = {
        IOS_Build: "yoltools IOS_Build",
        ANDROID_Build_DEBUG: "yoltools ANDROID_Build_DEBUG",
        ANDROID_Build_RELEASE: "yoltools ANDROID_Build_RELEASE",
        makePluginsPackagesForSite: "yoltools makePluginsPackagesForSite"
    }

    fs.writeFileSync(mainPackageJSON, JSON.stringify(json, null, 4));
}


function getConfigXMLToJSON(callback) {
    var parser = new xml2js.Parser();

    fs.readFile('app-mobile/config.xml', function(err, data) {
        parser.parseString(data, function (err, result) {
            callback(result)
        });
    });
}


function saveConfigJSONToXML(json) {
    var builder = new xml2js.Builder({renderOpts: { 'pretty': true, 'indent': '    ', 'newline': '\n' }});
    var xml = builder.buildObject(json);
    fs.writeFileSync("app-mobile/config.xml", xml)
}


function getPlatformObj(platformID, xmlJson) {
    let platformsArr = xmlJson.widget.platform;

    for (let i = 0; i < platformsArr.length; i++) {
        if (platformsArr[i]["$"].name == platformID) {
            return platformsArr[i];
        }
        
    }
}


function getStringLowerCaseWithoutAcentsOrSymbols(str) {
    return str.replace(/[éèêë]/, "e")
        .replace(/[@&$§%+]/, "")
        .replace(/[ç]/, "c")
        .replace(/[àâä]/, "a")
        .replace(/[ûù]/, "u")
        .replace(/[ôòö]/, "o")
        .replace(/[îï]/, "i")
        .replace(/\s/, "")
        .toLowerCase();
}


function copyFile(source, dest) {
    myLibrary.callBash("cp", [path.normalize(source), path.normalize(dest)]);
}


function copyDir(source, dest, {merge=false}={}) {
    if (!merge) fs.removeSync(path.normalize(dest));
    fs.copySync(path.normalize(source), path.normalize(dest));
}


function promptUseSample() {
    var schema = {
        properties: {
          name: {
            description: "Enter your name",
            pattern: /^[a-zA-Z\s\-]+$/,
            message: 'Name must be only letters, spaces, or dashes',
            required: true
          },
        }
      };
  
    prompt.start(); // Start the prompt

    // Get two properties from the user: username and email
    prompt.get(schema, function (err, result) {
        console.log('Command-line input received:', result);     // Log the results.
    });
}


async function IOS_Build() {
    let json = JSON.parse(fs.readFileSync(yolConfigPathDest));

    await incVersion();

    if (json.features.notifications.active) {
        copyFile("sources/notifications/GoogleService-Info.plist", cwd+"/GoogleService-Info.plist");
    }

    myLibrary.callBashLine("cordova build ios --buildFlag='-UseModernBuildSystem=0'", {cwd});
    myLibrary.callBashLine(`open -a xcode platforms/ios/${json.appName}.xcworkspace`, {cwd});
}


async function ANDROID_Build_DEBUG() {
    let json = JSON.parse(fs.readFileSync(yolConfigPathDest));

    let version = await incVersion();

    if (json.features.notifications.active) {
        copyFile("sources/notifications/google-services.json", cwd+"/google-services.json");
        copyFile("sources/notifications/google-services.json", cwd+"/platforms/android/app/google-services.json");
    }

    myLibrary.callBashLine("cordova build android", {cwd});

    myLibrary.makeDir("out");
    copyFile(cwd + "/platforms/android/app/build/outputs/apk/debug/app-debug.apk", `out/${json.appName}-debug-${version}.apk`);
    myLibrary.callBashLine("open out");
}


async function ANDROID_Build_RELEASE() {
    let json = JSON.parse(fs.readFileSync(yolConfigPathDest));

    let version = await incVersion();

    if (json.features.notifications.active) {
        copyFile("sources/notifications/google-services.json", cwd+"/google-services.json");
        copyFile("sources/notifications/google-services.json", cwd+"/platforms/android/app/google-services.json");
    }

    myLibrary.callBashLine("cordova build android --release --buildConfig", {cwd});

    myLibrary.makeDir("out");
    copyFile(cwd + "/platforms/android/app/build/outputs/apk/release/app-release.apk", `out/${json.appName}-release-${version}.apk`);
    myLibrary.callBashLine("open out");
}


async function incVersion() {
    let configObj = await getConfigXMLToJSON();

    return new Promise(resolve=>{

        let currentVersion = configObj.widget["$"].version;
    
        var schema = {
            properties: {
              version: {
                description: `Version number (current: ${currentVersion}) type same, major, minor or patch`,
                pattern: /^(same|major|minor|patch)$/,
                message: 'type same, major, minor or patch',
                required: true
              }
            }
        };

        prompt.start();

        prompt.get(schema, function (err, result) {
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
    
            saveConfigJSONToXML(configObj)
            resolve(newVersion);
        });
    })
}


function makePluginsPackagesForSite() {
    myLibrary.makeDir("out/cordova");
    
    myLibrary.callBashLine("rm -r ./out/cordova");
    copyDir(cwd + "/platforms/android/platform_www", "out/cordova/android");
    copyDir(cwd + "/platforms/ios/platform_www", "out/cordova/ios");

    myLibrary.callBashLine('zip -vr cordova.zip cordova/ -x "*.DS_Store"',  {cwd: "out"});

    myLibrary.callBashLine("rm -r ./out/cordova");

}