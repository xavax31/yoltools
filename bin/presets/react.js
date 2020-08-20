const common = require("../../lib/index.js");
const react = new (require("../react/bin/index.js")).ReactHelper();
react.appDir = "app-site2";
const git = new (require("../git/bin/index.js")).GitHelper();

const fs = require("fs-extra");
const prompt = require("prompt");
const xml2js = require("xml2js");
const path = require("path");
const passwordGenerator = require("generate-password");

const cwd = "app-site2";
const yolBinDir = path.resolve(__dirname, "../");
const yolConfigPathSource = path.normalize(
	yolBinDir + "/assets/yolconfig.json"
);
const yolConfigPathDest = path.normalize("etc/yolconfig.json");
const mainPackageJSON = path.normalize("package.json");

const correctsNamesRegExp = {
    fileName: /^[a-zA-Z0-9\-_]*$/
}

class CreateReact {
	constructor() {}

	test() {
		console.log("testos");
	}

	run() {
		this.create();
	}

	create() {
		this._getInputUser();
		// fs.pathExists(yolConfigPathDest).then((exists) => {
		// 	if (!exists) {
		// 		this._createFirst();
		// 	} else {
		// 		this._createSecond();
		// 	}
		// });
	}

	_getInputUser() {
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
			  },
			  sendToServer: {
				description: `créer le site online (y/n)`,
				default: 'n', 
				pattern: /^[yn]$/,
				message: `wrong name syntax, needed: y/n}`,
				required: true
			  }
			}
		};
	
		prompt.start();
	
		prompt.get(schema, function (err, result) {
			// const yolConfigPathDest = path.normalize("etc/yolconfig.json");
			// fs.writeFileSync(yolConfigPathDest, JSON.stringify({}, null, 4));
			// const react = new (require("./react/bin/index.js")).ReactHelper();
	
			let steps = [];
	
			steps.push(()=>react.createApp({ appDir: result.appDirName, appID: result.appDirName, appName: result.appDirName }));
			steps.push(()=>common.callBashLine(`yarn add bootstrap`, {cwd: result.appDirName}));
			steps.push(()=>common.callBashLine(`yarn add react-router-dom`, {cwd: result.appDirName}));
			steps.push(()=>common.copyFile(path.normalize(yolBinDir + "/react/public/index.html"), result.appDirName+"/public/index.html"));
			steps.push(()=>common.copyFile(path.normalize(yolBinDir + "/react/src/App.tsx"), result.appDirName+"/src/App.tsx"));

			steps.push(()=>{

				let json = 
				{
					"appType": "react",
					"appName": result.appDirName,
					"appID": result.urlDir,
					"appVersion": "1.0.0",
					"lastInstallStep": -1
				}
				;

				let projectName = json.appID.replace(/\./g, "_");
				json.homepage = "lab/" + projectName;

				fs.ensureDirSync(result.appDirName + "/etc");
				fs.writeFileSync(result.appDirName + "/" + yolConfigPathDest, JSON.stringify(json, null, 4));

				console.log(`
				Finished.
				To send to server, go in site dir and exec yoltools sendToServer
				`)
			})

			common.runSteps(steps, null);
		})
	
	}


	sendToServer() {
		console.log("sendToServer");
		let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
		let projectName = json.appID.replace(/\./g, "_");

		let packageJSON = JSON.parse(fs.readFileSync(mainPackageJSON));
		packageJSON.homepage = "lab/" + projectName;
		fs.writeFileSync(mainPackageJSON, JSON.stringify(packageJSON, null, 4));

		common.callBashLine(`yarn build`, {cwd: "./"});

		common.sendAppSiteToServer({localPath: "./build/", urlSuffix: projectName});
	}

	
	_createFirst() {
		common.copyFile(yolConfigPathSource, yolConfigPathDest);

		common.copyDir(yolBinDir + "/sources", "sources");

        let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
        json.appType = "react";
		fs.writeFileSync(yolConfigPathDest, JSON.stringify(json, null, 4));

		console.log(`
        - Adapt etc/yolconfig.json.
        - Replace icon.png(1024x1024) and splash.png(2208x2208 (interieur 1000x1000 max)) in sources/assets dir.
        - First read: https://docs.google.com/document/d/1Tn4Y0V4vCHiTy282tn_H2R7-7hRo0UBzvJ4Vyxcq8eU/edit
        - Créer les certificats Apple sur https://developer.apple.com
        - Si notifications, faire la procédure et remplacer les fichiers dans sources/notifications (cf https://docs.google.com/document/d/1TYnx1EpdwC5bFZxDEjsY5GN3TH9FgEnlOkuR8bZv_iY/edit#)
    
        Now re-run 'yoltools create' to continue install
        `);
	}

	async _createSecond() {
		let steps = [];

        let json = JSON.parse(fs.readFileSync(yolConfigPathDest));

        steps.push(()=>react.createApp({ appDir: cwd, appID: json.appID, appName: json.appName }));
        steps.push(()=>common.callBashLine(`yarn add bootstrap`, {cwd}));
        steps.push(()=>common.callBashLine(`yarn add react-router-dom`, {cwd}));
        steps.push(()=>common.copyFile(path.normalize(__dirname + "/react/public/index.html"), cwd+"/public/index.html"));
        steps.push(()=>common.copyFile(path.normalize(__dirname + "/react/src/App.tsx"), cwd+"/src/App.tsx"));
    
        common.runSteps(steps, yolConfigPathDest);

    }

}

exports.CreateReact = CreateReact;
