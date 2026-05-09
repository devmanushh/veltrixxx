import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await registerUser(email, password);

    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message || "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ error: err.message || "Login failed" });
  }
};
