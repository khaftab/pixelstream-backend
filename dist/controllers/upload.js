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
exports.confirmUpload = exports.presignedUrl = void 0;
const aws_1 = require("../services/aws");
const file_1 = require("../services/file");
const types_1 = require("../utils/types");
const file_2 = require("../models/file");
const aws_2 = require("../services/aws");
const client_s3_1 = require("@aws-sdk/client-s3");
const user_1 = require("../services/user");
const generateSafeFileName_1 = require("../utils/generateSafeFileName");
const user_2 = require("../models/user");
const presignedUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { fileName, fileType, duration } = req.body;
    if ((yield (0, user_1.isAllowedToUpload)(req.currentUser.userId)) === false) {
        res.status(400).json({
            message: "You are not allowed to add files. Please contact admin",
        });
        return;
    }
    const safeFileName = (0, generateSafeFileName_1.generateSafeFileName)(fileName);
    const s3Key = `uploads/${(_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.userId}/${safeFileName}`;
    // Create DB record first
    const uploadRecord = yield (0, file_1.createUpload)({
        userId: req.currentUser.userId,
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
    const presignedUrl = yield (0, aws_1.generatePresignedUrl)(s3Key);
    res
        .status(200)
        .json({ url: presignedUrl.url, fields: presignedUrl.fields, uploadId: uploadRecord._id });
});
exports.presignedUrl = presignedUrl;
const confirmUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Confirming upload...");
    try {
        const { uploadId } = req.params;
        // 1. Find the upload record
        const upload = yield file_2.File.findOne({
            _id: uploadId,
            user: req.currentUser.userId,
            uploadStatus: types_1.UploadStatusEnum.PENDING,
        });
        // decrease the upload count
        const user = yield user_2.User.findById(req.currentUser.userId);
        if (user) {
            user.uploadCount -= 1;
            yield user.save();
        }
        if (!upload) {
            res.status(404).json({
                message: "Upload record not found or already processed",
            });
            return;
        }
        // console.log("Upload found:", upload);
        // 2. Verify the S3 object exists
        const headCommand = new client_s3_1.HeadObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: upload.s3Key,
        });
        const s3Metadata = yield aws_2.s3Client.send(headCommand);
        // 3. Update database record
        const updatedUpload = yield file_2.File.findByIdAndUpdate(uploadId, {
            $set: {
                uploadStatus: types_1.UploadStatusEnum.COMPLETED,
                fileSize: s3Metadata.ContentLength,
            },
        }, { new: true });
        // 4. Optional: Add additional processing here
        // (e.g., trigger video encoding, send notifications, etc.)
        res.status(201).json({
            // message: "Upload confirmed successfully",
            // upload: updatedUpload,
            safeFileName: updatedUpload === null || updatedUpload === void 0 ? void 0 : updatedUpload.safeFileName.split(".")[0],
        });
    }
    catch (error) {
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
});
exports.confirmUpload = confirmUpload;
