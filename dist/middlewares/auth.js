"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedRoute = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protectedRoute = (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        res.status(401).json({
            message: "Not authorized",
        });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        req.currentUser = payload;
        next();
    }
    catch (error) {
        res.status(401).json({
            message: "Invalid token",
        });
    }
};
exports.protectedRoute = protectedRoute;
