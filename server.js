const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

app.get('/', (req, res) => res.send('OK'));

app.post('/render', upload.single('audio'), (req, res) => {
  const text = req.body.text || '';
  const audioPath = req.file.path;
  const outputPath = `outputs/video_${Date.now()}.mp4`;
  const srtPath = `uploads/sub_${Date.now()}.srt`;

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

  ffmpeg()
    .input('color=c=0x0a0a0f:size=480x854:rate=24')
    .inputOptions(['-f lavfi'])
    .input(audioPath)
    .outputOptions([
      '-c:v libx264',
      '-preset ultrafast',
      '-crf 35',
      '-c:a aac',
      '-b:a 64k',
      '-shortest',
      '-pix_fmt yuv420p',
      '-threads 1',
      `-vf subtitles=${srtPath}:force_style='FontSize=20,PrimaryColour=&H00ff88&,OutlineColour=&H000000&,Outline=2,Alignment=2,Bold=1,MarginV=200'`
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
