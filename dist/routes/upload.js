"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_1 = require("../controllers/upload");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post("/url", auth_1.protectedRoute, upload_1.presignedUrl);
router.patch("/confirm/:uploadId", auth_1.protectedRoute, upload_1.confirmUpload);
exports.default = router;
