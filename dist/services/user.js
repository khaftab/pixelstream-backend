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
exports.getFilesByUserId = exports.isAllowedToUpload = exports.userExist = exports.getUserById = exports.getUser = exports.createUser = void 0;
const user_1 = require("../models/user");
const file_1 = require("../models/file");
const types_1 = require("../utils/types");
const createUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = new user_1.User({ email, password });
        yield user.save();
        return user;
    }
    catch (error) {
        console.error("Error creating user", error);
    }
});
exports.createUser = createUser;
const getUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.User.findById(userId, { password: 0, files: 0 });
        if (user)
            return user;
        return null;
    }
    catch (error) {
        console.error("Error getting user", error);
    }
});
exports.getUserById = getUserById;
const getUser = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.User.findOne({ email });
        if (user)
            return user;
        return null;
    }
    catch (error) {
        console.error("Error getting user", error);
    }
});
exports.getUser = getUser;
const userExist = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userExist = yield user_1.User.findOne({ email });
        return !!userExist;
    }
    catch (error) {
        console.error("Error checking if user exists", error);
    }
});
exports.userExist = userExist;
const isAllowedToUpload = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.User.findById(userId);
        if (!user) {
            return false;
        }
        return user.uploadCount > 0;
    }
    catch (error) {
        console.error("Error checking if user is allowed to upload", error);
    }
});
exports.isAllowedToUpload = isAllowedToUpload;
const getFilesByUserId = (userId, sort, pageNo) => __awaiter(void 0, void 0, void 0, function* () {
    const LIMIT = 4;
    const skip = (pageNo - 1) * LIMIT;
    const totalFiles = yield file_1.File.countDocuments({
        user: userId,
        transcodingStatus: types_1.TranscodingStatusEnum.PENDING,
    });
    const totalPages = Math.ceil(totalFiles / LIMIT);
    const files = yield file_1.File.find({
        user: userId,
        transcodingStatus: types_1.TranscodingStatusEnum.PENDING,
    })
        .sort({ updatedAt: sort }) // ascending
        .skip(skip)
        .limit(LIMIT);
    // -1 for descending (Latest to oldest)
    // 1 for ascending (Oldest to latest)
    return {
        totalPages,
        files: files.map((file) => ({
            id: file._id,
            updatedAt: file.updatedAt,
            fileSize: file.fileSize,
            duration: file.duration,
            hlsurl: file.hlsurl,
            originalFileName: file.originalFileName,
            safeFileName: file.safeFileName,
        })),
        totalFiles,
    };
});
exports.getFilesByUserId = getFilesByUserId;
