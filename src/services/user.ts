import { User } from "../models/user";
import { File } from "../models/file";
import { TranscodingStatusEnum } from "../utils/types";
import { SortOrder } from "mongoose";

const createUser = async (email: string, password: string) => {
  try {
    const user = new User({ email, password });
    await user.save();
    return user;
  } catch (error) {
    console.error("Error creating user", error);
  }
};

const getUserById = async (userId: string) => {
  try {
    const user = await User.findById(userId, { password: 0, files: 0 });
    if (user) return user;
    return null;
  } catch (error) {
    console.error("Error getting user", error);
  }
};

const getUser = async (email: string) => {
  try {
    const user = await User.findOne({ email });
    if (user) return user;
    return null;
  } catch (error) {
    console.error("Error getting user", error);
  }
};

const userExist = async (email: string) => {
  try {
    const userExist = await User.findOne({ email });
    return !!userExist;
  } catch (error) {
    console.error("Error checking if user exists", error);
  }
};

const isAllowedToUpload = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    return user.uploadCount > 0;
  } catch (error) {
    console.error("Error checking if user is allowed to upload", error);
  }
};

const getFilesByUserId = async (userId: string, sort: SortOrder, pageNo: number) => {
  const LIMIT = 4;
  const skip = (pageNo - 1) * LIMIT;
  const totalFiles = await File.countDocuments({
    user: userId,
    transcodingStatus: TranscodingStatusEnum.PENDING,
  });
  const totalPages = Math.ceil(totalFiles / LIMIT);
  const files = await File.find({
    user: userId,
    transcodingStatus: TranscodingStatusEnum.PENDING,
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
};

export { createUser, getUser, getUserById, userExist, isAllowedToUpload, getFilesByUserId };
