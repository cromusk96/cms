import express from "express";
const router = express.Router();
import periodiController from "../../controllers/periodiController.js";

router
  .route("/periodi")
  .get(periodiController.getPeriodi)
  .post(periodiController.savePeriod)
  .put(periodiController.savePeriod);

router.route("/period/:uid").delete(periodiController.deletePeriod);

export default router;
