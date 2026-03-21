import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

import { s3 } from './cloudflare-s3-client';

export const uploadAssetToCloudFlare = async ({
  tempFilePath,
  cloudflarePath,
}) => {
  const fileStream = fs.createReadStream(tempFilePath);

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUD_FLARE_R2_BUCKET_NAME,
      Key: cloudflarePath,
      Body: fileStream,
      ContentType: 'audio/mpeg',
    });

    const response = await s3.send(command);
    console.log('## ✅ File uploaded successfully:', response);
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
};

