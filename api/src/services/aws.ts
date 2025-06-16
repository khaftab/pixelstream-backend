import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
require("dotenv").config();

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const generatePresignedUrl = async (s3Key: string) => {
  /* 
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    ContentType: "video/",
  });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
  */
  // The above presigned URL is also valid but lacks the ability to restrict max upload size. It can only have fixed size uploads. (By setting ContentLength)
  try {
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
      Conditions: [
        ["content-length-range", 0, 50 * 1024 * 1024], // 0 - 50MB limit
      ],
      Expires: 3600, // 1 hour
    });

    return { url, fields };
  } catch (error) {
    console.error("Error generating presigned URL", error);
    throw error;
  }
};
