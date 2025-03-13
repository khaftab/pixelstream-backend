import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { checkEnvVariables } from "./utils/checkEnvVariables";
import { Request, Response } from "express";
import setRoutes from "./routes/routes";
require("dotenv").config();

const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: [process.env.ORIGINS!],
  })
);
console.log("origins", process.env.ORIGINS);

app.use(cookieParser());
setRoutes(app);

checkEnvVariables(["MONGO_URI"]);

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

app.get("/", (req: Request, res: Response) => {
  res.send(`Hello World ${process.env.NODE_ENV}`);
});

app.all("*", (req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
  });
});
