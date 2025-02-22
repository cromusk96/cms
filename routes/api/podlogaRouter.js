import express from "express";
import podlogaController from "../../controllers/podlogaController.js";
const router = express.Router();

router
  .route("/podloga")
  .get(podlogaController.getAll)
  .post(podlogaController.update)
  .put(podlogaController.update);

router
  .route("/podloga/:uid")
  .delete(podlogaController.markDeleted);

export default router;