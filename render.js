const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');

const render = async (text, audioPath, outputPath) => {
  const bundled = await bundle({
    entryPoint: path.join(__dirname, 'src/index.js'),
    webpackOverride: (config) => config
  });

  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'TikTok',
    inputProps: { text, audioPath }
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: { text, audioPath }
  });
};

module.exports = { render };
