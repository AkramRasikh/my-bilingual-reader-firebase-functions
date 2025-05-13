import { languageVoices, VoiceType } from '../language-keys';

export const getRandomViableVoice = (language) => {
  const randomViableVoice = Math.floor(
    Math.random() * languageVoices[language].length,
  );

  const voice = languageVoices[language][randomViableVoice] as VoiceType;
  return voice;
};
