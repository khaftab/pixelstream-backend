import { File } from "../models/file";
import { TranscodingStatusEnum, UploadStatusEnum } from "../utils/types";
type CreateUploadInput = {
  userId: string;
  originalFileName: string;
  safeFileName: string;
  s3Key: string;
  fileType: string;
  fileSize: number;
  duration: number;
};
export const createUpload = async ({
  userId,
  originalFileName,
  safeFileName,
  s3Key,
  fileSize,
  fileType,
  duration,
}: CreateUploadInput) => {
  try {
    const file = new File({
      user: userId,
      originalFileName,
      safeFileName,
      s3Key,
      fileType,
      fileSize,
      duration,
      uploadStatus: UploadStatusEnum.PENDING,
      trancodingStatus: TranscodingStatusEnum.PENDING,
    });
    await file.save();
    return file;
  } catch (error) {
    console.error("Error updating file database", error);
  }
};
