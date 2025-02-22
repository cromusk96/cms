import express from "express";
const router = express.Router();
import integracijeController from "../../controllers/integracijeController.js";

router
  .route("/integracije")
  .get(integracijeController.getAll)
  .post(integracijeController.update)
  .put(integracijeController.update);

router.route("/integracije/:uid").delete(integracijeController.markDeleted);

export default router;
