import { Request, Response } from "express";
import { File } from "../models/file";
import { TranscodingStatusEnum } from "../utils/types";

export const updateTranscodeStatus = async (req: Request, res: Response) => {
  const { s3Key, status } = req.body;
  // uploads/67a4f6e5bdef4311cd551f88/video_466dc1e1.mp4
  const file = await File.findOne({ s3Key: s3Key });

  if (!file) {
    res.status(404).json({ message: "File not found" });
    return;
  }
  if (status === "success") {
    file.transcodingStatus = TranscodingStatusEnum.DONE;
    file.hlsurl = `${s3Key.split(".")[0]}/master.m3u8`;
  } else {
    file.transcodingStatus = TranscodingStatusEnum.FAILED;
  }
  try {
    await file.save();
  } catch (error) {
    console.log("Error updating webhook file database", error);
  }
  res.status(200).json({ message: "Transcode status" });
};
