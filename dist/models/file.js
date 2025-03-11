"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const mongoose_1 = require("mongoose");
const types_1 = require("../utils/types");
// Create the schema with TypeScript
const fileSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: types_1.UploadStatusEnum,
        default: types_1.UploadStatusEnum.PENDING,
    },
    transcodingStatus: {
        type: String,
        enum: types_1.TranscodingStatusEnum,
        default: types_1.TranscodingStatusEnum.PENDING,
    },
    hlsurl: {
        type: String,
        default: null,
    },
}, { timestamps: true });
// Create the model
exports.File = (0, mongoose_1.model)("File", fileSchema);
