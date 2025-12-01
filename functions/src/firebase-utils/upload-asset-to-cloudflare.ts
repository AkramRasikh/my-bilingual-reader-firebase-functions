import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUD_FLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUD_FLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUD_FLARE_SECRET_ACCESS_KEY,
  },
});

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

export const deleteAssetFromCloudFlare = async (cloudflarePath) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUD_FLARE_R2_BUCKET_NAME,
      Key: cloudflarePath,
    });

    const response = await s3.send(command);
    console.log(`## 🗑️ File deleted successfully: ${cloudflarePath}`, response);
  } catch (error) {
    console.error('## ❌ Delete failed:', error);
  }
};
