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
exports.createUpload = void 0;
const file_1 = require("../models/file");
const types_1 = require("../utils/types");
const createUpload = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, originalFileName, safeFileName, s3Key, fileSize, fileType, duration, }) {
    try {
        const file = new file_1.File({
            user: userId,
            originalFileName,
            safeFileName,
            s3Key,
            fileType,
            fileSize,
            duration,
            uploadStatus: types_1.UploadStatusEnum.PENDING,
            trancodingStatus: types_1.TranscodingStatusEnum.PENDING,
        });
        yield file.save();
        return file;
    }
    catch (error) {
        console.error("Error updating file database", error);
    }
});
exports.createUpload = createUpload;
