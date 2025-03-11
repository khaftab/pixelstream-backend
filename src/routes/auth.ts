import express from "express";
import { signin, signout, signup, me, getFiles } from "../controllers/auth";
import { protectedRoute } from "../middlewares/auth";

const router = express.Router();

router.get("/me", protectedRoute, me);
router.post("/signin", signin);
router.post("/signup", signup);
router.get("/signout", signout);
router.get("/files", protectedRoute, getFiles);

export default router;
