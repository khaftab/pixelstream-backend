import bcrypt from "bcrypt";
const saltRounds = 10;

const passwordEncrypt = async (password: string) => {
  try {
    const hashedpassword = await bcrypt.hash(password, saltRounds);
    return hashedpassword;
  } catch (error) {
    console.error("Error hashing the password", error);
  }
};

const verifyPassword = async (password: string, hashedPassword: string) => {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    console.error("Error verifying the password", error);
  }
};

export { passwordEncrypt, verifyPassword };
