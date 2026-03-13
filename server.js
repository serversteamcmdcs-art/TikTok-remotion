const express = require('express');
const app = express();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

app.use(express.json());

app.post('/render', upload.single('audio'), async (req, res) => {
  try {
    const text = req.body.text;
    const audioPath = req.file.path;
    const outputPath = path.join('outputs', `video_${Date.now()}.mp4`);

    if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

    const bundled = await bundle(path.join(__dirname, 'src/index.js'));

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

    res.download(outputPath, () => {
      fs.unlinkSync(outputPath);
      fs.unlinkSync(audioPath);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Remotion TikTok Server running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
