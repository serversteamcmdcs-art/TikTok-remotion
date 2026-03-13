import { Composition } from 'remotion';
import { TikTokVideo } from './TikTokVideo';

export const RemotionRoot = () => {
  return (
    <Composition
      id="TikTok"
      component={TikTokVideo}
      durationInFrames={1350}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        text: 'Тестовый текст',
        audioPath: ''
      }}
    />
  );
};
