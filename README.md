# Node.js Dependencies Tool

This tool analyzes the official Node.js GitHub repository to extract the dependencies graph into a JSON file. A Web page allows you to navigate into the dependencies: you can display all dependencies for one version of Node.js or display Node.js versions that contain natively a target dependency (versionned).

## Prerequisite

You need to have a GitHub OAuth2 token for authentication to prevent API rate limit.

To create an OAuth2 token, uses this command:

```
curl -u "YourUserName" -X POST https://api.github.com/authorizations --data '{ "scopes": [ "public_repo" ], "note": "admin script" }'
```

From the JSON result, copy the property "token" into the variable `gitHubAccessToken` in the `make.js` script.

## How to run this tool

First step is to install required dependencies:

```
npm install
```

To analyze and build JSON data file, run the command:

```
npm run analyze
```

In the `data` directory, the file `deps.json` will be generated. You can use the `index.html` to explore the data.


## Use the tool

You can use [this page](https://ChristopheLav.github.io/Node.js-Deps-Tool) - that is the last available version of the tool and the last Node.js dependencies graph data.

## Changelog

The changelog is available [here](CHANGELOG.md).