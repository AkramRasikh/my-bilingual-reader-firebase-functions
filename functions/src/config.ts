import * as dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

dotenv.config({ path: envFile, override: true });

const config = {
  googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT,
  googleTranslateAccount: process.env.GOOGLE_TRANSLATE_ACCOUNT,
  dbUrl: process.env.DB_URL,
  projectId: process.env.PROJECT_ID,
  bucketName: process.env.BUCKETNAME,
  openAiKey: process.env.OPENAI_KEY,
  deepSeekKey: process.env.DEEPSEEK_KEY,
};

export default config;
