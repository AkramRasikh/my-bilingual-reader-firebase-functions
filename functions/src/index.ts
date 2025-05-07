import * as functions from 'firebase-functions';
import { TranslationServiceClient } from '@google-cloud/translate';
import { Request, Response } from 'express';
import { pinyin } from 'pinyin-pro';
import { synthesizeSpeech } from './text-to-speech';
import { onLoadDataRoute } from './on-load-data';
import config from './config';
import { googleLanguagesKey } from './language-keys';

exports.translateText = functions.https.onRequest(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, language } = req.body;
      const fromLanguage = googleLanguagesKey[language];

      if (!text || !language) {
        res.status(400).json({ error: 'Missing text or language' });
        return;
      }

      const request = {
        parent: `projects/${process.env.PROJECT_ID}`,
        contents: [text],
        mimeType: 'text/plain',
        sourceLanguageCode: fromLanguage,
        targetLanguageCode: 'en',
      };
      let transliteration;

      const [response] = await translationClient.translateText(request);

      if (language !== 'chinese') {
        const [romanized] = await translationClient.romanizeText(request);
        transliteration = romanized.romanizations[0].romanizedText;
      } else {
        transliteration = pinyin(text);
      }

      res.json({
        translation: response.translations[0].translatedText,
        transliteration,
      });
    } catch (error) {
      console.error('Translation Error:', error);
      res.status(500).json({ error: error.message });
    }
  },
);

exports.textToSpeech = functions.https.onRequest(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, language, id } = req.body;

      if (!text || !language || !id) {
        res.status(400).json({ error: 'Missing text or language' });
        return;
      }
      const url = await synthesizeSpeech({ text, language, id });
      res.json({
        url,
      });
    } catch (error) {
      res.send(404);
    }
  },
);

exports.getOnLoadData = functions.https.onRequest(onLoadDataRoute);
