import express from "express";
import grupeTockiController from "../../controllers/grupeTockiController.js";
const router = express.Router();

router
  .route("/grupeTocki")
  .get(grupeTockiController.getAll)
  .post(grupeTockiController.update)
  .put(grupeTockiController.update);

router
  .route("/grupeTocki/:uid")
  .delete(grupeTockiController.markDeleted);

export default router;