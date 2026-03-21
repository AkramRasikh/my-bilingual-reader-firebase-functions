import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from './cloudflare-s3-client';

export const deleteAssetFromCloudFlare = async (cloudflarePath: string) => {
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
  