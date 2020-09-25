#!/usr/bin/env node --trace-warnings

'use strict';

let actions = {
    cordova: require('./presets/cordova.js').CreateCordova,
    react: require('./presets/react.js').CreateReact
}
const serverInfos = {
    url: "https://vps820143.ovh.net",
    labURL : "https://vps820143.ovh.net/lab",
    sshEntry: "xab@vps820143.ovh.net",
    sshlabURL: "xab@vps820143.ovh.net:home/lab"
}
const common = require('../lib/index.js');
const fs = require('fs-extra');
const prompt = require('prompt');
const path = require("path");
const urlExists = require("url-exists");
const git = new (require("./git/bin/index.js")).GitHelper();
const yolHelpText = require('./help.js');
let yolConfigPathDest = path.normalize("etc/yolconfig.json");

const correctsNamesRegExp = {
    fileName: /^[a-zA-Z0-9\-_]*$/
}

const [,, ...args] = process.argv;  

if (args.length === 0) {
    help();
}
else {
    run(...args);
}


function help() {
    console.log(yolHelpText);
}


function run(...args) {
// console.log(args[0], yolConfigPathDest, fs.existsSync(yolConfigPathDest))

    try {
        eval(args[0])();
        return;
    } catch (error) {
        if (fs.existsSync(yolConfigPathDest)) {
            let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
            json.appType = json.appType || "cordova";
    
            let action = new actions[json.appType]();
    
            if (action[args[0]]) {
                action[args[0]]();
                return;
            }
        }

        console.error("command not found", error);
    }

}


function create() {
    if (fs.existsSync(yolConfigPathDest)) {
        let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
        json.appType = json.appType || "cordova";

        let action = new actions[json.appType]();

        action.run();
    }
    else {
        let type = args[1];
        let choices = {
            "co": "cordova",
            "cofco": "cofondateur-cordova",
            "rc": "react",
            "rcn": "reactnative",
        }
        let pattern = [];
        for (let prop in choices) {
            pattern.push(prop)
        }

        if (!type) {
            var schema = {
                properties: {
                  appType: {
                    description: `Choose type:
                    ${JSON.stringify(choices, null, 4)}`,
                    default: 'co', 
                    pattern: new RegExp("^" + pattern.join("|") + "$"),
                    message: 'unavailable choice',
                    required: true
                  }
                }
            };
    
            prompt.start();
    
            prompt.get(schema, function (err, result) {
    
                console.log("onprompt", result, choices[result.appType]);
    
                let action = new actions[choices[result.appType]]();
    
                action.run();
            })
        }   
    }
}


function gitInit() {
    git.createGit();
}


function addSite() {
    var schema = {
        properties: {
          appDirName: {
            description: `Nom du dossier:`,
            default: 'app-site', 
            pattern: correctsNamesRegExp.fileName,
            message: `wrong name syntax, needed: ${correctsNamesRegExp.fileName}`,
            required: true
          },
          urlDir: {
            description: `extension de l'url: (http.../<extension>)`,
            pattern: correctsNamesRegExp.fileName,
            message: `wrong name syntax, needed: ${correctsNamesRegExp.fileName}`,
            required: true
          }
        }
    };

    prompt.start();

    prompt.get(schema, function (err, result) {
        const yolConfigPathDest = path.normalize(`${result.appDirName}/yolconfig.json`);


		let steps = [];


        steps.push(()=>common.copyDir(path.normalize(__dirname + "/assets/models/simpleweb"), result.appDirName));

        steps.push(()=>{
            fs.writeFileSync(yolConfigPathDest, JSON.stringify({buildPath: "", remotePath: result.urlDir}, null, 4));
        })
    
        common.runSteps(steps);
    })
}


function addReactSite() {
    console.log("Création d'un projet React");

    var schema = {
        properties: {
          appDirName: {
            description: `Nom du dossier:`,
            default: 'app-site', 
            pattern: correctsNamesRegExp.fileName,
            message: `wrong name syntax, needed: ${correctsNamesRegExp.fileName}`,
            required: true
          },
          urlDir: {
            description: `extension de l'url: (http.../<extension>)`,
            pattern: correctsNamesRegExp.fileName,
            message: `wrong name syntax, needed: ${correctsNamesRegExp.fileName}`,
            required: true
          }
        }
    };

    prompt.start();

    prompt.get(schema, function (err, result) {
        const yolConfigPathDest = path.normalize("etc/yolconfig.json");
		fs.writeFileSync(yolConfigPathDest, JSON.stringify({}, null, 4));
        const react = new (require("./react/bin/index.js")).ReactHelper();

		let steps = [];


        steps.push(()=>react.createApp({ appDir: result.appDirName, appID: result.appDirName, appName: result.appDirName }));
        steps.push(()=>common.callBashLine(`yarn add bootstrap`, {cwd: result.appDirName}));
        steps.push(()=>common.callBashLine(`yarn add react-router-dom`, {cwd: result.appDirName}));
        steps.push(()=>common.copyFile(path.normalize(__dirname + "/react/public/index.html"), result.appDirName+"/public/index.html"));
        steps.push(()=>common.copyFile(path.normalize(__dirname + "/react/src/App.tsx"), result.appDirName+"/src/App.tsx"));
    
        common.runSteps(steps, yolConfigPathDest);
    })

}


function _sendToServer({remotePath, buildPath}) {

		let steps = [];

        //         //yoltools sendToServer api-client
        // let yolConfigPathDest = path.normalize("yolconfig.json");
    
        // let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
        // let projectName = json.appID.replace(/\./g, "_");
    
        console.log(remotePath);
    
        common.callBash(
            `rsync`,
            [
                "-rip",
                "-e",
                "ssh -i " + process.env.HOME + "/.ssh/id_rsa_ovh",
                `${buildPath == "" ? "./" : buildPath + "/"}`,
                `${serverInfos.sshlabURL}/${remotePath}`,
                "--exclude='.git/'",
                "--exclude='doc/'",
                "--exclude='node_modules'",
                "--delete",
            ],
            { cwd: "./" }
        );
    
        common.callBash(`ssh`, [ serverInfos.sshEntry, `chmod 777 $(find home/lab/${remotePath} -type d)` ], { cwd: "./" } );
        common.callBash(`ssh`, [ serverInfos.sshEntry, `chmod 664 $(find home/lab/${remotePath} -type f)` ], { cwd: "./" } );
    
        console.log(`
        the website is online at ${serverInfos.labURL}/${remotePath}
        It is synchronized with the ./${buildPath} directory
        `)
        
        common.runSteps(steps);
}

// doit être lancer dans le dossier concerné
function sendToServer() {
    const yolConfigPathDest = path.normalize("yolconfig.json");
    console.log(fs.pathExistsSync(yolConfigPathDest), yolConfigPathDest);
    if (fs.pathExistsSync(yolConfigPathDest)) {
        let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
        json.remotePath = json.remotePath || json.appID.replace(/\./g, "_"); 
        json.buildPath = json.buildPath || ""; 
        fs.writeFileSync(yolConfigPathDest, JSON.stringify(json, null, 4));

        _sendToServer({remotePath: json.remotePath, buildPath: json.buildPath});
    }
    else {
        var schema = {
            properties: {
                buildPath: {
                default: "",
                description: `Relative path to public dir to send to server`,
                // pattern: correctsNamesRegExp.fileName,
                // message: `wrong name syntax, needed: ${correctsNamesRegExp.fileName}`,
                // required: true
              },
              remotePath: {
                description: `extension de l'url: (http.../<extension>)`,
                pattern: correctsNamesRegExp.fileName,
                message: `wrong name syntax, needed: ${correctsNamesRegExp.fileName}`,
                required: true
              }
            }
        };
    
        prompt.start();
    
        prompt.get(schema, function (err, result) {
            let newURL = serverInfos.labURL + "/" + result.remotePath;
            if (urlExists(newURL, (err, exists)=>{
                if (exists) {
                    console.error("ERROR : A site already exists at ", newURL);
                    sendToServer();
                }
                else {
                    fs.writeFileSync(yolConfigPathDest, JSON.stringify({buildPath: result.buildPath, remotePath: result.remotePath}, null, 4));
                    _sendToServer({buildPath: result.buildPath, remotePath: result.remotePath})
                }
                return;
            }));
        })      

    }

}

function sendAppSiteToServer() {
    let yolConfigPathDest = path.normalize("yolconfig.json");

    let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
    let projectName = json.appID.replace(/\./g, "_");

    console.log(projectName);

    common.callBash(
        `rsync`,
        [
            "-rip",
            "-e",
            "ssh -i " + process.env.HOME + "/.ssh/id_rsa_ovh",
            "app-site/build/",
            `${serverInfos.sshlabURL}/${projectName}`,
            "--exclude='.git/'",
            "--exclude='doc/'",
            "--exclude='node_modules'",
            "--delete",
        ],
        { cwd: "./" }
    );

    common.callBash(`ssh`, [ serverInfos.sshEntry, `chmod 777 $(find home/lab/${projectName} -type d)` ], { cwd: "./" } );
    common.callBash(`ssh`, [ serverInfos.sshEntry, `chmod 664 $(find home/lab/${projectName} -type f)` ], { cwd: "./" } );

    console.log(`
    the website is online at ${serverInfos.labURL}/${projectName}
    It is synchronized with the app-site/public directory
    `)
}


function sendAppSiteToServer2() {
    let yolConfigPathDest = path.normalize("etc/yolconfig.json");

    let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
    let projectName = json.appID.replace(/\./g, "_");

    common.callBashLine(`yarn build`, {cwd: "./app-site"});

    common.callBash(
        `rsync`,
        [
            "-rip",
            "-e",
            "ssh -i " + process.env.HOME + "/.ssh/id_rsa_ovh",
            "app-site/build/",
            `${serverInfos.sshlabURL}/${projectName}`,
            "--exclude='.git/'",
            "--exclude='doc/'",
            "--exclude='node_modules'",
            "--delete",
        ],
        { cwd: "./" }
    );

    // common.callBashLine(`rsync -rip -e 'ssh -i ${process.env.HOME}/.ssh/id_rsa_ovh' app-site/build $serverInfos.{sshlabURL}/${projectName} --exclude='.git/' --exclude='doc/' --exclude='node_modules' --delete`, {cwd: "./"});
    // common.callBashLine(`ssh xab@vps820143.ovh.net "find 'home/lab/${projectName}' -type d -print0 | xargs -0 chmod 0775"`, {cwd: "./"});
    // common.callBashLine(`ssh xab@vps820143.ovh.net "chmod 775 $(find home/lab/${projectName} -type d)"`, {cwd: "./"});
    common.callBash(`ssh`, [ serverInfos.sshEntry, `chmod 777 $(find home/lab/${projectName} -type d)` ], { cwd: "./" } );
    common.callBash(`ssh`, [ serverInfos.sshEntry, `chmod 664 $(find home/lab/${projectName} -type f)` ], { cwd: "./" } );


        // common.callBash(
    //     `ssh`, [ serverInfos.url, `cd home/lab/${projectName};ls` ], { cwd: "./" } );

    // common.callBash(`ssh`,  [serverInfos.url, `chmod 664 $(find home/lab/${projectName} -type f)`], {cwd: "./"});

    console.log(`
    the website is online at ${serverInfos.labURL}/${projectName}
    It is synchronized with the app-site/public directory
    `)
}


function addScriptsToPackageJSON2() {
    let mainPackageJSON = path.normalize("package.json");
    if (!fs.ensureFileSync(mainPackageJSON)) {
        common.callBash("npm", ["init", "--yes"], { cwd: "./" });
    }

    let json = JSON.parse(fs.readFileSync(mainPackageJSON));
    json.scripts = {
        sendAppSiteToServer: "yoltools sendAppSiteToServer2",
    };

    fs.writeFileSync(mainPackageJSON, JSON.stringify(json, null, 4));
}


function _convertArgsToObject(args) {
    let argsObj = {};

    for (let i = 0; i < args.length; i++) {
        const element = args[i];
        let arr = element.split("=");
        argsObj[arr[0]] = arr[1];
    }

    return argsObj;
}




