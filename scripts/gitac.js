var prompt = require('prompt');
const execSync = require('child_process').execSync;


var schema = {
    properties: {
      commitMessage: {
        description: `Commit message`,
        required: true
      },
    }
  };

prompt.start(); 

prompt.get(schema, function (err, result) {
    // console.log('Command-line input received:', result);

    execSync("git add .", {stdio:[0, 1, 2]});
    execSync("git commit -m '" + result.commitMessage + "'", {stdio:[0, 1, 2]});
    execSync("git push --follow-tags", {stdio:[0, 1, 2]});

});
