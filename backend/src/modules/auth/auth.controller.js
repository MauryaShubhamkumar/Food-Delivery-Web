import { loginUserService, registerUserService } from './auth.service.js';

export const loginUser = async (req, res, next) => {
  try {
    const result = await loginUserService(req.body);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const result = await registerUserService(req.body);
    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};
