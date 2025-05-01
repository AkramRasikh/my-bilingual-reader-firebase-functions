import admin from 'firebase-admin';
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';
import { googleLanguagesVoicesKey, languageVoices } from './language-keys';
import { getAudioFolderViaLang } from './utils';
import * as dotenv from 'dotenv';

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  ),
  databaseURL: process.env.DB_URL,
});

export const db = admin.database();

const client = new textToSpeech.TextToSpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_TRANSLATE_ACCOUNT), // Securely store in Firebase config
});

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
    const [response] = (await client.synthesizeSpeech(request)) as any;
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
