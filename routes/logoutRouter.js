import express from "express";
const router = express.Router();
import logoutController from "../authentication/logoutController.js";

router.all("/", logoutController.handleLogout);

export default router;