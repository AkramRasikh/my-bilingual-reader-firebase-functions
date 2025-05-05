import admin from 'firebase-admin';
import config from './config';

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(config.googleServiceAccount)),
  databaseURL: config.dbUrl,
});

export const db = admin.database();
