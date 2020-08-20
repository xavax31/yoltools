const common = require("../../lib/index.js");
const cordova = new (require("../cordova/bin/index.js")).CordovaHelper();
cordova.appDir = "app-mobile";
const git = new (require("../git/bin/index.js")).GitHelper();

const fs = require("fs-extra");
const prompt = require("prompt");
const xml2js = require("xml2js");
const path = require("path");
const passwordGenerator = require("generate-password");

const cwd = "app-mobile";
const yolBinDir = path.resolve(__dirname, "../");
const yolConfigPathSource = path.normalize(
	yolBinDir + "/assets/yolconfig.json"
);
const yolConfigPathDest = path.normalize("etc/yolconfig.json");
const mainPackageJSON = path.normalize("package.json");

class CreateCordova {
	constructor() {}

	test() {
		console.log("testos");
	}

	run() {
		this.create();
	}

	create() {
		fs.pathExists(yolConfigPathDest).then((exists) => {
			if (!exists) {
				this._createFirst();
			} else {
				this._createSecond();
			}
		});
	}

	_createFirst() {
		common.copyFile(yolConfigPathSource, yolConfigPathDest);

		common.copyDir(yolBinDir + "/sources", "sources");

        let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
        json.appType = "cordova";
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

		steps.push(() =>
			cordova.createApp({ appDir: cwd, appID: json.appID, appName: json.appName })
		);

		steps.push(() => cordova.addPlatform("android@" + json.android.version));
		steps.push(() => cordova.addPlatform("ios@" + json.ios.version));

		steps.push(() => cordova.addPlugin("cordova-plugin-android-permissions@^1.0.0"));
		steps.push(() => cordova.addPlugin("cordova-plugin-screen-orientation@^3.0.1"));
		steps.push(() => cordova.addPlugin("cordova-plugin-splashscreen@^5.0.2"));
		steps.push(() => cordova.addPlugin("cordova-plugin-statusbar@^2.4.2"));
		steps.push(() => cordova.addPlugin("es6-promise-plugin@^4.2.2"));
		steps.push(() => cordova.addPlugin("cordova-plugin-device"));
		steps.push(() => cordova.addPlugin("cordova-plugin-inappbrowser"));

		steps.push(() => this.copyTemplateWWW());

		steps.push(() => this.addWKwebView());

		steps.push(() => {
			if (json.features.notifications.active) {
				common.copyFile( "sources/notifications/google-services.json", cwd + "/google-services.json" );
				common.copyFile( "sources/notifications/google-services.json", cwd + "/platforms/android/app/google-services.json" );
				common.copyFile( "sources/notifications/GoogleService-Info.plist", cwd + "/GoogleService-Info.plist" );

				cordova.addPlugin("cordova-plugin-fcm");
				cordova.addPlugin( "cordova-android-support-gradle-release@^3.0.0" );
				cordova.addPlugin( "cordova-android-firebase-gradle-release@^3.0.0" );

				common.copyFile( yolBinDir + "/assets/fcm_config_files_process.js", cwd + "/plugins/cordova-plugin-fcm/scripts/fcm_config_files_process.js" );
			}
		});

		steps.push(async () => {
			if (json.features.camera.active) {
				cordova.addPlugin("cordova-plugin-camera");
				cordova.addPlugin("cordova-plugin-camera-preview");
				await cordova.setEditConfigIOS({ name: "NSCameraUsageDescription", value: json.features.camera.text });
			}
		});

		steps.push(async () => {
			if (json.features.geolocalisation.active) {
				cordova.addPlugin("cordova-plugin-geolocation");
				await cordova.setEditConfigIOS({ name: "NSLocationWhenInUseUsageDescription", value: json.features.geolocalisation.text });
				await cordova.setEditConfigIOS({ name: "NSLocationAlwaysUsageDescription", value: json.features.geolocalisation.text });
			}
		});

		steps.push(async () => {
			if (json.features.photos.active) {
				await cordova.setEditConfigIOS({ name: "NSPhotoLibraryUsageDescription", value: json.features.photos.text });
				await cordova.setEditConfigIOS({ name: "NSPhotoLibraryAddUsageDescription", value: json.features.photos.text });
			}
		});

		steps.push(() => this.createKeystoreAndroid());

		steps.push(() => cordova.createIconAndSplash());

		steps.push(async () => {
			for (let i = 0; i < json.allowIntentURLs.length; i++) {
				await cordova.setAllowIntent({ href: json.allowIntentURLs[i] });
			}

			for (let i = 0; i < json.allowNavigationURLs.length; i++) {
				await cordova.setAllowNavigation({ href: json.allowNavigationURLs[i] });
			}
		});

		steps.push(async () => {
			// user agent
			await cordova.setPreference({ platform: "ios", name: "OverrideUserAgent", value: "Mozilla/5.0 Google Mobile Cofondateur ios" });
			await cordova.setPreference({ platform: "android", name: "OverrideUserAgent", value: "Mozilla/5.0 Google Mobile Cofondateur android" });
		});

		steps.push(async () => {
			// android specific
			await cordova.setEditConfigApplicationAttributeAndroid({ name: "usesCleartextTraffic", value: true });

			// ios specific
			await cordova.setPreference({ platform: "ios", name: "DisallowOverscroll", value: "false" });
		});

		steps.push(() => this.addScriptsToPackageJSON());

		if (json.features["appSite"].active) {
			steps.push(() => this.createAppSiteDir());
			steps.push(() => this.copyPluginsPackagesToAppSiteDir());
			if (json.features["appSite"].createRemote) {
				steps.push(() => this.sendAppSiteToServer());
			}
		}

		steps.push(() => git.createAllGits(cwd, yolConfigPathSource));

		steps.push(() => {
			console.log("FINISHED");
			console.log(`
            Now you must create the gitlab repository '${common.getStringLowerCaseWithoutAcentsOrSymbols(json.appName)}' (https://gitlab.com/xavier.boisnon/${common.getStringLowerCaseWithoutAcentsOrSymbols(json.appName)}-mobile.git). Go to https://gitlab.com.
            Then add remote via terminal in ${cwd} directory:
            git remote add origin https://gitlab.com/xavier.boisnon/${common.getStringLowerCaseWithoutAcentsOrSymbols(json.appName)}-mobile.git
            
            Then open SourceTree and create a new Repository group named ${json.appName}
            Then drag in the main folder of the project and the sub-folder ${cwd}
            
            Open the ${cwd} project in Sourcetree and push master
        
            That's all for project installation.
        
            Now you can compile android & ios projects
            `);
		});

		common.runSteps(steps, yolConfigPathDest);
	}

	createAppSiteDir() {
		fs.copySync( path.normalize(yolBinDir + "/assets/models/app-site"), path.normalize("app-site") );
	}

	sendAppSiteToServer() {
		let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
		let projectName = json.appID.replace(/\./g, "_");

		common.callBash(
			`rsync`,
			[
				"-rip",
				"-e",
				"ssh -i " + process.env.HOME + "/.ssh/id_rsa_ovh",
				"app-site/",
				`xab@vps820143.ovh.net:home/lab/${projectName}`,
				"--exclude='.git/'",
				"--exclude='doc/'",
				"--delete",
			],
			{ cwd: "./" }
		);

		// common.callBashLine(`rsync -rip -e 'ssh -i ${process.env.HOME}/.ssh/id_rsa_ovh' app-site/ xab@vps820143.ovh.net:home/lab/${projectName} --exclude='.git/' --delete`, {cwd: "./"});
		// common.callBashLine(`ssh xab@vps820143.ovh.net "find 'home/lab/${projectName}' -type d -print0 | xargs -0 chmod 0775"`, {cwd: "./"});
		// common.callBashLine(`ssh xab@vps820143.ovh.net "chmod 775 $(find home/lab/${projectName} -type d)"`, {cwd: "./"});
		common.callBash(
			`ssh`, [ "xab@vps820143.ovh.net", `chmod 777 $(find home/lab/${projectName} -type d)` ], { cwd: "./" } );
		// common.callBash(`ssh`,  ["xab@vps820143.ovh.net", `chmod 664 $(find home/lab/${projectName} -type f)`], {cwd: "./"});
	}

	copyTemplateWWW() {
		fs.removeSync(path.normalize(cwd + "/www"));
		fs.copySync(path.normalize(yolBinDir + "/assets/models/minimal/www"), path.normalize(cwd + "/www"));
	}

	async addWKwebView() {
		await cordova.addPlugin("cordova-plugin-wkwebview-engine");
		await cordova.setPreference({platform: "ios", name: "WKWebViewOnly", value: "true"});
		await cordova.setPreference({platform: "ios", name: "CordovaWebViewEngine", value: "CDVWKWebViewEngine"});
		await cordova.setFeature({platform: "ios", name: "CDVWKWebViewEngine", paramName: "ios-package", paramValue: "CDVWKWebViewEngine"});

		await cordova.setPreference({platform: "ios", name: "DisallowOverscroll", value: "false"});
		await cordova.setPreference({platform: "ios", name: "StatusBarOverlaysWebView", value: "true"});
		await cordova.setPreference({platform: "ios", name: "StatusBarBackgroundColor", value: "transparent"});
		await cordova.setPreference({platform: "ios", name: "StatusBarStyle", value: "lightcontent"});
	}

	addScriptsToPackageJSON() {
		if (!fs.ensureFileSync(mainPackageJSON)) {
			common.callBash("npm", ["init", "--yes"], { cwd: "./" });
		}

		let json = JSON.parse(fs.readFileSync(mainPackageJSON));
		json.scripts = {
			IOS_Build: "yoltools IOS_Build",
			ANDROID_Build_DEBUG: "yoltools ANDROID_Build_DEBUG",
			ANDROID_Build_RELEASE: "yoltools ANDROID_Build_RELEASE",
			makePluginsPackagesForSite: "yoltools makePluginsPackagesForSite",
			copyPluginsPackagesToAppSiteDir:
				"yoltools copyPluginsPackagesToAppSiteDir",
			sendAppSiteToServer: "yoltools sendAppSiteToServer",
			addScriptsToPackageJSON: "yoltools addScriptsToPackageJSON",
			createAppSiteDir: "yoltools createAppSiteDir",
		};

		fs.writeFileSync(mainPackageJSON, JSON.stringify(json, null, 4));
	}

	copyPluginsPackagesToAppSiteDir() {
		common.makeDir("app-site/cordova");
		common.callBashLine("rm -r ./app-site/cordova");
		common.copyDir( cwd + "/platforms/android/platform_www", "app-site/cordova/android" );
		common.copyDir( cwd + "/platforms/ios/platform_www", "app-site/cordova/ios" );
	}

	async IOS_Build() {
		let json = JSON.parse(fs.readFileSync(yolConfigPathDest));

		await cordova.incVersion();

		if (json.features.notifications.active) {
			common.copyFile( "sources/notifications/GoogleService-Info.plist", cwd + "/GoogleService-Info.plist" );
		}

		common.callBashLine( "cordova build ios --buildFlag='-UseModernBuildSystem=0'", { cwd } );
		common.callBashLine( `open -a xcode platforms/ios/${json.appName}.xcworkspace`, { cwd } );
	}

	async ANDROID_Build_DEBUG() {
		let json = JSON.parse(fs.readFileSync(yolConfigPathDest));

		let version = await cordova.incVersion();

		if (json.features.notifications.active) {
			common.copyFile( "sources/notifications/google-services.json", cwd + "/google-services.json" );
			common.copyFile( "sources/notifications/google-services.json", cwd + "/platforms/android/app/google-services.json" );
		}

		common.callBashLine("cordova build android", { cwd });

		common.makeDir("out");
		common.copyFile( cwd + "/platforms/android/app/build/outputs/apk/debug/app-debug.apk", `out/${json.appName}-debug-${version}.apk` );
		common.callBashLine("open out");
	}

	async ANDROID_Build_RELEASE() {
		let json = JSON.parse(fs.readFileSync(yolConfigPathDest));

		let version = await cordova.incVersion();

		if (json.features.notifications.active) {
			common.copyFile( "sources/notifications/google-services.json", cwd + "/google-services.json" );
			common.copyFile( "sources/notifications/google-services.json", cwd + "/platforms/android/app/google-services.json" );
		}

		common.callBashLine("cordova build android --release --buildConfig", { cwd });

		common.makeDir("out");
		common.copyFile( cwd + "/platforms/android/app/build/outputs/apk/release/app-release.apk", `out/${json.appName}-release-${version}.apk` );
		common.callBashLine("open out");
	}

	makePluginsPackagesForSite() {
		common.makeDir("out/cordova");

		common.callBashLine("rm -r ./out/cordova");
		common.copyDir( cwd + "/platforms/android/platform_www", "out/cordova/android" );
		common.copyDir(cwd + "/platforms/ios/platform_www", "out/cordova/ios");

		common.callBashLine('zip -vr cordova.zip cordova/ -x "*.DS_Store"', { cwd: "out" });

		common.callBashLine("rm -r ./out/cordova");
	}

	createKeystoreAndroid(json = null) {
		json = json || JSON.parse(fs.readFileSync(yolConfigPathDest));

		let infos = json.android.keystore;
		fs.ensureDirSync(path.normalize(cwd + "/keys"));

		let password = passwordGenerator.generate({
			length: 16,
			numbers: true,
			lowercase: true,
			uppercase: true,
			strict: true,
		});

		infos.password = password;

		fs.writeFileSync(yolConfigPathDest, JSON.stringify(json, null, 4));

		common.execBash(
			`keytool -genkeypair -keystore ${path.normalize(
				cwd + "/keys/" + infos.name + ".keystore"
			)} -storepass ${infos.password} -dname "${infos.dname}" -alias ${
				infos.alias
			} -keypass ${
				infos.password
			} -keyalg RSA -keysize 2048 -validity 20000`,
			(error, stdout, stderr) => {
				console.log(error, stdout, stderr);
			}
		);

		let buildJSON = {
			android: {
				debug: {
					keystore: `./keys/${infos.name}.keystore`,
					storePassword: `${infos.password}`,
					alias: `${infos.alias}`,
					password: `${infos.password}`,
					keystoreType: "",
				},
				release: {
					keystore: `./keys/${infos.name}.keystore`,
					storePassword: `${infos.password}`,
					alias: `${infos.alias}`,
					password: `${infos.password}`,
					keystoreType: "",
				},
			},
		};

		fs.writeFileSync(
			path.normalize(cwd + "/build.json"),
			JSON.stringify(buildJSON, null, 4)
		);
	}
}

exports.CreateCordova = CreateCordova;
