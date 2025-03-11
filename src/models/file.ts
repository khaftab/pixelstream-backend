import { Document, Schema, model, Types } from "mongoose";
import { TranscodingStatusEnum, UploadStatusEnum } from "../utils/types";

// Define the interface
export interface IFile extends Document {
  user: Types.ObjectId;
  originalFileName: string;
  safeFileName: string;
  s3Key: string;
  fileType: string;
  fileSize: number;
  duration: number;
  uploadStatus: UploadStatusEnum;
  transcodingStatus: TranscodingStatusEnum;
  hlsurl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema with TypeScript
const fileSchema = new Schema<IFile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    safeFileName: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    uploadStatus: {
      type: String,
      enum: UploadStatusEnum,
      default: UploadStatusEnum.PENDING,
    },
    transcodingStatus: {
      type: String,
      enum: TranscodingStatusEnum,
      default: TranscodingStatusEnum.PENDING,
    },
    hlsurl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Create the model
export const File = model<IFile>("File", fileSchema);
