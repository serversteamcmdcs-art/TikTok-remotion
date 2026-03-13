const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

app.get('/', (req, res) => res.send('FFmpeg TikTok Server OK'));

app.post('/render', upload.single('audio'), async (req, res) => {
  const text = req.body.text || '';
  const audioPath = req.file.path;
  const outputPath = `outputs/video_${Date.now()}.mp4`;

  const words = text.split(' ');
  const subtitles = words.map((word, i) => {
    const start = i * 0.4;
    const end = start + 0.4;
    const toTime = s => {
      const m = Math.floor(s / 60);
      const sec = (s % 60).toFixed(3).padStart(6, '0');
      return `00:${String(m).padStart(2,'0')}:${sec}`;
    };
    return `${i+1}\n${toTime(start)} --> ${toTime(end)}\n${word}\n`;
  }).join('\n');

  const srtPath = `uploads/sub_${Date.now()}.srt`;
  fs.writeFileSync(srtPath, subtitles);

  ffmpeg()
    .input('color=black:size=1080x1920:rate=30')
    .inputOptions(['-f lavfi'])
    .input(audioPath)
    .outputOptions([
      '-c:v libx264',
      '-c:a aac',
      '-shortest',
      `-vf subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&Hffffff&,Alignment=2'`,
      '-pix_fmt yuv420p'
    ])
    .output(outputPath)
    .on('end', () => {
      res.download(outputPath, 'tiktok.mp4', () => {
        try {
          fs.unlinkSync(outputPath);
          fs.unlinkSync(audioPath);
          fs.unlinkSync(srtPath);
        } catch(e) {}
      });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: err.message });
    })
    .run();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
