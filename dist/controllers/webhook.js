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
exports.updateTranscodeStatus = void 0;
const file_1 = require("../models/file");
const types_1 = require("../utils/types");
const updateTranscodeStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { s3Key, status } = req.body;
    // uploads/67a4f6e5bdef4311cd551f88/video_466dc1e1.mp4
    const file = yield file_1.File.findOne({ s3Key: s3Key });
    if (!file) {
        res.status(404).json({ message: "File not found" });
        return;
    }
    if (status === "success") {
        file.transcodingStatus = types_1.TranscodingStatusEnum.DONE;
        file.hlsurl = `${s3Key.split(".")[0]}/master.m3u8`;
    }
    else {
        file.transcodingStatus = types_1.TranscodingStatusEnum.FAILED;
    }
    try {
        yield file.save();
    }
    catch (error) {
        console.log("Error updating webhook file database", error);
    }
    res.status(200).json({ message: "Transcode status" });
});
exports.updateTranscodeStatus = updateTranscodeStatus;
