const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

app.get('/', (req, res) => res.send('OK'));

app.post('/render', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'background', maxCount: 1 }
]), (req, res) => {
  const text = req.body.text || '';
  const audioPath = req.files['audio'][0].path;
  const bgPath = req.files['background'] ? req.files['background'][0].path : null;
  const outputPath = `outputs/video_${Date.now()}.mp4`;
  const srtPath = `uploads/sub_${Date.now()}.srt`;
  const bgVideoPath = `uploads/bgvideo_${Date.now()}.mp4`;

  ffmpeg.ffprobe(audioPath, (err, metadata) => {
    const duration = metadata?.format?.duration || 30;
    const words = text.split(' ');
    const wordsPerChunk = 3;
    const chunks = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
    }
    const timePerChunk = duration / chunks.length;

    let srt = '';
    chunks.forEach((chunk, i) => {
      const start = i * timePerChunk;
      const end = start + timePerChunk;
      const fmt = s => {
        const m = Math.floor(s / 60);
        const sec = (s % 60).toFixed(3).replace('.', ',').padStart(6, '0');
        return `00:${String(m).padStart(2,'0')}:${sec}`;
      };
      srt += `${i+1}\n${fmt(start)} --> ${fmt(end)}\n${chunk}\n\n`;
    });
    fs.writeFileSync(srtPath, srt);

    const renderVideo = (inputPath, isVideo) => {
      const cmd = ffmpeg();
      if (isVideo) {
        cmd.input(inputPath)
          .inputOptions(['-stream_loop -1']);
  } else {
    cmd.input(`color=c=0x0a0a0f:size=480x854:rate=24`)
      .inputOptions(['-f lavfi', `-t ${duration}`]);
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
          `-vf scale=480:854:force_original_aspect_ratio=increase,crop=480:854,subtitles=${srtPath}:force_style='FontSize=20,PrimaryColour=&H00ff88&,OutlineColour=&H000000&,Outline=2,Alignment=2,Bold=1,MarginV=200'`
        ])
        .output(outputPath)
        .on('end', () => {
          res.download(outputPath, 'tiktok.mp4', () => {
            try {
              fs.unlinkSync(outputPath);
              fs.unlinkSync(audioPath);
              fs.unlinkSync(srtPath);
              if (bgPath) fs.unlinkSync(bgPath);
              if (fs.existsSync(bgVideoPath)) fs.unlinkSync(bgVideoPath);
            } catch(e) {}
          });
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message);
          res.status(500).json({ error: err.message });
        })
        .run();
    };

    if (bgPath) {
      // Конвертируй картинку в видео нужной длины
      ffmpeg()
        .input(bgPath)
        .inputOptions(['-f image2'])
        .outputOptions([
          `-t ${duration}`,
          '-c:v libx264',
          '-preset ultrafast',
          '-pix_fmt yuv420p',
          '-vf scale=480:854:force_original_aspect_ratio=increase,crop=480:854',
          '-r 24'
        ])
        .output(bgVideoPath)
        .on('end', () => renderVideo(bgVideoPath, true))
        .on('error', () => renderVideo(null, false))
        .run();
    } else {
      renderVideo(null, false);
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Port ${PORT}`));
