import { Platform } from 'react-native';

let Sound: any = null;
let successSound: any = null;
let soundInitialized = false;

const loadSoundModule = async (): Promise<boolean> => {
  if (Sound !== null) {
    return true;
  }

  try {
    Sound = require('react-native-sound').default;
    Sound.setCategory('Playback');
    soundInitialized = true;
    return true;
  } catch (error) {
    console.warn('react-native-sound not available:', error);
    return false;
  }
};

const initSuccessSound = async (): Promise<any> => {
  const loaded = await loadSoundModule();
  if (!loaded || !Sound) {
    throw new Error('Sound module not available');
  }

  return new Promise((resolve, reject) => {
    if (successSound) {
      resolve(successSound);
      return;
    }

    const sound = new Sound(
      'success_83493.mp3',
      Sound.MAIN_BUNDLE,
      (error: any) => {
        if (error) {
          console.warn('Failed to load success sound:', error);
          reject(error);
          return;
        }
        successSound = sound;
        resolve(sound);
      },
    );
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
