import { Request, Response } from "express";
import { generatePresignedUrl } from "../services/aws";
import { createUpload } from "../services/file";
import { UploadStatusEnum } from "../utils/types";
import { File } from "../models/file";
import { s3Client } from "../services/aws";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { isAllowedToUpload } from "../services/user";
import { generateSafeFileName } from "../utils/generateSafeFileName";
import { User } from "../models/user";

export const presignedUrl = async (req: Request, res: Response) => {
  const { fileName, fileType, duration } = req.body;
  if ((await isAllowedToUpload(req.currentUser!.userId)) === false) {
    res.status(400).json({
      message: "You are not allowed to add files. Please contact admin",
    });
    return;
  }
  const safeFileName = generateSafeFileName(fileName);
  const s3Key = `uploads/${req.currentUser?.userId}/${safeFileName}`;

  // Create DB record first
  const uploadRecord = await createUpload({
    userId: req.currentUser!.userId,
    originalFileName: fileName,
    safeFileName,
    s3Key,
    fileSize: 0, // Placeholder value
    fileType, // Placeholder value
    duration,
  });
  if (!uploadRecord) {
    res.status(500).json({ message: "Error creating upload record" });
    return;
  }
  const presignedUrl = await generatePresignedUrl(s3Key);

  res
    .status(200)
    .json({ url: presignedUrl.url, fields: presignedUrl.fields, uploadId: uploadRecord._id });
};

export const confirmUpload = async (req: Request, res: Response) => {
  console.log("Confirming upload...");

  try {
    const { uploadId } = req.params;

    // 1. Find the upload record
    const upload = await File.findOne({
      _id: uploadId,
      user: req.currentUser!.userId,
      uploadStatus: UploadStatusEnum.PENDING,
    });

    // decrease the upload count
    const user = await User.findById(req.currentUser!.userId);
    if (user) {
      user.uploadCount -= 1;
      await user.save();
    }

    if (!upload) {
      res.status(404).json({
        message: "Upload record not found or already processed",
      });
      return;
    }
    // console.log("Upload found:", upload);

    // 2. Verify the S3 object exists
    const headCommand = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: upload.s3Key,
    });

    const s3Metadata = await s3Client.send(headCommand);

    // 3. Update database record
    const updatedUpload = await File.findByIdAndUpdate(
      uploadId,
      {
        $set: {
          uploadStatus: UploadStatusEnum.COMPLETED,
          fileSize: s3Metadata.ContentLength,
        },
      },
      { new: true }
    );

    // 4. Optional: Add additional processing here
    // (e.g., trigger video encoding, send notifications, etc.)

    res.status(201).json({
      // message: "Upload confirmed successfully",
      // upload: updatedUpload,
      safeFileName: updatedUpload?.safeFileName.split(".")[0],
    });
  } catch (error: any) {
    console.error("Confirmation error:", error);

    // Handle specific AWS errors
    if (error.name === "NotFound") {
      res.status(404).json({
        message: "File not found in S3 storage",
      });
      return;
    }

    if (error.name === "Forbidden") {
      res.status(403).json({
        message: "Access to S3 resource denied",
      });
      return;
    }

    res.status(500).json({
      message: error.message,
    });
  }
};
