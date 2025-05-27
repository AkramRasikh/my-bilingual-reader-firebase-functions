import { pinyin } from 'pinyin-pro';
import { chinese, googleLanguagesKey, japanese } from '../../language-keys';
import config from '../../config';
import japJs from 'jap-js';
import { translationClient } from '../../service-clients/translation-service-client';
import { deepSeekKanjiToPhonetic } from '../../japanese-utils/kanji-to-phonetic-ai';

export const getGoogleTranslate = async ({ word, language }) => {
  const fromLanguage = googleLanguagesKey[language];
  const request = {
    parent: `projects/${config.projectId}`,
    contents: [word],
    mimeType: 'text/plain',
    sourceLanguageCode: fromLanguage,
    targetLanguageCode: 'en',
  };

  let phonetic;
  let transliteration;

  try {
    const [translation] = await translationClient.translateText(request);
    const definition = translation.translations[0].translatedText;

    if (language !== chinese) {
      const [romanized] = await translationClient.romanizeText(request);
      transliteration = romanized.romanizations[0].romanizedText;
    } else {
      transliteration = pinyin(word);
    }

    if (language === japanese) {
      const hasKanji = japJs.hasKanji(word);

      if (hasKanji) {
        phonetic = await deepSeekKanjiToPhonetic({ word });
      } else {
        phonetic = word;
      }
    }

    return { definition, transliteration, phonetic };
  } catch (error) {
    throw new Error(error || 'Error getting google translation');
  }
};
