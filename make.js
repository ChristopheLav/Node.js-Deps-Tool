// modules
var make = require('shelljs/make');
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var util = require('./util');

// global paths
var dataPath = path.join(__dirname, 'data');

// global variables
var nodejsRepository = "https://api.github.com/repos/nodejs/node";
var gitHubAccessToken = "";

// util functions
var addPath = util.addPath;
var executeGetQuery = util.executeGetQuery;
var ensureTool = util.ensureTool;
var rm = util.rm;
var test = util.test;

// node min version
var minNodeVer = '8.12.0';
if (semver.lt(process.versions.node, minNodeVer)) {
    fail('requires node >= ' + minNodeVer + '.  installed: ' + process.versions.node);
}

// add node modules .bin to the path so we can dictate version of tsc etc...
var binPath = path.join(__dirname, 'node_modules', '.bin');
if (!test('-d', binPath)) {
    fail('node modules bin not found.  ensure npm install has been run.');
}
addPath(binPath);

//
// Analyze the Node.js dependencies and generate the graph (deps.json file).
//
// ex: node make.js analyze
//
target.analyze = function() {
    // check the minimum required Node.js version
    ensureTool('npm', '--version', function (output) {
        if (semver.lt(output, '6.4.1')) {
            fail('Expected 6.4.1 or higher. To fix, run: npm install npm');
        }
    });

    // load existing data/deps.json file
    var deps = {};
    var targetFile = path.join(dataPath, 'deps.json');
    if (test('-f', targetFile)) {
        console.log("Existing data/deps.json file is loaded");
        deps = JSON.parse(fs.readFileSync(targetFile, { encoding: "utf-8" }));
    }

    // get the list of Node.js tags on GitHub repository
    try {

        var getTagsUrl = nodejsRepository + "/git/refs/tags";
        while (getTagsUrl !== null) {

            // get tags list
            var content = executeGetQuery(getTagsUrl, gitHubAccessToken);
            var tags = JSON.parse(content.getBody());

            // process each tag
            tags.forEach(element => {

                // extract the version number
                var version_regex = /refs\/tags\/v(.+)/g;
                var version_match = version_regex.exec(element["ref"]);
                if (version_match != null) {

                    // only unprocessed release will be processed to preserve GitHub APIs rate limit
                    var version = version_match[1];
                    if (deps[version] == null) {

                        // get dependencies data for this version
                        deps[version] = getDependenciesData(version, version);

                    } else {

                        console.log("Skip version '" + version + "', it is already processed");

                    }

                }

            });

            // extract the URL for the next results (paginated)
            getTagsUrl = null;
            var linkHeader = content.headers["link"];
            if (linkHeader != null) {
                var split = linkHeader.split(",");
                split.forEach(element => {
                    var url_regex = /<(.+)>; rel=\"next\"/g;
                    var url_match = url_regex.exec(element);
                    if (url_match != null) {
                        getTagsUrl = url_match[1];
                    }
                });
            }

            if (getTagsUrl === null) {
                console.log("All available versions are processed!")
            }
        }

    } catch(err) {

        // only print the error into the console
        // the GitHub APIs rate limit (60 queries by IP each hour) is maybe reached
        // you can run again the script after that and only unprocessed items will be processed (delta)
        console.error(err);

    } finally {

        // save the generated json object into deps.json file
        if (test('-f', targetFile)) {
            // delete previous deps.json file
            rm('-f', targetFile);
        }
        fs.writeFileSync(targetFile, JSON.stringify(deps), { encoding: "utf-8"});
        console.log("The file 'data/deps.json' was successfully created!");

    }
}

function getDependenciesData(version, ref) {
    console.log("Processing version '" + version + "' ...");

    // get content list
    var entry = null;
    try {
        var getContentUrl = nodejsRepository + "/contents/deps/npm/package.json?ref=v" + ref;
        var content = executeGetQuery(getContentUrl, gitHubAccessToken);
        entry = JSON.parse(content.getBody());
    } catch(err) {
        // do nothing if the file does not exist for this ref
        return { };
    } 

    // decoder of content
    var buf = Buffer.from(entry["content"], entry["encoding"]);

    // extract NPM version
    var npmData = JSON.parse(buf.toString());
    
    return { "NPM": npmData["version"] };
}