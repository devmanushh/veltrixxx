import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service.js";
import { sendError } from "../lib/http.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await registerUser(email, password);

    res.status(201).json(result);
  } catch (err) {
    sendError(res, err, "Registration failed", 400);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.json(result);
  } catch (err) {
    sendError(res, err, "Login failed", 401);
  }
};
