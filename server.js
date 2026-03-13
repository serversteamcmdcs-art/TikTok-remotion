const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

app.post('/render', upload.single('audio'), async (req, res) => {
  try {
    const text = req.body.text;
    const audioPath = path.resolve(req.file.path);
    const outputPath = path.join('outputs', `video_${Date.now()}.mp4`);

    if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

    const { render } = require('./render.js');
    await render(text, audioPath, outputPath);

    res.download(outputPath, 'video.mp4', () => {
      try {
        fs.unlinkSync(outputPath);
        fs.unlinkSync(audioPath);
      } catch(e) {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Port ${PORT}`));
