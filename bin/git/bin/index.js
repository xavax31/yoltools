const common = require('../../../lib/index.js');
let fs = require('fs-extra');
var prompt = require('prompt');
let xml2js = require('xml2js');
const path = require("path");

class GitHelper {
    constructor() {

    }

    createAllGits(cwd, yolConfigPathSource) {
        let yolConfig = JSON.parse(fs.readFileSync(yolConfigPathSource));
    
        let gitModule = `
        [submodule "${cwd}"]
        path = ${cwd}
        url = https://gitlab.com/xavier.boisnon/${common.getStringLowerCaseWithoutAcentsOrSymbols(yolConfig.appName)}-mobile.git
        `;
    
        let gitIgnore = `
        app-site
        ${cwd}
        /out
        `;
    
        fs.writeFileSync(".gitmodules", gitModule);
        fs.writeFileSync(".gitignore", gitIgnore);
    
        this.createGit();
        this.createGit({directory: cwd});
    }
    
    
    createGit({directory="./"}={}) {
        console.log("createGit", directory);
        
        common.callBash("git", ["init"], {cwd: directory});
        common.callBash("git", ["add", "*"], {cwd: directory});
        common.callBash("git", ["commit", "-m base"], {cwd: directory});
    }
    
}

exports.GitHelper = GitHelper;