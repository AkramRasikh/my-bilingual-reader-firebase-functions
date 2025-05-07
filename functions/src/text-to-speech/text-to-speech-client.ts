import textToSpeech from '@google-cloud/text-to-speech';
import config from '../config';

export const textToSpeechClient = new textToSpeech.TextToSpeechClient({
  credentials: JSON.parse(config.googleTranslateAccount),
});
