import admin from 'firebase-admin';
import fs from 'fs';
import util from 'util';
import { Request, Response } from 'express';
import {
  googleLanguagesVoicesKey,
  LanguageTypes,
  languageVoices,
  VoiceType,
} from '../language-keys';
import { getAudioFolderViaLang } from '../utils/get-media-folders';
import { textToSpeechClient } from '../service-clients/text-to-speech-client';
import { routeValidator } from '../shared-validation/route-validator';
import { textToSpeechValidation } from './validation';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import config from '../config';

interface SynthesizeSpeechProps {
  language: LanguageTypes;
  text: string;
  id: string;
}

const uploadAudioFileToFirebase = async ({ language, buffer, id }) => {
  const storage = admin.storage();
  const bucketName = config.bucketName;
  const filePath = getAudioFolderViaLang(language) + '/' + id + '.mp3';
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
  return url;
};

const cleanUpSynthesizeSpeech = (tempFilePath) => {
  try {
    fs.unlinkSync(tempFilePath); // Clean up the temporary file
    console.log('## Temporary file deleted.');
  } catch (unlinkError) {
    console.error('Error deleting temporary file:', unlinkError);
  }
};

const getRandomViableVoice = (language) => {
  const randomViableVoice = Math.floor(
    Math.random() * languageVoices[language].length,
  );

  const voice = languageVoices[language][randomViableVoice] as VoiceType;
  return voice;
};

export async function synthesizeSpeech({
  language,
  text,
  id,
}: SynthesizeSpeechProps): Promise<any> {
  const voice = getRandomViableVoice(language);

  if (!voice) {
    throw new Error(`Error getting random voice for ${language}`);
  }

  const tempFilePath = `/tmp/${id}.mp3`;

  const synthesizeSpeechRequest = {
    input: {
      text,
    },
    voice: {
      languageCode: googleLanguagesVoicesKey[language],
      name: voice,
    },
    audioConfig: {
      audioEncoding: 'MP3',
    } as google.cloud.texttospeech.v1.IAudioConfig,
  };

  try {
    const [response] = await textToSpeechClient.synthesizeSpeech(
      synthesizeSpeechRequest,
    );
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(tempFilePath, response.audioContent, 'binary');
    const buffer = fs.readFileSync(tempFilePath);
    const url = await uploadAudioFileToFirebase({
      buffer,
      language,
      id,
    });
    console.log('Audio content written to file: output.mp3');
    return url;
  } catch (error) {
    console.log('## error', error);
  } finally {
    console.log('## finally');
    cleanUpSynthesizeSpeech(tempFilePath);
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
    console.log('## textToSpeechRoute 3', req.body);
    const { text, language, id } = req.body;
    const url = await synthesizeSpeech({ text, language, id });
    res.json({
      url,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: error?.message || 'Error synethizing text to speech' });
  }
};
