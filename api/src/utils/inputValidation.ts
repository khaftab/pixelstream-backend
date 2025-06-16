const Joi = require("joi");

export const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const signinSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const addFileSchema = Joi.object({
  fileName: Joi.string().required(),
  size: Joi.number().required(),
  type: Joi.string().required(),
});

// export const updateUserSchema = Joi.object({
//   username: Joi.string().alphanum().min(3).max(30),
//   fullname: Joi.string(),
//   picture: Joi.string(),
//   message: Joi.string().min(20),
// });
