import express from "express";
const router = express.Router();
import natpisiController from "../../controllers/natpisiController.js";

router
  .route("/natpisi")
  .get(natpisiController.getAllNatpisi)
  .post(natpisiController.insertNatpis)
  .put(natpisiController.insertNatpis);

router
  .route("/natpis/:uid")
  .delete(natpisiController.deleteNatpis);

export default router;
