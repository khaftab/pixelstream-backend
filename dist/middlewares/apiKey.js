"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = void 0;
// Middleware to check API key
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
        res.status(401).json({
            message: "API key required",
        });
        return;
    }
    if (apiKey !== process.env.WEBHOOK_API_KEY) {
        res.status(403).json({
            message: "Invalid API key",
        });
        return;
    }
    next();
};
exports.apiKeyAuth = apiKeyAuth;
