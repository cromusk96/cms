import express from "express";
const router = express.Router();
import refreshController from "../authentication/refreshController.js";

router.all("/", refreshController.handleRefreshToken);

export default router;