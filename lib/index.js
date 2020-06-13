// ./lib/index.js
const { exec, spawn } = require("child_process");
const child_process = require("child_process");

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
	var ColorPicker = require('simple-color-picker');
 
	var colorPicker = new ColorPicker();
    return console.log(colorPicker);
};

var callBash = function(command, argsArr, {cwd="./"}={}) {
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

var spawnBash = function(command, args, {cwd="./"}) {

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

// Allows us to call this function from outside of the library file.
// Without this, the function would be private to this file.
exports.say = say;
exports.callBash = callBash;
exports.callBashLine = callBashLine;
exports.spawnBash = spawnBash;
exports.execBash = execBash;
exports.yep = yep;