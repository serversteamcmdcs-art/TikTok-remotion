const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

app.get('/', (req, res) => res.send('OK'));

app.post('/render', upload.single('audio'), (req, res) => {
  const audioPath = req.file.path;
  const outputPath = `outputs/video_${Date.now()}.mp4`;

  ffmpeg()
    .input('color=c=black:size=1080x1920:rate=30')
    .inputOptions(['-f lavfi'])
    .input(audioPath)
    .outputOptions([
      '-c:v libx264',
      '-c:a aac',
      '-shortest',
      '-pix_fmt yuv420p'
    ])
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, 'tiktok.mp4', () => {
        try {
          fs.unlinkSync(outputPath);
          fs.unlinkSync(audioPath);
        } catch(e) {}
      });
    })
    .on('error', (err) => {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Port ${PORT}`));
