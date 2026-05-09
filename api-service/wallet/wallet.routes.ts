import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getWallet } from "./wallet.controller.js";

const router = Router();

router.get("/", authMiddleware, getWallet);

export default router;
