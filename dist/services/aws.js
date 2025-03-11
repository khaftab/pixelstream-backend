"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePresignedUrl = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
require("dotenv").config();
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const generatePresignedUrl = (s3Key) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(exports.s3Client, {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key,
            Conditions: [
                ["content-length-range", 0, 50 * 1024 * 1024], // 0 - 50MB limit
            ],
            Expires: 3600, // 1 hour
        });
        return { url, fields };
    }
    catch (error) {
        console.error("Error generating presigned URL", error);
        throw error;
    }
});
exports.generatePresignedUrl = generatePresignedUrl;
