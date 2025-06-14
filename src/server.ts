import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { checkEnvVariables } from "./utils/checkEnvVariables";
import { Request, Response } from "express";
import setRoutes from "./routes/routes";
require("dotenv").config();

const app = express();
const ORIGINS = process.env.ORIGINS?.split(",") || [];
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: ORIGINS,
  })
);

app.use(cookieParser());
setRoutes(app);

checkEnvVariables([
  "MONGO_URI",
  "SECRET_KEY",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_S3_BUCKET",
  "WEBHOOK_API_KEY",
  "UPSTASH_REDIS_URL",
  "UPSTASH_REDIS_TOKEN",
  "ORIGIN",
]);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("Connected to MongoDB");
    const port = process.env.PORT || 3002;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.all("*", (req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
  });
});
