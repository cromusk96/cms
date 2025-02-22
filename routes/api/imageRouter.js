import express from "express";
import fileUpload from "express-fileupload";
import imageController from "../../controllers/imageController.js";
const router = express.Router();

router
  .route("/image")
  .post(fileUpload({ createParentPath: true }), imageController.recieveImage)
  .put(fileUpload({ createParentPath: true }), imageController.recieveImage);

router.route("/ikonice").get(imageController.sendIconsList);

export default router;
