import { Request, Response, NextFunction } from "express";

// Middleware to check API key
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"] as string;

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
