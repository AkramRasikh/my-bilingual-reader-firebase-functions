import admin from 'firebase-admin';
import fs from 'fs';
import util from 'util';
import { Request, Response } from 'express';
import { googleLanguagesVoicesKey, languageVoices } from '../language-keys';
import { getAudioFolderViaLang } from '../utils/get-media-folders';
import { textToSpeechClient } from '../service-clients/text-to-speech-client';
import { routeValidator } from '../shared-validation/route-validator';
import { textToSpeechValidation } from './validation';

export async function synthesizeSpeech({ language, text, id }): Promise<any> {
  const random = Math.floor(Math.random() * languageVoices[language].length);

  const voice = languageVoices[language][random];
  const request = {
    input: { text },
    voice: {
      languageCode: googleLanguagesVoicesKey[language],
      name: voice,
    },
    audioConfig: { audioEncoding: 'MP3' },
  } as any;

  const tempFilePath = `/tmp/${id}.mp3`;

  try {
    const [response] = (await textToSpeechClient.synthesizeSpeech(
      request,
    )) as any;
    const writeFile = util.promisify(fs.writeFile);
    const filePath = getAudioFolderViaLang(language) + '/' + id + '.mp3';
    await writeFile(tempFilePath, response.audioContent, 'binary');

    const storage = admin.storage();

    const bucketName = process.env.BUCKETNAME;
    const buffer = fs.readFileSync(tempFilePath);

    await storage
      .bucket(bucketName)
      .file(filePath)
      .save(buffer, {
        metadata: {
          contentType: 'audio/mpeg',
        },
      });
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    console.log('Audio content written to file: output.mp3');
    return url;
  } catch (error) {
    console.log('## error', error);
  } finally {
    try {
      fs.unlinkSync(tempFilePath); // Clean up the temporary file
      console.log('## Temporary file deleted.');
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }
  }
}

export const textToSpeechRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const isValid = await routeValidator(req, res, textToSpeechValidation);
    if (!isValid) {
      return;
    }
    const { text, language, id } = req.body;
    const url = await synthesizeSpeech({ text, language, id });
    res.json({
      url,
    });
  } catch (error) {
    res.send(404);
  }
};
