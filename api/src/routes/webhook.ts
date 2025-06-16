import express from "express";
import { updateTranscodeStatus } from "../controllers/webhook";
import { apiKeyAuth } from "../middlewares/apiKey";

const router = express.Router();

router.post("/update", apiKeyAuth, updateTranscodeStatus);

export default router;
