"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadStatusEnum = exports.TranscodingStatusEnum = void 0;
var TranscodingStatusEnum;
(function (TranscodingStatusEnum) {
    TranscodingStatusEnum["PENDING"] = "pending";
    TranscodingStatusEnum["QUEUED"] = "queued";
    TranscodingStatusEnum["TRANSCODING"] = "transcoding";
    TranscodingStatusEnum["DONE"] = "done";
    TranscodingStatusEnum["FAILED"] = "failed";
})(TranscodingStatusEnum || (exports.TranscodingStatusEnum = TranscodingStatusEnum = {}));
var UploadStatusEnum;
(function (UploadStatusEnum) {
    UploadStatusEnum["PENDING"] = "pending";
    UploadStatusEnum["COMPLETED"] = "completed";
    UploadStatusEnum["FAILED"] = "failed";
})(UploadStatusEnum || (exports.UploadStatusEnum = UploadStatusEnum = {}));
