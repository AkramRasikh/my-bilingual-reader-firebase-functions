import { Request, Response } from 'express';
import { chinese, googleLanguagesKey } from '../language-keys';
import { translationClient } from '../service-clients/translation-service-client';
import { pinyin } from 'pinyin-pro';
import config from '../config';
import { routeValidator } from '../shared-validation/route-validator';
import { translateTextValidation } from './validation';

export const translateTextRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const isValid = await routeValidator(req, res, translateTextValidation);
    if (!isValid) {
      return;
    }

    const { text, language } = req.body;
    const sourceLanguage = googleLanguagesKey[language];

    const baseTranslationRequest = {
      parent: `projects/${config.projectId}`,
      contents: [text],
      mimeType: 'text/plain',
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: 'en',
    };

    let transliteration;

    const [response] = await translationClient.translateText(
      baseTranslationRequest,
    );

    if (language !== chinese) {
      const [romanized] = await translationClient.romanizeText(
        baseTranslationRequest,
      );
      transliteration = romanized.romanizations[0].romanizedText;
    } else {
      transliteration = pinyin(text);
    }

    res.json({
      translation: response.translations[0].translatedText,
      transliteration,
    });
  } catch (error) {
    res.status(500).json({ error: error?.message || 'Error translating text' });
  }
};
