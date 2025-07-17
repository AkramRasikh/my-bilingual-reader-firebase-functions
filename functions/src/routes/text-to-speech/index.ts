import fs from 'fs';
import util from 'util';
import { Request, Response } from 'express';
import { googleLanguagesVoicesKey, LanguageTypes } from '../../language-keys';
import { getRandomViableVoice } from '../../utils/get-random-language';
import { textToSpeechClient } from '../../service-clients/text-to-speech-client';
import { routeValidator } from '../../shared-validation/route-validator';
import { textToSpeechValidation } from './validation';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import { getAudioFolderViaLang } from '../../utils/get-media-folders';
import { uploadAssetToCloudFlare } from '../../firebase-utils/upload-asset-to-cloudflare';

interface SynthesizeSpeechProps {
  language: LanguageTypes;
  text: string;
  id: string;
}

const cleanUpSynthesizeSpeech = (tempFilePath: string) => {
  try {
    fs.unlinkSync(tempFilePath);
  } catch (unlinkError) {
    console.error('Error deleting temporary file:', unlinkError);
  }
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
    const audioContent = response?.audioContent;
    if (!audioContent) {
      throw new Error('Error getting audio content from Google');
    }

    const writeFile = util.promisify(fs.writeFile);
    await writeFile(tempFilePath, audioContent, 'binary');
    // const buffer = fs.readFileSync(tempFilePath);
    console.log('## Audio content written to file: output.mp3');
    const filePath = getAudioFolderViaLang(language) + '/' + id + '.mp3';
    await uploadAssetToCloudFlare({ tempFilePath, cloudflarePath: filePath });
    console.log('## output.mp3 cleaned up');
    cleanUpSynthesizeSpeech(tempFilePath);
    return filePath;
  } catch (error) {
    throw new Error(
      error?.message || `Error uploading audio file for ${language}`,
    );
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
    res
      .status(500)
      .json({ error: error?.message || 'Error synethizing text to speech' });
  }
};
