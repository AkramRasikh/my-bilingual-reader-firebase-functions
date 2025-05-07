import { TranslationServiceClient } from '@google-cloud/translate';
import config from '../config';

export const translationClient = new TranslationServiceClient({
  credentials: JSON.parse(config.googleTranslateAccount),
});
