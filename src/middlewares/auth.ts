import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface UserPayload {
  userId: string;
  exp: number;
  iat: number;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const protectedRoute = (req: Request, res: Response, next: NextFunction): void => {
  const { token } = req.cookies;

  if (!token) {
    res.status(401).json({
      message: "Not authorized",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY!) as UserPayload;
    req.currentUser = payload;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};
