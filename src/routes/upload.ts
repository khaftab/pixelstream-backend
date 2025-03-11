import express from "express";
import { presignedUrl, confirmUpload } from "../controllers/upload";
import { protectedRoute } from "../middlewares/auth";

const router = express.Router();

router.post("/url", protectedRoute, presignedUrl);
router.patch("/confirm/:uploadId", protectedRoute, confirmUpload);

export default router;
