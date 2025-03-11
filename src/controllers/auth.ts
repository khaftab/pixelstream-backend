import { passwordEncrypt, verifyPassword } from "../services/password";
import { createUser, getUser, getUserById, userExist, getFilesByUserId } from "../services/user";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { signupSchema, signinSchema } from "../utils/inputValidation";

const signup = async (req: Request, res: Response) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
      return;
    }
    const { email, password } = value;
    const userExists = await userExist(email);
    if (userExists) {
      res.status(400).json({
        message: "User already exists",
      });
      return;
    }
    const hashedpassword = await passwordEncrypt(password);
    const user = await createUser(email, hashedpassword!);
    if (!user) {
      res.status(400).json({
        message: "User not created",
      });
      return;
    }
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY!, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Only send over HTTPS in production
      sameSite: "lax", // Protects against CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ id: user._id, email: user.email, isAllowed: user.uploadCount > 0 });
  } catch (error: any) {
    console.error("Signup", error);
    res.send(error.message);
  }
};

const signin = async (req: Request, res: Response) => {
  try {
    const { error, value } = signinSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
      return; // return res.status will throw ts error. So use return; instead
    }

    const { email, password } = value;
    const user = await getUser(email);

    if (!user) {
      res.status(400).json({
        message: "User not found",
      });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY!, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Only send over HTTPS in production
      sameSite: "lax", // Protects against CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ id: user._id, email: user.email, isAllowed: user.uploadCount > 0 });
  } catch (error: any) {
    console.error("Signin", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
const signout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout", error);
    res.status(400).json({
      message: "Logout failed:" + error.message,
    });
  }
};

const me = async (req: Request, res: Response) => {
  const userId = req.currentUser?.userId as string;

  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({
      message: "User not found",
    });
    return;
  }
  res.status(200).json({ id: user._id, email: user.email, isAllowed: user.uploadCount > 0 });
};

const getFiles = async (req: Request, res: Response) => {
  const userId = req.currentUser?.userId as string;
  const sortBy = req.query.sortBy as string;
  const page = req.query.page as string;
  const pageNo = parseInt(page) ? parseInt(page) : 1;
  console.log("Sort by", sortBy);
  // short form of acsending and descending is asc and desc

  console.log("Getting files for user", userId);
  try {
    const { totalPages, files, totalFiles } = await getFilesByUserId(
      userId,
      sortBy === "asc" ? 1 : -1,
      pageNo
    );
    res.status(200).json({ files, totalPages, totalFiles });
  } catch (error) {
    console.log("Error getting files", error);
    res.status(500).json({ message: "Error getting files" });
  }
};

export { signup, signin, signout, me, getFiles };
