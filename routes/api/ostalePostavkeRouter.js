import express from "express";
const router = express.Router();
import ostalePostavkeController from "../../controllers/ostalePostavkeController.js";

router
  .route("/ostalePostavke")
  .get(ostalePostavkeController.getOne)
  .post(ostalePostavkeController.insert)
  .put(ostalePostavkeController.insert);

export default router;
