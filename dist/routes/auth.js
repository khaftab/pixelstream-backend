"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middlewares/auth");
const router = express_1.default.Router();
router.get("/me", auth_2.protectedRoute, auth_1.me);
router.post("/signin", auth_1.signin);
router.post("/signup", auth_1.signup);
router.get("/signout", auth_1.signout);
router.get("/files", auth_2.protectedRoute, auth_1.getFiles);
exports.default = router;
