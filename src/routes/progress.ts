import express from "express";
import { transcodingProgress } from "../controllers/progress";

const router = express.Router();

router.get("/:filename", transcodingProgress);

export default router;
