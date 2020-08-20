// ./lib/index.js
const { exec, spawn } = require("child_process");
const child_process = require("child_process");
const fs = require("fs-extra");
const path = require("path");

class yep {
	yop() {
		console.log("yes");
	}
}
/**
 * Displays a string in the console
 * 
 * @param {string_to_say} String string to show in the console
 */
var say = function(string_to_say) {
console.log(string_to_say);

};

var callBash = function(command, argsArr, {cwd="./"}={}) {
	console.log("callBash", command, argsArr, cwd, path.resolve(cwd));
	
	child_process.execFileSync(command, argsArr, {stdio: 'inherit', cwd});
}

var callBashLine = function(commandline, {cwd="./"}={}) {
	let arr = commandline.split(" ");
	let command = arr[0];
	arr.shift();
	let argsArr = arr;
	child_process.execFileSync(command, argsArr, {stdio: 'inherit', cwd});
}

var execBash = function (commandline, callback=(error, stdout, stderr)=>{}) {
	exec(commandline, callback)
}

var makeDir = function (path) {
	fs.mkdirsSync(path);
}

var spawnBash = function(command, args, {cwd="./"}={}) {

	const child = spawn(command, args, {cwd});

	child.stdout.on("data", data => {
		console.log(`stdout: ${data}`);
	});

	child.stderr.on("data", data => {
		console.log(`stderr: ${data}`);
	});

	child.on('error', (error) => {
		console.log(`error: ${error.message}`);
	});

	child.on("close", code => {
		console.log(`child process exited with code ${code}`);
	});


	// process.stdin.on('readable', function() {

	//     var chunk = process.stdin.read();

	//     if(chunk !== null) {
	//         child.stdin.write(chunk);
	//     }
	// });
}

function copyFile(source, dest) {
    callBash("cp", [path.normalize(source), path.normalize(dest)]);
}


function copyDir(source, dest, {merge=false}={}) {
    if (!merge) fs.removeSync(path.normalize(dest));
    fs.copySync(path.normalize(source), path.normalize(dest));
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

async function runSteps(steps, yolConfigPathDest, index=-1) {
    console.log("yolConfigPathDest", yolConfigPathDest)
    if (index == -1 && yolConfigPathDest) {
        let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
        if (json.lastInstallStep != undefined) index = Number(json.lastInstallStep);
    }

    index ++;
    if (index < steps.length) {
        console.log("execute step ", index);

        try {
            await steps[index]();
            runSteps(steps, yolConfigPathDest, index);
        } catch (error) {
            console.log(error);           
            let json = JSON.parse(fs.readFileSync(yolConfigPathDest));
            json.lastInstallStep = index - 1;
            fs.writeFileSync(yolConfigPathDest, JSON.stringify(json, null, 4));
        }
    }
    else {
        console.log("finished");
        
    }
}


function sendAppSiteToServer({localPath, urlSuffix }) {
    console.log("sendAppSiteToServer", localPath, urlSuffix);

    callBash(
        `rsync`,
        [
            "-rip",
            "-e",
            "ssh -i " + process.env.HOME + "/.ssh/id_rsa_ovh",
            localPath,
            `xab@vps820143.ovh.net:home/lab/${urlSuffix}`,
            "--exclude='.git/'",
            "--exclude='doc/'",
            "--exclude='node_modules'",
            "--delete",
        ],
        { cwd: "./" }
    );

    callBash(`ssh`, [ "xab@vps820143.ovh.net", `chmod 777 $(find home/lab/${urlSuffix} -type d)` ], { cwd: "./" } );
    callBash(`ssh`, [ "xab@vps820143.ovh.net", `chmod 664 $(find home/lab/${urlSuffix} -type f)` ], { cwd: "./" } );

    console.log(`
    the website is online at https://vps820143.ovh.net/lab/${urlSuffix}
    It is synchronized with the ${localPath} directory
    `)
}


exports.say = say;
exports.callBash = callBash;
exports.callBashLine = callBashLine;
exports.spawnBash = spawnBash;
exports.execBash = execBash;
exports.makeDir = makeDir;
exports.yep = yep;
exports.copyFile = copyFile;
exports.copyDir = copyDir;
exports.getStringLowerCaseWithoutAcentsOrSymbols = getStringLowerCaseWithoutAcentsOrSymbols;
exports.runSteps = runSteps;
exports.sendAppSiteToServer = sendAppSiteToServer;