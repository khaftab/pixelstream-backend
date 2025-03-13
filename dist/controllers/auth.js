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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = exports.me = exports.signout = exports.signin = exports.signup = void 0;
const password_1 = require("../services/password");
const user_1 = require("../services/user");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const inputValidation_1 = require("../utils/inputValidation");
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = inputValidation_1.signupSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                message: "Validation error",
                error: error.details[0].message,
            });
            return;
        }
        const { email, password } = value;
        const userExists = yield (0, user_1.userExist)(email);
        if (userExists) {
            res.status(400).json({
                message: "User already exists",
            });
            return;
        }
        const hashedpassword = yield (0, password_1.passwordEncrypt)(password);
        const user = yield (0, user_1.createUser)(email, hashedpassword);
        if (!user) {
            res.status(400).json({
                message: "User not created",
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.SECRET_KEY, {
            expiresIn: "7d",
        });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // Only send over HTTPS in production
            sameSite: "lax", // Protects against CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: "pixelstream.khaftab.me", // Set domain to your domain
        });
        res.status(200).json({ id: user._id, email: user.email, isAllowed: user.uploadCount > 0 });
    }
    catch (error) {
        console.error("Signup", error);
        res.send(error.message);
    }
});
exports.signup = signup;
const signin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = inputValidation_1.signinSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                message: "Validation error",
                error: error.details[0].message,
            });
            return; // return res.status will throw ts error. So use return; instead
        }
        const { email, password } = value;
        const user = yield (0, user_1.getUser)(email);
        if (!user) {
            res.status(400).json({
                message: "User not found",
            });
            return;
        }
        const isPasswordValid = yield (0, password_1.verifyPassword)(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({
                message: "Invalid email or password",
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.SECRET_KEY, {
            expiresIn: "7d",
        });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // Only send over HTTPS in production
            sameSite: "lax", // Protects against CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000,
            domain: "pixelstream.khaftab.me", // Set domain to your domain
        });
        res.status(200).json({ id: user._id, email: user.email, isAllowed: user.uploadCount > 0 });
    }
    catch (error) {
        console.error("Signin", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
});
exports.signin = signin;
const signout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("token");
        res.status(200).json({
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error("Logout", error);
        res.status(400).json({
            message: "Logout failed:" + error.message,
        });
    }
});
exports.signout = signout;
const me = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.userId;
    const user = yield (0, user_1.getUserById)(userId);
    if (!user) {
        res.status(404).json({
            message: "User not found",
        });
        return;
    }
    res.status(200).json({ id: user._id, email: user.email, isAllowed: user.uploadCount > 0 });
});
exports.me = me;
const getFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.currentUser) === null || _a === void 0 ? void 0 : _a.userId;
    const sortBy = req.query.sortBy;
    const page = req.query.page;
    const pageNo = parseInt(page) ? parseInt(page) : 1;
    console.log("Sort by", sortBy);
    // short form of acsending and descending is asc and desc
    console.log("Getting files for user", userId);
    try {
        const { totalPages, files, totalFiles } = yield (0, user_1.getFilesByUserId)(userId, sortBy === "asc" ? 1 : -1, pageNo);
        res.status(200).json({ files, totalPages, totalFiles });
    }
    catch (error) {
        console.log("Error getting files", error);
        res.status(500).json({ message: "Error getting files" });
    }
});
exports.getFiles = getFiles;
