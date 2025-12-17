import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// Enable playback in silence mode on iOS
Sound.setCategory('Playback');

let successSound: Sound | null = null;

const initSuccessSound = (): Promise<Sound> => {
  return new Promise((resolve, reject) => {
    if (successSound) {
      resolve(successSound);
      return;
    }

    const sound = new Sound('success_83493.mp3', Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.warn('Failed to load success sound:', error);
        reject(error);
        return;
      }
      successSound = sound;
      resolve(sound);
    });
  });
};

export const SoundService = {
  playSuccess: async (): Promise<void> => {
    try {
      const sound = await initSuccessSound();
      sound.stop(() => {
        sound.play(success => {
          if (!success) {
            console.warn('Sound playback failed');
          }
        });
      });
    } catch (error) {
      console.warn('Failed to play success sound:', error);
    }
  },

  release: () => {
    if (successSound) {
      successSound.release();
      successSound = null;
    }
  },
};
