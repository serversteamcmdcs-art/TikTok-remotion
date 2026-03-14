const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');
if (!fs.existsSync('backgrounds')) fs.mkdirSync('backgrounds');

// Скачай фоновое видео при старте
const BG_PATH = 'backgrounds/bg.mp4';
const BG_URL = 'https://www.pexels.com/download/video/3141208/';

function downloadBg() {
  if (fs.existsSync(BG_PATH)) return;
  const file = fs.createWriteStream(BG_PATH);
  https.get(BG_URL, res => res.pipe(file));
}
downloadBg();

app.get('/', (req, res) => res.send('OK'));

app.post('/render', upload.single('audio'), (req, res) => {
  const text = req.body.text || '';
  const audioPath = req.file.path;
  const outputPath = `outputs/video_${Date.now()}.mp4`;
  const srtPath = `uploads/sub_${Date.now()}.srt`;

  // Создай субтитры
  const words = text.split(' ');
  let srt = '';
  words.forEach((word, i) => {
    const start = i * 0.5;
    const end = start + 0.5;
    const fmt = s => {
      const m = Math.floor(s / 60);
      const sec = (s % 60).toFixed(3).replace('.', ',').padStart(6, '0');
      return `00:${String(m).padStart(2,'0')}:${sec}`;
    };
    srt += `${i+1}\n${fmt(start)} --> ${fmt(end)}\n${word}\n\n`;
  });
  fs.writeFileSync(srtPath, srt);

  const hasBg = fs.existsSync(BG_PATH);

  const cmd = ffmpeg();

  if (hasBg) {
    cmd.input(BG_PATH).inputOptions(['-stream_loop -1']);
  } else {
    cmd.input('color=c=0x1a1a2e:size=480x854:rate=24').inputOptions(['-f lavfi']);
  }

  cmd.input(audioPath)
    .outputOptions([
      '-c:v libx264',
      '-preset ultrafast',
      '-crf 35',
      '-c:a aac',
      '-b:a 64k',
      '-shortest',
      '-pix_fmt yuv420p',
      '-threads 1',
      `-vf scale=480:854:force_original_aspect_ratio=decrease,pad=480:854:(ow-iw)/2:(oh-ih)/2,subtitles=${srtPath}:force_style='FontSize=18,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2,Alignment=2,Bold=1'`
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
      console.error('FFmpeg error:', err.message);
      res.status(500).json({ error: err.message });
    })
    .run();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Port ${PORT}`));
