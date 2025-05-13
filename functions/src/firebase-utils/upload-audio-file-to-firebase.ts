import admin from 'firebase-admin';
import { getAudioFolderViaLang } from '../utils/get-media-folders';
import config from '../config';

export const uploadAudioFileToFirebase = async ({ language, buffer, id }) => {
  try {
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
  } catch (error) {
    throw new Error(`Error uploading audio file to firebase`);
  }
};
