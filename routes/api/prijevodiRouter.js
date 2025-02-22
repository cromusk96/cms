import express from "express";
const router = express.Router();
import prijevodiController from "../../controllers/prijevodiController.js";

router
  .route("/translations")
  .get(prijevodiController.getAllTranslations)
  .post(prijevodiController.insertTranslation)
  .put(prijevodiController.insertTranslation);

router
  .route("/translation/:uid")
  .delete(prijevodiController.deleteTranslation);

export default router;
