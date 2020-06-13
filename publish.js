var prompt = require('prompt');
const execSync = require('child_process').execSync;

let currentVersion = process.env["npm_package_version"];

var schema = {
    properties: {
      version: {
        description: `Version number (current: ${currentVersion}) type major, minor or patch`,
        pattern: /^(major|minor|patch)$/,
        message: 'type major, minor or patch',
        required: true
      },
      commitMessage: {
        description: `Commit message`,
        // pattern: /^(major|minor|patch)$/,
        // message: 'type major, minor or patch',
        required: true
      },
    }
  };

prompt.start(); // Start the prompt

prompt.get(schema, function (err, result) {
    console.log('Command-line input received:', result);

    execSync("git add .", {stdio:[0, 1, 2]});
    // execSync("git commit -m '" + result.commitMessage + "'", {stdio:[0, 1, 2]});
    execSync("npm version  " + result.version + "  -m '" + result.commitMessage + "' --force", {stdio:[0, 1, 2]});
    execSync("git push --tags", {stdio:[0, 1, 2]});
    execSync("npm publish", {stdio:[0, 1, 2]});
});
