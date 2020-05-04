const CopyPlugin = require('copy-webpack-plugin');

function getCopyWebpackPluginInstance(outputDir) {
  return new CopyPlugin(getLicenseFiles(outputDir))
}

function getLicenseFiles(outputDir){
  const filenames = [
    'EULA.pdf',
    'Acknowledgments.txt',
    'Third-Party License Agreements.txt',
    'InstalledPackages.json'
  ];

  return filenames.map((file) => {
    return { from: file, to: outputDir }
  });
}

module.exports = getCopyWebpackPluginInstance;
