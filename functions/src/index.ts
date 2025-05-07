import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import { synthesizeSpeech } from './text-to-speech';
import { onLoadDataRoute } from './on-load-data';
import { translateTextRoute } from './translate-text';

exports.translateText = functions.https.onRequest(translateTextRoute);

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
