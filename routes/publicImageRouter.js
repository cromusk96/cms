import express from "express";
const router = express.Router();
import imageController from "../controllers/imageController.js";

router.route("/images").get(imageController.sendSmallerImage);

export default router;
