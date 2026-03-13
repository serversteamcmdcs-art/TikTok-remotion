import { AbsoluteFill, Audio, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';

export const TikTokVideo = ({ text, audioPath }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(' ');
  const wordsPerSecond = 2.5;
  const currentWordIndex = Math.floor((frame / fps) * wordsPerSecond);
  const currentWord = words[Math.min(currentWordIndex, words.length - 1)];

  const opacity = interpolate(frame, [0, 10], [0, 1]);

  return (
    <AbsoluteFill style={{
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
      opacity
    }}>
      {audioPath && <Audio src={audioPath} />}

      <div style={{
        position: 'absolute',
        bottom: 300,
        left: 40,
        right: 40,
        textAlign: 'center'
      }}>
        <span style={{
          color: '#FFFFFF',
          fontSize: 80,
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(0,255,136,0.8)',
          fontFamily: 'Arial'
        }}>
          {currentWord}
        </span>
      </div>

      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(0,255,136,0.05) 0%, transparent 50%, rgba(0,255,136,0.05) 100%)'
      }} />
    </AbsoluteFill>
  );
};
