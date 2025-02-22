import express from "express";
const router = express.Router();
import authController from "../authentication/authController.js";

router.post("/", authController.handleLogin);

export default router;