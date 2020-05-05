const CopyPlugin = require('copy-webpack-plugin');
const paths = require('./paths');
const appPackageJson = require(paths.appPackageJson);

function getCopyWebpackPluginInstance(outputDir) {
  return new CopyPlugin(getLicenseFiles(outputDir))
}

function getLicenseFiles(outputDir){
  const filenames = appPackageJson['react-scripts'].includeInBuild ? 
                        appPackageJson['react-scripts'].includeInBuild : [];

  return filenames.map((file) => {
    return { from: file, to: outputDir }
  });
}

module.exports = getCopyWebpackPluginInstance;
